---
id: phase2-hardware-overview
title: "Phase 2 Hardware: Pi/Jetson ML Inference Stack"
sidebar_label: Phase 2 Overview
sidebar_position: 1
description:
  Phase 2 hardware strategy — swap ESP32 for real edge AI compute with YOLO
  inference, multi-camera support, and MQTT-based alerting.
difficulty: intermediate
estimated_reading_time: 8
points: 20
tags:
  - hardware
  - phase-2
  - raspberry-pi
  - jetson
  - edge-ai
  - yolo
phase: ["seed"]
---

# Phase 2 Hardware: Pi/Jetson ML Inference Stack

Phase 2 replaces the ESP32's blob detection with real object classification on
edge AI hardware. The demo no longer just detects _motion_ — it classifies
**drones vs. birds vs. noise** in real-time.

---

## Design Principles

1. **Same peripherals, new brain** — reuse Phase 1 servos, relays, alarms, and
   wiring harnesses wherever possible
2. **Real ML, not fake ML** — YOLOv8-nano or YOLOv9-tiny running at >=15 FPS
3. **Two compute tiers** — Pi Zero 2W + Coral USB for SkySnare (consumer), Jetson
   Orin Nano for AeroNet (enterprise)
4. **Structured logging** — every detection event recorded with metadata for
   blockchain submission

---

## Compute Platform Options

### Tier 1: Raspberry Pi + Coral (SkySnare Consumer)

| Component | Part | Specification | Est. Cost |
|-----------|------|---------------|-----------|
| Compute | Raspberry Pi Zero 2W | Quad-core ARM Cortex-A53, 512MB RAM | $15 |
| AI Accelerator | Google Coral USB | 4 TOPS INT8 Edge TPU | $25–35 |
| Camera | Pi Camera Module 3 | 12MP, autofocus, HDR | $25 |
| Storage | 32GB microSD (A2) | Endurance-rated | $8–12 |
| Power | 5V/3A USB-C supply | Official Pi PSU recommended | $8–10 |
| **Total (compute only)** | | | **~$80–100** |

**Performance target:** 15–20 FPS YOLOv8-nano (320×320) on Coral with TFLite.

### Tier 2: Jetson Orin Nano (AeroNet Enterprise)

| Component | Part | Specification | Est. Cost |
|-----------|------|---------------|-----------|
| Compute | NVIDIA Jetson Orin Nano 8GB | 40 TOPS, 1024 CUDA cores | $250–300 |
| Carrier board | Seeed reComputer J4012 | M.2, USB 3, GbE, CSI-2 | Included |
| Camera | ArduCam IMX477 (CSI) | 12.3MP, C/CS-mount lens | $30–45 |
| Lens | 6mm wide-angle CS | 63° FOV, IR-cut | $15–20 |
| Storage | 256GB NVMe M.2 SSD | Endurance-rated | $25–35 |
| Power | 12V/5A barrel jack | Or PoE via add-on HAT | $10–15 |
| **Total (compute only)** | | | **~$330–415** |

**Performance target:** 30–60 FPS YOLOv9 (640×640) on Jetson with TensorRT.

---

## Phase 2 Product Set

| # | Product | Compute | Upgrade From |
|---|---------|---------|-------------|
| 1 | SkyWatch Nano v2 | Pi Zero 2W + Coral | SkyWatch Nano (Phase 1A) |
| 2 | SkyWatch Standard v2 | Pi Zero 2W + Coral | SkyWatch Standard (Phase 1A) |
| 3 | Turret Tracker v2 | Jetson Orin Nano | Turret Tracker (Phase 1A) |
| 4 | Trigger Node v2 | Pi Zero 2W (no ML) | Trigger Node (Phase 1A) |
| 5 | SkyWatch Hub | Jetson Orin Nano | _New_ — central coordinator |

---

## SkyWatch Hub (New in Phase 2)

The Hub is the brain of a multi-node deployment. It receives detection events
from all SkyWatch nodes, fuses them, and dispatches commands.

### Responsibilities

- **MQTT broker** — Mosquitto running locally for all node comms
- **Detection fusion** — correlate detections across multiple cameras by
  timestamp + bearing to produce a single track
- **Dashboard server** — lightweight web UI (React) showing live map, track
  history, and alert status
- **Blockchain bridge** — batch detection events and submit SHA-256 hashes via
  the Evidence CLI
- **Trigger dispatch** — send fire commands to Trigger Nodes based on rules
  engine

### Bill of Materials

| Component | Part | Specification | Est. Cost |
|-----------|------|---------------|-----------|
| Compute | Jetson Orin Nano 8GB | 40 TOPS, runs broker + dashboard + fusion | $250–300 |
| Network | Unmanaged 5-port GbE switch | For wired mesh fallback | $15–20 |
| Storage | 512GB NVMe SSD | Event log retention (~90 days) | $40–50 |
| UPS | Mini UPS for 12V | 30-minute battery backup | $25–35 |
| Enclosure | DIN-rail mount ABS case | Indoor rated, vented | $15–20 |
| **Total** | | | **~$345–425** |

---

## Software Stack Changes

| Layer | Phase 1A | Phase 2 |
|-------|----------|---------|
| Inference | ESP32 frame diff (C) | YOLOv8/v9 via TFLite or TensorRT (Python) |
| Messaging | HTTP POST to Telegram | MQTT (Mosquitto) pub/sub with TLS |
| Logging | Serial console | SQLite + structured JSON events |
| Dashboard | None | React web UI on SkyWatch Hub |
| Blockchain | None | Evidence CLI → API → blockchain anchor |
| Camera | ESP32-CAM library | libcamera (Pi) or GStreamer (Jetson) |
| Servo control | ESP32 I2C to PCA9685 | Same PCA9685, now driven from Pi/Jetson GPIO |

---

## MQTT Topic Structure

```text
skywatch/
  {node_id}/
    detection/        # Detection events with bounding box + confidence
    heartbeat/        # Node alive signal (every 30s)
    status/           # Armed/disarmed state changes
    telemetry/        # CPU temp, FPS, memory usage
  hub/
    tracks/           # Fused multi-node tracks
    commands/         # Fire commands to trigger nodes
    alerts/           # External notification triggers
```

---

## Wiring Changes

Phase 2 keeps the same peripheral wiring (PCA9685, relays, buzzers, LEDs) but
replaces the ESP32-CAM with a Pi or Jetson. Key differences:

| Interface | ESP32 (Phase 1A) | Pi/Jetson (Phase 2) |
|-----------|-----------------|---------------------|
| I2C (PCA9685) | GPIO 21/22 | GPIO 2/3 (Pi) or Pin 3/5 (Jetson) |
| GPIO outputs | 3.3V, 12mA max | 3.3V, 16mA max (Pi) or 3.3V (Jetson via header) |
| Camera | Onboard OV2640 | CSI-2 ribbon cable |
| Power | 5V via pin header | 5V/3A USB-C (Pi) or 12V barrel (Jetson) |
| Network | WiFi only | WiFi + Ethernet |

**The PCA9685, servos, relay modules, and alarm circuits are unchanged.** Only
the compute module and camera connection change.

---

## Acceptance Criteria

### Per Node (SkyWatch v2)

- [ ] YOLO inference running at >=15 FPS (Pi+Coral) or >=30 FPS (Jetson)
- [ ] Correct drone classification (>=90% mAP on test set)
- [ ] Detection events published to MQTT within 100ms
- [ ] Armed/disarmed state synced to hub
- [ ] Camera streams accessible via RTSP or HTTP

### SkyWatch Hub

- [ ] Receives and fuses detections from >=3 nodes simultaneously
- [ ] Web dashboard shows live map with node positions and tracks
- [ ] Evidence CLI submits batched hashes every 60 seconds
- [ ] Fire command reaches Trigger Node within 200ms of dispatch
- [ ] System survives node disconnection without crashing

---

## Estimated Total Cost (Full Phase 2 Deployment)

| Item | Qty | Unit Cost | Total |
|------|-----|-----------|-------|
| SkyWatch Nano v2 (Pi+Coral) | 2 | $100 | $200 |
| SkyWatch Standard v2 (Pi+Coral) | 1 | $120 | $120 |
| Turret Tracker v2 (Jetson) | 1 | $415 | $415 |
| Trigger Node v2 (Pi) | 1 | $35 | $35 |
| SkyWatch Hub (Jetson) | 1 | $425 | $425 |
| Phase 1A peripherals (carried forward) | — | — | ~$55 |
| Network switch + cables | 1 | $30 | $30 |
| **Total** | | | **~$1,280** |

---

## Upgrade Path to Phase 3

| From (Phase 2) | To (Phase 3) |
|-----------------|--------------|
| Indoor Pi/Jetson on breadboard | IP65 enclosure with conformal coating |
| WiFi mesh | LoRa (2–5km) + LTE Cat-M1 failover |
| Single camera per node | Multi-camera + PIR + acoustic array |
| USB Coral accelerator | Hailo-8 M.2 (26 TOPS) or Jetson upgrade |
| Bench power supply | PoE or solar + LiFePO4 battery |
