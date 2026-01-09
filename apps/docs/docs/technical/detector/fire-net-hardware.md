---
sidebar_position: 4
title: Fire Net Hardware Guide
description:
  Physical hardware options and wiring for the fire net deployment system
keywords: [fire net, hardware, GPIO, pneumatic, wiring, raspberry pi]
---

# Fire Net Hardware Guide

This document describes the physical hardware options and wiring for the Pi
Drone Detector's fire net deployment system.

## Overview

The fire net system uses a Raspberry Pi GPIO pin to trigger a physical
countermeasure deployment mechanism. The software provides a **100ms HIGH
pulse** on GPIO 17 (configurable) when all safety interlocks are satisfied.

```
Detection → Tracking (10+ frames) → Lock (85%+ confidence) → Safety Checks → GPIO Pulse (100ms)
```

## Signal Characteristics

| Parameter      | Value                                 |
| -------------- | ------------------------------------- |
| GPIO Pin       | 17 (BCM numbering, configurable 2-27) |
| Logic Level    | 3.3V (Raspberry Pi native)            |
| Pulse Duration | 100ms (0.1 seconds)                   |
| Idle State     | LOW (0V)                              |
| Active State   | HIGH (3.3V)                           |
| Max Current    | 16mA per GPIO pin                     |

**IMPORTANT**: The Pi's GPIO can only source ~16mA at 3.3V. You MUST use a
driver circuit (relay, transistor, or MOSFET) to control any actuator.

---

## Deployment Mechanism Options

### Option 1: Pneumatic System (Recommended for Range)

Best for: Long-range net deployment (10-50m), high velocity projection

#### Components

- Compressed air tank (3000-4500 PSI paintball tank or compressor)
- Pressure regulator (reduce to 100-150 PSI operating pressure)
- 12V/24V pneumatic solenoid valve (normally closed)
- Net launcher barrel/tube
- 12V relay module (for GPIO → solenoid)
- 12V power supply

#### Wiring Diagram

```
                                    +12V
                                      │
┌──────────────┐    ┌─────────────┐   │   ┌──────────────────┐
│ Raspberry Pi │    │ Relay Module│   │   │ Pneumatic        │
│              │    │             │   │   │ Solenoid Valve   │
│   GPIO 17 ───┼────┤ IN     COM ─┼───┘   │                  │
│              │    │             │       │ (Normally Closed)│
│   GND ───────┼────┤ GND    NO ──┼───────┤ +                │
│              │    │             │       │                  │
│   5V (opt) ──┼────┤ VCC    NC   │   ┌───┤ -                │
└──────────────┘    └─────────────┘   │   └──────────────────┘
                                      │
                                    GND
```

#### Advantages

- High velocity projection (50+ m/s)
- Long effective range (10-50m)
- Reliable in cold weather
- Fast deployment (<50ms response)

#### Disadvantages

- Requires compressed air supply
- More complex setup
- Higher cost ($200-500)
- Maintenance (tank refills, seal checks)

#### Recommended Products

- Solenoid: MAC 35A-AAA-DDBA-1BA (12V, 1/4" NPT)
- Tank: 48ci/3000psi paintball tank
- Regulator: Ninja adjustable output regulator

---

### Option 2: Spring-Loaded Mechanism

Best for: Short-range deployment (5-15m), simpler setup

#### Components

- Spring-loaded net launcher mechanism
- 12V linear solenoid (push/pull)
- 12V relay module
- 12V power supply

#### Wiring Diagram

```
                                    +12V
                                      │
┌──────────────┐    ┌─────────────┐   │   ┌──────────────────┐
│ Raspberry Pi │    │ Relay Module│   │   │ Linear Solenoid  │
│              │    │             │   │   │ (Release Latch)  │
│   GPIO 17 ───┼────┤ IN     COM ─┼───┘   │                  │
│              │    │             │       │                  │
│   GND ───────┼────┤ GND    NO ──┼───────┤ +                │
│              │    │             │       │                  │
│   5V ────────┼────┤ VCC    NC   │   ┌───┤ -                │
└──────────────┘    └─────────────┘   │   └──────────────────┘
                                      │
                                    GND
```

#### Advantages

- No compressed air needed
- Simpler, more portable
- Lower cost ($50-150)
- Quieter operation

#### Disadvantages

- Limited range (5-15m)
- Manual re-cocking required
- Spring fatigue over time
- Slower deployment

---

### Option 3: Electric Motor Launcher

Best for: Repeatable testing, development

#### Components

- High-torque DC motor with gear reduction
- Motor driver (L298N or BTS7960)
- Limit switches for position feedback
- 12V/24V power supply

#### Wiring Diagram

```
┌──────────────┐    ┌─────────────┐       ┌──────────────────┐
│ Raspberry Pi │    │ Motor Driver│       │ DC Motor         │
│              │    │ (L298N)     │       │ (Net Launcher)   │
│   GPIO 17 ───┼────┤ IN1        │       │                  │
│   GPIO 27 ───┼────┤ IN2   OUT1 ┼───────┤ M+               │
│              │    │       OUT2 ┼───────┤ M-               │
│   GND ───────┼────┤ GND        │       │                  │
│              │    │       +12V ┼───┐   └──────────────────┘
└──────────────┘    └─────────────┘   │
                                      │
                                   +12V Supply
```

#### Advantages

- Electronically controllable power
- Can be reset automatically
- Good for development/testing
- Variable deployment force

#### Disadvantages

- More complex control logic
- Slower response time
- Higher power consumption
- Mechanical complexity

---

### Option 4: Pyrotechnic/CO2 Cartridge

Best for: One-shot deployment, maximum range

**WARNING**: May require permits. Check local regulations.

#### Components

- CO2 cartridge launcher mechanism
- Electric igniter or puncture solenoid
- Safety interlock switches
- Appropriate relay/driver

#### Advantages

- Very high velocity
- Compact, self-contained
- Long shelf life

#### Disadvantages

- Single-use cartridges
- Regulatory restrictions
- Higher per-shot cost
- Safety concerns

---

## Recommended Setup: Relay Module

For most applications, use a relay module to interface between the Pi and your
actuator:

### Parts List

| Component         | Specification                     | Approx. Cost |
| ----------------- | --------------------------------- | ------------ |
| Relay Module      | 5V/12V, opto-isolated, 10A        | $5-10        |
| Power Supply      | 12V 2A (or match actuator)        | $10-20       |
| Solenoid/Actuator | Per deployment type               | $20-200      |
| Wiring            | 18-22 AWG, stranded               | $5-10        |
| Connectors        | Screw terminals, spade connectors | $5-10        |

### Relay Module Selection

Choose a relay module with:

- **Opto-isolation**: Protects Pi from back-EMF
- **Active-LOW or Active-HIGH**: Code supports both (default HIGH trigger)
- **Adequate current rating**: 10A recommended
- **Flyback diode**: Built-in for inductive loads

Recommended: SainSmart 2-Channel 5V Relay Module (opto-isolated)

### Complete Wiring Example (Pneumatic)

```
                    RASPBERRY PI                          RELAY MODULE
                  ┌─────────────────┐                   ┌─────────────┐
                  │ Pin 1  (3.3V)   │                   │             │
                  │ Pin 2  (5V)  ───┼───────────────────┤ VCC         │
                  │ Pin 6  (GND) ───┼───────────────────┤ GND         │
                  │ Pin 11 (GPIO17)─┼───────────────────┤ IN1         │
                  │                 │                   │             │
                  └─────────────────┘                   │     COM ────┼──── +12V
                                                       │     NO  ────┼──┐
                                                       │     NC      │  │
                                                       └─────────────┘  │
                                                                        │
                    12V POWER SUPPLY                   PNEUMATIC SOLENOID
                  ┌─────────────────┐                 ┌─────────────────┐
                  │ +12V ───────────┼─────────────────┤ + (from relay)  │
                  │ GND  ───────────┼─────────────────┤ -               │
                  └─────────────────┘                 └─────────────────┘
```

---

## Safety Considerations

### Electrical Safety

1. **Flyback protection**: Use relays with built-in flyback diodes for solenoids
2. **Fusing**: Add inline fuse on 12V supply (2A for solenoid, 10A for motor)
3. **Isolation**: Use opto-isolated relay modules
4. **Grounding**: Ensure common ground between Pi and relay module

### Mechanical Safety

1. **Physical interlock**: Add manual safety switch in series with trigger
2. **Aiming constraints**: Ensure launcher cannot point at personnel
3. **Backstop**: Have a safe direction for misfires
4. **Pressure relief**: For pneumatic systems, include pressure relief valve

### Software Safety (Built-in)

The code implements 7 safety interlocks:

1. System must be explicitly armed (`fire_net_arm_required: true`)
2. Fire net must be enabled in settings (`fire_net_enabled: true`)
3. Cooldown between fires (default 10 seconds)
4. Minimum confidence threshold (default 0.85)
5. Minimum tracking duration (default 10 frames)
6. Distance envelope (default 5-50m)
7. Maximum target velocity (default 30 m/s)

### Recommended Physical Safety Switch

Add a hardware safety switch in series:

```
GPIO 17 ──────┤ Relay IN

Relay NO ─────┬───────── Solenoid +
              │
        [SAFETY SWITCH]
              │
+12V ─────────┘
```

---

## Testing Procedure

### 1. Bench Test (No Actuator)

```bash
# Test GPIO output with LED
cd apps/detector
python -c "
import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.OUT)
print('Pulsing GPIO 17...')
GPIO.output(17, GPIO.HIGH)
time.sleep(0.1)
GPIO.output(17, GPIO.LOW)
print('Done')
GPIO.cleanup()
"
```

### 2. Relay Test (No Actuator)

Connect relay module, verify LED/click when GPIO pulses.

### 3. Actuator Test (Unloaded)

Connect actuator with no net loaded, verify operation.

### 4. Full System Test

Load net, verify end-to-end deployment.

---

## Configuration Example

Create `config/fire-net-enabled.yaml`:

```yaml
# Fire Net Enabled Configuration
# WARNING: Only use in controlled environments

targeting:
  # Distance estimation
  max_targeting_distance_m: 50.0
  assumed_drone_size_m: 0.3

  # Target lock requirements
  min_confidence_for_lock: 0.7
  lock_timeout_seconds: 5.0

  # Fire net settings
  fire_net_enabled: true
  fire_net_min_confidence: 0.85 # High confidence required
  fire_net_min_track_frames: 10 # Must track for 10+ frames
  fire_net_max_distance_m: 50.0 # Max 50m
  fire_net_min_distance_m: 5.0 # Min 5m (safety)
  fire_net_velocity_threshold_ms: 30.0 # Max 30 m/s
  fire_net_cooldown_seconds: 10.0 # 10s between fires
  fire_net_arm_required: true # Must explicitly arm
  fire_net_gpio_pin: 17 # BCM pin number
```

---

## Troubleshooting

| Issue               | Possible Cause       | Solution                |
| ------------------- | -------------------- | ----------------------- |
| GPIO not triggering | Wrong pin mode       | Verify BCM numbering    |
| Relay not clicking  | Insufficient voltage | Check 5V from Pi        |
| Solenoid not firing | Relay contacts       | Check NO/NC connection  |
| Weak deployment     | Low pressure/voltage | Check power supply      |
| Erratic behavior    | EMI from solenoid    | Add ferrite beads       |
| Pi crashes on fire  | Back-EMF spike       | Use opto-isolated relay |

### Diagnostic Commands

```bash
# Check GPIO state
cat /sys/class/gpio/gpio17/value

# Monitor GPIO in real-time
watch -n 0.1 'cat /sys/class/gpio/gpio17/value'

# Test with software
python -c "from targeting import FireNetController; print('Module loads OK')"
```

---

## Vendor Resources

### Pneumatic Components

- Clippard (https://www.clippard.com) - Miniature pneumatic valves
- SMC (https://www.smcusa.com) - Industrial pneumatic
- Festo (https://www.festo.com) - Premium pneumatic

### Relay Modules

- Adafruit - High-quality relay boards
- SparkFun - Well-documented modules
- Amazon/AliExpress - Budget options (verify opto-isolation)

### Net Launchers

- Custom fabrication recommended
- Paintball/airsoft communities have designs
- 3D printable components available

---

## Legal Considerations

Before deploying any countermeasure system:

1. **Check local laws** regarding drone interception
2. **Obtain necessary permits** for compressed air/pyrotechnics
3. **Liability insurance** recommended
4. **Property rights** - only deploy on owned/permitted property
5. **Aviation regulations** - contact local aviation authority

This documentation is for educational purposes. The authors assume no liability
for use or misuse of this information.
