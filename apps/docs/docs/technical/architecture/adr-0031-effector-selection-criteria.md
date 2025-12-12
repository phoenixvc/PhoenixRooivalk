---
id: adr-0031-effector-selection-criteria
title: "ADR 0031: Effector Selection Criteria"
sidebar_label: "ADR 0031: Effector Selection"
difficulty: expert
estimated_reading_time: 10
points: 50
tags:
  - technical
  - architecture
  - hardware
  - effector
  - counter-uas
  - roe
prerequisites:
  - architecture-decision-records
  - adr-0030-net-launcher-architecture
---

# ADR 0031: Effector Selection Criteria

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Counter-UAS systems require appropriate effector selection based on threat type, environment, and rules of engagement
2. **Decision**: Implement tiered effector framework with automated selection based on threat classification, environment constraints, and ROE parameters
3. **Trade-off**: Operational flexibility vs. system complexity and cost

---

## Context

### Effector Categories

| Category | Examples | Characteristics |
|----------|----------|-----------------|
| Kinetic | Projectiles, missiles | Lethal, high collateral risk |
| Non-kinetic capture | Nets, tethers | Non-lethal, evidence preservation |
| Electronic | Jamming, spoofing | Non-destructive, spectrum regulations |
| Directed energy | Lasers, HPM | Precision, power requirements |

### Selection Factors

1. **Threat characteristics**: Size, speed, payload, autonomy level
2. **Environment**: Urban vs. rural, protected airspace, civilians present
3. **Rules of engagement**: Authorization level, legal constraints
4. **Operational requirements**: Evidence capture, cost per engagement

---

## Decision

Adopt **tiered effector framework** with automated selection:

### Effector Tiers

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Effector Selection Matrix                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TIER 1: PASSIVE (No Authorization Required)                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • Detection & tracking only                                      ││
│  │ • Alert generation                                               ││
│  │ • Evidence recording                                             ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  TIER 2: SOFT DEFEAT (Operator Authorization)                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • RF jamming (where legal)                                       ││
│  │ • GPS spoofing (controlled environment)                          ││
│  │ • Acoustic/light deterrence                                      ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  TIER 3: NON-KINETIC CAPTURE (Command Authorization)                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • Net launcher (primary)                                         ││
│  │ • Tethered interceptor                                           ││
│  │ • Entanglement systems                                           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  TIER 4: KINETIC (Highest Authority Required)                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • Projectile intercept                                           ││
│  │ • Directed energy                                                ││
│  │ • Collision intercept                                            ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Selection Algorithm

### Decision Tree

```rust
pub struct EffectorSelector {
    threat_classifier: ThreatClassifier,
    environment_analyzer: EnvironmentAnalyzer,
    roe_engine: RoeEngine,
    effector_inventory: EffectorInventory,
}

impl EffectorSelector {
    pub async fn select_effector(
        &self,
        threat: &ThreatAssessment,
        environment: &EnvironmentContext,
        roe: &RulesOfEngagement,
    ) -> Result<EffectorRecommendation, SelectionError> {
        // Step 1: Determine maximum authorized tier
        let max_tier = self.roe_engine.get_max_tier(roe, threat)?;

        // Step 2: Filter by environment constraints
        let viable_effectors = self.effector_inventory
            .get_available()
            .filter(|e| e.tier <= max_tier)
            .filter(|e| self.environment_analyzer.is_compatible(e, environment))
            .collect::<Vec<_>>();

        // Step 3: Score by effectiveness
        let scored = viable_effectors
            .into_iter()
            .map(|e| (e, self.score_effectiveness(e, threat)))
            .collect::<Vec<_>>();

        // Step 4: Select optimal (highest effectiveness, lowest tier)
        scored
            .into_iter()
            .max_by(|(a, sa), (b, sb)| {
                // Prefer lower tier at equal effectiveness
                match sa.partial_cmp(sb) {
                    Some(Ordering::Equal) => b.tier.cmp(&a.tier),
                    Some(ord) => ord,
                    None => Ordering::Equal,
                }
            })
            .map(|(e, score)| EffectorRecommendation {
                effector: e,
                confidence: score,
                alternatives: self.get_alternatives(e, &scored),
            })
            .ok_or(SelectionError::NoViableEffector)
    }
}
```

### Selection Criteria Weights

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Effectiveness | 30% | Probability of successful neutralization |
| Collateral risk | 25% | Risk to bystanders and property |
| Evidence preservation | 20% | Ability to capture drone for forensics |
| Cost efficiency | 15% | Cost per engagement |
| Legal compliance | 10% | Regulatory approval status |

---

## Environment Constraints

### Environment Classification

| Environment | Kinetic | Electronic | Net Launcher | Notes |
|-------------|---------|------------|--------------|-------|
| Military base | ✅ | ✅ | ✅ | Full authorization |
| Airport | ❌ | ⚠️ | ✅ | RF restrictions |
| Stadium | ❌ | ❌ | ✅ | Civilian density |
| Prison | ❌ | ⚠️ | ✅ | Controlled airspace |
| Border | ✅ | ✅ | ✅ | Remote location |
| Urban | ❌ | ❌ | ⚠️ | High collateral risk |

### Constraint Enforcement

```rust
pub struct EnvironmentConstraints {
    pub kinetic_allowed: bool,
    pub electronic_allowed: bool,
    pub max_effector_tier: EffectorTier,
    pub civilian_density: CivilianDensity,
    pub airspace_class: AirspaceClass,
    pub rf_restrictions: Vec<FrequencyBand>,
}

impl EnvironmentAnalyzer {
    pub fn is_compatible(
        &self,
        effector: &Effector,
        env: &EnvironmentContext,
    ) -> bool {
        match effector.category {
            EffectorCategory::Kinetic => env.constraints.kinetic_allowed,
            EffectorCategory::Electronic => {
                env.constraints.electronic_allowed &&
                !effector.frequencies.iter()
                    .any(|f| env.constraints.rf_restrictions.contains(f))
            },
            EffectorCategory::NetLauncher => {
                effector.tier <= env.constraints.max_effector_tier
            },
            _ => true,
        }
    }
}
```

---

## ROE Integration

### Authorization Levels

| Level | Authority | Allowed Tiers | Latency |
|-------|-----------|---------------|---------|
| Pre-authorized | Standing order | 1-2 | 0ms |
| Operator | Local operator | 1-3 | <5s |
| Command | Ops center | 1-4 | <30s |
| Executive | Senior command | All | Variable |

### ROE Parameters

```rust
pub struct RulesOfEngagement {
    /// Standing authorization level
    pub default_authorization: AuthorizationLevel,
    /// Threat types pre-authorized for engagement
    pub pre_authorized_threats: Vec<ThreatCategory>,
    /// Maximum collateral damage acceptable
    pub max_collateral_risk: CollateralRisk,
    /// Require human confirmation before engagement
    pub human_in_loop: HumanInLoopPolicy,
    /// Evidence capture requirements
    pub evidence_required: bool,
    /// Escalation rules
    pub escalation_matrix: EscalationMatrix,
}
```

---

## Effector Inventory

### Phoenix Rooivalk Effector Roadmap

| Effector | Tier | Status | Target Date |
|----------|------|--------|-------------|
| Net Launcher v1 | 3 | Prototype | Q1 2026 |
| Acoustic Deterrent | 2 | Planned | Q2 2026 |
| RF Jammer (licensed) | 2 | Research | Q3 2026 |
| Net Launcher v2 (multi-shot) | 3 | Planned | Q3 2026 |

### Effector Specifications

```rust
pub struct EffectorSpec {
    pub id: String,
    pub name: String,
    pub tier: EffectorTier,
    pub category: EffectorCategory,

    // Performance
    pub effective_range: Range<f32>,  // meters
    pub engagement_time: Duration,     // time to effect
    pub pk: f32,                       // probability of kill/capture

    // Constraints
    pub max_target_speed: f32,        // m/s
    pub max_target_size: f32,         // kg
    pub min_engagement_altitude: f32, // meters AGL

    // Logistics
    pub reload_time: Duration,
    pub cost_per_engagement: f32,     // USD
    pub rounds_capacity: u32,
}
```

---

## Consequences

### Positive

- **Proportional response**: Appropriate force for threat level
- **Legal compliance**: ROE enforcement prevents violations
- **Evidence capture**: Non-kinetic priority preserves forensics
- **Flexibility**: Multiple effector options per scenario

### Negative

- **Complexity**: Selection algorithm adds latency
- **Cost**: Multiple effector types increase system cost
- **Training**: Operators must understand selection criteria

---

## Related ADRs

- [ADR 0030: Net Launcher Architecture](./adr-0030-net-launcher-architecture)
- [ADR 0032: Sensor-to-Effector Protocol](./adr-0032-sensor-to-effector-protocol)
- [ADR 0003: SAE Level 4 Autonomy](./architecture-decision-records#adr-0003-sae-level-4-autonomy-adoption-strategy)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
