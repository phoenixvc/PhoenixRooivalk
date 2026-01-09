"""
Shared pytest fixtures for Pi Drone Detector tests.

Provides common test data, mocks, and utilities.
"""

import sys
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch
from typing import List, Tuple

import pytest
import numpy as np

# Add src to path for imports
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from interfaces import Detection, BoundingBox, FrameData, TrackedObject, InferenceResult
from config.settings import (
    Settings,
    CaptureSettings,
    InferenceSettings,
    TargetingSettings,
    DroneScoreSettings,
)


# =============================================================================
# Frame Fixtures
# =============================================================================

@pytest.fixture
def sample_frame() -> np.ndarray:
    """Generate a sample BGR frame (640x480)."""
    return np.zeros((480, 640, 3), dtype=np.uint8)


@pytest.fixture
def sample_frame_720p() -> np.ndarray:
    """Generate a 720p BGR frame."""
    return np.zeros((720, 1280, 3), dtype=np.uint8)


@pytest.fixture
def sample_frame_with_noise() -> np.ndarray:
    """Generate a frame with random noise."""
    return np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)


@pytest.fixture
def sample_frame_data(sample_frame) -> FrameData:
    """Create sample FrameData object."""
    return FrameData(
        frame=sample_frame,
        timestamp=1234567890.0,
        frame_number=1,
        width=640,
        height=480,
        source_id='test_source',
    )


# =============================================================================
# Bounding Box Fixtures
# =============================================================================

@pytest.fixture
def sample_bbox() -> BoundingBox:
    """Create a sample bounding box."""
    return BoundingBox(x1=100, y1=100, x2=200, y2=200)


@pytest.fixture
def sample_bbox_small() -> BoundingBox:
    """Create a small bounding box (far object)."""
    return BoundingBox(x1=300, y1=200, x2=320, y2=220)


@pytest.fixture
def sample_bbox_large() -> BoundingBox:
    """Create a large bounding box (close object)."""
    return BoundingBox(x1=100, y1=50, x2=400, y2=350)


@pytest.fixture
def sample_bbox_tuple() -> Tuple[int, int, int, int]:
    """Create a sample bounding box as tuple."""
    return (100, 100, 200, 200)


@pytest.fixture
def overlapping_bboxes() -> List[Tuple[int, int, int, int]]:
    """Create a list of overlapping bounding boxes for NMS testing."""
    return [
        (100, 100, 200, 200),  # Base box
        (110, 110, 210, 210),  # High overlap with base
        (150, 150, 250, 250),  # Partial overlap
        (300, 300, 400, 400),  # No overlap
    ]


# =============================================================================
# Detection Fixtures
# =============================================================================

@pytest.fixture
def sample_detection(sample_bbox) -> Detection:
    """Create a sample drone detection."""
    return Detection(
        class_id=0,
        class_name='drone',
        confidence=0.85,
        bbox=sample_bbox,
        drone_score=0.9,
        track_id=1,
    )


@pytest.fixture
def sample_detection_non_drone(sample_bbox) -> Detection:
    """Create a sample non-drone detection."""
    return Detection(
        class_id=1,
        class_name='bird_small',
        confidence=0.75,
        bbox=sample_bbox,
        drone_score=0.2,
        track_id=2,
    )


@pytest.fixture
def sample_detections(sample_bbox) -> List[Detection]:
    """Create a list of sample detections."""
    return [
        Detection(0, 'drone', 0.9, BoundingBox(100, 100, 200, 200), 0.95, track_id=1),
        Detection(0, 'drone', 0.8, BoundingBox(110, 110, 210, 210), 0.85, track_id=2),
        Detection(1, 'bird', 0.7, BoundingBox(300, 300, 350, 350), 0.1, track_id=3),
    ]


@pytest.fixture
def sample_inference_result(sample_detections) -> InferenceResult:
    """Create a sample inference result."""
    return InferenceResult(
        detections=sample_detections,
        inference_time_ms=50.0,
        model_name='test_model.tflite',
        input_shape=(1, 320, 320, 3),
    )


# =============================================================================
# Tracking Fixtures
# =============================================================================

@pytest.fixture
def sample_tracked_object(sample_detection) -> TrackedObject:
    """Create a sample tracked object."""
    return TrackedObject(
        track_id=1,
        detection=sample_detection,
        frames_tracked=15,
        frames_since_seen=0,
        velocity=(5.0, -2.0),
        predicted_position=(205, 98),
    )


@pytest.fixture
def sample_tracked_objects(sample_detections) -> List[TrackedObject]:
    """Create a list of tracked objects."""
    return [
        TrackedObject(
            track_id=det.track_id,
            detection=det,
            frames_tracked=10 + i * 5,
            frames_since_seen=0,
            velocity=(2.0 * i, -1.0 * i),
        )
        for i, det in enumerate(sample_detections)
    ]


# =============================================================================
# Settings Fixtures
# =============================================================================

@pytest.fixture
def default_settings() -> Settings:
    """Create default settings."""
    return Settings()


@pytest.fixture
def targeting_settings() -> TargetingSettings:
    """Create targeting settings for testing."""
    return TargetingSettings(
        max_targeting_distance_m=100.0,
        min_confidence_for_lock=0.7,
        lock_timeout_seconds=5.0,
        fire_net_enabled=True,
        fire_net_min_confidence=0.85,
        fire_net_min_track_frames=10,
        fire_net_max_distance_m=50.0,
        fire_net_min_distance_m=5.0,
        fire_net_arm_required=True,
    )


@pytest.fixture
def drone_score_settings() -> DroneScoreSettings:
    """Create drone score settings for testing."""
    return DroneScoreSettings(
        drone_class_id=0,
        model_weight=0.7,
        drone_threshold=0.5,
        aspect_ratio_min=0.8,
        aspect_ratio_max=2.5,
        aspect_bonus=0.15,
        tall_penalty=0.2,
    )


# =============================================================================
# Mock Fixtures
# =============================================================================

@pytest.fixture
def mock_cv2():
    """Mock OpenCV for headless testing."""
    mock = MagicMock()
    mock.VideoCapture.return_value.isOpened.return_value = True
    mock.VideoCapture.return_value.read.return_value = (True, np.zeros((480, 640, 3), dtype=np.uint8))
    mock.resize.side_effect = lambda img, size: np.zeros((size[1], size[0], 3), dtype=np.uint8)
    mock.cvtColor.side_effect = lambda img, code: img

    with patch.dict('sys.modules', {'cv2': mock}):
        yield mock


@pytest.fixture
def mock_gpio():
    """Mock RPi.GPIO for testing without hardware."""
    mock = MagicMock()
    mock.BCM = 11
    mock.OUT = 0
    mock.HIGH = 1
    mock.LOW = 0

    with patch.dict('sys.modules', {'RPi': MagicMock(), 'RPi.GPIO': mock}):
        yield mock


@pytest.fixture
def mock_tflite():
    """Mock TFLite interpreter for testing without model."""
    mock_interpreter = MagicMock()
    mock_interpreter.get_input_details.return_value = [{
        'shape': (1, 320, 320, 3),
        'dtype': np.uint8,
        'index': 0,
    }]
    mock_interpreter.get_output_details.return_value = [{
        'index': 0,
    }]
    mock_interpreter.get_tensor.return_value = np.zeros((1, 100, 6), dtype=np.float32)

    mock_module = MagicMock()
    mock_module.Interpreter.return_value = mock_interpreter

    with patch.dict('sys.modules', {'tflite_runtime': MagicMock(), 'tflite_runtime.interpreter': mock_module}):
        yield mock_interpreter


@pytest.fixture
def mock_filesystem(tmp_path):
    """Create mock filesystem for hardware detection tests."""
    # Create mock /proc/device-tree/model
    device_tree = tmp_path / "proc" / "device-tree"
    device_tree.mkdir(parents=True)
    (device_tree / "model").write_text("Raspberry Pi 4 Model B Rev 1.4\x00")

    # Create mock /proc/meminfo
    proc = tmp_path / "proc"
    (proc / "meminfo").write_text("MemTotal:        3906280 kB\nMemFree:         1234567 kB\n")

    # Create mock /proc/cpuinfo
    (proc / "cpuinfo").write_text("processor\t: 0\nmodel name\t: ARMv7\nRevision\t: c03115\n")

    return tmp_path


# =============================================================================
# Utility Fixtures
# =============================================================================

@pytest.fixture
def temp_config_file(tmp_path):
    """Create a temporary config file."""
    config_content = """
camera_type: auto
engine_type: tflite
tracker_type: centroid

capture:
  width: 640
  height: 480
  fps: 30

inference:
  model_path: "test_model.tflite"
  confidence_threshold: 0.5

targeting:
  max_targeting_distance_m: 100.0
  fire_net_enabled: false
"""
    config_file = tmp_path / "config.yaml"
    config_file.write_text(config_content)
    return config_file


@pytest.fixture
def temp_detections_file(tmp_path):
    """Create a temporary detections output file path."""
    return tmp_path / "detections.json"


# =============================================================================
# Parameterized Test Data
# =============================================================================

# IoU test cases: (box1, box2, expected_iou)
IOU_TEST_CASES = [
    # Identical boxes
    ((0, 0, 100, 100), (0, 0, 100, 100), 1.0),
    # No overlap
    ((0, 0, 100, 100), (200, 200, 300, 300), 0.0),
    # 50% overlap on each axis = 25% area overlap
    ((0, 0, 100, 100), (50, 50, 150, 150), 0.25 / 1.75),  # intersection / union
    # Contained box
    ((0, 0, 100, 100), (25, 25, 75, 75), 2500 / 10000),  # smaller / larger
    # Adjacent boxes (touching but no overlap)
    ((0, 0, 100, 100), (100, 0, 200, 100), 0.0),
]

# NMS test cases
NMS_TEST_CASES = [
    # Single detection - keep it
    ([(0.9, (100, 100, 200, 200))], 0.5, 1),
    # Two overlapping, keep highest confidence
    ([(0.9, (100, 100, 200, 200)), (0.8, (110, 110, 210, 210))], 0.3, 1),
    # Two non-overlapping, keep both
    ([(0.9, (100, 100, 200, 200)), (0.8, (300, 300, 400, 400))], 0.5, 2),
]

# Distance estimation test cases: (bbox_size_px, expected_far)
DISTANCE_TEST_CASES = [
    (20, True),   # Small box = far
    (200, False), # Large box = close
]
