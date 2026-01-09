#!/usr/bin/env python3
"""
Abstract interfaces (Protocols) for swappable components.

This module defines the contracts that all implementations must follow,
allowing hot-swapping of cameras, inference engines, trackers, and alert handlers
based on available hardware on demo day.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

import numpy as np

# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class FrameData:
    """Container for a captured frame with metadata."""
    frame: np.ndarray
    timestamp: float
    frame_number: int
    width: int
    height: int
    source_id: str = "unknown"


@dataclass
class BoundingBox:
    """Bounding box in pixel coordinates."""
    x1: int
    y1: int
    x2: int
    y2: int

    @property
    def width(self) -> int:
        return self.x2 - self.x1

    @property
    def height(self) -> int:
        return self.y2 - self.y1

    @property
    def center(self) -> tuple[int, int]:
        return ((self.x1 + self.x2) // 2, (self.y1 + self.y2) // 2)

    @property
    def area(self) -> int:
        return self.width * self.height

    @property
    def aspect_ratio(self) -> float:
        return self.width / self.height if self.height > 0 else 0

    def to_tuple(self) -> tuple[int, int, int, int]:
        return (self.x1, self.y1, self.x2, self.y2)


@dataclass
class Detection:
    """Single detection result from inference."""
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox
    drone_score: float = 0.0
    track_id: Optional[int] = None  # Assigned by tracker
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def is_drone(self) -> bool:
        return self.drone_score > 0.5

    def to_dict(self) -> dict:
        return {
            'class_id': self.class_id,
            'class_name': self.class_name,
            'confidence': self.confidence,
            'bbox': self.bbox.to_tuple(),
            'drone_score': self.drone_score,
            'track_id': self.track_id,
            'is_drone': self.is_drone,
        }


@dataclass
class TrackedObject:
    """Object being tracked across frames."""
    track_id: int
    detection: Detection
    frames_tracked: int = 1
    frames_since_seen: int = 0
    velocity: tuple[float, float] = (0.0, 0.0)  # pixels per frame
    predicted_position: Optional[tuple[int, int]] = None


@dataclass
class InferenceResult:
    """Result from running inference."""
    detections: list[Detection]
    inference_time_ms: float
    model_name: str = "unknown"
    input_shape: tuple[int, ...] = (1, 320, 320, 3)


# ============================================================================
# Hardware Profile
# ============================================================================

class AcceleratorType(Enum):
    """Available hardware accelerators."""
    NONE = "none"
    CORAL_USB = "coral_usb"
    CORAL_PCIE = "coral_pcie"
    # Future: HAILO, NVIDIA_JETSON, etc.


@dataclass
class HardwareProfile:
    """Detected hardware capabilities."""
    # Platform
    platform: str = "unknown"  # "pi4", "pi5", "desktop", etc.
    cpu_cores: int = 4
    ram_mb: int = 2048

    # Camera
    camera_type: str = "unknown"  # "picam_v2", "picam_v3", "usb", "file"
    camera_max_fps: int = 30
    camera_max_resolution: tuple[int, int] = (640, 480)

    # Accelerator
    accelerator: AcceleratorType = AcceleratorType.NONE
    accelerator_available: bool = False

    # Recommended settings based on hardware
    recommended_capture_resolution: tuple[int, int] = (640, 480)
    recommended_capture_fps: int = 30
    recommended_model_input: tuple[int, int] = (320, 320)
    recommended_inference_threads: int = 4

    def to_dict(self) -> dict:
        return {
            'platform': self.platform,
            'cpu_cores': self.cpu_cores,
            'ram_mb': self.ram_mb,
            'camera_type': self.camera_type,
            'accelerator': self.accelerator.value,
            'accelerator_available': self.accelerator_available,
            'recommended_capture_resolution': self.recommended_capture_resolution,
            'recommended_capture_fps': self.recommended_capture_fps,
        }


# ============================================================================
# Abstract Interfaces (Protocols)
# ============================================================================

class FrameSource(ABC):
    """
    Abstract interface for frame sources (cameras, video files, etc.)

    Implementations:
    - PiCameraSource: Raspberry Pi camera via libcamera
    - USBCameraSource: USB webcam via OpenCV
    - VideoFileSource: Video file playback
    - MockFrameSource: Testing/development
    """

    @abstractmethod
    def open(self) -> bool:
        """Open the frame source. Returns True on success."""
        pass

    @abstractmethod
    def read(self) -> Optional[FrameData]:
        """Read next frame. Returns None if no frame available."""
        pass

    @abstractmethod
    def close(self) -> None:
        """Release resources."""
        pass

    @abstractmethod
    def is_open(self) -> bool:
        """Check if source is open and ready."""
        pass

    @property
    @abstractmethod
    def resolution(self) -> tuple[int, int]:
        """Current resolution (width, height)."""
        pass

    @property
    @abstractmethod
    def fps(self) -> float:
        """Current/target FPS."""
        pass

    @property
    @abstractmethod
    def source_info(self) -> dict[str, Any]:
        """Information about the source for debugging."""
        pass


class InferenceEngine(ABC):
    """
    Abstract interface for object detection inference.

    Implementations:
    - TFLiteEngine: TensorFlow Lite (default for Pi)
    - ONNXEngine: ONNX Runtime
    - CoralEngine: Coral Edge TPU
    - MockInferenceEngine: Testing/development
    """

    @abstractmethod
    def load_model(self, model_path: str) -> bool:
        """Load model from path. Returns True on success."""
        pass

    @abstractmethod
    def detect(self, frame: np.ndarray) -> InferenceResult:
        """Run inference on frame, return detections."""
        pass

    @property
    @abstractmethod
    def input_shape(self) -> tuple[int, ...]:
        """Expected input shape (batch, height, width, channels)."""
        pass

    @property
    @abstractmethod
    def class_names(self) -> list[str]:
        """List of class names the model can detect."""
        pass

    @property
    @abstractmethod
    def engine_info(self) -> dict[str, Any]:
        """Information about the engine for debugging."""
        pass

    @abstractmethod
    def set_confidence_threshold(self, threshold: float) -> None:
        """Set minimum confidence for detections."""
        pass

    @abstractmethod
    def set_nms_threshold(self, threshold: float) -> None:
        """Set NMS IoU threshold."""
        pass


class ObjectTracker(ABC):
    """
    Abstract interface for object tracking across frames.

    Implementations:
    - NoOpTracker: No tracking, just pass-through
    - CentroidTracker: Simple centroid-based tracking
    - KalmanTracker: Kalman filter for prediction
    - DeepSORTTracker: Deep learning based (future)
    """

    @abstractmethod
    def update(self, detections: list[Detection], frame: Optional[np.ndarray] = None) -> list[TrackedObject]:
        """
        Update tracker with new detections.

        Args:
            detections: New detections from current frame
            frame: Optional frame for visual tracking

        Returns:
            List of tracked objects with assigned track IDs
        """
        pass

    @abstractmethod
    def reset(self) -> None:
        """Clear all tracked objects."""
        pass

    @property
    @abstractmethod
    def active_tracks(self) -> list[TrackedObject]:
        """Currently active tracked objects."""
        pass

    @property
    @abstractmethod
    def tracker_info(self) -> dict[str, Any]:
        """Information about the tracker for debugging."""
        pass


class AlertHandler(ABC):
    """
    Abstract interface for alert handling.

    Implementations:
    - ConsoleAlertHandler: Print to stdout
    - WebhookAlertHandler: HTTP POST to endpoint
    - FileAlertHandler: Append to JSON file
    - CompositeAlertHandler: Multiple handlers
    """

    @abstractmethod
    def send_alert(self, detection: Detection, frame_data: FrameData) -> bool:
        """
        Send alert for a detection.

        Returns True if alert was sent successfully.
        """
        pass

    @abstractmethod
    def flush(self) -> None:
        """Flush any buffered alerts."""
        pass

    @property
    @abstractmethod
    def handler_info(self) -> dict[str, Any]:
        """Information about the handler for debugging."""
        pass


class FrameRenderer(ABC):
    """
    Abstract interface for frame visualization.

    Implementations:
    - OpenCVRenderer: Display with cv2.imshow
    - HeadlessRenderer: No display, just logging
    - WebStreamRenderer: MJPEG stream (future)
    """

    @abstractmethod
    def render(
        self,
        frame_data: FrameData,
        detections: list[Detection],
        tracked_objects: list[TrackedObject],
        inference_time_ms: float,
    ) -> Optional[np.ndarray]:
        """
        Render frame with detections.

        Returns rendered frame (or None for headless).
        """
        pass

    @abstractmethod
    def show(self, rendered_frame: np.ndarray) -> bool:
        """
        Display the rendered frame.

        Returns False if display was closed (e.g., user pressed 'q').
        """
        pass

    @abstractmethod
    def close(self) -> None:
        """Clean up display resources."""
        pass

    @property
    @abstractmethod
    def renderer_info(self) -> dict[str, Any]:
        """Information about the renderer for debugging."""
        pass


# ============================================================================
# Scoring Strategy (for drone likelihood calculation)
# ============================================================================

class DroneScorer(ABC):
    """
    Abstract interface for calculating drone likelihood scores.

    Allows swapping scoring strategies based on use case.
    """

    @abstractmethod
    def calculate_score(
        self,
        class_id: int,
        confidence: float,
        bbox: BoundingBox,
        frame_data: Optional[FrameData] = None,
    ) -> float:
        """
        Calculate drone likelihood score (0-1).

        Args:
            class_id: Detected class
            confidence: Model confidence
            bbox: Bounding box
            frame_data: Optional frame context

        Returns:
            Score between 0 (not drone) and 1 (definitely drone)
        """
        pass


# ============================================================================
# Pipeline Configuration
# ============================================================================

@dataclass
class PipelineConfig:
    """Configuration for the detection pipeline."""
    # Capture settings
    capture_width: int = 640
    capture_height: int = 480
    capture_fps: int = 30

    # Model settings
    model_path: str = ""
    model_input_size: int = 320
    confidence_threshold: float = 0.5
    nms_threshold: float = 0.45

    # Processing settings
    inference_threads: int = 4
    use_accelerator: bool = False
    enable_tracking: bool = False

    # Alert settings
    alert_on_drone: bool = True
    alert_cooldown_seconds: float = 5.0

    # Display settings
    headless: bool = False
    show_fps: bool = True
    show_drone_score: bool = True

    # Logging
    save_detections_path: Optional[str] = None
    log_interval_frames: int = 30

    def to_dict(self) -> dict:
        return {
            'capture': {
                'width': self.capture_width,
                'height': self.capture_height,
                'fps': self.capture_fps,
            },
            'model': {
                'path': self.model_path,
                'input_size': self.model_input_size,
                'confidence_threshold': self.confidence_threshold,
                'nms_threshold': self.nms_threshold,
            },
            'processing': {
                'inference_threads': self.inference_threads,
                'use_accelerator': self.use_accelerator,
                'enable_tracking': self.enable_tracking,
            },
            'headless': self.headless,
        }
