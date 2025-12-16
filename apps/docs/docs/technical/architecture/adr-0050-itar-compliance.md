---
id: adr-0050-itar-compliance
title: "ADR 0050: ITAR Compliance Architecture"
sidebar_label: "ADR 0050: ITAR Compliance"
difficulty: expert
estimated_reading_time: 15
points: 75
tags:
  - technical
  - architecture
  - compliance
  - itar
  - export-control
  - legal
  - defense
prerequisites:
  - architecture-decision-records
  - adr-0007-security-architecture
  - adr-0008-compliance-architecture
---

# ADR 0050: ITAR Compliance Architecture

**Date**: 2025-12-12 **Status**: Proposed (Critical for US Market Entry)

---

## Executive Summary

1. **Problem**: Phoenix Rooivalk's counter-UAS technology may be subject to US
   ITAR (International Traffic in Arms Regulations), requiring compliance
   architecture before US accelerator participation (SOSV) or defense contracts
2. **Decision**: Implement ITAR-compliant architecture with data segregation,
   access controls, and audit trails from the start
3. **Trade-off**: Development complexity and cost vs. US market access and
   defense contract eligibility

---

## Context

### Regulatory Landscape

**ITAR** (22 CFR 120-130) controls:

- Defense articles (USML Categories)
- Technical data related to defense articles
- Defense services

**Relevant USML Categories for C-UAS**:

| Category | Description                      | Relevance                |
| -------- | -------------------------------- | ------------------------ |
| IV       | Launch vehicles, guided missiles | Net launcher may qualify |
| XI       | Military electronics             | Sensor fusion, targeting |
| XII      | Fire control systems             | Autonomous engagement    |
| XIII     | Materials/miscellaneous          | Specialized materials    |

### Why ITAR Matters

1. **SOSV Application**: US-based hardware accelerator, may require ITAR-ready
   posture
2. **US Defense Contracts**: DoD procurement requires ITAR compliance
3. **US Investors**: Export control violations create liability risk
4. **Penalties**: Criminal penalties up to $1M and 20 years imprisonment per
   violation

### Current Status

- **No ITAR determination**: Have not yet obtained formal USML classification
- **Non-US development**: Currently developing in South Africa
- **Mixed team**: US persons potentially involved in technical work
- **Cloud infrastructure**: Azure resources in multiple regions

---

## Options Considered

### Option 1: Ignore Until Required ❌

Proceed without ITAR architecture; address when needed.

**Pros**: No upfront cost, faster initial development **Cons**:

- **Retroactive compliance**: Extremely expensive and disruptive
- **Deal breaker**: Disqualifies from US accelerators/contracts
- **Legal exposure**: Potential violations during development

### Option 2: Full ITAR Registration Now ❌

Register with DDTC and implement full compliance immediately.

**Pros**: Complete compliance, US market ready **Cons**:

- **Premature cost**: $2,750/year registration + compliance costs
- **Overhead**: Significant administrative burden
- **May not be needed**: If classification excludes us

### Option 3: ITAR-Ready Architecture ✅ Selected

Design architecture for ITAR compliance; implement controls before US
engagement.

**Pros**:

- **Prepared**: Ready to activate when needed
- **Minimal overhead**: No registration until required
- **Risk mitigation**: Architecture prevents inadvertent violations
- **Investor confidence**: Demonstrates regulatory awareness

**Cons**:

- **Some upfront cost**: Architecture design effort
- **Constraints**: May limit some development practices

---

## Decision

Adopt **Option 3: ITAR-Ready Architecture**.

Implement technical and procedural controls that enable ITAR compliance
activation when:

- Formal USML classification obtained
- US accelerator participation confirmed
- US defense contract pursued

---

## Technical Architecture

### Data Classification Framework

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA CLASSIFICATION LEVELS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ LEVEL 0: PUBLIC                                                  ││
│  │ Marketing materials, public documentation, open-source code      ││
│  │ Access: Anyone                                                   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ LEVEL 1: INTERNAL                                                ││
│  │ Business documents, internal processes, general technical docs   ││
│  │ Access: Team members (any nationality)                           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ LEVEL 2: EXPORT-CONTROLLED (EAR)                                 ││
│  │ Dual-use technology, commercial encryption, sensor specs         ││
│  │ Access: Screened persons, export license may be required         ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ LEVEL 3: ITAR-CONTROLLED                                         ││
│  │ Defense articles, targeting algorithms, engagement logic         ││
│  │ Access: US Persons ONLY (citizens, permanent residents)          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Repository Segregation

```
phoenix-rooivalk/                    # PUBLIC + INTERNAL (Level 0-1)
├── apps/
│   ├── docs/                        # Public documentation
│   └── marketing/                   # Public website
├── packages/                        # Shared utilities (Level 1)
└── README.md                        # Public

phoenix-rooivalk-controlled/         # EXPORT-CONTROLLED (Level 2)
├── sensors/                         # Sensor integration code
├── fusion/                          # Sensor fusion algorithms
└── targeting/                       # Target tracking (non-engagement)

phoenix-rooivalk-itar/               # ITAR (Level 3) - FUTURE
├── engagement/                      # ROE enforcement
├── effector-control/                # Weapon system integration
└── autonomous-decision/             # Lethal autonomy logic
```

### Access Control Matrix

| Role                 | Level 0 | Level 1 | Level 2 | Level 3 |
| -------------------- | ------- | ------- | ------- | ------- |
| Public               | ✅      | ❌      | ❌      | ❌      |
| Team (Non-US)        | ✅      | ✅      | ⚠️\*    | ❌      |
| Team (US Person)     | ✅      | ✅      | ✅      | ✅      |
| Investor (Non-US)    | ✅      | ✅      | ❌      | ❌      |
| Investor (US Person) | ✅      | ✅      | ✅      | ⚠️\*\*  |
| DoD Contractor       | ✅      | ✅      | ✅      | ✅      |

\* Requires export license determination \*\* Requires need-to-know and NDA

### Infrastructure Segregation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AZURE INFRASTRUCTURE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐│
│  │   PUBLIC SUBSCRIPTION   │    │   CONTROLLED SUBSCRIPTION        ││
│  │   (nl-prod-rooivalk)    │    │   (nl-prod-rooivalk-ctrl)       ││
│  │                         │    │                                  ││
│  │   • Marketing SWA       │    │   • Sensor processing           ││
│  │   • Docs SWA            │    │   • Model training              ││
│  │   • Public APIs         │    │   • Evidence storage            ││
│  │                         │    │   • US-ONLY region (eastus2)    ││
│  │   Region: Any           │    │   Region: US ONLY               ││
│  └─────────────────────────┘    └─────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │   ITAR SUBSCRIPTION (FUTURE)                                     ││
│  │   (nl-prod-rooivalk-itar)                                       ││
│  │                                                                  ││
│  │   • Engagement logic                                            ││
│  │   • Effector control                                            ││
│  │   • US Person access only                                       ││
│  │   • Azure Government (future)                                   ││
│  │   • Region: US ONLY                                             ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Procedural Controls

### Personnel Screening

Before Level 2/3 access:

1. **Citizenship verification**: Passport/birth certificate
2. **US Person determination**: Citizen, permanent resident, protected person
3. **Denied parties screening**: BIS, OFAC, DDTC lists
4. **NDA execution**: Confidentiality agreement
5. **Security briefing**: Export control awareness training

### Technology Control Plan (TCP)

| Control Area      | Measure                                       |
| ----------------- | --------------------------------------------- |
| Physical security | Secured development environment               |
| Network security  | VPN, firewall, intrusion detection            |
| Access control    | Role-based, MFA required                      |
| Audit logging     | All access to controlled data logged          |
| Visitor control   | No unescorted access to controlled areas      |
| Foreign travel    | Pre-approval for devices with controlled data |
| Publications      | Review before public release                  |

### Audit Trail Requirements

```rust
pub struct AccessAuditLog {
    pub timestamp: DateTime<Utc>,
    pub user_id: String,
    pub user_citizenship: Citizenship,
    pub resource_classification: DataLevel,
    pub resource_id: String,
    pub action: AccessAction,
    pub ip_address: IpAddr,
    pub device_id: String,
    pub justification: Option<String>,
    pub approved_by: Option<String>,
}

pub enum DataLevel {
    Public,
    Internal,
    ExportControlled,
    ITAR,
}

pub enum AccessAction {
    View,
    Download,
    Modify,
    Delete,
    Export,
    Share,
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Current)

| Task                          | Status      | Owner |
| ----------------------------- | ----------- | ----- |
| Data classification scheme    | ✅ Defined  | Jurie |
| Repository structure planning | ✅ Designed | Team  |
| Access control design         | ✅ Designed | Team  |
| Azure subscription separation | 📅 Planned  | Jurie |

### Phase 2: Pre-US Engagement (Before SOSV)

| Task                               | Timeline | Owner  |
| ---------------------------------- | -------- | ------ |
| Formal USML classification request | Q1 2026  | Legal  |
| Repository segregation             | Q1 2026  | Jurie  |
| Personnel screening process        | Q1 2026  | Martyn |
| Export control training            | Q1 2026  | All    |

### Phase 3: ITAR Activation (If Required)

| Task                            | Timeline    | Owner    |
| ------------------------------- | ----------- | -------- |
| DDTC registration ($2,750/year) | When needed | Legal    |
| Azure Government migration      | When needed | Jurie    |
| Full TCP implementation         | When needed | Team     |
| Annual compliance audit         | Ongoing     | External |

---

## Cost Analysis

### ITAR-Ready (Current Phase)

| Item                          | Cost         | Frequency |
| ----------------------------- | ------------ | --------- |
| Architecture design           | Internal     | One-time  |
| Repository setup              | Internal     | One-time  |
| Azure subscription separation | ~$50/month   | Ongoing   |
| **Total**                     | **~$600/yr** | -         |

### Full ITAR Compliance (Future)

| Item                           | Cost         | Frequency |
| ------------------------------ | ------------ | --------- |
| DDTC registration              | $2,750       | Annual    |
| Legal counsel (ITAR)           | $10,000+     | As needed |
| Compliance officer (part-time) | $20,000+     | Annual    |
| Azure Government premium       | ~$200/month  | Ongoing   |
| Annual audit                   | $5,000+      | Annual    |
| **Total**                      | **~$45K/yr** | -         |

### ROI Justification

- US defense market: $20B+ C-UAS opportunity
- SOSV acceptance: $500K investment potential
- Legal protection: Avoid $1M+ violation penalties

---

## Consequences

### Positive

- **US market access**: Eligible for defense contracts and accelerators
- **Investor confidence**: Demonstrates regulatory sophistication
- **Legal protection**: Prevents inadvertent export violations
- **Competitive advantage**: Many startups ignore until too late

### Negative

- **Development overhead**: Segregation adds complexity
- **Cost**: $45K+/year when fully activated
- **Team constraints**: Non-US persons excluded from some work
- **Slower iteration**: Review process for controlled tech

### Neutral

- **Deferred decision**: Registration only when needed
- **Scalable**: Architecture ready for DoD-level compliance

---

## Related ADRs

- [ADR 0007: Security Architecture](./architecture-decision-records#adr-0007-security-architecture) -
  Zero-trust foundation
- [ADR 0008: Compliance Architecture](./architecture-decision-records#adr-0008-compliance-architecture) -
  General compliance
- [ADR 0040: Edge-Cloud Communication](./adr-0040-edge-cloud-communication) -
  Data handling
- [ADR 0025: Azure Naming](./adr-0025-azure-naming-conventions) - Subscription
  structure

---

## Open Questions

1. **USML classification**: Formal determination needed - is C-UAS net launcher
   covered?
2. **South African NCACC**: Local export control requirements parallel to ITAR?
3. **Dual registration**: Can we maintain both US and SA export licenses?
4. **Team structure**: How to handle mixed US/non-US development team?

---

## References

- [ITAR (22 CFR 120-130)](https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M)
- [USML Categories](https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-121)
- [DDTC Registration](https://www.pmddtc.state.gov/ddtc_public)
- [BIS Export Administration Regulations](https://www.bis.doc.gov/index.php/regulations/export-administration-regulations-ear)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record. CONFIDENTIAL._
