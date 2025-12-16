---
id: adr-0032-sensor-to-effector-protocol
title: "ADR 0032: Sensor-to-Effector Protocol"
sidebar_label: "ADR 0032: Sensor-Effector Protocol"
difficulty: expert
estimated_reading_time: 12
points: 50
tags:
  - technical
  - architecture
  - protocol
  - sensor
  - effector
  - real-time
  - targeting
prerequisites:
  - architecture-decision-records
  - adr-0005-sensor-integration-architecture
  - adr-0031-effector-selection-criteria
---

# ADR 0032: Sensor-to-Effector Protocol

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Real-time targeting handoff from sensor fusion to effector
   systems requires sub-50ms latency with cryptographic integrity
2. **Decision**: Implement dedicated targeting bus with predictive lead
   calculation, priority messaging, and evidence chain integration
3. **Trade-off**: Protocol complexity vs. engagement accuracy and legal
   defensibility

---

## Context

### Timing Requirements

| Phase                 | Latency Budget | Critical Path            |
| --------------------- | -------------- | ------------------------ |
| Sensor detection      | 0-20ms         | Radar/camera processing  |
| Track fusion          | 20-35ms        | Multi-sensor correlation |
| Threat classification | 35-45ms        | AI inference             |
| Effector handoff      | 45-50ms        | **This protocol**        |
| Engagement            | 50-150ms       | Physical deployment      |

### Key Challenges

1. **Moving targets**: Drones at 20m/s move 1m in 50ms
2. **Latency sensitivity**: Stale data causes misses
3. **Evidence requirements**: Every handoff must be logged
4. **Reliability**: No dropped messages in engagement

---

## Decision

Implement **Targeting Bus Protocol (TBP)** with:

### Protocol Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Targeting Bus Protocol                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                           ┌──────────────┐        │
│  │   Sensor     │                           │   Effector   │        │
│  │   Fusion     │──────────────────────────▶│   Control    │        │
│  │   Engine     │        Targeting Bus      │   System     │        │
│  └──────────────┘                           └──────────────┘        │
│         │                    │                     │                 │
│         ▼                    ▼                     ▼                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │    Track     │    │    Lead      │    │   Fire       │          │
│  │   Update     │    │   Calculator │    │   Solution   │          │
│  │   (10Hz)     │    │              │    │              │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                              │                                       │
│                              ▼                                       │
│                      ┌──────────────┐                               │
│                      │   Evidence   │                               │
│                      │   Logger     │                               │
│                      └──────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Message Types

### Track Update (Sensor → Bus)

```rust
#[derive(Serialize, Deserialize)]
pub struct TrackUpdate {
    /// Unique track identifier
    pub track_id: TrackId,
    /// Timestamp of measurement (edge clock)
    pub timestamp: Timestamp,
    /// Sequence number for ordering
    pub sequence: u64,

    // Position (NED frame, relative to platform)
    pub position: Vector3<f64>,      // meters
    pub position_covariance: Matrix3<f64>,

    // Velocity
    pub velocity: Vector3<f64>,      // m/s
    pub velocity_covariance: Matrix3<f64>,

    // Acceleration (for lead calculation)
    pub acceleration: Vector3<f64>,  // m/s²

    // Classification
    pub classification: ThreatClassification,
    pub classification_confidence: f32,

    // Engagement status
    pub engagement_authorized: bool,
    pub priority: EngagementPriority,
}

impl TrackUpdate {
    pub fn predict_position(&self, dt: Duration) -> Vector3<f64> {
        let t = dt.as_secs_f64();
        self.position
            + self.velocity * t
            + 0.5 * self.acceleration * t * t
    }
}
```

### Fire Solution (Bus → Effector)

```rust
#[derive(Serialize, Deserialize)]
pub struct FireSolution {
    /// Track being engaged
    pub track_id: TrackId,
    /// Solution generation timestamp
    pub timestamp: Timestamp,
    /// Solution valid until (stale after)
    pub valid_until: Timestamp,

    // Aim point (predicted intercept)
    pub aim_point: Vector3<f64>,
    /// Time to intercept
    pub time_to_intercept: Duration,
    /// Probability of hit
    pub p_hit: f32,

    // Effector parameters
    pub effector_id: EffectorId,
    pub launch_azimuth: f64,         // radians
    pub launch_elevation: f64,        // radians
    pub launch_velocity: f64,         // m/s (if adjustable)

    // Authorization
    pub authorization_token: AuthToken,
    pub roe_reference: RoeReference,

    // Evidence
    pub evidence_hash: [u8; 32],
    pub signature: [u8; 64],
}
```

### Engagement Report (Effector → Bus)

```rust
#[derive(Serialize, Deserialize)]
pub struct EngagementReport {
    /// Fire solution reference
    pub solution_id: Uuid,
    pub track_id: TrackId,

    // Timing
    pub fire_command_time: Timestamp,
    pub effector_release_time: Timestamp,

    // Result
    pub outcome: EngagementOutcome,
    pub actual_impact_point: Option<Vector3<f64>>,

    // Evidence chain
    pub pre_engagement_snapshot: SensorSnapshot,
    pub post_engagement_snapshot: SensorSnapshot,
    pub effector_telemetry: EffectorTelemetry,

    // Signatures
    pub evidence_hash: [u8; 32],
    pub signature: [u8; 64],
}

pub enum EngagementOutcome {
    Hit { capture_confirmed: bool },
    Miss { estimated_miss_distance: f64 },
    Aborted { reason: AbortReason },
    EffectorMalfunction { error: String },
}
```

---

## Lead Calculation

### Predictive Algorithm

```rust
pub struct LeadCalculator {
    effector_specs: EffectorSpecs,
}

impl LeadCalculator {
    pub fn calculate_lead(
        &self,
        track: &TrackUpdate,
        effector_position: Vector3<f64>,
        effector: &EffectorSpecs,
    ) -> Result<FireSolution, LeadError> {
        // Iterative solution for intercept point
        let mut time_to_intercept = self.initial_estimate(track, effector_position);

        for _ in 0..10 {  // Converge in ~10 iterations
            // Predict target position at intercept time
            let target_pos = track.predict_position(time_to_intercept);

            // Calculate effector travel time to that point
            let distance = (target_pos - effector_position).norm();
            let new_tti = Duration::from_secs_f64(
                distance / effector.projectile_velocity
            );

            // Check convergence
            if (new_tti - time_to_intercept).abs() < Duration::from_micros(100) {
                break;
            }
            time_to_intercept = new_tti;
        }

        // Calculate aim point
        let aim_point = track.predict_position(time_to_intercept);

        // Calculate launch angles
        let aim_vector = aim_point - effector_position;
        let launch_azimuth = aim_vector.y.atan2(aim_vector.x);
        let horizontal_dist = (aim_vector.x.powi(2) + aim_vector.y.powi(2)).sqrt();
        let launch_elevation = (-aim_vector.z).atan2(horizontal_dist);

        // Estimate P(hit) based on uncertainties
        let p_hit = self.estimate_hit_probability(
            track,
            aim_point,
            effector,
            time_to_intercept,
        );

        Ok(FireSolution {
            track_id: track.track_id,
            aim_point,
            time_to_intercept,
            p_hit,
            launch_azimuth,
            launch_elevation,
            // ... other fields
        })
    }

    fn estimate_hit_probability(
        &self,
        track: &TrackUpdate,
        aim_point: Vector3<f64>,
        effector: &EffectorSpecs,
        tti: Duration,
    ) -> f32 {
        // Propagate position uncertainty to intercept time
        let position_sigma = self.propagate_uncertainty(
            track.position_covariance,
            track.velocity_covariance,
            tti,
        );

        // Net capture radius
        let capture_radius = effector.capture_radius;

        // P(hit) = probability target is within capture radius
        // Simplified: assume 3D Gaussian, integrate over sphere
        let total_sigma = position_sigma.trace().sqrt();
        let z_score = capture_radius / total_sigma;

        // Approximate with error function
        (2.0 * standard_normal_cdf(z_score) - 1.0) as f32
    }
}
```

---

## Protocol Guarantees

### Reliability

| Guarantee        | Mechanism                          |
| ---------------- | ---------------------------------- |
| Ordered delivery | Sequence numbers                   |
| No duplicates    | Idempotency keys                   |
| Bounded latency  | Priority queuing, <5ms bus latency |
| Integrity        | Ed25519 signatures                 |

### Quality of Service

```rust
pub enum MessagePriority {
    /// Fire solutions, engagement reports
    Critical = 0,
    /// Track updates for active engagements
    High = 1,
    /// New track notifications
    Normal = 2,
    /// Diagnostic/telemetry
    Low = 3,
}

impl TargetingBus {
    pub async fn send(&self, msg: BusMessage) -> Result<(), BusError> {
        let priority = msg.priority();

        // Critical messages bypass queue
        if priority == MessagePriority::Critical {
            return self.send_immediate(msg).await;
        }

        // Others queued by priority
        self.queue.push(msg, priority).await
    }
}
```

---

## Evidence Chain

### Logging Requirements

Every message on the targeting bus is logged:

```rust
pub struct TargetingLog {
    pub timestamp: Timestamp,
    pub message_type: MessageType,
    pub message_hash: [u8; 32],
    pub sender: NodeId,
    pub receiver: NodeId,

    // For engagement messages
    pub track_id: Option<TrackId>,
    pub authorization: Option<AuthToken>,

    // Chain integrity
    pub previous_hash: [u8; 32],
    pub signature: [u8; 64],
}
```

### Blockchain Anchoring

Per ADR 0001, engagement evidence anchored to Solana:

```rust
impl EvidenceAnchoring {
    pub async fn anchor_engagement(
        &self,
        engagement: &EngagementReport,
    ) -> Result<AnchorReceipt, AnchorError> {
        // Create evidence package
        let evidence = EvidencePackage {
            track_history: self.get_track_history(engagement.track_id).await?,
            fire_solution: self.get_fire_solution(engagement.solution_id).await?,
            engagement_report: engagement.clone(),
            sensor_snapshots: vec![
                engagement.pre_engagement_snapshot.clone(),
                engagement.post_engagement_snapshot.clone(),
            ],
        };

        // Hash and anchor
        let hash = evidence.compute_hash();
        self.solana.anchor_hash(hash).await
    }
}
```

---

## Timing Diagram

```
Time (ms)  Sensor         Bus            Lead Calc       Effector
─────────────────────────────────────────────────────────────────
   0       Track Update ──▶
   2                      ──▶ Queue
   5                          ──▶ Calculate
  10                               Solution ──▶
  12                      Fire Solution ──────────▶
  15                                              Arm
  20                                              ◀── Operator Auth
  25                                              Fire Command
  30       ◀────────────── Engagement Report ────◀
  50       Outcome logged, evidence anchored
```

---

## Consequences

### Positive

- **Low latency**: <5ms bus overhead
- **Accuracy**: Predictive lead calculation
- **Evidence**: Complete engagement chain
- **Reliability**: No lost messages

### Negative

- **Complexity**: Custom protocol implementation
- **Testing**: Requires hardware-in-loop validation
- **Timing constraints**: Real-time requirements

---

## Related ADRs

- [ADR 0005: Sensor Integration](./architecture-decision-records#adr-0005-sensor-integration-architecture)
- [ADR 0030: Net Launcher Architecture](./adr-0030-net-launcher-architecture)
- [ADR 0031: Effector Selection Criteria](./adr-0031-effector-selection-criteria)
- [ADR-D007: Evidence-Based Architecture](./architecture-decision-records#adr-d007-evidence-based-architecture)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
