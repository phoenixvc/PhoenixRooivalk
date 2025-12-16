---
id: adr-0041-mesh-networking
title: "ADR 0041: Mesh Networking Architecture"
sidebar_label: "ADR 0041: Mesh Networking"
difficulty: expert
estimated_reading_time: 12
points: 50
tags:
  - technical
  - architecture
  - communication
  - mesh
  - networking
  - edge
  - resilience
prerequisites:
  - architecture-decision-records
  - adr-0040-edge-cloud-communication
---

# ADR 0041: Mesh Networking Architecture

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Multi-node C-UAS deployments require resilient communication in
   contested/denied environments where traditional infrastructure may be
   unavailable or compromised
2. **Decision**: Implement self-organizing mesh network with multiple radio
   technologies, automatic failover, and distributed coordination
3. **Trade-off**: Network complexity vs. operational resilience and coverage
   extension

---

## Context

### Operational Scenarios

| Scenario              | Nodes | Communication Challenge            |
| --------------------- | ----- | ---------------------------------- |
| Airport perimeter     | 5-10  | Large area, some infrastructure    |
| Military forward base | 3-5   | No infrastructure, jamming likely  |
| Stadium event         | 10-20 | Dense RF environment, temporary    |
| Border patrol         | 2-5   | Mobile, extreme distances          |
| Prison                | 3-8   | Fixed positions, no external links |

### Requirements

| Requirement        | Specification                    |
| ------------------ | -------------------------------- |
| Self-healing       | Auto-route around failed nodes   |
| Range extension    | Relay through intermediate nodes |
| Latency            | <100ms for tactical data         |
| Bandwidth          | 1 Mbps minimum per link          |
| Security           | End-to-end encryption            |
| Jamming resilience | Multiple frequency bands         |

---

## Decision

Implement **multi-layer mesh network** with automatic failover:

### Network Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Phoenix Rooivalk Mesh Network                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│     ┌─────┐         ┌─────┐         ┌─────┐                        │
│     │Node │◄───────►│Node │◄───────►│Node │                        │
│     │  A  │         │  B  │         │  C  │                        │
│     └──┬──┘         └──┬──┘         └──┬──┘                        │
│        │               │               │                            │
│        │    ┌─────┐    │               │                            │
│        └───►│Node │◄───┘               │                            │
│             │  D  │◄───────────────────┘                            │
│             └──┬──┘                                                  │
│                │                                                     │
│                ▼                                                     │
│          ┌──────────┐                                               │
│          │  Cloud   │  (when available)                             │
│          │ Gateway  │                                               │
│          └──────────┘                                               │
│                                                                      │
│  Legend:                                                            │
│  ◄───► Primary link (LoRa/WiFi)                                     │
│  ◄···► Backup link (alternative band)                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Radio Technologies

### Multi-Band Approach

| Band    | Technology | Range  | Bandwidth | Use Case          |
| ------- | ---------- | ------ | --------- | ----------------- |
| 900 MHz | LoRa       | 10+ km | 50 kbps   | Control, status   |
| 2.4 GHz | WiFi Mesh  | 500m   | 50 Mbps   | Video, bulk data  |
| 5.8 GHz | WiFi Mesh  | 300m   | 100 Mbps  | High bandwidth    |
| UHF     | Custom SDR | 20+ km | 1 Mbps    | Long-range backup |

### Radio Stack

```rust
pub struct MeshRadioStack {
    radios: Vec<Box<dyn MeshRadio>>,
    routing: RoutingTable,
    link_quality: LinkQualityMonitor,
}

pub trait MeshRadio: Send + Sync {
    fn band(&self) -> FrequencyBand;
    fn max_range(&self) -> f64;  // meters
    fn bandwidth(&self) -> u64;  // bps
    fn latency(&self) -> Duration;

    async fn send(&self, dest: NodeId, data: &[u8]) -> Result<(), RadioError>;
    async fn receive(&self) -> Result<(NodeId, Vec<u8>), RadioError>;

    fn link_quality(&self, peer: NodeId) -> Option<LinkQuality>;
}

pub struct LinkQuality {
    pub rssi: i32,           // dBm
    pub snr: f32,            // dB
    pub packet_loss: f32,    // 0.0-1.0
    pub latency_ms: u32,
    pub last_seen: Timestamp,
}
```

---

## Routing Protocol

### AODV-Based Routing

```rust
pub struct RoutingTable {
    routes: HashMap<NodeId, Route>,
    sequence_numbers: HashMap<NodeId, u32>,
}

pub struct Route {
    pub destination: NodeId,
    pub next_hop: NodeId,
    pub hop_count: u8,
    pub sequence_number: u32,
    pub valid_until: Timestamp,
    pub link: RadioLink,
}

impl RoutingTable {
    /// Find best route to destination
    pub fn get_route(&self, dest: NodeId) -> Option<&Route> {
        self.routes.get(&dest).filter(|r| r.is_valid())
    }

    /// Handle incoming route request
    pub async fn handle_rreq(&mut self, rreq: RouteRequest) -> Option<RouteReply> {
        // Check if we have fresher route
        if let Some(existing) = self.routes.get(&rreq.destination) {
            if existing.sequence_number >= rreq.dest_sequence_number {
                // We have valid route, send reply
                return Some(RouteReply {
                    destination: rreq.destination,
                    next_hop: existing.next_hop,
                    hop_count: existing.hop_count,
                    sequence_number: existing.sequence_number,
                });
            }
        }

        // Forward RREQ if not destination
        if rreq.destination != self.local_id {
            self.forward_rreq(rreq).await;
        }

        None
    }
}
```

### Route Selection Criteria

```rust
pub fn select_route(
    routes: &[Route],
    message_type: MessageType,
) -> Option<&Route> {
    routes
        .iter()
        .filter(|r| r.is_valid())
        .max_by_key(|r| {
            let mut score = 0i32;

            // Prefer fewer hops
            score -= r.hop_count as i32 * 10;

            // Prefer higher bandwidth for bulk data
            if message_type.requires_bandwidth() {
                score += r.link.bandwidth_score();
            }

            // Prefer lower latency for control
            if message_type.is_realtime() {
                score -= r.link.latency_ms as i32;
            }

            // Prefer better link quality
            score += r.link.quality_score();

            score
        })
}
```

---

## Message Types

### Tactical Messages (Low Latency)

```rust
pub struct TacticalMessage {
    pub msg_type: TacticalType,
    pub priority: Priority,
    pub ttl: u8,
    pub payload: Vec<u8>,
}

pub enum TacticalType {
    TrackUpdate,        // Target position updates
    EngagementAlert,    // Engagement notification
    StatusHeartbeat,    // Node health
    CommandRelay,       // Operator commands
}
```

### Bulk Messages (High Bandwidth)

```rust
pub struct BulkMessage {
    pub transfer_id: Uuid,
    pub total_chunks: u32,
    pub chunk_index: u32,
    pub payload: Vec<u8>,
    pub checksum: u32,
}
```

---

## Self-Healing

### Link Failure Detection

```rust
impl LinkMonitor {
    pub async fn monitor_links(&mut self) {
        loop {
            for (peer, quality) in self.link_quality.iter_mut() {
                // Send keepalive
                if let Err(_) = self.send_keepalive(*peer).await {
                    quality.consecutive_failures += 1;
                }

                // Check for link degradation
                if quality.consecutive_failures > 3 {
                    self.handle_link_failure(*peer).await;
                }
            }

            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    }

    async fn handle_link_failure(&mut self, peer: NodeId) {
        // 1. Mark routes through this peer as invalid
        self.routing.invalidate_via(peer);

        // 2. Attempt alternate radio
        for radio in &self.radios {
            if radio.can_reach(peer) {
                if let Ok(_) = radio.probe(peer).await {
                    self.routing.update_link(peer, radio.id());
                    return;
                }
            }
        }

        // 3. Route around failed node
        self.routing.recompute_routes().await;

        // 4. Notify other nodes
        self.broadcast_link_down(peer).await;
    }
}
```

### Network Partition Recovery

```rust
impl MeshNetwork {
    pub async fn handle_partition(&mut self) {
        // Detect partition: unreachable nodes
        let unreachable = self.routing.get_unreachable_nodes();

        if unreachable.is_empty() {
            return;
        }

        // Attempt to bridge partition
        for radio in &self.radios {
            // Try long-range radio at higher power
            if let Some(lora) = radio.as_lora() {
                lora.set_power(Power::Maximum);

                for node in &unreachable {
                    if let Ok(_) = lora.probe(*node).await {
                        // Found route, propagate
                        self.routing.add_route(*node, lora.id()).await;
                    }
                }
            }
        }
    }
}
```

---

## Security

### Mesh Authentication

```rust
pub struct MeshSecurity {
    /// Node identity (Ed25519 keypair)
    identity: Identity,
    /// Pre-shared group key for broadcast
    group_key: SymmetricKey,
    /// Per-link session keys
    session_keys: HashMap<NodeId, SessionKey>,
}

impl MeshSecurity {
    /// Establish secure session with peer
    pub async fn establish_session(
        &mut self,
        peer: NodeId,
    ) -> Result<SessionKey, SecurityError> {
        // X25519 key exchange
        let ephemeral = x25519::generate_keypair();
        let peer_public = self.request_peer_key(peer).await?;

        let shared_secret = x25519::diffie_hellman(
            &ephemeral.private,
            &peer_public,
        );

        // Derive session key
        let session_key = hkdf::derive_key(&shared_secret, b"mesh-session");

        self.session_keys.insert(peer, session_key.clone());
        Ok(session_key)
    }
}
```

### Anti-Jamming

- **Frequency hopping**: Coordinated hopping pattern
- **Spread spectrum**: LoRa chirp spread spectrum
- **Directional antennas**: Reduce jamming susceptibility
- **Power management**: Adapt to interference

---

## Coordination

### Distributed Track Fusion

```rust
impl DistributedFusion {
    /// Fuse tracks from multiple nodes
    pub fn fuse_tracks(&self, local_tracks: &[Track]) -> Vec<FusedTrack> {
        let mut fused = Vec::new();

        for track in local_tracks {
            // Get reports from other nodes
            let remote_reports: Vec<_> = self.mesh
                .nodes()
                .filter_map(|n| n.get_track_report(track.id))
                .collect();

            // Weighted average based on sensor quality
            let fused_position = self.weighted_average(
                track,
                &remote_reports,
            );

            fused.push(FusedTrack {
                id: track.id,
                position: fused_position,
                contributing_nodes: remote_reports.len() + 1,
                confidence: self.compute_confidence(&remote_reports),
            });
        }

        fused
    }
}
```

---

## Consequences

### Positive

- **Resilience**: Network survives node/link failures
- **Coverage**: Extended range through relaying
- **Autonomy**: Operates without infrastructure
- **Flexibility**: Adapts to changing conditions

### Negative

- **Complexity**: Multiple radios, routing protocols
- **Latency**: Multi-hop adds delay
- **Power**: Multiple radios increase consumption
- **Cost**: Additional hardware per node

---

## Related ADRs

- [ADR 0040: Edge-Cloud Communication](./adr-0040-edge-cloud-communication)
- [ADR 0042: Offline Sync Strategy](./adr-0042-offline-sync-strategy)
- [ADR 0032: Sensor-to-Effector Protocol](./adr-0032-sensor-to-effector-protocol)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
