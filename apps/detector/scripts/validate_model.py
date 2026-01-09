#!/usr/bin/env python3
"""
Model Validation and Benchmarking Script

Validates trained drone detection models and benchmarks performance
across different platforms and export formats.

Usage:
    # Validate PyTorch model
    python validate_model.py --model exports/drone-detector.pt --data dataset.yaml

    # Benchmark all formats
    python validate_model.py --model-dir exports/ --benchmark

    # Full validation with confusion matrix
    python validate_model.py --model exports/drone-detector.pt --data dataset.yaml --full

Requirements:
    pip install ultralytics onnxruntime numpy pandas matplotlib seaborn
"""

import argparse
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np


@dataclass
class BenchmarkResult:
    """Results from model benchmark."""
    format: str
    file_size_mb: float
    load_time_ms: float
    inference_time_ms: float
    fps: float
    memory_mb: float
    mAP50: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None


@dataclass
class ValidationResult:
    """Results from model validation."""
    model_path: str
    dataset: str
    mAP50: float
    mAP50_95: float
    precision: float
    recall: float
    f1: float
    per_class_ap: Dict[str, float]
    confusion_matrix: Optional[np.ndarray] = None
    class_names: Optional[List[str]] = None


def validate_model_files(model_dir: Path) -> Dict[str, Path]:
    """Check which model formats are available."""
    models = {}

    patterns = {
        'pytorch': ['*.pt', 'best.pt', 'drone-detector.pt'],
        'onnx': ['*.onnx', 'drone-detector.onnx'],
        'tflite': ['*.tflite', '*_int8.tflite', '*_float16.tflite'],
        'torchscript': ['*.torchscript'],
        'openvino': ['*_openvino_model/'],
    }

    for fmt, pats in patterns.items():
        for pat in pats:
            matches = list(model_dir.glob(pat))
            if matches:
                models[fmt] = matches[0]
                break

    return models


def benchmark_pytorch(model_path: Path, imgsz: int = 320, iterations: int = 100) -> BenchmarkResult:
    """Benchmark PyTorch model."""
    from ultralytics import YOLO
    import torch

    # Load model
    start = time.time()
    model = YOLO(str(model_path))
    load_time = (time.time() - start) * 1000

    # Warmup
    dummy = np.random.randint(0, 255, (imgsz, imgsz, 3), dtype=np.uint8)
    for _ in range(10):
        model.predict(dummy, verbose=False)

    # Benchmark
    times = []
    for _ in range(iterations):
        start = time.time()
        model.predict(dummy, verbose=False)
        times.append((time.time() - start) * 1000)

    avg_time = np.mean(times)

    # Memory usage
    if torch.cuda.is_available():
        memory = torch.cuda.max_memory_allocated() / 1024 / 1024
    else:
        import psutil
        memory = psutil.Process().memory_info().rss / 1024 / 1024

    return BenchmarkResult(
        format='PyTorch',
        file_size_mb=model_path.stat().st_size / 1024 / 1024,
        load_time_ms=load_time,
        inference_time_ms=avg_time,
        fps=1000 / avg_time,
        memory_mb=memory,
    )


def benchmark_onnx(model_path: Path, imgsz: int = 320, iterations: int = 100) -> BenchmarkResult:
    """Benchmark ONNX model."""
    import onnxruntime as ort

    # Load model
    start = time.time()
    session = ort.InferenceSession(str(model_path), providers=['CPUExecutionProvider'])
    load_time = (time.time() - start) * 1000

    # Get input details
    input_name = session.get_inputs()[0].name
    input_shape = session.get_inputs()[0].shape

    # Prepare dummy input
    if len(input_shape) == 4:
        batch, channels, h, w = input_shape
        h = h if isinstance(h, int) else imgsz
        w = w if isinstance(w, int) else imgsz
        dummy = np.random.rand(1, 3, h, w).astype(np.float32)
    else:
        dummy = np.random.rand(1, 3, imgsz, imgsz).astype(np.float32)

    # Warmup
    for _ in range(10):
        session.run(None, {input_name: dummy})

    # Benchmark
    times = []
    for _ in range(iterations):
        start = time.time()
        session.run(None, {input_name: dummy})
        times.append((time.time() - start) * 1000)

    avg_time = np.mean(times)

    import psutil
    memory = psutil.Process().memory_info().rss / 1024 / 1024

    return BenchmarkResult(
        format='ONNX',
        file_size_mb=model_path.stat().st_size / 1024 / 1024,
        load_time_ms=load_time,
        inference_time_ms=avg_time,
        fps=1000 / avg_time,
        memory_mb=memory,
    )


def benchmark_tflite(model_path: Path, imgsz: int = 320, iterations: int = 100) -> BenchmarkResult:
    """Benchmark TFLite model."""
    try:
        import tflite_runtime.interpreter as tflite
    except ImportError:
        import tensorflow.lite as tflite

    # Load model
    start = time.time()
    interpreter = tflite.Interpreter(model_path=str(model_path))
    interpreter.allocate_tensors()
    load_time = (time.time() - start) * 1000

    # Get input details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    input_shape = input_details[0]['shape']
    input_dtype = input_details[0]['dtype']

    # Prepare dummy input
    if input_dtype == np.float32:
        dummy = np.random.rand(*input_shape).astype(np.float32)
    elif input_dtype == np.uint8:
        dummy = np.random.randint(0, 255, input_shape, dtype=np.uint8)
    else:
        dummy = np.random.rand(*input_shape).astype(input_dtype)

    # Warmup
    for _ in range(10):
        interpreter.set_tensor(input_details[0]['index'], dummy)
        interpreter.invoke()

    # Benchmark
    times = []
    for _ in range(iterations):
        start = time.time()
        interpreter.set_tensor(input_details[0]['index'], dummy)
        interpreter.invoke()
        times.append((time.time() - start) * 1000)

    avg_time = np.mean(times)

    import psutil
    memory = psutil.Process().memory_info().rss / 1024 / 1024

    return BenchmarkResult(
        format='TFLite' + (' INT8' if input_dtype == np.uint8 else ''),
        file_size_mb=model_path.stat().st_size / 1024 / 1024,
        load_time_ms=load_time,
        inference_time_ms=avg_time,
        fps=1000 / avg_time,
        memory_mb=memory,
    )


def validate_model(
    model_path: Path,
    data_path: Path,
    imgsz: int = 320,
    conf: float = 0.25,
    iou: float = 0.45,
) -> ValidationResult:
    """Validate model on dataset and compute metrics."""
    from ultralytics import YOLO

    print(f"\nValidating: {model_path}")
    print(f"Dataset: {data_path}")

    model = YOLO(str(model_path))

    # Run validation
    results = model.val(
        data=str(data_path),
        imgsz=imgsz,
        conf=conf,
        iou=iou,
        verbose=False,
    )

    # Extract metrics
    metrics = results.results_dict

    # Per-class AP
    per_class_ap = {}
    if hasattr(results, 'ap_class_index') and hasattr(results, 'ap'):
        class_names = results.names
        for i, idx in enumerate(results.ap_class_index):
            per_class_ap[class_names[idx]] = float(results.ap[i])

    # F1 score
    precision = metrics.get('metrics/precision(B)', 0)
    recall = metrics.get('metrics/recall(B)', 0)
    f1 = 2 * precision * recall / (precision + recall + 1e-6)

    return ValidationResult(
        model_path=str(model_path),
        dataset=str(data_path),
        mAP50=metrics.get('metrics/mAP50(B)', 0),
        mAP50_95=metrics.get('metrics/mAP50-95(B)', 0),
        precision=precision,
        recall=recall,
        f1=f1,
        per_class_ap=per_class_ap,
        confusion_matrix=results.confusion_matrix.matrix if hasattr(results, 'confusion_matrix') else None,
        class_names=list(results.names.values()) if hasattr(results, 'names') else None,
    )


def generate_confusion_matrix_plot(
    result: ValidationResult,
    output_path: Path
):
    """Generate confusion matrix visualization."""
    if result.confusion_matrix is None:
        print("No confusion matrix available")
        return

    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
    except ImportError:
        print("Install matplotlib and seaborn for plots: pip install matplotlib seaborn")
        return

    plt.figure(figsize=(12, 10))
    sns.heatmap(
        result.confusion_matrix,
        annot=True,
        fmt='.0f',
        cmap='Blues',
        xticklabels=result.class_names or [],
        yticklabels=result.class_names or [],
    )
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix')
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    print(f"Confusion matrix saved: {output_path}")


def print_benchmark_results(results: List[BenchmarkResult]):
    """Print benchmark results as table."""
    print("\n" + "=" * 80)
    print("BENCHMARK RESULTS")
    print("=" * 80)
    print(f"{'Format':<15} {'Size (MB)':<12} {'Load (ms)':<12} {'Infer (ms)':<12} {'FPS':<10} {'Memory (MB)':<12}")
    print("-" * 80)

    for r in results:
        print(f"{r.format:<15} {r.file_size_mb:<12.2f} {r.load_time_ms:<12.1f} {r.inference_time_ms:<12.2f} {r.fps:<10.1f} {r.memory_mb:<12.1f}")

    print("=" * 80)


def print_validation_results(result: ValidationResult):
    """Print validation results."""
    print("\n" + "=" * 80)
    print("VALIDATION RESULTS")
    print("=" * 80)
    print(f"Model:      {result.model_path}")
    print(f"Dataset:    {result.dataset}")
    print("-" * 40)
    print(f"mAP50:      {result.mAP50:.4f}")
    print(f"mAP50-95:   {result.mAP50_95:.4f}")
    print(f"Precision:  {result.precision:.4f}")
    print(f"Recall:     {result.recall:.4f}")
    print(f"F1 Score:   {result.f1:.4f}")

    if result.per_class_ap:
        print("\nPer-Class AP:")
        for cls, ap in result.per_class_ap.items():
            print(f"  {cls}: {ap:.4f}")

    print("=" * 80)


def save_results(
    benchmark_results: List[BenchmarkResult],
    validation_result: Optional[ValidationResult],
    output_path: Path
):
    """Save results to JSON."""
    data = {
        'benchmarks': [
            {
                'format': r.format,
                'file_size_mb': r.file_size_mb,
                'load_time_ms': r.load_time_ms,
                'inference_time_ms': r.inference_time_ms,
                'fps': r.fps,
                'memory_mb': r.memory_mb,
            }
            for r in benchmark_results
        ],
    }

    if validation_result:
        data['validation'] = {
            'model': validation_result.model_path,
            'dataset': validation_result.dataset,
            'mAP50': validation_result.mAP50,
            'mAP50_95': validation_result.mAP50_95,
            'precision': validation_result.precision,
            'recall': validation_result.recall,
            'f1': validation_result.f1,
            'per_class_ap': validation_result.per_class_ap,
        }

    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"\nResults saved: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description='Validate and benchmark drone detection models',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument('--model', type=str,
                        help='Path to model file (.pt, .onnx, .tflite)')
    parser.add_argument('--model-dir', type=str,
                        help='Directory containing exported models')
    parser.add_argument('--data', type=str,
                        help='Path to dataset.yaml for validation')
    parser.add_argument('--benchmark', action='store_true',
                        help='Run performance benchmark')
    parser.add_argument('--full', action='store_true',
                        help='Full validation with confusion matrix')
    parser.add_argument('--imgsz', type=int, default=320,
                        help='Image size for inference (default: 320)')
    parser.add_argument('--iterations', type=int, default=100,
                        help='Benchmark iterations (default: 100)')
    parser.add_argument('--output', type=str, default='./validation_results',
                        help='Output directory for results')
    parser.add_argument('--conf', type=float, default=0.25,
                        help='Confidence threshold (default: 0.25)')
    parser.add_argument('--iou', type=float, default=0.45,
                        help='IoU threshold (default: 0.45)')

    args = parser.parse_args()

    if not args.model and not args.model_dir:
        parser.error("Either --model or --model-dir is required")

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    benchmark_results = []
    validation_result = None

    # Find models
    if args.model_dir:
        model_dir = Path(args.model_dir)
        models = validate_model_files(model_dir)
        print(f"\nFound models: {list(models.keys())}")
    else:
        model_path = Path(args.model)
        if model_path.suffix == '.pt':
            models = {'pytorch': model_path}
        elif model_path.suffix == '.onnx':
            models = {'onnx': model_path}
        elif model_path.suffix == '.tflite':
            models = {'tflite': model_path}
        else:
            models = {'unknown': model_path}

    # Benchmark
    if args.benchmark or args.model_dir:
        print("\n" + "=" * 60)
        print("Running Benchmarks")
        print("=" * 60)

        if 'pytorch' in models:
            try:
                result = benchmark_pytorch(models['pytorch'], args.imgsz, args.iterations)
                benchmark_results.append(result)
            except Exception as e:
                print(f"PyTorch benchmark failed: {e}")

        if 'onnx' in models:
            try:
                result = benchmark_onnx(models['onnx'], args.imgsz, args.iterations)
                benchmark_results.append(result)
            except Exception as e:
                print(f"ONNX benchmark failed: {e}")

        if 'tflite' in models:
            try:
                result = benchmark_tflite(models['tflite'], args.imgsz, args.iterations)
                benchmark_results.append(result)
            except Exception as e:
                print(f"TFLite benchmark failed: {e}")

        if benchmark_results:
            print_benchmark_results(benchmark_results)

    # Validation
    if args.data:
        data_path = Path(args.data)
        if not data_path.exists():
            print(f"Dataset not found: {data_path}")
        else:
            # Prefer PyTorch model for validation
            val_model = models.get('pytorch') or list(models.values())[0]

            validation_result = validate_model(
                val_model,
                data_path,
                args.imgsz,
                args.conf,
                args.iou,
            )
            print_validation_results(validation_result)

            if args.full and validation_result.confusion_matrix is not None:
                cm_path = output_dir / 'confusion_matrix.png'
                generate_confusion_matrix_plot(validation_result, cm_path)

    # Save results
    if benchmark_results or validation_result:
        results_path = output_dir / 'results.json'
        save_results(benchmark_results, validation_result, results_path)

    # Print recommendations
    if benchmark_results:
        print("\n" + "=" * 60)
        print("DEPLOYMENT RECOMMENDATIONS")
        print("=" * 60)

        best_fps = max(benchmark_results, key=lambda r: r.fps)
        smallest = min(benchmark_results, key=lambda r: r.file_size_mb)

        print(f"Fastest inference: {best_fps.format} ({best_fps.fps:.1f} FPS)")
        print(f"Smallest model:    {smallest.format} ({smallest.file_size_mb:.1f} MB)")
        print()
        print("Platform Recommendations:")
        print("  - Raspberry Pi 4/5: TFLite INT8")
        print("  - Jetson Nano/NX:   ONNX with TensorRT")
        print("  - Coral Edge TPU:   TFLite INT8 (with edgetpu delegate)")
        print("  - Desktop/Server:   PyTorch or ONNX")


if __name__ == '__main__':
    main()
