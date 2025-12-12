---
id: adr-0051-export-control-sa-ncacc
title: "ADR 0051: South African Export Control (NCACC)"
sidebar_label: "ADR 0051: SA Export Control"
difficulty: expert
estimated_reading_time: 12
points: 60
tags:
  - technical
  - architecture
  - compliance
  - export-control
  - legal
  - south-africa
  - ncacc
prerequisites:
  - architecture-decision-records
  - adr-0050-itar-compliance
---

# ADR 0051: South African Export Control (NCACC) Compliance

**Date**: 2025-12-12 **Status**: Proposed (Critical for Export)

---

## Executive Summary

1. **Problem**: Phoenix Rooivalk's counter-UAS technology is subject to South African export controls under the National Conventional Arms Control Act (NCAC Act)
2. **Decision**: Implement dual-compliance architecture that satisfies both SA NCACC requirements and US ITAR readiness
3. **Trade-off**: Compliance overhead vs. international market access

---

## Context

### South African Regulatory Framework

| Regulation | Authority | Scope |
|------------|-----------|-------|
| NCAC Act (2002) | NCACC | Conventional arms, ammunition, related equipment |
| Non-Proliferation Act | NPC | WMD-related, dual-use |
| Firearms Control Act | SAPS | Civilian firearms |
| Civil Aviation Act | SACAA | UAV operations |

### NCACC Controlled Items (Relevant)

| Category | Description | Phoenix Relevance |
|----------|-------------|-------------------|
| ML4 | Bombs, torpedoes, missiles | Net launcher TBD |
| ML5 | Fire control systems | Targeting system |
| ML11 | Electronic equipment | Sensors, radar |
| ML21 | Software for controlled items | AI/ML algorithms |
| ML22 | Technology for controlled items | Technical data |

### Why This Matters

1. **SA-based development**: Primary development in South Africa
2. **Export to US**: SOSV participation requires controlled technology transfer
3. **Dual compliance**: Must satisfy both SA and US requirements
4. **Criminal liability**: NCACC violations carry imprisonment up to 25 years

---

## Options Considered

### Option 1: Single-Jurisdiction Focus ❌

Focus only on ITAR, address NCACC later.

**Pros**: Simpler initial compliance
**Cons**:
- **Illegal exports**: SA exports without NCACC approval are criminal
- **Retroactive compliance**: Cannot undo violations
- **Market restriction**: Cannot export from SA

### Option 2: Dual-Compliance Architecture ✅ Selected

Design for both NCACC and ITAR from the start.

**Pros**:
- **Legal operations**: Compliant in both jurisdictions
- **Market flexibility**: Can export to US and other markets
- **Investor confidence**: Demonstrates regulatory sophistication

**Cons**:
- **Complexity**: Two compliance regimes
- **Cost**: Dual permit applications

---

## Decision

Adopt **dual-compliance architecture** with:

### Compliance Framework

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Dual Export Control Framework                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    TECHNOLOGY CLASSIFICATION                     ││
│  │                                                                  ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Assess     │  │   Classify   │  │   Apply      │          ││
│  │  │   Technology │─▶│   Under Both │─▶│   Higher     │          ││
│  │  │              │  │   Regimes    │  │   Standard   │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  │                                                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │    SA NCACC Controls     │  │    US ITAR Controls      │        │
│  │                          │  │                          │        │
│  │  • ML4-ML22 categories   │  │  • USML categories       │        │
│  │  • NCACC permit required │  │  • DDTC registration     │        │
│  │  • End-user certificate  │  │  • DSP-5 license         │        │
│  │  • Delivery verification │  │  • End-use monitoring    │        │
│  │                          │  │                          │        │
│  └──────────────────────────┘  └──────────────────────────┘        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    APPLY STRICTER REQUIREMENT                    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## NCACC Permit Process

### Permit Types

| Type | Use Case | Validity |
|------|----------|----------|
| Registration | Required for all arms dealers | Annual |
| Export Permit | Each export transaction | Per shipment |
| End-User Certificate | Required from recipient | Per transaction |
| Transit Permit | Goods passing through SA | Per transit |

### Application Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NCACC Export Permit Process                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. ┌────────────────┐                                              │
│     │  Company       │  Register as arms dealer with NCACC          │
│     │  Registration  │  (Required before any permit application)    │
│     └───────┬────────┘                                              │
│             ▼                                                        │
│  2. ┌────────────────┐                                              │
│     │  Classification│  NCACC confirms ML category                  │
│     │  Request       │  (Optional but recommended)                  │
│     └───────┬────────┘                                              │
│             ▼                                                        │
│  3. ┌────────────────┐                                              │
│     │  End-User      │  Obtain from recipient country               │
│     │  Certificate   │  (Government or authorized entity)          │
│     └───────┬────────┘                                              │
│             ▼                                                        │
│  4. ┌────────────────┐                                              │
│     │  Export Permit │  Submit to NCACC Secretariat                 │
│     │  Application   │  Processing: 30-90 days                      │
│     └───────┬────────┘                                              │
│             ▼                                                        │
│  5. ┌────────────────┐                                              │
│     │  NCACC         │  Committee review (monthly meetings)         │
│     │  Approval      │  May request additional info                 │
│     └───────┬────────┘                                              │
│             ▼                                                        │
│  6. ┌────────────────┐                                              │
│     │  Export with   │  Customs clearance with permit               │
│     │  Permit        │  Delivery verification certificate           │
│     └────────────────┘                                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Classification Mapping

### SA ML to US USML

| SA Category | US Category | Phoenix Component |
|-------------|-------------|-------------------|
| ML4 | IV | Net launcher (TBD) |
| ML5 | XII | Targeting/fire control |
| ML11 | XI | Sensors, electronics |
| ML21 | - | Software |
| ML22 | - | Technical data |

### Controlled Components Matrix

| Component | SA ML | US USML | Controls Apply |
|-----------|-------|---------|----------------|
| Net launcher | ML4? | IV? | Pending classification |
| Radar module | ML11 | XI | Yes (dual-use threshold) |
| Targeting AI | ML21 | - | Yes (for controlled items) |
| Sensor fusion | ML21 | XI | Yes |
| Evidence system | No | No | General encryption rules |
| Documentation portal | No | No | Public information |

---

## Technical Controls

### Data Segregation (Enhanced for Dual Compliance)

```
phoenix-rooivalk/                    # PUBLIC (No controls)
├── apps/docs/                       # Public documentation
├── apps/marketing/                  # Marketing materials
└── packages/                        # OSS utilities

phoenix-rooivalk-controlled/         # SA ML11/ML21 + US EAR
├── sensors/                         # Radar, camera integration
├── fusion/                          # Sensor fusion
└── tracking/                        # Target tracking

phoenix-rooivalk-defense/            # SA ML4/ML5 + US ITAR
├── targeting/                       # Fire control
├── effector/                        # Net launcher
└── engagement/                      # ROE enforcement
```

### Access Control

```rust
pub struct DualExportControl {
    /// SA NCACC classification
    ncacc_category: Option<NCACCCategory>,
    /// US ITAR/EAR classification
    us_classification: Option<USClassification>,
}

pub enum AccessDecision {
    /// Allowed access
    Granted,
    /// Denied - provide reason
    Denied { reason: DenialReason },
    /// Requires permit - specify which
    RequiresPermit { permits: Vec<PermitType> },
}

impl DualExportControl {
    pub fn check_access(
        &self,
        user: &User,
        resource: &Resource,
    ) -> AccessDecision {
        // Check SA controls first (origin country)
        if let Some(ncacc) = &self.ncacc_category {
            if !user.has_ncacc_clearance(ncacc) {
                return AccessDecision::Denied {
                    reason: DenialReason::NCACCRestricted,
                };
            }
        }

        // Then US controls (for US market)
        if let Some(us) = &self.us_classification {
            match us {
                USClassification::ITAR(cat) => {
                    if !user.is_us_person() {
                        return AccessDecision::Denied {
                            reason: DenialReason::ITARRestricted,
                        };
                    }
                }
                USClassification::EAR(eccn) => {
                    if user.is_denied_party() {
                        return AccessDecision::Denied {
                            reason: DenialReason::DeniedParty,
                        };
                    }
                }
            }
        }

        AccessDecision::Granted
    }
}
```

---

## Compliance Records

### Required Documentation

| Document | SA Requirement | US Requirement | Retention |
|----------|----------------|----------------|-----------|
| Export permits | 5 years | 5 years | 5 years |
| End-user certificates | 5 years | 5 years | 5 years |
| Delivery verification | Yes | Varies | 5 years |
| Technology transfer records | Yes | Yes | 5 years |
| Classification determinations | Recommended | Required | Indefinite |

### Audit Log Structure

```rust
pub struct ExportControlLog {
    pub timestamp: DateTime<Utc>,
    pub event_type: ExportControlEvent,
    pub user_id: String,
    pub resource_id: String,
    pub classification: DualExportControl,
    pub jurisdiction: Vec<Jurisdiction>,
    pub permit_reference: Option<String>,
    pub decision: AccessDecision,
    pub evidence_hash: [u8; 32],
}

pub enum ExportControlEvent {
    AccessRequest,
    DataTransfer,
    TechnologyDisclosure,
    ExportShipment,
    PermitApplication,
    ClassificationDetermination,
}
```

---

## Implementation Phases

### Phase 1: Classification (Q1 2026)

| Task | Owner | Status |
|------|-------|--------|
| Request NCACC classification | Legal | Planned |
| Document ML category mapping | Jurie | Planned |
| Parallel USML assessment | Legal | Planned |

### Phase 2: Registration (Q1-Q2 2026)

| Task | Owner | Status |
|------|-------|--------|
| NCACC dealer registration | Martyn | Planned |
| Compliance officer appointment | Team | Planned |
| Internal controls implementation | Jurie | Planned |

### Phase 3: First Export (When needed)

| Task | Owner | Status |
|------|-------|--------|
| End-user certificate from SOSV | Legal | Future |
| Export permit application | Legal | Future |
| DDTC registration (US) | Legal | Future |

---

## Cost Analysis

### SA NCACC Costs

| Item | Cost (ZAR) | Frequency |
|------|------------|-----------|
| Dealer registration | ~R5,000 | Annual |
| Export permit application | ~R1,000 | Per export |
| Legal consultation | R50,000+ | As needed |
| Compliance officer | R200,000+ | Annual (part-time) |

### Combined Compliance Budget

| Item | Annual Cost (USD) |
|------|-------------------|
| SA compliance | ~$15,000 |
| US compliance (when active) | ~$45,000 |
| **Total (dual)** | **~$60,000** |

---

## Consequences

### Positive

- **Legal operations**: Compliant in both jurisdictions
- **Market access**: Export to US, allies, approved countries
- **Investor confidence**: Clean compliance record
- **Risk mitigation**: Avoid criminal liability

### Negative

- **Complexity**: Dual regime navigation
- **Cost**: ~$60K/year when fully active
- **Time**: Permit processing adds delays
- **Restrictions**: Some markets prohibited

---

## Related ADRs

- [ADR 0050: ITAR Compliance](./adr-0050-itar-compliance)
- [ADR 0007: Security Architecture](./architecture-decision-records#adr-0007-security-architecture)
- [ADR 0052: Data Retention Policies](./adr-0052-data-retention-policies)

---

## References

- [NCAC Act 41 of 2002](https://www.gov.za/documents/national-conventional-arms-control-act)
- [NCACC Secretariat](https://www.thedtic.gov.za/sectors-and-services-2/ncacc/)
- [SA Export Control Guidelines](https://www.thedtic.gov.za/)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record. CONFIDENTIAL._
