---
id: phase5-rkv-m-integration
title: "RKV-M Kinetic Interceptor Integration"
sidebar_label: RKV-M Integration
sidebar_position: 2
description:
  Integration specifications for the RKV-M tilt-quad interceptor drone with the
  Phase 5 C-UAS detection network, including launch procedures, terminal
  guidance, and recovery.
difficulty: advanced
estimated_reading_time: 10
points: 35
tags:
  - hardware
  - phase-5
  - rkv-m
  - interceptor
  - kinetic
  - c-uas
phase: ["series-c", "scale"]
prerequisites: ["phase5-hardware-overview"]
---

# RKV-M Kinetic Interceptor Integration

This document covers the operational integration of the RKV-M interceptor drone
with the Phase 5 C-UAS detection network — from target handoff to net capture
to evidence recovery.

---

## System Context

The RKV-M does not operate independently. It is one component of the integrated
C-UAS kill chain:

```text
Detection Network          Command Post           RKV-M
(4× sensor nodes)     (fusion + C2 + operator)  (interceptor)
       │                        │                      │
  Detect target ──────▶ Fuse + classify           Standby (on pad)
                        Estimate trajectory              │
                        Recommend engagement             │
                               │                         │
                     Operator authorizes ──────▶  Receive launch cmd
                               │                         │
                        Track updates ──────────▶ Navigate to intercept
                        (continuous)                      │
                               │                  Terminal guidance
                               │                  (onboard AI)
                               │                         │
                               │                  Deploy net
                               │                         │
                     Confirm capture ◀───────── Report status
                               │                         │
                     Log engagement              RTB + land
                     Anchor to blockchain        (autonomous)
```

---

## Target Handoff Protocol

When the command post authorizes engagement, it sends a target handoff message
to the RKV-M containing everything needed for autonomous intercept:

### Handoff Message (JSON over MANET)

```json
{
  "msg_type": "ENGAGEMENT_AUTH",
  "engagement_id": "ENG-2026-0342",
  "operator_token": "<Ed25519 signature>",
  "timestamp_utc": "2026-03-04T14:23:07.442Z",
  "target": {
    "track_id": "TRK-00117",
    "classification": "confirmed_drone",
    "class_detail": "DJI Mavic 3",
    "position": {
      "lat": 34.052235,
      "lon": -118.243683,
      "alt_msl_m": 120,
      "accuracy_m": 5
    },
    "velocity": {
      "speed_ms": 12.5,
      "heading_deg": 045,
      "climb_rate_ms": 0.0
    },
    "predicted_position_5s": {
      "lat": 34.052290,
      "lon": -118.243590,
      "alt_msl_m": 120
    }
  },
  "roe": {
    "net_only": true,
    "max_range_m": 2000,
    "max_altitude_m": 400,
    "no_fly_zones": [],
    "abort_conditions": ["civilian_aircraft_within_500m", "target_lost_30s"]
  }
}
```

### Continuous Track Updates

After handoff, the command post streams track updates at 10 Hz:

```json
{
  "msg_type": "TRACK_UPDATE",
  "track_id": "TRK-00117",
  "position": { "lat": ..., "lon": ..., "alt_msl_m": ... },
  "velocity": { "speed_ms": ..., "heading_deg": ..., "climb_rate_ms": ... },
  "confidence": 0.95,
  "sensor_sources": ["radar", "eo_ir"]
}
```

The RKV-M uses these updates for mid-course navigation but switches to onboard
sensors for terminal guidance (last 100m).

---

## RKV-M Flight Computer

### Hardware

| Component | Specification |
|-----------|---------------|
| Processor | Dual-core ARM Cortex-M7 (STM32H7) for flight control |
| AI module | Jetson Orin NX 8GB for onboard vision + guidance |
| IMU | ICM-42688-P (gyro/accel, 32kHz ODR) + redundant backup |
| GPS/GNSS | u-blox F9P (RTK-capable, ±2cm with base station) |
| Optical flow | PMW3901 + VL53L5CX (8×8 ToF) for GPS-denied |
| Barometer | BMP390 (±0.3m altitude accuracy) |
| Magnetometer | BMM350 (hard/soft iron calibrated) |
| Proximity | 4× TFmini-S LiDAR (collision avoidance, 12m range) |

### Software

| Layer | Implementation |
|-------|---------------|
| RTOS | FreeRTOS on STM32H7 (flight-critical: motors, IMU, safety) |
| Linux | JetPack 6.x on Orin NX (vision, guidance, comms) |
| Flight control | PX4-based (modified for tilt-quad) at 400 Hz |
| Guidance | Custom intercept algorithm (proportional navigation) |
| Terminal vision | YOLOv9 + optical flow for final approach |
| Comms | MANET radio (Silvus or equivalent) |

---

## Intercept Phases

### Phase 1: Launch + Climb (0–15 seconds)

```text
Pad → VTOL climb → transition to cruise
```

| Parameter | Value |
|-----------|-------|
| Launch mode | Vertical (all pods at 0°) |
| Climb rate | 10–15 m/s |
| Transition altitude | 50m AGL (configurable) |
| Pod tilt | 0° → 45° → 90° over 3 seconds |
| Navigation | GPS waypoint toward predicted intercept point |

### Phase 2: Mid-Course (15–45 seconds)

```text
Cruise toward intercept point using ground track updates
```

| Parameter | Value |
|-----------|-------|
| Flight mode | Cruise (pods at 90°) |
| Speed | Max cruise speed |
| Navigation | Proportional navigation on track updates (10 Hz) |
| Course correction | Continuous, guided by command post fusion |
| Abort check | Every 1 second (ROE violations trigger RTB) |

### Phase 3: Terminal Guidance (Last 100m, 5–10 seconds)

```text
Onboard AI takes over — camera locks on target, closes to net range
```

| Parameter | Value |
|-----------|-------|
| Flight mode | Intercept (pods at variable angle) |
| Guidance | Onboard YOLOv9 visual lock + proportional nav |
| Approach vector | From above and behind (minimize target evasion) |
| Closure rate | Managed to avoid overshoot |
| Net range | 15–25m (triggers net deployment) |
| Camera | Forward-looking, 120° FOV, 60 FPS |

### Phase 4: Net Deployment

```text
Net launched → target entangled → descent
```

| Parameter | Value |
|-----------|-------|
| Trigger | Range <= 20m AND visual lock confidence >= 0.85 |
| Net deployment | Compressed gas + spring, <200ms to full spread |
| Net type | Kevlar/Dyneema blend (see net-specifications) |
| Weighted corners | 4× 25g tungsten for rapid spread |
| Backup | If first net misses, RTB for reload (if second pod available) |

### Phase 5: Recovery

```text
Target descends → RKV-M RTB → autonomous landing
```

| Parameter | Value |
|-----------|-------|
| Target descent | Uncontrolled (net entangles rotors) |
| Descent rate | 3–8 m/s (depending on target mass) |
| RKV-M action | Break off, transition to cruise, RTB |
| Landing | Autonomous precision landing on pad (optical flow + GPS) |
| Evidence team | Dispatched to target impact point for recovery |

---

## Safety Systems

### Abort Conditions (Automatic)

The RKV-M will automatically abort and RTB if any condition is met:

| Condition | Action |
|-----------|--------|
| Target lost for >30 seconds | RTB |
| Civilian aircraft within 500m (ADS-B) | Immediate RTB |
| Battery below 20% | RTB |
| Outside engagement envelope (range/altitude) | RTB |
| Flight controller fault | Emergency land (nearest safe point) |
| MANET link lost for >60 seconds | RTB on last known heading |
| Operator sends ABORT command | Immediate RTB |

### Geofencing

| Zone | Behavior |
|------|----------|
| Operating area | Normal flight permitted |
| Buffer zone (500m outside) | Warning to operator, auto-RTB if breached |
| No-fly zone | Hard geofence, flight controller rejects waypoints |
| Friendly positions | Exclusion zones around allied assets |

### Lost Link Procedure

```text
T+0s     Link lost detected (no MANET heartbeat)
T+5s     Switch to GPS-only nav, hold current heading
T+30s    Begin RTB on stored waypoint (pad coordinates)
T+60s    If still no link, continue RTB
T+180s   Land at pad (or nearest safe point if pad unreachable)
```

---

## Evidence Chain

Every engagement produces a complete evidence package:

| Data | Source | Anchored |
|------|--------|----------|
| Engagement authorization | Command post (operator token) | Blockchain |
| Target track history | Fusion engine (full trajectory) | Blockchain |
| RKV-M flight log | Flight controller (IMU, GPS, commands) | Blockchain |
| Onboard video | Forward camera (H.265, timestamped) | Blockchain hash |
| Net deployment timestamp | Flight controller GPIO | Blockchain |
| Capture confirmation | Onboard visual (target entangled) | Blockchain |
| Recovery coordinates | GPS fix at target impact point | Blockchain |
| Physical evidence | Recovered drone (chain of custody) | Blockchain |

---

## Maintenance & Readiness

### Pre-Flight Checks (Automated, 60 seconds)

| Check | Method |
|-------|--------|
| Motor spin-up test | Each motor spins to 10% for 1 second |
| IMU calibration | Gyro bias check (stationary on pad) |
| GPS lock | >=8 satellites, HDOP <2.0 |
| Battery health | Voltage, internal resistance, temperature |
| Net cartridge | Continuity check on deployment circuit |
| MANET link | Heartbeat exchange with command post |
| Camera | Capture test frame, verify YOLO model loaded |

### Turnaround (Post-Flight)

| Task | Time | Notes |
|------|------|-------|
| Land + power down | 2 min | Autonomous |
| Battery swap | 3 min | Quick-release tray |
| Net cartridge reload | 45 sec | Push-fit mechanism |
| Data offload | 1 min | USB-C or WiFi to hub |
| Pre-flight check | 1 min | Automated |
| **Total turnaround** | **~8 min** | Target for operational tempo |

---

## Acceptance Criteria

- [ ] RKV-M launches within 30 seconds of operator authorization
- [ ] Mid-course navigation error <10m at 1km range
- [ ] Terminal guidance achieves visual lock at >=100m
- [ ] Net deployment captures target at 85%+ success rate (controlled test)
- [ ] Autonomous RTB completes safely with no link
- [ ] All abort conditions trigger correctly (tested individually)
- [ ] Full evidence chain anchored to blockchain for every engagement
- [ ] Turnaround time <10 minutes (battery + net + data)
- [ ] 50-flight endurance test with no structural failures
- [ ] Human-in-the-loop cannot be bypassed (red team validated)
