---
id: phase1-hardware-overview
title: "Phase 1 Hardware: ESP32 Demo Stack"
sidebar_label: Phase 1 Overview
sidebar_position: 1
description:
  Phase 1 hardware strategy for the ESP32-based demo stack. Defines what to buy
  now vs later, with a clear build path for each product.
difficulty: beginner
estimated_reading_time: 6
points: 10
tags:
  - hardware
  - phase-1
  - esp32
  - prototyping
phase: ["seed"]
---

# Phase 1 Hardware: ESP32 Demo Stack

Phase 1 proves the core product architecture — **detect, decide, act** — using
the cheapest hardware that still delivers a convincing demo. Every purchase
decision follows one principle: _minimal now, refactor later._

---

## Design Principles

1. **Demo-first** — each product must produce a visible, explainable result
2. **ESP32 baseline** — one microcontroller family across all builds
3. **Buy now / buy later** — separate what proves the concept from what scales it
4. **Safe actuation** — Phase 1 never includes anything that launches or harms

---

## Phase 1 Product Set

| # | Product | Purpose | Complexity |
|---|---------|---------|------------|
| 1 | [SkyWatch Nano](phase1-skywatch-nano) | Detection + local alarm | Low |
| 2 | [SkyWatch Standard](phase1-skywatch-standard) | Detection + local & remote alerts | Medium |
| 3 | [Turret Tracker](phase1-turret-tracker) | Pan/tilt camera tracking rig | Medium |
| 4 | [Trigger Node](phase1-trigger-node) | Safe countermeasure placeholder | Low |

Each product has its own page with buy-now/buy-later tables, wiring steps, and
acceptance criteria.

---

## Common Baseline (All Builds)

### Buy Now (Shared)

| Component | Example Part | Purpose | Est. Cost |
|-----------|-------------|---------|-----------|
| ESP32 dev board | ESP32-DevKitC, NodeMCU-32S, ESP32-WROOM-32 | Compute + WiFi | $5–10 |
| Buck converter | MP1584EN 3A adjustable | Stable 5V / 3.3V rails | $1–2 |
| Active buzzer | 5V piezo with driver | Audible alarm | $1 |
| High-bright LED | 5mm + resistor (or 5V LED beacon) | Visual alarm | $1 |
| Pushbutton | Momentary, panel-mount | Arm / disarm | $0.50 |
| Toggle switch | SPST | Master power | $0.50 |
| Wiring | Dupont jumpers, screw terminals, heatshrink | Connections | $3–5 |

### Leave for Later (Shared)

| Item | Why Later |
|------|-----------|
| IP-rated enclosure, cable glands, conformal coating | Cost and time without improving the demo |
| LTE / PoE / long-range comms | Connectivity upgrade after WiFi demo proves out |
| Formal wiring harnesses / custom PCB | Only justified after form factor is locked |
| Rugged power conditioning | Over-engineered for indoor/bench demos |

---

## Consolidated Parts List

### Buy Now — Phase 1A

| Qty | Part | Used By |
|-----|------|---------|
| 2–3 | MP1584EN buck modules | All builds (separate servo + logic rails) |
| 1 | PCA9685 16-ch PWM driver | Turret Tracker |
| 2 | SG90 or MG90S servos | Turret Tracker (pan + tilt) |
| 1–2 | ESP32-CAM (OV2640) | Nano, Standard, Turret |
| 1 | PIR sensor (HC-SR501) | Standard (wake-up trigger) |
| 2–3 | Active buzzer + high-bright LED + resistors | All builds |
| 1 | Relay module (opto-isolated) or MOSFET driver | Trigger Node |
| — | Dupont wires, screw terminals, project box | All builds |

### Buy Later

| Part | When |
|------|------|
| Stepper motors + drivers | Turret v2 (precision tracking) |
| Solenoids + high-current drivers | Countermeasure prototyping |
| Raspberry Pi / Jetson + Coral / Hailo | Phase 1B (real vision AI) |
| LTE modem, PoE injector, industrial enclosures | Phase 1C (field-ready) |

---

## Phase Progression

```text
Phase 1A  (now)      ESP32 demos — prove detect → decide → act
Phase 1B  (next)     Pi / Jetson swap — real ML inference
Phase 1C  (later)    Ruggedization, comms, field enclosures
Phase 2+  (future)   Production BOM, custom PCB, certification
```

---

## Open Questions

Before ordering, confirm:

1. **ESP32 board variant** — DevKitC vs ESP32-CAM vs other. Pinout tables differ.
2. **Servo voltage** — SG90 is rated 4.8–6V; MG90S may differ. Set the MP1584EN
   accordingly (5.0–5.5V for logic, 5.5–6.0V for servos).
3. **Turret camera mount** — ESP32-CAM riding on the pan/tilt, or fixed camera
   with turret for motion-only demo?

---

## Safety Notes

- Phase 1 deliberately avoids any hardware that launches, projects, or could
  cause physical harm.
- The [Trigger Node](phase1-trigger-node) demonstrates the actuation interface
  using LED/relay outputs only.
- All wiring should follow the shared
  [safety guidelines](phase1-wiring-safety).
