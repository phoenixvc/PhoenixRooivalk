# Lessons from RC/Drone Control and Platform BOM Conversations

This document distills lessons and document pointers from the long-running
conversations on: (1) controlling RC drones and turrets from a PC/AI, (2) cart
review and Platform BOM v1, (3) non-destructive boundary, and (4) avoiding
fragmentation. It does not duplicate content; it points to where each topic
lives in staging.

---

## 1. RC / drone / vehicle control

- **PC control of 2.4GHz RC (e.g. FlySky):** You cannot generate proprietary RF
  from a laptop. Do not attempt FlySky (or similar) RF emulation. **Options:**
  Replace the receiver with a microcontroller (ESP32) that outputs PWM; or
  replace the control stack with a flight controller that speaks MAVLink; or
  (hybrid) analog injection into the transmitter sticks via a small MCU. See
  [Control interface options](../../technical/control/control-interface-options.mdx)
  and
  [Transport abstraction](../../technical/architecture/interfaces/transport-abstraction.mdx).
- **MAVLink:** For drone/vehicle control from an app, MAVLink over
  USB/serial/UDP is the recommended SDK boundary. Replace the control stack
  (e.g. Betaflight/ArduPilot) rather than reverse-engineering RF.
- **Transport layer:** Keep the communication layer pluggable (USB/serial/WiFi;
  future RF only via a proper interface). AI and UI send normalized commands;
  transport is an implementation detail. See
  [Transport abstraction](../../technical/architecture/interfaces/transport-abstraction.mdx).

---

## 2. Platform BOM and cart review

- **Architecture lock:** ESP32 + RP2040 (optional). PCA9685 for servos; TB6612
  (small DC), BTS7960 (high-current DC). One IMU family. See
  [Platform BOM v1](../../engineering/phase1/platform-bom-v1.mdx) and
  [Avoid list](../../engineering/phase1/avoid-list.mdx).
- **Remove before checkout:** L298N, L293D, OV7670 (use OV2640/ESP32-CAM), XT60
  PDB, 360° servos for pan/tilt (use 180° positional), duplicate IMU families,
  TCA9548A until scaling, Arduino (standardize on ESP32 + RP2040). See
  [Platform BOM v1 — Remove before checkout](../../engineering/phase1/platform-bom-v1.mdx#remove-before-checkout)
  and [Avoid list](../../engineering/phase1/avoid-list.mdx).
- **Cart review:** (1) Remove wrong parts; (2) Confirm 180° servos and OV2640;
  (3) Don’t forget power (bulk cap on servo rail, battery/BEC if mobile,
  fuse/switch). See
  [Platform BOM v1 — Pre-checkout](../../engineering/phase1/platform-bom-v1.mdx#pre-checkout--cart-review).

---

## 3. Non-destructive boundary

- Destructive or “downing” methods (e.g. hobby EMP, Tesla coil) are out of scope
  and not documented. The documented path is detection, tracking, logging, and
  non-destructive response only. See
  [Safety boundary](../../engineering/phase1/safety-boundary.mdx).

---

## 4. Avoiding fragmentation

- **MCU sprawl:** Standardize on ESP32 (+ RP2040 optional). Avoid adding Arduino
  UNO/Nano/Pro Mini or multiple MCU families; it increases toolchain and
  firmware matrix complexity.
- **Motor drivers:** Two classes only — PCA9685 for servos; TB6612 (low–mid
  current DC), BTS7960 (high current DC). Do not use L298N or L293D for servos.
  See [Avoid list](../../engineering/phase1/avoid-list.mdx).
- **Sensors:** Pick one IMU family (e.g. BMI160 or MPU9250); don’t mix. TCA9548A
  only when scaling I2C.

---

## 5. Related gap analyses and roadmaps

- [conversation-gap-analysis-shopping-bom-rc-future-phases.md](./conversation-gap-analysis-shopping-bom-rc-future-phases.md)
  — Cart review, Platform BOM, RC/drone (MAVLink), non-destructive boundary.
- [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md)
  — Authority, data contracts, control interface options.
- [conversation-gap-analysis-r2000-cart-rc-transport.md](./conversation-gap-analysis-r2000-cart-rc-transport.md)
  — R2000 cart, DO NOT BUY, architecture lock.
- [roadmap-consolidation-prior-plan-reference.md](./roadmap-consolidation-prior-plan-reference.md)
  — Prior plans and gap analyses index.
