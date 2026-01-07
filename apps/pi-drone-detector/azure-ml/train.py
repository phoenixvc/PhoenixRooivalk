#!/usr/bin/env python3
"""
Azure ML Training Script for Drone Detection Model

Fine-tunes YOLOv5n on drone dataset and exports to TFLite for Raspberry Pi.
"""

import os
import argparse
import shutil
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description='Train drone detection model')
    parser.add_argument('--data', type=str, required=True, help='Path to dataset.yaml')
    parser.add_argument('--epochs', type=int, default=100, help='Number of epochs')
    parser.add_argument('--imgsz', type=int, default=320, help='Image size (square)')
    parser.add_argument('--batch', type=int, default=16, help='Batch size')
    parser.add_argument('--output', type=str, default='./outputs', help='Output directory')
    parser.add_argument('--model', type=str, default='yolov5n.pt', help='Base model')
    parser.add_argument('--device', type=str, default='0', help='CUDA device')
    args = parser.parse_args()

    # Import here to allow --help without ultralytics installed
    from ultralytics import YOLO

    print(f"Starting training with config:")
    print(f"  Dataset: {args.data}")
    print(f"  Epochs: {args.epochs}")
    print(f"  Image size: {args.imgsz}")
    print(f"  Batch size: {args.batch}")
    print(f"  Base model: {args.model}")
    print(f"  Output: {args.output}")

    # Create output directory
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)

    # Load pretrained YOLOv5n
    model = YOLO(args.model)

    # Fine-tune on drone dataset
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project=str(output_path),
        name='drone-detector',
        exist_ok=True,
        # Training optimizations
        patience=20,           # Early stopping patience
        save_period=10,        # Checkpoint every 10 epochs
        amp=True,              # Mixed precision for speed
        workers=4,
        cache=True,            # Cache images in RAM
        # Augmentation for small dataset
        hsv_h=0.015,          # HSV-Hue augmentation
        hsv_s=0.7,            # HSV-Saturation augmentation
        hsv_v=0.4,            # HSV-Value augmentation
        degrees=10.0,         # Rotation
        translate=0.1,        # Translation
        scale=0.5,            # Scale
        shear=2.0,            # Shear
        flipud=0.5,           # Vertical flip
        fliplr=0.5,           # Horizontal flip
        mosaic=1.0,           # Mosaic augmentation
        mixup=0.1,            # Mixup augmentation
    )

    # Get best model path
    best_weights = output_path / 'drone-detector' / 'weights' / 'best.pt'

    if best_weights.exists():
        print(f"\nTraining complete! Best model: {best_weights}")
        print(f"Best mAP50: {results.results_dict.get('metrics/mAP50(B)', 'N/A')}")

        # Export to multiple formats for flexibility
        print("\nExporting models for Raspberry Pi...")
        best_model = YOLO(str(best_weights))

        # Export to TFLite (INT8 quantized for Pi)
        print("  Exporting TFLite INT8...")
        best_model.export(
            format='tflite',
            imgsz=args.imgsz,
            int8=True,
            data=args.data,  # Required for INT8 calibration
        )

        # Export to ONNX (alternative runtime)
        print("  Exporting ONNX...")
        best_model.export(
            format='onnx',
            imgsz=args.imgsz,
            simplify=True,
        )

        # Copy exported models to output root for easy access
        exports_dir = output_path / 'exports'
        exports_dir.mkdir(exist_ok=True)

        weights_dir = output_path / 'drone-detector' / 'weights'
        for ext in ['_int8.tflite', '.onnx']:
            src = weights_dir / f'best{ext}'
            if src.exists():
                dst = exports_dir / f'drone-detector{ext}'
                shutil.copy(src, dst)
                print(f"  Copied to {dst}")

        # Also copy the PyTorch model
        shutil.copy(best_weights, exports_dir / 'drone-detector.pt')

        print(f"\nAll exports saved to: {exports_dir}")
        print("\nTo deploy on Raspberry Pi:")
        print(f"  scp {exports_dir}/drone-detector_int8.tflite pi@raspberrypi:~/")
    else:
        print(f"ERROR: Best weights not found at {best_weights}")
        raise FileNotFoundError(f"Training failed - no weights at {best_weights}")


if __name__ == '__main__':
    main()
