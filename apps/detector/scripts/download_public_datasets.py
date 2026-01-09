#!/usr/bin/env python3
"""
Download and prepare public datasets for drone detection training.

This script downloads publicly available datasets that can be used for
training drone detection models. It handles:
- Roboflow API downloads (requires free account)
- Direct URL downloads (COCO, OpenImages subsets)
- Dataset format conversion to YOLO format

Usage:
    # Download all available datasets
    python download_public_datasets.py --output ./data --all

    # Download specific sources
    python download_public_datasets.py --output ./data --roboflow --coco-birds

    # With Roboflow API key
    ROBOFLOW_API_KEY=your_key python download_public_datasets.py --output ./data --roboflow

Requirements:
    pip install roboflow requests tqdm pyyaml pillow
"""

import argparse
import json
import os
import shutil
import sys
import zipfile
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urlparse
from urllib.request import urlretrieve

# Try importing optional dependencies
try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    print("Note: Install tqdm for progress bars: pip install tqdm")


# =============================================================================
# Roboflow Dataset Configurations
# =============================================================================
# These are free, public datasets on Roboflow Universe
# Get API key free at: https://roboflow.com

ROBOFLOW_DATASETS = {
    # Drone detection datasets
    'drone-detection': {
        'workspace': 'project-drone-h3gse',
        'project': 'drone-detection-xrgwp',
        'version': 1,
        'description': 'General drone detection dataset (~4000 images)',
    },
    'anti-drone': {
        'workspace': 'anti-drone-project',
        'project': 'anti-drone-dataset',
        'version': 1,
        'description': 'Anti-drone security dataset (~3000 images)',
    },
    'uav-detection': {
        'workspace': 'uav-gnzpv',
        'project': 'uav-detection-kbgiy',
        'version': 1,
        'description': 'UAV detection from various angles (~2500 images)',
    },
    'drone-vs-bird': {
        'workspace': 'birds-drones',
        'project': 'birds-and-drones',
        'version': 1,
        'description': 'Drone vs bird discrimination dataset',
    },
    # Bird datasets (for negative samples)
    'bird-detection': {
        'workspace': 'brad-dwyer',
        'project': 'bird-detection-yezao',
        'version': 1,
        'description': 'Bird detection for false positive reduction',
    },
}


# =============================================================================
# Direct Download URLs (no API key needed)
# =============================================================================

DIRECT_DOWNLOADS = {
    # COCO annotations (for extracting birds, airplanes, kites)
    'coco-annotations-2017': {
        'url': 'http://images.cocodataset.org/annotations/annotations_trainval2017.zip',
        'description': 'COCO 2017 annotations (241 MB)',
        'extract': True,
    },
    # VisDrone dataset sample
    'visdrone-sample': {
        'url': 'https://github.com/VisDrone/VisDrone-Dataset/releases/download/v1.0/VisDrone2019-DET-train.zip',
        'description': 'VisDrone 2019 detection train set (1.5 GB)',
        'extract': True,
    },
}


# =============================================================================
# Class Mappings
# =============================================================================

# Map source dataset classes to our taxonomy
CLASS_MAPPINGS = {
    'coco': {
        'bird': 'bird_small',
        'airplane': 'aircraft_fixed',
        'kite': 'kite',
        'sports ball': 'ball',
        'frisbee': 'projectile',
    },
    'visdrone': {
        'drone': 'drone',
        # VisDrone has other classes we don't need
    },
    'roboflow': {
        # Roboflow datasets usually have 'drone' class
        'drone': 'drone',
        'uav': 'drone',
        'quadcopter': 'drone',
        'bird': 'bird_small',
    }
}


# =============================================================================
# Download Utilities
# =============================================================================

def download_file(url: str, dest: Path, desc: str = None) -> bool:
    """Download file with progress indication."""
    if dest.exists():
        print(f"  [SKIP] {desc or dest.name} already exists")
        return True

    # Validate URL scheme
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        print(f"  [ERROR] Invalid URL scheme: {parsed.scheme}")
        return False

    print(f"  Downloading {desc or dest.name}...")
    dest.parent.mkdir(parents=True, exist_ok=True)

    try:
        if HAS_TQDM:
            # Download with progress bar
            import urllib.request

            class DownloadProgressBar(tqdm):
                def update_to(self, b=1, bsize=1, tsize=None):
                    if tsize is not None:
                        self.total = tsize
                    self.update(b * bsize - self.n)

            with DownloadProgressBar(unit='B', unit_scale=True, miniters=1, desc=desc) as t:
                urllib.request.urlretrieve(url, dest, reporthook=t.update_to)  # nosec B310
        else:
            # Simple download
            def progress(count, block_size, total_size):
                pct = int(count * block_size * 100 / total_size) if total_size > 0 else 0
                sys.stdout.write(f"\r  Progress: {pct}%")
                sys.stdout.flush()

            urlretrieve(url, dest, reporthook=progress)  # nosec B310
            print()

        return True

    except Exception as e:
        print(f"\n  [ERROR] Download failed: {e}")
        if dest.exists():
            dest.unlink()
        return False


def extract_archive(archive: Path, dest: Path) -> bool:
    """Extract zip archive safely."""
    print(f"  Extracting {archive.name}...")

    try:
        if archive.suffix == '.zip':
            with zipfile.ZipFile(archive, 'r') as zf:
                # Check for path traversal
                for name in zf.namelist():
                    if name.startswith('/') or '..' in name:
                        print(f"  [ERROR] Unsafe path in archive: {name}")
                        return False
                zf.extractall(dest)
        else:
            print(f"  [ERROR] Unknown archive format: {archive.suffix}")
            return False

        return True

    except Exception as e:
        print(f"  [ERROR] Extraction failed: {e}")
        return False


# =============================================================================
# Roboflow Downloads
# =============================================================================

def download_roboflow_dataset(
    name: str,
    config: Dict,
    output_dir: Path,
    api_key: Optional[str] = None
) -> Optional[Path]:
    """Download dataset from Roboflow."""
    print(f"\n[Roboflow] {name}: {config['description']}")

    if not api_key:
        api_key = os.environ.get('ROBOFLOW_API_KEY')

    if not api_key:
        print("  [SKIP] No Roboflow API key. Set ROBOFLOW_API_KEY or use --roboflow-key")
        print("  Get free key at: https://roboflow.com")
        print(f"  Manual download: https://universe.roboflow.com/{config['workspace']}/{config['project']}")
        return None

    try:
        from roboflow import Roboflow
    except ImportError:
        print("  [ERROR] roboflow not installed. Run: pip install roboflow")
        return None

    try:
        rf = Roboflow(api_key=api_key)
        project = rf.workspace(config['workspace']).project(config['project'])
        version = project.version(config['version'])

        # Download in YOLOv8 format
        dataset_dir = output_dir / 'roboflow' / name
        version.download('yolov8', location=str(dataset_dir))

        print(f"  Downloaded to: {dataset_dir}")
        return dataset_dir

    except Exception as e:
        print(f"  [ERROR] Roboflow download failed: {e}")
        return None


# =============================================================================
# COCO Dataset Processing
# =============================================================================

def extract_coco_classes(
    coco_dir: Path,
    output_dir: Path,
    target_classes: List[str],
    max_images: int = 5000
) -> int:
    """Extract specific classes from COCO annotations."""
    print(f"\n[COCO] Extracting classes: {target_classes}")

    ann_file = coco_dir / 'annotations' / 'instances_train2017.json'
    if not ann_file.exists():
        print(f"  [ERROR] Annotations not found: {ann_file}")
        return 0

    print("  Loading annotations...")
    with open(ann_file) as f:
        coco = json.load(f)

    # Build category mapping
    cat_name_to_id = {c['name']: c['id'] for c in coco['categories']}
    target_cat_ids = {cat_name_to_id[c] for c in target_classes if c in cat_name_to_id}

    if not target_cat_ids:
        print("  [ERROR] No matching categories found")
        return 0

    print(f"  Found categories: {[c for c in target_classes if c in cat_name_to_id]}")

    # Find images with target classes
    img_to_anns: Dict[int, List] = {}
    for ann in coco['annotations']:
        if ann['category_id'] in target_cat_ids:
            img_id = ann['image_id']
            if img_id not in img_to_anns:
                img_to_anns[img_id] = []
            img_to_anns[img_id].append(ann)

    print(f"  Found {len(img_to_anns)} images with target classes")

    # Limit images
    img_ids = list(img_to_anns.keys())[:max_images]

    # Create image ID to info mapping
    img_info = {img['id']: img for img in coco['images']}

    # Create output structure
    coco_out = output_dir / 'coco-extracted'
    (coco_out / 'images' / 'train').mkdir(parents=True, exist_ok=True)
    (coco_out / 'labels' / 'train').mkdir(parents=True, exist_ok=True)

    # Create download instructions
    readme = coco_out / 'DOWNLOAD_IMAGES.md'
    readme.write_text(f"""# COCO Image Download

The annotations have been extracted. To download the actual images:

## Option 1: Download all train2017 images (18GB)
```bash
wget http://images.cocodataset.org/zips/train2017.zip
unzip train2017.zip -d {coco_out}/images/
mv {coco_out}/images/train2017/* {coco_out}/images/train/
```

## Option 2: Download only needed images
Use the `download_coco_images.py` script (generated alongside this file)
to download only the {len(img_ids)} images with target classes.

## Required images
See `image_list.txt` for the list of required image filenames.
""")

    # Write image list
    image_list = coco_out / 'image_list.txt'
    with open(image_list, 'w') as f:
        for img_id in img_ids:
            info = img_info[img_id]
            f.write(f"{info['file_name']}\n")

    # Create YOLO format labels
    class_map = {cat_name_to_id[c]: i for i, c in enumerate(target_classes) if c in cat_name_to_id}

    labels_created = 0
    for img_id in img_ids:
        info = img_info[img_id]
        anns = img_to_anns[img_id]

        # Create label file
        label_file = coco_out / 'labels' / 'train' / (Path(info['file_name']).stem + '.txt')

        with open(label_file, 'w') as f:
            for ann in anns:
                if ann['category_id'] not in class_map:
                    continue

                # Convert COCO bbox [x,y,w,h] to YOLO [cx,cy,w,h] normalized
                x, y, w, h = ann['bbox']
                img_w, img_h = info['width'], info['height']

                cx = (x + w/2) / img_w
                cy = (y + h/2) / img_h
                nw = w / img_w
                nh = h / img_h

                class_id = class_map[ann['category_id']]
                f.write(f"{class_id} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}\n")

        labels_created += 1

    # Create dataset.yaml
    yaml_content = f"""# COCO extracted classes
path: {coco_out.absolute()}
train: images/train
val: images/train  # Use same for now, split manually

nc: {len(target_classes)}
names:
"""
    for i, cls in enumerate(target_classes):
        if cls in cat_name_to_id:
            yaml_content += f"  {i}: {CLASS_MAPPINGS['coco'].get(cls, cls)}\n"

    (coco_out / 'dataset.yaml').write_text(yaml_content)

    print(f"  Created {labels_created} label files")
    print(f"  Output: {coco_out}")
    print("  NOTE: Download images using instructions in DOWNLOAD_IMAGES.md")

    return labels_created


# =============================================================================
# Combined Dataset Creation
# =============================================================================

def create_combined_dataset(
    output_dir: Path,
    source_dirs: List[Path],
    class_names: List[str]
) -> Path:
    """Combine multiple source datasets into one."""
    print(f"\n[Combined] Creating combined dataset from {len(source_dirs)} sources")

    combined = output_dir / 'combined'
    (combined / 'images' / 'train').mkdir(parents=True, exist_ok=True)
    (combined / 'images' / 'val').mkdir(parents=True, exist_ok=True)
    (combined / 'labels' / 'train').mkdir(parents=True, exist_ok=True)
    (combined / 'labels' / 'val').mkdir(parents=True, exist_ok=True)

    # Copy and rename files from each source
    total_images = 0
    for source in source_dirs:
        if not source.exists():
            continue

        source_name = source.name
        print(f"  Processing: {source_name}")

        for split in ['train', 'val']:
            img_dir = source / 'images' / split
            lbl_dir = source / 'labels' / split

            if not img_dir.exists():
                # Try alternative structure
                img_dir = source / split / 'images'
                lbl_dir = source / split / 'labels'

            if not img_dir.exists():
                continue

            for img_file in img_dir.glob('*'):
                if img_file.suffix.lower() not in ['.jpg', '.jpeg', '.png']:
                    continue

                # Create unique name
                new_name = f"{source_name}_{img_file.name}"
                new_img = combined / 'images' / split / new_name
                new_lbl = combined / 'labels' / split / (Path(new_name).stem + '.txt')

                # Copy image
                shutil.copy2(img_file, new_img)

                # Copy label if exists
                lbl_file = lbl_dir / (img_file.stem + '.txt')
                if lbl_file.exists():
                    shutil.copy2(lbl_file, new_lbl)

                total_images += 1

    # Create dataset.yaml
    yaml_content = f"""# Combined Drone Detection Dataset
# Generated by download_public_datasets.py

path: {combined.absolute()}
train: images/train
val: images/val

nc: {len(class_names)}
names:
"""
    for i, name in enumerate(class_names):
        yaml_content += f"  {i}: {name}\n"

    (combined / 'dataset.yaml').write_text(yaml_content)

    print(f"  Total images: {total_images}")
    print(f"  Output: {combined}")

    return combined


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Download public datasets for drone detection',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Download everything (with Roboflow API key)
  ROBOFLOW_API_KEY=xxx python download_public_datasets.py --output ./data --all

  # Download only Roboflow datasets
  python download_public_datasets.py --output ./data --roboflow --roboflow-key YOUR_KEY

  # Download COCO bird/aircraft classes
  python download_public_datasets.py --output ./data --coco-extract

  # Create combined dataset from existing downloads
  python download_public_datasets.py --output ./data --combine-only
        """
    )

    parser.add_argument('--output', type=str, default='./data',
                        help='Output directory (default: ./data)')
    parser.add_argument('--all', action='store_true',
                        help='Download all available datasets')
    parser.add_argument('--roboflow', action='store_true',
                        help='Download Roboflow datasets')
    parser.add_argument('--roboflow-key', type=str,
                        help='Roboflow API key (or set ROBOFLOW_API_KEY)')
    parser.add_argument('--coco-extract', action='store_true',
                        help='Download and extract COCO classes')
    parser.add_argument('--visdrone', action='store_true',
                        help='Download VisDrone sample')
    parser.add_argument('--combine-only', action='store_true',
                        help='Only combine existing datasets')
    parser.add_argument('--max-images', type=int, default=5000,
                        help='Max images per source (default: 5000)')

    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("Drone Detection Dataset Downloader")
    print("=" * 60)
    print(f"Output directory: {output_dir.absolute()}")

    downloaded_dirs = []

    # Roboflow datasets
    if args.roboflow or args.all:
        api_key = args.roboflow_key or os.environ.get('ROBOFLOW_API_KEY')

        for name, config in ROBOFLOW_DATASETS.items():
            result = download_roboflow_dataset(name, config, output_dir, api_key)
            if result:
                downloaded_dirs.append(result)

    # COCO extraction
    if args.coco_extract or args.all:
        coco_zip = output_dir / 'coco-annotations-2017.zip'
        coco_dir = output_dir / 'coco'

        if not coco_dir.exists():
            url = DIRECT_DOWNLOADS['coco-annotations-2017']['url']
            if download_file(url, coco_zip, 'COCO annotations'):
                extract_archive(coco_zip, coco_dir)

        if coco_dir.exists():
            # Extract bird, airplane, kite classes
            count = extract_coco_classes(
                coco_dir,
                output_dir,
                ['bird', 'airplane', 'kite', 'sports ball', 'frisbee'],
                args.max_images
            )
            if count > 0:
                downloaded_dirs.append(output_dir / 'coco-extracted')

    # VisDrone
    if args.visdrone or args.all:
        vis_zip = output_dir / 'visdrone-train.zip'
        vis_dir = output_dir / 'visdrone'

        url = DIRECT_DOWNLOADS['visdrone-sample']['url']
        if download_file(url, vis_zip, 'VisDrone sample'):
            if extract_archive(vis_zip, vis_dir):
                downloaded_dirs.append(vis_dir)

    # Create combined dataset
    if not args.combine_only:
        # Also look for existing datasets
        for subdir in output_dir.iterdir():
            if subdir.is_dir() and (subdir / 'images').exists():
                if subdir not in downloaded_dirs:
                    downloaded_dirs.append(subdir)

    if downloaded_dirs or args.combine_only:
        # Default class names for MVP
        class_names = [
            'drone', 'bird_small', 'bird_large', 'aircraft',
            'recreational', 'sports', 'debris', 'insect',
            'atmospheric', 'background'
        ]

        if args.combine_only:
            # Find all dataset directories
            downloaded_dirs = [
                d for d in output_dir.iterdir()
                if d.is_dir() and (d / 'images').exists()
            ]

        create_combined_dataset(output_dir, downloaded_dirs, class_names)

    # Print summary
    print("\n" + "=" * 60)
    print("Download Complete!")
    print("=" * 60)

    print("""
Next Steps:
1. If using Roboflow, get free API key: https://roboflow.com
2. For COCO images, follow instructions in data/coco-extracted/DOWNLOAD_IMAGES.md
3. Review and clean up combined dataset
4. Add custom negative samples (coke cans, etc.) to data/combined/

Training:
  python apps/detector/azure-ml/train.py --data data/combined/dataset.yaml
    """)


if __name__ == '__main__':
    main()
