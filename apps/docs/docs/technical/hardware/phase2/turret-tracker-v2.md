---
id: phase2-turret-tracker-v2
title: "Turret Tracker v2 — Jetson YOLO Tracking"
sidebar_label: Turret Tracker v2
sidebar_position: 3
description:
  Phase 2 Turret Tracker upgrade with Jetson Orin Nano for real-time YOLO
  bounding-box tracking with PID control.
difficulty: intermediate
estimated_reading_time: 7
points: 20
tags:
  - hardware
  - phase-2
  - jetson
  - yolo
  - tracking
  - pan-tilt
  - pid
phase: ["seed"]
prerequisites: ["phase1-turret-tracker", "phase2-hardware-overview"]
---

# Turret Tracker v2 (Jetson YOLO Tracking)

The Turret Tracker v2 replaces blob-centroid tracking with YOLO bounding-box
tracking on a Jetson Orin Nano. The turret now follows _classified drones_, not
just moving blobs.

---

## What It Proves

> **AI-guided physical tracking** — YOLO detects and classifies the target,
> a PID controller drives the servos to keep it centered, and the system
> ignores non-threat objects.

A visitor releases a small drone; the turret locks on, ignoring a person walking
across the frame.

---

## Bill of Materials

| Component | Part | Specification | Est. Cost |
|-----------|------|---------------|-----------|
| Compute | Jetson Orin Nano 8GB | 40 TOPS, 1024 CUDA cores | $250–300 |
| Camera | ArduCam IMX477 (CSI-2) | 12.3MP, C/CS-mount | $30–45 |
| Lens | 6mm CS-mount wide-angle | 63° FOV, IR-cut | $15–20 |
| Servo driver | PCA9685 | Reused from Phase 1A | $0 |
| Pan servo | MG996R (upgrade) | 11 kg·cm torque, metal gear | $5–8 |
| Tilt servo | MG90S | Reused from Phase 1A | $0 |
| Pan/tilt bracket | Aluminum upgrade | CNC or heavy-duty 3D print | $10–20 |
| Power (logic) | MP1584EN buck | 12V → 5V for Jetson | $1–2 |
| Power (servos) | MP1584EN buck | 12V → 6V for servos | $1–2 |
| Power supply | 12V/5A DC adapter | Powers both rails | $8–12 |
| Capacitor | 1000µF 10V electrolytic | Near PCA9685 V+ | $0.50 |
| **Total** | | | **~$320–410** |

---

## Architecture

```text
  12V DC ──┬── MP1584EN #1 ── 5V ── Jetson Orin Nano
           │                          │
           │                  ┌───────┼────────────┐
           │                  │       │            │
           │           ArduCam IMX477  I2C         GStreamer
           │           (CSI-2 ribbon)  │           RTSP server
           │                  │       │
           │           TensorRT       PCA9685
           │           YOLOv9         │
           │           (640×640       ├── CH0: Pan (MG996R)
           │            60 FPS)       └── CH1: Tilt (MG90S)
           │
           └── MP1584EN #2 ── 6V ── PCA9685 V+ (servo power)
                                      │
                                      └── 1000µF cap
```

---

## Tracking Pipeline

```text
Frame capture (GStreamer, 1920×1080, 60 FPS)
    │
    ▼
Pre-process (TensorRT, GPU-accelerated resize + normalize)
    │
    ▼
Inference (YOLOv9 TensorRT engine, 640×640, ~60 FPS)
    │
    ▼
Post-process (NMS, filter to drone class only)
    │
    ▼
Track assignment (DeepSORT or ByteTrack — persistent track IDs)
    │
    ▼
Target selection (highest confidence drone, or closest to center)
    │
    ▼
Error calculation (target bbox center vs frame center)
    │
    ├──▶ PID controller (pan axis) ──▶ PCA9685 CH0
    ├──▶ PID controller (tilt axis) ──▶ PCA9685 CH1
    └──▶ MQTT publish (track state, bbox, servo angles)
```

---

## PID Controller Details

| Parameter | Pan Axis | Tilt Axis |
|-----------|----------|-----------|
| P gain (Kp) | 0.15 | 0.12 |
| I gain (Ki) | 0.01 | 0.008 |
| D gain (Kd) | 0.05 | 0.04 |
| Output range | 0–180° | 0–90° |
| Update rate | 30 Hz | 30 Hz |
| Dead zone | ±10 px | ±10 px |

Gains are starting values — tune on real hardware. The dead zone prevents
micro-corrections that cause servo buzz.

---

## Servo Upgrade Notes

The Phase 1A SG90/MG90S pan servo is undersized for continuous tracking with
the heavier Jetson + camera payload. Phase 2 upgrades the pan servo:

| | MG90S (Phase 1A) | MG996R (Phase 2) |
|-|------------------|------------------|
| Torque | 2.2 kg·cm | 11 kg·cm |
| Weight | 13.4g | 55g |
| Gears | Metal | Metal |
| Voltage | 4.8–6V | 4.8–7.2V |
| Bracket | Plastic kit | Aluminum (machined or heavy 3D print) |

The tilt servo (MG90S) is retained because the camera is light enough.

---

## Build Steps

### Step 1 — Jetson setup

1. Flash JetPack 6.x to NVMe SSD (or SD card for testing).
2. Install TensorRT, GStreamer, and CUDA toolkit (included in JetPack).
3. Connect ArduCam IMX477 via CSI-2 ribbon.
4. Verify: `gst-launch-1.0 nvarguscamerasrc ! autovideosink` shows live preview.

### Step 2 — Model optimization

1. Export YOLOv9-small to ONNX format.
2. Convert to TensorRT engine: `trtexec --onnx=yolov9s.onnx --fp16 --saveEngine=yolov9s.engine`.
3. Benchmark: target >=60 FPS at 640×640 FP16.

### Step 3 — Servo hardware

1. Assemble upgraded pan/tilt bracket with MG996R (pan) + MG90S (tilt).
2. Mount ArduCam on tilt platform.
3. Wire PCA9685 as in Phase 1A (same I2C address, same channel mapping).
4. Set servo rail MP1584EN to 6.0V (MG996R supports up to 7.2V).

### Step 4 — Tracking software

1. Install `skywatch-tracker` Python package.
2. Configure PID gains in `/etc/skywatch/tracker.yaml`.
3. Start the service: `systemctl start skywatch-tracker`.
4. Verify: point camera at moving object, turret follows.

### Step 5 — Network integration

1. Configure MQTT client to publish track state to hub.
2. Start RTSP server for remote viewing (`mediamtx` or GStreamer RTSP).
3. Verify: SkyWatch Hub shows turret track on dashboard.

---

## Acceptance Criteria

- [ ] YOLOv9 inference at >=30 FPS on Jetson (>=60 FPS target)
- [ ] Turret tracks a drone-sized object across full pan range
- [ ] Non-drone objects (people, birds) ignored by tracker
- [ ] PID controller eliminates overshoot within 2 oscillations
- [ ] Servo jitter eliminated (PCA9685 hardware PWM)
- [ ] Track state published to MQTT within 50ms
- [ ] RTSP stream shows bounding boxes and track ID overlay
- [ ] System survives 8-hour continuous tracking session

---

## Upgrade Path

| From (Phase 2) | To (Phase 3) |
|-----------------|--------------|
| Single camera | Dual camera (wide + telephoto) with handoff |
| MG996R hobby servos | Industrial servos with encoders (closed-loop) |
| Plastic/aluminum bracket | Weatherproof pan/tilt housing (IP65) |
| PID tracking | Kalman filter + motion prediction |
| WiFi/Ethernet | LoRa mesh for distributed turret coordination |
