#!/usr/bin/env python3
"""
Real-time Drone Detection on Raspberry Pi

Usage:
    python main.py --model models/drone-detector_int8.tflite
    python main.py --model models/drone-detector_int8.tflite --coral  # With Coral USB
    python main.py --model models/drone-detector_int8.tflite --headless  # No display
"""

import argparse
import sys
import json
from datetime import datetime

import cv2

from detector import DroneDetector, draw_detections


def get_camera(source: int = 0, width: int = 640, height: int = 480) -> cv2.VideoCapture:
    """Initialize camera with optimal settings for Pi."""
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        # Try Pi Camera with libcamera
        cap = cv2.VideoCapture(f"libcamera-vid -t 0 --inline --width {width} --height {height} -o -", cv2.CAP_GSTREAMER)

    if cap.isOpened():
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        cap.set(cv2.CAP_PROP_FPS, 30)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce latency

    return cap


def main():
    parser = argparse.ArgumentParser(description='Real-time drone detection on Raspberry Pi')
    parser.add_argument('--model', type=str, required=True, help='Path to TFLite model')
    parser.add_argument('--camera', type=int, default=0, help='Camera index')
    parser.add_argument('--width', type=int, default=640, help='Camera width')
    parser.add_argument('--height', type=int, default=480, help='Camera height')
    parser.add_argument('--confidence', type=float, default=0.5, help='Confidence threshold')
    parser.add_argument('--coral', action='store_true', help='Use Coral Edge TPU')
    parser.add_argument('--headless', action='store_true', help='Run without display')
    parser.add_argument('--save-detections', type=str, help='Save detections to JSON file')
    parser.add_argument('--alert-webhook', type=str, help='Webhook URL for drone alerts')
    args = parser.parse_args()

    # Initialize detector
    print("Initializing detector...")
    detector = DroneDetector(
        model_path=args.model,
        confidence_threshold=args.confidence,
        use_coral=args.coral,
    )

    # Initialize camera
    print("Initializing camera...")
    cap = get_camera(args.camera, args.width, args.height)

    if not cap.isOpened():
        print("ERROR: Could not open camera")
        print("Try: sudo modprobe bcm2835-v4l2")
        sys.exit(1)

    print(f"Camera resolution: {int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}")

    # Detection log
    detections_log = []
    frame_count = 0
    fps_history = []

    print("\nStarting detection... Press 'q' to quit")
    print("-" * 50)

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame")
                continue

            frame_count += 1

            # Run detection
            detections, inference_time = detector.detect(frame)

            # Track FPS
            fps = 1000 / inference_time if inference_time > 0 else 0
            fps_history.append(fps)
            if len(fps_history) > 30:
                fps_history.pop(0)
            avg_fps = sum(fps_history) / len(fps_history)

            # Log detections
            for det in detections:
                detection_record = {
                    'timestamp': datetime.now().isoformat(),
                    'frame': frame_count,
                    **det.to_dict(),
                }
                detections_log.append(detection_record)

                # Print drone alerts
                if det.is_drone:
                    print(f"[DRONE DETECTED] conf={det.confidence:.2f} score={det.drone_score:.2f} bbox={det.bbox}")

                    # Send webhook alert if configured
                    if args.alert_webhook:
                        send_alert(args.alert_webhook, detection_record)

            # Display (unless headless)
            if not args.headless:
                display_frame = draw_detections(frame, detections, inference_time)

                # Add status bar
                status = f"Frame: {frame_count} | Avg FPS: {avg_fps:.1f} | Detections: {len(detections)}"
                cv2.putText(
                    display_frame, status,
                    (10, display_frame.shape[0] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1
                )

                cv2.imshow('Drone Detection', display_frame)

                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('s'):
                    # Save screenshot
                    filename = f"detection_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                    cv2.imwrite(filename, display_frame)
                    print(f"Saved: {filename}")

            # Periodic status (headless mode)
            elif frame_count % 30 == 0:
                print(f"Frame {frame_count} | FPS: {avg_fps:.1f} | Detections: {len(detections)}")

    except KeyboardInterrupt:
        print("\nStopping...")

    finally:
        cap.release()
        cv2.destroyAllWindows()

        # Save detection log
        if args.save_detections and detections_log:
            with open(args.save_detections, 'w') as f:
                json.dump(detections_log, f, indent=2)
            print(f"Saved {len(detections_log)} detections to {args.save_detections}")

        print(f"\nProcessed {frame_count} frames")
        if fps_history:
            print(f"Average FPS: {sum(fps_history) / len(fps_history):.1f}")


def send_alert(webhook_url: str, detection: dict):
    """Send drone detection alert to webhook."""
    try:
        from urllib.parse import urlparse
        import urllib.request
        import urllib.error
        import json

        # Validate URL scheme to prevent file:// and other unsafe schemes
        parsed = urlparse(webhook_url)
        if parsed.scheme not in ('http', 'https'):
            print(f"Webhook error: Invalid URL scheme '{parsed.scheme}' - only http/https allowed")
            return

        data = json.dumps({
            'event': 'drone_detected',
            'detection': detection,
        }).encode('utf-8')

        req = urllib.request.Request(
            webhook_url,
            data=data,
            headers={'Content-Type': 'application/json'},
        )
        # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected
        urllib.request.urlopen(req, timeout=5)  # nosec B310 - URL scheme validated above
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        print(f"Webhook error: {e}")


if __name__ == '__main__':
    main()
