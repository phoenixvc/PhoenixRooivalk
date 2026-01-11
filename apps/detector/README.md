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

# With object tracking
python src/main.py --model models/drone-detector_int8.tflite --tracker centroid

# Save detections to file
python src/main.py --model models/drone-detector_int8.tflite --save-detections detections.json

# With webhook alerts
python src/main.py --model models/drone-detector_int8.tflite \
  --tracker kalman \
  --alert-webhook https://api.example.com/detections \
  --save-detections detections.json
```

### 4. Web Streaming

**Note:** Streaming is configured via environment variables or configuration files, not CLI flags.

**Option 1: Environment Variables (Recommended for quick setup)**

```bash
# Enable streaming via environment variables
export STREAM_ENABLED=true
export STREAM_PORT=8080
python src/main.py --model models/drone-detector_int8.tflite
```

**Option 2: Configuration File (Recommended for production)**

Create a `config.yaml` file:

```yaml
camera_type: auto
engine_type: auto
tracker_type: kalman

inference:
  model_path: "models/drone-detector_int8.tflite"
  confidence_threshold: 0.5

streaming:
  enabled: true
  port: 8080
  quality: 80
  max_fps: 15

alert:
  webhook_url: "https://api.example.com/detections"
  save_detections_path: "detections.json"
```

**Note:** Use `--generate-config <path>` to create a default config file,
then edit it and run with `--config <path>`.

**Available Environment Variables:**

```bash
export STREAM_ENABLED=true      # Enable streaming server
export STREAM_PORT=8080         # Server port (default: 8080)
export STREAM_HOST=0.0.0.0      # Bind host (default: 0.0.0.0)
export STREAM_QUALITY=80        # JPEG quality 10-100 (default: 80)
export STREAM_MAX_FPS=15        # Max stream FPS (default: 15)
```

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

Settings can be configured via:
1. **Environment Variables** (highest priority) - Quick setup, good for deployment
2. **YAML Configuration File** - Recommended for production, comprehensive settings
3. **Programmatic defaults** - Built-in defaults

**Note:** Command-line arguments only support a subset of options (model, camera, tracker, etc.). Advanced features like streaming must be configured via environment variables or config files.

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

All settings can be overridden via environment variables. Use nested delimiter `__` for nested settings:

```bash
# Capture settings
export CAPTURE__WIDTH=1280
export CAPTURE__HEIGHT=720
export CAPTURE__FPS=30

# Inference settings
export INFERENCE__CONFIDENCE_THRESHOLD=0.6
export INFERENCE__NMS_THRESHOLD=0.45

# Streaming settings (most commonly used)
export STREAM_ENABLED=true
export STREAM_PORT=8080
export STREAM_QUALITY=80
export STREAM_MAX_FPS=15

# Alert settings
export ALERT__WEBHOOK_URL=https://api.example.com/detections
export ALERT__SAVE_DETECTIONS_PATH=detections.json
```

**Using Configuration Files:**

Generate and use a configuration file:

```bash
# Generate default config file
python src/main.py --generate-config config.yaml

# Edit config.yaml as needed, then run
python src/main.py --config config.yaml

# CLI arguments override config file values
python src/main.py --config config.yaml --confidence 0.7 --headless
```

**Programmatic Loading (for custom scripts):**

```python
from src.config.settings import Settings

# Load from YAML file
settings = Settings.from_yaml("config.yaml")

# Or load from environment variables
settings = Settings()

# Access settings
if settings.streaming.enabled:
    print(f"Streaming on port {settings.streaming.port}")
```

## Training on Azure ML

### Quick Start (GitHub Actions - Recommended)

Use the automated CI/CD pipeline for training:

1. Go to **Actions** tab → **ML Training Pipeline** → **Run workflow**
2. Select parameters (model, epochs, dataset)
3. Download trained model from artifacts when complete

### Manual Training (~$3-5 for MVP)

```bash
# 1. Setup infrastructure with Terraform
cd infra/terraform/ml-training
terraform init
terraform apply -var-file="environments/dev.tfvars"

# 2. Download training data
cd apps/detector
python scripts/download_public_datasets.py --output ./data --all
# Or with Roboflow API key for more datasets:
ROBOFLOW_API_KEY=xxx python scripts/download_public_datasets.py --output ./data --roboflow

# 3. Upload dataset to Azure ML
RG=$(cd ../../../infra/terraform/ml-training && terraform output -raw resource_group_name)
WS=$(cd ../../../infra/terraform/ml-training && terraform output -raw ml_workspace_name)

az ml data create --name drone-dataset --path ./data/combined \
  --type uri_folder --resource-group $RG --workspace-name $WS

# 4. Submit training job
cd azure-ml
az ml job create --file job.yaml --resource-group $RG --workspace-name $WS

# 5. Monitor training
az ml job stream --name <JOB_NAME> --resource-group $RG --workspace-name $WS

# 6. Download and validate model
az ml job download --name <JOB_NAME> --output-name model --download-path ./outputs
python ../scripts/validate_model.py --model-dir ./outputs/model/exports --benchmark

# 7. Deploy to Pi
scp outputs/model/exports/drone-detector_int8.tflite pi@raspberrypi:~/models/
```

### Training Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `model` | yolov8n.pt | Base model (yolov8n/s/m) |
| `epochs` | 100 | Training epochs |
| `imgsz` | 320 | Image size |
| `batch` | 16 | Batch size |

### Cost Estimates

| Configuration | GPU | Time | Cost |
|---------------|-----|------|------|
| MVP (10 classes) | T4 | 6-10 hrs | $3-5 |
| Full (27 classes) | T4 | 20-30 hrs | $10-15 |
| Full (27 classes) | V100 | 5-8 hrs | $15-25 |

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
