---
id: phase5-hardware-overview
title: "Phase 5 Hardware: Defense-Grade Deployment"
sidebar_label: Phase 5 Overview
sidebar_position: 1
description:
  Phase 5 hardware strategy — MIL-STD qualified systems, coalition
  interoperability, RKV-M integration, and full C-UAS site deployment.
difficulty: advanced
estimated_reading_time: 12
points: 35
tags:
  - hardware
  - phase-5
  - mil-std
  - defense
  - coalition
  - rkv-m
  - c-uas
phase: ["series-c", "scale"]
---

# Phase 5 Hardware: Defense-Grade Deployment

Phase 5 is the culmination of the hardware roadmap — fully qualified
defense-grade systems deployed as integrated counter-UAS sites with kinetic
intercept capability, coalition interoperability, and MIL-STD compliance across
the board.

---

## Design Principles

1. **MIL-STD or it doesn't ship** — every component meets 810G (environmental),
   461G (EMI/EMC), and relevant defense procurement standards
2. **Coalition-ready** — STANAG 4586 / Link 16 receive / MADL interop from day
   one of field deployment
3. **Modular C-UAS site** — 4-node detection perimeter + central command +
   RKV-M launch pad, deployable in <4 hours
4. **Secure by design** — HSM-backed crypto, FIPS 140-3, classified-capable
   comms channels
5. **Sustained operations** — 24/7/365 with hot-swappable modules and
   predictive maintenance

---

## Integrated C-UAS Site Layout

```text
                    Detection Node (N)
                         ●
                        / \
                       /   \
                      /     \
   Detection Node (W)●───────●  Detection Node (E)
                      \     /
                       \   /
                        \ /
                         ●
                    Detection Node (S)

                    ┌─────────────────┐
                    │  Command Post   │
                    │  (SkyWatch Hub  │
                    │   MIL-grade)    │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  RKV-M Launch   │
                    │  Pad (×2)       │
                    └─────────────────┘

   Coverage: 360° detection perimeter
   Range: 2–5km per node (overlapping coverage)
   Response: RKV-M airborne in <{TIME_TO_LAUNCH}
```

---

## Detection Node (Defense-Grade)

### Ruggedized Compute

| Parameter | Specification |
|-----------|---------------|
| Platform | NVIDIA Jetson AGX Orin 64GB |
| Housing | Curtiss-Wright DuraCOR Orin or FORECR MILBOX |
| Operating temp | -40°C to +71°C (MIL-STD-810G Method 501.7/502.7) |
| Shock | 40G, 11ms half-sine (MIL-STD-810G Method 516.8) |
| Vibration | MIL-STD-810G Method 514.8, Cat 4 |
| IP rating | IP67 (submersible 1m for 30 min) |
| EMI/EMC | MIL-STD-461G (RE102, CE102, RS103, CS101) |
| Power input | 18–32 VDC (vehicle power compatible) |
| MTBF | >30,000 hours (calculated per MIL-HDBK-217) |

### Defense Sensor Suite

| Sensor | Specification | Range |
|--------|---------------|-------|
| EO camera | Cooled CCD, 2048×1536, motorized 10–300mm zoom | 5+ km (detection), 2km (classification) |
| Thermal (MWIR) | Cooled InSb, 640×512, 15µm pitch | 3+ km (detection) |
| Radar | FMCW, X-band, micro-Doppler | 5km (Group 1), 10km (Group 2-3) |
| RF/SIGINT | 30 MHz – 6 GHz, real-time spectrum analysis | 10+ km (passive) |
| Acoustic | 8-element MEMS array, beamforming | 300m (detection), ±5° DOA |

### Multi-Sensor Fusion (Defense)

The defense-grade fusion engine extends Phase 3's Bayesian approach with:

- **Track management** — persistent track IDs across sensor handoffs with
  Kalman-filter state estimation
- **Classification pipeline** — 5-level scale: Unknown → Suspect → Probable →
  Confirmed → Identified
- **Threat prioritization** — weighted by range, closing speed, payload estimate,
  and RF signature
- **Engagement recommendation** — automated soft-kill/hard-kill recommendation
  based on rules of engagement (ROE) configured by operator

---

## Command Post (SkyWatch Hub MIL-Grade)

### Hardware

| Parameter | Specification |
|-----------|---------------|
| Compute | Dual Jetson AGX Orin 64GB (redundant, active-active) |
| Housing | 19" rack-mount transit case (Pelican Hardigg) |
| Display | 2× 24" ruggedized monitors (1080p, sunlight-readable) |
| Input | MIL-spec keyboard + trackball (Cherry MX, sealed) |
| Storage | 2× 2TB NVMe RAID-1 (event log + evidence archive) |
| Power | 120/240VAC or 28VDC vehicle power, 500W UPS |
| Comms | MANET mesh + LTE + SATCOM (Iridium Certus) |

### Software Stack

| Layer | Technology |
|-------|-----------|
| OS | RedHawk Linux RTOS (Concurrent Real-Time) |
| Framework | ROS 2 Humble + Isaac ROS |
| Fusion engine | Custom (Rust) — multi-target tracker with IMM |
| Dashboard | React + Mapbox GL (tactical overlay) |
| C2 interface | STANAG 4586 adapter for external C2 systems |
| Evidence | Blockchain anchor via Evidence CLI (classified channel) |
| Encryption | Type 1 (NSA-approved) or AES-256-GCM (non-classified) |

---

## RKV-M Integration

Phase 5 is the first phase where the RKV-M interceptor drone is operationally
integrated with the detection network.

### Launch Pad

| Parameter | Specification |
|-----------|---------------|
| Capacity | 2 RKV-M units (hot-standby) |
| Launch method | Vertical (VTOL), no rail required |
| Time to launch | Target: <30 seconds from operator command |
| Recovery | Autonomous RTB + precision landing on pad |
| Reload | Manual net cartridge swap (45 seconds) |
| Weather limits | Wind <25 kt, visibility >500m, no lightning |

### Engagement Sequence

```text
1. DETECT    Detection nodes identify and classify threat
                │
2. TRACK     Fusion engine assigns persistent track, estimates trajectory
                │
3. RECOMMEND Engagement engine recommends intercept based on ROE
                │
4. AUTHORIZE Operator confirms engagement (human-in-the-loop mandatory)
                │
5. LAUNCH    RKV-M launches from pad, climbs to intercept altitude
                │
6. INTERCEPT RKV-M closes on target, AI-guided terminal approach
                │
7. CAPTURE   Net deployed at 15–25m range, target entangled
                │
8. DESCEND   Target descends under control (optional tether)
                │
9. RECOVER   RKV-M returns to pad, evidence team recovers target
                │
10. LOG      Full engagement chain anchored to blockchain
```

### Human-in-the-Loop Requirements

All kinetic engagements require explicit operator authorization. The system
**will not** autonomously launch or fire without human confirmation. This is
enforced at multiple levels:

| Layer | Enforcement |
|-------|------------|
| Software | Launch command requires cryptographic operator token |
| Firmware | RKV-M flight controller requires signed launch auth |
| Hardware | Physical arm switch on launch pad (key-operated) |
| Policy | ROE configuration reviewed and signed by commanding officer |
| Audit | Every engagement decision logged with operator ID + timestamp |

---

## Communications Architecture

### MANET Mesh (Primary Tactical)

| Parameter | Specification |
|-----------|---------------|
| Radio | Silvus StreamCaster 4200 or Persistent Systems MPU5 |
| Frequency | L-band / S-band (configurable) |
| Range | 5–15 km (node-to-node, line of sight) |
| Data rate | 20–100 Mbps (distance dependent) |
| Topology | Self-forming, self-healing mesh |
| Encryption | AES-256, NSA Type 1 optional |
| Waveform | MIMO-OFDM |

### Link 16 / MADL (Coalition)

| Parameter | Specification |
|-----------|---------------|
| Interface | MIDS-LVT or software-defined radio adapter |
| Mode | Receive-only (J-series messages) |
| Messages | J3.2 (air track), J3.5 (EW), J7.0 (Intel) |
| Purpose | Receive coalition air picture, avoid blue-on-blue |
| Classification | SECRET / COSMIC TOP SECRET (depending on network) |

### SATCOM (Beyond Line of Sight)

| Parameter | Specification |
|-----------|---------------|
| Service | Iridium Certus 200 or Starlink (CONUS) |
| Data rate | 176 kbps (Iridium) or 100+ Mbps (Starlink) |
| Purpose | Reach-back to command center, OTA updates, evidence sync |
| Latency | 600ms (Iridium) or 40ms (Starlink) |

---

## Security Architecture

### Hardware Security Module (HSM)

| Parameter | Specification |
|-----------|---------------|
| Module | Microchip ATECC608B or NXP SE050 |
| Certification | FIPS 140-3 Level 2 (target) |
| Functions | Key storage, attestation, secure boot verification |
| Keys | Device identity, operator auth, evidence signing |
| Interface | I2C (dedicated bus, not shared) |

### Secure Boot Chain (Defense)

```text
Jetson Fuse-based Root of Trust
    │
    ▼
HSM verifies U-Boot signature
    │
    ▼
U-Boot verifies kernel + initramfs
    │
    ▼
dm-verity on root filesystem (read-only, hash-verified)
    │
    ▼
Application containers (signed images only)
    │
    ▼
Runtime attestation (HSM challenge-response every 60s)
```

### Data Classification

| Data Type | Classification | Storage | Transmission |
|-----------|---------------|---------|-------------|
| Raw sensor video | UNCLASSIFIED | Encrypted at rest (AES-256) | MANET mesh (encrypted) |
| Fused tracks | CUI (Controlled Unclassified) | Encrypted at rest | MANET mesh (encrypted) |
| Engagement decisions | CONFIDENTIAL | HSM-protected log | MANET + evidence blockchain |
| Coalition air picture | SECRET | Classified enclave only | Link 16 (receive only) |
| Operator credentials | N/A | HSM key storage | Never transmitted |

---

## Environmental Qualification

### MIL-STD-810G Tests Required

| Test | Method | Procedure | Notes |
|------|--------|-----------|-------|
| High temp | 501.7 | Storage +71°C, Operating +55°C | 72hr exposure |
| Low temp | 502.7 | Storage -51°C, Operating -40°C | 72hr exposure |
| Temp shock | 503.7 | -40°C to +71°C, 10 min transfer | 3 cycles |
| Rain | 506.6 | Procedure I (blowing rain, 70mph) | 30 min/face |
| Humidity | 507.6 | 95% RH, 30°C–60°C cycling | 10 days |
| Sand/dust | 510.7 | Blowing dust, 1.5 m/s | 6hr |
| Vibration | 514.8 | Category 4 (wheeled vehicle) | 3-axis |
| Shock | 516.8 | 40G, 11ms, 3-axis | 3 drops per axis |

### MIL-STD-461G Tests Required

| Test | Description | Limit |
|------|-------------|-------|
| CE102 | Conducted emissions, power leads | Curve per Class |
| RE102 | Radiated emissions | Curve per application |
| CS101 | Conducted susceptibility, power leads | 6V, 30Hz–150kHz |
| RS103 | Radiated susceptibility | 10 V/m, 2MHz–18GHz |

---

## Estimated Cost per C-UAS Site

| Component | Qty | Unit Cost | Total |
|-----------|-----|-----------|-------|
| Detection node (defense-grade) | 4 | $25,000 | $100,000 |
| Command post (rack + compute + displays) | 1 | $75,000 | $75,000 |
| RKV-M interceptor drone | 2 | $15,000 | $30,000 |
| Launch pad + recovery system | 1 | $10,000 | $10,000 |
| MANET radios | 6 | $8,000 | $48,000 |
| SATCOM terminal | 1 | $12,000 | $12,000 |
| Power system (generator + UPS) | 1 | $15,000 | $15,000 |
| Cabling, mounting, spares | — | — | $20,000 |
| Net cartridges (initial stock) | 20 | $200 | $4,000 |
| **Total per site** | | | **~$314,000** |

### Recurring Costs (Annual)

| Item | Cost |
|------|------|
| Software license + OTA updates | $24,000 |
| SATCOM data plan | $6,000 |
| LTE data plan (×4 nodes) | $2,400 |
| Net cartridge replacement (estimated 50/yr) | $10,000 |
| Maintenance parts + labor | $15,000 |
| **Annual total** | **~$57,400** |

---

## Deployment Checklist

### Site Survey (Pre-Deployment)

- [ ] 360° line-of-sight confirmed from proposed node positions
- [ ] Power availability assessed (grid, generator, or solar)
- [ ] Communications survey (MANET range test, LTE coverage)
- [ ] Terrain analysis (mounting options, drainage, access roads)
- [ ] Airspace coordination (NOTAM, frequency deconfliction)
- [ ] Legal/regulatory clearance (operating authority)

### Installation (Day-Of)

- [ ] Node mast installation (4 nodes, ~30 min each)
- [ ] Command post setup (transit case, power, comms)
- [ ] MANET mesh network formed and tested
- [ ] Sensor calibration (boresight cameras, acoustic array)
- [ ] RKV-M pre-flight checks and launch pad placement
- [ ] End-to-end test: detect → track → recommend → authorize → launch (dry run)
- [ ] Operator training refresh (2 hours, scenario-based)

### Operational Readiness (Before Live Ops)

- [ ] All nodes reporting to command post
- [ ] Fusion engine producing coherent tracks
- [ ] ROE configured and signed by commanding officer
- [ ] Evidence blockchain connection verified
- [ ] Backup comms (SATCOM) tested
- [ ] Emergency procedures briefed (lost link, friendly aircraft, civilian)

---

## Acceptance Criteria

- [ ] All hardware passes MIL-STD-810G environmental qualification
- [ ] EMI/EMC passes MIL-STD-461G (full compliance, not pre-compliance)
- [ ] Detection range >=5km for Group 1 UAS (radar + EO/IR fused)
- [ ] Track latency <200ms from first detection to track creation
- [ ] RKV-M launches within 30 seconds of operator authorization
- [ ] Net capture success rate >=85% in field trials
- [ ] Human-in-the-loop cannot be bypassed (red team validated)
- [ ] STANAG 4586 adapter receives and displays coalition tracks
- [ ] System operates 7 days continuously without intervention
- [ ] All engagements fully logged and blockchain-anchored

---

## Related Documents

- [RKV-M Tilt-Quad Specifications](../rkv-m-specifications)
- [Capture Net Specifications](../net-specifications)
- [Hardware Foundation (Jetson)](../../hardware-foundation)
- [Investment Phases](../../../executive/early-development/investment-phases)
- [Operations Manual](../../../operations/operations-manual)
