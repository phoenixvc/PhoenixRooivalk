---
sidebar_position: 2
title: Configuration Reference
description: Complete configuration options for Pi Drone Detector
keywords: [configuration, settings, yaml, environment variables]
---

# Configuration Reference

Complete reference for all configurable settings in Pi Drone Detector.

## Configuration Sources

Settings can be provided from multiple sources (in order of precedence):

1. **CLI Arguments** - Highest priority
2. **Environment Variables** - Prefixed by section name
3. **YAML Configuration File** - Via `--config` flag
4. **Default Values** - Built-in defaults

## Quick Start

Create a `config.yaml` file:

```yaml
camera_type: auto
engine_type: auto
tracker_type: centroid

capture:
  width: 640
  height: 480
  fps: 30

inference:
  model_path: "models/drone-detector_int8.tflite"
  confidence_threshold: 0.5

streaming:
  enabled: true
  port: 8080
```

Run with config:
```bash
python src/main.py --config config.yaml
```

---

## Top-Level Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `camera_type` | enum | `auto` | Camera source type |
| `engine_type` | enum | `auto` | Inference engine type |
| `tracker_type` | enum | `centroid` | Object tracker type |

### camera_type

| Value | Description |
|-------|-------------|
| `auto` | Auto-detect best available camera |
| `picamera` | Raspberry Pi camera (libcamera) |
| `usb` | USB webcam via OpenCV |
| `video` | Video file playback |
| `mock` | Synthetic frames for testing |

### engine_type

| Value | Description |
|-------|-------------|
| `auto` | Auto-select based on hardware |
| `tflite` | TensorFlow Lite (optimized for Pi) |
| `onnx` | ONNX Runtime |
| `coral` | Google Coral Edge TPU |
| `mock` | Synthetic detections for testing |

### tracker_type

| Value | Description |
|-------|-------------|
| `none` | No tracking (each frame independent) |
| `centroid` | Simple centroid-based matching |
| `kalman` | Kalman filter with motion prediction |

---

## Capture Settings

Configure frame capture from the camera.

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `width` | int | 640 | 160-4096 | Capture width in pixels |
| `height` | int | 480 | 120-3072 | Capture height in pixels |
| `fps` | int | 30 | 1-120 | Target frames per second |
| `buffer_size` | int | 1 | 1-10 | Frame buffer size (lower = less latency) |
| `camera_index` | int | 0 | 0-10 | USB camera device index |
| `video_path` | str | null | - | Video file path (for video source) |
| `video_loop` | bool | true | - | Loop video playback |

**Environment Variables:**
```bash
export CAPTURE_WIDTH=1280
export CAPTURE_HEIGHT=720
export CAPTURE_FPS=30
export CAPTURE_BUFFER_SIZE=1
```

**Example:**
```yaml
capture:
  width: 1280
  height: 720
  fps: 30
  buffer_size: 1
```

---

## Inference Settings

Configure the ML inference engine.

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `model_path` | str | "" | - | Path to model file (.tflite or .onnx) |
| `input_size` | int | 320 | 128-640 | Model input size (square) |
| `confidence_threshold` | float | 0.5 | 0.0-1.0 | Minimum detection confidence |
| `nms_threshold` | float | 0.45 | 0.0-1.0 | NMS IoU threshold |
| `num_threads` | int | 4 | 1-16 | CPU threads for inference |
| `use_coral` | bool | false | - | Use Coral Edge TPU if available |

**Environment Variables:**
```bash
export INFERENCE_MODEL_PATH="models/detector.tflite"
export INFERENCE_CONFIDENCE_THRESHOLD=0.5
export INFERENCE_NMS_THRESHOLD=0.45
export INFERENCE_NUM_THREADS=4
```

**Example:**
```yaml
inference:
  model_path: "models/drone-detector_int8.tflite"
  input_size: 320
  confidence_threshold: 0.5
  nms_threshold: 0.45
  num_threads: 4
  use_coral: false
```

---

## Drone Score Settings

Configure drone likelihood scoring.

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `drone_class_id` | int | 0 | 0+ | Class ID for drone detection |
| `model_weight` | float | 0.7 | 0.0-1.0 | Weight for model confidence |
| `drone_threshold` | float | 0.5 | 0.0-1.0 | Threshold for is_drone |
| `aspect_ratio_min` | float | 0.8 | 0.1-5.0 | Min drone-like aspect ratio |
| `aspect_ratio_max` | float | 2.5 | 0.5-10.0 | Max drone-like aspect ratio |
| `aspect_bonus` | float | 0.15 | 0.0-0.5 | Bonus for drone-like aspect |
| `tall_penalty` | float | 0.2 | 0.0-0.5 | Penalty for tall objects |

**Example:**
```yaml
drone_score:
  drone_class_id: 0
  model_weight: 0.7
  drone_threshold: 0.5
  aspect_ratio_min: 0.8
  aspect_ratio_max: 2.5
```

---

## Tracker Settings

Configure object tracking.

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `max_disappeared` | int | 30 | 1-300 | Frames before track deleted |
| `max_distance` | float | 100.0 | 10-1000 | Max centroid distance for matching |
| `process_noise` | float | 1.0 | 0.01-100 | Kalman process noise |
| `measurement_noise` | float | 1.0 | 0.01-100 | Kalman measurement noise |

**Example:**
```yaml
tracker:
  max_disappeared: 30
  max_distance: 100.0
  process_noise: 1.0
  measurement_noise: 1.0
```

---

## Targeting Settings

Configure targeting and engagement.

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `max_targeting_distance_m` | float | 100.0 | 10-1000 | Max targeting distance (m) |
| `assumed_drone_size_m` | float | 0.3 | 0.1-2.0 | Assumed drone size for distance calc |
| `min_confidence_for_lock` | float | 0.7 | 0.3-1.0 | Min confidence to lock target |
| `lock_timeout_seconds` | float | 5.0 | 1-30 | Seconds before lock lost |
| `tracking_lead_factor` | float | 1.2 | 1.0-5.0 | Lead factor for interception |

### Fire Net Settings

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `fire_net_enabled` | bool | false | - | Enable fire net system |
| `fire_net_min_confidence` | float | 0.85 | 0.5-1.0 | Min confidence to fire |
| `fire_net_min_track_frames` | int | 10 | 3-60 | Min frames tracked before fire |
| `fire_net_max_distance_m` | float | 50.0 | 5-200 | Max fire distance |
| `fire_net_min_distance_m` | float | 5.0 | 1-50 | Min fire distance (safety) |
| `fire_net_velocity_threshold_ms` | float | 30.0 | 0-100 | Max target velocity |
| `fire_net_cooldown_seconds` | float | 10.0 | 1-60 | Cooldown between fires |
| `fire_net_arm_required` | bool | true | - | Require explicit arming |
| `fire_net_gpio_pin` | int | 17 | 2-27 | GPIO pin for trigger (BCM) |

**Example:**
```yaml
targeting:
  max_targeting_distance_m: 100.0
  assumed_drone_size_m: 0.30
  min_confidence_for_lock: 0.7
  fire_net_enabled: false
  fire_net_min_confidence: 0.85
  fire_net_min_track_frames: 10
  fire_net_max_distance_m: 50.0
  fire_net_min_distance_m: 5.0
  fire_net_arm_required: true
```

---

## Alert Settings

Configure alerts and notifications.

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `webhook_url` | str | null | - | Webhook URL for alerts |
| `webhook_timeout` | float | 5.0 | 1-30 | Webhook request timeout |
| `webhook_retry_count` | int | 3 | 0-10 | Number of retries |
| `cooldown_per_track` | float | 5.0 | 0-60 | Alert cooldown per track ID |
| `global_cooldown` | float | 1.0 | 0-10 | Global alert cooldown |
| `save_detections_path` | str | null | - | Path to save detection JSON |
| `save_buffer_size` | int | 10 | 1-100 | Buffer before file write |

**Example:**
```yaml
alert:
  webhook_url: "https://api.example.com/detections"
  webhook_timeout: 5.0
  cooldown_per_track: 5.0
  save_detections_path: "detections.json"
```

---

## Streaming Settings

Configure web streaming server.

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `enabled` | bool | false | - | Enable MJPEG streaming |
| `host` | str | "0.0.0.0" | - | Bind host |
| `port` | int | 8080 | 1024-65535 | Bind port |
| `quality` | int | 80 | 10-100 | JPEG quality |
| `max_fps` | int | 15 | 1-60 | Maximum stream FPS |
| `auth_enabled` | bool | false | - | Enable token auth |
| `auth_token` | str | null | - | Bearer token |

**Environment Variables:**
```bash
export STREAM_ENABLED=true
export STREAM_PORT=8080
export STREAM_QUALITY=80
export STREAM_AUTH_TOKEN="secret_token"
```

**Example:**
```yaml
streaming:
  enabled: true
  host: "0.0.0.0"
  port: 8080
  quality: 80
  max_fps: 15
  auth_enabled: false
```

---

## Logging Settings

Configure logging.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `level` | enum | INFO | Log level (DEBUG, INFO, WARNING, ERROR) |
| `json_format` | bool | false | Use JSON log format |
| `log_file` | str | null | Log file path |
| `max_bytes` | int | 10000000 | Max log file size |
| `backup_count` | int | 5 | Number of log backups |

**Example:**
```yaml
logging:
  level: INFO
  json_format: false
  log_file: "detector.log"
```

---

## Display Settings

Configure display and rendering.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `headless` | bool | false | Run without display |
| `window_name` | str | "Drone Detection" | Window title |
| `show_fps` | bool | true | Show FPS overlay |
| `show_drone_score` | bool | true | Show drone score bar |
| `show_track_id` | bool | true | Show track IDs |
| `show_distance` | bool | true | Show estimated distance |
| `show_targeting_overlay` | bool | true | Show targeting status |
| `log_interval_frames` | int | 30 | Headless log interval |

**Example:**
```yaml
display:
  headless: false
  show_fps: true
  show_drone_score: true
  show_track_id: true
```

---

## Complete Example

Full configuration file with all settings:

```yaml
# Pi Drone Detector Configuration

camera_type: auto
engine_type: tflite
tracker_type: centroid

capture:
  width: 640
  height: 480
  fps: 30
  buffer_size: 1

inference:
  model_path: "models/drone-detector_int8.tflite"
  input_size: 320
  confidence_threshold: 0.5
  nms_threshold: 0.45
  num_threads: 4
  use_coral: false

drone_score:
  drone_class_id: 0
  model_weight: 0.7
  drone_threshold: 0.5

tracker:
  max_disappeared: 30
  max_distance: 100.0

targeting:
  max_targeting_distance_m: 100.0
  min_confidence_for_lock: 0.7
  fire_net_enabled: false
  fire_net_arm_required: true

alert:
  webhook_url: null
  cooldown_per_track: 5.0

streaming:
  enabled: false
  port: 8080
  quality: 80
  max_fps: 15

logging:
  level: INFO
  json_format: false

display:
  headless: false
  show_fps: true
  show_drone_score: true
```

---

## CLI Override Examples

Override any setting from command line:

```bash
# Override confidence threshold
python src/main.py --model model.tflite --confidence 0.7

# Enable streaming with port
python src/main.py --model model.tflite --stream --stream-port 9090

# Run headless with webhook
python src/main.py --model model.tflite --headless \
  --alert-webhook https://api.example.com/detections

# Full override example
python src/main.py \
  --model models/drone-detector.tflite \
  --camera usb \
  --engine tflite \
  --tracker kalman \
  --width 1280 --height 720 --fps 30 \
  --confidence 0.6 \
  --stream --stream-port 8080 \
  --save-detections detections.json
```
