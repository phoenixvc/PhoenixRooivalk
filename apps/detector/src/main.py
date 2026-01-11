#!/usr/bin/env python3
"""
Real-time Drone Detection on Raspberry Pi

Modular architecture supporting hot-swappable components:
- Frame sources: Pi Camera, USB, video files, mock
- Inference engines: TFLite, ONNX, Coral TPU
- Trackers: None, Centroid, Kalman
- Renderers: OpenCV display, headless

Usage:
    # Auto-detect hardware and configure optimally
    python main.py --model models/drone-detector.tflite

    # With configuration file
    python main.py --config config.yaml

    # Generate default config file
    python main.py --generate-config config.yaml

    # With Coral TPU
    python main.py --model models/drone-detector_edgetpu.tflite --coral

    # Headless mode (no display)
    python main.py --model models/drone-detector.tflite --headless

    # With tracking and webhook alerts
    python main.py --model models/drone-detector.tflite --tracker kalman --alert-webhook http://...

    # Demo mode with mock data (no camera/model needed)
    python main.py --demo --mock
    
    # Real webcam with mock inference (test camera without model)
    python main.py --camera usb --engine mock
    
    # Mock camera with real model (test inference without camera)
    python main.py --camera mock --model models/drone-detector.tflite
"""

import argparse
import signal
import sys
from pathlib import Path

# Support running as both script and module
try:
    from .config.settings import Settings, create_default_config
    from .factory import DetectionPipeline, create_demo_pipeline, create_pipeline
except ImportError:
    # Running as script - add src to path
    src_dir = Path(__file__).parent
    if str(src_dir) not in sys.path:
        sys.path.insert(0, str(src_dir))
    from config.settings import Settings, create_default_config
    from factory import DetectionPipeline, create_demo_pipeline, create_pipeline


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Real-time drone detection with swappable components",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    # Configuration
    config_group = parser.add_argument_group("Configuration")
    config_group.add_argument(
        "--config",
        type=str,
        help="Path to YAML configuration file",
    )
    config_group.add_argument(
        "--generate-config",
        type=str,
        metavar="PATH",
        help="Generate default configuration file at PATH (e.g., config.yaml)",
    )

    # Model
    parser.add_argument(
        "--model",
        type=str,
        help="Path to model file (TFLite, ONNX)",
    )

    # Frame source
    source_group = parser.add_argument_group("Frame Source")
    source_group.add_argument(
        "--camera",
        type=str,
        default="auto",
        choices=["auto", "picamera", "usb", "mock"],
        help="Camera source type (default: auto)",
    )
    source_group.add_argument(
        "--camera-index",
        type=int,
        default=0,
        help="USB camera index (default: 0)",
    )
    source_group.add_argument(
        "--video",
        type=str,
        help="Use video file instead of camera",
    )
    source_group.add_argument(
        "--width",
        type=int,
        help="Capture width (default: auto from hardware)",
    )
    source_group.add_argument(
        "--height",
        type=int,
        help="Capture height (default: auto from hardware)",
    )
    source_group.add_argument(
        "--fps",
        type=int,
        help="Target FPS (default: auto from hardware)",
    )

    # Inference
    inference_group = parser.add_argument_group("Inference")
    inference_group.add_argument(
        "--engine",
        type=str,
        default="auto",
        choices=["auto", "tflite", "onnx", "coral", "mock"],
        help="Inference engine type (default: auto)",
    )
    inference_group.add_argument(
        "--coral",
        action="store_true",
        help="Use Coral Edge TPU if available",
    )
    inference_group.add_argument(
        "--confidence",
        type=float,
        default=0.5,
        help="Confidence threshold (default: 0.5)",
    )
    inference_group.add_argument(
        "--nms",
        type=float,
        default=0.45,
        help="NMS threshold (default: 0.45)",
    )

    # Tracking
    tracking_group = parser.add_argument_group("Tracking")
    tracking_group.add_argument(
        "--tracker",
        type=str,
        default="centroid",
        choices=["none", "centroid", "kalman"],
        help="Object tracker type (default: centroid)",
    )

    # Alerts
    alert_group = parser.add_argument_group("Alerts")
    alert_group.add_argument(
        "--alert-webhook",
        type=str,
        help="Webhook URL for drone alerts",
    )
    alert_group.add_argument(
        "--save-detections",
        type=str,
        help="Save detections to JSON file",
    )

    # Display
    display_group = parser.add_argument_group("Display")
    display_group.add_argument(
        "--headless",
        action="store_true",
        help="Run without display",
    )

    # Demo/testing
    demo_group = parser.add_argument_group("Demo/Testing")
    demo_group.add_argument(
        "--demo",
        action="store_true",
        help="Run in demo mode with optimized settings",
    )
    demo_group.add_argument(
        "--mock",
        action="store_true",
        help="Use mock camera and inference (no hardware needed)",
    )
    demo_group.add_argument(
        "--no-auto-configure",
        action="store_true",
        help="Disable automatic hardware-based configuration",
    )
    demo_group.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress hardware report",
    )

    return parser.parse_args()


def settings_to_pipeline_kwargs(settings: Settings, args) -> dict:
    """Convert Settings object to create_pipeline() keyword arguments."""
    # Get model path from settings or CLI args (CLI takes precedence)
    model_path = args.model if args.model else (getattr(settings.inference, "model_path", None) or None)
    if not model_path and not args.mock:
        model_path = "mock"  # Fallback for mock mode

    # Get camera type (CLI takes precedence, string enums compare directly to strings)
    if args.mock:
        camera_type = "mock"
    elif args.camera and args.camera != "auto":
        camera_type = args.camera
    else:
        camera_type = str(settings.camera_type)

    # Get video file from settings or args
    video_file = args.video if args.video else getattr(settings.capture, "video_path", None)

    # Get engine type (CLI takes precedence)
    if args.mock:
        engine_type = "mock"
    elif args.engine and args.engine != "auto":
        engine_type = args.engine
    else:
        engine_type = str(settings.engine_type)

    # Get tracker type (CLI takes precedence)
    tracker_type = args.tracker if args.tracker else str(settings.tracker_type)

    # Build kwargs with safe attribute access
    kwargs = {
        "model_path": model_path,
        "camera_source": camera_type,
        "camera_index": args.camera_index if args.camera_index is not None else getattr(settings.capture, "camera_index", 0),
        "video_file": video_file,
        "width": args.width if args.width is not None else getattr(settings.capture, "width", None),
        "height": args.height if args.height is not None else getattr(settings.capture, "height", None),
        "fps": args.fps if args.fps is not None else getattr(settings.capture, "fps", None),
        "engine_type": engine_type,
        "use_coral": args.coral if args.coral else getattr(settings.inference, "use_coral", False),
        "confidence_threshold": args.confidence if args.confidence is not None else getattr(settings.inference, "confidence_threshold", 0.5),
        "nms_threshold": args.nms if args.nms is not None else getattr(settings.inference, "nms_threshold", 0.45),
        "tracker_type": tracker_type,
        "alert_webhook": args.alert_webhook if args.alert_webhook else getattr(settings.alert, "webhook_url", None),
        "save_detections": args.save_detections if args.save_detections else getattr(settings.alert, "save_detections_path", None),
        "headless": args.headless if args.headless else getattr(settings.display, "headless", False),
        "stream_enabled": getattr(settings.streaming, "enabled", False),
        "stream_host": getattr(settings.streaming, "host", "0.0.0.0"),
        "stream_port": getattr(settings.streaming, "port", 8080),
        "stream_quality": getattr(settings.streaming, "quality", 80),
        "stream_max_fps": getattr(settings.streaming, "max_fps", 15),
        "stream_auth_enabled": getattr(settings.streaming, "auth_enabled", False),
        "stream_auth_token": getattr(settings.streaming, "auth_token", None),
        "auto_configure": not args.no_auto_configure,
        "print_hardware": not args.quiet,
    }
    return kwargs


def run_detection_loop(pipeline: DetectionPipeline) -> None:
    """
    Main detection loop.

    Reads frames, runs inference, updates tracker, handles alerts, renders.
    """
    print("\nStarting detection... Press 'q' to quit (or Ctrl+C)")
    print("-" * 50)

    try:
        while True:
            # Read frame
            frame_data = pipeline.frame_source.read()
            if frame_data is None:
                print("Failed to read frame")
                continue

            # Run inference
            result = pipeline.inference_engine.detect(frame_data.frame)

            # Update tracker
            tracked_objects = pipeline.tracker.update(
                result.detections,
                frame_data.frame,
            )

            # Send alerts for drones
            for det in result.detections:
                if det.is_drone:
                    pipeline.alert_handler.send_alert(det, frame_data)

            # Render
            rendered = pipeline.renderer.render(
                frame_data,
                result.detections,
                tracked_objects,
                result.inference_time_ms,
            )

            # Show (returns False if user wants to quit)
            if rendered is not None:
                if not pipeline.renderer.show(rendered):
                    break

    except KeyboardInterrupt:
        print("\nInterrupted by user")


def main():
    """Main entry point."""
    args = parse_args()

    # Handle --generate-config flag (exit early if used)
    if args.generate_config:
        try:
            config_path = Path(args.generate_config)
            create_default_config(str(config_path))
            print(f"Default configuration file created: {config_path.absolute()}")
            print(f"\nYou can now edit {config_path} and run with:")
            print(f"  python src/main.py --config {config_path}")
            sys.exit(0)
        except Exception as e:
            print(f"ERROR: Failed to create config file: {e}", file=sys.stderr)
            print(f"\nTip: Ensure the directory exists and you have write permissions.", file=sys.stderr)
            sys.exit(1)

    # Load settings from config file if provided
    settings = None
    if args.config:
        config_path = Path(args.config)
        if not config_path.exists():
            print(f"ERROR: Configuration file not found: {config_path.absolute()}", file=sys.stderr)
            print(f"\nTip: Generate a default config file with:", file=sys.stderr)
            print(f"  python src/main.py --generate-config {config_path}", file=sys.stderr)
            sys.exit(1)
        try:
            settings = Settings.from_yaml(str(config_path))
        except Exception as e:
            print(f"ERROR: Failed to load configuration file: {e}", file=sys.stderr)
            print(f"\nTip: Check that {config_path} is valid YAML format.", file=sys.stderr)
            sys.exit(1)

    # Handle demo mode
    if args.demo:
        if not args.model and not args.mock:
            print("ERROR: --model is required for demo mode unless using --mock", file=sys.stderr)
            print("\nTip: Use --mock to test without a model or camera", file=sys.stderr)
            sys.exit(1)

        pipeline = create_demo_pipeline(
            model_path=args.model or "mock",
            use_mock=args.mock,
            camera_source=args.camera if args.camera != "auto" else "auto",
        )
    else:
        # Validate model path (unless using mock mode or mock engine)
        using_mock_engine = args.mock or args.engine == "mock"
        if not args.model and not using_mock_engine:
            model_path_from_config = None
            if settings:
                model_path_from_config = getattr(settings.inference, "model_path", None)
                if model_path_from_config and model_path_from_config.strip():
                    # Model path from config file is valid
                    pass
                else:
                    model_path_from_config = None
            if not model_path_from_config:
                print("ERROR: --model is required (or use --mock/--engine mock to test without a model)", file=sys.stderr)
                print("\nTips:", file=sys.stderr)
                print("  - Use --model <path> to specify a model file", file=sys.stderr)
                print("  - Use --mock to test without a model or camera", file=sys.stderr)
                print("  - Use --engine mock to test with real camera but mock inference", file=sys.stderr)
                print("  - Use --config <file> to load model path from config file", file=sys.stderr)
                print("  - Use --help for full usage information", file=sys.stderr)
                sys.exit(1)

        # Create pipeline with settings from config file or CLI args
        if settings:
            kwargs = settings_to_pipeline_kwargs(settings, args)
            # If using mock engine without model, set model_path to "mock"
            if kwargs.get("engine_type") == "mock" and not kwargs.get("model_path"):
                kwargs["model_path"] = "mock"
            try:
                pipeline = create_pipeline(**kwargs)
            except Exception as e:
                print(f"ERROR: Failed to create pipeline: {e}", file=sys.stderr)
                print(f"\nTip: Check your configuration file and model path.", file=sys.stderr)
                sys.exit(1)
        else:
            # Use CLI args directly (existing behavior)
            # Determine model path - use mock if engine is mock and no model provided
            model_path = args.model
            if not model_path and (args.mock or args.engine == "mock"):
                model_path = "mock"
            
            pipeline = create_pipeline(
                model_path=model_path or "mock",
                camera_source="mock" if args.mock else args.camera,
                camera_index=args.camera_index,
                video_file=args.video,
                width=args.width,
                height=args.height,
                fps=args.fps,
                engine_type="mock" if args.mock else args.engine,
                use_coral=args.coral,
                confidence_threshold=args.confidence,
                nms_threshold=args.nms,
                tracker_type=args.tracker,
                alert_webhook=args.alert_webhook,
                save_detections=args.save_detections,
                headless=args.headless,
                auto_configure=not args.no_auto_configure,
                print_hardware=not args.quiet,
            )

    # Setup signal handler for clean shutdown
    def signal_handler(sig, frame):
        print("\nShutting down...")
        pipeline.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Start pipeline with better error handling
    try:
        if not pipeline.start():
            print("ERROR: Failed to start pipeline", file=sys.stderr)
            print("\nCommon issues:", file=sys.stderr)
            print("  - Camera not found: Check camera is connected and enabled", file=sys.stderr)
            print("  - Model file not found: Verify model path is correct", file=sys.stderr)
            print("  - Missing dependencies: Check installation with pip install -e '.[pi]'", file=sys.stderr)
            print("  - Use --mock to test without hardware", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: Pipeline startup failed: {e}", file=sys.stderr)
        print("\nTip: Use --mock to test without hardware, or check configuration.", file=sys.stderr)
        sys.exit(1)

    try:
        # Run main loop
        run_detection_loop(pipeline)
    finally:
        pipeline.stop()


if __name__ == "__main__":
    main()
