"""
Detector - Modular detection system for edge devices.

Platform-agnostic design supporting Raspberry Pi, Jetson, and desktop.

Components can be hot-swapped based on available hardware:
- Frame sources: Pi Camera, USB webcam, video files, mock
- Inference engines: TFLite, ONNX, Coral TPU, mock
- Trackers: NoOp, Centroid, Kalman
- Alert handlers: Console, Webhook, File, Composite
- Renderers: OpenCV display, Headless, Streaming

Usage:
    from detector.src import create_pipeline

    pipeline = create_pipeline(
        model_path='models/detector.tflite',
        tracker_type='kalman',
        headless=True,
    )

    pipeline.start()
    # ... run detection loop
    pipeline.stop()
"""

from .factory import (
    DetectionPipeline,
    create_demo_pipeline,
    create_minimal_pipeline,
    create_pipeline,
)
from .hardware import detect_hardware, print_hardware_report
from .interfaces import (
    AlertHandler,
    BoundingBox,
    Detection,
    FrameData,
    FrameRenderer,
    FrameSource,
    HardwareProfile,
    InferenceEngine,
    InferenceResult,
    ObjectTracker,
    PipelineConfig,
    TrackedObject,
)

__version__ = "2.0.0"
__all__ = [
    # Interfaces
    "FrameSource",
    "InferenceEngine",
    "ObjectTracker",
    "AlertHandler",
    "FrameRenderer",
    # Data classes
    "Detection",
    "BoundingBox",
    "TrackedObject",
    "InferenceResult",
    "FrameData",
    "HardwareProfile",
    "PipelineConfig",
    # Factory
    "create_pipeline",
    "create_demo_pipeline",
    "create_minimal_pipeline",
    "DetectionPipeline",
    # Hardware
    "detect_hardware",
    "print_hardware_report",
]
