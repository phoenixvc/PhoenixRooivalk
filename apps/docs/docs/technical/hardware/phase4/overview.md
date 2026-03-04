---
id: phase4-hardware-overview
title: "Phase 4 Hardware: Production & Custom PCB"
sidebar_label: Phase 4 Overview
sidebar_position: 1
description:
  Phase 4 hardware strategy — custom PCB design, injection-molded enclosures,
  manufacturing tooling, and certification for volume production.
difficulty: advanced
estimated_reading_time: 10
points: 30
tags:
  - hardware
  - phase-4
  - custom-pcb
  - manufacturing
  - certification
  - production
phase: ["series-b"]
---

# Phase 4 Hardware: Production & Custom PCB

Phase 4 transitions from COTS (commercial off-the-shelf) modules to custom
hardware designed for volume manufacturing. Every module from Phase 3 is
replaced with a purpose-built board that reduces BOM cost, improves reliability,
and passes formal certification.

---

## Design Principles

1. **Design for manufacturing (DFM)** — every board must be pick-and-place
   compatible with <=2 manual assembly steps
2. **Design for test (DFT)** — every board has test points and a JTAG/SWD
   header for automated ICT
3. **Single-board integration** — replace 5+ COTS modules with 1–2 custom PCBs
4. **Certification-ready** — FCC Part 15, CE (RED), CPSC (consumer), and
   MIL-STD pre-compliance from day one
5. **OTA-updatable** — dual-bank firmware with secure boot and rollback

---

## Custom PCB Architecture

### SkyWatch Sensor Board (SSB-1)

A single 4-layer PCB that replaces the Jetson carrier board, sensor interfaces,
power management, and communication modules from Phase 3.

```text
┌─────────────────────────────────────────────────────────────────┐
│                    SkyWatch Sensor Board (SSB-1)                │
│                    120mm × 80mm, 4-layer FR4                    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Jetson Orin  │  │ Power Mgmt   │  │ Comm Module           │ │
│  │ NX SOM       │  │              │  │                       │ │
│  │ (SO-DIMM     │  │ • 12–48V in  │  │ • LoRa (SX1262)      │ │
│  │  connector)  │  │ • 5V/3A rail │  │ • LTE Cat-M1 (BG96)  │ │
│  │              │  │ • 3.3V/2A    │  │ • WiFi (onboard)      │ │
│  │ 1024 CUDA    │  │ • Battery    │  │ • GPS/GNSS (u-blox)   │ │
│  │ 40 TOPS      │  │   charger    │  │ • Antenna connectors  │ │
│  │              │  │ • MPPT solar │  │   (U.FL)              │ │
│  └──────┬───────┘  │ • UPS ckt   │  └───────────────────────┘ │
│         │          └──────────────┘                             │
│  ┌──────┴───────────────────────────────────────────────────┐  │
│  │ Sensor Interfaces                                         │  │
│  │                                                           │  │
│  │ • 2× MIPI CSI-2 (camera + thermal)                       │  │
│  │ • 1× I2S (4-ch acoustic array via TDM)                   │  │
│  │ • 1× USB 3.0 (RF SDR or AI accelerator)                  │  │
│  │ • 4× GPIO (PIR inputs with ESD protection)               │  │
│  │ • 1× I2C (environmental sensors: temp, humidity, pressure)│  │
│  │ • 1× RS-485 (pan/tilt servo bus)                          │  │
│  │ • 1× Ethernet PHY (100/1000 Mbps)                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Test & Debug                                               │  │
│  │ • JTAG/SWD header • UART debug console • LED indicators   │  │
│  │ • Test points on all power rails • ICT pads on bottom     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Jetson via SO-DIMM connector | Allows SOM upgrade without PCB respin |
| Integrated MPPT + UPS | Eliminates 3 separate COTS modules |
| SX1262 LoRa (not SX1276) | Lower power, longer range, +22dBm TX |
| Onboard GPS/GNSS | Required for sensor timestamp sync + geolocation |
| ESD protection on all inputs | Field reliability (lightning, static) |
| 4-layer stackup | Signal integrity for CSI-2 and I2S high-speed traces |

---

## Bill of Materials (Target Production Cost)

### SSB-1 — SkyWatch Sensor Board

| Category | Key Components | Unit Cost (1000 qty) |
|----------|---------------|---------------------|
| PCB fabrication | 4-layer FR4, ENIG finish, 120×80mm | $4–6 |
| Jetson Orin NX 8GB SOM | NVIDIA module | $200–250 |
| Power management ICs | TPS65988 (USB-PD), BQ25798 (charger), TPS62913 (buck) | $8–12 |
| LoRa transceiver | Semtech SX1262 + matching network + U.FL | $5–7 |
| LTE modem | Quectel BG96 + SIM holder | $15–20 |
| GPS/GNSS | u-blox MAX-M10S | $8–10 |
| Ethernet PHY | Realtek RTL8211F | $2–3 |
| Connectors | SO-DIMM, CSI FPC, M.2, barrel jack, SMA/U.FL | $6–10 |
| Passives | Capacitors, resistors, inductors, ferrites | $3–5 |
| ESD/TVS protection | On all external interfaces | $2–3 |
| Assembly (SMT + selective wave) | Pick-and-place + reflow + wave | $8–12 |
| **Total PCB cost (assembled)** | | **$260–340** |
| **Total system (with enclosure, sensors, cables)** | | **$450–600** |

### Cost Comparison: Phase 3 (COTS) vs Phase 4 (Custom)

| Item | Phase 3 (COTS) | Phase 4 (Custom) | Savings |
|------|---------------|-----------------|---------|
| Carrier board | $80–120 | Integrated on SSB-1 | ~$100 |
| Power modules (×3) | $40–60 | Integrated on SSB-1 | ~$50 |
| LoRa module | $25–35 | Integrated SX1262 ($7) | ~$25 |
| LTE breakout | $30–40 | Integrated BG96 ($18) | ~$20 |
| Wiring harness | $15–25 | Reduced (board-level traces) | ~$15 |
| Assembly labor | $30–45/unit | Automated SMT | ~$25 |
| **Total per unit** | **$725–960** | **$450–600** | **~40% reduction** |

---

## Enclosure Design (Production)

### Injection-Molded Housing

| Parameter | Specification |
|-----------|---------------|
| Material | ASA (UV-resistant) or PA66-GF30 (glass-filled nylon) |
| Tooling cost | $15,000–25,000 (amortized over 1000+ units) |
| Unit cost | $8–15 (at 1000 qty) |
| Rating | IP66 (dust-tight, powerful water jets) |
| Features | Integrated antenna cavities, cable gland bosses, DIN-rail clip |
| Color | Matte gray (RAL 7035) — low visual signature |
| Gasket | Silicone O-ring (replaceable) |

### Sensor Dome

| Parameter | Specification |
|-----------|---------------|
| Material | Polycarbonate (optically clear dome + IR-transparent window) |
| Tooling cost | $8,000–12,000 |
| Unit cost | $5–8 |
| Features | Anti-fog coating, hydrophobic treatment, UV stabilizer |

---

## Certification Plan

### Consumer Product (SkySnare)

| Certification | Standard | Status | Est. Cost |
|--------------|----------|--------|-----------|
| FCC Part 15 | Unintentional radiator + LoRa intentional | Required | $8,000–12,000 |
| CE (RED) | EN 300 220 (LoRa), EN 301 489 (EMC) | Required | $10,000–15,000 |
| CPSC | Consumer product safety (net launcher) | Required | $5,000–8,000 |
| UL/ETL | UL 62368-1 (power supply safety) | Recommended | $12,000–18,000 |
| RoHS/REACH | Material compliance | Required | $3,000–5,000 |

### Enterprise Product (AeroNet)

| Certification | Standard | Status | Est. Cost |
|--------------|----------|--------|-----------|
| FCC Part 15 + Part 90 | Same as consumer + industrial comms | Required | $12,000–18,000 |
| MIL-STD-461 (pre-compliance) | EMI/EMC for defense environments | Recommended | $15,000–20,000 |
| MIL-STD-810G (selected tests) | Temp, vibration, rain | Recommended | $20,000–30,000 |
| ITAR/EAR review | Export control classification | Required | $5,000–10,000 |

---

## Manufacturing Process

### PCB Assembly Line

```text
1. PCB Fabrication          → 4-layer boards from JLCPCB / PCBWay
       │
2. Stencil + Solder Paste   → DEK printer, Type 4 solder paste
       │
3. Pick-and-Place (SMT)     → Juki RS-1R or equivalent
       │
4. Reflow Oven              → 8-zone convection, lead-free profile
       │
5. AOI (Automated Optical)  → Inspect solder joints + placement
       │
6. Selective Wave Solder    → Through-hole connectors (SO-DIMM, barrel)
       │
7. ICT (In-Circuit Test)    → Bed-of-nails test all power rails + signals
       │
8. Functional Test          → Flash firmware, boot test, sensor self-check
       │
9. Conformal Coating        → Humiseal 1B31 (acrylic) on bottom side
       │
10. Final Assembly          → Mount in enclosure, connect sensors
       │
11. System Test             → End-to-end detection test with test drone
       │
12. Pack & Ship
```

### Production Targets

| Metric | Target |
|--------|--------|
| Daily output | 20 units/day (single shift, 1 SMT line) |
| First-pass yield | >=95% |
| Mean time to repair | <30 minutes per failed unit |
| Inventory turns | 8× per year |
| Lead time (order to ship) | 4–6 weeks |

---

## Firmware Architecture (Production)

### Secure Boot Chain

```text
ROM Bootloader (Jetson fuses)
    │
    ▼
Signed U-Boot (verified by ROM)
    │
    ▼
Signed Linux kernel + DTB (verified by U-Boot)
    │
    ▼
dm-verity root filesystem (read-only)
    │
    ▼
Application container (skywatch-detector)
    │
    ▼
OTA update daemon (checks hub for updates every 6hr)
```

### OTA Update Strategy

| Feature | Implementation |
|---------|---------------|
| Dual-bank (A/B) | Two root partitions, swap on successful boot |
| Rollback | If boot fails 3×, revert to previous partition |
| Delta updates | Binary diff (mender.io or SWUpdate) |
| Signing | Ed25519 signature on all update artifacts |
| Staging | Hub downloads update, pushes to nodes via LoRa/LTE |

---

## Acceptance Criteria

- [ ] SSB-1 PCB passes DFM review (manufacturer sign-off)
- [ ] First-article units boot and detect correctly
- [ ] BOM cost <=40% lower than Phase 3 COTS equivalent
- [ ] FCC Part 15 pre-compliance test passes
- [ ] ICT fixture covers 100% of power rails and critical signals
- [ ] OTA update completes successfully over LoRa (delta <5MB)
- [ ] Secure boot chain prevents unsigned firmware execution
- [ ] Injection-molded enclosure passes IP66 spray test
- [ ] Production line achieves >=95% first-pass yield in pilot run (50 units)

---

## Upgrade Path to Phase 5

| From (Phase 4) | To (Phase 5) |
|-----------------|--------------|
| Consumer/enterprise enclosure | MIL-STD-810G qualified housing |
| FCC/CE certification | MIL-STD-461 full compliance |
| LoRa + LTE comms | MANET mesh + Link 16 receive |
| Standard Jetson SOM | Ruggedized Jetson (Curtiss-Wright or FORECR) |
| Software-only security | Hardware security module (HSM) + FIPS 140-3 |
| Individual node deployment | Integrated C-UAS site with RKV-M launch capability |
