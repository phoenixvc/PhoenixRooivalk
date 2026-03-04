---
id: phase2-skywatch-nano-v2
title: "SkyWatch Nano v2 — Pi + Coral AI Detection"
sidebar_label: SkyWatch Nano v2
sidebar_position: 2
description:
  Phase 2 upgrade of the SkyWatch Nano with Raspberry Pi Zero 2W and Google
  Coral USB accelerator for real YOLO drone classification.
difficulty: intermediate
estimated_reading_time: 6
points: 15
tags:
  - hardware
  - phase-2
  - raspberry-pi
  - coral
  - yolo
  - detection
phase: ["seed"]
---

# SkyWatch Nano v2 (Pi + Coral)

The Nano v2 replaces the ESP32-CAM with a Raspberry Pi Zero 2W and Google Coral
USB accelerator. It now classifies drones instead of just detecting motion.

---

## What It Proves

> **Real-time AI drone classification** on a $100 node with >=15 FPS YOLO
> inference, MQTT connectivity, and structured event logging.

A visitor sees a live camera feed with bounding boxes and confidence scores
overlaid on detected drones. False positives (birds, debris) are filtered.

---

## Bill of Materials

| Component | Part | Specification | Est. Cost |
|-----------|------|---------------|-----------|
| Compute | Raspberry Pi Zero 2W | Quad-core Cortex-A53, 512MB | $15 |
| AI Accelerator | Google Coral USB | Edge TPU, 4 TOPS INT8 | $25–35 |
| Camera | Pi Camera Module 3 | 12MP, autofocus, wide-angle option | $25 |
| Power | MP1584EN buck | 7–12V → 5.1V, 3A | $1–2 |
| Storage | 32GB microSD (A2) | Endurance-rated for continuous writes | $8–12 |
| Alarm (audio) | Active buzzer | Reused from Phase 1A | $0 |
| Alarm (visual) | High-bright LED | Reused from Phase 1A | $0 |
| Control | Pushbutton | Reused from Phase 1A | $0 |
| USB adapter | Micro-USB OTG | For Coral USB connection | $2 |
| **Total** | | | **~$80–100** |

---

## Architecture

```text
  7–12V DC ── MP1584EN ── 5.1V ──▶ Pi Zero 2W
                                     │
                      ┌──────────────┼──────────────┐
                      │              │              │
              Pi Camera v3    Coral USB (OTG)    GPIO Header
              (CSI ribbon)   (YOLOv8-nano)       │
                      │              │            ├── Buzzer (NPN)
                      ▼              ▼            ├── LED beacon
                   libcamera    TFLite Runtime    ├── Pushbutton
                      │              │            └── Status LEDs
                      └──────┬───────┘
                             │
                      Detection Event
                             │
                      ┌──────┴──────┐
                      │   MQTT Pub  │
                      │ (Mosquitto) │
                      └─────────────┘
```

---

## Software Pipeline

```text
Frame capture (libcamera, 640×480, 30 FPS)
    │
    ▼
Pre-process (resize to 320×320, normalize)
    │
    ▼
Inference (YOLOv8-nano TFLite on Coral USB)
    │
    ▼
Post-process (NMS, confidence threshold ≥0.6)
    │
    ▼
Detection event (class, bbox, confidence, timestamp)
    │
    ├──▶ MQTT publish to skywatch/{node_id}/detection/
    ├──▶ SQLite log (local)
    ├──▶ Alarm trigger (if armed + drone class)
    └──▶ RTSP/MJPEG stream with overlay
```

---

## Key Configuration

```yaml
# /etc/skywatch/config.yaml
node:
  id: nano-v2-001
  role: detector
  armed: true

camera:
  resolution: [640, 480]
  fps: 30
  rotation: 0

inference:
  model: yolov8n_drone_320.tflite
  delegate: edgetpu  # Coral USB
  confidence_threshold: 0.6
  nms_threshold: 0.45
  classes: [drone, bird, helicopter, airplane]

mqtt:
  broker: hub.local
  port: 8883  # TLS
  topic_prefix: skywatch/nano-v2-001

logging:
  database: /var/lib/skywatch/events.sqlite
  retention_days: 30
```

---

## Build Steps

### Step 1 — Pi Zero 2W setup

1. Flash Raspberry Pi OS Lite (64-bit Bookworm) to microSD.
2. Enable camera interface (`raspi-config` → Interface Options → Camera).
3. Connect Pi Camera Module 3 via CSI ribbon cable.
4. Verify: `libcamera-hello` shows live preview.

### Step 2 — Coral USB setup

1. Connect Coral USB via micro-USB OTG adapter.
2. Install Edge TPU runtime: `sudo apt install libedgetpu1-std`.
3. Install TFLite runtime: `pip install tflite-runtime`.
4. Verify: run sample classification model on Coral.

### Step 3 — Power and peripherals

1. Wire MP1584EN to 5.1V (same as Phase 1A).
2. Connect buzzer, LED, pushbutton to Pi GPIO pins (BCM numbering).
3. Use `gpiozero` library for output control.

### Step 4 — Inference pipeline

1. Install the `skywatch-detector` Python package.
2. Configure `/etc/skywatch/config.yaml` with node ID and MQTT broker.
3. Start the service: `systemctl start skywatch-detector`.
4. Verify detections appear on the MQTT broker.

### Step 5 — MQTT integration

1. Install Mosquitto client: `sudo apt install mosquitto-clients`.
2. Test publish: `mosquitto_pub -t test -m "hello"`.
3. Verify the SkyWatch Hub receives detection events.

---

## Acceptance Criteria

- [ ] YOLOv8-nano inference running at >=15 FPS on Coral USB
- [ ] Drone detections published to MQTT with <100ms latency
- [ ] False positive rate <5% on test video (birds, debris, people)
- [ ] Bounding box overlay visible on RTSP/MJPEG stream
- [ ] Armed/disarmed toggle via pushbutton works
- [ ] Local SQLite log records all detection events
- [ ] System runs from single DC input (no USB tether for power)

---

## Upgrade Path

| From (Phase 2) | To (Phase 3) |
|-----------------|--------------|
| Pi Zero 2W (512MB) | Pi 5 (8GB) or Jetson Orin Nano |
| Coral USB (4 TOPS) | Hailo-8 M.2 (26 TOPS) |
| WiFi connectivity | LoRa + LTE Cat-M1 |
| Open breadboard | IP65 weatherproof enclosure |
| Bench power | PoE HAT or solar + battery |
