---
id: cuas-readiness-levels
title: CUAS Readiness Levels (CRL) Framework
sidebar_label: CUAS Readiness Levels
difficulty: intermediate
estimated_reading_time: 12
points: 20
phase: ["seed", "series-a"]
tags:
  - business
  - counter-uas
  - readiness
prerequisites:
  - cuas-sandbox-2026
---

# CUAS Readiness Levels (CRL) Framework

Beyond standard Technology Readiness Levels (TRL), Counter-UAS systems require
specialized readiness assessments that evaluate operational effectiveness across
detection, defeat, and integration capabilities.

:::info Why CRL Matters

Defense procurement programs like Canada's CUAS Sandbox 2026 require **TRL 5 or
higher** with demonstrated validation. This framework helps assess and track
progress toward those requirements.

:::

---

## Framework Overview

The CRL framework consists of three interconnected readiness scales:

| Scale   | Focus Area            | Key Question                    |
| ------- | --------------------- | ------------------------------- |
| **DRL** | Detection Readiness   | Can we find the threat?         |
| **KRL** | Kill/Defeat Readiness | Can we neutralize the threat?   |
| **IRL** | Integration Readiness | Can we work with other systems? |

**Combined CRL Score** = Average of DRL, KRL, and IRL levels

---

## Detection Readiness Levels (DRL)

Detection capability is the foundation of any CUAS system. Without reliable
detection, defeat mechanisms cannot be employed effectively.

### DRL Scale Definition

| Level     | Name                      | Description                         | Validation Criteria                      |
| --------- | ------------------------- | ----------------------------------- | ---------------------------------------- |
| **DRL-1** | Concept Validation        | Detection concept proven in lab     | Simulation results, theoretical analysis |
| **DRL-2** | Single-Sensor Prototype   | One sensor type detects UAS         | Lab tests with controlled UAS            |
| **DRL-3** | Multi-Sensor Prototype    | Multiple sensors integrated         | Combined RF, radar, optical detection    |
| **DRL-4** | Field-Validated Detection | Detection proven against real UAS   | Outdoor tests, real drone targets        |
| **DRL-5** | All-Weather Detection     | Reliable day/night, varied weather  | Tests in rain, fog, low light            |
| **DRL-6** | Multi-Target Tracking     | Simultaneous 5+ UAS tracking        | Classification and prioritization        |
| **DRL-7** | Swarm Detection           | Coordinated swarm tracking          | 10+ drone swarm scenarios                |
| **DRL-8** | Operational Detection     | Full capability, <5% false positive | Extended operational testing             |

### DRL Roadmap: Phoenix Rooivalk

```
Current State: DRL-4 (Field-Validated Detection)
Target State:  DRL-6 (Multi-Target Tracking)
```

#### Phase 1: DRL-4 → DRL-5 (All-Weather Detection)

| Task                      | Description                           | Duration | Dependencies         |
| ------------------------- | ------------------------------------- | -------- | -------------------- |
| Night sensor integration  | IR/thermal camera integration         | 4 weeks  | Hardware procurement |
| Low-light testing         | Validate detection in <50 lux         | 2 weeks  | Night sensors        |
| Weather resilience        | Test in rain, fog, wind               | 3 weeks  | Weather conditions   |
| Performance documentation | Document detection rates by condition | 1 week   | All testing          |

**Success Criteria:**

- [ ] Detection rate >85% in daylight
- [ ] Detection rate >75% at night
- [ ] Detection rate >70% in adverse weather
- [ ] False positive rate <10%

#### Phase 2: DRL-5 → DRL-6 (Multi-Target Tracking)

| Task                   | Description                      | Duration | Dependencies        |
| ---------------------- | -------------------------------- | -------- | ------------------- |
| Multi-target algorithm | Track 5+ simultaneous targets    | 6 weeks  | DRL-5 validation    |
| Classification system  | Identify UAS type/threat level   | 4 weeks  | ML model training   |
| Priority assignment    | Automatic threat prioritization  | 3 weeks  | Classification      |
| Track handoff          | Seamless tracking across sensors | 2 weeks  | Multi-sensor fusion |

**Success Criteria:**

- [ ] Simultaneous tracking of 5+ UAS
- [ ] Classification accuracy >80%
- [ ] Track continuity >95%
- [ ] Handoff latency <500ms

---

## Defeat/Kill Readiness Levels (KRL)

Defeat capability determines whether detected threats can be neutralized. KRL
applies to both soft-kill (jamming, cyber) and hard-kill (kinetic) solutions.

### KRL Scale Definition

| Level     | Name                    | Description                          | Validation Criteria               |
| --------- | ----------------------- | ------------------------------------ | --------------------------------- |
| **KRL-1** | Concept Validation      | Defeat mechanism proven in lab       | Controlled environment success    |
| **KRL-2** | Static Target Defeat    | Defeat hovering/slow UAS             | Stationary or slow-moving targets |
| **KRL-3** | Moving Target Defeat    | Defeat maneuvering UAS <20 m/s       | Dynamic target engagement         |
| **KRL-4** | High-Speed Defeat       | Defeat UAS at >20 m/s                | Fast-moving target engagement     |
| **KRL-5** | Multi-Target Engagement | Sequential defeat of 3+ targets      | Rapid re-engagement capability    |
| **KRL-6** | Simultaneous Engagement | Multiple UAS defeated at once        | Parallel neutralization           |
| **KRL-7** | Swarm Defeat            | Effective against coordinated swarms | 10+ drone swarm defense           |
| **KRL-8** | Operational Defeat      | >90% defeat rate operationally       | Extended combat testing           |

### KRL Roadmap: Phoenix Rooivalk

```
Current State: KRL-3 (Moving Target Defeat)
Target State:  KRL-5 (Multi-Target Engagement)
```

#### Phase 1: KRL-3 → KRL-4 (High-Speed Defeat)

| Task                       | Description                       | Duration | Dependencies             |
| -------------------------- | --------------------------------- | -------- | ------------------------ |
| Pursuit algorithm upgrade  | Intercept calculation for >20 m/s | 4 weeks  | Current baseline         |
| Interceptor speed increase | Improve max velocity to 25+ m/s   | 6 weeks  | Motor/propulsion upgrade |
| Predictive targeting       | Lead computation for fast targets | 3 weeks  | Algorithm development    |
| High-speed validation      | Test against 20-30 m/s targets    | 2 weeks  | Hardware + software      |

**Success Criteria:**

- [ ] Successful intercept at 20 m/s target speed
- [ ] Successful intercept at 25 m/s target speed
- [ ] Intercept success rate >70% at high speed
- [ ] Time to intercept <30 seconds from detection

#### Phase 2: KRL-4 → KRL-5 (Multi-Target Engagement)

| Task                           | Description                        | Duration | Dependencies            |
| ------------------------------ | ---------------------------------- | -------- | ----------------------- |
| Multi-interceptor coordination | Launch and manage 3+ interceptors  | 5 weeks  | KRL-4 validation        |
| Target assignment logic        | Optimal interceptor-target pairing | 3 weeks  | Algorithm development   |
| Rapid reload system            | Quick interceptor replenishment    | 4 weeks  | Mechanical design       |
| Sequential engagement test     | Defeat 3 targets in sequence       | 2 weeks  | Full system integration |

**Success Criteria:**

- [ ] Launch 3 interceptors within 60 seconds
- [ ] Defeat 3 sequential targets
- [ ] Re-engagement time <45 seconds
- [ ] Multi-target success rate >60%

---

## Integration Readiness Levels (IRL)

Integration capability determines how well the CUAS system works within broader
military command and control (C2) architectures.

### IRL Scale Definition

| Level     | Name                       | Description                        | Validation Criteria          |
| --------- | -------------------------- | ---------------------------------- | ---------------------------- |
| **IRL-1** | Standalone Operation       | System operates independently      | Self-contained functionality |
| **IRL-2** | Data Export                | Export detection data (JSON, XML)  | Standard format output       |
| **IRL-3** | C2 Interface               | Basic command/control integration  | API for external commands    |
| **IRL-4** | Network Integration        | Full network with other sensors    | Sensor fusion across systems |
| **IRL-5** | STANAG Compliance          | NATO STANAG 4586/4609 compliant    | Certification testing        |
| **IRL-6** | Multi-Domain Integration   | Air, land, sea domain integration  | Cross-domain operations      |
| **IRL-7** | Coalition Interoperability | Allied nation system compatibility | Joint exercise validation    |
| **IRL-8** | Full Battle Management     | Theater-level BMS integration      | Operational deployment       |

### IRL Roadmap: Phoenix Rooivalk

```
Current State: IRL-3 (C2 Interface)
Target State:  IRL-5 (STANAG Compliance)
```

#### Phase 1: IRL-3 → IRL-4 (Network Integration)

| Task                     | Description                     | Duration | Dependencies         |
| ------------------------ | ------------------------------- | -------- | -------------------- |
| Sensor fusion protocol   | Integrate external sensor feeds | 4 weeks  | API framework        |
| Common operating picture | Shared tactical display         | 3 weeks  | Data standardization |
| Network resilience       | Handle network degradation      | 2 weeks  | Fallback modes       |
| Multi-node testing       | Test with 3+ networked systems  | 2 weeks  | Test infrastructure  |

**Success Criteria:**

- [ ] Ingest data from 3+ external sensors
- [ ] Common operating picture latency <1 second
- [ ] Graceful degradation on network loss
- [ ] Successful multi-node demonstration

#### Phase 2: IRL-4 → IRL-5 (STANAG Compliance)

| Task                       | Description                    | Duration | Dependencies            |
| -------------------------- | ------------------------------ | -------- | ----------------------- |
| STANAG 4586 implementation | UAS control interface standard | 6 weeks  | IRL-4 validation        |
| STANAG 4609 implementation | Motion imagery standard        | 4 weeks  | Video systems           |
| Compliance documentation   | Technical compliance matrix    | 3 weeks  | Implementation complete |
| Interoperability testing   | Test with STANAG systems       | 2 weeks  | Partner coordination    |

**Success Criteria:**

- [ ] STANAG 4586 Level 2+ compliance
- [ ] STANAG 4609 compliant video output
- [ ] Successful interop with NATO partner system
- [ ] Compliance documentation complete

---

## Phoenix Rooivalk CRL Assessment

### Current State Assessment

| Capability        | Level | Score   | Evidence                               |
| ----------------- | ----- | ------- | -------------------------------------- |
| Detection (DRL)   | DRL-4 | 4       | Field tests with real drones completed |
| Defeat (KRL)      | KRL-3 | 3       | Moving target intercepts demonstrated  |
| Integration (IRL) | IRL-3 | 3       | Basic C2 API operational               |
| **Combined CRL**  | -     | **3.3** | Average across capabilities            |

### Target State (CUAS Sandbox 2026)

| Capability        | Level | Score   | Gap                     |
| ----------------- | ----- | ------- | ----------------------- |
| Detection (DRL)   | DRL-6 | 6       | +2 levels               |
| Defeat (KRL)      | KRL-5 | 5       | +2 levels               |
| Integration (IRL) | IRL-5 | 5       | +2 levels               |
| **Combined CRL**  | -     | **5.3** | +2.0 improvement needed |

### CUAS Sandbox 2026 Minimum Requirements

:::warning Required Readiness for CUAS Sandbox

Based on the program requirements and TRL 5 mandate:

| Category            | Minimum DRL | Minimum KRL | Minimum IRL |
| ------------------- | ----------- | ----------- | ----------- |
| **Detect Only**     | DRL-4       | N/A         | IRL-3       |
| **Defeat Only**     | N/A         | KRL-3       | IRL-3       |
| **Detect & Defeat** | DRL-4       | KRL-3       | IRL-3       |

**Current Phoenix Rooivalk Status: MEETS MINIMUM REQUIREMENTS**

However, to be competitive and demonstrate "good growth potential" for Diamond
in the Rough prizes, targeting higher levels is recommended.

:::

---

## Readiness Gap Analysis

### Critical Gaps for CUAS Sandbox 2026

| Gap Area              | Current | Required | Priority | Effort      |
| --------------------- | ------- | -------- | -------- | ----------- |
| Multi-target tracking | DRL-4   | DRL-5+   | High     | 8-10 weeks  |
| High-speed intercept  | KRL-3   | KRL-4+   | High     | 10-12 weeks |
| STANAG compliance     | IRL-3   | IRL-4+   | Medium   | 12-15 weeks |
| All-weather detection | DRL-4   | DRL-5    | Medium   | 6-8 weeks   |

### Recommended Focus Areas

1. **Immediate (Next 4 weeks):** Document current DRL-4, KRL-3, IRL-3
   capabilities
2. **Short-term (4-8 weeks):** Achieve DRL-5 (all-weather detection)
3. **Medium-term (8-16 weeks):** Achieve KRL-4 (high-speed defeat)
4. **Long-term (16-24 weeks):** Achieve IRL-5 (STANAG compliance)

---

## Validation Requirements

### Evidence Required for Each Level

| Level Type              | Documentation Required                          |
| ----------------------- | ----------------------------------------------- |
| **Concept (1)**         | Technical reports, simulation results           |
| **Prototype (2-3)**     | Lab test reports, component specs               |
| **Field-Validated (4)** | Field test videos, performance data             |
| **All-Conditions (5)**  | Multi-environment test reports                  |
| **Operational (6-8)**   | Extended operation logs, third-party validation |

### CUAS Sandbox Specific Evidence

For the Canada CUAS Sandbox 2026, the following evidence types are particularly
valued:

- **3-minute demonstration video** (unedited)
- **Test Plan documentation**
- **RF spectrum analysis** (if applicable, DND 552)
- **Company/technology one-pager**

---

## Related Documents

- [CUAS Sandbox 2026 Overview](./cuas-sandbox-2026)
- [CUAS Sandbox Application](../applications/cuas-sandbox-2026-application)
- [Missing Documents Checklist](../applications/cuas-sandbox-missing-documents)
- [Eligibility Assessment](../applications/cuas-sandbox-eligibility-assessment)

---

_This framework is based on industry standards and adapted for Phoenix
Rooivalk's counter-UAS development program. © 2025 Phoenix Rooivalk. All rights
reserved._
