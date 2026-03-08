---
id: phase3-sensor-integration
title: "Phase 3 Multi-Sensor Fusion Architecture"
sidebar_label: Sensor Integration
sidebar_position: 2
description:
  Multi-sensor fusion strategy for Phase 3 field nodes — combining EO/IR, PIR,
  acoustic, and RF sensors into a unified detection pipeline.
difficulty: advanced
estimated_reading_time: 8
points: 25
tags:
  - hardware
  - phase-3
  - sensor-fusion
  - multi-sensor
  - detection
phase: ["series-a"]
prerequisites: ["phase3-hardware-overview"]
---

# Phase 3 Multi-Sensor Fusion Architecture

Phase 3 combines four sensor modalities — visual (EO/IR), passive infrared
(PIR), acoustic, and radio frequency (RF) — into a single detection pipeline
that is more accurate and harder to defeat than any sensor alone.

---

## Why Multi-Sensor?

| Sensor | Detects | Blind Spots |
|--------|---------|-------------|
| EO/IR camera | Visual signature, shape, payload | Darkness (without IR), fog, occlusion |
| PIR | Heat signature, movement | Cold targets, static hover, long range |
| Acoustic | Propeller noise, motor harmonics | Windy conditions, ambient noise, range limit |
| RF | Control link, telemetry, video downlink | Autonomous (no RF) drones, encrypted links |

**No single sensor covers all scenarios.** Multi-sensor fusion ensures at least
two modalities confirm a threat before triggering an alert.

---

## Fusion Architecture

```text
  PIR Array ──▶ Wake Trigger ──┐
  (always-on,                  │
   <1mW)                       ▼
                        ┌──────────────┐
  EO/IR Camera ────────▶│              │
  (on-demand,           │   Fusion     │──▶ Fused Detection Event
   ~5W active)          │   Engine     │    {
                        │              │      confidence: 0.94,
  Acoustic Array ──────▶│  (Weighted   │      sensors: [camera, acoustic],
  (always-on,           │   Bayesian   │      class: "drone",
   ~0.5W)               │   or         │      bearing: 127°,
                        │   Dempster-  │      range_est: 85m,
  RF Detection ────────▶│   Shafer)    │      timestamp: ...
  (always-on,           │              │    }
   ~1.5W)               └──────────────┘
```

---

## Detection Confidence Scoring

Each sensor provides an independent detection probability. The fusion engine
combines them using a weighted Bayesian approach:

### Sensor Weights (Default)

| Sensor | Weight | Rationale |
|--------|--------|-----------|
| EO/IR (YOLO) | 0.45 | Highest information content (visual class + bbox) |
| RF detection | 0.25 | Protocol fingerprint is strong identity signal |
| Acoustic | 0.20 | Good bearing estimation, moderate false positives |
| PIR | 0.10 | Binary trigger only, high false positive rate |

### Fusion Rules

| Combined Score | Action |
|---------------|--------|
| >= 0.85 | **Alert** — fire alarms, notify hub, publish track |
| 0.60 – 0.84 | **Suspect** — camera stays active, log event, no alarm |
| < 0.60 | **Dismiss** — return to idle after timeout |

### Cross-Sensor Confirmation Matrix

A detection is promoted from _suspect_ to _alert_ when confirmed by a second
independent sensor within a 5-second window:

| Primary Detection | Confirming Sensor | Result |
|------------------|-------------------|--------|
| Camera (drone class >=0.7) | Acoustic (drone signature) | Alert |
| Camera (drone class >=0.7) | RF (known protocol) | Alert |
| RF (DJI OcuSync) | Camera (any moving object) | Alert |
| Acoustic (drone signature) | PIR (motion) + Camera (object) | Alert |
| PIR only | — | Suspect (camera activated, wait for confirmation) |

---

## Sensor Data Flow

### Timeline of a Typical Detection

```text
T+0.0s   PIR detects heat → wake interrupt → camera powers on
T+0.3s   Camera captures first frame → YOLO inference starts
T+0.4s   Acoustic array reports bearing 127° ± 15°
T+0.5s   YOLO returns: drone, confidence 0.82, bbox [120,80,210,160]
T+0.6s   RF module reports: DJI OcuSync v2 signal at 2.4GHz
T+0.7s   Fusion engine: camera(0.82×0.45) + RF(0.90×0.25) +
         acoustic(0.75×0.20) + PIR(1.0×0.10) = 0.86 → ALERT
T+0.8s   Alarm triggered, MQTT published, track created
T+1.0s   Hub receives event, dispatches to dashboard
```

Total time from PIR trigger to alert: **<1 second**.

---

## Acoustic Processing Pipeline

```text
4× MEMS Microphones (48kHz each)
    │
    ▼
I2S Multiplexer → Compute Module
    │
    ▼
Frame buffer (50ms windows, 50% overlap)
    │
    ├──▶ FFT → Mel-Spectrogram (128 bins)
    │          │
    │          ▼
    │    CNN Classifier (TFLite / TensorRT)
    │    Classes: [drone_quad, drone_fixed, helicopter, bird, wind, vehicle]
    │          │
    │          ▼
    │    Detection: {class, confidence}
    │
    └──▶ GCC-PHAT Cross-Correlation
              │
              ▼
         Direction of Arrival (azimuth ± 15°, elevation ± 20°)
```

---

## RF Detection Pipeline

```text
RTL-SDR (2.4 MHz bandwidth, tunable center frequency)
    │
    ▼
Frequency scan (hop across: 900MHz, 1.2GHz, 2.4GHz, 5.8GHz)
    │
    ▼
Signal detection (energy threshold above noise floor)
    │
    ▼
Protocol fingerprinting
    ├── DJI OcuSync v1/v2/v3 → {vendor: "DJI", protocol: "OcuSync"}
    ├── FrSky ACCST/ACCESS → {vendor: "FrSky", protocol: "ACCESS"}
    ├── ExpressLRS → {vendor: "ELRS", protocol: "ELRS"}
    ├── Crossfire → {vendor: "TBS", protocol: "CRSF"}
    └── WiFi (802.11) → {vendor: "generic", protocol: "WiFi"}
    │
    ▼
Detection event: {protocol, rssi, frequency, estimated_range}
```

---

## Power Management for Multi-Sensor

Multi-sensor operation must be power-aware, especially on solar deployments:

### Power Budget

| Sensor | Always-On | Active | Duty Cycle |
|--------|-----------|--------|------------|
| PIR array (×4) | 0.8mW | — | 100% |
| Acoustic array | 0.5W | — | 100% |
| RF detection | 1.5W | — | 100% |
| EO/IR camera | 0W | 5W | On-demand (PIR triggered) |
| YOLO inference | 0W | 8W | On-demand (camera active) |
| Comms (LoRa) | 0.1W | 0.5W | ~5% duty cycle |
| Compute (idle) | 3W | — | 100% |
| **Total (idle)** | **~6W** | | |
| **Total (active)** | | **~19W** | |

### Power States

```text
SLEEP (6W)
  PIR + acoustic + RF watching
  Camera off, ML off
  LoRa listening
      │
      ▼ [PIR trigger or acoustic/RF detection]
WAKE (~19W)
  Camera on, ML inference active
  All sensors processing
  LoRa transmitting
      │
      ▼ [30s timeout with no confirmation]
SLEEP (6W)
      │
      ▼ [detection confirmed]
ALERT (19W)
  Full processing + MQTT pub + alarm
  Hub notified
      │
      ▼ [target lost for 60s]
SLEEP (6W)
```

---

## Calibration Requirements

Before field deployment, each multi-sensor node requires:

| Calibration | Method | Frequency |
|-------------|--------|-----------|
| Camera intrinsics | Checkerboard calibration | Once (at assembly) |
| Acoustic array geometry | Known-source test (clap at fixed positions) | Once (at assembly) |
| PIR zone mapping | Walk-test each sector | At each installation |
| RF sensitivity | Known transmitter at measured distance | Once (at assembly) |
| Sensor time sync | NTP or PTP at boot, GPS PPS if available | Automatic |
| Compass heading | Magnetic declination + mounting offset | At each installation |

---

## Acceptance Criteria

- [ ] Fusion engine combines >=2 sensor modalities per alert
- [ ] False positive rate <2% (vs. <5% in Phase 2 camera-only)
- [ ] Acoustic direction-of-arrival within ±15° of ground truth
- [ ] RF detection identifies DJI, FrSky, and ELRS protocols
- [ ] Camera wakes from sleep to first inference in <500ms
- [ ] Power state transitions are smooth (no sensor data loss)
- [ ] All sensor data timestamped within 10ms accuracy
- [ ] Fusion engine runs at >=10 Hz update rate
