# RC Drone & Turret Control Integration Guide

## Hardware Assessment

### Current RC Controller
- **Type**: FlySky FS-GT3B style 2.4GHz pistol-grip transmitter (3-channel)
- **Protocol**: AFHDS (Automatic Frequency Hopping Digital System) — proprietary
- **Receiver**: FlySky 2.4G receiver with CH1/CH2/CH3 outputs
- **Actuators**: 2 standard PWM hobby servos (pan/tilt)

### Why RF Emulation Is Not An Option
The FlySky AFHDS protocol uses frequency hopping across the 2.4GHz band.
Emulating it requires:
- Proper 2.4GHz transceiver hardware (not Wi-Fi, not Bluetooth)
- Protocol timing accuracy
- Binding sequence implementation

This is an RF engineering project, not a software project. It is not
a viable path for this system.

### Hardware Bridge Options (For Physical Control)

**Option A — Bypass Receiver (Recommended for AI Control)**
```
PC -> USB -> Microcontroller -> PWM -> Servos
```
Disconnect receiver. Microcontroller generates servo PWM directly.
Manual override via keyboard/gamepad in software.

**Option B — Analog Injection (Keep RC Manual Backup)**
```
PC -> USB -> Microcontroller -> DAC/PWM -> Transmitter stick inputs -> RF -> Receiver -> Servos
```
Spoof the analog potentiometer signals inside the transmitter.
Physical switch toggles between real pot (manual) and injected signal (AI).

**Option C — Dual Authority Hardware Switch**
```
Receiver PWM ─┐
               ├─> PWM Selector Switch -> Servos
MCU PWM ──────┘
```
Hardware switch selects signal source. Clean isolation, no signal mixing.

### Minimum Hardware Required
Any of these microcontrollers will work for servo PWM generation:
- ESP32 (preferred: has WiFi for wireless transport)
- Arduino Nano / Uno
- STM32 Blue Pill
- Old drone flight controller (if STM32-based with USB and motor output pads)

**PCA9685 USB servo driver board** is an alternative that requires no firmware
writing — just USB from laptop to board to servos.

## Software Architecture

### Module Overview
```
apps/detector/src/
  ├── targeting.py           # Existing: target lock, distance estimation
  ├── trackers.py            # Existing: centroid + Kalman trackers
  ├── turret_transport.py    # NEW: pluggable actuator backends
  ├── turret_controller.py   # NEW: PID + authority supervisor
  └── turret_factory.py      # NEW: factory + pipeline integration
```

### Control Flow
```
Detection Pipeline (existing)
  └── TargetingSystem.update(tracked_objects)
        └── TargetLock (target center, velocity, confidence)
              └── TurretController.update_from_target_lock()
                    ├── PID: image error -> yaw/pitch rates
                    ├── AuthoritySupervisor: safety clamping
                    └── ActuatorTransport.send(ControlOutput)
```

### Authority Modes
| Mode | Description | Who Drives |
|------|-------------|------------|
| MANUAL | Operator has full control | Keyboard/gamepad |
| ASSISTED | AI shows suggestions, operator drives | Operator + AI overlay |
| AUTO_TRACK | AI drives pan/tilt to center target | PID controller |
| FAILSAFE | Error state, neutral output | System (auto) |

### Transport Backends
| Backend | Hardware | Use Case |
|---------|----------|----------|
| `simulated` | None | Development, PID tuning |
| `serial` | USB/UART to MCU | Direct wired control |
| `wifi_udp` | ESP32/similar over WiFi | Wireless control |

### Integration Example
```python
from turret_factory import create_turret_controller, turret_update

# Create from config
controller = create_turret_controller(settings.turret_control)
controller.start()

# Set to auto-tracking mode
controller.set_mode(AuthorityMode.AUTO_TRACK)

# In detection loop:
status = turret_update(controller, targeting_system, frame_width, frame_height)

# Manual override (instant, always works):
controller.manual_override()

# Cleanup:
controller.stop()
```

### Safety Guarantees
1. **Manual override always wins** — latched for configurable duration
2. **Watchdog timeout** — no command within TTL -> FAILSAFE -> neutral
3. **Rate clamping** — max yaw/pitch rates enforced in supervisor
4. **Slew rate limiting** — smooth transitions, no sudden jumps
5. **FAILSAFE exit** — can only return to MANUAL, not directly to AUTO

### Configuration (YAML)
```yaml
turret_control:
  transport_type: simulated  # simulated, serial, wifi_udp
  serial_port: "/dev/ttyUSB0"
  serial_baudrate: 115200
  wifi_host: "192.168.4.1"
  wifi_port: 4210
  yaw_kp: 0.8
  yaw_ki: 0.05
  yaw_kd: 0.15
  pitch_kp: 0.6
  pitch_ki: 0.03
  pitch_kd: 0.10
  max_yaw_rate: 1.0
  max_pitch_rate: 1.0
  max_slew_rate: 0.1
  watchdog_timeout_ms: 500
  override_latch_seconds: 3.0
  command_ttl_ms: 200
  initial_mode: manual
```

## POC Phases

### Phase 1 — Software Only (Now)
- Webcam -> detection -> tracking -> PID -> simulated transport
- Tune PID in simulation
- Build manual override UI
- All logging and visualization

### Phase 2 — Hardware Bridge (When MCU Available)
- Connect ESP32/Arduino via USB
- Switch transport to `serial`
- Test with real servos
- Validate safety watchdog

### Phase 3 — Wireless (Optional)
- ESP32 with WiFi
- Switch transport to `wifi_udp`
- Same control logic, different backend

### Phase 4 — Edge Deployment
- Move vision to Jetson/Pi
- Add MAVLink transport for flight controller integration
- Multi-sensor fusion
