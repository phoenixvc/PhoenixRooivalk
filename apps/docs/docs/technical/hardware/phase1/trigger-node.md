---
id: phase1-trigger-node
title: "Trigger Node (Demo) — Safe Actuation Placeholder"
sidebar_label: Trigger Node
sidebar_position: 5
description:
  Phase 1A build guide for the Trigger Node demo. Receives a fire command over
  WiFi and drives an LED/relay to a dummy load. No launcher hardware.
difficulty: beginner
estimated_reading_time: 5
points: 10
tags:
  - hardware
  - phase-1
  - esp32
  - actuation
  - relay
  - safety
phase: ["seed"]
---

# Trigger Node (Demo)

A "countermeasure interface" demo box that receives a trigger command and drives
a **safe, visible output** — a lamp, LED strip, or buzzer. Nothing more.

---

## What It Proves

> **Decision → Actuation signal → Visible effect**, completing the full
> detect-decide-act chain without any unsafe mechanics.

A visitor watches SkyWatch detect a target, the Turret track it, and then the
Trigger Node fires — a bright LED strip flashes. The architecture is proven; the
actuator is intentionally inert.

---

## Bill of Materials — Buy Now (Phase 1A)

| Component | Part | Specification | Est. Cost |
|-----------|------|---------------|-----------|
| Compute | ESP32 dev board | DevKitC or NodeMCU-32S | $5–8 |
| Relay | 1-ch relay module | Opto-isolated, 5V coil, 10A contacts | $1–2 |
| Dummy load | LED strip segment | 12V, ~30cm (or a small 12V lamp) | $2–4 |
| Safety switch | Toggle switch | SPST, panel-mount (arm/disarm) | $0.50 |
| Status LED | 3mm red/green | Armed/safe indicators | $0.50 |
| Power (logic) | MP1584EN buck | 7–12V → 5V for ESP32 | $1–2 |
| Power (load) | Direct 12V pass-through | From input supply to relay NO contact | — |
| Wiring | Dupont jumpers, screw terminals | Assorted | $2–3 |
| **Total** | | | **~$13–20** |

### Relay vs MOSFET

| | Relay Module | Logic-Level MOSFET |
|-|-------------|-------------------|
| Isolation | Galvanic (opto + mechanical) | None (shared ground) |
| Switching speed | ~10ms | <1µs |
| Audible click | Yes (satisfying for demo) | Silent |
| Voltage flexibility | Any (AC or DC load) | DC only |
| Verdict | **Recommended for demo** (click = feedback) | Better for rapid switching |

---

## Leave for Later (Intentionally)

| Item | Why |
|------|-----|
| Any hardware that launches or projects | Phase 1 proves architecture, not force |
| High-energy actuators (solenoids, pneumatics) | Safety and liability |
| Multi-channel firing (salvo) | Single channel proves the concept |

---

## Architecture

```text
  ┌──────────────────────────────────────────────────────────┐
  │                   Trigger Node Box                       │
  │                                                          │
  │   12V DC ──┬── MP1584EN ── 5V ── ESP32                  │
  │            │                      │                      │
  │            │               GPIO ── Toggle (arm/disarm)   │
  │            │               GPIO ── Green LED (armed)     │
  │            │               GPIO ── Red LED (safe)        │
  │            │               GPIO ── Relay IN              │
  │            │                                             │
  │            │         ┌─────────────────┐                 │
  │            └── 12V ──┤ Relay NO ───────┤── LED strip     │
  │                      └─────────────────┘   (dummy load)  │
  │                                                          │
  │   WiFi ◄── "fire" command from SkyWatch / Turret         │
  └──────────────────────────────────────────────────────────┘
```

---

## Safety Interlocks

The Trigger Node implements a deliberate safety chain, even for a demo. This
trains good habits for later phases:

1. **Physical arm switch** — toggle must be in ARMED position.
2. **Software arm state** — firmware must be in armed mode (mirrors the switch).
3. **Command authentication** — only accept fire commands from known source IPs
   (simple allowlist).
4. **Pulse duration limit** — relay energizes for a fixed pulse (e.g., 500ms),
   then auto-disarms.
5. **Activation logging** — every fire event is logged with timestamp and source.

---

## Build Steps

### Step 1 — Power

1. 12V DC input splits two ways:
   - Through MP1584EN (set to 5V) → ESP32 power.
   - Direct 12V to relay common (COM) terminal.
2. Relay normally-open (NO) terminal → LED strip positive.
3. LED strip negative → 12V ground.

### Step 2 — Arm/disarm circuit

1. Wire toggle switch between a GPIO pin and GND (enable internal pull-up).
2. Wire green LED (+ resistor) to an "armed" GPIO.
3. Wire red LED (+ resistor) to a "safe" GPIO.
4. Firmware reads switch state on boot and on interrupt.

### Step 3 — Relay wiring

1. Relay module VCC → 5V, GND → GND.
2. Relay IN → ESP32 GPIO (e.g., GPIO 26).
3. Relay COM → 12V supply.
4. Relay NO → LED strip / lamp positive lead.
5. Test: toggle GPIO HIGH for 500ms → relay clicks, load lights up.

### Step 4 — WiFi command listener

1. ESP32 runs a simple HTTP server.
2. `POST /fire` endpoint:
   - Check arm switch state.
   - Check source IP allowlist.
   - If armed and authorized: energize relay for 500ms, return `200 OK`.
   - If not armed: return `403 Forbidden`.
3. Log every request (armed or not) with timestamp.

### Step 5 — Integration test

1. SkyWatch Standard detects a target → sends `POST /fire` to Trigger Node IP.
2. Trigger Node (armed) fires relay → LED strip flashes.
3. Trigger Node (disarmed) rejects → red LED stays on, no relay activation.

---

## Acceptance Criteria

- [ ] Toggle switch physically arms/disarms the node
- [ ] Armed/safe status LEDs reflect current state
- [ ] WiFi `POST /fire` command activates relay when armed
- [ ] Relay pulse is time-limited (auto-disarms after 500ms)
- [ ] Rejected commands return 403 and are logged
- [ ] Every activation is logged with timestamp and source

---

## Upgrade Path

| From (Phase 1A) | To (Phase 1B+) |
|------------------|----------------|
| HTTP POST fire command | MQTT with TLS for real-time pub/sub |
| Single relay channel | Multi-channel (salvo / sequence modes) |
| IP allowlist auth | Token-based authentication |
| LED strip dummy load | Application-specific actuator (project-dependent) |
| Manual toggle arm | Remote arming via dashboard with 2FA |
