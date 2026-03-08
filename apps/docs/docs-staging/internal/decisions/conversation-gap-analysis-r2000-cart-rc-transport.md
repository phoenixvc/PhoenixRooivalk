---
title: Conversation gap analysis — R2000 cart / RC / transport
sidebar_label: R2000 cart / RC / transport
---

# Conversation gap analysis: R2000 cart review, RC control, transport

This document captures how the **R2000 budget / cart review** conversation and
the **RC control + transport adjustable** discussion are reflected in
docs-staging. It records what was added or clarified so the conversation is
traceable.

**Scope:** Staging docs only.

---

## Conversation themes

- **R2000 budget:** Analyze cart, remove overlaps, align to Phase 1 product
  models, structure into core shared infrastructure + per-product BOM + buy now
  vs defer + upgrade path to 1B/1C.
- **DO NOT BUY (Phase 1A):** Brushless motors, ESCs, F405 flight controller, CAN
  Bus, TCA9548A (until scaling), BMP280, L298N, TB6612 for servos (only for DC
  motors). OV7670 on ESP32 → use ESP32-CAM (OV2640). 360° servos → 180°
  positional for pan/tilt.
- **GOOD TO KEEP:** ESP32-WROOM, MG90S metal gear, dual-axis mount, MP1584 buck,
  PCA9685, INA219 (platform telemetry), etc. Architecture lock: ESP32 + RP2040;
  PCA9685 for servos; TB6612/BTS7960 for DC motors; one IMU family.
- **Missing power items:** Battery, 5V BEC, fuse, power switch, bulk capacitor
  (e.g. 1000 µF) on servo rail.
- **Cart review before checkout:** Remove wrong parts; confirm 180° servos and
  OV2640; don't forget power items.
- **RC / 2.4 GHz:** Replace receiver with MCU (ESP32 → servo PWM); or hardware
  switch receiver vs MCU. MAVLink as SDK boundary for drone control. No
  proprietary RF emulation.
- **Transport adjustable:** User asked whether the communication layer can
  operate via USB/serial/WiFi or RF. Answer: transport is pluggable;
  USB/serial/WiFi today; RF via proper interface (e.g. MAVLink, USB HID/trainer)
  can be added; proprietary RF emulation out of scope.
- **Non-destructive / “downing drones”:** Hobby Tesla coil etc. effectively
  zero; legal note; focus on detection, tracking, logging, non-destructive
  response.

---

## Staging changes made (from this conversation)

| Topic                      | Where                                                                                      | Change                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Avoid list                 | [Avoid list](../../engineering/phase1/avoid-list.mdx)                                      | Added: TB6612 for servos → use for DC motors only (servos → PCA9685); CAN Bus modules (Phase 1 skip); BMP280/barometer (not for turret); Arduino UNO/Nano/Pro Mini (toolchain sprawl — ESP32 + RP2040 only). |
| Pre-checkout / cart review | [Platform BOM v1](../../engineering/phase1/platform-bom-v1.mdx)                            | New subsection: (1) Remove (link to avoid list), (2) Confirm (180° servos, OV2640), (3) Don't forget power (bulk cap, battery/BEC if mobile, fuse/switch).                                                   |
| Transport pluggable / RF   | [Transport abstraction](../../technical/architecture/interfaces/transport-abstraction.mdx) | Clarified: communication layer is pluggable (USB, serial, Wi-Fi); future RF via proper interface (MAVLink, USB HID/trainer) possible; proprietary RF emulation out of scope.                                 |

---

## Already in staging (no change)

- Remove before checkout list (L293D, OV7670, XT60, 360° servos, duplicate IMU)
  — platform-bom-v1.
- Quantities cheat sheet (ESP32, RP2040, PCA9685, MP1584EN, INA219, TB6612,
  BTS7960, MG90S, IMU, VL53L0X, ESP32-CAM) — platform-bom-v1.
- R2000 priority order (power + compute → actuation → motor drivers → sensing →
  camera) — platform-bom-v1.
- RC replace receiver / hardware switch —
  [Control interface options](../../technical/control/control-interface-options.mdx).
- MAVLink as SDK boundary — control-interface-options, future-phases.
- Safety boundary (no weaponization; detection, tracking, alarm, inert actuation
  only) — safety-boundary.mdx.
- Bulk capacitor 470–1000 µF, BEC sizing, common GND — power.mdx,
  wiring-safety.mdx.

---

## Related

- [Conversation gap analysis: shopping / BOM / RC / future phases](./conversation-gap-analysis-shopping-bom-rc-future-phases.md)
- [Control interface options](../../technical/control/control-interface-options.mdx)
- [Platform BOM v1](../../engineering/phase1/platform-bom-v1.mdx)
- [Avoid list](../../engineering/phase1/avoid-list.mdx)
