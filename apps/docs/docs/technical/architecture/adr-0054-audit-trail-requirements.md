---
id: adr-0054-audit-trail-requirements
title: "ADR 0054: Audit Trail Requirements"
sidebar_label: "ADR 0054: Audit Trail"
difficulty: intermediate
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - compliance
  - audit
  - evidence
  - legal
prerequisites:
  - architecture-decision-records
  - adr-0052-data-retention-policies
---

# ADR 0054: Audit Trail Requirements

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Engagement evidence, system access, and configuration changes
   must be audited for legal admissibility and compliance
2. **Decision**: Implement comprehensive audit logging with cryptographic
   integrity, immutable storage, and chain-of-custody tracking
3. **Trade-off**: Storage and performance overhead vs. legal defensibility

---

## Context

### Audit Requirements by Domain

| Domain                | Requirements                      | Standard                |
| --------------------- | --------------------------------- | ----------------------- |
| Engagement evidence   | Chain of custody, non-repudiation | Legal proceedings       |
| System access         | Who accessed what, when           | SOC 2, ISO 27001        |
| Configuration changes | Change history, approval          | ITIL, change management |
| Export control        | Access to controlled data         | ITAR, NCACC             |

### Legal Admissibility Criteria

For evidence to be admissible:

1. **Authenticity**: Proof of origin
2. **Integrity**: Not modified since creation
3. **Reliability**: System producing evidence is trustworthy
4. **Completeness**: Full chain of custody documented

---

## Decision

Implement **tamper-evident audit system** with:

### Audit Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Audit Trail Architecture                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  EVENT SOURCES                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │ Engagement   │  │   Access     │  │   Config     │          ││
│  │  │ Events       │  │   Events     │  │   Changes    │          ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          ││
│  └─────────┼─────────────────┼─────────────────┼───────────────────┘│
│            │                 │                 │                     │
│            ▼                 ▼                 ▼                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    AUDIT EVENT PROCESSOR                         ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Enrich     │─▶│    Sign      │─▶│   Chain      │          ││
│  │  │  (context)   │  │  (Ed25519)   │  │  (hash link) │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                │                                     │
│                                ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    IMMUTABLE STORAGE                             ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │ Append-Only  │  │   WORM       │  │  Blockchain  │          ││
│  │  │ Log (Local)  │  │   Storage    │  │  Anchor      │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Audit Event Schema

### Base Event Structure

```rust
#[derive(Serialize, Deserialize)]
pub struct AuditEvent {
    /// Unique event identifier
    pub event_id: Uuid,
    /// Event type category
    pub event_type: AuditEventType,
    /// When the event occurred
    pub timestamp: DateTime<Utc>,
    /// Monotonic sequence number
    pub sequence: u64,

    // Actor information
    pub actor: Actor,

    // Event details
    pub action: String,
    pub resource: Resource,
    pub outcome: Outcome,
    pub details: serde_json::Value,

    // Chain integrity
    pub prev_hash: [u8; 32],
    pub hash: [u8; 32],
    pub signature: [u8; 64],

    // Context
    pub correlation_id: Option<String>,
    pub session_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub enum AuditEventType {
    // Engagement events
    ThreatDetected,
    EngagementAuthorized,
    EffectorFired,
    EngagementComplete,

    // Access events
    UserLogin,
    UserLogout,
    ResourceAccess,
    PermissionDenied,

    // Configuration events
    ConfigCreated,
    ConfigModified,
    ConfigDeleted,

    // System events
    SystemStartup,
    SystemShutdown,
    ErrorOccurred,
}

#[derive(Serialize, Deserialize)]
pub struct Actor {
    pub actor_type: ActorType,
    pub id: String,
    pub name: Option<String>,
    pub roles: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub enum ActorType {
    User,
    System,
    Service,
    External,
}

#[derive(Serialize, Deserialize)]
pub struct Resource {
    pub resource_type: String,
    pub resource_id: String,
    pub classification: Option<DataClassification>,
}

#[derive(Serialize, Deserialize)]
pub enum Outcome {
    Success,
    Failure { reason: String },
    Partial { details: String },
}
```

---

## Event Types

### Engagement Audit Events

```rust
pub struct EngagementAuditEvent {
    pub base: AuditEvent,
    pub engagement: EngagementDetails,
}

pub struct EngagementDetails {
    /// Track being engaged
    pub track_id: String,
    /// Threat classification at time of engagement
    pub threat_classification: ThreatClassification,
    /// ROE reference
    pub roe_version: String,
    /// Authorization chain
    pub authorization: AuthorizationChain,
    /// Effector used
    pub effector: EffectorInfo,
    /// Sensor snapshots
    pub sensor_data: Vec<SensorSnapshot>,
    /// Outcome
    pub result: EngagementResult,
}

pub struct AuthorizationChain {
    /// Pre-authorization (standing ROE)
    pub standing_auth: Option<StandingAuth>,
    /// Real-time authorization (if required)
    pub realtime_auth: Option<RealtimeAuth>,
    /// Timestamp of authorization
    pub authorized_at: DateTime<Utc>,
}
```

### Access Audit Events

```rust
pub struct AccessAuditEvent {
    pub base: AuditEvent,
    pub access: AccessDetails,
}

pub struct AccessDetails {
    /// What was accessed
    pub resource_path: String,
    /// Access type
    pub access_type: AccessType,
    /// Data classification
    pub classification: DataClassification,
    /// Export control status
    pub export_controlled: bool,
    /// Fields accessed (for partial access)
    pub fields_accessed: Option<Vec<String>>,
}

pub enum AccessType {
    Read,
    Write,
    Delete,
    Export,
    Share,
}
```

---

## Chain of Custody

### Hash Chain Implementation

```rust
pub struct AuditChain {
    events: Vec<AuditEvent>,
    last_hash: [u8; 32],
    signing_key: SigningKey,
}

impl AuditChain {
    pub fn append(&mut self, mut event: AuditEvent) -> Result<(), AuditError> {
        // Set chain links
        event.prev_hash = self.last_hash;
        event.sequence = self.events.len() as u64;

        // Compute hash
        let hash_input = self.compute_hash_input(&event);
        event.hash = sha256(&hash_input);

        // Sign
        event.signature = self.signing_key.sign(&event.hash);

        // Verify chain integrity
        if !self.verify_chain_link(&event) {
            return Err(AuditError::ChainIntegrityViolation);
        }

        // Append
        self.last_hash = event.hash;
        self.events.push(event);

        Ok(())
    }

    fn compute_hash_input(&self, event: &AuditEvent) -> Vec<u8> {
        let mut input = Vec::new();
        input.extend_from_slice(&event.prev_hash);
        input.extend_from_slice(&event.sequence.to_le_bytes());
        input.extend_from_slice(event.event_id.as_bytes());
        input.extend_from_slice(&event.timestamp.timestamp().to_le_bytes());
        input.extend_from_slice(serde_json::to_vec(event).unwrap().as_slice());
        input
    }

    pub fn verify_integrity(&self) -> Result<(), AuditError> {
        let mut expected_prev = [0u8; 32];

        for (i, event) in self.events.iter().enumerate() {
            // Verify sequence
            if event.sequence != i as u64 {
                return Err(AuditError::SequenceGap(i as u64, event.sequence));
            }

            // Verify hash chain
            if event.prev_hash != expected_prev {
                return Err(AuditError::HashMismatch(i));
            }

            // Verify hash
            let computed_hash = sha256(&self.compute_hash_input(event));
            if computed_hash != event.hash {
                return Err(AuditError::HashMismatch(i));
            }

            // Verify signature
            if !self.verify_signature(event) {
                return Err(AuditError::SignatureInvalid(i));
            }

            expected_prev = event.hash;
        }

        Ok(())
    }
}
```

### Blockchain Anchoring

```rust
pub async fn anchor_to_blockchain(
    events: &[AuditEvent],
    solana: &SolanaClient,
) -> Result<AnchorReceipt, AnchorError> {
    // Compute Merkle root of events
    let merkle_root = compute_merkle_root(
        events.iter().map(|e| e.hash).collect()
    );

    // Create anchor transaction
    let tx = solana.create_anchor_transaction(&merkle_root).await?;

    // Submit and wait for confirmation
    let signature = solana.submit_transaction(tx).await?;

    Ok(AnchorReceipt {
        merkle_root,
        transaction_signature: signature,
        slot: solana.get_slot(&signature).await?,
        timestamp: Utc::now(),
        event_count: events.len(),
    })
}
```

---

## Storage Requirements

### Immutability Guarantees

| Storage Type            | Immutability             | Use Case          |
| ----------------------- | ------------------------ | ----------------- |
| Append-only log (local) | Software-enforced        | Real-time logging |
| WORM blob storage       | Hardware/policy enforced | Long-term archive |
| Blockchain anchor       | Cryptographic            | Integrity proof   |

### Azure Immutable Storage

```bicep
resource auditStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${org}${envStandard}auditst${locationShort}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_ZRS'  // Zone redundant
  }
  properties: {
    immutableStorageWithVersioning: {
      enabled: true
    }
  }
}

resource auditContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${auditStorage.name}/default/audit-logs'
  properties: {
    immutableStorageWithVersioning: {
      enabled: true
    }
  }
}

// Legal hold policy
resource legalHoldPolicy 'Microsoft.Storage/storageAccounts/blobServices/containers/immutabilityPolicies@2023-01-01' = {
  name: '${auditContainer.name}/default'
  properties: {
    immutabilityPeriodSinceCreationInDays: 365 * 7  // 7 years
    allowProtectedAppendWrites: true
  }
}
```

---

## Query & Reporting

### Audit Query API

```typescript
interface AuditQuery {
  // Time range
  startTime?: Date;
  endTime?: Date;

  // Filters
  eventTypes?: AuditEventType[];
  actorId?: string;
  resourceId?: string;
  outcome?: "success" | "failure";

  // Pagination
  pageSize: number;
  pageToken?: string;
}

interface AuditReport {
  events: AuditEvent[];
  totalCount: number;
  pageToken?: string;
  chainVerified: boolean;
}

// GET /api/audit/query
async function queryAuditLog(query: AuditQuery): Promise<AuditReport> {
  // Verify chain integrity for returned events
  const events = await auditStore.query(query);
  const chainVerified = await verifyChainIntegrity(events);

  return {
    events,
    totalCount: await auditStore.count(query),
    pageToken: generatePageToken(events),
    chainVerified,
  };
}
```

### Compliance Reports

```rust
pub struct ComplianceReport {
    pub report_type: ReportType,
    pub period: DateRange,
    pub generated_at: DateTime<Utc>,
    pub sections: Vec<ReportSection>,
}

pub enum ReportType {
    SOC2,
    ISO27001,
    ITAR,
    POPIA,
}

pub struct ReportSection {
    pub title: String,
    pub controls: Vec<ControlAssessment>,
}

pub struct ControlAssessment {
    pub control_id: String,
    pub description: String,
    pub evidence: Vec<AuditEventSummary>,
    pub status: ControlStatus,
}
```

---

## Consequences

### Positive

- **Legal admissibility**: Cryptographic proof of integrity
- **Compliance**: Meets SOC 2, ISO 27001 requirements
- **Forensics**: Complete investigation capability
- **Non-repudiation**: Signed events prove origin

### Negative

- **Storage costs**: Immutable storage is more expensive
- **Performance**: Signing and hashing add latency
- **Complexity**: Chain management and verification

---

## Related ADRs

- [ADR 0052: Data Retention Policies](./adr-0052-data-retention-policies)
- [ADR 0053: Privacy Regulations](./adr-0053-privacy-regulations)
- [ADR 0001: Chain Selection](./architecture-decision-records#adr-0001-chain-selection-for-on-chain-anchoring-solana-vs-others)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
