#!/usr/bin/env python3
"""
Download and prepare public drone detection datasets.

Datasets:
- Drone-vs-Bird: Video frames with drone/bird labels
- USC Drone Dataset: Labeled drone images
- Custom: Placeholder for your own coke can images

Usage:
    python download_datasets.py --output ./data --datasets drone-vs-bird usc
"""

import os
import sys
import argparse
import shutil
import random
import zipfile
import tarfile
from pathlib import Path
from urllib.request import urlretrieve
from concurrent.futures import ThreadPoolExecutor


def download_file(url: str, dest: Path, desc: str = None) -> Path:
    """Download a file with progress indication."""
    if dest.exists():
        print(f"  [SKIP] {desc or dest.name} already exists")
        return dest

    print(f"  Downloading {desc or url}...")
    dest.parent.mkdir(parents=True, exist_ok=True)

    def progress(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size) if total_size > 0 else 0
        sys.stdout.write(f"\r  Progress: {percent}%")
        sys.stdout.flush()

    urlretrieve(url, dest, reporthook=progress)
    print()
    return dest


def extract_archive(archive: Path, dest: Path):
    """Extract zip or tar archive."""
    print(f"  Extracting {archive.name}...")
    dest.mkdir(parents=True, exist_ok=True)

    if archive.suffix == '.zip':
        with zipfile.ZipFile(archive, 'r') as zf:
            zf.extractall(dest)
    elif archive.suffix in ['.gz', '.tgz', '.tar']:
        with tarfile.open(archive, 'r:*') as tf:
            tf.extractall(dest)
    else:
        raise ValueError(f"Unknown archive format: {archive.suffix}")


def convert_to_yolo_format(bbox, img_width, img_height, class_id=0):
    """Convert bounding box to YOLO format: class x_center y_center width height (normalized)."""
    x_min, y_min, x_max, y_max = bbox

    x_center = (x_min + x_max) / 2 / img_width
    y_center = (y_min + y_max) / 2 / img_height
    width = (x_max - x_min) / img_width
    height = (y_max - y_min) / img_height

    return f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}"


def setup_drone_vs_bird(output_dir: Path):
    """
    Download and prepare Drone-vs-Bird dataset.

    Note: This dataset requires manual download from the official source.
    We provide instructions and a synthetic placeholder.
    """
    print("\n[Drone-vs-Bird Dataset]")

    dataset_dir = output_dir / 'drone-vs-bird'
    dataset_dir.mkdir(parents=True, exist_ok=True)

    readme = dataset_dir / 'README.md'
    readme.write_text("""# Drone-vs-Bird Dataset

## Manual Download Required

The Drone-vs-Bird Challenge dataset requires registration:

1. Visit: https://wosdetc.github.io/
2. Register and download the dataset
3. Extract to this folder

## Alternative: Use Roboflow

Roboflow has pre-processed drone detection datasets:

1. Visit: https://universe.roboflow.com/search?q=drone%20detection
2. Download in "YOLOv5 PyTorch" format
3. Extract to this folder

## Expected Structure

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

    print(f"  Created instructions at {readme}")
    print("  NOTE: Manual download required - see README.md")

    return dataset_dir


def setup_usc_drone_dataset(output_dir: Path):
    """
    Setup USC Drone Dataset.

    Dataset: https://data.mendeley.com/datasets/zcsj2g2m4c/4
    """
    print("\n[USC Drone Dataset]")

    dataset_dir = output_dir / 'usc-drone'
    dataset_dir.mkdir(parents=True, exist_ok=True)

    readme = dataset_dir / 'README.md'
    readme.write_text("""# USC Drone Dataset

## Download Instructions

1. Visit: https://data.mendeley.com/datasets/zcsj2g2m4c/4
2. Download the dataset (click "Download All" or individual files)
3. Extract to this folder

## Alternative Direct Links

The dataset contains labeled drone images in various conditions:
- Different backgrounds
- Various distances
- Multiple drone types

## After Download

Run the conversion script:
```bash
python ../scripts/convert_usc_to_yolo.py --input ./raw --output ./
```
""")

    print(f"  Created instructions at {readme}")
    print("  NOTE: Manual download required - see README.md")

    return dataset_dir


def setup_negative_samples(output_dir: Path):
    """
    Create structure for negative samples (coke cans, birds, etc.).
    """
    print("\n[Negative Samples - NOT_DRONE class]")

    negatives_dir = output_dir / 'negatives'
    images_dir = negatives_dir / 'images'
    labels_dir = negatives_dir / 'labels'

    images_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)

    readme = negatives_dir / 'README.md'
    readme.write_text("""# Negative Samples (NOT_DRONE class)

This folder is for objects that should NOT be classified as drones:
- Coke cans / bottles
- Birds
- Balloons
- Kites
- Plastic bags
- etc.

## How to Add Your Own

1. Take photos of coke cans at various:
   - Distances (1m, 5m, 10m, 20m)
   - Angles (front, side, tilted)
   - Backgrounds (sky, grass, buildings)
   - Lighting (sunny, cloudy, indoor)

2. Name files descriptively:
   - cokecan_001.jpg
   - bottle_001.jpg
   - bird_001.jpg

3. Create label files (same name, .txt extension):
   - Each line: `1 x_center y_center width height`
   - Class 1 = not_drone
   - Coordinates normalized (0-1)

## Labeling Tools

Use one of these free tools:
- Roboflow (web): https://roboflow.com
- Label Studio: `pip install label-studio && label-studio`
- CVAT: https://cvat.ai

## Example Label File

For `cokecan_001.txt`:
```
1 0.5 0.5 0.1 0.2
```
(Class 1, centered, 10% width, 20% height of image)
""")

    print(f"  Created structure at {negatives_dir}")
    print("  Add your coke can images to: images/")
    print("  Add YOLO labels to: labels/")

    return negatives_dir


def create_combined_dataset(output_dir: Path, train_split: float = 0.8):
    """
    Combine all datasets into a single YOLO-format dataset.
    """
    print("\n[Creating Combined Dataset]")

    combined_dir = output_dir / 'combined'
    train_images = combined_dir / 'images' / 'train'
    val_images = combined_dir / 'images' / 'val'
    train_labels = combined_dir / 'labels' / 'train'
    val_labels = combined_dir / 'labels' / 'val'

    for d in [train_images, val_images, train_labels, val_labels]:
        d.mkdir(parents=True, exist_ok=True)

    # Create dataset.yaml
    dataset_yaml = combined_dir / 'dataset.yaml'
    dataset_yaml.write_text(f"""# Drone Detection Dataset
# Auto-generated - modify paths as needed

path: {combined_dir.absolute()}
train: images/train
val: images/val

# Classes
nc: 2
names:
  0: drone
  1: not_drone

# Training notes:
# - Class 0 (drone): Quadcopters, multirotors, fixed-wing UAVs
# - Class 1 (not_drone): Coke cans, birds, balloons, kites, etc.
""")

    print(f"  Created dataset config: {dataset_yaml}")
    print(f"  Combined dataset location: {combined_dir}")
    print("\n  Next steps:")
    print("  1. Download source datasets (see individual README files)")
    print("  2. Add your own coke can images to data/negatives/")
    print("  3. Run: python scripts/prepare_dataset.py --input data/ --output data/combined/")

    return combined_dir


def main():
    parser = argparse.ArgumentParser(description='Download drone detection datasets')
    parser.add_argument('--output', type=str, default='./data', help='Output directory')
    parser.add_argument('--datasets', nargs='+',
                        choices=['drone-vs-bird', 'usc', 'negatives', 'all'],
                        default=['all'],
                        help='Datasets to download')
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Setting up datasets in: {output_dir.absolute()}")

    datasets = args.datasets
    if 'all' in datasets:
        datasets = ['drone-vs-bird', 'usc', 'negatives']

    if 'drone-vs-bird' in datasets:
        setup_drone_vs_bird(output_dir)

    if 'usc' in datasets:
        setup_usc_drone_dataset(output_dir)

    if 'negatives' in datasets:
        setup_negative_samples(output_dir)

    # Always create combined dataset structure
    create_combined_dataset(output_dir)

    print("\n" + "="*60)
    print("Dataset setup complete!")
    print("="*60)
    print("\nQuick Start:")
    print("1. Download datasets following README instructions")
    print("2. Add your coke can photos to data/negatives/images/")
    print("3. Label with Roboflow (free): https://roboflow.com")
    print("4. Export as 'YOLOv5 PyTorch' format")
    print("5. Copy to data/combined/")


if __name__ == '__main__':
    main()
