# Pi Drone Detector v2 - Production Readiness Plan

## Overview

This plan addresses production readiness improvements including:

- Configuration management
- Code quality (SOLID, DRY, Python best practices)
- Testing infrastructure
- CI/CD pipeline
- Documentation
- Web streaming capability
- Targeting/engagement features

---

## Phase 1: Foundation (Configuration & Code Quality)

### 1.1 Configuration Management

**Create `config/` module with:**

```
apps/pi-drone-detector/
├── config/
│   ├── __init__.py
│   ├── settings.py          # Pydantic settings with validation
│   ├── constants.py          # Immutable constants
│   ├── defaults.yaml         # Default configuration
│   └── schema.py             # JSON Schema for validation
```

**settings.py - Centralized Configuration:**

```python
from pydantic import BaseSettings, Field, validator
from typing import Tuple, Optional
from enum import Enum

class CameraType(str, Enum):
    AUTO = "auto"
    PICAMERA = "picamera"
    USB = "usb"
    VIDEO = "video"
    MOCK = "mock"

class EngineType(str, Enum):
    AUTO = "auto"
    TFLITE = "tflite"
    ONNX = "onnx"
    CORAL = "coral"
    MOCK = "mock"

class TrackerType(str, Enum):
    NONE = "none"
    CENTROID = "centroid"
    KALMAN = "kalman"

class CaptureSettings(BaseSettings):
    width: int = Field(640, ge=160, le=4096)
    height: int = Field(480, ge=120, le=3072)
    fps: int = Field(30, ge=1, le=120)
    buffer_size: int = Field(1, ge=1, le=10)

    class Config:
        env_prefix = "CAPTURE_"

class InferenceSettings(BaseSettings):
    model_path: str = ""
    input_size: int = Field(320, ge=128, le=640)
    confidence_threshold: float = Field(0.5, ge=0.0, le=1.0)
    nms_threshold: float = Field(0.45, ge=0.0, le=1.0)
    num_threads: int = Field(4, ge=1, le=16)

    class Config:
        env_prefix = "INFERENCE_"

class DroneScoreSettings(BaseSettings):
    """Configurable drone scoring heuristics."""
    drone_class_id: int = 0
    model_weight: float = Field(0.7, ge=0.0, le=1.0)
    aspect_ratio_min: float = Field(0.8, ge=0.1)
    aspect_ratio_max: float = Field(2.5, le=10.0)
    aspect_bonus: float = Field(0.15, ge=0.0, le=0.5)
    tall_penalty: float = Field(0.2, ge=0.0, le=0.5)
    drone_threshold: float = Field(0.5, ge=0.0, le=1.0)

    class Config:
        env_prefix = "DRONE_SCORE_"

class TargetingSettings(BaseSettings):
    """Targeting and engagement parameters."""
    max_targeting_distance_m: float = Field(100.0, ge=10.0, le=1000.0)
    min_confidence_for_lock: float = Field(0.7, ge=0.5, le=1.0)
    lock_timeout_seconds: float = Field(5.0, ge=1.0, le=30.0)
    tracking_lead_factor: float = Field(1.2, ge=1.0, le=3.0)

    # Fire net trigger parameters
    fire_net_enabled: bool = False
    fire_net_min_confidence: float = Field(0.85, ge=0.5, le=1.0)
    fire_net_min_track_frames: int = Field(10, ge=3, le=60)
    fire_net_max_distance_m: float = Field(50.0, ge=5.0, le=200.0)
    fire_net_min_distance_m: float = Field(5.0, ge=1.0, le=20.0)
    fire_net_velocity_threshold_ms: float = Field(30.0, ge=0.0, le=100.0)
    fire_net_cooldown_seconds: float = Field(10.0, ge=1.0, le=60.0)
    fire_net_arm_required: bool = True  # Require explicit arming
    fire_net_gpio_pin: int = Field(17, ge=0, le=27)

    class Config:
        env_prefix = "TARGETING_"

class AlertSettings(BaseSettings):
    webhook_url: Optional[str] = None
    webhook_timeout: float = Field(5.0, ge=1.0, le=30.0)
    cooldown_per_track: float = Field(5.0, ge=0.0, le=60.0)
    global_cooldown: float = Field(1.0, ge=0.0, le=10.0)
    save_detections_path: Optional[str] = None

    class Config:
        env_prefix = "ALERT_"

class StreamingSettings(BaseSettings):
    """Web streaming configuration."""
    enabled: bool = False
    host: str = "0.0.0.0"
    port: int = Field(8080, ge=1024, le=65535)
    quality: int = Field(80, ge=10, le=100)
    max_fps: int = Field(15, ge=1, le=30)
    auth_enabled: bool = False
    auth_token: Optional[str] = None

    class Config:
        env_prefix = "STREAM_"

class Settings(BaseSettings):
    """Root configuration aggregating all settings."""
    capture: CaptureSettings = CaptureSettings()
    inference: InferenceSettings = InferenceSettings()
    drone_score: DroneScoreSettings = DroneScoreSettings()
    targeting: TargetingSettings = TargetingSettings()
    alert: AlertSettings = AlertSettings()
    streaming: StreamingSettings = StreamingSettings()

    # General settings
    camera_type: CameraType = CameraType.AUTO
    engine_type: EngineType = EngineType.AUTO
    tracker_type: TrackerType = TrackerType.CENTROID
    headless: bool = False
    log_level: str = Field("INFO", regex="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @classmethod
    def from_yaml(cls, path: str) -> "Settings":
        import yaml
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls(**data)

    def to_yaml(self, path: str) -> None:
        import yaml
        with open(path, 'w') as f:
            yaml.dump(self.dict(), f, default_flow_style=False)
```

**constants.py - Immutable Values:**

```python
"""Immutable constants that should never be configured."""

# Version
VERSION = "2.0.0"
APP_NAME = "pi-drone-detector"

# Supported formats
SUPPORTED_MODEL_EXTENSIONS = {'.tflite', '.onnx'}
SUPPORTED_VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mkv', '.mov'}
SUPPORTED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp'}

# Camera sensors
PI_CAMERA_SENSORS = {
    'imx219': {'name': 'Pi Camera v2', 'max_res': (3280, 2464), 'max_fps': 60},
    'imx477': {'name': 'Pi Camera HQ', 'max_res': (4056, 3040), 'max_fps': 50},
    'imx708': {'name': 'Pi Camera v3', 'max_res': (4608, 2592), 'max_fps': 120},
}

# Platform identifiers
PI_MODELS = {
    'bcm2711': 'pi4',
    'bcm2712': 'pi5',
    'bcm2837': 'pi3',
}

# Default class names
DEFAULT_CLASS_NAMES = ['drone', 'not_drone']
EXTENDED_CLASS_NAMES = [
    'drone', 'bird_small', 'bird_large', 'aircraft',
    'recreational', 'sports', 'debris', 'insect',
    'atmospheric', 'background'
]

# Physical constants for distance estimation
DRONE_TYPICAL_SIZE_M = 0.3  # Typical consumer drone size
FOCAL_LENGTH_PI_CAM_V2 = 3.04  # mm
SENSOR_WIDTH_PI_CAM_V2 = 3.68  # mm

# Colors (BGR for OpenCV)
COLORS = {
    'drone': (0, 0, 255),      # Red
    'non_drone': (0, 255, 0),  # Green
    'prediction': (255, 165, 0),  # Orange
    'armed': (0, 0, 255),      # Red
    'locked': (0, 255, 255),   # Yellow
    'firing': (255, 0, 255),   # Magenta
}

# Timing
MAX_WEBHOOK_TIMEOUT_SECONDS = 30
MAX_FRAME_PROCESSING_MS = 1000
HEALTH_CHECK_INTERVAL_SECONDS = 10
```

---

### 1.2 Code Quality Fixes

**Fix DRY Violations - Create `utils/` module:**

```
apps/pi-drone-detector/src/
├── utils/
│   ├── __init__.py
│   ├── geometry.py       # IoU, NMS, bbox operations
│   ├── image.py          # Preprocessing, color conversion
│   ├── distance.py       # Distance estimation calculations
│   └── validation.py     # Input validation helpers
```

**geometry.py:**

```python
"""Geometric utilities for bounding boxes and NMS."""
from typing import List, Tuple
from dataclasses import dataclass

def calculate_iou(box1: Tuple[int, int, int, int],
                  box2: Tuple[int, int, int, int]) -> float:
    """Calculate Intersection over Union for two bounding boxes."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    intersection = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - intersection

    return intersection / union if union > 0 else 0.0

def non_max_suppression(
    detections: List,
    iou_threshold: float = 0.45,
    key_func=lambda x: x.confidence,
) -> List:
    """Apply Non-Maximum Suppression to detections."""
    if not detections:
        return []

    sorted_dets = sorted(detections, key=key_func, reverse=True)
    keep = []

    while sorted_dets:
        best = sorted_dets.pop(0)
        keep.append(best)
        sorted_dets = [
            d for d in sorted_dets
            if calculate_iou(best.bbox.to_tuple(), d.bbox.to_tuple()) < iou_threshold
        ]

    return keep
```

**Fix SOLID Violations:**

1. **Remove duplicate Detection class** - Delete from detector.py, use
   interfaces.Detection everywhere
2. **Extract preprocessing** - Move to utils/image.py
3. **Extract scoring** - Already in inference_engines.py, make configurable via
   settings
4. **Remove draw_detections from detector.py** - Use renderers module only

---

### 1.3 Logging Infrastructure

**Create `logging_config.py`:**

```python
"""Structured logging configuration."""
import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Optional
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        if hasattr(record, 'extra_data'):
            log_data.update(record.extra_data)

        return json.dumps(log_data)

def setup_logging(
    level: str = "INFO",
    log_file: Optional[str] = None,
    json_format: bool = False,
    max_bytes: int = 10_000_000,  # 10MB
    backup_count: int = 5,
) -> logging.Logger:
    """Configure application logging."""

    logger = logging.getLogger('drone_detector')
    logger.setLevel(getattr(logging, level.upper()))

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    if json_format:
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        ))
    logger.addHandler(console_handler)

    # File handler (with rotation)
    if log_file:
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
        )
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)

    return logger
```

---

## Phase 2: Testing Infrastructure

### 2.1 Test Structure

```
apps/pi-drone-detector/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Pytest fixtures
│   ├── unit/
│   │   ├── test_geometry.py
│   │   ├── test_detection.py
│   │   ├── test_trackers.py
│   │   ├── test_alert_handlers.py
│   │   ├── test_settings.py
│   │   └── test_targeting.py
│   ├── integration/
│   │   ├── test_pipeline.py
│   │   ├── test_frame_sources.py
│   │   └── test_inference.py
│   └── e2e/
│       └── test_full_detection.py
```

### 2.2 Test Fixtures (conftest.py)

```python
"""Shared pytest fixtures."""
import pytest
import numpy as np
from unittest.mock import Mock, patch
from pathlib import Path

from interfaces import Detection, BoundingBox, FrameData, TrackedObject
from config.settings import Settings

@pytest.fixture
def sample_frame():
    """Generate a sample BGR frame."""
    return np.zeros((480, 640, 3), dtype=np.uint8)

@pytest.fixture
def sample_detection():
    """Create a sample detection."""
    return Detection(
        class_id=0,
        class_name='drone',
        confidence=0.85,
        bbox=BoundingBox(100, 100, 200, 200),
        drone_score=0.9,
    )

@pytest.fixture
def sample_frame_data(sample_frame):
    """Create sample frame data."""
    return FrameData(
        frame=sample_frame,
        timestamp=1234567890.0,
        frame_number=1,
        width=640,
        height=480,
        source_id='test',
    )

@pytest.fixture
def mock_settings():
    """Create mock settings for testing."""
    return Settings(
        inference=Settings.InferenceSettings(
            model_path='test_model.tflite',
            confidence_threshold=0.5,
        )
    )

@pytest.fixture
def mock_cv2():
    """Mock OpenCV for headless testing."""
    with patch.dict('sys.modules', {'cv2': Mock()}):
        yield

@pytest.fixture
def mock_filesystem(tmp_path):
    """Create mock filesystem for hardware detection tests."""
    # Mock /proc/device-tree/model
    model_file = tmp_path / "proc" / "device-tree" / "model"
    model_file.parent.mkdir(parents=True)
    model_file.write_text("Raspberry Pi 4 Model B Rev 1.4")

    # Mock /proc/meminfo
    meminfo = tmp_path / "proc" / "meminfo"
    meminfo.write_text("MemTotal:        3906280 kB\n")

    return tmp_path
```

### 2.3 Unit Test Examples

**test_geometry.py:**

```python
"""Tests for geometry utilities."""
import pytest
from utils.geometry import calculate_iou, non_max_suppression
from interfaces import Detection, BoundingBox

class TestCalculateIoU:
    def test_identical_boxes(self):
        box = (0, 0, 100, 100)
        assert calculate_iou(box, box) == 1.0

    def test_no_overlap(self):
        box1 = (0, 0, 100, 100)
        box2 = (200, 200, 300, 300)
        assert calculate_iou(box1, box2) == 0.0

    def test_partial_overlap(self):
        box1 = (0, 0, 100, 100)
        box2 = (50, 50, 150, 150)
        # Intersection: 50x50 = 2500
        # Union: 10000 + 10000 - 2500 = 17500
        assert abs(calculate_iou(box1, box2) - 2500/17500) < 0.001

class TestNMS:
    def test_empty_list(self):
        assert non_max_suppression([]) == []

    def test_single_detection(self, sample_detection):
        result = non_max_suppression([sample_detection])
        assert len(result) == 1

    def test_overlapping_detections(self):
        det1 = Detection(0, 'drone', 0.9, BoundingBox(0, 0, 100, 100), 0.9)
        det2 = Detection(0, 'drone', 0.8, BoundingBox(10, 10, 110, 110), 0.8)

        result = non_max_suppression([det1, det2], iou_threshold=0.5)
        assert len(result) == 1
        assert result[0].confidence == 0.9  # Kept highest confidence
```

**test_targeting.py:**

```python
"""Tests for targeting and fire net logic."""
import pytest
from targeting import TargetingSystem, FireNetController
from interfaces import Detection, BoundingBox, TrackedObject
from config.settings import TargetingSettings

class TestTargetingSystem:
    @pytest.fixture
    def targeting(self):
        settings = TargetingSettings(
            max_targeting_distance_m=100.0,
            min_confidence_for_lock=0.7,
        )
        return TargetingSystem(settings)

    def test_lock_requires_minimum_confidence(self, targeting):
        det = Detection(0, 'drone', 0.5, BoundingBox(100, 100, 200, 200), 0.6)
        assert not targeting.can_lock(det)

        det.confidence = 0.8
        det.drone_score = 0.8
        assert targeting.can_lock(det)

    def test_distance_estimation(self, targeting):
        # Small bbox = far away
        det_far = Detection(0, 'drone', 0.9, BoundingBox(100, 100, 120, 120), 0.9)
        # Large bbox = close
        det_close = Detection(0, 'drone', 0.9, BoundingBox(100, 100, 300, 300), 0.9)

        dist_far = targeting.estimate_distance(det_far, frame_width=640)
        dist_close = targeting.estimate_distance(det_close, frame_width=640)

        assert dist_far > dist_close

class TestFireNetController:
    @pytest.fixture
    def fire_net(self):
        settings = TargetingSettings(
            fire_net_enabled=True,
            fire_net_min_confidence=0.85,
            fire_net_min_track_frames=5,
            fire_net_max_distance_m=50.0,
            fire_net_min_distance_m=5.0,
        )
        return FireNetController(settings)

    def test_requires_arming(self, fire_net):
        assert not fire_net.is_armed
        assert not fire_net.can_fire(Mock())

        fire_net.arm()
        assert fire_net.is_armed

    def test_fire_conditions(self, fire_net):
        fire_net.arm()

        track = TrackedObject(
            track_id=1,
            detection=Detection(0, 'drone', 0.9, BoundingBox(200, 200, 300, 300), 0.95),
            frames_tracked=10,
        )

        # Should be able to fire with good track
        assert fire_net.can_fire(track, estimated_distance=25.0)

    def test_cooldown_prevents_rapid_fire(self, fire_net):
        fire_net.arm()
        track = Mock(frames_tracked=10)

        fire_net.fire(track)
        assert not fire_net.can_fire(track)  # In cooldown
```

---

## Phase 3: CI/CD Pipeline

### 3.1 GitHub Actions Workflow

**.github/workflows/ci.yml:**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
    paths:
      - "apps/pi-drone-detector/**"
  pull_request:
    branches: [main]
    paths:
      - "apps/pi-drone-detector/**"

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install ruff mypy black isort
          pip install -r apps/pi-drone-detector/requirements.txt

      - name: Run ruff (linting)
        run: ruff check apps/pi-drone-detector/src/

      - name: Run black (formatting check)
        run: black --check apps/pi-drone-detector/src/

      - name: Run isort (import sorting)
        run: isort --check-only apps/pi-drone-detector/src/

      - name: Run mypy (type checking)
        run: mypy apps/pi-drone-detector/src/ --ignore-missing-imports

  test:
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        python-version: ["3.9", "3.10", "3.11"]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          pip install pytest pytest-cov pytest-asyncio
          pip install -r apps/pi-drone-detector/requirements.txt
          pip install -r apps/pi-drone-detector/requirements-dev.txt

      - name: Run unit tests
        run: |
          cd apps/pi-drone-detector
          pytest tests/unit/ -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: apps/pi-drone-detector/coverage.xml
          flags: unittests

  integration-test:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install pytest
          pip install -r apps/pi-drone-detector/requirements.txt

      - name: Run integration tests (mock mode)
        run: |
          cd apps/pi-drone-detector
          pytest tests/integration/ -v --mock-hardware

  build:
    runs-on: ubuntu-latest
    needs: [test, integration-test]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Build package
        run: |
          cd apps/pi-drone-detector
          pip install build
          python -m build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: apps/pi-drone-detector/dist/

  deploy-docs:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Build docs
        run: |
          pip install mkdocs mkdocs-material mkdocstrings
          mkdocs build -f apps/pi-drone-detector/mkdocs.yml

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: apps/pi-drone-detector/site
```

### 3.2 Pre-commit Hooks

**.pre-commit-config.yaml:**

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: ["--maxkb=1000"]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [pydantic, numpy]
```

---

## Phase 4: Web Streaming

### 4.1 Streaming Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Frame Source │────▶│  Inference   │────▶│  Renderer    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │ MJPEG Stream │
                                          │   Server     │
                                          └──────────────┘
                                                 │
                            ┌────────────────────┼────────────────────┐
                            ▼                    ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                     │   Browser    │     │  Mobile App  │     │   HUD/OSD    │
                     └──────────────┘     └──────────────┘     └──────────────┘
```

### 4.2 Streaming Module

**streaming.py:**

```python
"""MJPEG streaming server for web clients."""
import asyncio
import logging
from typing import Optional, AsyncGenerator
from dataclasses import dataclass
import time

import numpy as np

try:
    from aiohttp import web
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

from interfaces import FrameRenderer, FrameData, Detection, TrackedObject
from config.settings import StreamingSettings

logger = logging.getLogger(__name__)

@dataclass
class StreamFrame:
    """Frame ready for streaming."""
    jpeg_data: bytes
    timestamp: float
    frame_number: int

class StreamingRenderer(FrameRenderer):
    """
    Renderer that outputs to both display and streaming buffer.

    Wraps another renderer and captures output for streaming.
    """

    def __init__(
        self,
        inner_renderer: Optional[FrameRenderer],
        settings: StreamingSettings,
    ):
        self._inner = inner_renderer
        self._settings = settings
        self._buffer: Optional[StreamFrame] = None
        self._lock = asyncio.Lock()
        self._frame_count = 0
        self._last_stream_time = 0.0
        self._min_interval = 1.0 / settings.max_fps

    def render(
        self,
        frame_data: FrameData,
        detections: list,
        tracked_objects: list,
        inference_time_ms: float,
    ) -> Optional[np.ndarray]:
        # Render through inner renderer
        rendered = None
        if self._inner:
            rendered = self._inner.render(
                frame_data, detections, tracked_objects, inference_time_ms
            )

        # Rate limit streaming frames
        now = time.time()
        if now - self._last_stream_time >= self._min_interval:
            self._encode_for_stream(rendered or frame_data.frame, frame_data)
            self._last_stream_time = now

        return rendered

    def _encode_for_stream(self, frame: np.ndarray, frame_data: FrameData) -> None:
        """Encode frame as JPEG for streaming."""
        import cv2

        _, jpeg = cv2.imencode(
            '.jpg', frame,
            [cv2.IMWRITE_JPEG_QUALITY, self._settings.quality]
        )

        self._buffer = StreamFrame(
            jpeg_data=jpeg.tobytes(),
            timestamp=frame_data.timestamp,
            frame_number=frame_data.frame_number,
        )
        self._frame_count += 1

    async def get_frame(self) -> Optional[StreamFrame]:
        """Get latest frame for streaming."""
        return self._buffer

    def show(self, rendered_frame: np.ndarray) -> bool:
        if self._inner:
            return self._inner.show(rendered_frame)
        return True

    def close(self) -> None:
        if self._inner:
            self._inner.close()

    @property
    def renderer_info(self) -> dict:
        return {
            'type': 'streaming',
            'frame_count': self._frame_count,
            'max_fps': self._settings.max_fps,
            'quality': self._settings.quality,
            'inner': self._inner.renderer_info if self._inner else None,
        }

class MJPEGStreamServer:
    """
    Async MJPEG streaming server using aiohttp.

    Endpoints:
    - GET /stream - MJPEG video stream
    - GET /snapshot - Single JPEG frame
    - GET /status - JSON status
    - GET / - Simple HTML viewer
    """

    def __init__(
        self,
        renderer: StreamingRenderer,
        settings: StreamingSettings,
    ):
        if not AIOHTTP_AVAILABLE:
            raise ImportError("aiohttp required for streaming: pip install aiohttp")

        self._renderer = renderer
        self._settings = settings
        self._app = web.Application()
        self._setup_routes()
        self._running = False

    def _setup_routes(self) -> None:
        self._app.router.add_get('/', self._handle_index)
        self._app.router.add_get('/stream', self._handle_stream)
        self._app.router.add_get('/snapshot', self._handle_snapshot)
        self._app.router.add_get('/status', self._handle_status)

    async def _handle_index(self, request: web.Request) -> web.Response:
        """Serve simple HTML viewer."""
        html = '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Drone Detector Stream</title>
            <style>
                body { font-family: sans-serif; margin: 20px; background: #1a1a1a; color: white; }
                img { max-width: 100%; border: 2px solid #333; }
                .status { margin-top: 10px; padding: 10px; background: #333; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>Drone Detector - Live Stream</h1>
            <img src="/stream" alt="Live Stream">
            <div class="status" id="status">Loading...</div>
            <script>
                setInterval(async () => {
                    const resp = await fetch('/status');
                    const data = await resp.json();
                    document.getElementById('status').innerHTML =
                        `Frames: ${data.frame_count} | ` +
                        `Clients: ${data.active_clients}`;
                }, 1000);
            </script>
        </body>
        </html>
        '''
        return web.Response(text=html, content_type='text/html')

    async def _handle_stream(self, request: web.Request) -> web.StreamResponse:
        """Handle MJPEG stream request."""
        # Auth check
        if self._settings.auth_enabled:
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            if token != self._settings.auth_token:
                raise web.HTTPUnauthorized()

        response = web.StreamResponse(
            status=200,
            headers={
                'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
                'Cache-Control': 'no-cache',
            }
        )
        await response.prepare(request)

        try:
            last_frame_num = -1
            while True:
                frame = await self._renderer.get_frame()

                if frame and frame.frame_number != last_frame_num:
                    await response.write(
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' +
                        frame.jpeg_data +
                        b'\r\n'
                    )
                    last_frame_num = frame.frame_number

                await asyncio.sleep(1 / self._settings.max_fps)

        except asyncio.CancelledError:
            pass

        return response

    async def _handle_snapshot(self, request: web.Request) -> web.Response:
        """Return single JPEG frame."""
        frame = await self._renderer.get_frame()
        if not frame:
            raise web.HTTPServiceUnavailable()

        return web.Response(
            body=frame.jpeg_data,
            content_type='image/jpeg',
        )

    async def _handle_status(self, request: web.Request) -> web.Response:
        """Return JSON status."""
        frame = await self._renderer.get_frame()
        return web.json_response({
            'running': self._running,
            'frame_count': self._renderer._frame_count,
            'last_frame': frame.frame_number if frame else None,
            'settings': {
                'max_fps': self._settings.max_fps,
                'quality': self._settings.quality,
            }
        })

    async def start(self) -> None:
        """Start the streaming server."""
        runner = web.AppRunner(self._app)
        await runner.setup()

        site = web.TCPSite(
            runner,
            self._settings.host,
            self._settings.port,
        )
        await site.start()

        self._running = True
        logger.info(f"Streaming server started on http://{self._settings.host}:{self._settings.port}")

    async def stop(self) -> None:
        """Stop the streaming server."""
        self._running = False
```

---

## Phase 5: Targeting & Engagement System

### 5.1 Targeting Module

**targeting.py:**

```python
"""
Targeting and engagement system for drone interception.

WARNING: This module controls physical hardware (GPIO).
Ensure proper safety measures are in place before enabling.
"""
import logging
import time
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Tuple
import math

from interfaces import Detection, BoundingBox, TrackedObject
from config.settings import TargetingSettings
from config.constants import DRONE_TYPICAL_SIZE_M, FOCAL_LENGTH_PI_CAM_V2, SENSOR_WIDTH_PI_CAM_V2

logger = logging.getLogger(__name__)

class TargetState(Enum):
    """Target engagement states."""
    SEARCHING = "searching"
    TRACKING = "tracking"
    LOCKED = "locked"
    ENGAGING = "engaging"
    COOLDOWN = "cooldown"

@dataclass
class TargetLock:
    """Information about a locked target."""
    track_id: int
    detection: Detection
    lock_time: float
    estimated_distance_m: float
    estimated_velocity_ms: Tuple[float, float]
    confidence_history: List[float] = field(default_factory=list)

    @property
    def average_confidence(self) -> float:
        if not self.confidence_history:
            return 0.0
        return sum(self.confidence_history) / len(self.confidence_history)

    @property
    def lock_duration(self) -> float:
        return time.time() - self.lock_time

class DistanceEstimator:
    """
    Estimate distance to detected objects using pinhole camera model.

    Uses known object size and focal length to estimate distance.
    """

    def __init__(
        self,
        focal_length_mm: float = FOCAL_LENGTH_PI_CAM_V2,
        sensor_width_mm: float = SENSOR_WIDTH_PI_CAM_V2,
        assumed_object_size_m: float = DRONE_TYPICAL_SIZE_M,
    ):
        self._focal_length_mm = focal_length_mm
        self._sensor_width_mm = sensor_width_mm
        self._assumed_size_m = assumed_object_size_m

    def estimate(
        self,
        bbox: BoundingBox,
        frame_width: int,
    ) -> float:
        """
        Estimate distance to object.

        Formula: distance = (real_size * focal_length * image_width) / (bbox_size * sensor_width)

        Returns distance in meters.
        """
        # Use larger dimension for more stable estimate
        bbox_size_px = max(bbox.width, bbox.height)

        if bbox_size_px <= 0:
            return float('inf')

        # Convert focal length to pixels
        focal_length_px = (self._focal_length_mm / self._sensor_width_mm) * frame_width

        # Distance estimation
        distance_m = (self._assumed_size_m * focal_length_px) / bbox_size_px

        return distance_m

class TargetingSystem:
    """
    Target acquisition and tracking system.

    Manages target locks, distance estimation, and firing decisions.
    """

    def __init__(self, settings: TargetingSettings):
        self._settings = settings
        self._distance_estimator = DistanceEstimator()
        self._current_lock: Optional[TargetLock] = None
        self._state = TargetState.SEARCHING
        self._last_state_change = time.time()

    @property
    def state(self) -> TargetState:
        return self._state

    @property
    def current_lock(self) -> Optional[TargetLock]:
        return self._current_lock

    def update(
        self,
        tracked_objects: List[TrackedObject],
        frame_width: int,
    ) -> Optional[TargetLock]:
        """
        Update targeting system with latest tracks.

        Returns current target lock if any.
        """
        # Find best target candidate
        best_target = self._select_best_target(tracked_objects, frame_width)

        if best_target is None:
            self._handle_no_target()
            return None

        track, distance = best_target

        # Update or create lock
        if self._current_lock and self._current_lock.track_id == track.track_id:
            self._update_existing_lock(track, distance)
        else:
            self._create_new_lock(track, distance)

        return self._current_lock

    def _select_best_target(
        self,
        tracked_objects: List[TrackedObject],
        frame_width: int,
    ) -> Optional[Tuple[TrackedObject, float]]:
        """Select best target based on confidence, distance, and track quality."""
        candidates = []

        for track in tracked_objects:
            det = track.detection

            # Must be a drone
            if not det.is_drone:
                continue

            # Must meet minimum confidence
            if det.confidence < self._settings.min_confidence_for_lock:
                continue

            # Estimate distance
            distance = self._distance_estimator.estimate(det.bbox, frame_width)

            # Must be within targeting range
            if distance > self._settings.max_targeting_distance_m:
                continue

            # Score: prefer closer, higher confidence, longer tracked
            score = (
                det.confidence * 0.4 +
                (1 - distance / self._settings.max_targeting_distance_m) * 0.3 +
                min(track.frames_tracked / 30, 1.0) * 0.3
            )

            candidates.append((track, distance, score))

        if not candidates:
            return None

        # Return highest scoring target
        candidates.sort(key=lambda x: x[2], reverse=True)
        return (candidates[0][0], candidates[0][1])

    def _handle_no_target(self) -> None:
        """Handle loss of target."""
        if self._current_lock:
            lock_duration = time.time() - self._current_lock.lock_time
            if lock_duration > self._settings.lock_timeout_seconds:
                logger.info(f"Target lock lost: track {self._current_lock.track_id}")
                self._current_lock = None
                self._state = TargetState.SEARCHING

    def _update_existing_lock(self, track: TrackedObject, distance: float) -> None:
        """Update existing target lock."""
        self._current_lock.detection = track.detection
        self._current_lock.estimated_distance_m = distance
        self._current_lock.estimated_velocity_ms = track.velocity
        self._current_lock.confidence_history.append(track.detection.confidence)

        # Keep last N confidence values
        if len(self._current_lock.confidence_history) > 30:
            self._current_lock.confidence_history.pop(0)

        # Upgrade to LOCKED if stable enough
        if (
            self._state == TargetState.TRACKING and
            len(self._current_lock.confidence_history) >= 10 and
            self._current_lock.average_confidence >= self._settings.min_confidence_for_lock
        ):
            self._state = TargetState.LOCKED
            logger.info(f"Target locked: track {track.track_id}, distance {distance:.1f}m")

    def _create_new_lock(self, track: TrackedObject, distance: float) -> None:
        """Create new target lock."""
        self._current_lock = TargetLock(
            track_id=track.track_id,
            detection=track.detection,
            lock_time=time.time(),
            estimated_distance_m=distance,
            estimated_velocity_ms=track.velocity,
            confidence_history=[track.detection.confidence],
        )
        self._state = TargetState.TRACKING
        logger.info(f"New target acquired: track {track.track_id}, distance {distance:.1f}m")

    def can_engage(self) -> bool:
        """Check if current target can be engaged."""
        if not self._current_lock:
            return False

        if self._state != TargetState.LOCKED:
            return False

        return True

    def get_lead_point(self) -> Optional[Tuple[int, int]]:
        """
        Calculate lead point for interception.

        Returns predicted target position accounting for velocity.
        """
        if not self._current_lock:
            return None

        det = self._current_lock.detection
        cx, cy = det.bbox.center
        vx, vy = self._current_lock.estimated_velocity_ms

        # Apply lead factor
        lead_x = int(cx + vx * self._settings.tracking_lead_factor)
        lead_y = int(cy + vy * self._settings.tracking_lead_factor)

        return (lead_x, lead_y)

class FireNetController:
    """
    Controller for fire net deployment system.

    SAFETY CRITICAL: This controls physical hardware.
    Multiple safety interlocks are implemented.
    """

    def __init__(self, settings: TargetingSettings):
        self._settings = settings
        self._is_armed = False
        self._last_fire_time = 0.0
        self._fire_count = 0
        self._gpio_initialized = False

    @property
    def is_armed(self) -> bool:
        return self._is_armed

    @property
    def is_enabled(self) -> bool:
        return self._settings.fire_net_enabled

    @property
    def in_cooldown(self) -> bool:
        return time.time() - self._last_fire_time < self._settings.fire_net_cooldown_seconds

    def arm(self) -> bool:
        """
        Arm the fire net system.

        Returns True if successfully armed.
        """
        if not self._settings.fire_net_enabled:
            logger.warning("Fire net is disabled in settings")
            return False

        if not self._settings.fire_net_arm_required:
            logger.warning("Arm requirement bypassed - use with caution")

        self._init_gpio()
        self._is_armed = True
        logger.warning("FIRE NET ARMED")
        return True

    def disarm(self) -> None:
        """Disarm the fire net system."""
        self._is_armed = False
        logger.info("Fire net disarmed")

    def can_fire(
        self,
        track: TrackedObject,
        estimated_distance: float,
    ) -> bool:
        """
        Check if all conditions are met for firing.

        Safety interlocks:
        1. System must be armed
        2. Must be enabled in settings
        3. Not in cooldown
        4. Target must meet confidence threshold
        5. Target must be tracked for minimum frames
        6. Distance must be within engagement envelope
        7. Velocity must be below threshold
        """
        if not self._is_armed:
            return False

        if not self._settings.fire_net_enabled:
            return False

        if self.in_cooldown:
            return False

        det = track.detection

        # Confidence check
        if det.drone_score < self._settings.fire_net_min_confidence:
            return False

        # Track stability check
        if track.frames_tracked < self._settings.fire_net_min_track_frames:
            return False

        # Distance envelope check
        if estimated_distance > self._settings.fire_net_max_distance_m:
            return False

        if estimated_distance < self._settings.fire_net_min_distance_m:
            return False

        # Velocity check (don't fire at very fast targets)
        velocity = math.sqrt(track.velocity[0]**2 + track.velocity[1]**2)
        if velocity > self._settings.fire_net_velocity_threshold_ms:
            return False

        return True

    def fire(self, track: TrackedObject) -> bool:
        """
        Deploy fire net.

        Returns True if firing command sent successfully.
        """
        if not self.can_fire(track, track.detection.drone_score):
            return False

        logger.warning(f"FIRE NET DEPLOYED at track {track.track_id}")

        self._trigger_gpio()
        self._last_fire_time = time.time()
        self._fire_count += 1

        return True

    def _init_gpio(self) -> None:
        """Initialize GPIO for fire net trigger."""
        if self._gpio_initialized:
            return

        try:
            import RPi.GPIO as GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self._settings.fire_net_gpio_pin, GPIO.OUT)
            GPIO.output(self._settings.fire_net_gpio_pin, GPIO.LOW)
            self._gpio_initialized = True
            logger.info(f"GPIO pin {self._settings.fire_net_gpio_pin} initialized")
        except ImportError:
            logger.warning("RPi.GPIO not available - fire net will be simulated")
        except Exception as e:
            logger.error(f"GPIO initialization failed: {e}")

    def _trigger_gpio(self) -> None:
        """Send trigger pulse to GPIO."""
        try:
            import RPi.GPIO as GPIO
            GPIO.output(self._settings.fire_net_gpio_pin, GPIO.HIGH)
            time.sleep(0.1)  # 100ms pulse
            GPIO.output(self._settings.fire_net_gpio_pin, GPIO.LOW)
        except ImportError:
            logger.info("GPIO trigger simulated")

    def cleanup(self) -> None:
        """Clean up GPIO resources."""
        if self._gpio_initialized:
            try:
                import RPi.GPIO as GPIO
                GPIO.cleanup(self._settings.fire_net_gpio_pin)
            except ImportError:
                pass
            self._gpio_initialized = False
```

---

## Phase 6: Documentation

### 6.1 Documentation Structure

```
apps/pi-drone-detector/
├── docs/
│   ├── index.md                 # Overview
│   ├── getting-started.md       # Quick start guide
│   ├── installation.md          # Detailed installation
│   ├── configuration.md         # Configuration reference
│   ├── architecture.md          # System architecture
│   ├── api/
│   │   ├── interfaces.md        # Protocol reference
│   │   ├── frame-sources.md     # Frame source API
│   │   ├── inference.md         # Inference engine API
│   │   ├── trackers.md          # Tracker API
│   │   ├── targeting.md         # Targeting system API
│   │   └── streaming.md         # Streaming API
│   ├── guides/
│   │   ├── custom-components.md # Adding custom components
│   │   ├── deployment.md        # Production deployment
│   │   ├── performance.md       # Performance tuning
│   │   └── troubleshooting.md   # Common issues
│   └── safety/
│       └── targeting-safety.md  # Targeting system safety guide
├── mkdocs.yml                   # MkDocs configuration
└── README.md                    # Project README
```

### 6.2 MkDocs Configuration

**mkdocs.yml:**

```yaml
site_name: Pi Drone Detector
site_description: Real-time drone detection for Raspberry Pi
repo_url: https://github.com/JustAGhosT/PhoenixRooivalk

theme:
  name: material
  palette:
    primary: red
    accent: orange
  features:
    - navigation.tabs
    - navigation.sections
    - content.code.copy

plugins:
  - search
  - mkdocstrings:
      handlers:
        python:
          paths: [src]

nav:
  - Home: index.md
  - Getting Started: getting-started.md
  - Installation: installation.md
  - Configuration: configuration.md
  - Architecture: architecture.md
  - API Reference:
      - Interfaces: api/interfaces.md
      - Frame Sources: api/frame-sources.md
      - Inference: api/inference.md
      - Trackers: api/trackers.md
      - Targeting: api/targeting.md
      - Streaming: api/streaming.md
  - Guides:
      - Custom Components: guides/custom-components.md
      - Deployment: guides/deployment.md
      - Performance: guides/performance.md
      - Troubleshooting: guides/troubleshooting.md
  - Safety:
      - Targeting Safety: safety/targeting-safety.md

markdown_extensions:
  - admonition
  - codehilite
  - pymdownx.superfences
  - pymdownx.tabbed
```

---

## Implementation Priority

| Phase             | Priority | Estimated Effort | Dependencies |
| ----------------- | -------- | ---------------- | ------------ |
| 1.1 Configuration | HIGH     | 2 days           | None         |
| 1.2 Code Quality  | HIGH     | 3 days           | 1.1          |
| 1.3 Logging       | HIGH     | 1 day            | 1.1          |
| 2.1-2.3 Testing   | HIGH     | 4 days           | 1.1, 1.2     |
| 3.1-3.2 CI/CD     | MEDIUM   | 2 days           | 2.x          |
| 4.1-4.2 Streaming | MEDIUM   | 3 days           | 1.x          |
| 5.1 Targeting     | MEDIUM   | 4 days           | 1.x, 2.x     |
| 6.1-6.2 Docs      | LOW      | 3 days           | All          |

**Total: ~22 days of focused development**

---

## Next Steps

1. Review and approve this plan
2. Create feature branches for each phase
3. Implement Phase 1 (Foundation) first
4. Add tests as each component is built
5. Set up CI/CD early (Phase 3) to catch regressions
6. Document as we go (Phase 6)
