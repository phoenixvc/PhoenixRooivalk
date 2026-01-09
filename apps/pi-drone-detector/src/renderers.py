#!/usr/bin/env python3
"""
Frame renderer implementations for visualization.

Supports display via OpenCV, headless operation, or future web streaming.
"""

from typing import List, Dict, Any, Optional, Tuple

import numpy as np

from .interfaces import FrameRenderer, FrameData, Detection, TrackedObject


class OpenCVRenderer(FrameRenderer):
    """Display frames using OpenCV window."""

    def __init__(
        self,
        window_name: str = "Drone Detection",
        show_fps: bool = True,
        show_drone_score: bool = True,
        show_track_id: bool = True,
        drone_color: Tuple[int, int, int] = (0, 0, 255),  # Red (BGR)
        non_drone_color: Tuple[int, int, int] = (0, 255, 0),  # Green
        prediction_color: Tuple[int, int, int] = (255, 165, 0),  # Orange
    ):
        self._window_name = window_name
        self._show_fps = show_fps
        self._show_drone_score = show_drone_score
        self._show_track_id = show_track_id
        self._drone_color = drone_color
        self._non_drone_color = non_drone_color
        self._prediction_color = prediction_color
        self._window_created = False

    def render(
        self,
        frame_data: FrameData,
        detections: List[Detection],
        tracked_objects: List[TrackedObject],
        inference_time_ms: float,
    ) -> Optional[np.ndarray]:
        import cv2

        frame = frame_data.frame.copy()

        # Draw tracked objects (with predictions)
        track_map = {t.track_id: t for t in tracked_objects}

        for det in detections:
            x1, y1, x2, y2 = det.bbox.to_tuple()

            # Color based on classification
            if det.is_drone:
                color = self._drone_color
                label = f"DRONE {det.confidence:.2f}"
            else:
                color = self._non_drone_color
                label = f"{det.class_name} {det.confidence:.2f}"

            # Add track ID if available
            if self._show_track_id and det.track_id is not None:
                label = f"[{det.track_id}] {label}"

            # Draw bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

            # Draw label background
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(frame, (x1, y1 - th - 10), (x1 + tw + 10, y1), color, -1)

            # Draw label text
            cv2.putText(
                frame, label, (x1 + 5, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1
            )

            # Draw drone score bar
            if self._show_drone_score:
                score_width = int(det.drone_score * 100)
                cv2.rectangle(frame, (x1, y2 + 5), (x1 + 100, y2 + 15), (100, 100, 100), -1)
                cv2.rectangle(frame, (x1, y2 + 5), (x1 + score_width, y2 + 15), (0, 0, 255), -1)

            # Draw predicted position if tracking
            if det.track_id is not None and det.track_id in track_map:
                tracked = track_map[det.track_id]
                if tracked.predicted_position:
                    px, py = tracked.predicted_position
                    cv2.circle(frame, (px, py), 5, self._prediction_color, -1)
                    # Draw velocity vector
                    vx, vy = tracked.velocity
                    if abs(vx) > 1 or abs(vy) > 1:
                        cx, cy = det.bbox.center
                        end_x = int(cx + vx * 5)
                        end_y = int(cy + vy * 5)
                        cv2.arrowedLine(frame, (cx, cy), (end_x, end_y), self._prediction_color, 2)

        # Draw FPS/inference time
        if self._show_fps:
            fps = 1000 / inference_time_ms if inference_time_ms > 0 else 0
            cv2.putText(
                frame, f"FPS: {fps:.1f} ({inference_time_ms:.1f}ms)",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2
            )

        # Draw frame info
        status = f"Frame: {frame_data.frame_number} | Detections: {len(detections)} | Tracks: {len(tracked_objects)}"
        cv2.putText(
            frame, status,
            (10, frame.shape[0] - 10),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1
        )

        return frame

    def show(self, rendered_frame: np.ndarray) -> bool:
        import cv2

        if not self._window_created:
            cv2.namedWindow(self._window_name, cv2.WINDOW_NORMAL)
            self._window_created = True

        cv2.imshow(self._window_name, rendered_frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            return False
        elif key == ord('s'):
            # Save screenshot
            from datetime import datetime
            filename = f"detection_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            cv2.imwrite(filename, rendered_frame)
            print(f"Saved: {filename}")

        return True

    def close(self) -> None:
        import cv2
        cv2.destroyAllWindows()
        self._window_created = False

    @property
    def renderer_info(self) -> Dict[str, Any]:
        return {
            'type': 'opencv',
            'window_name': self._window_name,
            'show_fps': self._show_fps,
            'show_drone_score': self._show_drone_score,
        }


class HeadlessRenderer(FrameRenderer):
    """No display, just periodic logging."""

    def __init__(
        self,
        log_interval: int = 30,
        verbose: bool = False,
    ):
        self._log_interval = log_interval
        self._verbose = verbose
        self._frame_count = 0
        self._fps_history: List[float] = []

    def render(
        self,
        frame_data: FrameData,
        detections: List[Detection],
        tracked_objects: List[TrackedObject],
        inference_time_ms: float,
    ) -> Optional[np.ndarray]:
        self._frame_count += 1

        # Track FPS
        fps = 1000 / inference_time_ms if inference_time_ms > 0 else 0
        self._fps_history.append(fps)
        if len(self._fps_history) > 30:
            self._fps_history.pop(0)

        # Periodic logging
        if self._frame_count % self._log_interval == 0:
            avg_fps = sum(self._fps_history) / len(self._fps_history) if self._fps_history else 0
            print(f"Frame {self._frame_count} | FPS: {avg_fps:.1f} | Detections: {len(detections)} | Tracks: {len(tracked_objects)}")

        # Verbose mode: log every detection
        if self._verbose:
            for det in detections:
                print(f"  [{det.class_name}] conf={det.confidence:.2f} score={det.drone_score:.2f}")

        return None

    def show(self, rendered_frame: np.ndarray) -> bool:
        # No display in headless mode
        return True

    def close(self) -> None:
        pass

    @property
    def renderer_info(self) -> Dict[str, Any]:
        return {
            'type': 'headless',
            'log_interval': self._log_interval,
            'frame_count': self._frame_count,
        }


def create_renderer(
    renderer_type: str = "auto",
    headless: bool = False,
    **kwargs
) -> FrameRenderer:
    """
    Factory function to create appropriate renderer.

    Args:
        renderer_type: "auto", "opencv", "headless"
        headless: Force headless mode
        **kwargs: Arguments passed to renderer constructor

    Returns:
        Configured FrameRenderer instance
    """
    if headless or renderer_type == "headless":
        return HeadlessRenderer(
            log_interval=kwargs.get('log_interval', 30),
            verbose=kwargs.get('verbose', False),
        )

    if renderer_type in ("auto", "opencv"):
        # Check if display is available
        try:
            import cv2
            # Try to check for display
            import os
            if os.environ.get('DISPLAY') or os.environ.get('WAYLAND_DISPLAY'):
                return OpenCVRenderer(
                    window_name=kwargs.get('window_name', 'Drone Detection'),
                    show_fps=kwargs.get('show_fps', True),
                    show_drone_score=kwargs.get('show_drone_score', True),
                    show_track_id=kwargs.get('show_track_id', True),
                )
        except ImportError:
            pass

        # Fall back to headless
        print("No display available, using headless mode")
        return HeadlessRenderer()

    raise ValueError(f"Unknown renderer type: {renderer_type}")
