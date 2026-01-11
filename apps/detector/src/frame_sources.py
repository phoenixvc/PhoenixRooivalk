#!/usr/bin/env python3
"""
Frame source implementations for different camera types.

Supports hot-swapping between Pi Camera, USB webcam, video files, or mock sources
based on what's available on demo day.
"""

import time
from pathlib import Path
from typing import Any, Optional, Union

import numpy as np

from interfaces import FrameData, FrameSource


class OpenCVFrameSource(FrameSource):
    """
    Generic OpenCV-based frame source.

    Works with USB cameras, Pi Camera (via V4L2), and video files.
    """

    def __init__(
        self,
        source: Union[int, str] = 0,
        width: int = 640,
        height: int = 480,
        fps: int = 30,
        buffer_size: int = 1,
        source_id: str = "opencv",
    ):
        self._source = source
        self._width = width
        self._height = height
        self._fps = fps
        self._buffer_size = buffer_size
        self._source_id = source_id
        self._cap = None
        self._frame_count = 0
        self._actual_width = width
        self._actual_height = height
        self._actual_fps = fps

    def open(self) -> bool:
        import cv2

        self._cap = cv2.VideoCapture(self._source)

        if not self._cap.isOpened():
            return False

        # Set properties
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._width)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._height)
        self._cap.set(cv2.CAP_PROP_FPS, self._fps)
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, self._buffer_size)

        # Read actual values (camera may not support requested settings)
        self._actual_width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self._actual_height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self._actual_fps = self._cap.get(cv2.CAP_PROP_FPS)

        return True

    def read(self) -> Optional[FrameData]:
        if self._cap is None or not self._cap.isOpened():
            return None

        ret, frame = self._cap.read()
        if not ret or frame is None:
            return None

        self._frame_count += 1

        return FrameData(
            frame=frame,
            timestamp=time.time(),
            frame_number=self._frame_count,
            width=frame.shape[1],
            height=frame.shape[0],
            source_id=self._source_id,
        )

    def close(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def is_open(self) -> bool:
        return self._cap is not None and self._cap.isOpened()

    @property
    def resolution(self) -> tuple[int, int]:
        return (self._actual_width, self._actual_height)

    @property
    def fps(self) -> float:
        return self._actual_fps

    @property
    def source_info(self) -> dict[str, Any]:
        return {
            "type": "opencv",
            "source": self._source,
            "source_id": self._source_id,
            "resolution": self.resolution,
            "fps": self.fps,
            "frame_count": self._frame_count,
            "buffer_size": self._buffer_size,
        }


class USBCameraSource(OpenCVFrameSource):
    """USB webcam source."""

    def __init__(
        self,
        camera_index: int = 0,
        width: int = 640,
        height: int = 480,
        fps: int = 30,
    ):
        super().__init__(
            source=camera_index,
            width=width,
            height=height,
            fps=fps,
            source_id=f"usb_cam_{camera_index}",
        )


class PiCameraSource(FrameSource):
    """
    Raspberry Pi Camera source via libcamera.

    Falls back to OpenCV if libcamera is not available.
    """

    def __init__(
        self,
        width: int = 640,
        height: int = 480,
        fps: int = 30,
    ):
        self._width = width
        self._height = height
        self._fps = fps
        self._frame_count = 0
        self._cap = None
        self._using_libcamera = False
        self._picam2 = None

    def open(self) -> bool:
        # Try Picamera2 first (modern Pi OS)
        try:
            from picamera2 import Picamera2

            self._picam2 = Picamera2()
            config = self._picam2.create_preview_configuration(
                main={"size": (self._width, self._height), "format": "RGB888"}
            )
            self._picam2.configure(config)
            self._picam2.start()
            self._using_libcamera = True
            return True
        except ImportError:
            pass  # Picamera2 not installed
        except Exception as e:
            import logging

            logging.debug(f"Picamera2 initialization failed: {e}")

        # Fall back to OpenCV with libcamera pipeline
        try:
            import cv2

            # Try libcamera via GStreamer
            gst_pipeline = (
                f"libcamerasrc ! "
                f"video/x-raw,width={self._width},height={self._height},framerate={self._fps}/1 ! "
                f"videoconvert ! appsink"
            )
            self._cap = cv2.VideoCapture(gst_pipeline, cv2.CAP_GSTREAMER)

            if self._cap.isOpened():
                self._using_libcamera = True
                return True
        except Exception:
            pass

        # Final fallback: standard OpenCV (V4L2)
        try:
            import cv2

            self._cap = cv2.VideoCapture(0)
            if self._cap.isOpened():
                self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._width)
                self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._height)
                self._cap.set(cv2.CAP_PROP_FPS, self._fps)
                self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                return True
        except Exception:
            pass

        return False

    def read(self) -> Optional[FrameData]:
        self._frame_count += 1

        if self._picam2 is not None:
            try:
                frame = self._picam2.capture_array()
                # Picamera2 returns RGB, convert to BGR for OpenCV compatibility
                import cv2

                frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                return FrameData(
                    frame=frame,
                    timestamp=time.time(),
                    frame_number=self._frame_count,
                    width=frame.shape[1],
                    height=frame.shape[0],
                    source_id="picamera2",
                )
            except Exception:
                return None

        if self._cap is not None and self._cap.isOpened():
            ret, frame = self._cap.read()
            if ret and frame is not None:
                return FrameData(
                    frame=frame,
                    timestamp=time.time(),
                    frame_number=self._frame_count,
                    width=frame.shape[1],
                    height=frame.shape[0],
                    source_id="picamera_opencv",
                )

        return None

    def close(self) -> None:
        if self._picam2 is not None:
            try:
                self._picam2.stop()
            except Exception:
                pass
            self._picam2 = None

        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def is_open(self) -> bool:
        if self._picam2 is not None:
            return True
        return self._cap is not None and self._cap.isOpened()

    @property
    def resolution(self) -> tuple[int, int]:
        return (self._width, self._height)

    @property
    def fps(self) -> float:
        return float(self._fps)

    @property
    def source_info(self) -> dict[str, Any]:
        return {
            "type": "picamera",
            "using_libcamera": self._using_libcamera,
            "using_picamera2": self._picam2 is not None,
            "resolution": self.resolution,
            "fps": self.fps,
            "frame_count": self._frame_count,
        }


class VideoFileSource(OpenCVFrameSource):
    """Video file playback source."""

    def __init__(
        self,
        file_path: str,
        loop: bool = False,
    ):
        self._file_path = Path(file_path)
        self._loop = loop
        super().__init__(
            source=str(self._file_path),
            source_id=f"video_{self._file_path.name}",
        )

    def open(self) -> bool:
        if not self._file_path.exists():
            return False
        return super().open()

    def read(self) -> Optional[FrameData]:
        frame_data = super().read()

        if frame_data is None and self._loop:
            # Reset to beginning
            import cv2

            if self._cap is not None:
                self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                self._frame_count = 0
                return super().read()

        return frame_data

    @property
    def source_info(self) -> dict[str, Any]:
        info = super().source_info
        info.update(
            {
                "type": "video_file",
                "file_path": str(self._file_path),
                "loop": self._loop,
            }
        )
        return info


class MockFrameSource(FrameSource):
    """
    Mock frame source for testing without a camera.

    Generates solid color frames or frames with synthetic "objects".
    """

    def __init__(
        self,
        width: int = 640,
        height: int = 480,
        fps: int = 30,
        generate_objects: bool = False,
    ):
        self._width = width
        self._height = height
        self._fps = fps
        self._generate_objects = generate_objects
        self._frame_count = 0
        self._is_open = False
        self._last_frame_time = 0.0

    def open(self) -> bool:
        self._is_open = True
        self._last_frame_time = time.time()
        return True

    def read(self) -> Optional[FrameData]:
        if not self._is_open:
            return None

        # Simulate frame rate limiting
        target_interval = 1.0 / self._fps
        elapsed = time.time() - self._last_frame_time
        if elapsed < target_interval:
            time.sleep(target_interval - elapsed)

        self._frame_count += 1
        self._last_frame_time = time.time()

        # Generate a simple test pattern
        frame = np.zeros((self._height, self._width, 3), dtype=np.uint8)

        # Add some color variation based on frame number
        frame[:, :, 0] = 50  # Blue channel
        frame[:, :, 1] = 50  # Green channel
        frame[:, :, 2] = 50 + (self._frame_count % 50)  # Red varies

        if self._generate_objects:
            # Add a moving rectangle to simulate an object
            x = (self._frame_count * 5) % (self._width - 50)
            y = self._height // 2 - 25
            frame[y : y + 50, x : x + 50] = [0, 255, 0]  # Green box

        return FrameData(
            frame=frame,
            timestamp=time.time(),
            frame_number=self._frame_count,
            width=self._width,
            height=self._height,
            source_id="mock",
        )

    def close(self) -> None:
        self._is_open = False

    def is_open(self) -> bool:
        return self._is_open

    @property
    def resolution(self) -> tuple[int, int]:
        return (self._width, self._height)

    @property
    def fps(self) -> float:
        return float(self._fps)

    @property
    def source_info(self) -> dict[str, Any]:
        return {
            "type": "mock",
            "resolution": self.resolution,
            "fps": self.fps,
            "generate_objects": self._generate_objects,
            "frame_count": self._frame_count,
        }


def create_frame_source(source_type: str = "auto", **kwargs) -> FrameSource:
    """
    Factory function to create appropriate frame source.

    Args:
        source_type: "auto", "picamera", "usb", "video", "mock"
        **kwargs: Arguments passed to the source constructor

    Returns:
        Configured FrameSource instance
    """
    width = kwargs.get("width", 640)
    height = kwargs.get("height", 480)
    fps = kwargs.get("fps", 30)

    if source_type == "mock":
        return MockFrameSource(width=width, height=height, fps=fps)

    if source_type == "video":
        file_path = kwargs.get("file_path", "")
        loop = kwargs.get("loop", False)
        return VideoFileSource(file_path=file_path, loop=loop)

    if source_type == "usb":
        camera_index = kwargs.get("camera_index", 0)
        return USBCameraSource(
            camera_index=camera_index,
            width=width,
            height=height,
            fps=fps,
        )

    if source_type == "picamera":
        return PiCameraSource(width=width, height=height, fps=fps)

    # Auto-detect
    if source_type == "auto":
        # Try Pi Camera first
        pi_cam = PiCameraSource(width=width, height=height, fps=fps)
        try:
            if pi_cam.open():
                return pi_cam
        except Exception:
            pass
        finally:
            # Ensure Pi camera is closed if we didn't return it
            if not pi_cam.is_open():
                pi_cam.close()

        # Fall back to USB camera
        usb_cam = USBCameraSource(
            camera_index=0,
            width=width,
            height=height,
            fps=fps,
        )
        try:
            if usb_cam.open():
                return usb_cam
        except Exception:
            pass
        finally:
            # Ensure USB camera is closed if we didn't return it
            if not usb_cam.is_open():
                usb_cam.close()

        # Last resort: mock
        print("WARNING: No camera found, using mock frame source")
        return MockFrameSource(width=width, height=height, fps=fps)

    raise ValueError(f"Unknown source type: {source_type}")
