---
id: adr-0030-net-launcher-architecture
title: "ADR 0030: Net Launcher Effector System Architecture"
sidebar_label: "ADR 0030: Net Launcher"
difficulty: expert
estimated_reading_time: 10
points: 50
tags:
  - technical
  - architecture
  - hardware
  - effector
  - counter-uas
  - net-launcher
prerequisites:
  - architecture-decision-records
  - mechanical-design-adrs
---

# ADR 0030: Net Launcher Effector System Architecture

**Date**: 2025-12-12 **Status**: Proposed (Prototype in Development)

---

## Executive Summary

1. **Problem**: Phoenix Rooivalk needs a non-kinetic effector system to
   neutralize drone threats without collateral damage
2. **Decision**: Develop in-house pneumatic net launcher with local material
   sourcing and modular design
3. **Trade-off**: Development time vs. commercial off-the-shelf (COTS) systems
   with licensing restrictions

---

## Context

### Operational Requirement

Counter-UAS systems require effector mechanisms to neutralize identified
threats. Options include:

- **Kinetic**: Projectiles, shotguns (collateral damage risk)
- **Electronic**: Jamming, spoofing (spectrum regulations)
- **Directed Energy**: Lasers, HPM (power requirements, cost)
- **Entanglement**: Nets, tethers (non-destructive capture)

### Why Net Launchers

For civilian infrastructure protection (airports, stadiums, prisons):

1. **Non-lethal**: No projectile hazard to bystanders
2. **Evidence preservation**: Captured drone available for forensics
3. **Regulatory compliance**: No RF interference or weapons licensing
4. **Cost-effective**: Lower per-engagement cost than missiles

### Current Status

- **Pieter (Hardware Lead)**: Sourcing pipes and fittings for first prototype
- **Material availability**: Validated across 5+ South African suppliers
- **Manufacturing approach**: In-house fabrication, no import dependencies

---

## Options Considered

### Option 1: Commercial Off-the-Shelf (COTS) ❌

Purchase existing net launcher systems (e.g., OpenWorks SkyWall, Fortem
DroneHunter).

**Pros**:

- Proven technology
- Immediate availability
- Certification may transfer

**Cons**:

- **High cost**: $50K-$200K per unit
- **Licensing restrictions**: Export controls, end-user agreements
- **Integration challenges**: Proprietary interfaces
- **Supply chain risk**: Single-source dependency

### Option 2: Licensed Technology ❌

License net launcher design from existing manufacturer.

**Pros**:

- Faster development
- Proven design

**Cons**:

- **Royalty costs**: Per-unit fees reduce margins
- **Design constraints**: Cannot modify for mission requirements
- **IP limitations**: Cannot patent improvements

### Option 3: In-House Development ✅ Selected

Develop proprietary net launcher system with local sourcing.

**Pros**:

- **Full IP ownership**: Patent potential, no licensing fees
- **Local sourcing**: South African materials, no import delays
- **Mission-specific optimization**: Tailored to RKV-M platform
- **Cost control**: 60%+ savings vs. COTS
- **Rapid iteration**: Can test and improve quickly

**Cons**:

- **Development time**: 3-6 months to operational prototype
- **Certification path**: Must establish own testing regime
- **Technical risk**: Unproven design

---

## Decision

Adopt **Option 3: In-House Development** for the net launcher effector system.

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Net Launcher System                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Pneumatic  │───▶│   Launch     │───▶│    Net       │  │
│  │   Reservoir  │    │   Mechanism  │    │   Payload    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                    │          │
│         ▼                   ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Pressure   │    │   Trigger    │    │   Weighted   │  │
│  │   Regulator  │    │   Solenoid   │    │   Corners    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                             │                               │
│                             ▼                               │
│                    ┌──────────────┐                        │
│                    │   Flight     │                        │
│                    │   Computer   │                        │
│                    │   Interface  │                        │
│                    └──────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Pneumatic System

| Component          | Specification                |
| ------------------ | ---------------------------- |
| Reservoir          | High-pressure air cylinder   |
| Operating Pressure | 150-300 PSI                  |
| Regulator          | Adjustable for range control |
| Refill Method      | Hand pump or compressor      |

#### 2. Launch Mechanism

| Component | Specification                     |
| --------- | --------------------------------- |
| Barrel    | PVC/aluminum pipe, 50-75mm ID     |
| Trigger   | Electronic solenoid valve         |
| Safety    | Mechanical safety + software lock |
| Reload    | Quick-change cartridge system     |

#### 3. Net Payload

| Parameter      | Specification               |
| -------------- | --------------------------- |
| Net Size       | 3m x 3m deployed            |
| Material       | High-strength nylon/Dyneema |
| Mesh Size      | 10cm x 10cm                 |
| Corner Weights | 50-100g each for stability  |
| Packing        | Compressed cartridge        |

### Performance Targets

| Metric              | Target        | Rationale                      |
| ------------------- | ------------- | ------------------------------ |
| Effective Range     | 15-30m        | Typical engagement distance    |
| Net Deployment Time | <100ms        | Faster than drone evasion      |
| Accuracy            | 80% hit @ 20m | Account for target movement    |
| Reload Time         | <10 seconds   | Multiple engagement capability |
| Weight              | <5kg total    | UAV payload constraint         |

---

## Integration Architecture

### Flight Computer Interface

```rust
// Effector control interface
pub trait EffectorController {
    /// Arm the effector system
    async fn arm(&mut self) -> Result<(), EffectorError>;

    /// Fire the effector at target
    async fn fire(&mut self, target: &TrackingData) -> Result<EngagementResult, EffectorError>;

    /// Safe the system (disarm)
    async fn safe(&mut self) -> Result<(), EffectorError>;

    /// Get current status
    fn status(&self) -> EffectorStatus;
}

pub struct NetLauncherController {
    pressure_sensor: PressureSensor,
    trigger_solenoid: Solenoid,
    safety_interlock: SafetySystem,
    rounds_remaining: u8,
}
```

### Engagement Sequence

```
1. Threat Detection     ──▶ AI classifies target as hostile
2. Track Acquisition    ──▶ Sensor fusion provides trajectory
3. Engagement Decision  ──▶ ROE check, human-in-loop if required
4. Arm Command          ──▶ Safety interlocks released
5. Lead Calculation     ──▶ Predict intercept point
6. Fire Command         ──▶ Solenoid triggers launch
7. Net Deployment       ──▶ Net expands in flight
8. Capture              ──▶ Net entangles target rotors
9. Evidence Recording   ──▶ Blockchain anchor of engagement
```

### Evidence Integration

Per ADR 0001 (Chain Selection), all engagements anchored to Solana:

```rust
pub struct EngagementEvidence {
    pub timestamp: DateTime<Utc>,
    pub target_track_id: String,
    pub effector_type: EffectorType::NetLauncher,
    pub launch_parameters: LaunchParams,
    pub outcome: EngagementOutcome,
    pub sensor_snapshot: SensorData,
    pub operator_id: Option<String>,
}
```

---

## Implementation Plan

### Phase 1: Prototype (Current - Q1 2026)

| Task                      | Status      | Owner  |
| ------------------------- | ----------- | ------ |
| Source pipes and fittings | ✅ Complete | Pieter |
| Purchase components       | 🔄 Tomorrow | Pieter |
| Assemble first prototype  | 📅 Planned  | Pieter |
| Static ground tests       | 📅 Planned  | Team   |
| Document specifications   | 📅 Planned  | Jurie  |

### Phase 2: Integration (Q1 2026)

- Mount on test platform
- Integrate with flight computer
- Develop targeting algorithms
- Ground-based engagement tests

### Phase 3: Flight Testing (Q2 2026)

- UAV-mounted tests
- Live drone engagement trials
- Performance validation
- Safety certification prep

---

## Risks and Mitigations

| Risk                     | Likelihood | Impact | Mitigation                       |
| ------------------------ | ---------- | ------ | -------------------------------- |
| Insufficient range       | Medium     | High   | Adjustable pressure system       |
| Net deployment failure   | Medium     | High   | Redundant deployment mechanism   |
| Component availability   | Low        | Medium | Multiple supplier relationships  |
| Integration complexity   | Medium     | Medium | Modular interface design         |
| Certification challenges | High       | High   | Early engagement with regulators |

---

## Cost Analysis

### Development Costs

| Item                  | Estimate (ZAR) | Estimate (USD) |
| --------------------- | -------------- | -------------- |
| Prototype materials   | R5,000         | ~$270          |
| Testing equipment     | R10,000        | ~$540          |
| Iteration (3 cycles)  | R15,000        | ~$810          |
| **Total Development** | **R30,000**    | **~$1,620**    |

### Per-Unit Production Cost (Target)

| Component          | Cost (ZAR) | Cost (USD) |
| ------------------ | ---------- | ---------- |
| Pneumatic system   | R2,000     | ~$110      |
| Launch mechanism   | R1,500     | ~$80       |
| Net payload (x3)   | R1,500     | ~$80       |
| Electronics        | R1,000     | ~$55       |
| Assembly           | R500       | ~$30       |
| **Total Per Unit** | **R6,500** | **~$355**  |

vs. COTS: $50,000+ = **99% cost reduction**

---

## Related ADRs

- [ADR 0003: SAE Level 4 Autonomy](./architecture-decision-records#adr-0003-sae-level-4-autonomy-adoption-strategy)
- [ADR 0005: Sensor Integration](./architecture-decision-records#adr-0005-sensor-integration-architecture)
- [Mechanical ADR-0001: Ducted vs Open Props](./mechanical-design-adrs)
- [ADR-D007: Evidence-Based Architecture](./architecture-decision-records#adr-d007-evidence-based-architecture)

---

## Open Questions

1. **Certification path**: Which standards apply to net launcher systems?
2. **Multi-shot capability**: Single barrel vs. multi-barrel design?
3. **Recovery system**: Parachute for net+drone recovery?
4. **Night operations**: IR-compatible targeting integration?

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
