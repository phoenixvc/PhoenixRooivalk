---
id: adr-0040-edge-cloud-communication
title: "ADR 0040: Edge-to-Cloud Communication Architecture"
sidebar_label: "ADR 0040: Edge-Cloud Comm"
difficulty: expert
estimated_reading_time: 12
points: 50
tags:
  - technical
  - architecture
  - communication
  - edge
  - cloud
  - offline
  - sync
prerequisites:
  - architecture-decision-records
  - adr-0006-ai-ml-architecture
---

# ADR 0040: Edge-to-Cloud Communication Architecture

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Edge nodes must operate autonomously in contested/disconnected
   environments while syncing with cloud when available
2. **Decision**: Implement store-and-forward architecture with priority-based
   sync and cryptographic integrity verification
3. **Trade-off**: Storage requirements on edge vs. real-time cloud visibility

---

## Context

### Operational Environment

Phoenix Rooivalk edge nodes operate in challenging conditions:

- **Contested RF spectrum**: Jamming may disrupt communications
- **Remote locations**: Limited or no cellular/satellite coverage
- **High-tempo operations**: Cannot wait for cloud round-trips
- **Legal requirements**: Evidence must be preserved regardless of connectivity

### Requirements

| Requirement          | Specification                                 |
| -------------------- | --------------------------------------------- |
| Autonomous operation | 100% functionality without cloud connectivity |
| Latency tolerance    | Critical decisions <50ms (edge-only)          |
| Sync when available  | Opportunistic upload when connected           |
| Data integrity       | Cryptographic proof of unmodified data        |
| Bandwidth efficiency | Minimize data transfer over constrained links |

### Current Architecture

Per ADR 0006 (AI/ML Architecture):

- **Edge AI**: All critical decisions made locally
- **Cloud backup**: Secondary processing and long-term storage
- **Distributed learning**: Federated model updates

---

## Options Considered

### Option 1: Cloud-First with Edge Caching ❌

All data flows through cloud; edge caches for offline.

**Pros**: Simple architecture, single source of truth **Cons**:

- **Fails closed**: No connectivity = no operation
- **Latency**: Cloud round-trip unacceptable for real-time
- **Compliance**: Evidence gaps during disconnection

### Option 2: Edge-First with Periodic Sync ❌

Edge operates independently; bulk sync on schedule.

**Pros**: Full autonomy, predictable sync windows **Cons**:

- **Stale cloud data**: Hours/days between updates
- **Large sync payloads**: Bandwidth spikes
- **No priority handling**: Critical data waits with routine

### Option 3: Store-and-Forward with Priority Queues ✅ Selected

Edge maintains local store; priority-based opportunistic sync.

**Pros**:

- **Full autonomy**: Edge operates indefinitely offline
- **Priority sync**: Critical data uploads first
- **Bandwidth efficient**: Delta sync, compression
- **Integrity preserved**: Cryptographic chain maintained

**Cons**:

- **Storage requirements**: Edge needs significant local storage
- **Complexity**: Priority queue management
- **Conflict resolution**: Potential for divergent state

---

## Decision

Adopt **Option 3: Store-and-Forward with Priority Queues**.

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EDGE NODE                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │
│  │   Sensors   │──▶│   Edge AI   │──▶│  Effectors  │               │
│  └─────────────┘   └─────────────┘   └─────────────┘               │
│                           │                                         │
│                           ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    LOCAL DATA STORE                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │ Evidence │  │  Tracks  │  │  Config  │  │  Models  │      │ │
│  │  │  Queue   │  │  History │  │  Cache   │  │  Cache   │      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                           │                                         │
│                           ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    SYNC ENGINE                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │ Priority │  │  Delta   │  │ Compress │  │  Crypto  │      │ │
│  │  │  Queue   │  │  Calc    │  │  /Decomp │  │  Verify  │      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
            ════════════════╪═══════════════════  (Intermittent Link)
                            │
┌───────────────────────────┼─────────────────────────────────────────┐
│                           ▼                       CLOUD             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    SYNC GATEWAY                                │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │ Receive  │  │  Verify  │  │  Store   │  │  Ack     │      │ │
│  │  │  Buffer  │  │  Integrity│  │  Route  │  │  Return  │      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                           │                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Evidence │  │ Analytics│  │  Model   │  │  Config  │           │
│  │  Archive │  │  Pipeline│  │  Train   │  │  Mgmt    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Priority Queues

| Priority | Data Type            | Max Latency | Retention  |
| -------- | -------------------- | ----------- | ---------- |
| P0       | Engagement evidence  | Immediate   | Indefinite |
| P1       | Threat detections    | 1 minute    | 30 days    |
| P2       | System health/alerts | 5 minutes   | 7 days     |
| P3       | Track history        | 1 hour      | 7 days     |
| P4       | Telemetry/metrics    | Best effort | 24 hours   |
| P5       | Debug logs           | Best effort | 12 hours   |

### Sync Protocol

```rust
pub struct SyncMessage {
    /// Unique message ID (UUID v7 for time-ordering)
    pub id: Uuid,
    /// Priority level (0 = highest)
    pub priority: u8,
    /// Message type for routing
    pub msg_type: MessageType,
    /// Compressed payload
    pub payload: Vec<u8>,
    /// SHA-256 hash of uncompressed payload
    pub digest: [u8; 32],
    /// Ed25519 signature from edge node
    pub signature: [u8; 64],
    /// Timestamp (edge node clock)
    pub timestamp: DateTime<Utc>,
    /// Sequence number for ordering
    pub sequence: u64,
    /// Previous message hash (chain integrity)
    pub prev_hash: Option<[u8; 32]>,
}
```

### Connection Management

```rust
pub enum ConnectionState {
    /// No connectivity
    Disconnected,
    /// Attempting to establish connection
    Connecting { attempts: u32 },
    /// Connected but not yet authenticated
    Connected,
    /// Fully operational
    Authenticated { session_id: String },
    /// Connection degraded (high latency/packet loss)
    Degraded { quality: f32 },
}

impl SyncEngine {
    pub async fn sync_loop(&mut self) {
        loop {
            match self.connection_state {
                ConnectionState::Authenticated { .. } => {
                    // Process priority queues in order
                    for priority in 0..=5 {
                        while let Some(msg) = self.queue.peek(priority) {
                            if self.send_with_ack(msg).await.is_ok() {
                                self.queue.remove(msg.id);
                            } else {
                                break; // Connection issue, retry later
                            }
                        }
                    }
                }
                ConnectionState::Disconnected => {
                    // Attempt reconnection with backoff
                    self.attempt_connect().await;
                }
                _ => {
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
            }
        }
    }
}
```

---

## Offline Operation

### Local Storage Requirements

| Data Type          | Estimated Size/Day | Retention | Total Storage |
| ------------------ | ------------------ | --------- | ------------- |
| Evidence records   | 50 MB              | 30 days   | 1.5 GB        |
| Track history      | 200 MB             | 7 days    | 1.4 GB        |
| System logs        | 100 MB             | 7 days    | 700 MB        |
| Model cache        | 500 MB             | Static    | 500 MB        |
| Config cache       | 10 MB              | Static    | 10 MB         |
| **Total Required** |                    |           | **~5 GB**     |

Edge nodes spec 512GB NVMe (per technical-architecture.md), providing 100x
headroom.

### Data Integrity During Offline

```
┌─────────────────────────────────────────────────────────────┐
│                    Evidence Chain                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Event 1 │───▶│ Event 2 │───▶│ Event 3 │───▶│ Event N │  │
│  │ Hash: A │    │ Hash: B │    │ Hash: C │    │ Hash: N │  │
│  │ Prev: ∅ │    │ Prev: A │    │ Prev: B │    │ Prev:N-1│  │
│  │ Sig: ✓  │    │ Sig: ✓  │    │ Sig: ✓  │    │ Sig: ✓  │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                              │
│  Chain verified on sync - any tampering detected             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Cloud Components

### Sync Gateway (Azure)

| Service            | Purpose                             |
| ------------------ | ----------------------------------- |
| Azure SignalR      | Real-time bidirectional when online |
| Azure Service Bus  | Message queue for reliable delivery |
| Azure Functions    | Sync message processing             |
| Azure Blob Storage | Evidence archive (encrypted)        |
| Azure Cosmos DB    | Operational data store              |

### Downlink (Cloud → Edge)

| Data Type           | Trigger               | Priority |
| ------------------- | --------------------- | -------- |
| Model updates       | New model available   | P2       |
| Config changes      | Admin update          | P1       |
| Threat intelligence | New threat signatures | P1       |
| Time sync           | Periodic (1 hour)     | P3       |
| Commands            | Operator initiated    | P0       |

---

## Security Considerations

### Transport Security

- **TLS 1.3**: All cloud communications encrypted
- **Certificate pinning**: Prevent MITM attacks
- **Mutual TLS**: Edge authenticates to cloud and vice versa

### Message Security

- **Ed25519 signatures**: All messages signed by edge node
- **Hash chains**: Detect tampering or insertion
- **Replay protection**: Sequence numbers + timestamps

### Offline Security

- **TPM-backed keys**: Signing keys protected by hardware
- **Encrypted storage**: Local data encrypted at rest
- **Secure boot**: Prevent unauthorized firmware

---

## Consequences

### Positive

- **Full autonomy**: Operations continue indefinitely offline
- **Data integrity**: Cryptographic proof of evidence chain
- **Bandwidth efficient**: Priority sync, delta compression
- **Resilient**: Graceful degradation under poor connectivity

### Negative

- **Storage requirements**: 5GB+ local storage needed
- **Complexity**: Priority queue and sync state management
- **Clock drift**: Extended offline may cause time sync issues

### Neutral

- **Eventual consistency**: Cloud view may lag edge state
- **Operational overhead**: Monitoring sync health

---

## Related ADRs

- [ADR 0001: Chain Selection](./architecture-decision-records#adr-0001-chain-selection-for-on-chain-anchoring-solana-vs-others) -
  Blockchain anchoring
- [ADR 0006: AI/ML Architecture](./architecture-decision-records#adr-0006-aiml-architecture) -
  Edge AI design
- [ADR 0007: Security Architecture](./architecture-decision-records#adr-0007-security-architecture) -
  Zero-trust model
- [ADR-D007: Evidence-Based Architecture](./architecture-decision-records#adr-d007-evidence-based-architecture) -
  Evidence model

---

## Implementation Phases

### Phase 1: Foundation (Q1 2026)

- Basic store-and-forward implementation
- Single priority queue
- Blob storage integration

### Phase 2: Priority Queues (Q2 2026)

- Multi-priority queue system
- Bandwidth-aware sync
- Compression integration

### Phase 3: Advanced Features (Q3 2026)

- Delta sync optimization
- Conflict resolution
- Multi-node mesh sync

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
