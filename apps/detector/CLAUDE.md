# Detector App — Claude Code Context

## Overview

Modular drone detection system for edge devices. Pluggable cameras, inference
engines, and trackers via Factory pattern. Supports Raspberry Pi, NVIDIA Jetson,
Desktop, and Coral Edge TPU.

## Platform-Specific Installation

```bash
pip install -e ".[pi]"       # Raspberry Pi (TFLite)
pip install -e ".[jetson]"   # NVIDIA Jetson (ONNX + TensorRT)
pip install -e ".[desktop]"  # Desktop (TensorFlow)
pip install -e ".[coral]"    # Coral Edge TPU
pip install -e ".[dev]"      # Development (pytest, ruff, black, mypy)
```

## Configuration Priority

CLI args > environment variables > config file > defaults

Config files: YAML or JSON. Load with `Settings.from_yaml(path)` or
`Settings.from_json(path)`. Override with `settings.merge_cli_args(args)`.

## Key Configuration Sections (`src/config/settings.py`)

- **CaptureSettings** — width: 160–4096, height: 120–3072,
  fps: 1–120, camera_index
- **InferenceSettings** — model_path, input_size: 128–640,
  confidence_threshold, nms_threshold
- **TargetingSettings** — fire_net safety envelope:
  min 5m, max 50m, confidence 0.85,
  track 10 frames, cooldown 10s, GPIO pin 17
- **TrackerSettings** — max_disappeared: 30 frames,
  Kalman filter noise params
- **AlertSettings** — webhook_url,
  per-track cooldown 5s, global cooldown 1s
- **StreamingSettings** — MJPEG host:port, quality,
  max_fps, optional bearer token
- **DisplaySettings** — headless mode, overlay toggles

## Pydantic Compatibility

Settings support pydantic v2, pydantic v1, AND a zero-dependency fallback (for
minimal embedded systems). The fallback uses simple dataclass-like objects.

## Enums

- **CameraType**: AUTO, PICAMERA, USB, VIDEO, MOCK
- **EngineType**: AUTO, TFLITE, ONNX, CORAL, MOCK
- **TrackerType**: NONE, CENTROID, KALMAN
- **LogLevel**: DEBUG, INFO, WARNING, ERROR, CRITICAL

## Testing

```bash
pytest                                    # All tests
pytest tests/unit/                        # Unit tests only
pytest tests/integration/                 # Integration tests
pytest -m "not slow and not hardware"     # Skip slow/hardware tests
```

Markers: `slow`, `integration`, `hardware`. Coverage threshold: 50%.

## Linting & Formatting

```bash
ruff check src/                   # Lint (E/W/F/I/B/C4/UP rules, line-length 100)
black --check src/                # Format check (line-length 100)
isort --check-only src/           # Import order (black profile)
mypy src/                         # Type check (py39 target, ignores cv2/tflite)
bandit -r src/ -ll -ii -x tests/  # Security scan
```

## Pre-commit Hooks (`.pre-commit-config.yaml`)

All hooks scoped to `^apps/detector/`:
ruff (with auto-fix), ruff-format, standard hooks (trailing whitespace, YAML,
JSON, large files <1MB, merge conflicts, debug statements), isort, mypy, bandit.

## Entry Point

CLI: `drone-detector` (defined in pyproject.toml as `main:main`)
Or: `python -m main`
