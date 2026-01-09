# Drone Countermeasure Options

This document covers countermeasure options that can be triggered by the Pi Drone Detector's GPIO output system.

## Overview

The detector provides a 100ms GPIO pulse when engagement conditions are met. This pulse can trigger various countermeasure systems. This document covers the full range of options from budget DIY builds to commercial systems.

---

## Product Tiers

### Tier Comparison

| Tier | Name | Total Cost | Detection Range | Launch Range | Best For |
|------|------|------------|-----------------|--------------|----------|
| **Detection Only** | SkyWatch Nano | $50-100 | 30-50m | None | Hobbyists, awareness |
| **Detection Only** | SkyWatch | $100-250 | 50-150m | None | Home/property monitoring |
| **Detection Only** | SkyWatch Pro | $250-600 | 150-500m | None | Farms, estates, events |
| **Detection + Counter** | NetSentry Lite | $150-400 | 50-100m | 10-25m | Hobbyists, testing |
| **Detection + Counter** | NetSentry | $400-800 | 100-200m | 15-40m | Property protection |
| **Detection + Counter** | NetSentry Pro | $800-2,000 | 200-500m | 25-50m | Security professionals |
| **Commercial** | SkyWall 100 | $30,000-70,000 | 500m+ | 100m+ | Military, law enforcement |
| **Commercial** | Fortem DroneHunter | $50,000+ | 3km+ | 1km+ | Critical infrastructure |

---

## Detection-Only Systems (SkyWatch Line)

For users who want **awareness without countermeasures** - legally simpler, lower cost, and often sufficient for most use cases.

### Why Detection-Only?

- **Legal simplicity**: No permits required for passive detection
- **Lower cost**: No launcher hardware needed
- **Lower risk**: No projectiles, no liability concerns
- **Sufficient for most**: Alert + record is enough for evidence/awareness
- **Upgrade path**: Add countermeasures later if needed

### SkyWatch Nano - $50-100

**Target users:** Hobbyists, backyard awareness, learning

**Components:**
| Item | Cost | Source |
|------|------|--------|
| Raspberry Pi Zero 2 W | $15 | Pi supplier |
| Pi Camera Module v2 | $25 | Pi supplier |
| MicroSD card (32GB) | $8 | Amazon |
| USB power supply | $10 | Amazon |
| 3D printed case | $5 | DIY/Etsy |
| **Total** | **$63** | |

**Detection Methods:**
- Visual (camera): 30-50m range
- Alert: Local buzzer, webhook, email

**Specifications:**
- Detection range: 30-50m (daylight)
- Processing: 5-10 FPS on Pi Zero 2
- Power: 5W continuous
- Alerts: Webhook, GPIO buzzer, email

**Limitations:**
- Daylight only (no IR)
- Short range
- Slower processing
- No tracking/recording

---

### SkyWatch Standard - $100-250

**Target users:** Homeowners, small property monitoring

**Components:**
| Item | Cost | Source |
|------|------|--------|
| Raspberry Pi 4 (2GB) | $45 | Pi supplier |
| Pi Camera Module v3 | $35 | Pi supplier |
| Coral USB Accelerator | $60 | Coral.ai |
| PoE HAT (optional) | $20 | Pi supplier |
| Weatherproof enclosure | $25 | Amazon |
| MicroSD card (64GB) | $12 | Amazon |
| **Total** | **$197** | |

**Detection Methods:**
- Visual (camera): 50-150m range
- Audio (optional): Detect drone motor sounds
- Alert: Multi-channel (webhook, SMS, siren, lights)

**Specifications:**
- Detection range: 50-150m
- Processing: 15-30 FPS with Coral
- Night mode: Low-light capable (v3 camera)
- Recording: Local storage with motion clips
- Alerts: Webhook, Telegram, email, GPIO (siren/lights)

**Alert Options:**
```yaml
alert:
  webhook_url: "https://your-server.com/drone-alert"
  telegram_bot_token: "your-bot-token"
  telegram_chat_id: "your-chat-id"
  gpio_siren_pin: 18          # 12V siren via relay
  gpio_light_pin: 23          # Warning light
  save_detections_path: "/var/log/detections/"
  record_clips: true
  clip_duration_seconds: 30
```

---

### SkyWatch Pro - $250-600

**Target users:** Farms, estates, event venues, commercial property

**Components:**
| Item | Cost | Source |
|------|------|--------|
| Raspberry Pi 5 (4GB) | $60 | Pi supplier |
| Pi Camera HQ + 16mm lens | $100 | Pi supplier |
| Coral M.2 Accelerator | $35 | Coral.ai |
| M.2 HAT for Pi 5 | $15 | Pi supplier |
| RTL-SDR dongle (RF detect) | $30 | Amazon |
| USB microphone (audio) | $20 | Amazon |
| PoE+ HAT | $25 | Pi supplier |
| Weatherproof enclosure | $40 | Amazon |
| Pan-tilt mount | $100 | Servo supplier |
| **Total** | **$425** | |

**Detection Methods:**
| Method | Range | Conditions | Hardware |
|--------|-------|------------|----------|
| Visual (telephoto) | 150-500m | Daylight | HQ Camera + 16mm lens |
| Visual (wide) | 50-100m | Day/low-light | Camera Module v3 |
| RF detection | 500m-2km | Any | RTL-SDR + antenna |
| Audio signature | 50-200m | Low noise | USB microphone |

**Multi-Sensor Fusion:**
```
┌─────────────────────────────────────────────────────────────┐
│                    SkyWatch Pro                              │
│                                                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐  │
│   │ Camera   │   │ RF/SDR   │   │ Audio    │   │ Optional│  │
│   │ (Visual) │   │ Scanner  │   │ Analysis │   │ Radar   │  │
│   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬────┘  │
│        │              │              │              │        │
│        └──────────────┴──────────────┴──────────────┘        │
│                           │                                  │
│                    ┌──────┴──────┐                          │
│                    │   Fusion    │                          │
│                    │   Engine    │                          │
│                    └──────┬──────┘                          │
│                           │                                  │
│              ┌────────────┼────────────┐                    │
│              ▼            ▼            ▼                    │
│         ┌────────┐  ┌──────────┐  ┌─────────┐              │
│         │ Alert  │  │ Record   │  │ Track   │              │
│         │ System │  │ & Store  │  │ & Log   │              │
│         └────────┘  └──────────┘  └─────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Detection range: 150-500m (visual), 500m-2km (RF)
- Processing: 30+ FPS with Coral M.2
- Auto-tracking: Pan-tilt follows detected drone
- Recording: Continuous or motion-triggered
- Multi-sensor: Fuses visual + RF + audio for confidence

---

### Detection Method Comparison

| Method | Range | Day/Night | Weather | Cost | False Positives |
|--------|-------|-----------|---------|------|-----------------|
| **Visual (camera)** | 50-500m | Day (night w/IR) | Rain affects | $25-100 | Low with ML |
| **RF scanning** | 500m-2km | Both | Unaffected | $30-100 | Medium (WiFi, etc.) |
| **Audio signature** | 50-200m | Both | Wind affects | $20-50 | Medium |
| **Radar (doppler)** | 100m-1km | Both | Mostly unaffected | $200-500 | Low |
| **ADS-B receiver** | 50km+ | Both | Unaffected | $30 | Very low (compliant only) |

### RF Detection Details (RTL-SDR)

Many consumer drones operate on known frequencies:

| Drone Type | Control Freq | Video Freq | Protocol |
|------------|--------------|------------|----------|
| DJI (most) | 2.4 GHz | 5.8 GHz | OcuSync/Lightbridge |
| FPV racing | 2.4 GHz | 5.8 GHz | Various |
| Cheap toys | 2.4 GHz | None | Simple RC |
| Commercial | 900 MHz / 2.4 GHz | 5.8 GHz | Various |

**RTL-SDR Setup:**
```bash
# Install RTL-SDR tools
sudo apt install rtl-sdr librtlsdr-dev

# Scan for drone frequencies
rtl_power -f 2400M:2500M:1M -g 50 -i 1 scan.csv

# Or use dedicated drone detector software
# (integrates with SkyWatch detection pipeline)
```

### Audio Signature Detection

Drone motors have distinctive acoustic signatures:

| Drone Size | Frequency Range | Characteristics |
|------------|-----------------|-----------------|
| Mini (<250g) | 8-12 kHz | High-pitched whine |
| Medium (1-2kg) | 4-8 kHz | Mid-range buzz |
| Large (>2kg) | 2-4 kHz | Lower rumble, more bass |

**Audio Detection Pipeline:**
```
Microphone → FFT → Frequency Analysis → ML Classifier → Alert
                         ↓
              Match against known drone signatures
```

---

### Alert Integration Options

| Alert Type | Latency | Cost | Best For |
|------------|---------|------|----------|
| **Local buzzer** | <100ms | $2 | Immediate awareness |
| **GPIO relay → siren** | <100ms | $20 | Outdoor warning |
| **Webhook** | 200-500ms | $0 | Home automation, logging |
| **Telegram bot** | 500ms-2s | $0 | Mobile notification |
| **SMS (via Twilio)** | 1-3s | $0.01/msg | Reliable mobile |
| **Email** | 5-30s | $0 | Non-urgent, records |
| **Smart home (MQTT)** | <200ms | $0 | Home Assistant, etc. |
| **Strobe light** | <100ms | $30 | Visual deterrent |

**Example Alert Configuration:**
```yaml
# Multi-channel alert setup
alert:
  # Immediate local alert
  gpio_siren_pin: 18
  gpio_strobe_pin: 23

  # Push notification
  telegram_enabled: true
  telegram_bot_token: "123456:ABC..."
  telegram_chat_id: "-100123456789"

  # Webhook for logging/automation
  webhook_url: "http://homeassistant.local:8123/api/webhook/drone-detected"

  # Record evidence
  save_detections_path: "/media/usb/drone_detections/"
  record_clips: true
  clip_pre_buffer_seconds: 5
  clip_post_buffer_seconds: 30

  # Throttling
  cooldown_per_track: 60  # Don't re-alert same drone for 60s
  global_cooldown: 5      # Min 5s between any alerts
```

### Detection Range Factors

Detection range depends on:
- **Camera sensor**: Pi Camera v2 (50-100m) vs HQ Camera (100-200m) vs telephoto lens (200-500m)
- **Target size**: Mini drones (~15cm) detected at shorter range than large drones (~50cm)
- **Lighting conditions**: Daylight optimal, low-light reduces range by 30-50%
- **Model accuracy**: Trained models improve detection at longer ranges
- **Hardware acceleration**: Coral TPU enables higher resolution processing

### NetSentry Lite (Budget Entry Point) - $150-400

**Target users:** Makers, hobbyists, proof-of-concept testing

**Components:**
| Item | Cost | Source |
|------|------|--------|
| Raspberry Pi 4 (2GB) | $45 | Pi supplier |
| Pi Camera Module v2 | $25 | Pi supplier |
| TFLite model (provided) | $0 | This project |
| Spring launcher (DIY) | $30-50 | Hardware store |
| Burn wire release | $10 | Amazon |
| Net (1.5m weighted) | $20-40 | Fishing supply |
| 12V relay module | $5 | Amazon |
| 12V power supply | $15 | Amazon |
| PVC pipe housing | $20 | Hardware store |
| **Total** | **$170-210** | |

**Specifications:**
- Detection range: 50-100m (camera dependent)
- Net launch range: 5-15m
- Response time: 200-500ms (burn wire)
- Reloads: Manual (re-cock spring, replace cord)

**Limitations:**
- Short range, slow response
- Basic accuracy (no tracking optics)
- Single shot per reload

---

### NetSentry Standard - $400-800

**Target users:** Property owners, farmers, small businesses

**Components:**
| Item | Cost | Source |
|------|------|--------|
| Raspberry Pi 4 (4GB) | $55 | Pi supplier |
| Pi Camera HQ + lens | $75 | Pi supplier |
| Coral USB Accelerator | $60 | Coral.ai |
| TFLite model (provided) | $0 | This project |
| CO2 launcher system | $150-250 | See build guide |
| Net (2m weighted) | $40-60 | Fishing/safety supply |
| Relay module + wiring | $20 | Amazon |
| Weatherproof enclosure | $50-80 | Amazon |
| Mounting hardware | $30 | Hardware store |
| **Total** | **$480-650** | |

**Specifications:**
- Detection range: 100-200m
- Net launch range: 15-30m
- Response time: 50ms
- Reloads: Replace CO2 cartridge ($1-2/shot)

---

### NetSentry Pro - $800-2,000

**Target users:** Security professionals, critical sites

**Components:**
| Item | Cost | Source |
|------|------|--------|
| Raspberry Pi 5 (8GB) | $80 | Pi supplier |
| Global Shutter Camera | $50 | Pi supplier |
| Telephoto lens (6-12mm) | $100 | Camera supplier |
| Coral TPU (M.2 or USB) | $60-100 | Coral.ai |
| Pneumatic launcher | $300-500 | Custom build |
| Air tank + regulator | $150-200 | Paintball supplier |
| Net system (3m, auto-deploy) | $100-150 | Custom |
| Pan-tilt mount | $100-200 | Servo supplier |
| Weatherproof enclosure | $100 | Industrial |
| UPS battery backup | $80 | Amazon |
| **Total** | **$1,120-1,460** | |

**Specifications:**
- Detection range: 200-500m
- Net launch range: 25-50m
- Response time: 50ms
- Reloads: Refill air tank (free)
- Auto-tracking: Optional pan-tilt

---

## Commercial Systems

### SkyWall (OpenWorks Engineering, UK)

**Products:**
| Model | Type | Range | Price (Est.) |
|-------|------|-------|--------------|
| SkyWall 100 | Shoulder-launched | 100m | $30,000-50,000 |
| SkyWall Patrol | Handheld | 100m | $40,000-60,000 |
| SkyWall 300 | Autonomous turret | 150m+ | $100,000+ |

**Features:**
- Compressed gas launcher (reusable)
- SmartScope targeting with drone detection
- Parachute-deployed net (controlled descent)
- Cartridge cost: ~$500-1,000 each

**Best for:** Law enforcement, event security, VIP protection

**Website:** [openworksengineering.com](https://openworksengineering.com)

---

### Fortem Technologies (USA)

**Products:**
| Model | Type | Range | Price (Est.) |
|-------|------|-------|--------------|
| DroneHunter F700 | Interceptor drone | 1km+ | $50,000-100,000 |
| SkyDome System | Integrated C-UAS | 3km+ | $500,000+ |

**Features:**
- Autonomous drone-on-drone intercept
- AI-powered tracking (TrueView radar)
- Can defeat drone swarms
- Only system authorized for US airspace intercepts

**Best for:** Military, airports, critical infrastructure

**Website:** [fortemtech.com](https://fortemtech.com)

---

### DroneShield (Australia)

**Products:**
| Model | Type | Range | Price (Est.) |
|-------|------|-------|--------------|
| DroneGun Tactical | RF jammer (handheld) | 2km | $30,000-50,000 |
| DroneGun MkIII | RF jammer (rifle) | 1km | $20,000-35,000 |
| DroneSentry | Fixed detection | 5km | $100,000+ |

**Features:**
- RF/GPS jamming (not physical capture)
- Forces drone to land or return home
- Detection + defeat integrated

**Note:** RF jamming is **illegal for civilians** in most jurisdictions.

**Website:** [droneshield.com](https://droneshield.com)

---

### Other Commercial Options

| Company | Product | Type | Region |
|---------|---------|------|--------|
| Dedrone | DroneTracker | Detection only | USA/EU |
| Anduril | Anvil Interceptor | Kinetic intercept | USA (DoD) |
| DroneDefence | Paladyne E1000 | Net gun | UK |
| Theiss UAV | Excipio | Net cannon | USA |
| Battelle | DroneDefender | RF jammer | USA (Gov only) |

---

## DIY vs Commercial: Decision Matrix

| Factor | DIY (NetSentry) | Commercial (SkyWall) |
|--------|-----------------|----------------------|
| **Cost** | $150-2,000 | $30,000-100,000+ |
| **Range** | 5-50m | 100-150m |
| **Accuracy** | Moderate | High (SmartScope) |
| **Reliability** | Good (with testing) | Excellent |
| **Support** | Community/self | Manufacturer |
| **Legal status** | Same restrictions | Same restrictions |
| **Training** | Self-taught | Included |
| **Warranty** | None | Yes |
| **Certifications** | None | Various |
| **Lead time** | Build yourself | Weeks/months |

**Recommendation:**
- **Testing/Learning:** NetSentry Lite ($150-400)
- **Property protection:** NetSentry Standard ($400-800)
- **Professional use:** NetSentry Pro or evaluate commercial
- **Critical infrastructure:** Commercial only

---

## 1. Net Launcher Propulsion Methods

### 1.1 Pneumatic (Compressed Air)

**Covered in:** `FIRE_NET_HARDWARE.md`

Best for: Refillable, repeatable testing, indoor use

```
Compressed Air Tank → Regulator → Solenoid Valve → Barrel → Net
         ↑
    GPIO triggers solenoid
```

| Spec | Value |
|------|-------|
| Pressure | 100-150 PSI |
| Range | 10-50m |
| Reusable | Yes (refill tank) |
| Cost | $200-500 |

---

### 1.2 CO2 Cartridge (Chemical - Compressed Gas)

**How it works:** GPIO triggers a puncture mechanism that pierces a CO2 cartridge, releasing gas rapidly.

```
┌─────────────────────────────────────────────────────────┐
│                    CO2 Net Launcher                      │
│                                                          │
│  GPIO 17 ──→ Solenoid ──→ Puncture Pin ──→ CO2 Cartridge │
│                                    ↓                     │
│                              Gas Release                 │
│                                    ↓                     │
│                              Net Ejection                │
└─────────────────────────────────────────────────────────┘
```

#### Components
- 12g or 16g CO2 cartridges (paintball/airsoft type)
- Puncture solenoid or spring-loaded pin
- Expansion chamber
- Net payload tube

#### Wiring
```
                                    +12V
                                      │
┌──────────────┐    ┌─────────────┐   │   ┌──────────────────┐
│ Raspberry Pi │    │ Relay Module│   │   │ Puncture Solenoid│
│              │    │             │   │   │                  │
│   GPIO 17 ───┼────┤ IN     COM ─┼───┘   │ Drives pin into  │
│              │    │             │       │ CO2 cartridge    │
│   GND ───────┼────┤ GND    NO ──┼───────┤                  │
│              │    │             │       └──────────────────┘
│   5V ────────┼────┤ VCC         │
└──────────────┘    └─────────────┘
```

#### Specifications
| Spec | 12g Cartridge | 16g Cartridge |
|------|---------------|---------------|
| Gas Volume | ~8L at STP | ~12L at STP |
| Pressure | 850 PSI @ 70°F | 850 PSI @ 70°F |
| Range | 15-25m | 20-35m |
| Cost/shot | $0.50-1.00 | $1.00-2.00 |
| Reusable | Cartridge replaced | Cartridge replaced |

#### Advantages
- Self-contained, portable
- No external air supply needed
- Fast deployment (<50ms)
- Widely available cartridges
- Legal for civilian use

#### Disadvantages
- Single-shot (must replace cartridge)
- Temperature sensitive (lower power in cold)
- Cartridge cost per shot

#### Recommended Products
- Crosman 12g CO2 cartridges
- Palmer Pursuit puncture valves
- Custom 3D printed expansion chambers

---

### 1.3 Pyrotechnic Gas Generator

**How it works:** Small pyrotechnic charge generates gas rapidly (like automotive airbags). GPIO triggers an electric igniter.

```
┌─────────────────────────────────────────────────────────┐
│              Pyrotechnic Net Launcher                    │
│                                                          │
│  GPIO 17 ──→ Igniter Circuit ──→ Gas Generator Charge   │
│                                         ↓                │
│                                   Rapid Gas Release      │
│                                         ↓                │
│                                    Net Ejection          │
└─────────────────────────────────────────────────────────┘
```

#### Components
- Gas generator cartridge (sodium azide or similar)
- Electric match/igniter (e-match)
- Firing circuit with capacitor
- Expansion chamber and barrel

#### Igniter Circuit
```
                     ┌────────────────┐
                     │ Capacitor Bank │
                     │ (470µF, 16V)   │
                     └───────┬────────┘
                             │
┌──────────────┐    ┌───────┴───────┐    ┌─────────────┐
│ Raspberry Pi │    │ MOSFET Driver │    │ E-Match     │
│              │    │ (IRLZ44N)     │    │ Igniter     │
│   GPIO 17 ───┼────┤ Gate          │    │ (1-2 ohm)   │
│              │    │        Drain ─┼────┤             │
│   GND ───────┼────┤ Source    GND─┼────┤             │
└──────────────┘    └───────────────┘    └─────────────┘
```

**WARNING**: Pyrotechnic devices may require permits. Check local regulations.

#### Specifications
| Spec | Value |
|------|-------|
| Gas generation | 50-200L in <50ms |
| Pressure | 500-2000 PSI peak |
| Range | 25-75m |
| Response time | <20ms |
| Cost/shot | $5-20 |

#### Advantages
- Extremely fast deployment
- High power in small package
- Works in any temperature
- Long shelf life

#### Disadvantages
- Regulatory requirements
- Single-use cartridges
- Safety considerations
- Louder than pneumatic

#### Sources
- Automotive airbag inflators (surplus)
- Pyrotechnic supply companies (requires licensing)
- Model rocket motor suppliers (some designs)

---

### 1.4 Spring-Mechanical with Chemical Latch Release

**How it works:** Pre-tensioned spring held by a chemically-activated latch. GPIO triggers heating element that melts/burns release mechanism.

```
┌─────────────────────────────────────────────────────────┐
│            Spring + Chemical Release Launcher            │
│                                                          │
│  GPIO 17 ──→ Nichrome Wire ──→ Burns Retaining Cord     │
│                                        ↓                 │
│                                  Spring Released         │
│                                        ↓                 │
│                                   Net Ejection           │
└─────────────────────────────────────────────────────────┘
```

#### Components
- High-tension spring mechanism
- Nichrome wire heating element (burn wire)
- Sacrificial retaining cord (nylon/cotton)
- Spring-loaded piston

#### Burn Wire Circuit
```
┌──────────────┐    ┌─────────────┐    ┌─────────────────┐
│ Raspberry Pi │    │ MOSFET      │    │ Nichrome Wire   │
│              │    │ (IRLZ44N)   │    │ (28-32 AWG)     │
│   GPIO 17 ───┼────┤ Gate        │    │ wrapped around  │
│              │    │      Drain ─┼────┤ retaining cord  │
│   GND ───────┼────┤ Source      │    │                 │
│              │    └──────┬──────┘    └────────┬────────┘
│   5V ────────┼───────────┴─────────────────────┘
└──────────────┘         (2-3A needed)
```

#### Specifications
| Spec | Value |
|------|-------|
| Release time | 100-500ms |
| Range | 5-20m |
| Reusable | Yes (re-cock + new cord) |
| Cost | $50-150 initial |

#### Advantages
- No compressed gas needed
- Quiet operation
- Simple, reliable
- Low per-shot cost (just cord)

#### Disadvantages
- Slower release (100-500ms burn time)
- Must manually re-cock
- Limited range
- Spring fatigue over time

---

### 1.5 Hybrid: CO2 + Spring Assist

Combines CO2 cartridge with spring mechanism for maximum velocity.

```
Spring Tension + CO2 Gas = Higher Exit Velocity
```

#### Concept
```
┌─────────────────────────────────────────────────────────┐
│               Hybrid Launcher (Spring + CO2)             │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │ Tensioned│    │ CO2      │    │ Net      │           │
│  │ Spring   │───→│ Expansion│───→│ Payload  │───→ EXIT  │
│  └────┬─────┘    └────┬─────┘    └──────────┘           │
│       │               │                                  │
│       └───────┬───────┘                                  │
│               │                                          │
│        GPIO triggers both                                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Other Countermeasure Options

### 2.1 Bright Light Dazzler

Disrupts drone camera with intense light. Legal for civilian use.

```
GPIO 17 ──→ MOSFET ──→ High-Power LED Array (1000+ lumens)
```

#### Components
- High-power LED (Cree XHP70 or similar)
- LED driver board
- Focusing optics
- Heat sink

#### Effectiveness
- Blinds camera temporarily
- Does not stop drone
- Range: 20-100m depending on power
- Legal in most jurisdictions

---

### 2.2 Acoustic Deterrent

High-frequency sound to disorient drone sensors or annoy operator.

```
GPIO 17 ──→ Amplifier ──→ Ultrasonic/Audible Speaker Array
```

#### Notes
- Limited effectiveness against autonomous drones
- May affect wildlife/pets
- Check noise ordinances

---

### 2.3 Smoke/Obscurant Deployment

Blocks drone camera view of target area.

```
GPIO 17 ──→ Relay ──→ Smoke Canister Igniter
```

#### Types
- Theatrical smoke (glycol-based)
- Military smoke (titanium tetrachloride) - restricted
- Pyrotechnic smoke grenades - may require permits

---

### 2.4 Water Cannon

High-pressure water stream can knock down small drones.

```
GPIO 17 ──→ Solenoid Valve ──→ Pressurized Water Tank ──→ Nozzle
```

#### Specs
- Pressure: 100-200 PSI
- Range: 10-30m
- Effectiveness: Good against small drones

---

### 2.5 Counter-Drone (Interceptor)

Launch a tethered interceptor drone that entangles the target.

```
GPIO 17 ──→ Launch Signal ──→ Interceptor Drone with Trailing Net
```

Commercial systems exist (Fortem DroneHunter, Anduril Interceptor).

---

## 3. Propulsion Comparison Table

| Method | Range | Response | Build Cost | Cost/Shot | Reusable | Permits |
|--------|-------|----------|------------|-----------|----------|---------|
| Pneumatic | 10-50m | 50ms | $300-500 | ~$0 | Yes | No |
| CO2 Cartridge | 15-35m | 50ms | $100-200 | $1-2 | No | No |
| Pyrotechnic | 25-75m | 20ms | $150-300 | $5-20 | No | Maybe |
| Spring (burn wire) | 5-20m | 200ms | $50-100 | $0.10 | Yes | No |
| Hybrid (Spring+CO2) | 20-45m | 50ms | $150-250 | $1-2 | Partial | No |

### Build Cost Breakdown

| Method | Launcher | Trigger | Barrel/Housing | Misc | Total |
|--------|----------|---------|----------------|------|-------|
| **Pneumatic** | Tank $80-150, Regulator $50-80 | Solenoid $30-50, Relay $10 | PVC/Aluminum $50-80 | Fittings $30 | **$300-500** |
| **CO2 Cartridge** | Puncture valve $40-60 | Solenoid $30, Relay $10 | PVC tube $20-30 | Chamber $20-40 | **$100-200** |
| **Pyrotechnic** | Gas generator $50-100 | E-match $5-10, MOSFET $5 | Steel barrel $50-80 | Safety $30-50 | **$150-300** |
| **Spring** | Spring+piston $30-50 | Nichrome $5, MOSFET $5 | PVC housing $20 | Cord $5 | **$50-100** |
| **Hybrid** | Spring $30 + CO2 valve $50 | Dual trigger $40 | Combined housing $40 | Misc $20 | **$150-250** |

### Cost Per 100 Shots (Amortized)

| Method | Build ÷ 100 | Consumables × 100 | Total/100 shots | Per Shot |
|--------|-------------|-------------------|-----------------|----------|
| Pneumatic | $4.00 | $0 (refill air) | $4.00 | **$0.04** |
| CO2 | $1.50 | $150 (cartridges) | $151.50 | **$1.52** |
| Pyrotechnic | $2.25 | $1,000 (charges) | $1,002.25 | **$10.02** |
| Spring | $0.75 | $10 (cord) | $10.75 | **$0.11** |
| Hybrid | $2.00 | $150 (CO2) | $152.00 | **$1.52** |

**Winner for high-volume use:** Pneumatic (lowest long-term cost)
**Winner for occasional use:** Spring with burn wire (lowest build cost)

---

## 4. Chemical Propellant Details

### 4.1 CO2 (Carbon Dioxide)

**Chemical Properties:**
- Stored as liquid under pressure
- Expands ~500x when released
- Non-flammable, non-toxic
- Temperature sensitive: P = f(T)

**Pressure vs Temperature:**
| Temp °F | Pressure (PSI) |
|---------|----------------|
| 32°F (0°C) | 490 |
| 70°F (21°C) | 850 |
| 90°F (32°C) | 1050 |

**Calculation:**
For a 12g cartridge launching a 200g net:
```
Energy = P × V × ln(V_final/V_initial)
Velocity ≈ sqrt(2 × Energy / mass)
Typical exit velocity: 30-50 m/s
```

---

### 4.2 Sodium Azide Gas Generators

**Used in:** Automotive airbags, emergency inflators

**Reaction:**
```
2 NaN₃ → 2 Na + 3 N₂ (at >300°C)
```

**Properties:**
- Generates nitrogen gas rapidly
- Triggered by electric igniter (150-300mA, 2-5ms)
- ~67L of N₂ per 100g NaN₃
- Extremely fast (<20ms full inflation)

**Safety:**
- Sodium azide is toxic - do not open cartridges
- Use only sealed commercial units
- Proper disposal required

---

### 4.3 Black Powder / Smokeless Powder

**Legal Status:** Requires licensing in most jurisdictions for use in launchers.

**Not recommended** for DIY projects due to:
- ATF regulations (USA)
- Explosive classification
- Safety hazards
- Liability concerns

---

## 5. GPIO Interface Summary

All countermeasure systems interface identically:

```python
# The detector provides this signal
GPIO 17: LOW (idle) → HIGH (100ms pulse) → LOW

# Your actuator circuit responds to the rising edge
```

### Universal Relay Interface
```
Pi GPIO 17 ──→ Opto-isolated Relay ──→ Your Actuator (any type)
```

This abstraction means you can swap propulsion methods without changing software.

---

## 6. Safety Checklist

Before deploying ANY countermeasure:

- [ ] Verify local laws permit drone interception
- [ ] Obtain necessary permits (pyrotechnics, compressed gas)
- [ ] Install physical safety switch in series
- [ ] Test GPIO output without actuator
- [ ] Test actuator without projectile
- [ ] Test full system in safe direction
- [ ] Verify all 7 software safety interlocks work
- [ ] Have fire extinguisher nearby (pyrotechnics)
- [ ] Wear safety glasses during testing
- [ ] Document all tests

---

## 7. Legal Disclaimer

This documentation is for educational and authorized security purposes only.

Before implementing any countermeasure system:
1. Consult local aviation authorities
2. Verify property rights and permissions
3. Consider liability implications
4. Follow all applicable regulations

The authors assume no liability for use or misuse of this information.
