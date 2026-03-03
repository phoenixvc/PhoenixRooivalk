---
id: phase1-wiring-safety
title: "Phase 1 Wiring & Safety Guidelines"
sidebar_label: Wiring & Safety
sidebar_position: 6
description:
  Common wiring practices and safety guidelines for all Phase 1 ESP32 demo
  builds.
difficulty: beginner
estimated_reading_time: 4
points: 5
tags:
  - hardware
  - phase-1
  - safety
  - wiring
phase: ["seed"]
---

# Phase 1 Wiring & Safety Guidelines

Common rules for all Phase 1 builds. Follow these before powering anything.

---

## Power

### MP1584EN Buck Converter Setup

1. **Set voltage before connecting load.** Adjust the trim pot with a multimeter
   on the output. Clockwise typically raises voltage.
2. **Input range:** 4.5–28V DC. Use a 7–12V supply for all Phase 1 builds.
3. **Output targets:**
   - **5.0–5.1V** for ESP32 logic rail.
   - **5.5–6.0V** for servo rail (check servo datasheet; never exceed 6V for
     SG90/MG90S).
4. **Separate rails** for logic and servos. Servo current spikes cause ESP32
   brownouts if sharing a single converter.

### Capacitors

- Place a **100µF** electrolytic near the ESP32 VIN pin for input filtering.
- Place a **470–1000µF** electrolytic near the PCA9685 V+ terminal for servo
  current spikes.
- Observe polarity (stripe = negative).

### Fusing

- A **3A polyfuse** on each buck converter output is cheap insurance.
- For the 12V relay load rail, a **2A fuse** protects against short circuits in
  the dummy load.

---

## ESP32 GPIO

### Pins to Avoid

| Pin | Why |
|-----|-----|
| GPIO 0 | Boot mode strapping — held LOW enters flash mode |
| GPIO 2 | Boot mode strapping — may cause boot failure if pulled |
| GPIO 15 | Boot log strapping — pulling LOW silences boot log |
| GPIO 6–11 | Connected to onboard SPI flash — never use |
| GPIO 34–39 | Input-only — cannot drive outputs |

### Safe Output Pins

GPIO 12, 13, 14, 25, 26, 27, 32, 33 are generally safe for output on most
ESP32 variants. Always verify against your specific board's pinout.

### Current Limits

- **Max per GPIO:** ~12mA at 3.3V (absolute max 40mA, but not recommended).
- **Anything drawing >12mA** (buzzers, relays, LED strips) must be driven
  through a transistor, MOSFET, or relay module.

### Pull-ups and Debounce

- Use `INPUT_PULLUP` mode for buttons (button connects GPIO to GND).
- Debounce in firmware: 50ms delay after state change before reading again.

---

## I2C (PCA9685)

- Default address: `0x40`.
- **SDA:** GPIO 21 (ESP32 default).
- **SCL:** GPIO 22 (ESP32 default).
- Keep I2C wires short (<20cm) to avoid noise. Use twisted pair if longer.
- **Common ground** between ESP32 and PCA9685 is mandatory — floating ground
  causes erratic behavior.

---

## Servos

### Pulse Width Standard

| Position | Pulse Width |
|----------|-------------|
| 0° | ~500µs |
| 90° (center) | ~1500µs |
| 180° | ~2500µs |

These are typical values. Calibrate per servo — some units have narrower or
wider ranges.

### Mechanical Limits

- **Never drive a servo past its physical stop.** Listen for grinding/buzzing
  and back off the angle in firmware.
- Start with a restricted range (30–150°) and widen as you learn the unit's
  actual travel.

### Heat

- Stalled servos (held against a stop) draw peak current and overheat. Always
  include mechanical end-stops or firmware limits.

---

## Relay Modules

- Use **opto-isolated** modules when available — they protect the ESP32 from
  back-EMF and ground loops.
- Relay coils are inductive. The module should have a flyback diode onboard (most
  do). Verify before buying bare relays.
- **Always assume the relay is energized** until you confirm the firmware is
  correct. Wire the dummy load first, not a real actuator.

---

## General Wiring

| Practice | Why |
|----------|-----|
| Color-code wires: red = power, black = ground, other = signal | Reduces wiring errors |
| Use screw terminals for power connections | More secure than breadboard jumpers |
| Heatshrink or tape on all solder joints | Prevents shorts |
| Secure wires with zip ties or cable clips | Prevents snags and disconnections |
| Label each wire at both ends | Debugging is faster |
| Test with multimeter before powering on | Catches shorts and wrong voltages |

---

## Checklist Before First Power-On

- [ ] Buck converter output verified with multimeter (no load)
- [ ] All grounds connected (common ground bus)
- [ ] No bare wire ends that could short
- [ ] Capacitors installed with correct polarity
- [ ] Servo rail separate from logic rail
- [ ] ESP32 strapping pins (0, 2, 15) are free
- [ ] Relay load is a dummy (LED strip / lamp), not a real actuator
- [ ] Fuses or polyfuses installed on power rails
