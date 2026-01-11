# Advanced Setup Guide

This guide covers advanced installation options, platform-specific configurations,
and alternative setups beyond the [Quick Start](../README.md#quick-start).

## Table of Contents

- [Platform-Specific Installation](#platform-specific-installation)
- [Model Options](#model-options)
- [Camera Options](#camera-options)
- [Inference Engine Options](#inference-engine-options)
- [Running Detection](#running-detection)
- [Web Streaming](#web-streaming)
- [Testing Without Hardware](#testing-without-hardware)

---

## Platform-Specific Installation

### Raspberry Pi (Default)

```bash
# Standard Pi installation with TFLite
pip install -e ".[pi]"

# Pi with Coral Edge TPU support
pip install -e ".[pi,coral]"

# Pi with web streaming
pip install -e ".[pi,streaming]"
```

**System dependencies for Pi Camera:**

```bash
sudo raspi-config  # Interface Options > Camera > Enable
sudo apt update
sudo apt install -y python3-pip python3-venv libcamera-apps

# Optional: Install Picamera2 if not already present
# sudo apt install -y python3-picamera2
```

### NVIDIA Jetson

```bash
pip install -e ".[jetson]"
```

### Desktop Development

```bash
pip install -e ".[dev]"  # All development tools
```

### Coral Edge TPU Setup

For 10x inference speedup on Raspberry Pi:

```bash
# Install Coral runtime
echo "deb https://packages.cloud.google.com/apt coral-edgetpu-stable main" | \
  sudo tee /etc/apt/sources.list.d/coral-edgetpu.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
sudo apt update && sudo apt install -y libedgetpu1-std

# Install Python package
pip install -e ".[pi,coral]"
```

---

## Model Options

### Option A: Pre-trained YOLOv5n (Quick Start)

The fastest way to get started with a general-purpose model:

```bash
pip install ultralytics
python -c "from ultralytics import YOLO; \
  YOLO('yolov5n.pt').export(format='tflite', imgsz=320, int8=True)"
cp yolov5n_int8.tflite models/
```

### Option B: Train Custom Model on Azure ML (Recommended)

For best accuracy with drone-specific detection:

```bash
# See azure-ml/ folder for training scripts
cd azure-ml
./setup-azure.sh
# Follow instructions to upload dataset and train
```

See [Training on Azure ML](../README.md#training-on-azure-ml) for detailed instructions.

### Option C: Use Pre-trained Drone Model

Download a pre-trained drone detection model from the releases page or train your own.

---

## Camera Options

### Pi Camera v2/v3

```bash
python src/main.py --config config.yaml --camera picamera
```

### USB Webcam

```bash
python src/main.py --config config.yaml --camera usb

# Multiple cameras - specify index
python src/main.py --config config.yaml --camera usb --camera-index 1
```

### Video File

```bash
python src/main.py --config config.yaml --video path/to/video.mp4
```

### Auto-Detection

```bash
python src/main.py --config config.yaml --camera auto
```

---

## Inference Engine Options

### TensorFlow Lite (Default for Pi)

```bash
python src/main.py --model models/model.tflite --engine tflite
```

### ONNX Runtime

```bash
python src/main.py --model models/model.onnx --engine onnx
```

### Coral Edge TPU

```bash
# Requires Coral USB Accelerator and edgetpu model
python src/main.py --model models/model_edgetpu.tflite --engine coral

# Or use --coral flag
python src/main.py --model models/model_edgetpu.tflite --coral
```

---

## Running Detection

### Basic Commands

```bash
# With display (auto-detects camera and inference engine)
python src/main.py --model models/drone-detector_int8.tflite

# Headless mode (no monitor)
python src/main.py --model models/drone-detector_int8.tflite --headless

# With object tracking
python src/main.py --model models/drone-detector_int8.tflite --tracker centroid
python src/main.py --model models/drone-detector_int8.tflite --tracker kalman
```

### Save Detections

```bash
# Save to JSON file
python src/main.py --model models/drone-detector_int8.tflite \
  --save-detections detections.json
```

### Webhook Alerts

```bash
python src/main.py --model models/drone-detector_int8.tflite \
  --tracker kalman \
  --alert-webhook https://api.example.com/detections
```

### Demo Mode

Optimized settings for presentations:

```bash
python src/main.py --demo --model models/drone-detector_int8.tflite
```

### Quiet Mode

Suppress hardware detection report:

```bash
python src/main.py --model models/drone-detector_int8.tflite --quiet
```

### Disable Auto-Configuration

Use manual settings instead of hardware detection:

```bash
python src/main.py --model models/drone-detector_int8.tflite --no-auto-configure
```

---

## Web Streaming

Streaming is configured via environment variables or config files (not CLI flags).

### Via Environment Variables

```bash
export STREAM_ENABLED=true
export STREAM_PORT=8080
python src/main.py --model models/drone-detector_int8.tflite
```

### Via Config File

Add to your `config.yaml`:

```yaml
streaming:
  enabled: true
  port: 8080
  quality: 80
  max_fps: 15
```

### Available Endpoints

When streaming is enabled:

- `http://<pi-ip>:8080/` - Live viewer dashboard
- `http://<pi-ip>:8080/stream` - MJPEG video stream
- `http://<pi-ip>:8080/snapshot` - Single JPEG frame
- `http://<pi-ip>:8080/status` - JSON system status
- `http://<pi-ip>:8080/health` - Health check endpoint

### Environment Variables Reference

```bash
export STREAM_ENABLED=true      # Enable streaming server
export STREAM_PORT=8080         # Server port (default: 8080)
export STREAM_HOST=0.0.0.0      # Bind host (default: 0.0.0.0)
export STREAM_QUALITY=80        # JPEG quality 10-100 (default: 80)
export STREAM_MAX_FPS=15        # Max stream FPS (default: 15)
```

---

## Testing Without Hardware

### Mock Everything

Test without any hardware (synthetic camera and detections):

```bash
python src/main.py --mock
# Equivalent to: --camera mock --engine mock
```

### Real Camera, Mock Inference

Test camera without a model:

```bash
python src/main.py --camera usb --engine mock
python src/main.py --camera picamera --engine mock
```

### Mock Camera, Real Inference

Test model without a camera:

```bash
python src/main.py --camera mock --engine tflite \
  --model models/drone-detector.tflite
```

---

## Related Documentation

- [Configuration Reference](configuration.md) - Complete settings reference
- [Architecture](architecture.md) - System design and components
- [Training Cost Estimate](training-cost-estimate.md) - Azure ML training costs
