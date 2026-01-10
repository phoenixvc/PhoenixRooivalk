---
sidebar_position: 3
title: Product Catalog
description:
  Complete specifications, bill of materials, and build guides for all drone
  detection and countermeasure products.
keywords:
  [
    product catalog,
    SkyWatch,
    NetSentry,
    drone detection,
    countermeasures,
    bill of materials,
    BOM,
    build guide,
    specifications,
  ]
---

# PhoenixRooivalk Product Catalog

Complete specifications, bill of materials, and build guides for all drone
detection and countermeasure products.

---

## Table of Contents

1. [Detection-Only Products (SkyWatch Line)](#detection-only-products-skywatch-line)
   - [SkyWatch Nano](#skywatch-nano)
   - [SkyWatch Standard](#skywatch-standard)
   - [SkyWatch Pro](#skywatch-pro)
   - [SkyWatch Mobile](#skywatch-mobile)
   - [SkyWatch Thermal](#skywatch-thermal)
   - [SkyWatch Marine](#skywatch-marine)
   - [SkyWatch Mesh](#skywatch-mesh)
   - [SkyWatch Enterprise](#skywatch-enterprise)
2. [Detection + Countermeasure Products (NetSentry Line)](#detection--countermeasure-products-netsentry-line)
   - [NetSentry Lite](#netsentry-lite)
   - [NetSentry Standard](#netsentry-standard)
   - [NetSentry Pro](#netsentry-pro)
3. [Consumer Products (SkySnare Line)](#consumer-products-skysnare-line)
   - [SkySnare](#skysnare)
4. [Enterprise Platforms (AeroNet)](#enterprise-platforms-aeronet)
   - [AeroNet Enterprise](#aeronet-enterprise)
5. [Aerial Intercept Systems (RKV Line)](#aerial-intercept-systems-rkv-line)
   - [RKV-M Mothership](#rkv-m-mothership)
   - [RKV-I Interceptor](#rkv-i-interceptor)
   - [RKV-G Ground Station](#rkv-g-ground-station)
6. [Manufacturing & Pricing Data](#manufacturing--pricing-data)
   - [Assembly Time Estimates](#assembly-time-estimates)
   - [Category Markups](#category-markups)
   - [Labor Tariffs](#labor-tariffs)
7. [Commercial Alternatives](#commercial-alternatives)
8. [Appendix: Supplier Directory](#appendix-supplier-directory)

---

# Detection-Only Products (SkyWatch Line)

## SkyWatch Nano

**SKU:** SW-NANO-001 **Target Market:** Hobbyists, makers, educational **Price
Range:** $50-100 **Phase:** Seed (Available Now)

### Overview

Entry-level drone detection for backyard awareness and learning. Minimal
hardware, easy setup, daylight operation only.

### Specifications

| Specification     | Value                         |
| ----------------- | ----------------------------- |
| Detection Range   | 30-50m (daylight)             |
| Processing Speed  | 5-10 FPS                      |
| Power Consumption | 2-4W                          |
| Operating Temp    | 0°C to 40°C                   |
| Dimensions        | 85 × 56 × 30mm (Pi Zero case) |
| Weight            | ~150g assembled               |
| Connectivity      | WiFi 2.4/5GHz                 |
| Storage           | 32GB microSD                  |

### Bill of Materials

| Item                  | Specification      | Qty | Unit Cost | Total      | Supplier               |
| --------------------- | ------------------ | --- | --------- | ---------- | ---------------------- |
| Raspberry Pi Zero 2 W | 512MB RAM, WiFi    | 1   | $15.00    | $15.00     | Raspberry Pi, Adafruit |
| Pi Camera Module v2   | 8MP, Sony IMX219   | 1   | $25.00    | $25.00     | Raspberry Pi, SparkFun |
| MicroSD Card          | 32GB, Class 10, A1 | 1   | $8.00     | $8.00      | SanDisk, Samsung       |
| USB Power Supply      | 5V 2.5A, micro-USB | 1   | $10.00    | $10.00     | CanaKit, Amazon        |
| Pi Zero Camera Cable  | 15cm ribbon        | 1   | $3.00     | $3.00      | Adafruit, Amazon       |
| 3D Printed Case       | PETG/ABS           | 1   | $5.00     | $5.00      | DIY/Etsy               |
| **TOTAL**             |                    |     |           | **$66.00** |                        |

### Optional Accessories

| Item              | Purpose            | Cost   |
| ----------------- | ------------------ | ------ |
| Piezo buzzer      | Audio alert        | $2     |
| GPIO LED          | Visual alert       | $1     |
| Heat sinks        | Thermal management | $3     |
| Outdoor enclosure | Weather protection | $20-40 |

### Configuration

**Minimum Configuration (nano-minimal.yaml):**

```yaml
# SkyWatch Nano - Minimal Configuration
camera_type: picamera
engine_type: tflite

capture:
  width: 320
  height: 240
  fps: 15
  buffer_size: 1

inference:
  model_path: "models/drone_nano.tflite"
  input_size: 192
  confidence_threshold: 0.5
  num_threads: 4
  use_coral: false

drone_score:
  drone_class_id: 0
  model_weight: 0.7
  drone_threshold: 0.5

tracker_type: centroid
tracker:
  max_disappeared: 15
  max_distance: 80.0

alert:
  webhook_url: null
  cooldown_per_track: 10.0
  global_cooldown: 2.0

display:
  headless: true
  log_interval_frames: 60

logging:
  level: INFO
```

**With Buzzer Alert (nano-buzzer.yaml):**

```yaml
# Additional settings for buzzer
alert:
  gpio_buzzer_pin: 18
  buzzer_duration: 0.5
  buzzer_pattern: "beep" # beep, continuous, sos
```

### Assembly Instructions

1. **Flash SD Card**

   ```bash
   # Download Raspberry Pi Imager
   # Select: Raspberry Pi OS Lite (64-bit)
   # Configure: WiFi, SSH, hostname
   ```

2. **Connect Camera**
   - Use Pi Zero camera cable (smaller connector)
   - Ensure blue side faces board

3. **Install Software**

   ```bash
   ssh pi@skywatch-nano.local
   curl -sSL https://phoenixrooivalk.io/install.sh | bash
   cd ~/detector
   python -m detector --config configs/nano-minimal.yaml
   ```

4. **Test Detection**
   - View logs: `journalctl -u skywatch -f`
   - Test webhook: Configure alert URL

### Performance Benchmarks

| Metric             | Value             |
| ------------------ | ----------------- |
| Inference Time     | 180-220ms         |
| End-to-End Latency | 250-350ms         |
| Memory Usage       | ~180MB            |
| CPU Usage          | 70-90%            |
| Detection Accuracy | 75-85% (daylight) |

### Limitations

- No night vision capability
- Limited processing power (single inference)
- No hardware acceleration
- WiFi only (no Ethernet)
- Short detection range

### Commercial Alternatives

| Product                        | Price  | Comparison                        |
| ------------------------------ | ------ | --------------------------------- |
| Ring Drone Detection (rumored) | TBD    | Consumer-focused, cloud-dependent |
| DIY ESP32-CAM                  | $10-20 | Lower resolution, less processing |

---

## SkyWatch Standard

**SKU:** SW-STD-001 **Target Market:** Homeowners, small property **Price
Range:** $100-250 **Phase:** Seed (Available Now)

### Overview

Balanced detection system for residential use. Hardware acceleration via Coral
TPU, low-light capability, multi-channel alerts.

### Specifications

| Specification     | Value                         |
| ----------------- | ----------------------------- |
| Detection Range   | 50-150m                       |
| Processing Speed  | 15-30 FPS                     |
| Power Consumption | 4-10W                         |
| Operating Temp    | -10°C to 50°C                 |
| Dimensions        | 150 × 100 × 80mm              |
| Weight            | ~400g assembled               |
| Connectivity      | WiFi, Ethernet (PoE optional) |
| Storage           | 64GB microSD                  |

### Bill of Materials

| Item                   | Specification        | Qty | Unit Cost | Total       | Supplier         |
| ---------------------- | -------------------- | --- | --------- | ----------- | ---------------- |
| Raspberry Pi 4 Model B | 2GB RAM              | 1   | $45.00    | $45.00      | Raspberry Pi     |
| Pi Camera Module v3    | 12MP, HDR, low-light | 1   | $35.00    | $35.00      | Raspberry Pi     |
| Coral USB Accelerator  | Edge TPU, USB 3.0    | 1   | $59.99    | $59.99      | Coral.ai         |
| MicroSD Card           | 64GB, A2, V30        | 1   | $12.00    | $12.00      | SanDisk Extreme  |
| PoE HAT                | 802.3af, isolated    | 1   | $20.00    | $20.00      | Raspberry Pi     |
| Weatherproof Enclosure | IP65, ventilated     | 1   | $25.00    | $25.00      | Polycase, Amazon |
| Camera Mount           | Adjustable angle     | 1   | $8.00     | $8.00       | Amazon           |
| Silica Gel Packs       | 10g × 5              | 1   | $5.00     | $5.00       | Amazon           |
| **TOTAL**              |                      |     |           | **$209.99** |                  |

### Optional Accessories

| Item               | Purpose               | Cost   |
| ------------------ | --------------------- | ------ |
| 12V siren          | Outdoor audio alert   | $15-30 |
| Strobe light       | Visual deterrent      | $20-40 |
| External antenna   | Extended WiFi range   | $15    |
| Active cooling fan | High ambient temps    | $10    |
| IR illuminator     | Enhanced night vision | $30-50 |

### Configuration

**Standard Configuration (standard.yaml):**

```yaml
# SkyWatch Standard - Recommended Configuration
camera_type: picamera
engine_type: coral

capture:
  width: 640
  height: 480
  fps: 30
  buffer_size: 2

inference:
  model_path: "models/drone_detector.tflite"
  input_size: 320
  confidence_threshold: 0.5
  nms_threshold: 0.45
  num_threads: 4
  use_coral: true

drone_score:
  drone_class_id: 0
  model_weight: 0.7
  drone_threshold: 0.5
  aspect_ratio_min: 0.8
  aspect_ratio_max: 2.5

tracker_type: kalman
tracker:
  max_disappeared: 30
  max_distance: 100.0
  process_noise: 1.0
  measurement_noise: 1.0

alert:
  webhook_url: "https://your-server.com/drone-alert"
  webhook_timeout: 5.0
  cooldown_per_track: 30.0
  global_cooldown: 5.0
  save_detections_path: "/var/log/skywatch/detections/"

streaming:
  enabled: true
  host: "0.0.0.0"
  port: 8080
  quality: 80
  max_fps: 15

display:
  headless: true
  show_fps: true
  show_drone_score: true
  show_track_id: true

logging:
  level: INFO
  log_file: "/var/log/skywatch/detector.log"
  max_bytes: 10000000
  backup_count: 5
```

**Multi-Alert Configuration (standard-alerts.yaml):**

```yaml
alert:
  # Webhook
  webhook_url: "https://api.example.com/webhook"
  webhook_timeout: 5.0
  webhook_retry_count: 3

  # Telegram
  telegram_enabled: true
  telegram_bot_token: "123456:ABC-DEF..."
  telegram_chat_id: "-100123456789"

  # GPIO Outputs
  gpio_siren_pin: 18
  gpio_strobe_pin: 23
  siren_duration: 3.0
  strobe_flash_rate: 2.0 # Hz

  # Recording
  save_detections_path: "/media/usb/detections/"
  record_clips: true
  clip_pre_buffer_seconds: 5
  clip_post_buffer_seconds: 30

  # Throttling
  cooldown_per_track: 60
  global_cooldown: 5
```

### Assembly Instructions

1. **Prepare Enclosure**
   - Drill mounting holes for camera
   - Install cable glands
   - Add ventilation (with mesh filter)

2. **Install Components**

   ```
   ┌─────────────────────────────────┐
   │         Enclosure Top           │
   │  ┌─────┐                        │
   │  │Camera│ ← Behind clear window │
   │  └──┬──┘                        │
   │     │                           │
   │  ┌──┴───────────────────┐      │
   │  │     Raspberry Pi 4    │      │
   │  │  ┌─────────────────┐  │      │
   │  │  │   Coral USB     │  │      │
   │  │  └─────────────────┘  │      │
   │  └───────────────────────┘      │
   │                                  │
   │  [Silica Gel]    [PoE HAT]      │
   └─────────────────────────────────┘
   ```

3. **Connect Hardware**
   - Camera ribbon to Pi CSI port
   - Coral USB to USB 3.0 (blue port)
   - PoE HAT on GPIO header
   - Ethernet cable to PoE switch

4. **Install Software**

   ```bash
   ssh pi@skywatch-standard.local

   # Install dependencies
   sudo apt update && sudo apt install -y \
     python3-pip python3-venv libcamera-apps

   # Clone and install
   git clone https://github.com/PhoenixRooivalk/detector.git
   cd detector
   python3 -m venv venv
   source venv/bin/activate
   pip install -e .

   # Install Coral runtime
   echo "deb https://packages.cloud.google.com/apt coral-edgetpu-stable main" | \
     sudo tee /etc/apt/sources.list.d/coral-edgetpu.list
   curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
   sudo apt update && sudo apt install -y libedgetpu1-std

   # Run
   python -m detector --config configs/standard.yaml
   ```

5. **Create Service**
   ```bash
   sudo cp systemd/skywatch.service /etc/systemd/system/
   sudo systemctl enable skywatch
   sudo systemctl start skywatch
   ```

### Performance Benchmarks

| Metric             | Value              |
| ------------------ | ------------------ |
| Inference Time     | 25-40ms (Coral)    |
| End-to-End Latency | 50-80ms            |
| Memory Usage       | ~350MB             |
| CPU Usage          | 30-50%             |
| Detection Accuracy | 85-92%             |
| Night Detection    | 70-80% (v3 camera) |

### Commercial Alternatives

| Product                   | Price    | Comparison                          |
| ------------------------- | -------- | ----------------------------------- |
| Dedrone DroneTracker Mini | $5,000+  | More features, commercial support   |
| Dronesentry DIY Kit       | $500+    | Similar concept, different software |
| Custom NVR + AI           | $300-500 | Requires more integration work      |

---

## SkyWatch Pro

**SKU:** SW-PRO-001 **Target Market:** Farms, estates, commercial property
**Price Range:** $250-600 **Phase:** Seed (Available Now)

### Overview

Multi-sensor detection platform with visual, RF, and audio detection. Pan-tilt
tracking, long-range telephoto lens, professional-grade reliability.

### Specifications

| Specification     | Value                            |
| ----------------- | -------------------------------- |
| Detection Range   | 150-500m (visual), 500m-2km (RF) |
| Processing Speed  | 30+ FPS                          |
| Power Consumption | 8-18W                            |
| Operating Temp    | -20°C to 60°C                    |
| Dimensions        | 200 × 150 × 120mm                |
| Weight            | ~1.2kg assembled                 |
| Connectivity      | WiFi, Ethernet, PoE+             |
| Storage           | 128GB+ SSD recommended           |

### Bill of Materials

| Item                  | Specification      | Qty | Unit Cost | Total       | Supplier              |
| --------------------- | ------------------ | --- | --------- | ----------- | --------------------- |
| Raspberry Pi 5        | 4GB RAM            | 1   | $60.00    | $60.00      | Raspberry Pi          |
| Pi Camera HQ          | 12.3MP, C/CS mount | 1   | $50.00    | $50.00      | Raspberry Pi          |
| 16mm Telephoto Lens   | C-mount, f/1.4     | 1   | $50.00    | $50.00      | Arducam               |
| Coral M.2 Accelerator | Dual Edge TPU      | 1   | $35.00    | $35.00      | Coral.ai              |
| M.2 HAT for Pi 5      | PCIe to M.2        | 1   | $15.00    | $15.00      | Raspberry Pi          |
| RTL-SDR v3            | R820T2 tuner       | 1   | $30.00    | $30.00      | RTL-SDR.com           |
| 2.4/5.8GHz Antenna    | SMA, 5dBi          | 1   | $15.00    | $15.00      | Amazon                |
| USB Microphone        | Omnidirectional    | 1   | $20.00    | $20.00      | Amazon                |
| PoE+ HAT              | 802.3at, 30W       | 1   | $25.00    | $25.00      | Raspberry Pi          |
| Pan-Tilt Kit          | 2× servo, bracket  | 1   | $80.00    | $80.00      | Lynxmotion, ServoCity |
| Industrial Enclosure  | IP66, aluminum     | 1   | $60.00    | $60.00      | Polycase              |
| SSD                   | 128GB NVMe         | 1   | $25.00    | $25.00      | Samsung, WD           |
| Misc (cables, mounts) | Various            | 1   | $30.00    | $30.00      | Various               |
| **TOTAL**             |                    |     |           | **$495.00** |                       |

### Optional Accessories

| Item                 | Purpose                | Cost     |
| -------------------- | ---------------------- | -------- |
| Second camera (wide) | Dual FOV coverage      | $35      |
| Radar module         | All-weather detection  | $200-500 |
| LTE modem            | Remote connectivity    | $50-100  |
| GPS module           | Geolocation/timestamps | $15      |
| UPS battery          | Power backup           | $80      |

### Configuration

**Pro Configuration (pro.yaml):**

```yaml
# SkyWatch Pro - Multi-Sensor Configuration
camera_type: picamera_hq
engine_type: coral_m2

capture:
  width: 1920
  height: 1080
  fps: 30
  buffer_size: 3

inference:
  model_path: "models/drone_detector_large.tflite"
  input_size: 640
  confidence_threshold: 0.4
  nms_threshold: 0.45
  num_threads: 4
  use_coral: true

drone_score:
  drone_class_id: 0
  model_weight: 0.6
  drone_threshold: 0.45

tracker_type: kalman
tracker:
  max_disappeared: 45
  max_distance: 150.0
  process_noise: 0.5
  measurement_noise: 0.5

# Multi-sensor fusion
sensors:
  visual:
    enabled: true
    weight: 0.5
  rf:
    enabled: true
    weight: 0.3
    device: /dev/rtlsdr0
    frequencies: [2400000000, 2450000000, 5800000000]
  audio:
    enabled: true
    weight: 0.2
    device: "hw:1,0"
    sample_rate: 44100

# Pan-tilt tracking
pan_tilt:
  enabled: true
  pan_pin: 12
  tilt_pin: 13
  pan_range: [-90, 90]
  tilt_range: [-30, 60]
  tracking_speed: 0.8
  return_to_home: true
  home_position: [0, 15]

targeting:
  max_targeting_distance_m: 500.0
  assumed_drone_size_m: 0.3
  min_confidence_for_lock: 0.6
  lock_timeout_seconds: 10.0

alert:
  webhook_url: "https://api.example.com/alert"
  telegram_enabled: true
  save_detections_path: "/mnt/ssd/detections/"
  record_clips: true

streaming:
  enabled: true
  port: 8080
  quality: 90
  max_fps: 30

logging:
  level: INFO
  json_format: true
  log_file: "/mnt/ssd/logs/detector.log"
```

**RF Detection Configuration:**

```yaml
# RF detection for drone control signals
rf_detection:
  enabled: true
  device: /dev/rtlsdr0

  # Frequencies to monitor
  scan_bands:
    - name: "2.4GHz WiFi/Control"
      start: 2400000000
      end: 2500000000
      step: 1000000
    - name: "5.8GHz Video"
      start: 5725000000
      end: 5875000000
      step: 2000000
    - name: "900MHz Control"
      start: 900000000
      end: 930000000
      step: 500000

  # Detection thresholds
  power_threshold_db: -50
  persistence_frames: 5

  # Known signatures
  signatures:
    dji_lightbridge:
      pattern: "spread_spectrum"
      bandwidth: 20000000
    dji_ocusync:
      pattern: "frequency_hopping"
      bandwidth: 40000000
    analog_video:
      pattern: "continuous"
      bandwidth: 8000000
```

### Assembly Instructions

1. **Prepare Enclosure**

   ```
   ┌────────────────────────────────────────┐
   │              Front Panel               │
   │  ┌───────────┐     ┌───────────┐      │
   │  │  HQ Cam   │     │  Wide Cam │      │
   │  │ (telephoto)│     │ (optional)│      │
   │  └───────────┘     └───────────┘      │
   │                                        │
   │        ┌─────────────────┐            │
   │        │   Mic Grille    │            │
   │        └─────────────────┘            │
   └────────────────────────────────────────┘
   ```

2. **Mount Pan-Tilt System**
   - Secure base to mounting pole
   - Attach enclosure to pan-tilt platform
   - Connect servo cables (shielded recommended)

3. **Internal Layout**

   ```
   ┌────────────────────────────────────────┐
   │  ┌──────────┐   ┌──────────────────┐  │
   │  │ RTL-SDR  │   │   Raspberry Pi 5  │  │
   │  │          │   │  ┌────────────┐  │  │
   │  └──────────┘   │  │ Coral M.2  │  │  │
   │                 │  └────────────┘  │  │
   │  ┌──────────┐   └──────────────────┘  │
   │  │   SSD    │                         │
   │  └──────────┘   ┌──────────────────┐  │
   │                 │     PoE+ HAT     │  │
   │  [Antenna       └──────────────────┘  │
   │   Feedthrough]                        │
   └────────────────────────────────────────┘
   ```

4. **RF Antenna Installation**
   - Use N-type or SMA feedthrough
   - Mount antenna externally for best reception
   - Keep antenna cable short (<1m)

### Performance Benchmarks

| Metric                    | Value               |
| ------------------------- | ------------------- |
| Inference Time            | 15-25ms (Coral M.2) |
| End-to-End Latency        | 40-60ms             |
| Memory Usage              | ~600MB              |
| CPU Usage                 | 40-60%              |
| Visual Detection Accuracy | 90-95%              |
| RF Detection Range        | 500m-2km            |
| Audio Detection Range     | 50-200m             |

### Commercial Alternatives

| Product              | Price    | Comparison                          |
| -------------------- | -------- | ----------------------------------- |
| Dedrone DroneTracker | $20,000+ | Enterprise features, support        |
| DroneShield RfOne    | $15,000+ | RF-only, longer range               |
| Robin Radar ELVIRA   | $50,000+ | 3D radar, bird/drone classification |

---

## SkyWatch Mobile

**SKU:** SW-MOB-001 **Target Market:** Security patrols, event staff **Price
Range:** $200-500 **Phase:** Series A (Q2 2026)

### Overview

Portable detection unit for mobile operations. Battery-powered with touchscreen
interface, designed for handheld or vehicle-mounted use.

### Specifications

| Specification     | Value                         |
| ----------------- | ----------------------------- |
| Detection Range   | 100-300m                      |
| Processing Speed  | 15-25 FPS                     |
| Power Consumption | 6-12W                         |
| Battery Life      | 3-5 hours                     |
| Operating Temp    | -10°C to 50°C                 |
| Dimensions        | 220 × 150 × 40mm              |
| Weight            | ~800g with battery            |
| Connectivity      | WiFi, Bluetooth, optional LTE |

### Bill of Materials

| Item                    | Specification           | Qty | Unit Cost | Total       | Supplier     |
| ----------------------- | ----------------------- | --- | --------- | ----------- | ------------ |
| Raspberry Pi 4          | 2GB RAM                 | 1   | $45.00    | $45.00      | Raspberry Pi |
| Pi Camera Module v3     | 12MP, autofocus         | 1   | $35.00    | $35.00      | Raspberry Pi |
| Coral USB Accelerator   | Edge TPU                | 1   | $59.99    | $59.99      | Coral.ai     |
| Official 7" Touchscreen | 800×480, capacitive     | 1   | $60.00    | $60.00      | Raspberry Pi |
| PiJuice HAT             | Battery management      | 1   | $50.00    | $50.00      | PiSupply     |
| LiPo Battery            | 12000mAh, 3.7V          | 1   | $30.00    | $30.00      | Various      |
| Rugged Case             | Pelican 1150 or similar | 1   | $40.00    | $40.00      | Pelican      |
| Foam Insert             | Custom cut              | 1   | $10.00    | $10.00      | DIY          |
| Shoulder Strap          | Quick-release           | 1   | $15.00    | $15.00      | Amazon       |
| USB-C PD Charger        | 45W                     | 1   | $25.00    | $25.00      | Anker        |
| **TOTAL**               |                         |     |           | **$370.99** |              |

### Optional Accessories

| Item             | Purpose              | Cost    |
| ---------------- | -------------------- | ------- |
| GPS module       | Location logging     | $15     |
| LTE USB modem    | Remote connectivity  | $50-100 |
| Vibration motor  | Haptic alerts        | $5      |
| External speaker | Audio alerts         | $15     |
| Vehicle mount    | Dashboard/windshield | $30     |
| Chest harness    | Hands-free carrying  | $40     |

### Configuration

**Mobile Configuration (mobile.yaml):**

```yaml
# SkyWatch Mobile - Portable Configuration
camera_type: picamera
engine_type: coral

capture:
  width: 640
  height: 480
  fps: 25
  buffer_size: 2

inference:
  model_path: "models/drone_detector.tflite"
  input_size: 320
  confidence_threshold: 0.5
  use_coral: true

tracker_type: kalman
tracker:
  max_disappeared: 20
  max_distance: 100.0

# Mobile-specific settings
mobile:
  battery_monitoring: true
  low_battery_threshold: 20
  critical_battery_threshold: 10
  auto_sleep_minutes: 5
  wake_on_motion: true

# Display (touchscreen)
display:
  headless: false
  fullscreen: true
  show_fps: true
  show_drone_score: true
  show_track_id: true
  show_battery: true
  touch_enabled: true
  ui_scale: 1.2 # Larger for outdoor visibility

# Alerts
alert:
  vibration_enabled: true
  vibration_pin: 18
  vibration_pattern: [100, 50, 100] # on, off, on (ms)
  audio_enabled: true
  audio_volume: 80
  alert_sound: "alert.wav"

# GPS logging
gps:
  enabled: true
  device: /dev/ttyUSB0
  log_interval: 5 # seconds

# Power management
power:
  performance_mode: balanced # low, balanced, high
  reduce_fps_on_battery: true
  battery_fps: 15
  disable_streaming_on_battery: true

logging:
  level: INFO
  log_file: "/home/pi/detections/mobile.log"
```

### Assembly Instructions

1. **Prepare Case**
   - Cut foam insert for components
   - Drill hole for camera lens
   - Add ventilation slots

2. **Display Assembly**

   ```
   ┌────────────────────────────────────┐
   │         7" Touchscreen             │
   │  ┌──────────────────────────────┐  │
   │  │                              │  │
   │  │      Detection View          │  │
   │  │                              │  │
   │  │   [Drone detected: 85%]     │  │
   │  │   [Distance: ~120m]          │  │
   │  │                              │  │
   │  ├──────────────────────────────┤  │
   │  │ [Status] [Battery] [Menu]   │  │
   │  └──────────────────────────────┘  │
   └────────────────────────────────────┘
   ```

3. **Internal Layout**
   ```
   ┌────────────────────────────────────┐
   │  Camera ○                          │
   │  ┌──────────────────────────────┐  │
   │  │         Pi 4 + Screen         │  │
   │  └──────────────────────────────┘  │
   │  ┌──────────┐  ┌───────────────┐  │
   │  │ PiJuice  │  │   Battery     │  │
   │  │   HAT    │  │  (12000mAh)   │  │
   │  └──────────┘  └───────────────┘  │
   │  ┌───────────────────────────────┐ │
   │  │         Coral USB             │ │
   │  └───────────────────────────────┘ │
   └────────────────────────────────────┘
   ```

### User Interface

**Main Screen:**

```
┌─────────────────────────────────────────┐
│ SkyWatch Mobile          🔋 78%   📡 OK │
├─────────────────────────────────────────┤
│                                         │
│    ┌───────────────────────────────┐    │
│    │                               │    │
│    │      [LIVE CAMERA FEED]       │    │
│    │                               │    │
│    │    ╔═══════╗                  │    │
│    │    ║ DRONE ║ ← 87% conf       │    │
│    │    ╚═══════╝   ~145m          │    │
│    │                               │    │
│    └───────────────────────────────┘    │
│                                         │
│  Status: DETECTING    Tracks: 1         │
├─────────────────────────────────────────┤
│  [📍 Log] [📷 Capture] [⚙️ Settings]    │
└─────────────────────────────────────────┘
```

### Commercial Alternatives

| Product              | Price    | Comparison                      |
| -------------------- | -------- | ------------------------------- |
| DroneShield DroneOpt | $10,000+ | Handheld RF detector            |
| Dedrone Portable     | $8,000+  | Briefcase form factor           |
| Smartphone apps      | $0-50    | Limited capability, visual only |

---

## SkyWatch Thermal

**SKU:** SW-THM-001 **Target Market:** 24/7 operations, night security **Price
Range:** $400-1,500 **Phase:** Series A (Q3 2026)

### Overview

Thermal imaging drone detector for all-light conditions. Combines visible and
thermal cameras for day/night detection with sensor fusion.

### Specifications

| Specification       | Value                                 |
| ------------------- | ------------------------------------- |
| Detection Range     | 100-500m (thermal), 50-300m (visible) |
| Processing Speed    | 15-30 FPS                             |
| Power Consumption   | 8-15W                                 |
| Operating Temp      | -20°C to 60°C                         |
| Thermal Resolution  | 160×120 (budget) to 320×256 (pro)     |
| Thermal Sensitivity | <50mK NETD                            |

### Bill of Materials (Budget Tier)

| Item                   | Specification      | Qty | Unit Cost | Total       | Supplier     |
| ---------------------- | ------------------ | --- | --------- | ----------- | ------------ |
| Raspberry Pi 4         | 4GB RAM            | 1   | $55.00    | $55.00      | Raspberry Pi |
| FLIR Lepton 3.5        | 160×120, 8.7Hz     | 1   | $199.00   | $199.00     | GroupGets    |
| Lepton Breakout Board  | PureThermal 2      | 1   | $49.00    | $49.00      | GroupGets    |
| Pi Camera v3           | Visible, low-light | 1   | $35.00    | $35.00      | Raspberry Pi |
| Coral USB Accelerator  | Edge TPU           | 1   | $59.99    | $59.99      | Coral.ai     |
| Weatherproof Enclosure | IP65, ventilated   | 1   | $40.00    | $40.00      | Polycase     |
| Germanium Window       | 25mm, AR coated    | 1   | $30.00    | $30.00      | Thorlabs     |
| **TOTAL (Budget)**     |                    |     |           | **$467.99** |              |

### Bill of Materials (Professional Tier)

| Item                  | Specification   | Qty | Unit Cost | Total         | Supplier     |
| --------------------- | --------------- | --- | --------- | ------------- | ------------ |
| Raspberry Pi 5        | 8GB RAM         | 1   | $80.00    | $80.00        | Raspberry Pi |
| FLIR Boson 320        | 320×256, 60Hz   | 1   | $800.00   | $800.00       | FLIR         |
| Boson Interface Board | USB-C           | 1   | $100.00   | $100.00       | FLIR         |
| Pi Camera HQ          | 12.3MP          | 1   | $50.00    | $50.00        | Raspberry Pi |
| 16mm Lens             | C-mount         | 1   | $50.00    | $50.00        | Arducam      |
| Coral M.2 Accelerator | Dual TPU        | 1   | $35.00    | $35.00        | Coral.ai     |
| M.2 HAT               | PCIe adapter    | 1   | $15.00    | $15.00        | Raspberry Pi |
| Industrial Enclosure  | IP66            | 1   | $80.00    | $80.00        | Polycase     |
| Germanium Window      | 50mm, AR coated | 1   | $80.00    | $80.00        | Thorlabs     |
| **TOTAL (Pro)**       |                 |     |           | **$1,370.00** |              |

### Configuration

**Thermal Configuration (thermal.yaml):**

```yaml
# SkyWatch Thermal - Dual Sensor Configuration
camera_type: dual_sensor
engine_type: coral

# Thermal sensor settings
thermal:
  enabled: true
  device: /dev/video1 # PureThermal
  resolution: [160, 120]
  fps: 9
  temperature_range: [-10, 140]
  colormap: "ironbow"
  auto_ffc: true # Flat-field correction
  ffc_interval: 300 # seconds

# Visible sensor settings
visible:
  enabled: true
  device: /dev/video0
  resolution: [640, 480]
  fps: 30

# Sensor fusion
fusion:
  enabled: true
  mode: weighted # weighted, thermal_priority, visible_priority
  thermal_weight: 0.6
  visible_weight: 0.4
  alignment: auto # auto, manual
  output_resolution: [640, 480]

# Thermal-specific inference
inference:
  model_path: "models/drone_thermal_rgbt.tflite"
  input_size: 320
  input_channels: 4 # RGBT
  confidence_threshold: 0.45
  use_coral: true

# Thermal detection enhancements
thermal_detection:
  hot_spot_threshold: 35 # Celsius
  hot_spot_min_area: 50 # pixels
  temperature_anomaly: true
  background_subtraction: true

# Temperature alarms
temperature_alerts:
  enabled: true
  drone_temp_min: 35
  drone_temp_max: 80
  alert_on_anomaly: true

logging:
  level: INFO
  log_thermal_temps: true
```

### Thermal Detection Pipeline

```
┌────────────────────────────────────────────────────────────┐
│                   Thermal Detection Pipeline                │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐      ┌─────────────┐      ┌───────────┐  │
│  │   Thermal   │      │   Visible   │      │   Fusion  │  │
│  │   Camera    │─────►│   Camera    │─────►│   Engine  │  │
│  │  (160×120)  │      │  (640×480)  │      │           │  │
│  └─────────────┘      └─────────────┘      └─────┬─────┘  │
│         │                    │                    │        │
│         ▼                    ▼                    ▼        │
│  ┌─────────────┐      ┌─────────────┐      ┌───────────┐  │
│  │  Radiometry │      │   Color     │      │   RGBT    │  │
│  │  (°C temps) │      │   (RGB)     │      │  Tensor   │  │
│  └─────────────┘      └─────────────┘      └─────┬─────┘  │
│                                                   │        │
│                                                   ▼        │
│                                           ┌───────────┐   │
│                                           │   Model   │   │
│                                           │  (Coral)  │   │
│                                           └─────┬─────┘   │
│                                                 │         │
│         ┌───────────────────────────────────────┘         │
│         ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                   Classification                      │ │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │ │
│  │  │ Drone  │  │ Bird   │  │Aircraft│  │Unknown │    │ │
│  │  │(40-80°C)│  │(38-42°C)│  │(varies)│  │        │    │ │
│  │  └────────┘  └────────┘  └────────┘  └────────┘    │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Commercial Alternatives

| Product         | Price    | Comparison                  |
| --------------- | -------- | --------------------------- |
| FLIR Scout TK   | $600     | Handheld thermal, no AI     |
| DJI Mavic 3T    | $4,800   | Drone-mounted thermal       |
| AXIS Q1961-TE   | $5,000+  | Fixed thermal camera, no AI |
| Dedrone Thermal | $10,000+ | Integrated C-UAS solution   |

---

## SkyWatch Marine

**SKU:** SW-MAR-001 **Target Market:** Vessels, marinas, coastal facilities
**Price Range:** $600-2,000 **Phase:** Series A (Q4 2026)

### Overview

Ruggedized detection system for maritime environments. Features gyro
stabilization, salt-resistant enclosure, and NMEA integration for chart
plotters.

### Specifications

| Specification     | Value                              |
| ----------------- | ---------------------------------- |
| Detection Range   | 200-800m                           |
| Processing Speed  | 20-30 FPS                          |
| Power Input       | 12V DC (10-16V range)              |
| Power Consumption | 8-15W                              |
| Operating Temp    | -20°C to 60°C                      |
| IP Rating         | IP67                               |
| Stabilization     | 2-axis gyro, ±30° roll, ±20° pitch |
| NMEA Output       | NMEA 0183, NMEA 2000 (optional)    |

### Bill of Materials

| Item                  | Specification        | Qty | Unit Cost | Total       | Supplier           |
| --------------------- | -------------------- | --- | --------- | ----------- | ------------------ |
| Raspberry Pi 4        | 4GB RAM              | 1   | $55.00    | $55.00      | Raspberry Pi       |
| Pi Camera HQ          | 12.3MP, C-mount      | 1   | $50.00    | $50.00      | Raspberry Pi       |
| Wide Angle Lens       | 6mm, f/1.2           | 1   | $40.00    | $40.00      | Arducam            |
| Coral USB Accelerator | Edge TPU             | 1   | $59.99    | $59.99      | Coral.ai           |
| Gyro Stabilizer       | 2-axis, brushless    | 1   | $150.00   | $150.00     | BaseCam, SimpleBGC |
| Marine Enclosure      | IP67, aluminum       | 1   | $120.00   | $120.00     | Polycase           |
| DC-DC Converter       | 12V→5V, 5A, isolated | 1   | $30.00    | $30.00      | Pololu             |
| NMEA Interface        | USB-RS422            | 1   | $40.00    | $40.00      | Actisense          |
| Marine Antenna        | WiFi, N-type         | 1   | $50.00    | $50.00      | Ubiquiti           |
| Cable Glands          | M20, IP68            | 5   | $5.00     | $25.00      | Various            |
| Conformal Coating     | PCB protection       | 1   | $20.00    | $20.00      | MG Chemicals       |
| **TOTAL**             |                      |     |           | **$639.99** |                    |

### Configuration

**Marine Configuration (marine.yaml):**

```yaml
# SkyWatch Marine - Maritime Configuration
camera_type: picamera_hq
engine_type: coral

capture:
  width: 1280
  height: 720
  fps: 30
  buffer_size: 3

inference:
  model_path: "models/drone_detector.tflite"
  input_size: 416
  confidence_threshold: 0.5
  use_coral: true

# Marine-specific settings
environment: marine

# Gyro stabilization
stabilization:
  enabled: true
  controller: simplebgc
  serial_port: /dev/ttyUSB0
  max_roll: 30
  max_pitch: 20
  follow_mode: false
  pid_p: 15
  pid_i: 0.02
  pid_d: 8

# NMEA output
nmea:
  enabled: true
  output_port: /dev/ttyUSB1
  baud_rate: 38400
  sentences:
    - type: "$PDRN" # Custom drone detection
      fields: [time, lat, lon, distance, bearing, confidence]
    - type: "$PSTS" # System status
      fields: [status, detections, battery]

# AIS correlation
ais:
  enabled: true
  input_port: /dev/ttyUSB2
  correlate_targets: true
  ignore_ais_altitudes: [0, 500] # Ignore targets 0-500ft

# Power management
power:
  input_voltage: 12
  brownout_voltage: 10.5
  overvoltage_limit: 16.0
  brownout_action: "reduce_power"

# Environmental monitoring
environment_monitor:
  temperature_sensor: true
  humidity_sensor: true
  max_internal_temp: 70
  shutdown_temp: 80

alert:
  chart_plotter_overlay: true
  bridge_alarm_pin: 18
  alarm_duration: 5.0
```

### NMEA Sentence Format

**Custom Drone Detection ($PDRN):**

```
$PDRN,HHMMSS,DDMM.MMM,N,DDDMM.MMM,W,DDD.D,BBB.B,CC*XX

Fields:
  HHMMSS      - UTC time
  DDMM.MMM,N  - Latitude
  DDDMM.MMM,W - Longitude
  DDD.D       - Distance (meters)
  BBB.B       - Bearing (degrees true)
  CC          - Confidence (0-99)
  *XX         - Checksum

Example:
$PDRN,143052,3744.123,N,12223.456,W,245.5,087.3,85*7A
```

### Wiring Diagram

```
                    VESSEL 12V DC
                         │
                         ▼
┌────────────────────────┴────────────────────────┐
│                 DC-DC Converter                  │
│              12V → 5V (isolated)                │
└────────────────────────┬────────────────────────┘
                         │ 5V
                         ▼
┌─────────────────────────────────────────────────┐
│              SkyWatch Marine Unit                │
│                                                  │
│  ┌────────┐  ┌────────┐  ┌────────────────┐    │
│  │  Pi 4  │  │ Coral  │  │ Gyro Controller│    │
│  │        │  │  USB   │  │   (SimpleBGC)  │    │
│  └───┬────┘  └────────┘  └───────┬────────┘    │
│      │                           │              │
│      │ USB                       │ Serial       │
│      ▼                           ▼              │
│  ┌────────┐               ┌────────────────┐   │
│  │ NMEA   │               │   Stabilized   │   │
│  │ Bridge │               │    Platform    │   │
│  └───┬────┘               │  ┌──────────┐  │   │
│      │                    │  │  Camera  │  │   │
│      ▼                    │  └──────────┘  │   │
│  ┌────────────────┐       └────────────────┘   │
│  │  Chart Plotter │                             │
│  │    (NMEA In)   │                             │
│  └────────────────┘                             │
└─────────────────────────────────────────────────┘
```

### Commercial Alternatives

| Product             | Price    | Comparison                     |
| ------------------- | -------- | ------------------------------ |
| Raymarine Quantum 2 | $2,500+  | Radar only, no drone detection |
| FLIR MD-324         | $5,000+  | Thermal camera, no AI          |
| Sea Machines AI     | $50,000+ | Full autonomous system         |

---

## SkyWatch Mesh

**SKU:** SW-MESH-001 **Target Market:** Large perimeters, farms, industrial
sites **Price Range:** $500-2,000/node + central **Phase:** Series A (Q4 2026)

### Overview

Distributed detection network with multiple nodes and central aggregation.
Provides wide-area coverage with sensor fusion across nodes.

### Specifications (Per Node)

| Specification           | Value                   |
| ----------------------- | ----------------------- |
| Detection Range         | 100-200m per node       |
| Processing Speed        | 15-25 FPS               |
| Power                   | PoE (802.3af) or 12V DC |
| Power Consumption       | 5-10W                   |
| Communication           | Ethernet, WiFi mesh     |
| Node-to-Central Latency | <100ms                  |

### Bill of Materials (Per Node)

| Item                   | Specification | Qty | Unit Cost | Total       | Supplier     |
| ---------------------- | ------------- | --- | --------- | ----------- | ------------ |
| Raspberry Pi 4         | 2GB RAM       | 1   | $45.00    | $45.00      | Raspberry Pi |
| Pi Camera v3           | 12MP          | 1   | $35.00    | $35.00      | Raspberry Pi |
| PoE HAT                | 802.3af       | 1   | $20.00    | $20.00      | Raspberry Pi |
| Weatherproof Enclosure | IP65          | 1   | $40.00    | $40.00      | Polycase     |
| Mounting Bracket       | Pole mount    | 1   | $15.00    | $15.00      | Amazon       |
| Silica Gel             | 10g × 3       | 1   | $3.00     | $3.00       | Amazon       |
| **NODE TOTAL**         |               |     |           | **$158.00** |              |

### Bill of Materials (Central Server)

| Item              | Specification   | Qty | Unit Cost | Total       | Supplier     |
| ----------------- | --------------- | --- | --------- | ----------- | ------------ |
| Raspberry Pi 5    | 8GB RAM         | 1   | $80.00    | $80.00      | Raspberry Pi |
| NVMe SSD          | 256GB           | 1   | $40.00    | $40.00      | Samsung      |
| PoE Switch        | 8-port, 802.3af | 1   | $120.00   | $120.00     | Ubiquiti     |
| UPS               | 450VA           | 1   | $80.00    | $80.00      | APC          |
| Rack/Enclosure    | Wall mount      | 1   | $50.00    | $50.00      | Various      |
| **CENTRAL TOTAL** |                 |     |           | **$370.00** |              |

### System Costs by Coverage

| Coverage  | Nodes | Node Cost    | Central | Total            |
| --------- | ----- | ------------ | ------- | ---------------- |
| 1 acre    | 2-3   | $316-474     | $370    | **$686-844**     |
| 5 acres   | 4-6   | $632-948     | $370    | **$1,002-1,318** |
| 20 acres  | 8-12  | $1,264-1,896 | $370    | **$1,634-2,266** |
| 100 acres | 15-25 | $2,370-3,950 | $370    | **$2,740-4,320** |

### Configuration

**Node Configuration (mesh-node.yaml):**

```yaml
# SkyWatch Mesh - Node Configuration
node:
  id: "node-north-01"
  location: "North Gate"
  coordinates: [34.0522, -118.2437]
  fov_direction: 180 # degrees from north

camera_type: picamera
engine_type: tflite # Local inference for low latency

capture:
  width: 640
  height: 480
  fps: 20

inference:
  model_path: "models/drone_detector_lite.tflite"
  input_size: 256
  confidence_threshold: 0.4

# Central server connection
central:
  address: "192.168.1.100"
  port: 5000
  protocol: websocket
  heartbeat_interval: 10
  reconnect_delay: 5

# What to send to central
reporting:
  send_detections: true
  send_frames: false # Bandwidth optimization
  send_crops: true # Send cropped detection images
  crop_size: [128, 128]
  detection_debounce: 0.5 # seconds

logging:
  level: INFO
```

**Central Server Configuration (mesh-central.yaml):**

```yaml
# SkyWatch Mesh - Central Server Configuration
central:
  listen_address: "0.0.0.0"
  listen_port: 5000
  max_nodes: 50

# Registered nodes
nodes:
  - id: "node-north-01"
    address: "192.168.1.101"
    location: "North Gate"
    fov_direction: 180
  - id: "node-east-01"
    address: "192.168.1.102"
    location: "East Fence"
    fov_direction: 90
  - id: "node-south-01"
    address: "192.168.1.103"
    location: "South Entrance"
    fov_direction: 0
  - id: "node-west-01"
    address: "192.168.1.104"
    location: "West Perimeter"
    fov_direction: 270

# Multi-node fusion
fusion:
  enabled: true
  min_nodes_for_confirm: 2
  confidence_boost_per_node: 0.1
  triangulation: true
  max_position_error: 50 # meters

# Health monitoring
health:
  check_interval: 30
  node_timeout: 60
  alert_on_node_down: true
  auto_recovery: true

# Alerts
alert:
  webhook_url: "https://api.example.com/mesh-alert"
  aggregate_alerts: true
  aggregation_window: 5 # seconds

# Dashboard
dashboard:
  enabled: true
  port: 8080
  auth_required: true
  map_enabled: true

# Storage
storage:
  path: "/mnt/ssd/mesh-data/"
  retention_days: 30
  compress_old: true

logging:
  level: INFO
  json_format: true
```

### Network Architecture

```
                           Internet/WAN
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                        CENTRAL SERVER                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Fusion Engine                     │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │    │
│  │  │ Node 1  │  │ Node 2  │  │ Node 3  │  │ Node N │ │    │
│  │  │ Data    │  │ Data    │  │ Data    │  │ Data   │ │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └───┬────┘ │    │
│  │       └────────────┴───────┬────┴───────────┘      │    │
│  │                            ▼                        │    │
│  │                    ┌──────────────┐                │    │
│  │                    │ Triangulation │                │    │
│  │                    │   & Fusion    │                │    │
│  │                    └──────┬───────┘                │    │
│  │                           ▼                         │    │
│  │                    ┌──────────────┐                │    │
│  │                    │    Alerts    │                │    │
│  │                    └──────────────┘                │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│              PoE Switch (802.3af/at)                        │
└──────────────┬───────────────┬───────────────┬──────────────┘
               │               │               │
               ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │  Node 1  │    │  Node 2  │    │  Node 3  │
        │  (North) │    │  (East)  │    │  (South) │
        └──────────┘    └──────────┘    └──────────┘
```

### Commercial Alternatives

| Product             | Price          | Comparison                   |
| ------------------- | -------------- | ---------------------------- |
| Dedrone City        | $100,000+/year | Cloud-based, enterprise      |
| Hikvision + AI      | $500/node      | Generic detection, no fusion |
| Axis Camera Station | $1,000+        | VMS only, add-on AI needed   |

---

## SkyWatch Enterprise

**SKU:** SW-ENT-001 **Target Market:** Corporate campuses, critical
infrastructure **Price Range:** $5,000-20,000 **Phase:** Series A (2027)

### Overview

Full-scale enterprise deployment with multi-sensor integration, SOC
connectivity, compliance logging, and professional management dashboard.

### Specifications

| Specification   | Value                                 |
| --------------- | ------------------------------------- |
| Detection Range | 1-5km (multi-sensor)                  |
| Sensors         | Visual, Thermal, RF, Radar (optional) |
| Uptime SLA      | 99.9%                                 |
| Data Retention  | 90 days (configurable)                |
| Users           | Unlimited                             |
| API             | REST, WebSocket, MQTT                 |
| Integrations    | SIEM, VMS, Access Control             |

### Bill of Materials

| Item                   | Specification      | Qty | Unit Cost | Total          | Supplier       |
| ---------------------- | ------------------ | --- | --------- | -------------- | -------------- |
| Server                 | 1U rackmount, 32GB | 1   | $800.00   | $800.00        | Dell/HP        |
| Detection Nodes        | SkyWatch Standard  | 10  | $200.00   | $2,000.00      | Internal       |
| PTZ Cameras            | 30× zoom, PoE      | 4   | $500.00   | $2,000.00      | Hikvision/Axis |
| RF Detection Array     | RTL-SDR × 4        | 1   | $200.00   | $200.00        | RTL-SDR.com    |
| Directional Antennas   | Yagi, 2.4/5.8GHz   | 4   | $100.00   | $400.00        | L-Com          |
| Radar Unit (optional)  | Echodyne EchoGuard | 1   | $5,000.00 | $5,000.00      | Echodyne       |
| PoE Switch             | 24-port, managed   | 1   | $400.00   | $400.00        | Ubiquiti       |
| UPS                    | 1500VA, rack       | 1   | $500.00   | $500.00        | APC            |
| Installation           | Professional       | 1   | $2,000.00 | $2,000.00      | Contractor     |
| **TOTAL (w/o Radar)**  |                    |     |           | **$8,300.00**  |                |
| **TOTAL (with Radar)** |                    |     |           | **$13,300.00** |                |

### Configuration

**Enterprise Configuration (enterprise.yaml):**

```yaml
# SkyWatch Enterprise - Full Configuration
enterprise:
  name: "ACME Corp Drone Detection"
  site_id: "ACME-HQ-001"
  license: "ENT-XXXXX-XXXXX"

# Multi-sensor array
sensors:
  visual_nodes:
    count: 10
    model: "skywatch-standard"

  ptz_cameras:
    count: 4
    type: "hikvision_ds2df8"
    auto_tracking: true

  rf_detection:
    enabled: true
    antennas: 4
    coverage: 360
    triangulation: true

  radar:
    enabled: true
    type: "echodyne_echoguard"
    range: 3000 # meters
    elevation: [-10, 60]

# Fusion engine
fusion:
  algorithm: "bayesian"
  confidence_threshold: 0.7
  track_correlation_distance: 100 # meters
  track_timeout: 30 # seconds

# Enterprise integrations
integrations:
  siem:
    enabled: true
    type: "splunk"
    host: "splunk.acme.local"
    token: "${SPLUNK_TOKEN}"
    index: "security_drone"

  vms:
    enabled: true
    type: "milestone"
    host: "milestone.acme.local"

  access_control:
    enabled: true
    type: "lenel"
    host: "lenel.acme.local"
    trigger_lockdown: true
    lockdown_zones: ["ZONE-A", "ZONE-B"]

# Compliance & audit
compliance:
  logging:
    enabled: true
    retention_days: 90
    encryption: true

  audit_trail:
    enabled: true
    log_user_actions: true
    log_config_changes: true

  reports:
    enabled: true
    schedule: "daily"
    recipients: ["security@acme.com"]

# High availability
ha:
  enabled: true
  failover_server: "skywatch-backup.acme.local"
  heartbeat_interval: 5
  failover_timeout: 30

# Dashboard
dashboard:
  enabled: true
  port: 443
  ssl: true
  cert_path: "/etc/ssl/skywatch.crt"
  key_path: "/etc/ssl/skywatch.key"

  auth:
    type: "ldap"
    server: "ldap.acme.local"
    base_dn: "ou=users,dc=acme,dc=local"

  map:
    enabled: true
    type: "custom"
    image: "/var/www/site_map.png"

# API
api:
  enabled: true
  port: 8443
  rate_limit: 1000 # requests/minute

  webhooks:
    - name: "soc_alert"
      url: "https://soc.acme.local/api/alert"
      events: ["drone_detected", "track_lost"]
    - name: "slack"
      url: "https://hooks.slack.com/services/XXX"
      events: ["drone_detected"]
```

### Dashboard Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SkyWatch Enterprise - ACME Corp HQ                    👤 Admin  [⚙️]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │                         SITE MAP                                   │ │
│  │                                                                     │ │
│  │        [N1]●────────────────●[N2]                                  │ │
│  │          │    Building A      │                                     │ │
│  │          │   ┌──────────┐    │                                     │ │
│  │          │   │          │    │                                     │ │
│  │   [N4]●──┤   │  🚁 DRONE │    ├──●[N3]                             │ │
│  │          │   │  (Track 7)│    │       ← 87% confidence              │ │
│  │          │   └──────────┘    │         Est. distance: 340m         │ │
│  │          │                    │                                     │ │
│  │        [N5]●────────────────●[N6]                                  │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ Active Tracks: 1 │  │ Alerts Today: 3  │  │ System: ✅ ONLINE │      │
│  │ ───────────────  │  │ ───────────────  │  │ ─────────────────│      │
│  │ Track 7: 87%     │  │ 09:15 - Drone    │  │ Nodes: 10/10     │      │
│  │ Bearing: 045°    │  │ 11:42 - Drone    │  │ PTZ: 4/4         │      │
│  │ Distance: 340m   │  │ 14:23 - Bird(FP) │  │ RF: ✅           │      │
│  │ Speed: 12 m/s    │  │                  │  │ Radar: ✅        │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                          │
│  [📹 Live View] [📊 Analytics] [⚠️ Alerts] [📋 Reports] [⚙️ Config]    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Commercial Alternatives

| Product                 | Price     | Comparison                    |
| ----------------------- | --------- | ----------------------------- |
| Dedrone DedroneTracker  | $50,000+  | Similar features, established |
| DroneShield DroneSentry | $100,000+ | Military-grade                |
| Fortem SkyDome          | $500,000+ | Includes defeat capability    |
| Robin Radar IRIS        | $150,000+ | 3D radar focused              |

---

# Detection + Countermeasure Products (NetSentry Line)

## NetSentry Lite

**SKU:** NS-LITE-001 **Target Market:** Makers, hobbyists, testing **Price
Range:** $150-400 **Phase:** Seed (Q2 2026)

### Overview

Entry-level countermeasure system with spring-loaded net launcher. Designed for
testing and proof-of-concept deployments.

### Specifications

| Specification   | Value         |
| --------------- | ------------- |
| Detection Range | 50-100m       |
| Launch Range    | 5-15m         |
| Response Time   | 200-500ms     |
| Reload          | Manual        |
| Net Size        | 1.5m weighted |

### Bill of Materials

| Item             | Specification          | Qty | Unit Cost | Total       | Supplier       |
| ---------------- | ---------------------- | --- | --------- | ----------- | -------------- |
| Raspberry Pi 4   | 2GB RAM                | 1   | $45.00    | $45.00      | Raspberry Pi   |
| Pi Camera v2     | 8MP                    | 1   | $25.00    | $25.00      | Raspberry Pi   |
| Spring Mechanism | Custom, 50lb           | 1   | $35.00    | $35.00      | Hardware store |
| Nichrome Wire    | 28AWG, 1m              | 1   | $5.00     | $5.00       | Amazon         |
| MOSFET Module    | IRLZ44N                | 1   | $5.00     | $5.00       | Amazon         |
| Retaining Cord   | Nylon, 2mm             | 10m | $5.00     | $5.00       | Amazon         |
| Net              | 1.5m, weighted corners | 1   | $30.00    | $30.00      | Fishing supply |
| PVC Barrel       | 3" × 18"               | 1   | $15.00    | $15.00      | Hardware store |
| 12V Relay Module | Opto-isolated          | 1   | $5.00     | $5.00       | Amazon         |
| 12V Power Supply | 2A                     | 1   | $15.00    | $15.00      | Amazon         |
| Enclosure        | Weatherproof           | 1   | $25.00    | $25.00      | Amazon         |
| **TOTAL**        |                        |     |           | **$210.00** |                |

### Configuration

```yaml
# NetSentry Lite - Basic Countermeasure
camera_type: picamera
engine_type: tflite

targeting:
  max_targeting_distance_m: 20.0
  assumed_drone_size_m: 0.3
  min_confidence_for_lock: 0.7
  lock_timeout_seconds: 5.0

  # Fire net settings
  fire_net_enabled: true
  fire_net_min_confidence: 0.8
  fire_net_min_track_frames: 15
  fire_net_max_distance_m: 15.0
  fire_net_min_distance_m: 3.0
  fire_net_cooldown_seconds: 30.0
  fire_net_arm_required: true
  fire_net_gpio_pin: 17
```

---

## NetSentry Standard

**SKU:** NS-STD-001 **Target Market:** Property protection **Price Range:**
$400-800 **Phase:** Series A (Q3 2026)

### Overview

CO2-powered net launcher with faster response and longer range. Includes Coral
TPU for improved detection.

### Specifications

| Specification   | Value                     |
| --------------- | ------------------------- |
| Detection Range | 100-200m                  |
| Launch Range    | 15-30m                    |
| Response Time   | 50ms                      |
| Reload          | CO2 cartridge replacement |
| Net Size        | 2m weighted               |
| Cost per Shot   | $1-2                      |

### Bill of Materials

| Item                   | Specification | Qty | Unit Cost | Total       | Supplier        |
| ---------------------- | ------------- | --- | --------- | ----------- | --------------- |
| Raspberry Pi 4         | 4GB RAM       | 1   | $55.00    | $55.00      | Raspberry Pi    |
| Pi Camera HQ           | 12.3MP        | 1   | $50.00    | $50.00      | Raspberry Pi    |
| 8mm Lens               | C-mount       | 1   | $25.00    | $25.00      | Arducam         |
| Coral USB Accelerator  | Edge TPU      | 1   | $59.99    | $59.99      | Coral.ai        |
| CO2 Puncture Assembly  | 16g cartridge | 1   | $60.00    | $60.00      | Palmer Pursuit  |
| Solenoid Valve         | 12V, NC       | 1   | $30.00    | $30.00      | Amazon          |
| Expansion Chamber      | Aluminum      | 1   | $40.00    | $40.00      | Custom/3D print |
| Net                    | 2m, weighted  | 1   | $50.00    | $50.00      | Safety supply   |
| Barrel Assembly        | Aluminum, 4"  | 1   | $40.00    | $40.00      | Custom          |
| Relay Module           | Opto-isolated | 1   | $10.00    | $10.00      | Amazon          |
| 12V Power Supply       | 5A            | 1   | $20.00    | $20.00      | Amazon          |
| Weatherproof Enclosure | IP65          | 1   | $60.00    | $60.00      | Polycase        |
| **TOTAL**              |               |     |           | **$500.00** |                 |

### Configuration

```yaml
# NetSentry Standard - CO2 Configuration
camera_type: picamera_hq
engine_type: coral

inference:
  model_path: "models/drone_detector.tflite"
  input_size: 320
  confidence_threshold: 0.5
  use_coral: true

targeting:
  max_targeting_distance_m: 50.0
  assumed_drone_size_m: 0.3
  min_confidence_for_lock: 0.65
  lock_timeout_seconds: 5.0
  tracking_lead_factor: 1.2

  fire_net_enabled: true
  fire_net_min_confidence: 0.85
  fire_net_min_track_frames: 10
  fire_net_max_distance_m: 30.0
  fire_net_min_distance_m: 5.0
  fire_net_velocity_threshold_ms: 25.0
  fire_net_cooldown_seconds: 15.0
  fire_net_arm_required: true
  fire_net_gpio_pin: 17
```

---

## NetSentry Pro

**SKU:** NS-PRO-001 **Target Market:** Security professionals **Price Range:**
$800-2,000 **Phase:** Series A (Q4 2026)

### Overview

Professional pneumatic net launcher with pan-tilt tracking, global shutter
camera, and extended range.

### Specifications

| Specification   | Value                  |
| --------------- | ---------------------- |
| Detection Range | 200-500m               |
| Launch Range    | 25-50m                 |
| Response Time   | 50ms                   |
| Reload          | Air tank refill (free) |
| Net Size        | 3m auto-deploy         |
| Tracking        | Pan-tilt motorized     |

### Bill of Materials

| Item                    | Specification     | Qty | Unit Cost | Total         | Supplier     |
| ----------------------- | ----------------- | --- | --------- | ------------- | ------------ |
| Raspberry Pi 5          | 8GB RAM           | 1   | $80.00    | $80.00        | Raspberry Pi |
| Global Shutter Camera   | IMX296            | 1   | $50.00    | $50.00        | Raspberry Pi |
| Telephoto Lens          | 12mm, CS          | 1   | $80.00    | $80.00        | Arducam      |
| Coral M.2 Accelerator   | Dual TPU          | 1   | $35.00    | $35.00        | Coral.ai     |
| M.2 HAT                 | PCIe              | 1   | $15.00    | $15.00        | Raspberry Pi |
| Air Tank                | 48ci, 3000psi     | 1   | $100.00   | $100.00       | Paintball    |
| Regulator               | Adjustable output | 1   | $80.00    | $80.00        | Ninja        |
| Solenoid Valve          | MAC 35A           | 1   | $50.00    | $50.00        | MAC Valves   |
| Barrel Assembly         | Aluminum          | 1   | $60.00    | $60.00        | Custom       |
| Net System              | 3m, auto-deploy   | 1   | $120.00   | $120.00       | Custom       |
| Pan-Tilt Mount          | Heavy duty        | 1   | $150.00   | $150.00       | ServoCity    |
| Relay Module            | 4-channel         | 1   | $15.00    | $15.00        | Amazon       |
| Industrial Enclosure    | IP66              | 1   | $100.00   | $100.00       | Polycase     |
| UPS Battery             | 12V 7Ah           | 1   | $30.00    | $30.00        | Amazon       |
| Misc (cables, fittings) | Various           | 1   | $50.00    | $50.00        | Various      |
| **TOTAL**               |                   |     |           | **$1,015.00** |              |

### Configuration

```yaml
# NetSentry Pro - Professional Configuration
camera_type: global_shutter
engine_type: coral_m2

capture:
  width: 1456
  height: 1088
  fps: 60
  buffer_size: 3
  exposure_mode: auto
  shutter_speed_us: 5000 # Fast shutter for tracking

inference:
  model_path: "models/drone_detector_large.tflite"
  input_size: 640
  confidence_threshold: 0.4
  use_coral: true

tracker_type: kalman
tracker:
  max_disappeared: 60
  max_distance: 200.0
  process_noise: 0.3
  measurement_noise: 0.3

# Pan-tilt tracking
pan_tilt:
  enabled: true
  pan_servo_pin: 12
  tilt_servo_pin: 13
  pan_range: [-135, 135]
  tilt_range: [-45, 75]
  max_speed: 180 # degrees/second
  acceleration: 360
  prediction_enabled: true
  prediction_time: 0.5 # seconds ahead

targeting:
  max_targeting_distance_m: 100.0
  assumed_drone_size_m: 0.3
  min_confidence_for_lock: 0.6
  lock_timeout_seconds: 10.0
  tracking_lead_factor: 1.5

  fire_net_enabled: true
  fire_net_min_confidence: 0.85
  fire_net_min_track_frames: 10
  fire_net_max_distance_m: 50.0
  fire_net_min_distance_m: 5.0
  fire_net_velocity_threshold_ms: 30.0
  fire_net_cooldown_seconds: 10.0
  fire_net_arm_required: true
  fire_net_gpio_pin: 17

alert:
  webhook_url: "https://api.example.com/fire-event"
  log_all_fires: true
  video_clip_on_fire: true
```

---

# Consumer Products (SkySnare Line)

## SkySnare

**SKU:** SS-001 **Target Market:** Consumer/D2C, outdoor enthusiasts, property owners **Price:** $349 MSRP **Phase:** Seed (Q1 2026 Launch)

### Overview

Direct-to-consumer drone capture device. Handheld net launcher designed for personal property protection. Simple point-and-shoot operation with no technical knowledge required.

### Specifications

| Specification     | Value                  |
| ----------------- | ---------------------- |
| Launch Range      | 15-30m effective       |
| Net Size          | 2m × 2m (4 m²)         |
| Net Material      | HDPE/Nylon blend       |
| Mesh Size         | 40mm × 40mm            |
| Net Weight        | 85g                    |
| Reload Time       | 30 seconds             |
| Launcher Weight   | ~1.2kg                 |
| Power             | CO2 cartridge          |
| Operating Temp    | -10°C to 50°C          |

### Bill of Materials

| Item                  | Specification        | Qty | Unit Cost | Total       | Supplier        |
| --------------------- | -------------------- | --- | --------- | ----------- | --------------- |
| Launcher Body         | Injection molded ABS | 1   | $25.00    | $25.00      | Contract mfg    |
| CO2 Mechanism         | 12g cartridge system | 1   | $35.00    | $35.00      | Palmer Pursuit  |
| Net Assembly          | HDPE/Nylon, weighted | 1   | $20.00    | $20.00      | In-house        |
| Trigger Assembly      | Mechanical           | 1   | $15.00    | $15.00      | Contract mfg    |
| Safety Mechanism      | Dual-stage           | 1   | $10.00    | $10.00      | Contract mfg    |
| Barrel Assembly       | Aluminum, anodized   | 1   | $18.00    | $18.00      | CNC supplier    |
| Packaging             | Retail box, manual   | 1   | $8.00     | $8.00       | Print supplier  |
| CO2 Cartridges (3-pk) | 12g, included        | 1   | $4.00     | $4.00       | Various         |
| **TOTAL BOM**         |                      |     |           | **$135.00** |                 |

### Manufacturing & Pricing

| Cost Component     | Value      |
| ------------------ | ---------- |
| BOM Cost           | $135.00    |
| Labor Cost         | $9.72      |
| Machine Cost       | $3.00      |
| **Total COGS**     | **$147.72**|
| Markup             | 158%       |
| **MSRP**           | **$349.00**|
| Gross Margin       | 58%        |
| Assembly Time      | 1.04 hours |

### Market Data

| Metric                   | Value               |
| ------------------------ | ------------------- |
| Target Market            | $3.22B outdoor toy  |
| TAM                      | $1.68B              |
| Year 1 Unit Target       | 5,000 units         |
| Customer Acquisition     | $80-100             |
| Expected Return Rate     | 8-10%               |

### Included Accessories

- SkySnare launcher unit
- 3× CO2 cartridges
- 2× capture nets
- Quick-start guide
- Safety manual
- Carrying strap

### Safety Features

1. **Dual-stage trigger** - Prevents accidental discharge
2. **Muzzle guard** - Physical barrier until ready to fire
3. **Pressure indicator** - Shows CO2 status
4. **Training mode** - Dry-fire practice capability

### Commercial Alternatives

| Product           | Price     | Comparison                    |
| ----------------- | --------- | ----------------------------- |
| SkyWall Patrol    | $30,000+  | Professional, much larger     |
| Drone Defender    | $15,000+  | RF jammer, legal restrictions |
| DIY net launcher  | $50-200   | Unreliable, no support        |

---

# Enterprise Platforms (AeroNet)

## AeroNet Enterprise

**SKU:** AN-ENT-001 **Target Market:** Critical infrastructure, airports, prisons, military bases **Price:** $150K setup + $25K/month **Phase:** Series A (Q4 2026)

### Overview

Full-scale enterprise drone detection and response platform. Multi-sensor integration with centralized command and control. Designed for 24/7 operations with SOC integration.

### Specifications

| Specification       | Value                                 |
| ------------------- | ------------------------------------- |
| Detection Range     | 2-5 km (multi-sensor fusion)          |
| Coverage Area       | Up to 10 km² per installation         |
| Sensor Types        | Visual, Thermal, RF, Radar, Acoustic  |
| Response Time       | <120ms detection to alert             |
| Accuracy            | 99.5%                                 |
| False Positive Rate | <0.3%                                 |
| Concurrent Targets  | 50+                                   |
| Uptime SLA          | 99.9%                                 |
| API                 | REST, WebSocket, MQTT                 |

### System Components

| Component                | Quantity | Unit Cost | Total        |
| ------------------------ | -------- | --------- | ------------ |
| Detection Nodes          | 10-20    | $1,500    | $15,000-30K  |
| Central Server           | 1-2      | $5,000    | $5,000-10K   |
| PTZ Cameras              | 4-8      | $2,500    | $10,000-20K  |
| RF Detection Array       | 1        | $8,000    | $8,000       |
| Radar Unit (optional)    | 1        | $15,000   | $15,000      |
| Networking Equipment     | 1        | $5,000    | $5,000       |
| Installation & Training  | 1        | $20,000   | $20,000      |
| **Typical Total**        |          |           | **$80-120K** |

### Manufacturing & Pricing

| Cost Component          | Value        |
| ----------------------- | ------------ |
| Hardware BOM            | $50,000      |
| Labor (200 hours)       | $7,200       |
| Machine/Equipment       | $2,000       |
| **Total COGS**          | **$59,200**  |
| Markup                  | 200%         |
| **Setup Fee**           | **$150,000** |
| **Monthly SaaS**        | **$25,000**  |
| Target Margin           | 60%          |
| Assembly Time           | 216 hours    |

### Subscription Tiers

| Tier       | Monthly | Features                                |
| ---------- | ------- | --------------------------------------- |
| Standard   | $15K    | Detection, alerts, basic analytics      |
| Professional| $25K   | + Response coordination, API access     |
| Enterprise | $40K    | + Custom integrations, dedicated support|

### Integrations

- **SIEM:** Splunk, QRadar, Sentinel
- **VMS:** Milestone, Genetec, Avigilon
- **Access Control:** Lenel, CCURE, Genetec
- **C2 Systems:** Custom military integrations

### Commercial Alternatives

| Product            | Price        | Comparison                    |
| ------------------ | ------------ | ----------------------------- |
| Dedrone City       | $100K+/year  | Similar scope, cloud-based    |
| DroneShield        | $200K+       | RF-focused, less integration  |
| Fortem SkyDome     | $500K+       | Includes defeat capability    |

---

# Aerial Intercept Systems (RKV Line)

## RKV-M Mothership

**SKU:** RKV-M-001 **Target Market:** Military, critical infrastructure **Price Range:** $65,000-85,000 **Phase:** Series C (2029)

### Overview

Aerial VTOL platform serving as picket, relay, and interceptor launch platform. Ducted fan design for safe urban operations. Carries multiple net launcher pods.

### Specifications

| Specification        | Value                    |
| -------------------- | ------------------------ |
| Max Speed            | >150 km/h                |
| Hover Endurance      | 8-12 minutes             |
| Cruise Endurance     | 15-20 minutes            |
| Operating Altitude   | 0-500m AGL               |
| Max Altitude         | 1,000m AGL               |
| Time to Launch       | <3 seconds               |
| Intercept Range      | 500m from station        |
| Closure Rate         | >200 km/h                |
| Yaw Rate             | ±60°/s                   |
| Duct Diameter        | 600mm                    |
| Payload Capacity     | 4× net pods              |
| TRL                  | 7                        |

### Bill of Materials (Estimated)

| Item                    | Specification         | Qty | Unit Cost  | Total        |
| ----------------------- | --------------------- | --- | ---------- | ------------ |
| Carbon Fiber Airframe   | Custom layup          | 1   | $5,000     | $5,000       |
| Ducted Fan Assembly     | 600mm, 3-blade        | 1   | $3,500     | $3,500       |
| Motor System            | 16-20S HV outrunner   | 1   | $2,000     | $2,000       |
| Flight Controller       | Pixhawk 6X + sensors  | 1   | $1,500     | $1,500       |
| Avionics Package        | GPS, altimeter, IMU   | 1   | $2,500     | $2,500       |
| Communication System    | Mesh radio, video TX  | 1   | $3,000     | $3,000       |
| Net Pod Launchers       | Pneumatic, 4-pack     | 4   | $800       | $3,200       |
| Battery System          | 16S 22000mAh          | 2   | $1,200     | $2,400       |
| Targeting System        | Camera, processor     | 1   | $1,500     | $1,500       |
| Misc (wiring, mounts)   | Various               | 1   | $400       | $400         |
| **TOTAL BOM**           |                       |     |            | **$25,000**  |

### Manufacturing & Pricing

| Cost Component     | Value        |
| ------------------ | ------------ |
| BOM Cost           | $25,000      |
| Labor (83 hours)   | $3,236       |
| Machine Cost       | $1,500       |
| **Total COGS**     | **$29,736**  |
| Markup             | 220%         |
| **Est. Price**     | **$65,418**  |
| Target Margin      | 65%          |
| Assembly Time      | 83.2 hours   |

---

## RKV-I Interceptor

**SKU:** RKV-I-001 **Target Market:** Military, paired with RKV-M **Price Range:** $8,000-12,000 **Phase:** Series C (2029)

### Overview

Expendable/recoverable mini interceptor drone. Launched from RKV-M mothership or ground station. Carries single net payload for drone capture.

### Specifications

| Specification        | Value                    |
| -------------------- | ------------------------ |
| Max Speed            | >180 km/h                |
| Endurance            | 3-5 minutes              |
| Operating Range      | 500m from launcher       |
| Net Payload          | 3m × 3m capture net      |
| Guidance             | Visual + RF homing       |
| Recovery             | Parachute + locator      |
| Weight               | ~2 kg                    |
| Wingspan             | 400mm                    |
| Reusability          | 5-10 missions            |

### Bill of Materials (Estimated)

| Item                  | Specification       | Qty | Unit Cost | Total       |
| --------------------- | ------------------- | --- | --------- | ----------- |
| Airframe              | Carbon/foam hybrid  | 1   | $800      | $800        |
| Motor/ESC             | Brushless system    | 1   | $400      | $400        |
| Flight Controller     | F7 + GPS            | 1   | $300      | $300        |
| Targeting Camera      | Wide-angle HD       | 1   | $200      | $200        |
| Net Deployment System | Spring-loaded       | 1   | $500      | $500        |
| Net Assembly          | 3m Kevlar           | 1   | $400      | $400        |
| Battery               | 4S 2200mAh          | 1   | $100      | $100        |
| Recovery System       | Parachute + beacon  | 1   | $300      | $300        |
| Communication         | Video TX, control   | 1   | $500      | $500        |
| **TOTAL BOM**         |                     |     |           | **$3,500**  |

### Manufacturing & Pricing

| Cost Component     | Value       |
| ------------------ | ----------- |
| BOM Cost           | $3,500      |
| Labor (16 hours)   | $638        |
| Machine Cost       | $200        |
| **Total COGS**     | **$4,338**  |
| Markup             | 220%        |
| **Est. Price**     | **$9,543**  |
| Target Margin      | 65%         |
| Assembly Time      | 16.4 hours  |

---

## RKV-G Ground Station

**SKU:** RKV-G-001 **Target Market:** Military, mobile operations **Price Range:** $100,000-150,000 **Phase:** Series B (2028)

### Overview

Mobile ground control station and rover platform. Provides command and control for RKV-M and RKV-I systems. Includes mast-mounted sensors and logistics support.

### Specifications

| Specification        | Value                         |
| -------------------- | ----------------------------- |
| Platform             | 4×4 vehicle or trailer        |
| Mast Height          | 10-15m telescoping            |
| Sensor Suite         | Radar, EO/IR, RF              |
| Detection Range      | 5-10 km                       |
| Control Range        | 2 km (RKV-M), 500m (RKV-I)    |
| Power                | Generator + battery backup    |
| Crew                 | 2-3 operators                 |
| Setup Time           | <30 minutes                   |
| Operating Duration   | 24+ hours                     |

### Bill of Materials (Estimated)

| Item                    | Specification          | Qty | Unit Cost  | Total        |
| ----------------------- | ---------------------- | --- | ---------- | ------------ |
| Vehicle/Trailer Base    | Ruggedized             | 1   | $15,000    | $15,000      |
| Mast System             | 15m telescoping        | 1   | $8,000     | $8,000       |
| Radar Unit              | Compact surveillance   | 1   | $12,000    | $12,000      |
| EO/IR Camera System     | Thermal + visible      | 1   | $6,000     | $6,000       |
| RF Detection Array      | Wideband               | 1   | $4,000     | $4,000       |
| Control Workstations    | Ruggedized laptops ×2  | 2   | $3,000     | $6,000       |
| Communication System    | Mesh + satellite       | 1   | $5,000     | $5,000       |
| Generator               | 5kW diesel             | 1   | $4,000     | $4,000       |
| Battery System          | 10kWh backup           | 1   | $6,000     | $6,000       |
| Climate Control         | HVAC unit              | 1   | $3,000     | $3,000       |
| Installation/Fitout     | Custom integration     | 1   | $10,000    | $10,000      |
| **TOTAL BOM**           |                        |     |            | **$79,000**  |

### Manufacturing & Pricing

| Cost Component      | Value         |
| ------------------- | ------------- |
| BOM Cost            | $45,000       |
| Labor (128 hours)   | $4,978        |
| Machine Cost        | $2,500        |
| **Total COGS**      | **$52,478**   |
| Markup              | 220%          |
| **Est. Price**      | **$115,451**  |
| Target Margin       | 65%           |
| Assembly Time       | 128 hours     |

---

# Manufacturing & Pricing Data

## Assembly Time Estimates

| Product              | SKU          | Assembly | Testing | Integration | Total Hours | Labor Cost |
| -------------------- | ------------ | -------- | ------- | ----------- | ----------- | ---------- |
| SkyWatch Nano        | SW-NANO-001  | 0.5h     | 0.25h   | 0.25h       | 1.04h       | $10        |
| SkyWatch Standard    | SW-STD-001   | 1.5h     | 0.5h    | 0.5h        | 2.62h       | $29        |
| SkyWatch Pro         | SW-PRO-001   | 3.0h     | 1.0h    | 1.5h        | 5.9h        | $92        |
| SkyWatch Mobile      | SW-MOB-001   | 2.0h     | 0.75h   | 0.75h       | 3.65h       | $41        |
| SkyWatch Thermal     | SW-THM-001   | 4.0h     | 1.5h    | 2.0h        | 8.0h        | $133       |
| SkyWatch Marine      | SW-MAR-001   | 5.0h     | 2.0h    | 2.0h        | 9.8h        | $163       |
| SkyWatch Mesh (node) | SW-MESH-001  | 1.0h     | 0.5h    | 0.5h        | 2.12h       | $24        |
| SkyWatch Enterprise  | SW-ENT-001   | 40h      | 16h     | 24h         | 88h         | $2,933     |
| NetSentry Lite       | NS-LITE-001  | 1.5h     | 0.5h    | 0.5h        | 2.62h       | $24        |
| NetSentry Standard   | NS-STD-001   | 3.0h     | 1.0h    | 1.0h        | 5.27h       | $59        |
| NetSentry Pro        | NS-PRO-001   | 6.0h     | 2.0h    | 2.0h        | 11h         | $183       |
| SkySnare             | SS-001       | 0.75h    | 0.25h   | 0h          | 1.04h       | $10        |
| AeroNet Enterprise   | AN-ENT-001   | 80h      | 40h     | 80h         | 216h        | $7,200     |
| RKV-M Mothership     | RKV-M-001    | 40h      | 20h     | 20h         | 83.2h       | $3,236     |
| RKV-I Interceptor    | RKV-I-001    | 8h       | 4h      | 4h          | 16.4h       | $638       |
| RKV-G Ground Station | RKV-G-001    | 60h      | 20h     | 40h         | 128h        | $4,978     |

## Category Markups

| Category    | BOM Markup | Target Margin | Products                            |
| ----------- | ---------- | ------------- | ----------------------------------- |
| Consumer    | 158%       | 59%           | SkySnare                            |
| DIY/Maker   | 140%       | 35%           | SkyWatch Nano, NetSentry Lite       |
| Prosumer    | 160%       | 45%           | SkyWatch Standard/Mobile, NetSentry Std |
| Commercial  | 180%       | 55%           | SkyWatch Pro/Thermal/Marine/Mesh, NetSentry Pro |
| Enterprise  | 200%       | 60%           | SkyWatch Enterprise, AeroNet        |
| Military    | 220%       | 65%           | RKV-M, RKV-I, RKV-G                 |
| Services    | 250%       | 70%           | Training, custom dev, support       |

## Labor Tariffs

| Role                  | Hourly (ZAR) | Effective Rate | Description                    |
| --------------------- | ------------ | -------------- | ------------------------------ |
| Assembly Technician   | R120         | R168           | Basic assembly, wiring         |
| Senior Assembly Tech  | R200         | R280           | Complex assembly, calibration  |
| Electronics Engineer  | R450         | R675           | PCB work, diagnostics          |
| Mechanical Engineer   | R400         | R600           | Mechanical, CNC setup          |
| Software Engineer     | R550         | R715           | Integration, configuration     |
| Systems Integrator    | R600         | R900           | Full system commissioning      |
| Field Technician      | R300         | R480           | On-site installation           |
| QA Inspector          | R250         | R350           | Quality control, testing       |
| Test Engineer         | R400         | R600           | Performance validation         |

*Note: Effective rate includes 30-60% overhead for benefits, workspace, and tools.*

---

# Commercial Alternatives

## Detection-Only Systems

| Product      | Manufacturer | Price    | Features           | Website         |
| ------------ | ------------ | -------- | ------------------ | --------------- |
| DroneTracker | Dedrone      | $20,000+ | RF + visual, cloud | dedrone.com     |
| RfOne        | DroneShield  | $15,000+ | RF detection       | droneshield.com |
| AeroScope    | DJI          | $15,000+ | DJI drones only    | dji.com         |
| ELVIRA       | Robin Radar  | $50,000+ | 3D radar           | robinradar.com  |
| SkyTracker   | CACI         | $75,000+ | RF geolocation     | caci.com        |

## Detection + Countermeasure Systems

| Product     | Manufacturer | Price     | Features          | Website                  |
| ----------- | ------------ | --------- | ----------------- | ------------------------ |
| SkyWall 100 | OpenWorks    | $30,000+  | Net launcher      | openworksengineering.com |
| DroneHunter | Fortem       | $50,000+  | Interceptor drone | fortemtech.com           |
| DroneGun    | DroneShield  | $30,000+  | RF jammer         | droneshield.com          |
| Horizon     | Sentrycs     | $100,000+ | Protocol takeover | sentrycs.com             |
| AUDS        | Liteye       | $500,000+ | Full C-UAS        | liteye.com               |

---

# Appendix: Supplier Directory

## Compute Hardware

| Supplier     | Products              | Website         |
| ------------ | --------------------- | --------------- |
| Raspberry Pi | Pi boards, cameras    | raspberrypi.com |
| Coral        | Edge TPU accelerators | coral.ai        |
| Adafruit     | Pi accessories        | adafruit.com    |
| SparkFun     | Sensors, breakouts    | sparkfun.com    |

## Cameras & Optics

| Supplier  | Products               | Website       |
| --------- | ---------------------- | ------------- |
| Arducam   | Lenses, camera modules | arducam.com   |
| FLIR      | Thermal cameras        | flir.com      |
| GroupGets | Lepton modules         | groupgets.com |
| Thorlabs  | Optical components     | thorlabs.com  |

## RF & SDR

| Supplier    | Products         | Website     |
| ----------- | ---------------- | ----------- |
| RTL-SDR.com | SDR dongles      | rtl-sdr.com |
| NooElec     | SDR, antennas    | nooelec.com |
| L-Com       | Antennas, cables | l-com.com   |

## Mechanical & Pneumatic

| Supplier       | Products           | Website           |
| -------------- | ------------------ | ----------------- |
| ServoCity      | Pan-tilt mounts    | servocity.com     |
| McMaster-Carr  | Hardware, fittings | mcmaster.com      |
| Polycase       | Enclosures         | polycase.com      |
| Palmer Pursuit | CO2 valves         | palmerpursuit.com |

## Power & Electronics

| Supplier | Products              | Website     |
| -------- | --------------------- | ----------- |
| Pololu   | DC-DC converters      | pololu.com  |
| PiSupply | Battery HATs          | pisupp.ly   |
| Digi-Key | Electronic components | digikey.com |
| Mouser   | Electronic components | mouser.com  |

---

_Document Version: 1.0_ _Last Updated: 2026-01-09_ _PhoenixRooivalk Project_
