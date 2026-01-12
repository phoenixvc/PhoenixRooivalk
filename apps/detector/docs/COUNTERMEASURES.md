# Drone Countermeasure Options

This document covers countermeasure options that can be triggered by the Pi
Drone Detector's GPIO output system.

## Overview

The detector provides a 100ms GPIO pulse when engagement conditions are met.
This pulse can trigger various countermeasure systems. This document covers the
full range of options from budget DIY builds to commercial systems.

---

## Product Tiers

### Tier Comparison

| Tier                    | Name                | Total Cost      | Detection Range    | Launch Range | Best For                  |
| ----------------------- | ------------------- | --------------- | ------------------ | ------------ | ------------------------- |
| **Detection Only**      | SkyWatch Nano       | $50-100         | 30-50m             | None         | Hobbyists, awareness      |
| **Detection Only**      | SkyWatch            | $100-250        | 50-150m            | None         | Home/property monitoring  |
| **Detection Only**      | SkyWatch Pro        | $250-600        | 150-500m           | None         | Farms, estates, events    |
| **Detection + Counter** | NetSentry Lite      | $150-400        | 50-100m            | 10-25m       | Hobbyists, testing        |
| **Detection + Counter** | NetSentry           | $400-800        | 100-200m           | 15-40m       | Property protection       |
| **Detection + Counter** | NetSentry Pro       | $800-2,000      | 200-500m           | 25-50m       | Security professionals    |
| **Commercial**          | SkyWall 100         | $30,000-70,000  | 500m+              | 100m+        | Military, law enforcement |
| **Commercial**          | Fortem DroneHunter  | $50,000+        | 3km+               | 1km+         | Critical infrastructure   |
| **Mobile**              | SkyWatch Mobile     | $200-500        | 100-300m           | None         | Patrols, temporary sites  |
| **Multi-Node**          | SkyWatch Mesh       | $500-2,000/node | 500m-2km (network) | None         | Perimeter coverage        |
| **Enterprise**          | SkyWatch Enterprise | $5,000-20,000   | 1-5km              | Optional     | Campus, facilities        |
| **Thermal**             | SkyWatch Thermal    | $400-1,500      | 100-500m (24/7)    | None         | Night operations          |
| **Maritime**            | SkyWatch Marine     | $600-2,000      | 200-800m           | None         | Vessels, coastal          |

---

## Detection-Only Systems (SkyWatch Line)

For users who want **awareness without countermeasures** - legally simpler,
lower cost, and often sufficient for most use cases.

### Why Detection-Only?

- **Legal simplicity**: No permits required for passive detection
- **Lower cost**: No launcher hardware needed
- **Lower risk**: No projectiles, no liability concerns
- **Sufficient for most**: Alert + record is enough for evidence/awareness
- **Upgrade path**: Add countermeasures later if needed

### SkyWatch Nano - $50-100

**Target users:** Hobbyists, backyard awareness, learning

**Components:**

| Item                  | Cost | Source      |
| --------------------- | ---- | ----------- |
| Raspberry Pi Zero 2 W | $15  | Pi supplier |
| Pi Camera Module v2   | $25  | Pi supplier |
| MicroSD card (32GB)   | $8   | Amazon      |
| USB power supply      | $10  | Amazon      |
| 3D printed case       | $5   | DIY/Etsy    |

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

| Item                   | Cost | Source      |
| ---------------------- | ---- | ----------- |
| Raspberry Pi 4 (2GB)   | $45  | Pi supplier |
| Pi Camera Module v3    | $35  | Pi supplier |
| Coral USB Accelerator  | $60  | Coral.ai    |
| PoE HAT (optional)     | $20  | Pi supplier |
| Weatherproof enclosure | $25  | Amazon      |
| MicroSD card (64GB)    | $12  | Amazon      |

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
  gpio_siren_pin: 18 # 12V siren via relay
  gpio_light_pin: 23 # Warning light
  save_detections_path: "/var/log/detections/"
  record_clips: true
  clip_duration_seconds: 30
```

---

### SkyWatch Pro - $250-600

**Target users:** Farms, estates, event venues, commercial property

**Components:**

| Item                       | Cost | Source         |
| -------------------------- | ---- | -------------- |
| Raspberry Pi 5 (4GB)       | $60  | Pi supplier    |
| Pi Camera HQ + 16mm lens   | $100 | Pi supplier    |
| Coral M.2 Accelerator      | $35  | Coral.ai       |
| M.2 HAT for Pi 5           | $15  | Pi supplier    |
| RTL-SDR dongle (RF detect) | $30  | Amazon         |
| USB microphone (audio)     | $20  | Amazon         |
| PoE+ HAT                   | $25  | Pi supplier    |
| Weatherproof enclosure     | $40  | Amazon         |
| Pan-tilt mount             | $100 | Servo supplier |

**Detection Methods:**

| Method             | Range    | Conditions    | Hardware              |
| ------------------ | -------- | ------------- | --------------------- |
| Visual (telephoto) | 150-500m | Daylight      | HQ Camera + 16mm lens |
| Visual (wide)      | 50-100m  | Day/low-light | Camera Module v3      |
| RF detection       | 500m-2km | Any           | RTL-SDR + antenna     |
| Audio signature    | 50-200m  | Low noise     | USB microphone        |

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

| Method              | Range    | Day/Night        | Weather           | Cost     | False Positives           |
| ------------------- | -------- | ---------------- | ----------------- | -------- | ------------------------- |
| **Visual (camera)** | 50-500m  | Day (night w/IR) | Rain affects      | $25-100  | Low with ML               |
| **RF scanning**     | 500m-2km | Both             | Unaffected        | $30-100  | Medium (WiFi, etc.)       |
| **Audio signature** | 50-200m  | Both             | Wind affects      | $20-50   | Medium                    |
| **Radar (doppler)** | 100m-1km | Both             | Mostly unaffected | $200-500 | Low                       |
| **ADS-B receiver**  | 50km+    | Both             | Unaffected        | $30      | Very low (compliant only) |

### RF Detection Details (RTL-SDR)

Many consumer drones operate on known frequencies:

| Drone Type | Control Freq      | Video Freq | Protocol            |
| ---------- | ----------------- | ---------- | ------------------- |
| DJI (most) | 2.4 GHz           | 5.8 GHz    | OcuSync/Lightbridge |
| FPV racing | 2.4 GHz           | 5.8 GHz    | Various             |
| Cheap toys | 2.4 GHz           | None       | Simple RC           |
| Commercial | 900 MHz / 2.4 GHz | 5.8 GHz    | Various             |

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

| Drone Size     | Frequency Range | Characteristics         |
| -------------- | --------------- | ----------------------- |
| Mini (<250g)   | 8-12 kHz        | High-pitched whine      |
| Medium (1-2kg) | 4-8 kHz         | Mid-range buzz          |
| Large (>2kg)   | 2-4 kHz         | Lower rumble, more bass |

**Audio Detection Pipeline:**

```
Microphone → FFT → Frequency Analysis → ML Classifier → Alert
                         ↓
              Match against known drone signatures
```

---

### Alert Integration Options

| Alert Type             | Latency   | Cost      | Best For                 |
| ---------------------- | --------- | --------- | ------------------------ |
| **Local buzzer**       | <100ms    | $2        | Immediate awareness      |
| **GPIO relay → siren** | <100ms    | $20       | Outdoor warning          |
| **Webhook**            | 200-500ms | $0        | Home automation, logging |
| **Telegram bot**       | 500ms-2s  | $0        | Mobile notification      |
| **SMS (via Twilio)**   | 1-3s      | $0.01/msg | Reliable mobile          |
| **Email**              | 5-30s     | $0        | Non-urgent, records      |
| **Smart home (MQTT)**  | <200ms    | $0        | Home Assistant, etc.     |
| **Strobe light**       | <100ms    | $30       | Visual deterrent         |

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
  cooldown_per_track: 60 # Don't re-alert same drone for 60s
  global_cooldown: 5 # Min 5s between any alerts
```

### Detection Range Factors

Detection range depends on:

- **Camera sensor**: Pi Camera v2 (50-100m) vs HQ Camera (100-200m) vs telephoto
  lens (200-500m)
- **Target size**: Mini drones (~15cm) detected at shorter range than large
  drones (~50cm)
- **Lighting conditions**: Daylight optimal, low-light reduces range by 30-50%
- **Model accuracy**: Trained models improve detection at longer ranges
- **Hardware acceleration**: Coral TPU enables higher resolution processing

---

### SkyWatch Mobile - $200-500

**Target users:** Security patrols, temporary deployments, event staff

**Components:**

| Item                  | Cost | Source                  |
| --------------------- | ---- | ----------------------- | -------- | ---------------------- | --- | ----------------- | --- |
| Raspberry Pi          |
| 4 (2GB)               | $45  | Pi supplier             |          | Pi Camera Module v3    | $35 | Pi supplier       |     |
| Coral USB Accelerator | $60  | Coral.ai                |          | 7" touchscreen display | $60 | Pi                |
| supplier              |      | Battery pack (20000mAh) | $40      | Amazon                 |     | Rugged carry case | $30 |
| Pelican/Amazon        |      | **Total**               | **$270** |                        |

**Specifications:**

- Detection range: 100-300m
- Battery life: 3-5 hours continuous
- Form factor: Handheld tablet-style
- Processing: 15-25 FPS
- Display: Real-time detection view
- Alerts: Vibration, audio, visual overlay

**Use Cases:**

- Security guard patrols
- Event perimeter walks
- Temporary site surveys
- Vehicle-mounted surveillance
- Training exercises

**Configuration (mobile.yaml):**

```yaml
display:
  headless: false
  show_battery: true
  fullscreen: true

power:
  battery_monitoring: true
  low_power_threshold: 20
  auto_sleep_minutes: 5

alert:
  vibration_enabled: true
  audio_enabled: true
  volume: 80
```

---

### SkyWatch Mesh (Multi-Node Network) - $500-2,000/node

**Target users:** Large perimeters, farms, industrial sites, event venues

**Architecture:**

```
                         ┌─────────────────┐
                         │  Central Server │
                         │  (Aggregation)  │
                         └────────┬────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
    ┌──────┴──────┐        ┌──────┴──────┐       ┌──────┴──────┐
    │   Node 1    │        │   Node 2    │       │   Node 3    │
    │ (North Gate)│        │(East Fence) │       │ (Warehouse) │
    └─────────────┘        └─────────────┘       └─────────────┘
           ▼                      ▼                      ▼
       Coverage               Coverage               Coverage
        Area 1                Area 2                 Area 3
```

**Per-Node Components:**

| Item                   | Cost     | Source         |
| ---------------------- | -------- | -------------- |
| Raspberry Pi 4 (2GB)   | $45      | Pi supplier    |
| Pi Camera Module v3    | $35      | Pi supplier    |
| PoE HAT                | $20      | Pi supplier    |
| Weatherproof enclosure | $40      | Amazon         |
| Mounting hardware      | $20      | Hardware store |
| **Per Node Total**     | **$160** |                |

**Central Server:**

| Item                       | Cost         | Source           |
| -------------------------- | ------------ | ---------------- |
| Raspberry Pi 5 (8GB) or PC | $80-500      | Various          |
| PoE switch (8-port)        | $100-200     | Ubiquiti/TP-Link |
| UPS backup                 | $80          | APC              |
| **Central Total**          | **$260-780** |                  |

**Specifications:**

- Nodes: 3-20+ depending on coverage needs
- Per-node range: 100-200m
- Network range: 500m-2km (combined coverage)
- Latency: <100ms to central alert
- Communication: Ethernet (PoE) or WiFi mesh
- Redundancy: Continues operating if nodes fail

**Detection Fusion:**

```txt
Node 1 detects at 70% confidence ─┐
Node 2 detects at 65% confidence ─┼─► Fusion Engine ─► 95% combined confidence
Node 3 detects at 40% confidence ─┘
                                         │
                                    Triangulation
                                         │
                                    3D Position
```

**Network Configuration (mesh-central.yaml):**

```yaml
mesh:
  mode: central
  nodes:
    - id: node-north
      address: 192.168.1.101
      location: "North Gate"
      fov_direction: 180 # degrees
    - id: node-east
      address: 192.168.1.102
      location: "East Fence"
      fov_direction: 90
    - id: node-warehouse
      address: 192.168.1.103
      location: "Warehouse"
      fov_direction: 270

  fusion:
    min_nodes_for_alert: 1
    triangulation_enabled: true
    combined_confidence_boost: 0.15

  health:
    heartbeat_interval: 10
    node_timeout: 30
```

| **Deployment Calculator:** | Area Size | Recommended Nodes | Total Cost | |
-------------------------- | --------- | ----------------- || 1 acre | 2-3 |
$500-700 | | 5 acres | 4-6 | $900-1,200 | | 20 acres | 8-12 | $1,600-2,400 | |
100 acres | 15-25 | $3,000-5,000 |

---

### SkyWatch Enterprise - $5,000-20,000

**Target users:** Corporate campuses, critical facilities, airports, military

**Components:**

| Item             | Cost         | Source             |
| ---------------- | ------------ | ------------------ | ------------------ | --------------------- | ------------ | ------------- | --- | --- |
| Server rack      |
| (1U)             | $500         | Dell/HP            |                    | Detection nodes (×10) | $2,000       | SkyWatch Mesh |     | PTZ |
| cameras (×4)     | $2,000       | Hikvision/Axis     |                    | Radar unit (optional) | $3,000-8,000 |
| Echodyne/Oculii  |              | RF detection array | $1,000             | Custom RTL-SDR        |              | Central       |
| software license | $1,000-5,000 | Commercial         |                    | Installation          | $1,000-3,000 |
| Professional     |              | **Total**          | **$10,500-20,500** |                       |

**Specifications:**

- Detection range: 1-5km (multi-sensor)
- 24/7 operation with redundancy
- SOC integration (SIEM, monitoring)
- Multi-user dashboard
- Compliance logging (audit trails)
- API integration for existing security systems

**Integration Points:**

```
┌─────────────────────────────────────────────────────────────┐
│                  Enterprise Security Center                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐     │
│  │ SIEM    │   │ Access  │   │ Video   │   │ Alarm   │     │
│  │ (Splunk)│   │ Control │   │ (NVR)   │   │ Panel   │     │
│  └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘     │
│       │             │             │             │           │
│       └─────────────┴──────┬──────┴─────────────┘           │
│                            │                                 │
│                   ┌────────┴────────┐                       │
│                   │   SkyWatch API  │                       │
│                   └─────────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**API Example:**

```python
# SkyWatch Enterprise API integration
import requests

SKYWATCH_API = "https://skywatch.local/api/v1"

# Subscribe to alerts
def on_drone_detected(alert):
    # Forward to SIEM
    siem_client.send_event({
        "type": "drone_intrusion",
        "confidence": alert["confidence"],
        "location": alert["location"],
        "track_id": alert["track_id"],
        "timestamp": alert["timestamp"]
    })

    # Trigger PTZ camera to track
    ptz_camera.track_coordinates(
        alert["position"]["lat"],
        alert["position"]["lon"]
    )

    # Alert security team
    dispatch_system.notify_guards(alert["location"])
```

---

### SkyWatch Thermal - $400-1,500

**Target users:** Night operations, 24/7 monitoring, wildlife areas

**Components (Budget):**

| Item                      | Cost     | Source             |
| ------------------------- | -------- | ------------------ |
| Raspberry Pi 4 (4GB)      | $55      | Pi supplier        |
| FLIR Lepton 3.5 (160×120) | $200     | GroupGets/SparkFun |
| Lepton breakout board     | $50      | GroupGets          |
| Visible camera (optional) | $35      | Pi supplier        |
| Weatherproof enclosure    | $40      | Amazon             |
| **Total Budget**          | **$380** |                    |

**Components (Professional):**

| Item                     | Cost       | Source      |
| ------------------------ | ---------- | ----------- |
| Raspberry Pi 5 (8GB)     | $80        | Pi supplier |
| FLIR Boson 320 (320×256) | $800       | FLIR        |
| Boson interface board    | $100       | FLIR        |
| HQ visible camera        | $75        | Pi supplier |
| Coral TPU                | $60        | Coral.ai    |
| Weatherproof enclosure   | $80        | Industrial  |
| **Total Pro**            | **$1,195** |             |

**Thermal Detection Advantages:**

| Condition | Visible Camera | Thermal Camera |
|-----------|----------------|----------------| | Daylight, clear | Excellent |
Good | | Night, no moon | None | Excellent | | Fog/haze | Poor | Good | | Rain |
Poor | Moderate | | Drone vs bird | ML required | Heat signature helps | |
Background clutter | High | Low |

**Detection Pipeline:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Thermal   │     │   Visible   │     │   Fusion    │
│   Sensor    │────►│   Sensor    │────►│   Engine    │
│ (heat blob) │     │ (visual ID) │     │ (combined)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
            ┌───────────────┐
            │ Classification │
            │   - Drone      │
            │   - Bird       │
            │   - Aircraft   │
            │   - Unknown    │
            └───────────────┘
```

**Thermal Configuration (thermal.yaml):**

```yaml
sensors:
  thermal:
    enabled: true
    device: /dev/spidev0.0
    resolution: "160x120" # Lepton 3.5
    temperature_range: [-10, 140] # Celsius
    colormap: "ironbow"

  visible:
    enabled: true
    device: /dev/video0

fusion:
  mode: overlay
  thermal_weight: 0.6
  visible_weight: 0.4
  hot_spot_threshold: 35 # Celsius - drone motors run hot

inference:
  model_path: "models/drone_thermal.tflite"
  input_channels: 4 # RGBT (RGB + Thermal)
```

---

### SkyWatch Marine - $600-2,000

**Target users:** Vessel operators, marinas, coastal facilities, offshore
platforms

**Challenges at Sea:**

- Salt spray and corrosion
- Constant motion (gyro stabilization needed)
- Limited power
- Marine communication integration
- Reflection off water surface

**Components:**

| Item                  | Cost         | Source                   |
| --------------------- | ------------ | ------------------------ | -------- | ----------------------------- | ---- | ----------- | --- |
| Raspberry Pi          |
| 4 (4GB)               | $55          | Pi supplier              |          | Pi Camera HQ + wide lens      | $90  | Pi supplier |     |
| Coral USB Accelerator | $60          | Coral.ai                 |          | Marine-grade enclosure (IP67) | $120 |
| Polycase              |              | Gyro stabilization mount | $150-300 | Marine supplier               |      | 12V-5V      |
| marine converter      | $30          | West Marine              |          | Marine antenna/WiFi           | $80  | Ubiquiti    |
| **Total**             | **$585-735** |                          |

**Marine-Specific Features:**

- **Gyro stabilization**: Compensates for vessel motion
- **Salt-resistant enclosure**: IP67 rated, marine-grade
- **12V DC input**: Integrates with vessel power
- **NMEA integration**: Sends alerts to chart plotter
- **AIS correlation**: Cross-references with AIS targets

**NMEA 2000 Integration:**

```
┌─────────────────────────────────────────────────────────┐
│                    Vessel Network                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │  Chart   │   │   AIS    │   │  Radar   │            │
│  │ Plotter  │   │Transpond.│   │          │            │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘            │
│       │              │              │                   │
│       └──────────────┴──────┬───────┘                   │
│                             │                           │
│                      NMEA 2000 Bus                      │
│                             │                           │
│                    ┌────────┴────────┐                  │
│                    │ SkyWatch Marine │                  │
│                    │  (Gateway Node) │                  │
│                    └─────────────────┘                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Marine Configuration (marine.yaml):**

```yaml
environment: marine

enclosure:
  ip_rating: IP67
  operating_temp: [-20, 60]
  humidity_rating: 100 # percent

power:
  input_voltage: 12 # Vessel DC
  brownout_protection: true
  voltage_range: [10, 16]

motion:
  stabilization: gyro
  max_roll_compensation: 30 # degrees
  max_pitch_compensation: 20 # degrees

integration:
  nmea_enabled: true
  nmea_port: /dev/ttyUSB0
  nmea_baud: 38400
  ais_correlation: true

alerts:
  vhf_announcement: false # Legal restrictions
  chart_plotter_overlay: true
  bridge_alarm: true
```

---

## Additional Detection Methods

### Thermal/FLIR Detection

**How it works:** Drone motors and batteries generate heat (40-80°C), creating a
distinct thermal signature against cooler backgrounds.

**Advantages:**

- Works in complete darkness
- Effective in fog/haze
- Low false positives (birds are cooler)
- No lighting required

| **Hardware Options:** | Sensor | Resolution | FPS | Interface | Cost | |
--------------------- | ------ | ---------- | --- | --------- || FLIR Lepton 2.5
| 80×60 | 9 | SPI | $150 | | FLIR Lepton 3.5 | 160×120 | 9 | SPI | $200 | | FLIR
Boson 320 | 320×256 | 60 | USB | $800 | | Seek Thermal | 206×156 | 15 | USB |
$250 | | InfiRay T2-Pro | 256×192 | 25 | USB | $400 |

**Detection Characteristics:**

```
Drone Thermal Signature:
┌──────────────────────────────────┐
│                                   │
│     ██  Motors (60-80°C)         │
│   ██████                         │
│   ██████  Battery (40-60°C)      │
│     ██    Props (ambient)        │
│                                   │
│   Background: 15-25°C            │
└──────────────────────────────────┘
```

---

### LIDAR Detection

**How it works:** Laser ranging detects objects by time-of-flight. Effective for
precise 3D positioning and works regardless of lighting.

**Advantages:**

- Precise distance measurement
- Works day/night
- 3D spatial mapping
- Velocity from doppler shift

| **Hardware Options:** | Sensor | Range | Points/sec | FOV | Cost | |
--------------------- | ------ | ----- | ---------- | --- || RPLidar A1 | 12m |
8,000 | 360° | $100 | | RPLidar A3 | 25m | 16,000 | 360° | $600 | | Livox Mid-40
| 260m | 100,000 | 38° | $600 | | Intel RealSense L515 | 9m | 23M | 70° | $350 |
| Ouster OS0-32 | 50m | 655,000 | 90° | $3,500 |

**LIDAR Detection Pipeline:**

```
LIDAR Scan → Point Cloud → Clustering → Object Detection → Classification
     │              │            │              │              │
     │              │            │              │         Is it a drone?
     │              │            │         Size/shape/motion
     │              │       Group nearby points
     │         3D coordinates
     └── Distance measurements
```

**Limitations:**

- Expensive for long range
- Weather affects performance (rain, dust)
- Small drones harder to detect
- Processing intensive

---

### Controller/Pilot Localization

**Why locate the controller?**

- Identifying the drone is only half the problem
- Finding the pilot enables enforcement action
- Controller location helps predict drone behavior
- Required for prosecution/evidence

#### Method 1: RF Direction Finding (RDF)

**How it works:** Multiple directional antennas determine the bearing to the RF
source. Intersection of bearings gives location.

```
        Antenna 1                    Antenna 2
           │                            │
           │ Bearing: 045°              │ Bearing: 315°
           │                            │
           └────────────┬───────────────┘
                        │
                   Controller
                   Location
                   (intersection)
```

**Hardware:**

| Item                   | Cost         | Source               |
| ---------------------- | ------------ | -------------------- |
| Yagi antenna (×2-3)    | $50-100 each | Amazon/HAM suppliers |
| RTL-SDR dongles (×2-3) | $30 each     | RTL-SDR.com          |
| USB hub                | $20          | Amazon               |
| Raspberry Pi 4         | $55          | Pi supplier          |
| **Total (2-antenna)**  | **$185-235** |                      |

**Accuracy:** ±5-15° bearing, ~50-200m location accuracy at 1km range

#### Method 2: Time Difference of Arrival (TDOA)

**How it works:** Measures the time difference between signal arrival at
multiple synchronized receivers. More accurate than RDF.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Receiver 1 │     │  Receiver 2 │     │  Receiver 3 │
│  (t = 0ms)  │     │  (t = 2ms)  │     │  (t = 3ms)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    Hyperbolic curves
                    intersection = source
```

**Requirements:**

- 3+ synchronized receivers (GPS-disciplined)
- High-speed data links between nodes
- Significant processing power
- Typically commercial/military systems

**Accuracy:** 10-50m at 1km range

#### Method 3: DJI AeroScope / Remote ID

**How it works:** DJI drones broadcast their location AND pilot location via
AeroScope protocol. New drones (2024+) use Remote ID (FAA-mandated).

**DJI AeroScope Data:** | Field | Description | |-------|-------------| | Drone
serial number | Unique identifier | | Drone GPS position | Lat/lon/altitude | |
Pilot GPS position | From controller GPS | | Home point | Takeoff location | |
Flight speed/heading | Current velocity |

**DIY AeroScope Receiver:**

```bash
# Open-source DJI receiver (research purposes)
git clone https://github.com/RyanKellyBME/DroneID
cd DroneID
# Requires HackRF or USRP SDR
```

**Remote ID (USA, 2024+):** | Field | Description | |-------|-------------| |
UAS ID | Registration number | | Latitude/Longitude | Current position | |
Altitude | Geometric/pressure | | Velocity | Speed and direction | | Takeoff
location | Or pilot location | | Timestamp | UTC time |

**Remote ID Receiver:**

```bash
# Bluetooth-based Remote ID receiver
# Works with phone apps or dedicated receiver
# Range: ~300m (Bluetooth 5 long range)
```

#### Method 4: WiFi RSSI Mapping

**How it works:** Multiple receivers measure signal strength (RSSI). Stronger
signal = closer to source.

**Simple RSSI Triangulation:**

```python
# Basic RSSI-based distance estimation
def estimate_distance(rssi_dbm, tx_power=-40, path_loss_exp=2.0):
    """
    Estimate distance from RSSI using log-distance path loss model.
    tx_power: RSSI at 1 meter (calibrate for your environment)
    path_loss_exp: 2.0 (free space) to 4.0 (urban)
    """
    distance_m = 10 ** ((tx_power - rssi_dbm) / (10 * path_loss_exp))
    return distance_m

# Example: -60 dBm signal
distance = estimate_distance(-60)  # ~10 meters
```

**Multi-node RSSI:**

```
┌─────────────────────────────────────────────────────┐
│                    Coverage Area                     │
│                                                      │
│   Node 1: -55dBm    Node 2: -70dBm    Node 3: -62dBm│
│       ●                 ●                 ●         │
│        \               /                 /          │
│         \             /                 /           │
│          \           /                 /            │
│           \         /                 /             │
│            ●───────●                 ●              │
│         Controller location                         │
│         (weighted centroid)                         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### Controller Detection Configuration

```yaml
# controller-detection.yaml
controller_detection:
  enabled: true

  # RF Direction Finding
  rdf:
    enabled: true
    antennas:
      - id: north
        bearing_offset: 0 # Antenna pointing north
        usb_device: /dev/rtlsdr0
      - id: east
        bearing_offset: 90 # Antenna pointing east
        usb_device: /dev/rtlsdr1
    frequencies: [2400000000, 2450000000, 5800000000]
    scan_interval: 0.5 # seconds

  # RSSI triangulation
  rssi:
    enabled: true
    min_nodes: 3
    calibration_tx_power: -40 # dBm at 1m
    path_loss_exponent: 2.5

  # DJI AeroScope
  aeroscope:
    enabled: true
    sdr_device: /dev/hackrf0

  # Remote ID (Bluetooth)
  remote_id:
    enabled: true
    bluetooth_adapter: hci0
    scan_interval: 1.0

  # Output
  output:
    log_pilot_locations: true
    alert_on_pilot_detected: true
    overlay_on_map: true
```

#### Commercial Controller Detection Systems

| System          | Method            | Range | Pilot Location | Price    |
| --------------- | ----------------- | ----- | -------------- | -------- |
| DJI AeroScope   | Protocol decode   | 50km  | Yes (DJI only) | $15,000+ |
| CACI SkyTracker | RF fingerprint    | 5km   | Yes            | $75,000+ |
| Dedrone         | Multi-sensor      | 5km   | Approximate    | $20,000+ |
| DroneShield     | RF analysis       | 2km   | Direction only | $20,000+ |
| Sentrycs        | Protocol analysis | 2km   | Yes (takeover) | $75,000+ |

#### Legal Considerations for Pilot Tracking

- **Privacy laws**: Tracking individuals may require authorization
- **Evidence handling**: Chain of custody for prosecution
- **Data retention**: GDPR/privacy policy implications
- **Notification**: Some jurisdictions require signage

---

### WiFi Probe Detection

**How it works:** Consumer drones (DJI, etc.) emit WiFi probe requests and
maintain connections with controllers. These can be passively detected.

**Advantages:**

- Passive (no emissions from detector)
- Can identify drone make/model
- Works through visual occlusion
- Detects controller AND drone

**Hardware:**

| Item                                     | Cost         |
| ---------------------------------------- | ------------ |
| Alfa AWUS036ACH (dual-band WiFi adapter) | $50          |
| High-gain antenna                        | $20-50       |
| Raspberry Pi 4                           | $55          |
| **Total**                                | **$125-155** |

| **Known Drone WiFi Signatures:** | Manufacturer | SSID Pattern | MAC OUI | |
-------------------------------- | ------------ | ------------ || DJI | `DJI-*`,
`Phantom-*`, `Mavic-*` | `60:60:1F`, `34:D2:62` | | Parrot | `Parrot-*`,
`Anafi-*` | `90:03:B7`, `A0:14:3D` | | Skydio | `Skydio-*` | Various | | Autel |
`Autel-*` | `FC:0F:E6` |

**Detection Script:**

```bash
# Monitor for drone WiFi signatures
sudo airodump-ng wlan0mon --manufacturer --band abg | \
  grep -E "(DJI|Parrot|Mavic|Phantom|Anafi|Skydio)"
```

**WiFi Configuration (wifi-detect.yaml):**

```yaml
wifi_detection:
  enabled: true
  interface: wlan1 # Dedicated monitor interface
  channels: [1, 6, 11, 36, 40, 44, 48]
  hop_interval: 0.5 # seconds

  signatures:
    dji:
      ssid_pattern: "^(DJI|Phantom|Mavic|Spark|Mini)"
      mac_oui: ["60:60:1F", "34:D2:62", "48:01:C5"]
    parrot:
      ssid_pattern: "^(Parrot|Anafi|Bebop)"
      mac_oui: ["90:03:B7", "A0:14:3D"]

  alert_on:
    - new_drone_detected
    - drone_approaching # Signal strength increasing
    - multiple_drones # Swarm detection
```

---

### NetSentry Lite (Budget Entry Point) - $150-400

**Target users:** Makers, hobbyists, proof-of-concept testing

**Components:**

| Item                    | Cost         | Source         |
| ----------------------- | ------------ | -------------- |
| Raspberry Pi 4 (2GB)    | $45          | Pi supplier    |
| Pi Camera Module v2     | $25          | Pi supplier    |
| TFLite model (provided) | $0           | This project   |
| Spring launcher (DIY)   | $30-50       | Hardware store |
| Burn wire release       | $10          | Amazon         |
| Net (1.5m weighted)     | $20-40       | Fishing supply |
| 12V relay module        | $5           | Amazon         |
| 12V power supply        | $15          | Amazon         |
| PVC pipe housing        | $20          | Hardware store |
| **Total**               | **$170-210** |                |

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

| Item                    | Cost         | Source                |
| ----------------------- | ------------ | --------------------- |
| Raspberry Pi 4 (4GB)    | $55          | Pi supplier           |
| Pi Camera HQ + lens     | $75          | Pi supplier           |
| Coral USB Accelerator   | $60          | Coral.ai              |
| TFLite model (provided) | $0           | This project          |
| CO2 launcher system     | $150-250     | See build guide       |
| Net (2m weighted)       | $40-60       | Fishing/safety supply |
| Relay module + wiring   | $20          | Amazon                |
| Weatherproof enclosure  | $50-80       | Amazon                |
| Mounting hardware       | $30          | Hardware store        |
| **Total**               | **$480-650** |                       |

**Specifications:**

- Detection range: 100-200m
- Net launch range: 15-30m
- Response time: 50ms
- Reloads: Replace CO2 cartridge ($1-2/shot)

---

### NetSentry Pro - $800-2,000

**Target users:** Security professionals, critical sites

**Components:**

| Item                    | Cost                   | Source             |
| ----------------------- | ---------------------- | ------------------ | ------------------ | ---------------------- | ------------------ | -------------- | --- |
| Raspberry Pi            |
| 5 (8GB)                 | $80                    | Pi supplier        |                    | Global Shutter Camera  | $50                | Pi supplier    |     |
| Telephoto lens (6-12mm) | $100                   | Camera supplier    |                    | Coral TPU (M.2 or USB) |
| $60-100                 | Coral.ai               |                    | Pneumatic launcher | $300-500               | Custom build       |                | Air |
| tank + regulator        | $150-200               | Paintball supplier |                    | Net system (3m,        |
| auto-deploy)            | $100-150               | Custom             |                    | Pan-tilt mount         | $100-200           | Servo supplier |
|                         | Weatherproof enclosure | $100               | Industrial         |                        | UPS battery backup | $80            |
| Amazon                  |                        | **Total**          | **$1,120-1,460**   |                        |

**Specifications:**

- Detection range: 200-500m
- Net launch range: 25-50m
- Response time: 50ms
- Reloads: Refill air tank (free)
- Auto-tracking: Optional pan-tilt

---

## Commercial Systems

### SkyWall (OpenWorks Engineering, UK)

| **Products:** | Model | Type | Range | Price (Est.) | | ------------- | -----
| ---- | ----- || SkyWall 100 | Shoulder-launched | 100m | $30,000-50,000 | |
SkyWall Patrol | Handheld | 100m | $40,000-60,000 | | SkyWall 300 | Autonomous
turret | 150m+ | $100,000+ |

**Features:**

- Compressed gas launcher (reusable)
- SmartScope targeting with drone detection
- Parachute-deployed net (controlled descent)
- Cartridge cost: ~$500-1,000 each

**Best for:** Law enforcement, event security, VIP protection

**Website:** [openworksengineering.com](https://openworksengineering.com)

---

### Fortem Technologies (USA)

| **Products:** | Model | Type | Range | Price (Est.) | | ------------- | -----
| ---- | ----- || DroneHunter F700 | Interceptor drone | 1km+ | $50,000-100,000
| | SkyDome System | Integrated C-UAS | 3km+ | $500,000+ |

**Features:**

- Autonomous drone-on-drone intercept
- AI-powered tracking (TrueView radar)
- Can defeat drone swarms
- Only system authorized for US airspace intercepts

**Best for:** Military, airports, critical infrastructure

**Website:** [fortemtech.com](https://fortemtech.com)

---

### DroneShield (Australia)

| **Products:** | Model | Type | Range | Price (Est.) | | ------------- | -----
| ---- | ----- || DroneGun Tactical | RF jammer (handheld) | 2km |
$30,000-50,000 | | DroneGun MkIII | RF jammer (rifle) | 1km | $20,000-35,000 | |
DroneSentry | Fixed detection | 5km | $100,000+ |

**Features:**

- RF/GPS jamming (not physical capture)
- Forces drone to land or return home
- Detection + defeat integrated

**Note:** RF jamming is **illegal for civilians** in most jurisdictions.

**Website:** [droneshield.com](https://droneshield.com)

---

### Other Commercial Options

| Company      | Product           | Type              | Region         |
| ------------ | ----------------- | ----------------- | -------------- |
| Dedrone      | DroneTracker      | Detection only    | USA/EU         |
| Anduril      | Anvil Interceptor | Kinetic intercept | USA (DoD)      |
| DroneDefence | Paladyne E1000    | Net gun           | UK             |
| Theiss UAV   | Excipio           | Net cannon        | USA            |
| Battelle     | DroneDefender     | RF jammer         | USA (Gov only) |

---

## DIY vs Commercial: Decision Matrix

| Factor             | DIY (NetSentry)     | Commercial (SkyWall) |
| ------------------ | ------------------- | -------------------- |
| **Cost**           | $150-2,000          | $30,000-100,000+     |
| **Range**          | 5-50m               | 100-150m             |
| **Accuracy**       | Moderate            | High (SmartScope)    |
| **Reliability**    | Good (with testing) | Excellent            |
| **Support**        | Community/self      | Manufacturer         |
| **Legal status**   | Same restrictions   | Same restrictions    |
| **Training**       | Self-taught         | Included             |
| **Warranty**       | None                | Yes                  |
| **Certifications** | None                | Various              |
| **Lead time**      | Build yourself      | Weeks/months         |

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

| Spec     | Value             |
| -------- | ----------------- |
| Pressure | 100-150 PSI       |
| Range    | 10-50m            |
| Reusable | Yes (refill tank) |
| Cost     | $200-500          |

---

### 1.2 CO2 Cartridge (Chemical - Compressed Gas)

**How it works:** GPIO triggers a puncture mechanism that pierces a CO2
cartridge, releasing gas rapidly.

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

| Spec       | 12g Cartridge      | 16g Cartridge      |
| ---------- | ------------------ | ------------------ |
| Gas Volume | ~8L at STP         | ~12L at STP        |
| Pressure   | 850 PSI @ 70°F     | 850 PSI @ 70°F     |
| Range      | 15-25m             | 20-35m             |
| Cost/shot  | $0.50-1.00         | $1.00-2.00         |
| Reusable   | Cartridge replaced | Cartridge replaced |

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

**How it works:** Small pyrotechnic charge generates gas rapidly (like
automotive airbags). GPIO triggers an electric igniter.

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

| Spec           | Value             |
| -------------- | ----------------- |
| Gas generation | 50-200L in <50ms  |
| Pressure       | 500-2000 PSI peak |
| Range          | 25-75m            |
| Response time  | <20ms             |
| Cost/shot      | $5-20             |

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

**How it works:** Pre-tensioned spring held by a chemically-activated latch.
GPIO triggers heating element that melts/burns release mechanism.

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

| Spec         | Value                    |
| ------------ | ------------------------ |
| Release time | 100-500ms                |
| Range        | 5-20m                    |
| Reusable     | Yes (re-cock + new cord) |
| Cost         | $50-150 initial          |

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

| Method              | Range  | Response | Build Cost | Cost/Shot | Reusable | Permits |
| ------------------- | ------ | -------- | ---------- | --------- | -------- | ------- |
| Pneumatic           | 10-50m | 50ms     | $300-500   | ~$0       | Yes      | No      |
| CO2 Cartridge       | 15-35m | 50ms     | $100-200   | $1-2      | No       | No      |
| Pyrotechnic         | 25-75m | 20ms     | $150-300   | $5-20     | No       | Maybe   |
| Spring (burn wire)  | 5-20m  | 200ms    | $50-100    | $0.10     | Yes      | No      |
| Hybrid (Spring+CO2) | 20-45m | 50ms     | $150-250   | $1-2      | Partial  | No      |

### Build Cost Breakdown

| Method            | Launcher                       | Trigger                    | Barrel/Housing       | Misc           | Total        |
| ----------------- | ------------------------------ | -------------------------- | -------------------- | -------------- | ------------ |
| **Pneumatic**     | Tank $80-150, Regulator $50-80 | Solenoid $30-50, Relay $10 | PVC/Aluminum $50-80  | Fittings $30   | **$300-500** |
| **CO2 Cartridge** | Puncture valve $40-60          | Solenoid $30, Relay $10    | PVC tube $20-30      | Chamber $20-40 | **$100-200** |
| **Pyrotechnic**   | Gas generator $50-100          | E-match $5-10, MOSFET $5   | Steel barrel $50-80  | Safety $30-50  | **$150-300** |
| **Spring**        | Spring+piston $30-50           | Nichrome $5, MOSFET $5     | PVC housing $20      | Cord $5        | **$50-100**  |
| **Hybrid**        | Spring $30 + CO2 valve $50     | Dual trigger $40           | Combined housing $40 | Misc $20       | **$150-250** |

### Cost Per 100 Shots (Amortized)

| Method      | Build ÷ 100 | Consumables × 100 | Total/100 shots | Per Shot   |
| ----------- | ----------- | ----------------- | --------------- | ---------- |
| Pneumatic   | $4.00       | $0 (refill air)   | $4.00           | **$0.04**  |
| CO2         | $1.50       | $150 (cartridges) | $151.50         | **$1.52**  |
| Pyrotechnic | $2.25       | $1,000 (charges)  | $1,002.25       | **$10.02** |
| Spring      | $0.75       | $10 (cord)        | $10.75          | **$0.11**  |
| Hybrid      | $2.00       | $150 (CO2)        | $152.00         | **$1.52**  |

**Winner for high-volume use:** Pneumatic (lowest long-term cost) **Winner for
occasional use:** Spring with burn wire (lowest build cost)

---

## 4. Chemical Propellant Details

### 4.1 CO2 (Carbon Dioxide)

**Chemical Properties:**

- Stored as liquid under pressure
- Expands ~500x when released
- Non-flammable, non-toxic
- Temperature sensitive: P = f(T)

| **Pressure vs Temperature:** | Temp °F | Pressure (PSI) | |
---------------------------- | ------- || 32°F (0°C) | 490 | | 70°F (21°C) | 850
| | 90°F (32°C) | 1050 |

**Calculation:** For a 12g cartridge launching a 200g net:

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

This abstraction means you can swap propulsion methods without changing
software.

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

## 7. Additional Commercial Systems

### Robin Radar Systems (Netherlands)

| **Products:** | Model | Type | Range | Price (Est.) | | ------------- | -----
| ---- | ----- || ELVIRA | 3D FMCW Radar | 5km+ | $50,000-100,000 | | IRIS |
360° Radar | 3km | $80,000-150,000 | | MAX | Long-range Radar | 10km+ |
$200,000+ |

**Features:**

- Military-grade radar technology
- Track hundreds of targets simultaneously
- Bird/drone classification AI
- Integrates with effector systems
- Used at airports worldwide

**Best for:** Airports, critical infrastructure, military installations

**Website:** [robinradar.com](https://robinradar.com)

---

### CACI SkyTracker (USA)

| **Products:** | Model | Type | Range | Price (Est.) | | ------------- | -----
| ---- | ----- || SkyTracker | RF detection | 5km+ | $75,000-150,000 | |
SkyTracker-M | Mobile variant | 3km | $100,000-200,000 |

**Features:**

- Passive RF detection (no emissions)
- Identifies drone AND controller location
- Tracks multiple drones simultaneously
- Geolocation of pilot
- Integration with defeat systems

**Best for:** Government, law enforcement, military

**Website:** [caci.com](https://caci.com)

---

### Liteye Systems (USA)

| **Products:** | Model | Type | Range | Price (Est.) | | ------------- | -----
| ---- | ----- || AUDS | Integrated C-UAS | 10km | $500,000+ | | C-AUDS |
Compact version | 3km | $150,000-300,000 |

**Features:**

- Radar + EO/IR + RF defeat
- Full detect-track-defeat chain
- Military proven (DOD contracts)
- Vehicle and fixed mount options
- Training included

**Best for:** Military, high-security facilities

**Website:** [liteye.com](https://liteye.com)

---

### Dedrone (Germany/USA)

| **Products:** | Model | Type | Range | Price (Est.) | | ------------- | -----
| ---- | ----- || DroneTracker | RF sensors | 1-5km | $20,000-50,000 | | City |
Multi-site platform | Unlimited | $100,000+/year |

**Features:**

- RF + visual + radar sensor fusion
- Cloud-based analytics platform
- Multi-site management dashboard
- Drone library with 300+ models
- API for custom integrations

**Best for:** Corporate campuses, prisons, stadiums

**Website:** [dedrone.com](https://dedrone.com)

---

### Sentrycs (Israel)

| **Products:** | Model | Type | Range | Price (Est.) | | ------------- | -----
| ---- | ----- || Horizon | Protocol takeover | 2km | $100,000+ | | Horizon-M |
Mobile unit | 1km | $75,000+ |

**Features:**

- Takes over drone communication
- Forces safe landing at designated location
- Does not jam (legal in more jurisdictions)
- Works on DJI and commercial drones
- Forensic data extraction

**Best for:** Law enforcement, VIP protection

**Website:** [sentrycs.com](https://sentrycs.com)

---

### Commercial System Comparison Matrix

| Vendor      | Detection | Tracking | Defeat         | Minimum Budget | Primary Market  |
| ----------- | --------- | -------- | -------------- | -------------- | --------------- |
| SkyWall     | Visual    | Manual   | Net            | $30,000        | Law enforcement |
| Fortem      | Radar     | Auto     | Drone-on-drone | $50,000        | Critical infra  |
| DroneShield | RF        | Manual   | Jammer         | $20,000        | Military        |
| Robin Radar | Radar     | Auto     | Integration    | $50,000        | Airports        |
| CACI        | RF        | Auto     | Integration    | $75,000        | Government      |
| Liteye      | Multi     | Auto     | Jammer         | $150,000       | Military        |
| Dedrone     | Multi     | Auto     | Integration    | $20,000        | Corporate       |
| Sentrycs    | RF        | Auto     | Takeover       | $75,000        | VIP protection  |

---

## 8. Deployment Guide

### Power Options

| Power Source         | Watts Available | Runtime    | Best For         | Cost        |
| -------------------- | --------------- | ---------- | ---------------- | ----------- |
| **USB Power Bank**   | 10-15W          | 4-8 hours  | Mobile, testing  | $30-60      |
| **PoE (802.3af)**    | 15W             | Continuous | Fixed nodes      | $0 (switch) |
| **PoE+ (802.3at)**   | 30W             | Continuous | High-power nodes | $0 (switch) |
| **Solar + Battery**  | 20-50W          | 24/7       | Remote sites     | $200-500    |
| **12V DC (vehicle)** | 100W+           | Continuous | Mobile patrols   | $30 adapter |
| **Mains (AC)**       | Unlimited       | Continuous | Fixed install    | $10-20 PSU  |

| **Power Consumption by Tier:** | Tier | Idle | Active | Peak | |
------------------------------ | ---- | ---- | ------ || SkyWatch Nano | 2W | 3W
| 4W | | SkyWatch Standard | 4W | 6W | 10W | | SkyWatch Pro | 8W | 12W | 18W | |
NetSentry Lite | 5W | 8W | 15W | | NetSentry Standard | 8W | 12W | 25W | |
NetSentry Pro | 12W | 18W | 35W |

**Solar Sizing Calculator:**

```
Required panel size = (Daily Wh) / (Sun hours × 0.8)
Battery capacity = (Daily Wh × Days autonomy) / 0.5

Example for SkyWatch Standard (24/7):
- Daily consumption: 6W × 24h = 144Wh
- Panel (5 sun hours): 144 / (5 × 0.8) = 36W → Use 50W panel
- Battery (2 days): 144 × 2 / 0.5 = 576Wh → Use 600Wh (50Ah @ 12V)
```

---

### Mounting Options

#### Pole Mount (Most Common)

```
Height recommendation: 3-5m for typical coverage

     ┌─────────────┐
     │  Detector   │
     │   Housing   │
     └──────┬──────┘
            │
     ┌──────┴──────┐
     │  Pan-Tilt   │  (optional)
     │   Mount     │
     └──────┬──────┘
            │
    ════════╪════════  Mounting bracket
            │
            │  Pole (aluminum/steel)
            │
     ───────┴───────   Ground/roof
```

| **Recommended heights:** | Application | Height | Field of View | |
------------------------ | ----------- | ------ || Garden/yard | 2-3m | 50-100m
| | Property perimeter | 3-4m | 100-200m | | Industrial/farm | 4-6m | 200-400m |
| Elevated (tower) | 10-20m | 500m+ |

#### Roof Mount

- Use non-penetrating roof mount (weighted base)
- Ensure lightning protection
- Consider wind loads
- Provide cable conduit to interior

#### Vehicle Mount

- Magnetic base for temporary
- Suction cup with safety tether
- Permanent roof rack mount
- Consider vibration dampening

---

### Weather Ratings

| **IP Rating Guide:** | Rating | Protection | Suitable For | |
-------------------- | ------ | ---------- || IP54 | Dust protected, splashing
water | Covered outdoor | | IP65 | Dust tight, water jets | Outdoor exposed | |
IP66 | Dust tight, powerful jets | Coastal, industrial | | IP67 | Dust tight, 1m
immersion | Marine, harsh |

| **Operating Temperature Ranges:** | Environment | Range | Notes | |
--------------------------------- | ----------- | ----- || Standard | 0°C to
40°C | Most enclosures | | Extended | -20°C to 60°C | Industrial rated | | Cold
climate | -40°C to 50°C | Heated enclosure required | | Hot climate | 0°C to
70°C | Active cooling required |

**Weather Protection Checklist:**

- [ ] Appropriate IP-rated enclosure
- [ ] Silica gel desiccant packs (humidity)
- [ ] Vent with GORE membrane (pressure equalization)
- [ ] Sunshade for camera lens
- [ ] Cable glands (not holes with sealant)
- [ ] Drip loops on cables
- [ ] Lightning arrestor on PoE

---

### Maintenance Schedule

#### Weekly

- [ ] Check detection logs for anomalies
- [ ] Verify alert delivery (test notification)
- [ ] Review storage space
- [ ] Check uptime/connectivity

#### Monthly

- [ ] Clean camera lens (soft cloth, no chemicals)
- [ ] Check enclosure seals (visual inspection)
- [ ] Review detection accuracy (false positive rate)
- [ ] Update threat database (if applicable)
- [ ] Test GPIO output (with relay LED indicator)

#### Quarterly

- [ ] Firmware/software updates
- [ ] Check mounting hardware (tighten if needed)
- [ ] Inspect cables for UV damage
- [ ] Clean air vents/filters
- [ ] Calibrate pan-tilt (if equipped)
- [ ] Test full countermeasure chain (safe direction)

#### Annually

- [ ] Full system test (detection → tracking → alert)
- [ ] Replace desiccant packs
- [ ] Check/replace weatherseals
- [ ] Verify IR calibration (thermal systems)
- [ ] Review and update detection model
- [ ] Recertify net launcher (if applicable)

**Maintenance Log Template:**

```yaml
# maintenance-log.yaml
system_id: "skywatch-north-01"
location: "North Gate"
install_date: 2024-01-15

maintenance_records:
  - date: 2024-04-15
    type: quarterly
    technician: "J. Smith"
    tasks:
      - firmware_update: "v2.3.1 → v2.4.0"
      - lens_cleaned: true
      - mount_tightened: true
      - gpio_test: passed
    notes: "Minor condensation inside enclosure, added extra desiccant"

  - date: 2024-03-01
    type: monthly
    technician: "J. Smith"
    tasks:
      - lens_cleaned: true
      - logs_reviewed: true
    notes: "All normal"
```

---

## 9. Legal and Regulatory Guide

### Country-Specific Regulations

#### United States

**Detection:** Generally legal for passive detection on your property.

**Countermeasures:**

| Action | Legal Status | Authority | | ------ | ------------ | --------- ||
Visual detection | Legal | None required | | RF detection (passive) | Legal |
None required | | RF jamming | **Illegal** | FCC (47 U.S.C. § 333) | | GPS
jamming | **Illegal** | FCC | | Net capture | Gray area | State dependent | |
Shooting down | **Illegal** | 18 U.S.C. § 32 |

**Authorized entities:** Only DHS, DOJ, DOE, DOD can legally defeat drones under
6 U.S.C. § 124n.

**FAA Guidance:**

- Cannot interfere with aircraft in flight
- Drones are legally "aircraft"
- Even on your property, shooting/jamming prohibited

---

#### United Kingdom

**Detection:** Legal with no restrictions.

**Countermeasures:**

| Action | Legal Status | Authority | | ------ | ------------ | --------- ||
Visual detection | Legal | None | | RF detection | Legal | None | | RF jamming |
**Illegal** | Wireless Telegraphy Act 2006 | | Net capture | **Restricted** |
Police/authorized only | | Protocol takeover | **Restricted** | RIPA
authorization |

**Authorized entities:** Police, Prison Service (under specific authority).

**CAA Guidance:** Contact [caa.co.uk](https://www.caa.co.uk/drones) for
drone-related incidents.

---

#### European Union (GDPR Considerations)

**Privacy Requirements:**

- Drone detection cameras may capture personal data
- GDPR applies if individuals identifiable
- Legitimate interest assessment required

**GDPR Compliance Checklist:**

- [ ] Privacy impact assessment completed
- [ ] Signage indicating surveillance in area
- [ ] Data retention policy (delete after X days)
- [ ] Access request procedure documented
- [ ] No facial recognition without consent
- [ ] Data processing agreement with cloud providers

**Example Privacy Notice:**

```
DRONE DETECTION SYSTEM IN OPERATION
This area is monitored by an automated drone detection
system. Images may be captured for security purposes.
Data retained for 30 days. Contact: privacy@example.com
```

---

#### Australia

**Detection:** Legal for private property monitoring.

**Countermeasures:**

| Action | Legal Status | Authority | | ------ | ------------ | --------- ||
Visual detection | Legal | None | | RF detection | Legal | None | | RF jamming |
**Illegal** | Radiocommunications Act 1992 | | Physical capture | **Restricted**
| State law varies |

**CASA Guidance:** Report unsafe drone operations to
[casa.gov.au](https://www.casa.gov.au).

---

#### South Africa

**Detection:** Legal with no restrictions.

**Countermeasures:**

| Action | Legal Status | Notes | | ------ | ------------ | ----- || Visual
detection | Legal | SACAA has no restrictions | | RF detection | Legal | ICASA
allows passive monitoring | | RF jamming | **Illegal** | ECA Section 34 | | Net
capture | Gray area | Private property defense possible |

**SACAA Guidance:** Contact [caa.co.za](https://www.caa.co.za) for commercial
drone incidents.

**ICASA:** Radio frequency jamming requires special authorization, rarely
granted.

---

### Insurance Considerations

| **Liability Coverage:** | Scenario | Typical Coverage | Notes | |
----------------------- | -------- | ---------------- || Property damage (your
property) | Homeowner's policy | Check drone exclusions | | Property damage
(drone captured) | May not cover | Intentional act exclusion | | Personal injury
| General liability | If net injures bystander | | Drone operator lawsuit |
Legal defense | Consider umbrella policy |

**Recommended Coverage:**

- General liability: $1M minimum
- Umbrella policy: $2-5M for countermeasure systems
- Professional liability: If providing detection services

**Documentation Requirements:**

- Maintain system logs (proof of threat)
- Record all deployments
- Keep maintenance records
- Document training/certification

---

### Authorized Use Cases

| Use Case                | Detection Legal | Counter Legal     | Notes                  |
| ----------------------- | --------------- | ----------------- | ---------------------- |
| Home property           | Yes             | Varies by country | Check local laws       |
| Commercial property     | Yes             | Varies            | Liability concerns     |
| Event security          | Yes             | Often no          | Requires authorization |
| Prison/detention        | Yes             | Yes (authorized)  | Government only        |
| Critical infrastructure | Yes             | Yes (authorized)  | Special permits        |
| Military                | Yes             | Yes               | Rules of engagement    |

---

### Reporting Drone Incidents

**When to report:**

- Drone flying over restricted airspace
- Drone involved in criminal activity
- Dangerous/reckless drone operation
- Near-miss with manned aircraft

| **Who to contact:** | Country | Authority | Contact | | ------------------- |
------- | --------- || USA | FAA | 1-866-835-5322 | | UK | CAA/Police | 101 or
caa.co.uk | | Australia | CASA | casa.gov.au | | EU | Local aviation authority |
Varies | | South Africa | SACAA | caa.co.za |

---

## 10. Legal Disclaimer

This documentation is for educational and authorized security purposes only.

Before implementing any countermeasure system:

1. Consult local aviation authorities
2. Verify property rights and permissions
3. Consider liability implications
4. Follow all applicable regulations
5. Obtain appropriate insurance coverage
6. Document all detections and deployments
7. Seek legal counsel for specific situations

**The authors and contributors assume no liability for use or misuse of this
information. Users are solely responsible for ensuring compliance with all
applicable laws and regulations in their jurisdiction.**

---

## Appendix A: Glossary

| Term  | Definition                                           |
| ----- | ---------------------------------------------------- |
| C-UAS | Counter-Unmanned Aircraft System                     |
| RF    | Radio Frequency                                      |
| EO/IR | Electro-Optical/Infrared                             |
| FMCW  | Frequency-Modulated Continuous Wave (radar type)     |
| ADS-B | Automatic Dependent Surveillance-Broadcast           |
| PoE   | Power over Ethernet                                  |
| GPIO  | General Purpose Input/Output                         |
| FLIR  | Forward-Looking Infrared                             |
| PTZ   | Pan-Tilt-Zoom                                        |
| SIEM  | Security Information and Event Management            |
| NVR   | Network Video Recorder                               |
| OUI   | Organizationally Unique Identifier (MAC prefix)      |
| GDPR  | General Data Protection Regulation (EU)              |
| SACAA | South African Civil Aviation Authority               |
| ICASA | Independent Communications Authority of South Africa |

---

## Appendix B: Quick Reference

### Tier Selection Guide

```
What's your budget?
├── < $100 → SkyWatch Nano
├── $100-$300 → SkyWatch Standard
├── $300-$600 → SkyWatch Pro
├── $150-$400 → NetSentry Lite (with countermeasure)
├── $400-$800 → NetSentry Standard
├── $800-$2,000 → NetSentry Pro
└── $5,000+ → Enterprise / Commercial

Do you need countermeasures?
├── No → SkyWatch line
└── Yes → NetSentry line (check legal status first)

Special requirements?
├── Mobile/portable → SkyWatch Mobile
├── Large area → SkyWatch Mesh
├── Night/thermal → SkyWatch Thermal
├── Maritime → SkyWatch Marine
└── Enterprise → SkyWatch Enterprise
```

### Detection Method Selection

```
What conditions?
├── Daylight only → Camera (cheapest)
├── Day + night → Camera + Thermal
├── Any weather → RF + Radar
└── Maximum coverage → Multi-sensor fusion

What range?
├── < 100m → Camera sufficient
├── 100-500m → Camera + RF
├── 500m-2km → RF + Radar
└── > 2km → Radar required
```
