---
sidebar_position: 1
title: Architecture Overview
description: Pi Drone Detector v2.0 modular architecture and component design
keywords: [detector, architecture, raspberry pi, components]
---

# Pi Drone Detector Architecture

## Overview

The Pi Drone Detector v2.0 uses a modular, interface-based architecture that allows
hot-swapping of components based on available hardware. This design follows SOLID
principles and enables easy testing, extension, and customization.

## Core Design Principles

1. **Interface Segregation**: Each component type has a dedicated abstract interface
2. **Dependency Injection**: Components are wired together through the factory
3. **Single Responsibility**: Each module handles one aspect of the system
4. **Open/Closed**: Easy to extend with new implementations without modifying existing code

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DetectionPipeline                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────┐       ┌──────────────────┐       ┌──────────────────┐  │
│   │  FrameSource   │──────>│ InferenceEngine  │──────>│  ObjectTracker   │  │
│   │                │       │                  │       │                  │  │
│   │ - PiCamera     │       │ - TFLite         │       │ - NoOp           │  │
│   │ - USB          │       │ - ONNX           │       │ - Centroid       │  │
│   │ - VideoFile    │       │ - Coral          │       │ - Kalman         │  │
│   │ - Mock         │       │ - Mock           │       │                  │  │
│   └────────────────┘       └──────────────────┘       └──────────────────┘  │
│           │                        │                          │             │
│           │                        │                          │             │
│           ▼                        ▼                          ▼             │
│   ┌────────────────┐       ┌──────────────────┐       ┌──────────────────┐  │
│   │   Hardware     │       │   DroneScorer    │       │  AlertHandler    │  │
│   │   Detection    │       │                  │       │                  │  │
│   │                │       │ - Model weight   │       │ - Console        │  │
│   │ - Platform     │       │ - Aspect ratio   │       │ - Webhook        │  │
│   │ - Camera       │       │ - Heuristics     │       │ - File           │  │
│   │ - Accelerator  │       │                  │       │ - Composite      │  │
│   └────────────────┘       └──────────────────┘       └──────────────────┘  │
│           │                                                    │            │
│           │                                                    │            │
│           ▼                                                    ▼            │
│   ┌────────────────┐       ┌──────────────────┐       ┌──────────────────┐  │
│   │  Targeting     │       │  FrameRenderer   │──────>│   Streaming      │  │
│   │  System        │       │                  │       │   Server         │  │
│   │                │       │ - OpenCV         │       │                  │  │
│   │ - Distance Est.│       │ - Headless       │       │ - MJPEG          │  │
│   │ - Fire Net     │       │ - Streaming      │       │ - Snapshot       │  │
│   │ - Target Lock  │       │                  │       │ - Status         │  │
│   └────────────────┘       └──────────────────┘       └──────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Interfaces

### FrameSource

Provides frames from various sources (cameras, files).

```python
class FrameSource(ABC):
    @abstractmethod
    def open(self) -> bool: ...

    @abstractmethod
    def read(self) -> Optional[FrameData]: ...

    @abstractmethod
    def close(self) -> None: ...

    @property
    @abstractmethod
    def resolution(self) -> Tuple[int, int]: ...
```

Implementations:
- `PiCameraSource`: Raspberry Pi camera via libcamera/picamera2
- `USBCameraSource`: USB webcam via OpenCV
- `VideoFileSource`: Video file playback
- `MockFrameSource`: Synthetic frames for testing

### InferenceEngine

Runs object detection on frames.

```python
class InferenceEngine(ABC):
    @abstractmethod
    def load_model(self, model_path: str) -> bool: ...

    @abstractmethod
    def detect(self, frame: np.ndarray) -> InferenceResult: ...

    @abstractmethod
    def set_confidence_threshold(self, threshold: float) -> None: ...
```

Implementations:
- `TFLiteEngine`: TensorFlow Lite (optimized for Pi)
- `ONNXEngine`: ONNX Runtime
- `CoralEngine`: Google Coral Edge TPU
- `MockInferenceEngine`: Returns synthetic detections

### ObjectTracker

Tracks objects across frames and assigns consistent IDs.

```python
class ObjectTracker(ABC):
    @abstractmethod
    def update(self, detections: List[Detection], frame: Optional[np.ndarray] = None) -> List[TrackedObject]: ...

    @abstractmethod
    def reset(self) -> None: ...
```

Implementations:
- `NoOpTracker`: Pass-through, no tracking
- `CentroidTracker`: Simple centroid-based matching
- `KalmanTracker`: Kalman filter with motion prediction

### AlertHandler

Handles detection alerts.

```python
class AlertHandler(ABC):
    @abstractmethod
    def send_alert(self, detection: Detection, frame_data: FrameData) -> bool: ...

    @abstractmethod
    def flush(self) -> None: ...
```

Implementations:
- `ConsoleAlertHandler`: Prints to stdout
- `WebhookAlertHandler`: HTTP POST to endpoint
- `FileAlertHandler`: Appends to JSON file
- `CompositeAlertHandler`: Multiple handlers

### FrameRenderer

Visualizes frames with detections.

```python
class FrameRenderer(ABC):
    @abstractmethod
    def render(self, frame_data: FrameData, detections: List[Detection], tracked_objects: List[TrackedObject], inference_time_ms: float) -> Optional[np.ndarray]: ...

    @abstractmethod
    def show(self, rendered_frame: np.ndarray) -> bool: ...
```

Implementations:
- `OpenCVRenderer`: Display with cv2.imshow
- `HeadlessRenderer`: Periodic logging, no display
- `StreamingRenderer`: Wraps another renderer for MJPEG streaming

## Data Flow

1. **Frame Capture**: `FrameSource` captures frames with metadata
2. **Inference**: `InferenceEngine` runs detection, returns `InferenceResult`
3. **Scoring**: `DroneScorer` calculates drone likelihood for each detection
4. **Tracking**: `ObjectTracker` assigns persistent IDs
5. **Alerting**: `AlertHandler` sends alerts for drone detections
6. **Targeting**: `TargetingSystem` estimates distance, manages engagement
7. **Rendering**: `FrameRenderer` visualizes results
8. **Streaming**: `StreamingServer` serves MJPEG stream

## Configuration System

Settings are managed via Pydantic models with validation:

```
Settings (root)
├── CaptureSettings
├── InferenceSettings
├── DroneScoreSettings
├── TrackerSettings
├── TargetingSettings
├── AlertSettings
├── StreamingSettings
├── LoggingSettings
└── DisplaySettings
```

Configuration sources (in order of precedence):
1. CLI arguments
2. Environment variables
3. YAML configuration file
4. Default values

## Factory Pattern

The `factory.py` module wires components together:

```python
pipeline = create_pipeline(
    model_path="model.tflite",
    camera_source="auto",    # Auto-detect camera
    engine_type="auto",      # Auto-select engine
    tracker_type="centroid", # Use centroid tracker
    stream_enabled=True,     # Enable streaming
    stream_port=8080,
)

if pipeline.start():
    # Run detection loop
    pipeline.stop()
```

## Hardware Detection

The `hardware.py` module auto-detects:
- Platform (Pi 4, Pi 5, Desktop)
- Camera type and capabilities
- Accelerators (Coral USB/PCIe)
- Memory and CPU resources

This information configures optimal settings automatically.

## Targeting System

The targeting module provides:

### Distance Estimation
Uses pinhole camera model:
```
distance = (assumed_size * focal_length) / bbox_size
```

### Fire Net Controller
Safety interlocks:
1. Armed flag required
2. Minimum confidence (0.85)
3. Minimum track frames (10)
4. Distance envelope (5m - 50m)
5. Velocity threshold (< 30 m/s)
6. Cooldown period

## Streaming Architecture

MJPEG streaming uses a producer/consumer pattern:

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│StreamingRend.│────>│ FrameBuffer │────>│ MJPEG Server │
│  (Producer)  │     │(Thread-safe)│     │  (Consumers) │
└──────────────┘     └─────────────┘     └──────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   Clients   │
                     │ (Browsers)  │
                     └─────────────┘
```

Endpoints:
- `/` - HTML viewer with live status
- `/stream` - MJPEG video stream
- `/snapshot` - Single JPEG frame
- `/status` - JSON system status
- `/health` - Health check

## Testing Strategy

### Unit Tests
- Component-level tests with mocks
- Shared fixtures in `conftest.py`
- No hardware dependencies

### Integration Tests
- Multi-component tests
- Mock hardware when needed
- Marker: `@pytest.mark.integration`

### Hardware Tests
- Real hardware required
- Marker: `@pytest.mark.hardware`
- Run manually on target device

## Extending the System

### Adding a New Camera Source

1. Implement `FrameSource` interface
2. Add to `frame_sources.py`
3. Register in factory

```python
class MyCustomSource(FrameSource):
    def open(self) -> bool:
        # Initialize camera
        return True

    def read(self) -> Optional[FrameData]:
        # Capture frame
        return FrameData(...)

    # ... implement other methods
```

### Adding a New Inference Engine

1. Implement `InferenceEngine` interface
2. Add to `inference_engines.py`
3. Register in factory

### Adding a New Tracker

1. Implement `ObjectTracker` interface
2. Add to `trackers.py`
3. Register in factory
