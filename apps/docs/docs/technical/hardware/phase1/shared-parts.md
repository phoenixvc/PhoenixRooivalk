---
id: phase1-shared-parts
title: "Phase 1 Shared Parts Reference"
sidebar_label: Shared Parts
sidebar_position: 7
description:
  Detailed specifications and sourcing notes for components shared across all
  Phase 1 ESP32 demo builds.
difficulty: beginner
estimated_reading_time: 5
points: 5
tags:
  - hardware
  - phase-1
  - bom
  - parts
  - sourcing
phase: ["seed"]
---

# Phase 1 Shared Parts Reference

Detailed specs and sourcing notes for components used across multiple Phase 1
builds. One order covers the entire demo stack.

---

## ESP32 Boards

### ESP32-CAM (OV2640)

| Spec | Value |
|------|-------|
| MCU | ESP32-S (dual-core 240MHz, 520KB SRAM) |
| Camera | OV2640, 2MP, UXGA (1600×1200) |
| WiFi | 802.11 b/g/n, 2.4GHz |
| Bluetooth | BLE 4.2 (not used in Phase 1) |
| Storage | microSD slot (up to 4GB in default firmware) |
| Flash | 4MB |
| GPIO available | Limited — ~10 usable pins after camera allocation |
| Power | 5V via pin header (no onboard USB for most variants) |
| Programming | External USB-TTL adapter required (GPIO 0 → GND for flash) |

**Sourcing:** AliExpress, Amazon, Banggood. ~$5–8 per unit. Buy 2 — one backup.

### ESP32-DevKitC / NodeMCU-32S

| Spec | Value |
|------|-------|
| MCU | ESP32-WROOM-32 (dual-core 240MHz, 520KB SRAM) |
| WiFi | 802.11 b/g/n |
| GPIO | 34 pins exposed (25+ usable) |
| USB | Micro-USB or USB-C (onboard programmer) |
| Flash | 4MB |
| Power | 5V via USB or VIN pin |

**Use for:** Turret Tracker and Trigger Node (more GPIO, easier programming).

---

## MP1584EN Buck Converter

| Spec | Value |
|------|-------|
| Input range | 4.5–28V DC |
| Output range | 0.8–20V DC (adjustable via trim pot) |
| Max current | 3A continuous |
| Efficiency | ~96% at moderate loads |
| Size | ~22 × 17 × 4mm |

**Setup procedure:**

1. Connect input voltage (no load connected).
2. Measure output with multimeter.
3. Turn trim pot slowly: clockwise = higher voltage (on most modules).
4. Set to target (5.0V for logic, 5.5V for servos).
5. Connect load.

**Buy:** 3 modules minimum (1 logic + 1 servo + 1 spare). ~$1–2 each.

---

## PCA9685 Servo Driver

| Spec | Value |
|------|-------|
| Channels | 16 independent PWM outputs |
| Resolution | 12-bit (4096 steps per channel) |
| Interface | I2C (default address 0x40) |
| PWM frequency | 24Hz–1526Hz (configurable; 50Hz for servos) |
| Output | Open-drain; requires external V+ for servos |
| Supply | 3.3V or 5V logic; separate V+ for servo power |

**Why not direct ESP32 PWM?**

- ESP32 LEDC PWM is 8-bit (256 steps) and software-managed.
- WiFi stack interrupts cause servo jitter under network load.
- PCA9685 is fire-and-forget: set angle via I2C, hardware holds it.

**Buy:** 1 unit. ~$2–4.

---

## Servos

### SG90

| Spec | Value |
|------|-------|
| Torque | 1.8 kg·cm at 4.8V |
| Speed | 0.1 sec/60° |
| Rotation | 180° |
| Voltage | 4.8–6V |
| Weight | 9g |
| Gears | Plastic (nylon) |

### MG90S (Recommended)

| Spec | Value |
|------|-------|
| Torque | 2.2 kg·cm at 4.8V |
| Speed | 0.08 sec/60° |
| Rotation | 180° |
| Voltage | 4.8–6V |
| Weight | 13.4g |
| Gears | Metal |

**Buy:** 2 units (pan + tilt). MG90S recommended for durability. ~$2–3 each.

---

## PIR Sensor (HC-SR501)

| Spec | Value |
|------|-------|
| Detection range | Up to 7m (adjustable) |
| Detection angle | ~120° cone |
| Output | 3.3V digital HIGH when triggered |
| Trigger mode | Repeatable (H) or single (L) — jumper selectable |
| Delay time | 0.3–300 seconds (adjustable pot) |
| Sensitivity | Adjustable pot |
| Power | 4.5–20V DC (onboard regulator) |

**Buy:** 1 unit. ~$1–2.

---

## Alarm Components

| Part | Specification | Notes |
|------|---------------|-------|
| Active buzzer (5V) | Continuous tone when powered | Needs NPN transistor driver |
| High-bright LED (5mm) | White or red, 20mA | Use with 220Ω resistor from 3.3V GPIO |
| Status LEDs (3mm) | Red + green | Lower brightness, good for indicators |
| NPN transistor | 2N2222 or BC547 | For switching buzzer / higher loads |
| Resistors | 220Ω (LED), 1kΩ (base) | Standard 1/4W through-hole |

**Buy:** Small assortment pack. ~$2–3 total.

---

## Relay / MOSFET Module

### 1-Channel Relay Module (Recommended)

| Spec | Value |
|------|-------|
| Coil voltage | 5V |
| Trigger | Active LOW (3.3V compatible with opto-isolated models) |
| Contact rating | 10A @ 250VAC / 10A @ 30VDC |
| Isolation | Opto-isolated (recommended) |

### Logic-Level MOSFET Module (Alternative)

| Spec | Value |
|------|-------|
| Gate threshold | <3.3V (logic-level compatible) |
| Drain current | Typically 5–30A depending on module |
| Switching | Silent, fast |

**Buy:** 1 relay module. ~$1–2.

---

## Wiring Supplies

| Item | Quantity | Notes |
|------|----------|-------|
| Dupont jumper wires (M-M, M-F, F-F) | 40-pack assorted | For breadboard connections |
| Screw terminal blocks (2-pin, 3-pin) | 5–10 | For power connections |
| Breadboard (half-size) | 1–2 | Prototyping before soldering |
| Heatshrink tubing | Assorted sizes | Insulate solder joints |
| Zip ties (small) | Pack of 50 | Cable management |
| USB-TTL adapter (CP2102 or CH340) | 1 | Programming ESP32-CAM |

---

## Consolidated Order Summary

| Part | Qty | Est. Cost | Supplier |
|------|-----|-----------|----------|
| ESP32-CAM (OV2640) | 2 | $12–16 | AliExpress / Amazon |
| ESP32-DevKitC | 1 | $5–8 | AliExpress / Amazon |
| MP1584EN buck converter | 3 | $3–6 | AliExpress / Amazon |
| PCA9685 servo driver | 1 | $2–4 | AliExpress / Amazon |
| MG90S servo | 2 | $4–6 | AliExpress / Amazon |
| Pan/tilt bracket kit | 1 | $2–4 | AliExpress / Amazon |
| HC-SR501 PIR sensor | 1 | $1–2 | AliExpress / Amazon |
| 1-ch relay module | 1 | $1–2 | AliExpress / Amazon |
| Active buzzer (5V) | 2 | $1–2 | AliExpress / Amazon |
| LED assortment (5mm + 3mm) | 1 pack | $2–3 | AliExpress / Amazon |
| Resistor assortment | 1 pack | $2–3 | AliExpress / Amazon |
| NPN transistor (2N2222) | 5 | $1 | AliExpress / Amazon |
| Electrolytic caps (100µF, 470µF) | 5 each | $1–2 | AliExpress / Amazon |
| Dupont wires | 1 pack | $2–3 | AliExpress / Amazon |
| Screw terminals | 10 | $1–2 | AliExpress / Amazon |
| Breadboard (half-size) | 2 | $2–3 | AliExpress / Amazon |
| USB-TTL adapter | 1 | $2–3 | AliExpress / Amazon |
| Heatshrink + zip ties | 1 each | $2–3 | AliExpress / Amazon |
| LED strip (30cm, 12V) | 1 | $2–4 | AliExpress / Amazon |
| 12V DC power supply (2A) | 1 | $5–8 | Amazon |
| **Total estimate** | | **$55–85** | |

This covers all four Phase 1 products with spares.
