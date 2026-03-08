---
id: phase2-skywatch-hub
title: "SkyWatch Hub — Central Coordination Node"
sidebar_label: SkyWatch Hub
sidebar_position: 4
description:
  Phase 2 SkyWatch Hub specification — Jetson-based central node that fuses
  multi-camera detections, serves a dashboard, and bridges to blockchain.
difficulty: intermediate
estimated_reading_time: 6
points: 15
tags:
  - hardware
  - phase-2
  - jetson
  - mqtt
  - fusion
  - dashboard
phase: ["seed"]
prerequisites: ["phase2-hardware-overview"]
---

# SkyWatch Hub (Central Coordination Node)

The Hub is the command center for a multi-node Phase 2 deployment. It receives
detection events from all SkyWatch nodes, fuses them into unified tracks, and
provides a live operational picture.

---

## What It Proves

> **Multi-node sensor fusion** — detections from multiple cameras are correlated
> into unified tracks, displayed on a dashboard, and anchored to blockchain.

A visitor sees 3 camera feeds on a map, watches a drone fly between coverage
zones, and sees a single continuous track that hands off between nodes.

---

## Bill of Materials

| Component | Part | Specification | Est. Cost |
|-----------|------|---------------|-----------|
| Compute | Jetson Orin Nano 8GB | Runs fusion + dashboard + MQTT broker | $250–300 |
| Storage | 512GB NVMe M.2 SSD | 90-day event retention | $40–50 |
| Network | 5-port unmanaged GbE switch | Wired backbone for nodes | $15–20 |
| UPS | Mini 12V UPS module | 30-minute runtime on battery | $25–35 |
| Enclosure | DIN-rail mount ABS case | Vented, indoor-rated | $15–20 |
| Power | 12V/5A DC adapter | Powers Jetson + peripherals | $8–12 |
| **Total** | | | **~$345–425** |

---

## Architecture

```text
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Nano v2  │  │ Std v2   │  │ Turret   │  │ Trigger  │
  │ Node A   │  │ Node B   │  │ Node C   │  │ Node D   │
  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │              │              │              │
       └──────────────┴──────┬───────┴──────────────┘
                             │
                      MQTT (TLS, port 8883)
                             │
                      ┌──────┴──────┐
                      │  SkyWatch   │
                      │    Hub      │
                      │             │
                      │ ┌─────────┐ │
                      │ │Mosquitto│ │  MQTT Broker
                      │ └─────────┘ │
                      │ ┌─────────┐ │
                      │ │ Fusion  │ │  Track correlation
                      │ │ Engine  │ │
                      │ └─────────┘ │
                      │ ┌─────────┐ │
                      │ │Dashboard│ │  React web UI
                      │ │ Server  │ │
                      │ └─────────┘ │
                      │ ┌─────────┐ │
                      │ │Evidence │ │  Blockchain bridge
                      │ │  CLI    │ │
                      │ └─────────┘ │
                      └─────────────┘
```

---

## Fusion Engine

The fusion engine correlates detections from multiple nodes into unified tracks.

### Algorithm

1. **Receive** detection events from MQTT (node ID, timestamp, bearing, bbox,
   confidence, class).
2. **Project** each detection into world coordinates using known node positions
   and camera FOV.
3. **Correlate** detections within a spatial window (configurable, default 10m)
   and temporal window (default 500ms).
4. **Assign** correlated detections to existing tracks or create new tracks.
5. **Predict** track position using Kalman filter for smooth handoff between
   node coverage zones.
6. **Publish** fused tracks to `skywatch/hub/tracks/` MQTT topic.

### Track State

```json
{
  "track_id": "TRK-001",
  "class": "drone",
  "confidence": 0.92,
  "position": { "lat": 33.7490, "lon": -84.3880, "alt_m": 45 },
  "velocity": { "vx": 5.2, "vy": -1.3, "vz": 0.8 },
  "contributing_nodes": ["nano-v2-001", "std-v2-001"],
  "first_seen": "2026-03-04T10:15:30Z",
  "last_seen": "2026-03-04T10:15:32Z",
  "threat_level": "medium"
}
```

---

## Dashboard

The dashboard is a React web application served from the Hub on port 3000.

### Features

- **Live map** — node positions, coverage cones, and fused tracks on a Leaflet
  map
- **Track table** — sortable list of active and historical tracks
- **Node status** — health, FPS, CPU/GPU temperature, armed state
- **Alert feed** — chronological list of detection events
- **Turret control** — manual pan/tilt override for Turret Tracker nodes
- **Evidence log** — blockchain submission status and hash history

### Access

- Local network: `http://hub.local:3000`
- No external access in Phase 2 (local network only)
- No authentication in Phase 2 (added in Phase 3)

---

## Blockchain Bridge

The Hub batches detection events and submits them to the blockchain via the
Evidence CLI.

### Process

1. Every 60 seconds, collect all detection events since last batch.
2. Compute SHA-256 hash of the batch (events sorted by timestamp).
3. Submit hash via `record-evidence detection @batch.json --submit`.
4. Store the returned evidence ID in local SQLite for audit trail.

---

## Acceptance Criteria

- [ ] MQTT broker handles >=5 nodes publishing at 30 events/second each
- [ ] Fusion engine produces unified tracks from multi-node detections
- [ ] Dashboard displays live map with <1s refresh rate
- [ ] Evidence CLI submits batched hashes every 60 seconds
- [ ] System recovers from node disconnect/reconnect without data loss
- [ ] UPS provides >=30 minutes of operation on battery
- [ ] 90-day event log fits within 512GB SSD capacity

---

## Upgrade Path

| From (Phase 2) | To (Phase 3) |
|-----------------|--------------|
| Local MQTT broker | Clustered MQTT with HA failover |
| React dashboard on local network | Authenticated web dashboard with VPN |
| Manual turret control | Automated rules engine for turret dispatch |
| SHA-256 batch hashing | Merkle tree with per-event anchoring |
| No authentication | mTLS + API key authentication |
