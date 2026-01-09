#!/usr/bin/env python3
"""
Azure ML Training Script for Drone Detection Model

Fine-tunes YOLOv8n (or YOLOv5nu) on drone dataset and exports to TFLite for Raspberry Pi.

Supported base models:
- yolov8n.pt (recommended) - YOLOv8 nano, best for edge deployment
- yolov8s.pt - YOLOv8 small, better accuracy
- yolov5nu.pt - YOLOv5 nano (ultralytics format)
- yolov5su.pt - YOLOv5 small (ultralytics format)

Note: Original yolov5n.pt requires the old yolov5 repo, not ultralytics.
      Use yolov5nu.pt for ultralytics compatibility with YOLOv5 architecture.

Usage:
    # Basic training
    python train.py --data dataset.yaml --epochs 100

    # Resume from checkpoint
    python train.py --data dataset.yaml --resume ./outputs/drone-detector/weights/last.pt

    # Use specific model
    python train.py --data dataset.yaml --model yolov8s.pt --epochs 150
"""

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path


# Supported model architectures with ultralytics
SUPPORTED_MODELS = {
    # YOLOv8 variants (recommended)
    'yolov8n.pt': 'YOLOv8 nano - fastest, best for Pi',
    'yolov8s.pt': 'YOLOv8 small - balanced',
    'yolov8m.pt': 'YOLOv8 medium - more accurate',
    # YOLOv5 ultralytics format
    'yolov5nu.pt': 'YOLOv5 nano ultralytics - legacy compatible',
    'yolov5su.pt': 'YOLOv5 small ultralytics',
    # Train from scratch (not recommended without large dataset)
    'yolov8n.yaml': 'YOLOv8 nano from scratch',
}

# Model name corrections for common mistakes
MODEL_CORRECTIONS = {
    'yolov5n.pt': 'yolov8n.pt',  # Old format -> recommend v8
    'yolov5s.pt': 'yolov5su.pt',  # Old format -> ultralytics format
    'yolov5m.pt': 'yolov5mu.pt',
    'yolov5l.pt': 'yolov5lu.pt',
}


def validate_model(model_name: str) -> str:
    """Validate and potentially fix model name for ultralytics compatibility."""
    if model_name in MODEL_CORRECTIONS:
        corrected = MODEL_CORRECTIONS[model_name]
        print(f"WARNING: '{model_name}' is incompatible with ultralytics library.")
        print(f"         Auto-correcting to '{corrected}'")
        print("         (Old yolov5*.pt files require the legacy yolov5 repo)")
        return corrected

    if model_name not in SUPPORTED_MODELS and not Path(model_name).exists():
        print(f"WARNING: Model '{model_name}' not in supported list.")
        print(f"         Supported models: {list(SUPPORTED_MODELS.keys())}")
        print("         Proceeding anyway (may work if it's a valid checkpoint)")

    return model_name


def validate_dataset(data_path: str) -> Path:
    """Validate dataset YAML exists and has required fields."""
    data_file = Path(data_path)
    if not data_file.exists():
        raise FileNotFoundError(f"Dataset config not found: {data_file}")

    # Basic YAML validation
    import yaml
    with open(data_file) as f:
        config = yaml.safe_load(f)

    required_fields = ['train', 'val', 'nc', 'names']
    missing = [f for f in required_fields if f not in config]
    if missing:
        raise ValueError(f"Dataset YAML missing required fields: {missing}")

    print(f"Dataset validated: {config['nc']} classes")
    return data_file


def find_exported_models(weights_dir: Path) -> dict:
    """Find all exported model files with various naming patterns."""
    exports = {}

    # TFLite patterns (ultralytics exports vary by version)
    tflite_patterns = [
        'best_saved_model/*_int8.tflite',
        'best_saved_model/*_float16.tflite',
        'best_saved_model/*.tflite',
        'best_int8.tflite',
        'best_float16.tflite',
        'best.tflite',
        '*_int8.tflite',
        '*.tflite',
    ]

    for pattern in tflite_patterns:
        matches = list(weights_dir.glob(pattern))
        if matches:
            # Prefer int8 > float16 > regular
            for match in matches:
                name = match.name
                if '_int8' in name and 'tflite_int8' not in exports:
                    exports['tflite_int8'] = match
                elif '_float16' in name and 'tflite_float16' not in exports:
                    exports['tflite_float16'] = match
                elif 'tflite' not in exports:
                    exports['tflite'] = match

    # ONNX patterns
    onnx_patterns = ['best.onnx', '*.onnx']
    for pattern in onnx_patterns:
        matches = list(weights_dir.glob(pattern))
        if matches and 'onnx' not in exports:
            exports['onnx'] = matches[0]

    return exports


def export_models(model, imgsz: int, data_path: str, output_dir: Path) -> dict:
    """Export model to TFLite and ONNX formats with error handling."""
    exported = {}

    # Export to TFLite (INT8 quantized for Pi)
    print("\n  Exporting TFLite INT8 (for Raspberry Pi)...")
    try:
        tflite_path = model.export(
            format='tflite',
            imgsz=imgsz,
            int8=True,
            data=data_path,  # Required for INT8 calibration
        )
        exported['tflite_int8'] = Path(tflite_path) if tflite_path else None
        print(f"    TFLite INT8: {tflite_path}")
    except Exception as e:
        print(f"    WARNING: TFLite INT8 export failed: {e}")
        # Try without INT8
        try:
            print("    Retrying with float16...")
            tflite_path = model.export(
                format='tflite',
                imgsz=imgsz,
                half=True,
            )
            exported['tflite_float16'] = Path(tflite_path) if tflite_path else None
            print(f"    TFLite float16: {tflite_path}")
        except Exception as e2:
            print(f"    WARNING: TFLite export failed completely: {e2}")

    # Export to ONNX (cross-platform, good for Jetson)
    print("\n  Exporting ONNX (for Jetson/desktop)...")
    try:
        onnx_path = model.export(
            format='onnx',
            imgsz=imgsz,
            simplify=True,
            opset=12,  # Good compatibility
        )
        exported['onnx'] = Path(onnx_path) if onnx_path else None
        print(f"    ONNX: {onnx_path}")
    except Exception as e:
        print(f"    WARNING: ONNX export failed: {e}")

    return exported


def save_training_metadata(output_dir: Path, args, results, exports: dict):
    """Save training metadata for reproducibility and deployment."""
    metadata = {
        'timestamp': datetime.now().isoformat(),
        'config': {
            'model': args.model,
            'epochs': args.epochs,
            'imgsz': args.imgsz,
            'batch': args.batch,
            'data': args.data,
            'device': args.device,
            'patience': args.patience,
        },
        'results': {
            'best_mAP50': results.results_dict.get('metrics/mAP50(B)', None),
            'best_mAP50_95': results.results_dict.get('metrics/mAP50-95(B)', None),
            'best_precision': results.results_dict.get('metrics/precision(B)', None),
            'best_recall': results.results_dict.get('metrics/recall(B)', None),
        },
        'exports': {k: str(v) for k, v in exports.items() if v},
        'deployment': {
            'recommended_platform': 'Raspberry Pi 4/5 with TFLite INT8',
            'expected_fps_pi4': '5-8 FPS',
            'expected_fps_pi5': '12-18 FPS',
            'expected_fps_coral': '25-50 FPS',
        }
    }

    metadata_file = output_dir / 'training_metadata.json'
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"\nMetadata saved: {metadata_file}")

    return metadata


def main():
    parser = argparse.ArgumentParser(
        description='Train drone detection model for edge deployment',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train with YOLOv8 nano (recommended for Pi)
  python train.py --data dataset.yaml --epochs 100

  # Train with larger model for better accuracy
  python train.py --data dataset.yaml --model yolov8s.pt --epochs 150

  # Resume interrupted training
  python train.py --data dataset.yaml --resume ./outputs/drone-detector/weights/last.pt

  # Quick test run
  python train.py --data dataset.yaml --epochs 5 --batch 8

Supported Models:
"""
        + '\n'.join(f"  {k}: {v}" for k, v in SUPPORTED_MODELS.items())
    )

    parser.add_argument('--data', type=str, required=True,
                        help='Path to dataset.yaml')
    parser.add_argument('--epochs', type=int, default=100,
                        help='Number of training epochs (default: 100)')
    parser.add_argument('--imgsz', type=int, default=320,
                        help='Image size in pixels (default: 320, good for Pi)')
    parser.add_argument('--batch', type=int, default=16,
                        help='Batch size (default: 16, reduce if OOM)')
    parser.add_argument('--output', type=str, default='./outputs',
                        help='Output directory (default: ./outputs)')
    parser.add_argument('--model', type=str, default='yolov8n.pt',
                        help='Base model (default: yolov8n.pt)')
    parser.add_argument('--device', type=str, default='0',
                        help='CUDA device: 0, 1, cpu (default: 0)')
    parser.add_argument('--resume', type=str, default=None,
                        help='Resume from checkpoint path')
    parser.add_argument('--workers', type=int, default=4,
                        help='DataLoader workers (default: 4)')
    parser.add_argument('--patience', type=int, default=20,
                        help='Early stopping patience (default: 20)')
    parser.add_argument('--no-export', action='store_true',
                        help='Skip model export after training')
    parser.add_argument('--no-cache', action='store_true',
                        help='Disable image caching (saves RAM)')
    parser.add_argument('--name', type=str, default='drone-detector',
                        help='Experiment name (default: drone-detector)')

    args = parser.parse_args()

    # Validate inputs
    args.model = validate_model(args.model)
    data_path = validate_dataset(args.data)

    # Import here to allow --help without ultralytics installed
    try:
        from ultralytics import YOLO
    except ImportError:
        print("ERROR: ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    print("=" * 60)
    print("Drone Detection Model Training")
    print("=" * 60)
    print(f"  Dataset:    {data_path}")
    print(f"  Model:      {args.model}")
    print(f"  Epochs:     {args.epochs}")
    print(f"  Image size: {args.imgsz}x{args.imgsz}")
    print(f"  Batch size: {args.batch}")
    print(f"  Device:     {args.device}")
    print(f"  Output:     {args.output}")
    if args.resume:
        print(f"  Resuming:   {args.resume}")
    print("=" * 60)

    # Create output directory
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)

    # Load model
    if args.resume:
        print(f"\nResuming from checkpoint: {args.resume}")
        model = YOLO(args.resume)
    else:
        print(f"\nLoading base model: {args.model}")
        model = YOLO(args.model)

    # Training configuration
    train_config = {
        'data': str(data_path),
        'epochs': args.epochs,
        'imgsz': args.imgsz,
        'batch': args.batch,
        'device': args.device,
        'project': str(output_path),
        'name': args.name,
        'exist_ok': True,
        # Training optimizations
        'patience': args.patience,
        'save_period': 10,  # Checkpoint every 10 epochs
        'amp': True,  # Mixed precision for speed
        'workers': args.workers,
        'cache': not args.no_cache,
        # Augmentation for drone detection
        'hsv_h': 0.015,  # HSV-Hue augmentation
        'hsv_s': 0.7,  # HSV-Saturation augmentation
        'hsv_v': 0.4,  # HSV-Value augmentation
        'degrees': 10.0,  # Rotation (drones can be at angles)
        'translate': 0.1,  # Translation
        'scale': 0.5,  # Scale (drones at various distances)
        'shear': 2.0,  # Shear
        'flipud': 0.5,  # Vertical flip (sky views)
        'fliplr': 0.5,  # Horizontal flip
        'mosaic': 1.0,  # Mosaic augmentation
        'mixup': 0.1,  # Mixup augmentation
    }

    # Add resume if specified
    if args.resume:
        train_config['resume'] = True

    print("\nStarting training...")
    results = model.train(**train_config)

    # Get best model path
    best_weights = output_path / args.name / 'weights' / 'best.pt'
    last_weights = output_path / args.name / 'weights' / 'last.pt'

    if not best_weights.exists():
        # Check alternative locations
        alt_paths = [
            output_path / 'weights' / 'best.pt',
            output_path / args.name / 'best.pt',
        ]
        for alt in alt_paths:
            if alt.exists():
                best_weights = alt
                break

    if best_weights.exists():
        print("\n" + "=" * 60)
        print("Training Complete!")
        print("=" * 60)
        print(f"Best model: {best_weights}")

        # Print metrics
        metrics = results.results_dict
        print("\nBest Metrics:")
        print(f"  mAP50:     {metrics.get('metrics/mAP50(B)', 'N/A')}")
        print(f"  mAP50-95:  {metrics.get('metrics/mAP50-95(B)', 'N/A')}")
        print(f"  Precision: {metrics.get('metrics/precision(B)', 'N/A')}")
        print(f"  Recall:    {metrics.get('metrics/recall(B)', 'N/A')}")

        # Export models unless disabled
        exports = {}
        if not args.no_export:
            print("\n" + "=" * 60)
            print("Exporting Models for Deployment")
            print("=" * 60)

            best_model = YOLO(str(best_weights))
            exports = export_models(best_model, args.imgsz, str(data_path), output_path)

            # Also find any exports that were created
            weights_dir = best_weights.parent
            found_exports = find_exported_models(weights_dir)
            exports.update(found_exports)

            # Copy to exports directory for easy access
            exports_dir = output_path / 'exports'
            exports_dir.mkdir(exist_ok=True)

            print(f"\nCopying exports to: {exports_dir}")

            # Copy PyTorch model
            shutil.copy(best_weights, exports_dir / 'drone-detector.pt')
            print("  drone-detector.pt (PyTorch)")

            # Copy exported formats
            for fmt, src_path in exports.items():
                if src_path and Path(src_path).exists():
                    dst_name = f"drone-detector.{fmt.replace('_', '.')}"
                    if 'tflite' in fmt:
                        dst_name = f"drone-detector_{fmt.split('_')[-1]}.tflite" if '_' in fmt else "drone-detector.tflite"
                    elif fmt == 'onnx':
                        dst_name = "drone-detector.onnx"

                    dst = exports_dir / dst_name
                    shutil.copy(src_path, dst)
                    print(f"  {dst_name}")

            print(f"\nAll exports saved to: {exports_dir}")

        # Save metadata
        save_training_metadata(output_path, args, results, exports)

        # Print deployment instructions
        print("\n" + "=" * 60)
        print("Deployment Instructions")
        print("=" * 60)
        print("""
For Raspberry Pi (TFLite):
  scp {exports}/drone-detector_int8.tflite pi@raspberrypi:~/models/

For Jetson (ONNX with TensorRT):
  scp {exports}/drone-detector.onnx jetson@jetson:~/models/

For desktop testing:
  from ultralytics import YOLO
  model = YOLO('{exports}/drone-detector.pt')
  results = model.predict('image.jpg')
""".format(exports=exports_dir if not args.no_export else output_path / args.name / 'weights'))

    else:
        print("\nERROR: Training may have failed - best weights not found")
        print(f"  Expected: {best_weights}")
        print(f"  Last checkpoint: {last_weights}")
        if last_weights.exists():
            print("  NOTE: last.pt exists - training may have been interrupted")
            print(f"        Resume with: --resume {last_weights}")
        sys.exit(1)


if __name__ == '__main__':
    main()
