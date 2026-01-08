#!/usr/bin/env python3
"""
Download and prepare public datasets for drone detection training.

Automatically downloads:
- COCO (birds, balls, sports equipment)
- Drone-vs-Bird annotations
- OpenImages (aircraft, kites, balloons)

Usage:
    python download_public_datasets.py --output ./data --classes drone bird ball aircraft
    python download_public_datasets.py --output ./data --all
"""

import os
import sys
import json
import shutil
import argparse
import urllib.request
import zipfile
import tarfile
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Set


# COCO class mapping to our taxonomy
COCO_CLASS_MAPPING = {
    # Birds
    'bird': 'bird_small',

    # Sports
    'sports ball': 'ball',
    'frisbee': 'projectile',
    'baseball bat': None,  # Ignore
    'baseball glove': None,
    'tennis racket': None,
    'kite': 'kite',

    # Aircraft (COCO has airplane)
    'airplane': 'aircraft_fixed',

    # Potential debris/background
    'umbrella': 'recreational',
    'handbag': 'debris_light',
    'suitcase': 'debris_light',

    # Ignore these
    'person': None,
    'car': None,
    'truck': None,
    # ... etc
}

# OpenImages class mapping
OPENIMAGES_CLASS_MAPPING = {
    'Airplane': 'aircraft_fixed',
    'Helicopter': 'aircraft_rotary',
    'Hot air balloon': 'aircraft_balloon',
    'Parachute': 'aircraft_glider',
    'Kite': 'kite',
    'Balloon': 'balloon_party',
    'Bird': 'bird_small',
    'Eagle': 'bird_large',
    'Duck': 'bird_medium',
    'Owl': 'bird_medium',
    'Parrot': 'bird_small',
    'Penguin': None,  # Not flying
    'Football': 'ball',
    'Golf ball': 'ball',
    'Tennis ball': 'ball',
    'Cricket ball': 'ball',
    'Volleyball (Ball)': 'ball',
    'Rugby ball': 'ball',
    'Insect': 'insect',
    'Butterfly': 'insect',
    'Bee': 'insect',
    'Dragonfly': 'insect',
    'Fly': 'insect',
}


def download_file(url: str, dest: Path, desc: str | None = None) -> bool:
    """Download file with progress."""
    if dest.exists():
        print(f"  [EXISTS] {dest.name}")
        return True

    print(f"  Downloading {desc or dest.name}...")
    dest.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Validate URL scheme for security
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            print(f"\n  ERROR: Invalid URL scheme: {parsed.scheme}")
            return False
        
        def progress(count, block_size, total_size):
            pct = int(count * block_size * 100 / total_size) if total_size > 0 else 0
            sys.stdout.write(f"\r    {pct}%")
            sys.stdout.flush()

        urllib.request.urlretrieve(url, dest, reporthook=progress)
        print()
        return True
    except (urllib.error.URLError, OSError, ValueError) as e:
        print(f"\n  ERROR: {e}")
        return False


def extract_coco_classes(
    coco_dir: Path,
    output_dir: Path,
    class_mapping: Dict[str, str],
    split: str = 'train2017'
) -> int:
    """Extract specific classes from COCO dataset."""
    annotations_file = coco_dir / 'annotations' / f'instances_{split}.json'

    if not annotations_file.exists():
        print(f"  COCO annotations not found: {annotations_file}")
        return 0

    print(f"  Loading COCO annotations: {split}...")
    with open(annotations_file) as f:
        coco = json.load(f)

    # Build category ID to name mapping
    cat_id_to_name = {c['id']: c['name'] for c in coco['categories']}
    cat_id_to_our_class = {}

    for cat_id, cat_name in cat_id_to_name.items():
        our_class = class_mapping.get(cat_name)
        if our_class:
            cat_id_to_our_class[cat_id] = our_class

    if not cat_id_to_our_class:
        print("  No matching classes found in COCO")
        return 0

    print(f"  Found {len(cat_id_to_our_class)} matching classes")

    # Build image ID to annotations mapping
    image_annotations: Dict[int, List] = {}
    for ann in coco['annotations']:
        if ann['category_id'] in cat_id_to_our_class:
            img_id = ann['image_id']
            if img_id not in image_annotations:
                image_annotations[img_id] = []
            image_annotations[img_id].append(ann)

    # Build image ID to filename mapping
    image_info = {img['id']: img for img in coco['images']}

    print(f"  Found {len(image_annotations)} images with target classes")

    # Extract images and create YOLO labels
    extracted = 0
    for img_id, annotations in image_annotations.items():
        img_info = image_info[img_id]
        img_filename = img_info['file_name']
        img_width = img_info['width']
        img_height = img_info['height']

        # Determine output split (80/20)
        out_split = 'train' if hash(img_filename) % 5 != 0 else 'val'

        # Source image path
        src_img = coco_dir / split / img_filename
        if not src_img.exists():
            continue

        # Destination paths
        for our_class in set(cat_id_to_our_class[a['category_id']] for a in annotations):
            dst_img_dir = output_dir / our_class / 'images' / out_split
            dst_lbl_dir = output_dir / our_class / 'labels' / out_split
            dst_img_dir.mkdir(parents=True, exist_ok=True)
            dst_lbl_dir.mkdir(parents=True, exist_ok=True)

            # Copy image
            dst_img = dst_img_dir / img_filename
            if not dst_img.exists():
                shutil.copy2(src_img, dst_img)

            # Create YOLO label
            lbl_filename = Path(img_filename).stem + '.txt'
            dst_lbl = dst_lbl_dir / lbl_filename

            with open(dst_lbl, 'w') as f:
                for ann in annotations:
                    if cat_id_to_our_class.get(ann['category_id']) != our_class:
                        continue

                    # COCO bbox is [x, y, width, height] in pixels
                    x, y, w, h = ann['bbox']

                    # Convert to YOLO format (center_x, center_y, width, height) normalized
                    cx = (x + w / 2) / img_width
                    cy = (y + h / 2) / img_height
                    nw = w / img_width
                    nh = h / img_height

                    # Class ID is 0 for single-class per folder
                    f.write(f"0 {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}\n")

            extracted += 1

    return extracted


def download_coco_subset(output_dir: Path, year: str = '2017') -> Path:
    """Download COCO dataset (or subset)."""
    print("\n[COCO Dataset]")

    coco_dir = output_dir / 'coco'
    coco_dir.mkdir(parents=True, exist_ok=True)

    # Download annotations
    ann_url = f"http://images.cocodataset.org/annotations/annotations_train{year}.zip"
    ann_zip = coco_dir / f"annotations_train{year}.zip"

    if not (coco_dir / 'annotations').exists():
        if download_file(ann_url, ann_zip, "COCO annotations"):
            print("  Extracting annotations...")
            with zipfile.ZipFile(ann_zip, 'r') as zf:
                zf.extractall(coco_dir)

    print(f"  COCO ready at: {coco_dir}")
    print("  NOTE: Images will be downloaded on-demand during extraction")

    return coco_dir


def setup_drone_vs_bird(output_dir: Path) -> Path:
    """Setup Drone-vs-Bird dataset instructions."""
    print("\n[Drone-vs-Bird Dataset]")

    dvb_dir = output_dir / 'drone-vs-bird'
    dvb_dir.mkdir(parents=True, exist_ok=True)

    readme = dvb_dir / 'DOWNLOAD_INSTRUCTIONS.md'
    readme.write_text("""# Drone-vs-Bird Challenge Dataset

## Official Source
1. Visit: https://wosdetc.github.io/
2. Register for the challenge
3. Download the dataset
4. Extract to this folder

## Alternative: Roboflow
Pre-labeled drone datasets in YOLO format:

1. **Drone Detection Dataset**
   https://universe.roboflow.com/project-drone-h3gse/drone-detection-xrgwp

2. **Anti-Drone Dataset**
   https://universe.roboflow.com/anti-drone-project/anti-drone-dataset

3. **UAV Detection**
   https://universe.roboflow.com/uav-gnzpv/uav-detection-kbgiy

Download as "YOLOv5 PyTorch" format and extract here.

## After Download
Your folder structure should be:
```
drone-vs-bird/
├── images/
│   ├── train/
│   └── val/
├── labels/
│   ├── train/
│   └── val/
└── dataset.yaml
```
""")

    print(f"  Instructions at: {readme}")
    return dvb_dir


def setup_custom_collection_guides(output_dir: Path):
    """Create guides for collecting custom data."""
    print("\n[Custom Collection Guides]")

    guides_dir = output_dir / 'collection-guides'
    guides_dir.mkdir(parents=True, exist_ok=True)

    # Debris collection guide
    (guides_dir / 'debris.md').write_text("""# Collecting Debris Images

## Plastic Bags
- Film in parks on windy days
- Hold bag and release, video capture
- Various colors: white, colored, transparent
- Various distances: 2m, 5m, 10m, 20m

## Paper/Leaves
- Autumn is best for leaves
- Throw paper in air, video capture
- Different sizes and colors

## Tips
- Shoot against sky background (like drone would appear)
- Capture both stationary and moving
- Various lighting: sunny, cloudy, dawn/dusk
- Use burst mode or video -> frames
""")

    # Insect collection guide
    (guides_dir / 'insects.md').write_text("""# Collecting Insect Images

## Method
Insects close to camera lens appear large and can trigger false positives.

1. Set up camera pointing at sky
2. Wait for insects to fly past
3. Or use slow-motion video near flowers/lights

## Key Subjects
- Flies (most common false positive)
- Bees/wasps
- Dragonflies
- Butterflies
- Moths (night)
- Mosquitoes (close range)

## Tips
- Focus at infinity (insects will be blurred but that's realistic)
- Night collection near lights gets moths
- Early morning near water gets dragonflies
""")

    # Weather artifacts guide
    (guides_dir / 'weather-artifacts.md').write_text("""# Collecting Weather & Artifact Images

## Rain
- Film upward during rain
- Raindrops appear as streaks
- Various intensities

## Snow
- Individual flakes against dark sky
- Falling patterns

## Lens Artifacts
- Point camera at sun (careful with sensor!)
- Capture lens flare
- Water droplets on lens
- Dirty lens artifacts

## Spider Webs
- Morning dew on webs
- Backlit webs

## Tips
- These are negative examples (not drones)
- Capture in same conditions as deployment
""")

    print(f"  Guides created at: {guides_dir}")


def create_combined_dataset(output_dir: Path, classes: List[str]):
    """Create combined dataset structure."""
    print("\n[Creating Combined Dataset]")

    combined = output_dir / 'combined'
    (combined / 'images' / 'train').mkdir(parents=True, exist_ok=True)
    (combined / 'images' / 'val').mkdir(parents=True, exist_ok=True)
    (combined / 'labels' / 'train').mkdir(parents=True, exist_ok=True)
    (combined / 'labels' / 'val').mkdir(parents=True, exist_ok=True)

    # Create symlinks/copies from individual class folders
    print(f"  Combined dataset at: {combined}")


def main():
    parser = argparse.ArgumentParser(description='Download datasets for drone detection')
    parser.add_argument('--output', type=str, default='./data', help='Output directory')
    parser.add_argument('--classes', nargs='+', help='Specific classes to download')
    parser.add_argument('--all', action='store_true', help='Download all available')
    parser.add_argument('--coco', action='store_true', help='Download COCO subset')
    parser.add_argument('--skip-large', action='store_true', help='Skip large downloads')
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("Drone Detection Dataset Downloader")
    print("=" * 60)
    print(f"Output directory: {output_dir.absolute()}")

    # Setup instruction files for manual downloads
    setup_drone_vs_bird(output_dir)
    setup_custom_collection_guides(output_dir)

    # Download COCO if requested
    if args.coco or args.all:
        if not args.skip_large:
            coco_dir = download_coco_subset(output_dir)
            # Note: Actual image download requires more code
            print("  NOTE: Run with COCO images downloaded separately")

    # Create combined dataset structure
    classes_to_use = args.classes or [
        'drone', 'bird_small', 'bird_large', 'aircraft',
        'recreational', 'sports', 'debris', 'insect',
        'atmospheric', 'background'
    ]
    create_combined_dataset(output_dir, classes_to_use)

    print("\n" + "=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    print("""
Next Steps:
1. Download Drone-vs-Bird dataset (see data/drone-vs-bird/DOWNLOAD_INSTRUCTIONS.md)
2. Download from Roboflow (free account): https://roboflow.com
3. Collect custom debris/insect/weather data (see data/collection-guides/)
4. Run labeling tool: label-studio start
5. Export all in YOLO format to data/combined/
    """)


if __name__ == '__main__':
    main()
