#!/usr/bin/env python3
"""
Audio PWM servo test utility.

Tests the audio-based servo PWM transport WITHOUT any hardware circuit.
Use this to verify the audio signal before building the transistor circuit.

What you'll hear:
- A low 50Hz buzz (this IS the servo signal)
- The buzz changes subtly as servo position changes
- Left ear = yaw, right ear = pitch

What you can measure:
- With a multimeter on AC mode across the headphone jack:
  you should see ~0.5-1.0V AC changing as position changes
- With an oscilloscope: you'll see a clean 50Hz square wave
  with variable pulse width (1000-2000μs)

Usage:
    # Interactive mode (keyboard control):
    python test_audio_pwm.py

    # Auto-sweep mode (servos sweep back and forth):
    python test_audio_pwm.py --sweep

    # Specific audio device:
    python test_audio_pwm.py --device 3

    # List available audio devices:
    python test_audio_pwm.py --list-devices

    # Test with simulated tracking (webcam + face/motion detection):
    python test_audio_pwm.py --track

WARNING: Turn your volume DOWN before running. The 50Hz square wave
is loud and unpleasant at high volume. Start at ~20% volume.
"""

import argparse
import logging
import math
import sys
import time
from pathlib import Path

# Support running from detector src directory
src_dir = Path(__file__).parent
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))


def list_audio_devices():
    """List available audio output devices."""
    try:
        import sounddevice as sd

        print("\nAvailable audio devices:")
        print("=" * 60)
        devices = sd.query_devices()
        for i, dev in enumerate(devices):
            if dev["max_output_channels"] > 0:
                default = ""
                if i == sd.default.device[1]:
                    default = " <-- DEFAULT OUTPUT"
                print(
                    f"  [{i}] {dev['name']} "
                    f"(out: {dev['max_output_channels']}ch, "
                    f"{dev['default_samplerate']:.0f}Hz)"
                    f"{default}"
                )
        print()
        print("Use --device <number> to select a specific device.")
        print("The default output device is usually correct.")
        print()
    except ImportError:
        print("ERROR: sounddevice not installed")
        print("  pip install sounddevice")
        sys.exit(1)


def run_sweep_test(device=None, buffer_size=512):
    """
    Sweep both servos back and forth continuously.

    Good for verifying the signal with a multimeter or oscilloscope.
    """
    from turret_transport import AudioPwmTransport, ControlOutput

    print("\n" + "=" * 60)
    print("  AUDIO PWM SWEEP TEST")
    print("=" * 60)
    print()
    print("  Both servos will sweep from -1.0 to +1.0 and back.")
    print("  Yaw = left channel, Pitch = right channel.")
    print()
    print("  What to check:")
    print("    - Headphones: low 50Hz buzz, changes as position moves")
    print("    - Multimeter (AC): ~0.3-1.0V on headphone jack")
    print("    - Oscilloscope: 50Hz square wave, 1000-2000μs pulse")
    print()
    print("  Press Ctrl+C to stop.")
    print()

    transport = AudioPwmTransport(device=device, buffer_size=buffer_size)
    if not transport.connect():
        print("ERROR: Failed to open audio device")
        sys.exit(1)

    try:
        sweep_period = 4.0  # seconds for full sweep cycle
        start_time = time.time()

        while True:
            elapsed = time.time() - start_time
            # Sine wave sweep: -1 to +1
            position = math.sin(2 * math.pi * elapsed / sweep_period)

            # Offset pitch slightly so they don't overlap on scope
            yaw_pos = position
            pitch_pos = math.sin(2 * math.pi * (elapsed + 1.0) / sweep_period)

            transport.send(ControlOutput(
                yaw_rate=yaw_pos,
                pitch_rate=pitch_pos,
            ))

            # Status display
            yaw_bar = _position_bar(yaw_pos)
            pitch_bar = _position_bar(pitch_pos)
            pulse_yaw = 1500 + int(yaw_pos * 500)
            pulse_pitch = 1500 + int(pitch_pos * 500)

            print(
                f"\r  YAW:  {yaw_bar} {yaw_pos:+.2f} ({pulse_yaw}μs)  "
                f"  PITCH: {pitch_bar} {pitch_pos:+.2f} ({pulse_pitch}μs)  ",
                end="",
                flush=True,
            )

            time.sleep(0.033)  # ~30Hz update rate

    except KeyboardInterrupt:
        print("\n\nStopping...")
    finally:
        transport.disconnect()
        print("Done.")


def run_interactive_test(device=None, buffer_size=512):
    """
    Interactive keyboard control of both servos.

    Keys:
        A/D = yaw left/right
        W/S = pitch up/down
        Space = center both
        Q = quit
    """
    from turret_transport import AudioPwmTransport, ControlOutput

    print("\n" + "=" * 60)
    print("  AUDIO PWM INTERACTIVE TEST")
    print("=" * 60)
    print()
    print("  Controls:")
    print("    A / D  = yaw left / right")
    print("    W / S  = pitch up / down")
    print("    Space  = center both servos")
    print("    +/-    = increase/decrease step size")
    print("    Q      = quit")
    print()
    print("  Turn volume to ~20% before starting!")
    print()

    transport = AudioPwmTransport(device=device, buffer_size=buffer_size)
    if not transport.connect():
        print("ERROR: Failed to open audio device")
        sys.exit(1)

    # Platform-specific key reading
    try:
        import tty
        import termios

        def get_key():
            fd = sys.stdin.fileno()
            old = termios.tcgetattr(fd)
            try:
                tty.setraw(fd)
                ch = sys.stdin.read(1)
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old)
            return ch

    except ImportError:
        # Windows fallback
        import msvcrt

        def get_key():
            return msvcrt.getch().decode("utf-8", errors="ignore")

    yaw = 0.0
    pitch = 0.0
    step = 0.1

    try:
        while True:
            # Display
            yaw_bar = _position_bar(yaw)
            pitch_bar = _position_bar(pitch)
            pulse_yaw = 1500 + int(yaw * 500)
            pulse_pitch = 1500 + int(pitch * 500)

            print(
                f"\r  YAW:  {yaw_bar} {yaw:+.2f} ({pulse_yaw}μs)  "
                f"  PITCH: {pitch_bar} {pitch:+.2f} ({pulse_pitch}μs)  "
                f"  step={step:.2f}  ",
                end="",
                flush=True,
            )

            key = get_key().lower()

            if key == "q":
                break
            elif key == "a":
                yaw = max(-1.0, yaw - step)
            elif key == "d":
                yaw = min(1.0, yaw + step)
            elif key == "w":
                pitch = min(1.0, pitch + step)
            elif key == "s":
                pitch = max(-1.0, pitch - step)
            elif key == " ":
                yaw = 0.0
                pitch = 0.0
            elif key == "+":
                step = min(0.5, step + 0.05)
            elif key == "-":
                step = max(0.01, step - 0.05)

            transport.send(ControlOutput(yaw_rate=yaw, pitch_rate=pitch))

    except KeyboardInterrupt:
        pass
    finally:
        print("\n\nStopping...")
        transport.disconnect()
        print("Done.")


def run_tracking_test(device=None, buffer_size=512, camera_index=0):
    """
    Test with webcam: tracks the largest moving object and
    outputs audio PWM to center on it.

    This is the full pipeline test without any ML model:
    webcam -> motion detection -> centroid -> PID -> audio PWM
    """
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("ERROR: opencv-python not installed")
        print("  pip install opencv-python")
        sys.exit(1)

    from turret_controller import AuthorityMode, PIDController, TurretController
    from turret_transport import AudioPwmTransport

    print("\n" + "=" * 60)
    print("  AUDIO PWM TRACKING TEST")
    print("=" * 60)
    print()
    print("  Opens webcam, detects motion, outputs servo commands")
    print("  as audio PWM. Move an object in front of the camera.")
    print()
    print("  Controls:")
    print("    M = manual override (stops tracking)")
    print("    T = resume auto-tracking")
    print("    Q = quit")
    print()

    # Create transport
    transport = AudioPwmTransport(device=device, buffer_size=buffer_size)

    # Create controller with PID
    controller = TurretController(
        transport=transport,
        yaw_pid=PIDController(kp=0.8, ki=0.05, kd=0.15),
        pitch_pid=PIDController(kp=0.6, ki=0.03, kd=0.10),
    )

    if not controller.start():
        print("ERROR: Failed to start controller")
        sys.exit(1)

    controller.set_mode(AuthorityMode.AUTO_TRACK)

    # Open webcam
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print("ERROR: Cannot open webcam")
        controller.stop()
        sys.exit(1)

    # Background subtractor for motion detection
    bg_sub = cv2.createBackgroundSubtractorMOG2(
        history=100, varThreshold=50, detectShadows=False
    )

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    print(f"  Webcam: {frame_width}x{frame_height}")
    print(f"  Audio: {transport.transport_info}")
    print()

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                continue

            # Motion detection
            fg_mask = bg_sub.apply(frame)
            fg_mask = cv2.morphologyEx(
                fg_mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)
            )
            fg_mask = cv2.morphologyEx(
                fg_mask, cv2.MORPH_DILATE, np.ones((15, 15), np.uint8)
            )

            # Find largest contour
            contours, _ = cv2.findContours(
                fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            target_center = None
            if contours:
                largest = max(contours, key=cv2.contourArea)
                area = cv2.contourArea(largest)
                if area > 500:  # Minimum area threshold
                    x, y, w, h = cv2.boundingRect(largest)
                    target_center = (x + w // 2, y + h // 2)

                    # Draw on frame
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                    cv2.circle(frame, target_center, 5, (0, 0, 255), -1)

            # Update controller
            output = controller.update_from_target_lock(
                target_center=target_center,
                frame_width=frame_width,
                frame_height=frame_height,
            )

            # Draw crosshair at frame center
            cx, cy = frame_width // 2, frame_height // 2
            cv2.line(frame, (cx - 20, cy), (cx + 20, cy), (255, 255, 255), 1)
            cv2.line(frame, (cx, cy - 20), (cx, cy + 20), (255, 255, 255), 1)

            # Draw status
            status = controller.get_status()
            mode = status["authority"]["state"]["mode"]
            cv2.putText(
                frame,
                f"Mode: {mode} | Yaw: {output.yaw_rate:+.2f} | Pitch: {output.pitch_rate:+.2f}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 255),
                2,
            )

            # Pulse width display
            pulse_yaw = 1500 + int(output.yaw_rate * 500)
            pulse_pitch = 1500 + int(output.pitch_rate * 500)
            cv2.putText(
                frame,
                f"PWM: Yaw={pulse_yaw}us  Pitch={pulse_pitch}us",
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 255),
                2,
            )

            cv2.imshow("Audio PWM Tracking Test", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            elif key == ord("m"):
                controller.manual_override()
                print("\n  MANUAL OVERRIDE")
            elif key == ord("t"):
                controller.set_mode(AuthorityMode.AUTO_TRACK)
                print("\n  AUTO TRACKING")

    except KeyboardInterrupt:
        pass
    finally:
        print("\nStopping...")
        cap.release()
        cv2.destroyAllWindows()
        controller.stop()
        print("Done.")


def _position_bar(value: float, width: int = 21) -> str:
    """Create a visual position bar: [-------|-------]"""
    center = width // 2
    pos = int((value + 1.0) / 2.0 * (width - 1))
    pos = max(0, min(width - 1, pos))

    bar = ["-"] * width
    bar[center] = "|"
    if pos == center:
        bar[pos] = "+"  # Centered: show both markers merged
    else:
        bar[pos] = "#"
    return "[" + "".join(bar) + "]"


def main():
    parser = argparse.ArgumentParser(
        description="Test audio PWM servo transport",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--list-devices",
        action="store_true",
        help="List available audio output devices and exit",
    )
    parser.add_argument(
        "--device",
        type=int,
        default=None,
        help="Audio output device index (default: system default)",
    )
    parser.add_argument(
        "--buffer-size",
        type=int,
        default=512,
        help="Audio buffer size (default: 512, lower=less latency)",
    )
    parser.add_argument(
        "--sweep",
        action="store_true",
        help="Auto-sweep mode (servos move back and forth)",
    )
    parser.add_argument(
        "--track",
        action="store_true",
        help="Webcam tracking mode (motion detection -> servo control)",
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Camera device index for tracking mode (default: 0)",
    )

    args = parser.parse_args()

    if args.list_devices:
        list_audio_devices()
        return

    # Configure logging for turret modules
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(name)s %(levelname)s: %(message)s",
    )

    print()
    print("  WARNING: Turn volume to ~20% before continuing!")
    print("  The 50Hz square wave is loud and unpleasant at full volume.")
    print()

    if args.sweep:
        run_sweep_test(device=args.device, buffer_size=args.buffer_size)
    elif args.track:
        run_tracking_test(
            device=args.device,
            buffer_size=args.buffer_size,
            camera_index=args.camera,
        )
    else:
        run_interactive_test(device=args.device, buffer_size=args.buffer_size)


if __name__ == "__main__":
    main()
