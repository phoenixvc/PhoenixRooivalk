---
id: adr-0042-offline-sync-strategy
title: "ADR 0042: Offline Sync Strategy"
sidebar_label: "ADR 0042: Offline Sync"
difficulty: intermediate
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - sync
  - offline
  - conflict-resolution
  - data
prerequisites:
  - architecture-decision-records
  - adr-0040-edge-cloud-communication
---

# ADR 0042: Offline Sync Strategy

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Edge nodes operate offline for extended periods; data
   reconciliation after reconnection must handle conflicts without data loss
2. **Decision**: Implement CRDT-based sync for operational data, append-only
   logs for evidence, and last-write-wins for configuration
3. **Trade-off**: Sync complexity vs. data consistency guarantees

---

## Context

### Offline Scenarios

| Scenario              | Duration      | Data Volume        | Priority            |
| --------------------- | ------------- | ------------------ | ------------------- |
| Communication jam     | Minutes-hours | High (engagements) | Evidence critical   |
| Remote deployment     | Days-weeks    | Medium             | Config sync needed  |
| Network partition     | Hours         | Variable           | Mesh coordination   |
| Scheduled maintenance | Hours         | Low                | Planned sync window |

### Data Categories

| Category      | Conflict Strategy | Example          |
| ------------- | ----------------- | ---------------- |
| Evidence      | Append-only       | Engagement logs  |
| Tracks        | Merge/expire      | Target history   |
| Configuration | Last-write-wins   | System settings  |
| Models        | Version replace   | AI model updates |

---

## Decision

Implement **hybrid sync strategy** with category-specific conflict resolution:

### Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Sync Architecture                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  EDGE NODE                          CLOUD                           │
│  ┌─────────────────────────┐       ┌─────────────────────────┐     │
│  │                         │       │                         │     │
│  │  ┌─────────────────┐   │       │   ┌─────────────────┐   │     │
│  │  │  Evidence Log   │───┼──────►┼───│  Evidence Store │   │     │
│  │  │  (append-only)  │   │       │   │  (immutable)    │   │     │
│  │  └─────────────────┘   │       │   └─────────────────┘   │     │
│  │                         │       │                         │     │
│  │  ┌─────────────────┐   │       │   ┌─────────────────┐   │     │
│  │  │  Track Store    │◄──┼──────►┼───│  Track Archive  │   │     │
│  │  │  (CRDT merge)   │   │       │   │  (analytics)    │   │     │
│  │  └─────────────────┘   │       │   └─────────────────┘   │     │
│  │                         │       │                         │     │
│  │  ┌─────────────────┐   │       │   ┌─────────────────┐   │     │
│  │  │  Config Cache   │◄──┼───────┼───│  Config Master  │   │     │
│  │  │  (LWW)          │   │       │   │  (source)       │   │     │
│  │  └─────────────────┘   │       │   └─────────────────┘   │     │
│  │                         │       │                         │     │
│  └─────────────────────────┘       └─────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Evidence Sync (Append-Only)

### Design Principle

Evidence is never modified or deleted locally. All evidence syncs to cloud as
append-only log.

```rust
pub struct EvidenceLog {
    /// Local sequence number
    sequence: u64,
    /// Last synced sequence
    synced_sequence: u64,
    /// Log entries
    entries: Vec<EvidenceEntry>,
}

pub struct EvidenceEntry {
    pub sequence: u64,
    pub timestamp: Timestamp,
    pub entry_type: EvidenceType,
    pub payload: Vec<u8>,
    pub hash: [u8; 32],
    pub prev_hash: [u8; 32],
    pub signature: [u8; 64],
}

impl EvidenceLog {
    /// Append new evidence (never fails due to conflict)
    pub fn append(&mut self, evidence: Evidence) -> EvidenceEntry {
        let entry = EvidenceEntry {
            sequence: self.sequence + 1,
            timestamp: Timestamp::now(),
            entry_type: evidence.entry_type(),
            payload: evidence.serialize(),
            hash: evidence.compute_hash(),
            prev_hash: self.entries.last().map(|e| e.hash).unwrap_or([0; 32]),
            signature: self.sign(&evidence),
        };

        self.entries.push(entry.clone());
        self.sequence += 1;
        entry
    }

    /// Sync unsynced entries to cloud
    pub async fn sync_to_cloud(&mut self, cloud: &CloudClient) -> Result<u64, SyncError> {
        let unsynced = &self.entries[self.synced_sequence as usize..];

        for entry in unsynced {
            // Cloud append (idempotent by sequence + node_id)
            cloud.append_evidence(self.node_id, entry).await?;
            self.synced_sequence = entry.sequence;
        }

        Ok(self.synced_sequence)
    }
}
```

### Conflict Resolution: None Required

Evidence is node-local and append-only. Each node's evidence is independent and
merged chronologically in cloud.

---

## Track Sync (CRDT-Based)

### Grow-Only Set for Tracks

```rust
use crdts::{GSet, CmRDT};

pub struct TrackStore {
    /// Grow-only set of track IDs
    track_ids: GSet<TrackId>,
    /// Track data with vector clock
    tracks: HashMap<TrackId, VersionedTrack>,
    /// Node's logical clock
    clock: VectorClock,
}

pub struct VersionedTrack {
    pub track: Track,
    pub version: VectorClock,
    pub last_update: Timestamp,
}

impl TrackStore {
    /// Merge remote track data
    pub fn merge(&mut self, remote: &TrackStore) {
        // Merge track IDs (grow-only)
        self.track_ids.merge(remote.track_ids.clone());

        // Merge track data by vector clock
        for (id, remote_track) in &remote.tracks {
            match self.tracks.get_mut(id) {
                Some(local_track) => {
                    // Use newer version
                    if remote_track.version > local_track.version {
                        *local_track = remote_track.clone();
                    } else if !remote_track.version.is_comparable(&local_track.version) {
                        // Concurrent updates: merge positions
                        local_track.track.merge(&remote_track.track);
                        local_track.version.merge(&remote_track.version);
                    }
                }
                None => {
                    self.tracks.insert(*id, remote_track.clone());
                }
            }
        }
    }
}
```

### Track Merge Logic

```rust
impl Track {
    /// Merge concurrent track updates
    pub fn merge(&mut self, other: &Track) {
        // Keep track with better sensor data
        if other.position_confidence > self.position_confidence {
            self.position = other.position;
            self.position_confidence = other.position_confidence;
        }

        // Merge classification (prefer higher confidence)
        if other.classification_confidence > self.classification_confidence {
            self.classification = other.classification.clone();
            self.classification_confidence = other.classification_confidence;
        }

        // Union of contributing sensors
        self.contributing_sensors.extend(other.contributing_sensors.iter().cloned());

        // Keep most recent timestamp
        self.last_seen = self.last_seen.max(other.last_seen);
    }
}
```

---

## Configuration Sync (Last-Write-Wins)

### LWW Register

```rust
pub struct ConfigStore {
    configs: HashMap<ConfigKey, LWWValue>,
}

pub struct LWWValue {
    pub value: ConfigValue,
    pub timestamp: HLCTimestamp,  // Hybrid Logical Clock
    pub source: NodeId,
}

impl ConfigStore {
    /// Set config (local)
    pub fn set(&mut self, key: ConfigKey, value: ConfigValue) {
        let entry = LWWValue {
            value,
            timestamp: self.clock.now(),
            source: self.node_id,
        };
        self.configs.insert(key, entry);
    }

    /// Merge remote config (LWW)
    pub fn merge(&mut self, key: ConfigKey, remote: LWWValue) {
        match self.configs.get(&key) {
            Some(local) if local.timestamp >= remote.timestamp => {
                // Local wins, keep it
            }
            _ => {
                // Remote wins (newer or no local)
                self.configs.insert(key, remote);
            }
        }
    }

    /// Sync with cloud
    pub async fn sync(&mut self, cloud: &CloudClient) -> Result<(), SyncError> {
        // Get cloud configs
        let cloud_configs = cloud.get_configs().await?;

        // Merge (LWW)
        for (key, remote) in cloud_configs {
            self.merge(key, remote);
        }

        // Push local changes
        for (key, local) in &self.configs {
            cloud.set_config(key.clone(), local.clone()).await?;
        }

        Ok(())
    }
}
```

### Conflict Example

```
Timeline:
─────────────────────────────────────────────────────────
Edge (offline)                    Cloud
─────────────────────────────────────────────────────────
t=100: Set sensitivity=0.8
                                  t=150: Set sensitivity=0.7
t=200: Reconnect
       Sync: Cloud wins (t=150 > t=100? No, t=100 wins)

Using HLC:
t=100: edge.sensitivity=0.8, hlc=(100, edge, 0)
t=150: cloud.sensitivity=0.7, hlc=(150, cloud, 0)

Merge: Cloud wins (150 > 100)
Result: sensitivity=0.7
```

---

## Sync Protocol

### Full Sync Sequence

```rust
impl SyncEngine {
    pub async fn full_sync(&mut self) -> Result<SyncReport, SyncError> {
        let mut report = SyncReport::new();

        // 1. Evidence (push only, never pull)
        let evidence_count = self.evidence.sync_to_cloud(&self.cloud).await?;
        report.evidence_synced = evidence_count;

        // 2. Tracks (bidirectional merge)
        let remote_tracks = self.cloud.get_tracks_since(self.last_sync).await?;
        let local_changes = self.tracks.get_changes_since(self.last_sync);

        self.tracks.merge(&remote_tracks);
        self.cloud.merge_tracks(&local_changes).await?;
        report.tracks_merged = remote_tracks.len() + local_changes.len();

        // 3. Config (bidirectional LWW)
        self.config.sync(&self.cloud).await?;
        report.configs_synced = self.config.len();

        // 4. Models (pull only, replace)
        if let Some(new_model) = self.cloud.get_newer_model(self.model_version).await? {
            self.model_store.update(new_model)?;
            report.model_updated = true;
        }

        self.last_sync = Timestamp::now();
        Ok(report)
    }
}
```

### Incremental Sync

```rust
impl SyncEngine {
    /// Lightweight sync for constrained bandwidth
    pub async fn incremental_sync(&mut self) -> Result<(), SyncError> {
        // Priority order: evidence > config > tracks

        // Evidence: always push critical
        self.evidence.sync_critical(&self.cloud).await?;

        // Config: only if changed
        if self.config.has_changes() {
            self.config.sync(&self.cloud).await?;
        }

        // Tracks: only active (not historical)
        self.tracks.sync_active(&self.cloud).await?;

        Ok(())
    }
}
```

---

## Clock Synchronization

### Hybrid Logical Clock

```rust
pub struct HLC {
    /// Physical time component
    physical: u64,
    /// Logical counter
    logical: u32,
    /// Node ID for tiebreaking
    node_id: NodeId,
}

impl HLC {
    pub fn now(&mut self) -> HLCTimestamp {
        let physical = system_time_ms();

        if physical > self.physical {
            self.physical = physical;
            self.logical = 0;
        } else {
            self.logical += 1;
        }

        HLCTimestamp {
            physical: self.physical,
            logical: self.logical,
            node_id: self.node_id,
        }
    }

    pub fn receive(&mut self, remote: &HLCTimestamp) {
        let physical = system_time_ms();
        let max_physical = physical.max(self.physical).max(remote.physical);

        if max_physical == self.physical && max_physical == remote.physical {
            self.logical = self.logical.max(remote.logical) + 1;
        } else if max_physical == self.physical {
            self.logical += 1;
        } else if max_physical == remote.physical {
            self.logical = remote.logical + 1;
        } else {
            self.logical = 0;
        }

        self.physical = max_physical;
    }
}
```

---

## Consequences

### Positive

- **No data loss**: All evidence preserved
- **Automatic resolution**: No manual conflict handling
- **Offline operation**: Full functionality without cloud
- **Eventual consistency**: All nodes converge

### Negative

- **Complexity**: Multiple sync strategies
- **Storage**: Must retain unsynced data
- **Clock drift**: HLC adds complexity

---

## Related ADRs

- [ADR 0040: Edge-Cloud Communication](./adr-0040-edge-cloud-communication)
- [ADR 0041: Mesh Networking](./adr-0041-mesh-networking)
- [ADR 0052: Data Retention Policies](./adr-0052-data-retention-policies)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
