---
id: phase1-skywatch-nano
title: "SkyWatch Nano (Demo) — Detection + Alarm"
sidebar_label: SkyWatch Nano
sidebar_position: 2
description:
  Phase 1A build guide for the SkyWatch Nano demo unit. ESP32-based detection
  with local alarm output.
difficulty: beginner
estimated_reading_time: 5
points: 10
tags:
  - hardware
  - phase-1
  - esp32
  - skywatch
  - detection
phase: ["seed"]
prerequisites: ["phase1-hardware-overview"]
---

# SkyWatch Nano (Demo)

Entry-level demo unit: detects a target and triggers local alarms. The cheapest
viable standalone in the product line.

---

## What It Proves

> **Detection → Alert** loop on a single ESP32, with zero cloud dependency.

A visitor sees a camera feed, hears a buzzer, and sees a beacon flash when
motion is detected. That is the entire acceptance criteria for Phase 1A.

---

## Bill of Materials — Buy Now (Phase 1A)

| Component      | Part                            | Specification                     | Est. Cost   |
| -------------- | ------------------------------- | --------------------------------- | ----------- |
| Compute        | ESP32-CAM (OV2640)              | 2MP camera, WiFi, onboard SD slot | $6–10       |
| Power          | MP1584EN buck                   | 7–12V in → 5.1V out, 3A           | $1–2        |
| Alarm (audio)  | Active buzzer                   | 5V, driven via NPN transistor     | $1          |
| Alarm (visual) | High-bright LED                 | 5mm white/red + 220Ω resistor     | $0.50       |
| Control        | Pushbutton                      | Momentary, arm/disarm             | $0.50       |
| Wiring         | Dupont jumpers, screw terminals | Assorted                          | $2–3        |
| **Total**      |                                 |                                   | **~$12–17** |

### Optional (nice-to-have)

| Component           | Part                 | Why                                    |
| ------------------- | -------------------- | -------------------------------------- |
| microSD card        | 16–32GB Class 10     | Onboard recording (ESP32-CAM has slot) |
| Power indicator LED | 3mm green + resistor | Visual "power on" confirmation         |

---

## Leave for Later

| Item                         | Phase | Rationale                                        |
| ---------------------------- | ----- | ------------------------------------------------ |
| Raspberry Pi + Coral / Hailo | 1B    | True vision AI — not needed for alarm demo       |
| Weatherproof enclosure       | 1C    | Indoor demo first                                |
| PoE / external antennas      | 1C    | WiFi is sufficient at bench range                |
| SMS / push notification      | 1B    | Keep remote alerts to Telegram/webhook initially |

---

## Wiring

```text
  7–12V DC Input
       │
       ▼
  ┌──────────┐
  │ MP1584EN │──── 5.1V ────┐
  │ Buck     │              │
  └──────────┘              │
                            ▼
                    ┌──────────────┐
                    │  ESP32-CAM   │
                    │              │
                    │  GPIO 12 ──────── NPN base ── Buzzer (+5V)
                    │  GPIO 13 ──────── LED + 220Ω ── GND
                    │  GPIO 14 ──────── Pushbutton ── GND (INPUT_PULLUP)
                    │              │
                    └──────────────┘
```

**Notes:**

- GPIO pin numbers are suggestions — consult the pinout for your specific
  ESP32-CAM variant. Avoid strapping pins (GPIO 0, 2, 15).
- Buzzer draws more than the GPIO can source (~12mA limit). Use a 2N2222 NPN
  transistor with a 1kΩ base resistor.
- The MP1584EN output should be set to **5.1V** with the trim pot before
  connecting the ESP32-CAM.

---

## Build Steps

### Step 1 — Power rail

1. Connect 7–12V supply to MP1584EN input.
2. Adjust trim pot to **5.1V** output (measure with multimeter).
3. Wire 5V output to ESP32-CAM `5V` and `GND` pins.

### Step 2 — Flash firmware

1. Connect ESP32-CAM via USB-TTL adapter (GPIO 0 held LOW for flash mode).
2. Flash camera streaming firmware with basic motion-detect callback.
3. Verify video stream is accessible at `http://<ESP32_IP>/stream`.

### Step 3 — Alarm outputs

1. Wire buzzer through NPN transistor to a GPIO pin.
2. Wire LED + resistor to a second GPIO pin.
3. Wire pushbutton between a third GPIO pin and GND (enable internal pull-up).

### Step 4 — Demo loop

1. Motion detected → buzzer on + LED on for 3 seconds.
2. Pushbutton press toggles armed/disarmed state.
3. Disarmed state: camera streams but alarms are suppressed.

---

## Acceptance Criteria

- [ ] Camera streams live video over WiFi
- [ ] Motion triggers audible buzzer and visible LED
- [ ] Pushbutton arms/disarms the alarm outputs
- [ ] System runs from a single DC input (no USB tether)

---

## Upgrade Path

| From (Phase 1A)          | To (Phase 1B+)                                 |
| ------------------------ | ---------------------------------------------- |
| ESP32-CAM blob detection | Pi Zero 2W + Coral USB for real YOLO inference |
| WiFi-only alerts         | Telegram bot → push notifications → SMS        |
| Bench wiring             | 3D-printed enclosure with cable routing        |
| Single camera            | Multi-camera mesh (SkyWatch Mesh architecture) |
