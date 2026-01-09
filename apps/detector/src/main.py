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

    # With Coral TPU
    python main.py --model models/drone-detector_edgetpu.tflite --coral

    # Headless mode (no display)
    python main.py --model models/drone-detector.tflite --headless

    # With tracking and webhook alerts
    python main.py --model models/drone-detector.tflite --tracker kalman --alert-webhook http://...

    # Demo mode with mock data (no camera/model needed)
    python main.py --demo --mock
"""

import argparse
import sys
import signal
from pathlib import Path
from typing import Optional

# Support running as both script and module
try:
    from .factory import create_pipeline, create_demo_pipeline, DetectionPipeline
except ImportError:
    # Running as script - add src to path
    src_dir = Path(__file__).parent
    if str(src_dir) not in sys.path:
        sys.path.insert(0, str(src_dir))
    from factory import create_pipeline, create_demo_pipeline, DetectionPipeline


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Real-time drone detection with swappable components',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    # Model
    parser.add_argument(
        '--model', type=str,
        help='Path to model file (TFLite, ONNX)',
    )

    # Frame source
    source_group = parser.add_argument_group('Frame Source')
    source_group.add_argument(
        '--camera', type=str, default='auto',
        choices=['auto', 'picamera', 'usb', 'mock'],
        help='Camera source type (default: auto)',
    )
    source_group.add_argument(
        '--camera-index', type=int, default=0,
        help='USB camera index (default: 0)',
    )
    source_group.add_argument(
        '--video', type=str,
        help='Use video file instead of camera',
    )
    source_group.add_argument(
        '--width', type=int,
        help='Capture width (default: auto from hardware)',
    )
    source_group.add_argument(
        '--height', type=int,
        help='Capture height (default: auto from hardware)',
    )
    source_group.add_argument(
        '--fps', type=int,
        help='Target FPS (default: auto from hardware)',
    )

    # Inference
    inference_group = parser.add_argument_group('Inference')
    inference_group.add_argument(
        '--engine', type=str, default='auto',
        choices=['auto', 'tflite', 'onnx', 'coral', 'mock'],
        help='Inference engine type (default: auto)',
    )
    inference_group.add_argument(
        '--coral', action='store_true',
        help='Use Coral Edge TPU if available',
    )
    inference_group.add_argument(
        '--confidence', type=float, default=0.5,
        help='Confidence threshold (default: 0.5)',
    )
    inference_group.add_argument(
        '--nms', type=float, default=0.45,
        help='NMS threshold (default: 0.45)',
    )

    # Tracking
    tracking_group = parser.add_argument_group('Tracking')
    tracking_group.add_argument(
        '--tracker', type=str, default='centroid',
        choices=['none', 'centroid', 'kalman'],
        help='Object tracker type (default: centroid)',
    )

    # Alerts
    alert_group = parser.add_argument_group('Alerts')
    alert_group.add_argument(
        '--alert-webhook', type=str,
        help='Webhook URL for drone alerts',
    )
    alert_group.add_argument(
        '--save-detections', type=str,
        help='Save detections to JSON file',
    )

    # Display
    display_group = parser.add_argument_group('Display')
    display_group.add_argument(
        '--headless', action='store_true',
        help='Run without display',
    )

    # Demo/testing
    demo_group = parser.add_argument_group('Demo/Testing')
    demo_group.add_argument(
        '--demo', action='store_true',
        help='Run in demo mode with optimized settings',
    )
    demo_group.add_argument(
        '--mock', action='store_true',
        help='Use mock camera and inference (no hardware needed)',
    )
    demo_group.add_argument(
        '--no-auto-configure', action='store_true',
        help='Disable automatic hardware-based configuration',
    )
    demo_group.add_argument(
        '--quiet', action='store_true',
        help='Suppress hardware report',
    )

    return parser.parse_args()


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

    # Handle demo mode
    if args.demo:
        if not args.model and not args.mock:
            print("ERROR: --model required unless using --mock")
            sys.exit(1)

        pipeline = create_demo_pipeline(
            model_path=args.model or "mock",
            use_mock=args.mock,
        )
    else:
        # Validate model path
        if not args.model and not args.mock:
            print("ERROR: --model is required")
            print("Use --help for usage information")
            sys.exit(1)

        # Create pipeline with specified options
        pipeline = create_pipeline(
            model_path=args.model or "mock",
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

    # Start pipeline
    if not pipeline.start():
        print("ERROR: Failed to start pipeline")
        sys.exit(1)

    try:
        # Run main loop
        run_detection_loop(pipeline)
    finally:
        pipeline.stop()


if __name__ == '__main__':
    main()
