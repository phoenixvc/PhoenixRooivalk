---
id: adr-0301-python-detector-factory-pattern
title: "ADR 0301: Python Detector Factory Pattern Architecture"
sidebar_label: "ADR 0301: Detector Factory"
difficulty: intermediate
estimated_reading_time: 6
points: 25
tags:
  - technical
  - architecture
  - ai-ml
  - python
prerequisites: []
---

# ADR 0301: Python Detector Factory Pattern Architecture

**Date**: 2026-02-22 **Status**: Accepted (Implemented)

---

## Executive Summary

1. **Problem**: The drone detector must run on Raspberry Pi (TFLite), NVIDIA
   Jetson (ONNX), desktop (TensorFlow), and Coral Edge TPU — each requiring
   different inference engines, camera interfaces, and tracker implementations.
2. **Decision**: Use a Factory pattern with pluggable interfaces (`FrameSource`,
   `InferenceEngine`, `ObjectTracker`) that auto-detect hardware at startup and
   select the appropriate backend.
3. **Trade-off**: Factory indirection adds a thin abstraction layer, but enables
   a single `drone-detector` CLI that runs on any supported platform without
   code changes.

---

## Context

Phoenix Rooivalk's edge detector runs on diverse hardware:

| Platform        | Inference Backend   | Camera API        | Install Extra |
| --------------- | ------------------- | ----------------- | ------------- |
| Raspberry Pi    | TensorFlow Lite     | PiCamera2, V4L2   | `pip install -e ".[pi]"` |
| NVIDIA Jetson   | ONNX Runtime (CUDA) | GStreamer, V4L2    | `pip install -e ".[jetson]"` |
| Desktop         | TensorFlow (GPU/CPU)| OpenCV VideoCapture| `pip install -e ".[desktop]"` |
| Coral Edge TPU  | PyCoral             | USB camera         | `pip install -e ".[coral]"` |

Each platform combination requires different library imports, initialization
sequences, and performance tuning. A monolithic detector with `if/else`
platform checks would be unmaintainable.

---

## Decision

### Pluggable Interfaces

Three abstract base classes define the detector's extension points:

- **`FrameSource`**: Captures frames from cameras (PiCamera2, GStreamer,
  OpenCV, USB)
- **`InferenceEngine`**: Runs drone detection models (TFLite, ONNX, TensorFlow,
  PyCoral)
- **`ObjectTracker`**: Tracks detections across frames (DeepSORT, centroid,
  Kalman filter)

### Hardware Auto-Detection

At startup, the factory checks:

1. Is `/proc/device-tree/model` a Raspberry Pi?
2. Is `tegra` in `/proc/device-tree/compatible` (Jetson)?
3. Is a Coral USB Accelerator connected?
4. Fall back to desktop (TensorFlow)

### Configuration

Pydantic v2 settings classes (`DetectorConfig`, `CameraConfig`,
`InferenceConfig`) load from environment variables and `.env` files, with
platform-specific defaults applied after auto-detection.

---

## Consequences

### Positive

- Single CLI (`drone-detector`) works on all platforms
- New hardware platforms added by implementing 1-3 interfaces
- Platform-specific code isolated in separate modules
- Tests run on desktop without hardware dependencies (`-m "not hardware"`)

### Negative

- Factory indirection makes debugging slightly harder (must trace through
  abstract interfaces)
- Platform extras in `pyproject.toml` must be kept in sync with factory
  implementations

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
