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

| Platform       | Inference Backend    | Camera API          | Install Extra                 |
| -------------- | -------------------- | ------------------- | ----------------------------- |
| Raspberry Pi   | TensorFlow Lite      | PiCamera2, V4L2     | `pip install -e ".[pi]"`      |
| NVIDIA Jetson  | ONNX Runtime (CUDA)  | GStreamer, V4L2     | `pip install -e ".[jetson]"`  |
| Desktop        | TensorFlow (GPU/CPU) | OpenCV VideoCapture | `pip install -e ".[desktop]"` |
| Coral Edge TPU | PyCoral              | USB camera          | `pip install -e ".[coral]"`   |

Each platform combination requires different library imports, initialization
sequences, and performance tuning. A monolithic detector with `if/else` platform
checks would be unmaintainable.

---

## Options Considered

| Criteria                  | Factory Pattern (Selected) | Strategy + Explicit Selection | Monolithic Conditionals | Plugin System (Dynamic Loading) |
| ------------------------- | -------------------------- | ----------------------------- | ----------------------- | ------------------------------- |
| Single CLI                | Yes                        | Yes                           | Yes                     | Yes                             |
| Auto-detection            | Yes                        | No (manual flag)              | N/A                     | Yes                             |
| Code separation           | High                       | High                          | Low                     | High                            |
| Testing isolation         | High                       | High                          | Low                     | High                            |
| Debugging complexity      | Medium                     | Low                           | Low                     | High                            |
| Third-party extensibility | No                         | No                            | No                      | Yes                             |
| Implementation complexity | Medium                     | Low                           | Low                     | High                            |

### Option 1: Factory Pattern ✅ Selected

Define abstract interfaces (`FrameSource`, `InferenceEngine`, `ObjectTracker`)
with concrete implementations per platform. Auto-detect hardware at startup and
instantiate appropriate factories.

**Pros**: Single entry point, clean separation of platform code, easy testing
with mocks. **Cons**: Indirection overhead, requires discipline to keep
interfaces stable.

### Option 2: Strategy Pattern with Explicit Selection ❌ Rejected

Similar interfaces but require explicit runtime configuration (e.g.,
`--platform=pi`) instead of auto-detection.

**Pros**: No auto-detection logic, explicit control, simpler debugging.
**Cons**: User must know platform, error-prone deployment, breaks "single
binary" goal.

### Option 3: Monolithic Conditional Logic ❌ Rejected

Use `if platform == "pi"` checks throughout the codebase with all platform code
in the same modules.

**Pros**: No abstraction overhead, straightforward control flow. **Cons**:
Unmaintainable at scale, tight coupling, difficult testing, violates separation
of concerns.

### Option 4: Plugin System with Dynamic Loading ❌ Rejected

Load platform-specific modules dynamically at runtime via importlib/entry
points.

**Pros**: Maximum flexibility, third-party extensions possible. **Cons**:
Complex error handling, harder to package, discovery mechanism overhead.

---

## Decision

### Pluggable Interfaces

Three abstract base classes define the detector's extension points:

- **`FrameSource`**: Captures frames from cameras (PiCamera2, GStreamer, OpenCV,
  USB)
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
