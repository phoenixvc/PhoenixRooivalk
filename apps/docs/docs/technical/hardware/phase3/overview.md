---
id: phase3-hardware-overview
title: "Phase 3 Hardware: Field-Ready Ruggedized Systems"
sidebar_label: Phase 3 Overview
sidebar_position: 1
description:
  Phase 3 hardware strategy — weatherproof enclosures, multi-sensor pods,
  long-range communications, and outdoor-survivable power systems.
difficulty: intermediate
estimated_reading_time: 10
points: 25
tags:
  - hardware
  - phase-3
  - ruggedization
  - multi-sensor
  - lora
  - field-deployment
phase: ["series-a"]
---

# Phase 3 Hardware: Field-Ready Ruggedized Systems

Phase 3 takes the validated Phase 2 ML system and packages it for unattended
outdoor operation. The goal is **30+ day survivability** in real-world
conditions — rain, dust, temperature swings, unreliable power, and intermittent
connectivity.

---

## Design Principles

1. **Survive first, detect second** — if the hardware dies in the rain, the ML
   model doesn't matter
2. **Multi-sensor fusion** — combine camera + PIR + acoustic + RF for layered
   detection with reduced false positives
3. **Long-range, low-power comms** — LoRa (2–5km) as primary, LTE Cat-M1 as
   failover, WiFi as local debug
4. **Power autonomy** — PoE for fixed installs, solar + LiFePO4 for off-grid
5. **Maintainable in the field** — quick-swap modules, tool-free access,
   indicator LEDs visible from 10m

---

## System Architecture

```text
                    ┌─────────────────────────────────────────┐
                    │          SkyWatch Field Node             │
                    │          (IP65 Enclosure)                │
                    │                                          │
  PoE / Solar ──▶  │  ┌──────────┐  ┌────────────────────┐   │
                    │  │ Power    │  │ Compute Module     │   │
                    │  │ Manager  │  │ (Jetson Orin NX    │   │
                    │  │ (MPPT +  │──│  or Pi 5 + Hailo)  │   │
                    │  │  UPS)    │  │                    │   │
                    │  └──────────┘  └─────┬──────────────┘   │
                    │                      │                   │
                    │    ┌─────────────────┼─────────────┐    │
                    │    │                 │             │    │
                    │  ┌─▼──┐  ┌──────┐  ┌▼────┐ ┌─────▼┐  │
                    │  │ EO │  │ PIR  │  │Acou-│ │ RF   │  │
                    │  │ IR │  │Array │  │stic │ │Detect│  │
                    │  │Cam │  │(×4)  │  │Array│ │(SDR) │  │
                    │  └────┘  └──────┘  └─────┘ └──────┘  │
                    │                                       │
                    │  ┌──────────────────────────────────┐ │
                    │  │ Comms Module                     │ │
                    │  │ LoRa (primary) + LTE (failover)  │ │
                    │  │ + WiFi (local debug)              │ │
                    │  └──────────────────────────────────┘ │
                    └───────────────────────────────────────┘
```

---

## Sensor Pod Specifications

### EO/IR Camera Module

| Parameter | Specification |
|-----------|---------------|
| Sensor | Sony IMX462 (Starvis II) or IMX477 |
| Resolution | 2MP (1920×1080) for inference, 12MP for stills |
| Lens | Motorized zoom 2.8–12mm, auto-iris |
| Night vision | IR-cut filter + 850nm IR illuminators (30m range) |
| Thermal (optional) | FLIR Lepton 3.5 (160×120) or Seek Thermal |
| Interface | MIPI CSI-2 (primary) or USB 3.0 (thermal) |
| Mount | IP67 dome housing, IK10 vandal-resistant |

### PIR Array (Quad-Zone)

| Parameter | Specification |
|-----------|---------------|
| Modules | 4× HC-SR501 (or Panasonic EKMB) |
| Coverage | 4× 120° = 360° azimuth |
| Range | 7–12m per module |
| Purpose | Low-power wake trigger, reduces camera duty cycle |
| Interface | GPIO (interrupt-driven) |
| Power | <1mW total (always-on) |

### Acoustic Array

| Parameter | Specification |
|-----------|---------------|
| Microphones | 4× MEMS (INMP441 or ICS-43434) |
| Configuration | Tetrahedral array for 3D direction-of-arrival |
| Sample rate | 48 kHz per channel |
| Detection range | 100–150m for Group 1 UAS prop noise |
| Interface | I2S to compute module |
| Processing | FFT + mel-spectrogram → CNN classifier |

### RF Detection Module

| Parameter | Specification |
|-----------|---------------|
| Hardware | RTL-SDR v3 or HackRF One |
| Frequency range | 400 MHz – 2.4 GHz (covers common drone bands) |
| Detection method | Protocol fingerprinting (WiFi, FrSky, ELRS, DJI OcuSync) |
| Range | 500m–2km depending on target transmit power |
| Interface | USB 3.0 |
| Legal note | Passive receive only — no transmission |

---

## Enclosure Design

### Main Enclosure

| Parameter | Specification |
|-----------|---------------|
| Material | Fiberglass-reinforced polyester (FRP) or ASA |
| Rating | IP65 (dust-tight, water jet protected) |
| Dimensions | 400 × 300 × 200mm (external) |
| Mounting | Pole-mount (50–100mm diameter) with stainless band clamps |
| Access | Hinged lid with captive screws, silicone gasket |
| Ventilation | IP65 breather vent + internal fan (thermostat-controlled) |
| Cable entry | 4× M16 cable glands (bottom-facing) |
| Temp range | -20°C to +60°C (with internal heater option for arctic) |

### Sensor Turret (Optional)

For deployments requiring pan/tilt:

| Parameter | Specification |
|-----------|---------------|
| Type | Enclosed pan/tilt unit (IP66) |
| Pan range | 360° continuous |
| Tilt range | -30° to +90° |
| Servos | Dynamixel XM430 (closed-loop, brushless) |
| Payload | Up to 1kg (camera + thermal) |
| Interface | RS-485 (Dynamixel protocol) |

---

## Communications

### LoRa (Primary Long-Range)

| Parameter | Specification |
|-----------|---------------|
| Module | Semtech SX1276 (LoRa) or RAK4631 (LoRa + BLE) |
| Frequency | 868 MHz (EU) / 915 MHz (US) |
| Range | 2–5 km (line of sight), 500m–1km (urban) |
| Data rate | 0.3–11 kbps (sufficient for detection events) |
| Topology | Star (nodes → hub) or mesh (LoRa mesh firmware) |
| Payload | JSON-encoded detection events (compressed) |
| Encryption | AES-128 |

### LTE Cat-M1 (Failover)

| Parameter | Specification |
|-----------|---------------|
| Module | Quectel BG96 or SIMCom SIM7080G |
| Bands | Multi-band Cat-M1 + NB-IoT |
| Data rate | Up to 375 kbps (downlink) |
| SIM | Standard nano-SIM, IoT data plan |
| Purpose | Failover when LoRa hub is unreachable |
| Power | Sleep mode <10µA, active ~150mA |

### WiFi (Local Debug)

| Parameter | Specification |
|-----------|---------------|
| Interface | Onboard Pi/Jetson WiFi (2.4/5 GHz) |
| Purpose | Local configuration, firmware updates, debugging |
| Range | ~30m (sufficient for maintenance proximity) |
| Security | WPA3, disabled in production mode |

---

## Power Systems

### Option A: Power over Ethernet (Fixed Installs)

| Parameter | Specification |
|-----------|---------------|
| Standard | IEEE 802.3af (15.4W) or 802.3at (25.5W) |
| PoE HAT | Waveshare PoE HAT (Pi) or PoE splitter (Jetson) |
| Cable | Outdoor-rated Cat6 with UV jacket, up to 100m |
| Advantage | Single cable for power + data |
| UPS | Inline PoE UPS (30-minute buffer) |

### Option B: Solar + Battery (Off-Grid)

| Parameter | Specification |
|-----------|---------------|
| Panel | 50W monocrystalline, MC4 connectors |
| Battery | 12V 20Ah LiFePO4 (LFP) |
| Charge controller | Victron SmartSolar MPPT 75/10 |
| Runtime (no sun) | ~24–36 hours (depending on compute load) |
| Runtime (with sun) | Indefinite (50W panel > 15W average draw) |
| Monitoring | Victron VE.Direct → compute module (battery SoC telemetry) |

---

## Phase 3 Product Set

| # | Product | Sensors | Compute | Comms | Power |
|---|---------|---------|---------|-------|-------|
| 1 | SkyWatch Field Node | EO/IR + PIR(×4) + Acoustic | Jetson Orin NX 8GB | LoRa + LTE | PoE or Solar |
| 2 | SkyWatch Sentry | EO/IR + PIR(×4) + RF | Pi 5 + Hailo-8 | LoRa | PoE |
| 3 | Turret Field Unit | EO/IR + Thermal (pan/tilt) | Jetson Orin NX 16GB | LoRa + LTE | PoE |
| 4 | Trigger Node Field | Relay (upgraded) | Pi Zero 2W | LoRa | PoE |
| 5 | SkyWatch Hub v2 | None (coordinator only) | Jetson AGX Orin 32GB | Ethernet + LTE | Mains + UPS |

---

## Estimated Cost per Node (SkyWatch Field Node)

| Category | Items | Est. Cost |
|----------|-------|-----------|
| Compute | Jetson Orin NX 8GB + carrier board | $400–500 |
| Camera | IMX477 + motorized zoom + IR illuminators | $80–120 |
| Thermal (optional) | FLIR Lepton 3.5 breakout | $200–250 |
| PIR array | 4× HC-SR501 + mounting bracket | $8–12 |
| Acoustic array | 4× INMP441 + I2S mux board | $20–30 |
| RF detection | RTL-SDR v3 dongle | $25–30 |
| Enclosure | IP65 FRP box + cable glands + vent | $60–80 |
| LoRa radio | RAK4631 + antenna | $25–35 |
| LTE modem | Quectel BG96 breakout | $30–40 |
| Power (PoE) | PoE splitter + inline UPS | $40–60 |
| Power (Solar) | 50W panel + 20Ah LFP + MPPT | $150–200 |
| Mounting | Pole clamps + bracket + hardware | $20–30 |
| Wiring | JST-XH connectors, harness, heatshrink | $15–25 |
| **Total (PoE)** | | **~$725–960** |
| **Total (Solar)** | | **~$835–1,110** |

---

## Environmental Testing

Before field deployment, each unit must pass:

| Test | Standard | Criteria |
|------|----------|----------|
| Water ingress | IP65 spray test | No water inside enclosure after 30min |
| Temperature cycling | -20°C to +60°C | Boot and detect at extremes |
| Vibration | Pole-mount shake test | No connector disconnections after 1hr |
| UV exposure | 500hr accelerated UV | No enclosure degradation |
| Power failure | Hard power cut | Clean recovery, no data corruption |
| Network loss | 24hr LoRa disconnect | Queues events, syncs on reconnect |

---

## Acceptance Criteria

- [ ] Node survives 30 days outdoors without intervention
- [ ] Detection performance matches Phase 2 (>=90% mAP)
- [ ] LoRa range >=2km line-of-sight to hub
- [ ] LTE failover activates within 30 seconds of LoRa loss
- [ ] Solar system maintains 24/7 operation in >=4 hours of sun
- [ ] All sensor data fused into single detection event pipeline
- [ ] Acoustic array provides direction-of-arrival within ±15°
- [ ] RF detection identifies DJI protocol at >=500m range
- [ ] Quick-swap module replacement in <10 minutes

---

## Upgrade Path to Phase 4

| From (Phase 3) | To (Phase 4) |
|-----------------|--------------|
| COTS modules + carrier boards | Custom PCB with integrated interfaces |
| FRP enclosure | Injection-molded ASA with integrated antenna cavities |
| JST-XH connectors | MIL-spec circular connectors |
| Consumer Jetson carrier | Custom carrier board (reduced BOM, form factor) |
| Individual sensor cables | Single sensor pod harness with quick-disconnect |
| Manual firmware updates | OTA firmware with A/B partition rollback |
