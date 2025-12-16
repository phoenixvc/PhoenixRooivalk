---
id: adr-0052-data-retention-policies
title: "ADR 0052: Data Retention Policies"
sidebar_label: "ADR 0052: Data Retention"
difficulty: intermediate
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - compliance
  - data
  - retention
  - legal
  - gdpr
  - popia
prerequisites:
  - architecture-decision-records
  - adr-0007-security-architecture
---

# ADR 0052: Data Retention Policies

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Different data types have different legal retention
   requirements, storage costs, and operational needs
2. **Decision**: Implement tiered retention policy with automated lifecycle
   management, legal hold capability, and jurisdiction-aware purging
3. **Trade-off**: Storage costs vs. legal compliance and operational value

---

## Context

### Legal Requirements

| Jurisdiction | Regulation | Retention Requirements                  |
| ------------ | ---------- | --------------------------------------- |
| South Africa | POPIA      | Personal data: purpose-limited          |
| EU           | GDPR       | Personal data: minimize retention       |
| US           | Various    | Industry-specific (defense: 5-10 years) |
| Aviation     | ICAO       | Flight data: varies by incident         |

### Data Categories

| Category    | Example          | Sensitivity | Volume    |
| ----------- | ---------------- | ----------- | --------- |
| Evidence    | Engagement logs  | Critical    | Medium    |
| Operational | Track history    | High        | High      |
| Telemetry   | Sensor readings  | Medium      | Very High |
| Audit       | Access logs      | Medium      | High      |
| Debug       | Application logs | Low         | Very High |

---

## Decision

Implement **tiered retention policy** with four retention classes:

### Retention Classes

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Retention Tiers                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TIER 1: PERMANENT                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • Engagement evidence (blockchain anchored)                      ││
│  │ • Legal hold data                                                ││
│  │ • Core configuration history                                     ││
│  │ Retention: Indefinite | Archive: Glacier Deep Archive           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  TIER 2: LONG-TERM (5 Years)                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • Operational audit logs                                         ││
│  │ • System configuration changes                                   ││
│  │ • Export control records                                         ││
│  │ Retention: 5 years | Archive: Glacier after 1 year              ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  TIER 3: MEDIUM-TERM (1 Year)                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • Track history (non-engagement)                                 ││
│  │ • Performance metrics                                            ││
│  │ • User activity logs                                             ││
│  │ Retention: 1 year | Archive: Cool storage after 90 days         ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  TIER 4: SHORT-TERM (30-90 Days)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • Raw telemetry                                                  ││
│  │ • Debug logs                                                     ││
│  │ • Temporary processing data                                      ││
│  │ Retention: 30-90 days | Auto-delete after retention             ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Classification

### Retention Matrix

| Data Type              | Tier | Retention     | Archive     | Purge      |
| ---------------------- | ---- | ------------- | ----------- | ---------- |
| Engagement evidence    | 1    | Permanent     | Glacier     | Never      |
| Legal hold items       | 1    | Hold duration | Glacier     | On release |
| Export control records | 2    | 5 years       | Glacier 1yr | Auto       |
| Audit logs             | 2    | 5 years       | Glacier 1yr | Auto       |
| Track history          | 3    | 1 year        | Cool 90d    | Auto       |
| Performance metrics    | 3    | 1 year        | Cool 90d    | Auto       |
| User activity          | 3    | 1 year        | Cool 90d    | Auto       |
| Raw telemetry          | 4    | 90 days       | None        | Auto       |
| Debug logs             | 4    | 30 days       | None        | Auto       |
| Temp processing        | 4    | 7 days        | None        | Auto       |

### Classification Rules

```rust
pub struct RetentionPolicy {
    pub tier: RetentionTier,
    pub retention_days: Option<u32>,  // None = permanent
    pub archive_after_days: Option<u32>,
    pub legal_hold_override: bool,
}

pub fn classify_data(data: &DataRecord) -> RetentionPolicy {
    match data.data_type {
        // Tier 1: Permanent
        DataType::EngagementEvidence => RetentionPolicy {
            tier: RetentionTier::Permanent,
            retention_days: None,
            archive_after_days: Some(365),
            legal_hold_override: false,
        },

        // Tier 2: Long-term
        DataType::AuditLog | DataType::ExportControlRecord => RetentionPolicy {
            tier: RetentionTier::LongTerm,
            retention_days: Some(5 * 365),
            archive_after_days: Some(365),
            legal_hold_override: true,
        },

        // Tier 3: Medium-term
        DataType::TrackHistory | DataType::PerformanceMetrics => RetentionPolicy {
            tier: RetentionTier::MediumTerm,
            retention_days: Some(365),
            archive_after_days: Some(90),
            legal_hold_override: true,
        },

        // Tier 4: Short-term
        DataType::RawTelemetry => RetentionPolicy {
            tier: RetentionTier::ShortTerm,
            retention_days: Some(90),
            archive_after_days: None,
            legal_hold_override: true,
        },
        DataType::DebugLog => RetentionPolicy {
            tier: RetentionTier::ShortTerm,
            retention_days: Some(30),
            archive_after_days: None,
            legal_hold_override: true,
        },
    }
}
```

---

## Lifecycle Management

### Automated Transitions

```rust
pub struct LifecycleManager {
    hot_storage: HotStorage,     // Cosmos DB, Blob Hot
    cool_storage: CoolStorage,   // Blob Cool
    archive_storage: ArchiveStorage,  // Blob Archive/Glacier
}

impl LifecycleManager {
    pub async fn process_lifecycle(&self) -> Result<LifecycleReport, Error> {
        let mut report = LifecycleReport::new();

        // Archive eligible data
        let to_archive = self.hot_storage
            .query_by_age(self.archive_threshold)
            .await?;

        for record in to_archive {
            let policy = classify_data(&record);

            if let Some(archive_days) = policy.archive_after_days {
                if record.age_days() >= archive_days {
                    // Check legal hold before archiving
                    if !self.legal_hold.is_held(&record.id).await? {
                        self.move_to_archive(&record).await?;
                        report.archived += 1;
                    }
                }
            }
        }

        // Purge expired data
        let to_purge = self.get_expired_data().await?;

        for record in to_purge {
            let policy = classify_data(&record);

            // Skip permanent data
            if policy.retention_days.is_none() {
                continue;
            }

            // Check legal hold
            if self.legal_hold.is_held(&record.id).await? {
                continue;
            }

            // Purge
            self.purge_record(&record).await?;
            report.purged += 1;
        }

        Ok(report)
    }
}
```

### Azure Lifecycle Policy

```json
{
  "rules": [
    {
      "name": "ArchiveAfter90Days",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["tracks/", "metrics/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 90
            }
          }
        }
      }
    },
    {
      "name": "DeleteDebugLogs",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["debug/"]
        },
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 30
            }
          }
        }
      }
    }
  ]
}
```

---

## Legal Hold

### Hold Management

```rust
pub struct LegalHold {
    holds: HashMap<HoldId, Hold>,
    held_records: HashMap<RecordId, Vec<HoldId>>,
}

pub struct Hold {
    pub id: HoldId,
    pub name: String,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub reason: String,
    pub scope: HoldScope,
    pub expires_at: Option<DateTime<Utc>>,
}

pub enum HoldScope {
    /// All data from a specific node
    Node(NodeId),
    /// All data in a time range
    TimeRange { start: DateTime<Utc>, end: DateTime<Utc> },
    /// Specific record IDs
    Records(Vec<RecordId>),
    /// All data matching query
    Query(String),
}

impl LegalHold {
    /// Apply legal hold
    pub async fn apply_hold(&mut self, hold: Hold) -> Result<HoldReport, Error> {
        let affected = self.find_affected_records(&hold.scope).await?;

        for record_id in &affected {
            self.held_records
                .entry(record_id.clone())
                .or_default()
                .push(hold.id.clone());
        }

        self.holds.insert(hold.id.clone(), hold);

        Ok(HoldReport { records_held: affected.len() })
    }

    /// Release legal hold
    pub async fn release_hold(&mut self, hold_id: &HoldId) -> Result<(), Error> {
        self.holds.remove(hold_id);

        // Remove hold reference from records
        for holds in self.held_records.values_mut() {
            holds.retain(|h| h != hold_id);
        }

        // Clean up records with no holds
        self.held_records.retain(|_, holds| !holds.is_empty());

        Ok(())
    }

    /// Check if record is held
    pub async fn is_held(&self, record_id: &RecordId) -> bool {
        self.held_records.contains_key(record_id)
    }
}
```

---

## PII Handling

### Personal Data Retention

| Data Element  | Retention        | Anonymization           | Deletion   |
| ------------- | ---------------- | ----------------------- | ---------- |
| Operator ID   | Session + 1 year | Hash after 1 year       | On request |
| IP addresses  | 90 days          | Hash after 90 days      | Auto       |
| Location data | Purpose duration | Aggregate after 30 days | Auto       |
| Access logs   | 1 year           | Anonymize after 1 year  | Auto       |

### Anonymization Process

```rust
pub struct Anonymizer {
    salt: [u8; 32],
}

impl Anonymizer {
    pub fn anonymize_record(&self, record: &mut DataRecord) {
        // Hash identifiers
        if let Some(user_id) = &mut record.user_id {
            *user_id = self.hash_identifier(user_id);
        }

        // Hash IP addresses
        if let Some(ip) = &mut record.ip_address {
            *ip = self.hash_ip(ip);
        }

        // Truncate location to region
        if let Some(location) = &mut record.location {
            location.truncate_to_region();
        }

        // Remove names
        record.operator_name = None;

        // Mark as anonymized
        record.anonymized = true;
        record.anonymized_at = Some(Utc::now());
    }

    fn hash_identifier(&self, id: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(&self.salt);
        hasher.update(id.as_bytes());
        format!("anon_{}", hex::encode(&hasher.finalize()[..8]))
    }
}
```

---

## Storage Costs

### Cost Model

| Storage Tier   | Cost/GB/Month | Use Case        |
| -------------- | ------------- | --------------- |
| Hot (Cosmos)   | $0.25         | Active data     |
| Hot (Blob)     | $0.018        | Recent files    |
| Cool (Blob)    | $0.01         | Archived recent |
| Archive (Blob) | $0.002        | Long-term       |

### Estimated Monthly Costs

| Data Type       | Volume      | Tier               | Monthly Cost   |
| --------------- | ----------- | ------------------ | -------------- |
| Active evidence | 50 GB       | Hot                | $12.50         |
| Track history   | 200 GB      | Cool               | $2.00          |
| Telemetry       | 500 GB      | Hot (30d) → Delete | $9.00          |
| Audit logs      | 100 GB      | Cool → Archive     | $0.50          |
| Debug logs      | 1 TB        | Hot (30d) → Delete | $18.00         |
| **Total**       | **1.85 TB** |                    | **~$42/month** |

---

## Compliance Reporting

### Retention Report

```rust
pub struct RetentionReport {
    pub generated_at: DateTime<Utc>,
    pub period: DateRange,
    pub by_tier: HashMap<RetentionTier, TierStats>,
    pub legal_holds_active: u32,
    pub records_held: u32,
    pub purge_summary: PurgeSummary,
}

pub struct TierStats {
    pub record_count: u64,
    pub storage_bytes: u64,
    pub oldest_record: DateTime<Utc>,
    pub newest_record: DateTime<Utc>,
    pub archived_count: u64,
    pub purged_count: u64,
}
```

---

## Consequences

### Positive

- **Compliance**: Meets POPIA, GDPR, defense requirements
- **Cost optimization**: Tiered storage reduces costs
- **Legal readiness**: Hold capability for litigation
- **Auditability**: Clear retention rules

### Negative

- **Complexity**: Lifecycle management overhead
- **Recovery time**: Archived data takes hours to retrieve
- **Classification burden**: Must classify all data

---

## Related ADRs

- [ADR 0050: ITAR Compliance](./adr-0050-itar-compliance)
- [ADR 0051: SA Export Control](./adr-0051-export-control-sa-ncacc)
- [ADR 0053: Privacy Regulations](./adr-0053-privacy-regulations)
- [ADR 0054: Audit Trail Requirements](./adr-0054-audit-trail-requirements)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
