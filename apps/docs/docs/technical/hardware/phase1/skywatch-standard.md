---
id: phase1-skywatch-standard
title: "SkyWatch Standard (Demo) — Detection + Remote Alerts"
sidebar_label: SkyWatch Standard
sidebar_position: 3
description:
  Phase 1A build guide for the SkyWatch Standard demo unit. ESP32-based
  detection with PIR-assisted wake-up, local alarms, and remote notification.
difficulty: beginner
estimated_reading_time: 6
points: 15
tags:
  - hardware
  - phase-1
  - esp32
  - skywatch
  - detection
  - alerts
phase: ["seed"]
---

# SkyWatch Standard (Demo)

The standalone demo that _feels real_: stable power, PIR-assisted detection,
local + remote alerting, and armed/disarmed states.

---

## What It Proves

> **Detection → Alert (local + remote)** with sensor fusion and operational
> states on a single ESP32.

A visitor sees the unit armed, watches a PIR trigger wake the camera, hears the
alarm, and receives a Telegram notification on their phone — all within seconds.

---

## Bill of Materials — Buy Now (Phase 1A)

| Component | Part | Specification | Est. Cost |
|-----------|------|---------------|-----------|
| Compute | ESP32-CAM (OV2640) | 2MP, WiFi, SD slot | $6–10 |
| Motion sensor | HC-SR501 PIR | 3.3V logic, ~7m range, adjustable | $1–2 |
| Power | MP1584EN buck | 7–12V in → 5.1V out | $1–2 |
| Alarm (audio) | Active buzzer | 5V, via NPN transistor | $1 |
| Alarm (visual) | High-bright LED | 5mm + 220Ω resistor | $0.50 |
| Control | Pushbutton | Arm/disarm | $0.50 |
| Status LEDs | 3mm red + green | Armed / disarmed indicators | $0.50 |
| Wiring | Dupont jumpers, screw terminals | Assorted | $2–3 |
| **Total** | | | **~$14–20** |

### Optional Additions

| Component | Part | Why |
|-----------|------|-----|
| Microphone module | MAX9814 or INMP441 | Acoustic trigger demo (clap / prop noise) |
| Small siren | 5V 90dB piezo | More convincing alarm (volume-controlled) |
| microSD card | 32GB Class 10 | Event logging and image capture |

---

## Leave for Later

| Item | Phase | Rationale |
|------|-------|-----------|
| Coral / Hailo AI accelerator | 1B | PIR + frame diff is sufficient for demo |
| Multi-sensor RF / SDR | 1C+ | Far beyond demo scope |
| Long-range optics, stabilized mounts | 1C+ | Overkill for bench range |
| LTE failover | 1C | WiFi covers all demo scenarios |

---

## Architecture

```text
  ┌────────────┐
  │ HC-SR501   │──── Motion detected ────┐
  │ PIR Sensor │                         │
  └────────────┘                         ▼
                                 ┌──────────────┐
  7–12V ── MP1584EN ── 5.1V ──▶ │  ESP32-CAM   │
                                 │              │
                                 │  Camera ─── Frame diff / blob detect
                                 │              │
                                 │  GPIO ────── Buzzer (NPN)
                                 │  GPIO ────── LED beacon
                                 │  GPIO ────── Armed LED (green)
                                 │  GPIO ────── Disarmed LED (red)
                                 │  GPIO ────── Pushbutton (arm/disarm)
                                 │              │
                                 │  WiFi ────── Telegram bot HTTP POST
                                 └──────────────┘
```

---

## How PIR + Camera Work Together

The key insight is **power-saving and false-positive reduction**:

1. **Idle** — PIR watches for heat signatures. Camera is in low-power mode.
2. **PIR triggers** — ESP32 wakes camera, begins frame capture.
3. **Frame diff confirms** — if motion is real, fire alarms + send remote alert.
4. **No confirmation** — camera returns to low-power after timeout. No alert
   sent.

This two-stage approach extends battery life (if battery-powered later) and
reduces WiFi spam from false triggers.

---

## Build Steps

### Step 1 — Power rail

Same as [Nano build](phase1-skywatch-nano#step-1--power-rail): MP1584EN set to
5.1V, feeding the ESP32-CAM.

### Step 2 — PIR sensor

1. Wire HC-SR501: VCC → 5V, GND → GND, OUT → ESP32 GPIO (e.g., GPIO 15).
2. Adjust sensitivity and delay pots on the PIR module to taste.
3. Test: serial print when PIR goes HIGH.

### Step 3 — Camera + detection logic

1. Flash firmware with PIR interrupt → camera wake → frame diff logic.
2. PIR HIGH starts a capture window (e.g., 10 seconds).
3. Frame differencing within that window confirms or rejects the trigger.

### Step 4 — Alarm outputs

1. Wire buzzer, LED beacon, and status LEDs as per the Nano build.
2. Add armed/disarmed state machine:
   - **Armed**: green LED on, alarms enabled.
   - **Disarmed**: red LED on, alarms suppressed, camera still streams.
3. Pushbutton toggles between states (debounce in firmware).

### Step 5 — Remote alerts

1. Create a Telegram bot via BotFather.
2. On confirmed detection (armed + PIR + frame diff), ESP32 sends HTTP POST to
   Telegram Bot API with a text message (and optionally a captured JPEG).
3. Fallback: simple HTTP POST to any webhook URL (for integration testing).

---

## Acceptance Criteria

- [ ] PIR trigger wakes camera and begins detection window
- [ ] Frame differencing confirms or rejects PIR trigger
- [ ] Confirmed detection fires buzzer + LED beacon
- [ ] Telegram notification arrives within 5 seconds of detection
- [ ] Armed/disarmed toggle via pushbutton with status LEDs
- [ ] System runs unattended from DC input

---

## Upgrade Path

| From (Phase 1A) | To (Phase 1B+) |
|------------------|----------------|
| PIR + frame diff | YOLO on Pi/Jetson (real object classification) |
| Telegram webhook | MQTT → central dashboard → push notifications |
| Single PIR zone | Multi-zone PIR array or radar module |
| Pushbutton arming | App-based arming with geofence |
