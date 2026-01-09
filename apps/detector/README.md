# Detector v2.0

Modular, platform-agnostic detection system for edge devices.
Supports Raspberry Pi, NVIDIA Jetson, and desktop development.

Part of the [PhoenixRooivalk](../../README.md) counter-UAS platform.

## Features

- **Platform Agnostic**: Works on Raspberry Pi, Jetson, desktop, or any Linux system
- **Modular Architecture**: Swap cameras, inference engines, and trackers at runtime
- **Multiple Inference Backends**: TFLite, ONNX, Coral Edge TPU
- **Object Tracking**: Centroid and Kalman filter trackers
- **Web Streaming**: MJPEG stream with status dashboard
- **Targeting System**: Distance estimation and engagement control
- **Auto-Configuration**: Automatic hardware detection and optimization

## Quick Start

### 1. Setup Environment

```bash
# Clone repo (or copy this folder)
cd ~/
git clone https://github.com/JustAGhosT/PhoenixRooivalk.git
cd PhoenixRooivalk/apps/detector

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (choose your platform)
pip install -e ".[pi]"           # Raspberry Pi with TFLite
pip install -e ".[pi,coral]"     # Pi + Coral Edge TPU
pip install -e ".[jetson]"       # NVIDIA Jetson
pip install -e ".[streaming]"    # Web streaming support
pip install -e ".[dev]"          # Development with all tools

# Enable camera (if using Pi Camera on Raspberry Pi)
sudo raspi-config  # Interface Options > Camera > Enable
```

### 2. Get a Model

#### Option A: Use pre-trained YOLOv5n (quick start, less accurate)

```bash
# Download YOLOv5n and convert to TFLite
pip install ultralytics
python -c "from ultralytics import YOLO; \
  YOLO('yolov5n.pt').export(format='tflite', imgsz=320, int8=True)"
cp yolov5n_int8.tflite models/
```

#### Option B: Train custom model on Azure (recommended)

```bash
# See azure-ml/ folder for training scripts
cd azure-ml
./setup-azure.sh
# Follow instructions to upload dataset and train
```

### 3. Run Detection

```bash
# With display
python src/main.py --model models/drone-detector_int8.tflite

# Headless (no monitor)
python src/main.py --model models/drone-detector_int8.tflite --headless

# With Coral USB Accelerator (10x faster)
python src/main.py --model models/drone-detector_int8.tflite --coral

# With web streaming
python src/main.py --model models/drone-detector_int8.tflite --stream --stream-port 8080

# With object tracking
python src/main.py --model models/drone-detector_int8.tflite --tracker centroid

# Save detections to file
python src/main.py --model models/drone-detector_int8.tflite --save-detections detections.json

# Full example with all features
python src/main.py --model models/drone-detector_int8.tflite \
  --tracker kalman \
  --stream --stream-port 8080 \
  --alert-webhook https://api.example.com/detections \
  --save-detections detections.json
```

### 4. Web Streaming

When streaming is enabled, access the following endpoints:

- `http://<pi-ip>:8080/` - Live viewer dashboard
- `http://<pi-ip>:8080/stream` - MJPEG video stream
- `http://<pi-ip>:8080/snapshot` - Single JPEG frame
- `http://<pi-ip>:8080/status` - JSON system status
- `http://<pi-ip>:8080/health` - Health check endpoint

## Project Structure

```text
pi-drone-detector/
├── src/
│   ├── interfaces.py       # Abstract base classes (Protocols)
│   ├── frame_sources.py    # Camera implementations (Pi, USB, Video, Mock)
│   ├── inference_engines.py # Inference backends (TFLite, ONNX, Coral)
│   ├── trackers.py         # Object trackers (Centroid, Kalman)
│   ├── renderers.py        # Frame visualization
│   ├── streaming.py        # MJPEG web streaming server
│   ├── alert_handlers.py   # Alert handlers (Console, Webhook, File)
│   ├── targeting.py        # Distance estimation & fire net control
│   ├── hardware.py         # Hardware auto-detection
│   ├── factory.py          # Component wiring and pipeline creation
│   ├── main.py             # CLI entry point
│   ├── config/
│   │   ├── settings.py     # Pydantic configuration models
│   │   └── constants.py    # Immutable configuration values
│   └── utils/
│       ├── geometry.py     # IoU, NMS, bbox utilities
│       └── logging_config.py # Structured logging
├── tests/
│   ├── conftest.py         # Shared pytest fixtures
│   └── unit/               # Unit tests
├── azure-ml/               # Azure ML training infrastructure
│   ├── train.py            # Training script
│   ├── job.yaml            # Azure ML job definition
│   └── setup-azure.sh      # One-click Azure setup
├── docs/                   # Documentation
├── models/                 # Trained models (.tflite, .onnx)
├── pyproject.toml          # Project configuration & dependencies
├── requirements.txt        # Core runtime dependencies
├── requirements-dev.txt    # Development dependencies
└── README.md
```

## Architecture

The system uses a modular, interface-based architecture that allows swapping components:

```text
┌─────────────────────────────────────────────────────────────┐
│                      DetectionPipeline                       │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐    ┌────────────────┐    ┌──────────────┐  │
│  │FrameSource │───>│InferenceEngine │───>│ObjectTracker │  │
│  └────────────┘    └────────────────┘    └──────────────┘  │
│        ▲                   │                     │          │
│        │                   ▼                     ▼          │
│  ┌────────────┐    ┌────────────────┐    ┌──────────────┐  │
│  │  Hardware  │    │   DroneScorer  │    │AlertHandler  │  │
│  │  Detection │    └────────────────┘    └──────────────┘  │
│  └────────────┘                                │          │
│        │                                       ▼          │
│        │           ┌────────────────┐    ┌──────────────┐  │
│        └──────────>│   Renderer     │───>│  Streaming   │  │
│                    └────────────────┘    │   Server     │  │
│                                          └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Swappable Components

| Component | Implementations |
|-----------|-----------------|
| FrameSource | PiCameraSource, USBCameraSource, VideoFileSource, MockFrameSource |
| InferenceEngine | TFLiteEngine, ONNXEngine, CoralEngine, MockInferenceEngine |
| ObjectTracker | NoOpTracker, CentroidTracker, KalmanTracker |
| AlertHandler | ConsoleAlertHandler, WebhookAlertHandler, FileAlertHandler |
| FrameRenderer | OpenCVRenderer, HeadlessRenderer, StreamingRenderer |

## Configuration

### YAML Configuration File

Create a `config.yaml` file to customize all settings:

```yaml
camera_type: auto  # auto, picamera, usb, video, mock
engine_type: auto  # auto, tflite, onnx, coral, mock
tracker_type: centroid  # none, centroid, kalman

capture:
  width: 640
  height: 480
  fps: 30

inference:
  model_path: "models/drone-detector_int8.tflite"
  confidence_threshold: 0.5
  nms_threshold: 0.45
  num_threads: 4

targeting:
  max_targeting_distance_m: 100.0
  fire_net_enabled: false
  fire_net_min_confidence: 0.85
  fire_net_min_track_frames: 10
  fire_net_arm_required: true

streaming:
  enabled: false
  port: 8080
  quality: 80
  max_fps: 15

display:
  headless: false
  show_fps: true
  show_drone_score: true
```

### Environment Variables

All settings can be overridden via environment variables:

```bash
export CAPTURE_WIDTH=1280
export CAPTURE_HEIGHT=720
export INFERENCE_CONFIDENCE_THRESHOLD=0.6
export STREAM_ENABLED=true
export STREAM_PORT=8080
```

## Training on Azure ML

### Cost: ~$3-5 for full training run

```bash
# 1. Setup Azure resources
cd azure-ml
./setup-azure.sh

# 2. Prepare dataset
cd ../scripts
python download_datasets.py --output ../data

# 3. Add your own images
# - Add drone images to data/combined/images/train/
# - Add coke can images to data/negatives/images/
# - Label with Roboflow (free): https://roboflow.com

# 4. Upload to Azure
az ml data create --name drone-dataset --path ../data/combined \
  --type uri_folder --resource-group rg-drone-training \
  --workspace-name mlw-drone-detection

# 5. Start training
az ml job create --file job.yaml \
  --resource-group rg-drone-training --workspace-name mlw-drone-detection

# 6. Download trained model
az ml job download --name <job-name> --output-name model --download-path ./trained
scp trained/exports/drone-detector_int8.tflite pi@raspberrypi:~/models/
```

## Performance

| Configuration | FPS | Notes |
|--------------|-----|-------|
| Pi 4 + TFLite | 5-8 | Baseline |
| Pi 5 + TFLite | 12-18 | 2x faster |
| Pi 4 + Coral USB | 25-35 | 10x speedup |
| Pi 5 + Coral USB | 40-50 | Best performance |

## Classes

The model supports multiple classification configurations. See `configs/` for options.

### MVP Configuration (10 classes)

| Class ID | Name | Examples |
|----------|------|----------|
| 0 | drone | Quadcopters, multirotors, fixed-wing UAVs, racing drones |
| 1 | bird_small | Sparrows, finches (<40cm wingspan) |
| 2 | bird_large | Eagles, hawks, flocks (>40cm wingspan) |
| 3 | aircraft | Planes, helicopters, gliders, hot air balloons |
| 4 | recreational | Kites, party balloons, weather balloons, RC planes |
| 5 | sports | Balls, frisbees, projectiles |
| 6 | debris | Plastic bags, paper, leaves, feathers |
| 7 | insect | Flies, bees, dragonflies (close to camera) |
| 8 | atmospheric | Rain, snow, lens flare, artifacts |
| 9 | background | Sky, clouds, nothing detected |

### Binary Configuration (2 classes)

For simpler use cases, use `configs/dataset-binary.yaml`:

| Class ID | Name | Examples |
|----------|------|----------|
| 0 | drone | All UAVs/drones |
| 1 | not_drone | Everything else |

## Detection Output

```json
{
  "timestamp": "2026-01-07T12:00:00",
  "class_id": 0,
  "class_name": "drone",
  "confidence": 0.87,
  "bbox": [120, 80, 280, 200],
  "drone_score": 0.92,
  "is_drone": true
}
```

## Integration with PhoenixRooivalk

Send detections to the main platform:

```bash
python src/main.py --model models/drone-detector_int8.tflite \
  --alert-webhook https://your-phoenixrooivalk-api/api/detections
```

## Troubleshooting

### Camera not found

```bash
# Enable legacy camera support
sudo raspi-config  # Interface Options > Legacy Camera > Enable

# Or use libcamera
libcamera-hello --timeout 5000

# Check video devices
ls -la /dev/video*
```

### Low FPS

- Use smaller input size: `--width 320 --height 240`
- Add Coral USB Accelerator
- Use Pi 5 instead of Pi 4
- Enable headless mode: `--headless`

### TFLite import error

```bash
# Install Pi-optimized TFLite runtime
pip install tflite-runtime
```

## Targeting System

The targeting module provides distance estimation and engagement control:

### Distance Estimation

Uses pinhole camera model to estimate target distance:

```python
distance = (assumed_drone_size * focal_length_px) / bbox_size_px
```

Configure in `config.yaml`:
```yaml
targeting:
  assumed_drone_size_m: 0.30  # Assumed drone size (30cm)
  max_targeting_distance_m: 100.0  # Max tracking distance
```

### Fire Net Controller

Safety interlocks before engagement:
1. System must be armed
2. Minimum confidence threshold (0.85)
3. Minimum track frames (10)
4. Distance envelope (5m - 50m)
5. Velocity threshold (< 30 m/s)
6. Cooldown period between triggers

## Development

### Setup Development Environment

```bash
# Install development dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_targeting.py -v
```

### Code Quality

```bash
# Format code
black src tests
isort src tests

# Lint
ruff check src tests

# Type check
mypy src
```

### CI/CD

The project uses GitHub Actions for continuous integration:
- **Lint**: ruff, black, isort, mypy
- **Test**: pytest on Python 3.9-3.11
- **Security**: pip-audit, bandit

## API Reference

See [docs/](docs/) for detailed API documentation.

## License

MIT - Part of PhoenixRooivalk project
