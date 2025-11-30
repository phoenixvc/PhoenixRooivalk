---
id: rkv-m-specifications
title: RKV-M Tilt Quad Rotor Specifications
sidebar_label: RKV-M Specifications
difficulty: advanced
estimated_reading_time: 4
points: 25
tags:
  - technical
  - counter-uas
---

## Overview

The RKV-M (Rooivalk Kinetic Vehicle - Modular) is the kinetic interceptor
component of the Phoenix Rooivalk counter-UAS system. This document details the
powerplant trades and specifications for the tilt-quad rotor configuration.

:::info Document Status

**One Page Brief** - Date: 2025-09-25 This document represents initial trade
study results. Subject to revision as development progresses.

:::

---

## Baseline Configuration

### Pod Design

| Parameter             | Specification                             |
| --------------------- | ----------------------------------------- |
| **Configuration**     | Ducted, single rotor, 3-blade             |
| **Duct Diameter**     | 0.60 m (600 mm)                           |
| **Tip Gap**           | 10 mm                                     |
| **Blade Count**       | 3                                         |
| **Design Philosophy** | Maximum thrust efficiency in compact form |

### Motor/ESC System

| Parameter                 | Specification                                        |
| ------------------------- | ---------------------------------------------------- |
| **Motor Type**            | HV outrunner                                         |
| **Voltage Configuration** | 16-20S LiPo                                          |
| **Kv Selection**          | Sized to maintain tip speed ≤120 m/s at hover thrust |
| **ESC**                   | High-voltage capable, matched to motor               |

---

## Tilt-Quad Configuration

### System Layout

```
         Front
           │
    ┌──────┼──────┐
    │      │      │
   [M1]────┼────[M2]
    │      │      │
    │    Fuselage │
    │      │      │
   [M3]────┼────[M4]
    │      │      │
    └──────┼──────┘
           │
         Rear

M1-M4: Tiltable motor pods with ducted rotors
All pods capable of 0-90° tilt for transition flight
```

### Flight Modes

| Mode           | Pod Angle        | Description                               |
| -------------- | ---------------- | ----------------------------------------- |
| **Hover**      | 0° (vertical)    | VTOL operations, precision positioning    |
| **Transition** | 0-90°            | Mode change between hover and cruise      |
| **Cruise**     | 90° (horizontal) | High-speed forward flight                 |
| **Intercept**  | Variable         | Dynamic positioning for target engagement |

---

## Performance Targets

### Flight Performance

| Parameter              | Target        | Notes                       |
| ---------------------- | ------------- | --------------------------- |
| **Max Speed**          | >150 km/h     | Cruise configuration        |
| **Hover Endurance**    | 8-12 minutes  | Depends on payload          |
| **Cruise Endurance**   | 15-20 minutes | Optimized flight profile    |
| **Operating Altitude** | 0-500 m AGL   | Primary engagement envelope |
| **Max Altitude**       | 1,000 m AGL   | Extended operations         |

### Intercept Performance

| Parameter               | Target             | Notes                       |
| ----------------------- | ------------------ | --------------------------- |
| **Time to Launch**      | <3 seconds         | From alert to airborne      |
| **Intercept Range**     | 500 m              | Effective engagement radius |
| **Target Closure Rate** | >200 km/h combined | Relative velocity           |
| **Maneuverability**     | ±60°/s yaw rate    | High-G capable              |

---

## Powerplant Trade Study

### Option A: Baseline (Selected)

| Attribute         | Value                                 |
| ----------------- | ------------------------------------- |
| **Configuration** | 16-20S HV outrunner                   |
| **Pros**          | Proven technology, good power density |
| **Cons**          | Battery weight, thermal management    |
| **TRL**           | 7                                     |
| **Risk**          | Low                                   |

### Option B: High-Voltage Direct Drive

| Attribute         | Value                             |
| ----------------- | --------------------------------- |
| **Configuration** | 24S+ direct drive                 |
| **Pros**          | Higher efficiency, reduced weight |
| **Cons**          | Specialized ESC required, cost    |
| **TRL**           | 5                                 |
| **Risk**          | Medium                            |

### Option C: Hybrid Electric

| Attribute         | Value                            |
| ----------------- | -------------------------------- |
| **Configuration** | Gas generator + electric motors  |
| **Pros**          | Extended endurance, rapid refuel |
| **Cons**          | Complexity, acoustic signature   |
| **TRL**           | 4                                |
| **Risk**          | High                             |

### Trade Matrix

| Factor             | Weight | Option A | Option B | Option C |
| ------------------ | ------ | -------- | -------- | -------- |
| Performance        | 25%    | 4        | 5        | 4        |
| Reliability        | 25%    | 5        | 3        | 3        |
| Cost               | 20%    | 4        | 3        | 2        |
| Weight             | 15%    | 3        | 4        | 3        |
| TRL                | 15%    | 5        | 3        | 2        |
| **Weighted Score** |        | **4.2**  | **3.6**  | **2.9**  |

**Decision: Option A (Baseline) selected for Phase 1 development**

---

## Rotor Aerodynamics

### Design Constraints

| Parameter         | Requirement   | Rationale                       |
| ----------------- | ------------- | ------------------------------- |
| **Tip Speed**     | ≤120 m/s      | Noise reduction, efficiency     |
| **Tip Gap**       | 10 mm nominal | Duct efficiency optimization    |
| **Blade Loading** | Moderate      | Responsive control authority    |
| **Disk Loading**  | 250-350 N/m²  | Balance hover/cruise efficiency |

### Acoustic Considerations

| Source        | Mitigation                         |
| ------------- | ---------------------------------- |
| Blade passing | 3-blade design (reduced harmonics) |
| Tip vortex    | Ducted configuration               |
| Motor noise   | Outrunner (external rotor shields) |
| ESC switching | High-frequency PWM (>20 kHz)       |

---

## Avionics Integration

### Flight Controller Requirements

| Component       | Specification                   |
| --------------- | ------------------------------- |
| **Processor**   | Dual-core ARM Cortex-M7 minimum |
| **IMU**         | Redundant 6-axis (gyro/accel)   |
| **Update Rate** | ≥400 Hz control loop            |
| **Interfaces**  | CAN, UART, PWM                  |

### Sensors

| Sensor           | Purpose               | Interface |
| ---------------- | --------------------- | --------- |
| **GPS/GNSS**     | Navigation (primary)  | UART      |
| **Optical Flow** | GPS-denied navigation | I2C/SPI   |
| **Barometer**    | Altitude hold         | I2C       |
| **Magnetometer** | Heading reference     | I2C       |
| **Proximity**    | Collision avoidance   | CAN       |

### Communication

| Link             | Purpose              | Range |
| ---------------- | -------------------- | ----- |
| **C2 Link**      | Command/control      | 2 km  |
| **Mesh Network** | Swarm coordination   | 500 m |
| **Emergency**    | Lost link procedures | N/A   |

---

## Manufacturing Considerations

### Materials

| Component    | Material                 | Rationale                   |
| ------------ | ------------------------ | --------------------------- |
| Frame        | Carbon fiber composite   | Strength/weight             |
| Ducts        | Injection molded polymer | Cost, repairability         |
| Motor mounts | CNC aluminum             | Precision, heat dissipation |
| Skin         | 3D printed nylon         | Rapid iteration             |

### Assembly

| Phase     | Time          | Notes                       |
| --------- | ------------- | --------------------------- |
| Airframe  | 2 hours       | Pre-assembled subassemblies |
| Avionics  | 1 hour        | Modular harnesses           |
| Testing   | 30 minutes    | Automated checkout          |
| **Total** | **3.5 hours** | Target for production units |

---

## Test Plan Summary

### Ground Tests

| Test            | Objective                  | Status  |
| --------------- | -------------------------- | ------- |
| Static thrust   | Validate motor performance | Planned |
| Thermal cycling | ESC/motor durability       | Planned |
| Vibration       | Structural integrity       | Planned |
| EMI/EMC         | Avionics compatibility     | Planned |

### Flight Tests

| Test                 | Objective              | Status  |
| -------------------- | ---------------------- | ------- |
| Hover stability      | Control tuning         | Planned |
| Transition           | Mode change validation | Planned |
| High-speed dash      | Max performance        | Planned |
| Endurance            | Battery/thermal limits | Planned |
| Intercept simulation | Mission profile        | Planned |

---

## Risk Register

| Risk              | Likelihood | Impact   | Mitigation                       |
| ----------------- | ---------- | -------- | -------------------------------- |
| Motor overheating | Medium     | High     | Thermal modeling, active cooling |
| ESC failure       | Low        | High     | Redundant paths, derating        |
| Duct damage       | Medium     | Medium   | Impact-resistant materials       |
| GPS denial        | High       | Medium   | Optical flow backup              |
| Battery fire      | Low        | Critical | Cell monitoring, containment     |

---

## Related Documents

- [ML Training Plan](../ml-training/ml-training-plan)
- [Operations Manual](../../operations/operations-manual)
- [Safety & Compliance](../../legal/compliance-framework)

---

_This document represents initial trade study results for the RKV-M interceptor
platform. Specifications subject to change as development progresses. © 2025
Phoenix Rooivalk. All rights reserved._
