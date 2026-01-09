#!/usr/bin/env python3
"""
Factory for creating and wiring detection pipeline components.

This is the main entry point for assembling the system based on:
- Detected hardware
- Command-line arguments
- Configuration files
"""

from dataclasses import dataclass
from typing import Any, Optional

from .alert_handlers import CompositeAlertHandler, ConsoleAlertHandler, create_alert_handler
from .frame_sources import create_frame_source
from .hardware import detect_hardware, print_hardware_report
from .inference_engines import create_inference_engine
from .interfaces import (
    AlertHandler,
    FrameRenderer,
    FrameSource,
    HardwareProfile,
    InferenceEngine,
    ObjectTracker,
    PipelineConfig,
)
from .renderers import create_renderer
from .trackers import create_tracker

# Optional streaming imports
try:
    from .streaming import (
        create_streaming_manager,
        create_streaming_renderer,
    )
    STREAMING_AVAILABLE = True
except ImportError:
    STREAMING_AVAILABLE = False


@dataclass
class DetectionPipeline:
    """Container for all pipeline components."""
    frame_source: FrameSource
    inference_engine: InferenceEngine
    tracker: ObjectTracker
    alert_handler: AlertHandler
    renderer: FrameRenderer
    config: PipelineConfig
    hardware: HardwareProfile
    streaming_manager: Optional[Any] = None  # Optional StreamingManager

    def start(self) -> bool:
        """Initialize and start all components."""
        if not self.frame_source.is_open():
            if not self.frame_source.open():
                print("ERROR: Failed to open frame source")
                return False

        print("\nPipeline started:")
        print(f"  Frame source: {self.frame_source.source_info['type']}")
        print(f"  Resolution: {self.frame_source.resolution}")
        print(f"  Inference: {self.inference_engine.engine_info['type']}")
        print(f"  Tracker: {self.tracker.tracker_info['type']}")
        print(f"  Renderer: {self.renderer.renderer_info['type']}")

        # Start streaming server if configured
        if self.streaming_manager is not None:
            self.streaming_manager.start()
            print(f"  Streaming: {self.streaming_manager.url}")

        return True

    def stop(self) -> None:
        """Stop and clean up all components."""
        # Stop streaming first
        if self.streaming_manager is not None:
            self.streaming_manager.stop()

        self.alert_handler.flush()
        self.frame_source.close()
        self.renderer.close()
        print("\nPipeline stopped")

    def update_streaming_status(self, status: dict) -> None:
        """Update system status for streaming server."""
        if self.streaming_manager is not None:
            self.streaming_manager.set_system_status(status)


def create_pipeline(
    model_path: str,
    # Frame source options
    camera_source: str = "auto",
    camera_index: int = 0,
    video_file: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    fps: Optional[int] = None,
    # Inference options
    engine_type: str = "auto",
    use_coral: bool = False,
    confidence_threshold: float = 0.5,
    nms_threshold: float = 0.45,
    # Tracker options
    tracker_type: str = "centroid",
    # Alert options
    alert_webhook: Optional[str] = None,
    save_detections: Optional[str] = None,
    # Display options
    headless: bool = False,
    # Streaming options
    stream_enabled: bool = False,
    stream_host: str = "0.0.0.0",
    stream_port: int = 8080,
    stream_quality: int = 80,
    stream_max_fps: int = 15,
    stream_auth_enabled: bool = False,
    stream_auth_token: Optional[str] = None,
    # Hardware options
    auto_configure: bool = True,
    print_hardware: bool = True,
) -> DetectionPipeline:
    """
    Create a complete detection pipeline.

    This factory handles all the wiring based on what's available.

    Args:
        model_path: Path to the ML model file
        camera_source: "auto", "picamera", "usb", "video", "mock"
        camera_index: USB camera index (if using USB)
        video_file: Video file path (if using video source)
        width: Capture width (None = auto from hardware)
        height: Capture height (None = auto from hardware)
        fps: Capture FPS (None = auto from hardware)
        engine_type: "auto", "tflite", "onnx", "coral", "mock"
        use_coral: Prefer Coral TPU if available
        confidence_threshold: Minimum confidence for detections
        nms_threshold: NMS IoU threshold
        tracker_type: "none", "centroid", "kalman"
        alert_webhook: Webhook URL for alerts (optional)
        save_detections: JSON file path for logging (optional)
        headless: Run without display
        stream_enabled: Enable MJPEG streaming server
        stream_host: Streaming server bind host
        stream_port: Streaming server port
        stream_quality: JPEG quality (10-100)
        stream_max_fps: Maximum stream FPS
        stream_auth_enabled: Enable token authentication
        stream_auth_token: Bearer token for authentication
        auto_configure: Use hardware detection for settings
        print_hardware: Print hardware report on startup

    Returns:
        Configured DetectionPipeline ready to run
    """
    # Detect hardware
    hardware = detect_hardware()

    if print_hardware:
        print_hardware_report(hardware)

    # Build configuration
    config = PipelineConfig(
        model_path=model_path,
        confidence_threshold=confidence_threshold,
        nms_threshold=nms_threshold,
        use_accelerator=use_coral or hardware.accelerator_available,
        enable_tracking=(tracker_type != "none"),
        headless=headless,
        save_detections_path=save_detections,
    )

    # Apply auto-configuration from hardware if requested
    if auto_configure:
        config.capture_width = width or hardware.recommended_capture_resolution[0]
        config.capture_height = height or hardware.recommended_capture_resolution[1]
        config.capture_fps = fps or hardware.recommended_capture_fps
        config.model_input_size = hardware.recommended_model_input[0]
        config.inference_threads = hardware.recommended_inference_threads
    else:
        config.capture_width = width or 640
        config.capture_height = height or 480
        config.capture_fps = fps or 30

    # Create frame source
    if video_file:
        frame_source = create_frame_source(
            source_type="video",
            file_path=video_file,
            loop=True,
        )
    else:
        frame_source = create_frame_source(
            source_type=camera_source,
            camera_index=camera_index,
            width=config.capture_width,
            height=config.capture_height,
            fps=config.capture_fps,
        )

    # Create inference engine
    inference_engine = create_inference_engine(
        engine_type=engine_type,
        model_path=model_path,
        use_coral=config.use_accelerator,
        confidence_threshold=config.confidence_threshold,
        nms_threshold=config.nms_threshold,
        num_threads=config.inference_threads,
    )

    # Create tracker
    tracker = create_tracker(
        tracker_type=tracker_type,
        max_disappeared=30,
        max_distance=100.0 if tracker_type == "centroid" else 150.0,
    )

    # Create alert handler(s)
    handlers = []

    # Always add console handler for drones
    handlers.append(ConsoleAlertHandler())

    # Add webhook if configured
    if alert_webhook:
        handlers.append(create_alert_handler(
            handler_type="webhook",
            webhook_url=alert_webhook,
            throttle=True,
            cooldown_per_track=5.0,
        ))

    # Add file logger if configured
    if save_detections:
        handlers.append(create_alert_handler(
            handler_type="file",
            file_path=save_detections,
        ))

    if len(handlers) == 1:
        alert_handler = handlers[0]
    else:
        alert_handler = CompositeAlertHandler(handlers)

    # Create renderer
    base_renderer = create_renderer(
        headless=headless,
        show_fps=True,
        show_drone_score=True,
        show_track_id=config.enable_tracking,
    )

    # Wrap with streaming renderer if enabled
    streaming_manager = None
    if stream_enabled and STREAMING_AVAILABLE:
        streaming_renderer = create_streaming_renderer(
            base_renderer=base_renderer,
            streaming_settings=None,  # Use direct params below
        )
        streaming_renderer._quality = stream_quality
        streaming_renderer._max_fps = stream_max_fps
        streaming_renderer._min_frame_interval = 1.0 / stream_max_fps

        streaming_manager = create_streaming_manager(
            streaming_renderer=streaming_renderer,
            streaming_settings=None,  # Use direct params below
        )
        streaming_manager._host = stream_host
        streaming_manager._port = stream_port
        streaming_manager._auth_enabled = stream_auth_enabled
        streaming_manager._auth_token = stream_auth_token

        renderer = streaming_renderer
    elif stream_enabled and not STREAMING_AVAILABLE:
        print("WARNING: Streaming requested but aiohttp not available")
        print("         Install with: pip install aiohttp")
        renderer = base_renderer
    else:
        renderer = base_renderer

    return DetectionPipeline(
        frame_source=frame_source,
        inference_engine=inference_engine,
        tracker=tracker,
        alert_handler=alert_handler,
        renderer=renderer,
        config=config,
        hardware=hardware,
        streaming_manager=streaming_manager,
    )


def create_minimal_pipeline(
    model_path: str,
    headless: bool = True,
) -> DetectionPipeline:
    """
    Create a minimal pipeline for resource-constrained devices.

    Uses smallest settings, no tracking, no fancy features.
    """
    return create_pipeline(
        model_path=model_path,
        camera_source="auto",
        width=480,
        height=360,
        fps=24,
        engine_type="tflite",
        tracker_type="none",
        headless=headless,
        auto_configure=False,
    )


def create_demo_pipeline(
    model_path: str,
    use_mock: bool = False,
) -> DetectionPipeline:
    """
    Create a pipeline optimized for demo/presentation.

    Good visuals, tracking enabled, balanced performance.
    """
    return create_pipeline(
        model_path=model_path,
        camera_source="mock" if use_mock else "auto",
        engine_type="mock" if use_mock else "auto",
        tracker_type="centroid",
        headless=False,
        auto_configure=True,
        print_hardware=True,
    )
