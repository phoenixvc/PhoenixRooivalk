---
id: phase4-custom-pcb-design
title: "SSB-1 Custom PCB Design Specification"
sidebar_label: Custom PCB Design
sidebar_position: 2
description:
  Detailed design specification for the SkyWatch Sensor Board (SSB-1) custom
  PCB, including schematic blocks, layout constraints, and component selection.
difficulty: advanced
estimated_reading_time: 9
points: 30
tags:
  - hardware
  - phase-4
  - pcb
  - schematic
  - layout
  - electronics
phase: ["series-b"]
---

# SSB-1 Custom PCB Design Specification

The SkyWatch Sensor Board (SSB-1) is the first custom PCB in the Phoenix
Rooivalk hardware stack. It integrates compute, power, communications, and
sensor interfaces onto a single 120×80mm board.

---

## Board Overview

| Parameter | Specification |
|-----------|---------------|
| Dimensions | 120 × 80mm (±0.1mm) |
| Layer count | 4 (Signal-Ground-Power-Signal) |
| Material | FR4, Tg 170°C, 1.6mm thickness |
| Copper weight | 1 oz outer, 1 oz inner |
| Surface finish | ENIG (Electroless Nickel Immersion Gold) |
| Minimum trace/space | 0.15mm / 0.15mm (6/6 mil) |
| Minimum via | 0.3mm drill, 0.6mm pad |
| Impedance control | 50Ω single-ended, 100Ω differential (CSI-2, USB) |

---

## Schematic Block Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                         SSB-1 Block Diagram                     │
│                                                                 │
│  ┌────────────────┐     ┌────────────────┐                      │
│  │ Input Power    │     │ Power Rails    │                      │
│  │ 12–48V DC      │────▶│ 5V/3A (Jetson) │                     │
│  │ or PoE (802.3at)│    │ 3.3V/2A (I/O)  │                     │
│  │ or Solar+Batt  │    │ 1.8V/0.5A (DDR)│                     │
│  └────────────────┘     │ 12V pass-thru  │                     │
│                          └───────┬────────┘                     │
│                                  │                              │
│  ┌───────────────────────────────┼───────────────────────────┐  │
│  │              Jetson Orin NX SOM (SO-DIMM)                 │  │
│  │  • 1024 CUDA cores           │                            │  │
│  │  • 40 TOPS AI                │                            │  │
│  │  • 8GB LPDDR5                │                            │  │
│  │  • GbE MAC, USB 3.2, PCIe, CSI-2, I2C, SPI, UART        │  │
│  └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┘  │
│     │      │      │      │      │      │      │      │          │
│  ┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼───┐   │
│  │CSI-2││CSI-2││USB  ││I2S  ││GPIO ││I2C  ││RS485││RGMII │   │
│  │Cam 1││Cam 2││3.0  ││Audio││(PIR)││Env  ││Servo││Ether │   │
│  └─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└──────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Communication Subsystem                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│   │
│  │  │ SX1262   │  │ BG96     │  │ MAX-M10S │  │ WiFi/BT  ││   │
│  │  │ LoRa     │  │ LTE      │  │ GNSS     │  │ (Jetson) ││   │
│  │  │ (SPI)    │  │ (USB)    │  │ (UART)   │  │ (onboard)││   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘│   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Power Subsystem

### Input Stage

| Parameter | Specification |
|-----------|---------------|
| Input voltage | 12–48V DC (wide range for PoE + solar) |
| PoE support | IEEE 802.3at (25.5W) via integrated PD controller |
| Reverse polarity protection | P-channel MOSFET (DMG4407SSS) |
| TVS protection | SMBJ48A (48V clamping) |
| Input capacitance | 2× 100µF polymer + 10µF ceramic |

### Voltage Regulators

| Rail | Regulator | Output | Max Current | Purpose |
|------|-----------|--------|-------------|---------|
| 5V | TPS62913 (sync buck) | 5.0V ±2% | 3A | Jetson SOM, USB devices |
| 3.3V | TPS62840 (ultra-low Iq) | 3.3V ±1% | 2A | Sensors, LoRa, GNSS |
| 1.8V | TLV75518 (LDO) | 1.8V | 500mA | DDR reference, analog |
| 12V | Pass-through (fused) | 12V | 2A | IR illuminators, fan |

### Battery Management (Solar Mode)

| Parameter | Specification |
|-----------|---------------|
| Charger IC | BQ25798 (buck-boost, I2C programmable) |
| Battery chemistry | LiFePO4 (4S, 12.8V nominal) |
| Charge current | Programmable, max 3A |
| Fuel gauge | BQ34Z100-G1 (Impedance Track) |
| MPPT | Integrated in BQ25798 |
| Protection | Overcurrent, overvoltage, under-temperature cutoff |

---

## Communication Subsystem

### LoRa (SX1262)

| Parameter | Specification |
|-----------|---------------|
| IC | Semtech SX1262 |
| Interface | SPI (up to 16 MHz) |
| Frequency | 868/915 MHz (regionalized at firmware level) |
| TX power | +22 dBm (configurable) |
| Sensitivity | -148 dBm (SF12, 125kHz BW) |
| Antenna | U.FL connector → external SMA via pigtail |
| Matching network | Pi-network, tuned per frequency band |
| Crystal | TCXO ±1 ppm (required for LoRa) |

### LTE Cat-M1 (BG96)

| Parameter | Specification |
|-----------|---------------|
| Module | Quectel BG96 |
| Interface | USB 2.0 (via hub) |
| SIM | Nano-SIM push-push holder |
| Antenna | 2× U.FL (main + diversity) |
| GNSS | Integrated (shared with u-blox for redundancy) |
| Power control | GPIO enable + VBAT switch (cuts power when unused) |

### GNSS (u-blox MAX-M10S)

| Parameter | Specification |
|-----------|---------------|
| Interface | UART (115200 baud) |
| Constellations | GPS + Galileo + GLONASS + BeiDou |
| PPS output | 1 Hz, routed to Jetson GPIO for time sync |
| Antenna | Active patch antenna via U.FL |
| Accuracy | 2.5m CEP (open sky) |

---

## Sensor Interfaces

### MIPI CSI-2 (×2)

| Parameter | Specification |
|-----------|---------------|
| Lanes | 2 lanes per port (up to 4K@30fps) |
| Connector | 15-pin FPC (0.5mm pitch), same as Pi Camera |
| ESD | TVS array on all data lanes |
| Impedance | 100Ω differential (matched traces) |
| Trace length | Matched to ±0.5mm between lanes |

### I2S Audio (4-Channel)

| Parameter | Specification |
|-----------|---------------|
| Protocol | I2S TDM (4 channels on single bus) |
| Sample rate | 48 kHz |
| Bit depth | 24-bit |
| Connector | JST-SH 6-pin (SCK, WS, SD, MCK, 3V3, GND) |

### GPIO (PIR Inputs)

| Parameter | Specification |
|-----------|---------------|
| Channels | 4 isolated inputs |
| Protection | ESD clamp + 10kΩ series resistor per input |
| Connector | JST-XH 8-pin (4× signal + 4× ground) |
| Logic | 3.3V, active-high |

### RS-485 (Servo Bus)

| Parameter | Specification |
|-----------|---------------|
| Transceiver | MAX485 or SN65HVD72 |
| Protocol | Dynamixel (half-duplex) |
| Connector | JST-XH 4-pin (A, B, VCC, GND) |
| Termination | 120Ω jumper-selectable |

---

## Layout Guidelines

### Layer Stackup

```text
Layer 1 (Top)    — Signal + components
Layer 2 (Inner1) — Ground plane (unbroken)
Layer 3 (Inner2) — Power planes (split: 5V, 3.3V, 1.8V)
Layer 4 (Bottom) — Signal + test points
```

### Critical Routing Rules

| Signal | Rule |
|--------|------|
| CSI-2 differential pairs | 100Ω impedance, ±0.5mm length match, 3W spacing |
| USB 3.0 differential | 90Ω impedance, ±0.1mm length match |
| SX1262 RF trace | 50Ω microstrip, keep-out zone 3× trace width |
| RGMII (Ethernet) | 50Ω, length-matched within 5mm |
| Power traces | >=0.5mm for 1A, >=1mm for 3A |
| Decoupling caps | <2mm from IC power pins |
| Ground vias | Stitch around RF section every 2mm |

### Thermal Management

| Heat Source | Dissipation | Mitigation |
|------------|-------------|------------|
| Jetson SOM | 10–15W | Thermal pad to enclosure lid (aluminum heat spreader) |
| 5V regulator | 1–2W | Exposed pad + thermal vias to ground plane |
| BG96 modem | 0.5–1W | Ground plane copper pour |
| SX1262 | <0.2W | None required |

---

## Test Points

Every production board includes labeled test points for ICT and debug:

| Test Point | Signal | Purpose |
|-----------|--------|---------|
| TP1 | VIN (raw input) | Verify input voltage |
| TP2 | 5V rail | Verify main regulator |
| TP3 | 3.3V rail | Verify I/O regulator |
| TP4 | 1.8V rail | Verify DDR reference |
| TP5 | Battery voltage | Verify charger output |
| TP6 | LoRa SPI CLK | Verify SPI communication |
| TP7 | UART TX (debug) | Console output |
| TP8 | GNSS PPS | Verify timing pulse |
| TP9-12 | PIR inputs (×4) | Verify GPIO levels |
| TP13 | GND | Reference ground |

---

## Design Review Checklist

Before sending to fabrication:

- [ ] Schematic review (2 engineers, independent)
- [ ] BOM review (all parts in stock or long-lead ordered)
- [ ] DRC clean (no errors, warnings reviewed)
- [ ] Impedance simulation (CSI-2, USB, RGMII, RF)
- [ ] Thermal simulation (Jetson worst-case @ 15W)
- [ ] Power budget verified (all rails under max current)
- [ ] ESD/TVS protection on all external connectors
- [ ] Conformal coating mask defined (keep off connectors, test points)
- [ ] Assembly drawing + pick-and-place file reviewed
- [ ] ICT fixture specification sent to test house

---

## Prototype Schedule

| Milestone | Timeline | Deliverable |
|-----------|----------|-------------|
| Schematic complete | Week 0 | Reviewed + signed off |
| Layout complete | Week 3 | DRC clean, impedance simulated |
| PCB ordered | Week 4 | 10 bare boards (JLCPCB express) |
| Assembly (prototype) | Week 6 | 5 assembled boards (hand-soldered passives + SMT) |
| Bring-up | Week 7–8 | Power rails verified, Jetson boots |
| Functional test | Week 9–10 | All sensors operational |
| EVT (Engineering Validation) | Week 12 | 20 units, full test suite |
| DVT (Design Validation) | Week 18 | 50 units, certification pre-test |
| PVT (Production Validation) | Week 24 | 100 units, line trial |
