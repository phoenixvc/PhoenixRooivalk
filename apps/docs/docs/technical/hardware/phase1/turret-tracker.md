---
id: phase1-turret-tracker
title: "Turret Tracker (Demo) — Pan/Tilt Camera Rig"
sidebar_label: Turret Tracker
sidebar_position: 4
description:
  Phase 1A build guide for the Turret Tracker demo. Pan/tilt servo mount with
  PCA9685 driver for smooth camera tracking.
difficulty: intermediate
estimated_reading_time: 7
points: 20
tags:
  - hardware
  - phase-1
  - esp32
  - servo
  - tracking
  - pan-tilt
phase: ["seed"]
prerequisites: ["phase1-hardware-overview"]
---

# Turret Tracker (Demo)

A camera on a pan/tilt servo mount that tracks a target visually and points
toward it. Non-harmful — the only output is camera orientation.

---

## What It Proves

> **Detection → Tracking → Physical actuation** using servo-driven pan/tilt,
> controlled over I2C from an ESP32.

A visitor moves across the room; the turret follows. That is the demo.

---

## Bill of Materials — Buy Now (Phase 1A)

| Component | Part | Specification | Est. Cost |
|-----------|------|---------------|-----------|
| Compute | ESP32 dev board | DevKitC or NodeMCU-32S | $5–8 |
| Servo driver | PCA9685 | 16-channel, I2C, 12-bit PWM | $2–4 |
| Pan servo | SG90 _or_ MG90S | 180° micro servo | $1–3 ea. |
| Tilt servo | SG90 _or_ MG90S | 180° micro servo | $1–3 ea. |
| Pan/tilt bracket | SG90 kit mount | Dual-axis plastic bracket | $2–4 |
| Camera | ESP32-CAM (OV2640) | Mounted on tilt platform | $6–10 |
| Power (logic) | MP1584EN buck | 7–12V → 5V for ESP32 | $1–2 |
| Power (servos) | MP1584EN buck | 7–12V → 5.5V for servos | $1–2 |
| Capacitor | 470–1000µF 10V electrolytic | Bulk cap near PCA9685 | $0.50 |
| Wiring | Dupont jumpers, headers | I2C + servo leads | $2–3 |
| **Total** | | | **~$22–40** |

### SG90 vs MG90S

| | SG90 | MG90S |
|-|------|-------|
| Gears | Plastic | Metal |
| Torque | 1.8 kg·cm | 2.2 kg·cm |
| Lifespan | Short (demo OK) | Longer (recommended) |
| Cost | ~$1 | ~$2–3 |
| Verdict | Fine for first demo | **Recommended** if budget allows |

---

## Leave for Later

| Item | Phase | Rationale |
|------|-------|-----------|
| Stepper motors + belt drive | 2+ | Precision tracking, much higher cost |
| Closed-loop servos / encoders | 2+ | Position feedback not needed for demo |
| 3D-printed metal bracket | 1C | Plastic kit bracket is adequate |
| Second camera (stereo) | 2+ | Depth estimation is a future feature |

---

## Architecture

```text
  7–12V DC ──┬── MP1584EN #1 ── 5.0V ── ESP32 (logic)
             │
             └── MP1584EN #2 ── 5.5V ──┬── PCA9685 V+ (servo power)
                                        │
                                        └── 470µF cap (across V+ / GND)

  ESP32                    PCA9685
  ─────                    ───────
  SDA (GPIO 21) ────────── SDA
  SCL (GPIO 22) ────────── SCL
  GND ─────────────────── GND

  PCA9685 Channels
  ────────────────
  CH0 ── Pan servo signal
  CH1 ── Tilt servo signal
  (CH2–15 available for future servos)
```

**Why two buck converters?**

Servos draw current spikes during movement (300–700mA per servo). Sharing a
single rail with the ESP32 causes brownouts and resets. Separate rails eliminate
this.

---

## Why PCA9685

The PCA9685 is a $3 insurance policy against three common problems:

1. **Jitter** — ESP32 software PWM is interrupt-driven and jitters under WiFi
   load. The PCA9685 generates hardware PWM independently.
2. **Scalability** — 16 channels means adding more servos later costs zero
   additional wiring complexity.
3. **Precision** — PCA9685 provides fixed 12-bit hardware PWM (4096 steps), stable and independent of CPU/WiFi jitter. ESP32 LEDC resolution is configurable per timer (not fixed) and can reach up to ~13-bit at practical servo frequencies, but is software-driven and subject to jitter; see [Shared Parts](./shared-parts.md) and ESP-IDF LEDC behavior.

---

## Build Steps

### Step 1 — Dual power rails

1. Set MP1584EN #1 to **5.0V** → ESP32 `VIN` and `GND`.
2. Set MP1584EN #2 to **5.5V** → PCA9685 `V+` terminal block and `GND`.
3. Solder 470–1000µF electrolytic capacitor across V+ and GND on the PCA9685
   board (observe polarity).
4. Confirm both voltages with a multimeter before connecting anything else.

### Step 2 — I2C wiring

1. Connect ESP32 GPIO 21 (SDA) → PCA9685 SDA.
2. Connect ESP32 GPIO 22 (SCL) → PCA9685 SCL.
3. Connect GND between ESP32 and PCA9685 (common ground is critical).
4. PCA9685 default I2C address is `0x40`. No jumpers needed unless using
   multiple boards.

### Step 3 — Servo mounting

1. Assemble pan/tilt bracket kit per its instructions.
2. Mount pan servo into the base (horizontal rotation).
3. Mount tilt servo on the pan horn (vertical rotation).
4. Attach ESP32-CAM to the tilt platform with double-sided tape or small screws.
5. Connect servo signal wires to PCA9685 channels 0 (pan) and 1 (tilt).

### Step 4 — Manual control (web UI)

1. Flash ESP32 with a simple web server exposing two sliders (pan: 0–180°, tilt:
   0–90°).
2. ESP32 writes angle → PCA9685 channel via I2C.
3. Verify: moving sliders smoothly moves the turret.

### Step 5 — Basic tracking

1. ESP32-CAM captures frames at 10–15 FPS.
2. Simple centroid tracking: find the largest moving blob, compute its (x, y)
   offset from frame center.
3. PID (or proportional-only) loop adjusts pan/tilt servos to center the blob.
4. Tune gains: start with low proportional gain, increase until responsive
   without oscillation.

---

## Acceptance Criteria

- [ ] Web UI sliders smoothly control pan and tilt
- [ ] Servos move without jitter or brownout resets
- [ ] Camera is securely mounted and moves with the tilt platform
- [ ] Basic blob tracking follows a moving object across the frame
- [ ] System runs from a single DC input (no USB tether)

---

## Upgrade Path

| From (Phase 1A) | To (Phase 1B+) |
|------------------|----------------|
| SG90 / MG90S micro servos | High-torque digital servos or steppers |
| Plastic bracket kit | 3D-printed or machined aluminum mount |
| Blob centroid tracking | YOLO bounding-box tracking on Pi/Jetson |
| Proportional control | Full PID with acceleration limiting |
| ESP32-CAM (2MP) | Pi HQ Camera (12MP) or thermal (FLIR Lepton) |
