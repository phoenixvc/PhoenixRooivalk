---
id: system-architecture-analysis
title: System Architecture Analysis
sidebar_label: Architecture Analysis
difficulty: advanced
estimated_reading_time: 20
points: 50
tags:
  - architecture
  - technical
  - state-management
  - failure-modes
  - constraints
prerequisites:
  - adr-0000-adr-management
  - system-overview
---

# System Architecture Analysis

This document provides a deep analysis of the PhoenixRooivalk system
architecture, answering five fundamental questions about why the system exists
in its current form.

## Table of Contents

1. [Why the System is Structured This Way](#1-why-the-system-is-structured-this-way)
2. [Where State Actually Lives](#2-where-state-actually-lives)
3. [How Failure Propagates](#3-how-failure-propagates)
4. [What Changes Under Load or Latency](#4-what-changes-under-load-or-latency)
5. [Which Constraints Are Real vs Imagined](#5-which-constraints-are-real-vs-imagined)

---

## 1. Why the System is Structured This Way

### Design Philosophy: Hardware-Agnostic Edge Processing

The system architecture emerged from a fundamental requirement: **demo day
uncertainty**. The detector must work reliably across vastly different hardware
configurations without manual intervention.

The core principle is **auto-detection and adaptation**: detect hardware at
startup, adapt configuration, and swap implementations as needed.

```
┌─────────────────────────────────────────────────────────────┐
│                    DetectionPipeline                         │
├─────────────────────────────────────────────────────────────┤
│  FrameSource       → Auto: PiCamera, USB, Video, Mock       │
│  InferenceEngine   → Auto: TFLite, ONNX, Coral TPU, Mock    │
│  ObjectTracker     → Centroid, Kalman, or None              │
│  AlertHandler      → Console, Webhook, File, Composite      │
│  FrameRenderer     → OpenCV, Headless, Streaming            │
└─────────────────────────────────────────────────────────────┘
```

### Why Factory Pattern with Hot-Swappable Components?

The system must operate on:

- Raspberry Pi 3/4/5 with varying RAM (512MB-8GB)
- Desktop machines with GPU acceleration
- Pi Camera v2/v3 or USB webcams
- With or without Coral TPU accelerator

Rather than requiring manual configuration for each deployment scenario, the
factory pattern (`apps/detector/src/factory.py`) examines available hardware and
instantiates appropriate implementations automatically.

### Hardware Profile Detection

The hardware detection module (`apps/detector/src/hardware.py`) probes the
system and makes recommendations:

| Detected Property          | Source                              | Impact                           |
| -------------------------- | ----------------------------------- | -------------------------------- |
| Platform (Pi3/Pi4/Pi5/x86) | `/proc/cpuinfo`, platform module    | Threading, resolution defaults   |
| RAM                        | `/proc/meminfo`                     | Feature availability (streaming) |
| Camera type                | libcamera probe, device enumeration | Frame source selection           |
| Accelerators               | `lsusb` for Coral USB/PCIe          | Inference engine selection       |

This detection translates to concrete recommendations:

- **Pi3**: 320x240 resolution, 15fps, 2 threads, 192x192 model input
- **Pi5**: 640x480 resolution, 30fps, 4 threads, 320x320 model input

### Multi-Backend Inference Strategy

Three inference engines support different hardware realities:

| Engine    | Use Case                         | Trade-off                                        |
| --------- | -------------------------------- | ------------------------------------------------ |
| TFLite    | Default for Pi (fast, quantized) | Low memory, slightly reduced accuracy            |
| ONNX      | Desktop/laptop                   | Raw floating-point accuracy, more memory         |
| Coral TPU | Optional accelerator             | 10x faster inference, requires specific hardware |

Each implements the same `InferenceEngine` interface, enabling the factory to
swap implementations without affecting the pipeline.

### Layered Architecture Rationale

The system spans four distinct layers, each with specific responsibilities:

```
Layer 4: Blockchain Evidence (Rust)
    └── Immutable audit trail, cryptographic proof

Layer 3: Cloud Services (TypeScript/Azure)
    └── Persistence, caching, external integrations

Layer 2: Backend API (Rust)
    └── Evidence recording, job orchestration

Layer 1: Edge Detection (Python)
    └── Real-time inference, tracking, alerting, GPIO control
```

**Why this separation?**

1. **Edge (Python)**: Maximizes hardware compatibility. Python's ecosystem for
   ML inference (TFLite, ONNX) is unmatched. Performance-critical paths use
   NumPy for vectorization.

2. **Backend (Rust)**: Safety-critical evidence handling requires memory safety
   guarantees. Rust's ownership model prevents the data races that could corrupt
   evidence chains.

3. **Cloud (TypeScript)**: Azure Functions with TypeScript provides rapid
   iteration for non-critical services (caching, documentation).

4. **Blockchain (Rust)**: Anchoring evidence to immutable ledgers requires
   deterministic behavior. Rust's predictability is essential for cryptographic
   operations.

---

## 2. Where State Actually Lives

### Layer 1: Edge State (Python Detector)

State at the edge is intentionally **ephemeral and frame-scoped**. The system
prioritizes responsiveness over persistence.

#### Frame-Level State

```python
@dataclass
class FrameData:
    frame: np.ndarray           # Raw pixels (transient)
    timestamp: float            # Capture time
    frame_number: int           # Sequence counter
    width, height: int          # Resolution
    source_id: str              # Camera identifier
```

Frames are **not buffered** by default (buffer size = 1). Old frames are
discarded to maintain freshness.

#### Detection State

```python
class Detection:
    class_id: int               # Object class
    confidence: float           # Model confidence [0-1]
    bbox: BoundingBox           # Pixel coordinates
    drone_score: float          # Computed drone likelihood [0-1]
    track_id: Optional[int]     # Assigned by tracker
    metadata: dict              # Custom data
```

Detections exist only for the duration of pipeline processing. They are not
persisted unless explicitly sent to an alert handler.

#### Tracking State

The `CentroidTracker` maintains the only **cross-frame state** at the edge:

```python
class TrackedObject:
    track_id: int               # Persistent ID
    detection: Detection        # Current detection
    frames_tracked: int         # Persistence counter
    frames_since_seen: int      # Gap counter (for reacquisition)
    velocity: (float, float)    # Motion in pixels/frame
    predicted_position: (int, int)
```

**State lifetime**: Tracks are pruned after `max_disappeared` frames (default:
30). A track that disappears for 1 second at 30fps is permanently lost.

**State location**: In-memory `OrderedDict` within the tracker instance. No
persistence across restarts.

#### Targeting State

The targeting system (`apps/detector/src/targeting.py`) maintains engagement
state:

```python
@dataclass
class TargetLock:
    track_id: int                       # Locked target
    detection: Detection                # Current detection
    lock_time: float                    # When lock acquired
    estimated_distance_m: float         # Pinhole camera estimate
    velocity_px_frame: (float, float)   # Motion vector
    confidence_history: list            # Last N confidences
    position_history: list              # Last N positions
```

**State machine**:

```
SEARCHING → TRACKING → LOCKED → ENGAGING → COOLDOWN
```

GPIO control state (pin 17) is **volatile**. A system restart resets the fire
net to safe (disarmed) state.

### Layer 2: Backend State (Rust API)

The API layer uses **transient request-scoped state**. Each request is
independent.

Evidence records are immediately persisted to the blockchain outbox:

```rust
pub struct EvidenceRecord {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub digest: EvidenceDigest {
        algo: DigestAlgo::Sha256,
        hex: String,
    },
    pub payload_mime: Option<String>,
    pub metadata: serde_json::Value,
}
```

**Outbox pattern**: Evidence is written to SQLite immediately, then
asynchronously anchored to blockchain. This ensures evidence is never lost even
if blockchain is temporarily unavailable.

### Layer 3: Cloud State (Azure Cosmos DB)

Cosmos DB provides **durable state** with configurable TTLs:

| Container           | Purpose              | TTL       |
| ------------------- | -------------------- | --------- |
| `cache_embeddings`  | AI embeddings        | 7 days    |
| `cache_queries`     | Query results        | 1 hour    |
| `cache_suggestions` | Per-page suggestions | 24 hours  |
| `configuration`     | User settings        | Permanent |
| `news`              | Ingested articles    | Permanent |
| `support`           | Support tickets      | Permanent |

**Connection state**: Singleton pattern with connection pooling:

```typescript
let client: CosmosClient | null = null;

function getCosmosClient(): CosmosClient {
  if (!client) {
    client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
  }
  return client;
}
```

Warm connections persist across function invocations. Cold starts require new
client initialization.

### Layer 4: Blockchain State (Immutable)

Evidence anchored to blockchain is **permanently immutable**:

```rust
pub struct ChainTxRef {
    pub network: String,     // "etherlink", "solana"
    pub chain: String,       // "mainnet"
    pub tx_id: String,       // On-chain hash
    pub confirmed: bool,     // Finality reached
    pub timestamp: Option<DateTime<Utc>>,
}
```

**No rollback possible**. Once anchored, evidence cannot be modified or deleted.

### State Summary Matrix

| State Type        | Location  | Lifetime              | Persistence           |
| ----------------- | --------- | --------------------- | --------------------- |
| Frame pixels      | Edge RAM  | Single frame          | None                  |
| Detections        | Edge RAM  | Single frame          | None (unless alerted) |
| Tracks            | Edge RAM  | Until max_disappeared | None                  |
| Target lock       | Edge RAM  | Until disengage       | None                  |
| GPIO state        | Hardware  | Until power loss      | None                  |
| Evidence outbox   | SQLite    | Until anchored        | Local file            |
| Cloud cache       | Cosmos DB | TTL-based             | Durable               |
| Configuration     | Cosmos DB | Permanent             | Durable               |
| Blockchain anchor | Chain     | Permanent             | Immutable             |

---

## 3. How Failure Propagates

### Edge Pipeline Failure Modes

The main detection loop (`apps/detector/src/main.py:179-286`) handles failures
with **graceful degradation**:

```python
while True:
    frame_data = pipeline.frame_source.read()
    if frame_data is None:
        print("Failed to read frame")
        continue  # Skip, don't crash

    result = pipeline.inference_engine.detect(frame_data.frame)
    tracked_objects = pipeline.tracker.update(result.detections, frame_data.frame)

    for det in result.detections:
        if det.is_drone:
            pipeline.alert_handler.send_alert(det, frame_data)

    rendered = pipeline.renderer.render(...)
    if rendered is not None:
        if not pipeline.renderer.show(rendered):
            break  # User requested exit
```

#### Failure Mode Table

| Failure              | Behavior                 | Impact                    | Recovery                |
| -------------------- | ------------------------ | ------------------------- | ----------------------- |
| Camera fails to open | `start()` returns False  | Process exits with code 1 | Manual restart required |
| Model fails to load  | Exception thrown         | Process crashes           | Fix model path, restart |
| Frame read fails     | Logs error, continues    | Single frame lost         | Automatic (next frame)  |
| Inference timeout    | Returns empty detections | No alerts for frame       | Automatic (safe fail)   |
| Webhook timeout      | Catches URLError, logs   | Alert lost                | Manual review of logs   |
| Display closed       | `show()` returns False   | Clean shutdown            | Intentional             |
| Ctrl+C / SIGTERM     | Signal handler fires     | Clean shutdown            | Intentional             |

#### Alert Throttling

Failed alerts don't cascade. The cooldown mechanism prevents retry storms:

```python
now = time.time()
if now - self._last_alert_time < self._cooldown:
    return False  # Throttle repeated alerts
```

#### Targeting System Safety Interlocks

The fire net has **multiple fail-safe layers**
(`apps/detector/src/targeting.py`):

```python
if not self.fire_net_armed:
    return EngagementResult.FAILED_NOT_ARMED
if not self.fire_net_enabled:
    return EngagementResult.FAILED_NOT_ENABLED
if time.time() - self.last_fire_time < self.fire_net_cooldown_seconds:
    return EngagementResult.FAILED_IN_COOLDOWN
if det.confidence < self.fire_net_min_confidence:
    return EngagementResult.FAILED_LOW_CONFIDENCE
```

**Every check must pass** before GPIO pulse. Any failure = safe (no fire).

### Backend Failure Propagation

#### API Startup Failures

```rust
match TcpListener::bind(addr).await {
    Ok(l) => l,
    Err(e) => {
        tracing::error!(%addr, error=%e, "failed to bind TCP listener");
        std::process::exit(1);  // Fail fast
    }
}
```

The API **fails fast** on startup errors. A partial startup is worse than no
startup.

#### Keeper Job Processing

```rust
run_job_loop(&mut job_provider, job_anchor.as_ref(), poll_interval).await;
run_confirmation_loop(&pool, confirm_anchor.as_ref(), confirm_interval).await;

tokio::select! {
    _ = job_handle => {
        tracing::warn!("Job loop exited unexpectedly");
    }
    _ = confirm_handle => {
        tracing::warn!("Confirmation loop exited unexpectedly");
    }
}
```

Failed jobs **remain in queue** for retry. The outbox pattern ensures no
evidence is lost.

### Cloud Function Failure Propagation

#### Health Check Pattern

```typescript
try {
  const container = getContainer("configuration");
  await container.items.query("SELECT TOP 1 * FROM c").fetchAll();
  checks.cosmos = "ok";
} catch (error) {
  checks.cosmos = "error";
  errors.push(`Cosmos DB: ${error.message}`);
}

// Return 503 if critical service fails
status: checks.cosmos === "error" ? 503 : 200;
```

Health endpoints expose failures to load balancers. Unhealthy instances are
removed from rotation.

#### Cache Failures Are Non-Fatal

```typescript
container.items.upsert(updatedEntry).catch(() => {
  /* ignore update errors */
});
```

Cache misses result in slower responses, not failures. The system degrades
gracefully.

### Failure Propagation Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Failure Boundaries                        │
├─────────────────────────────────────────────────────────────┤
│  Edge: Frame failures → continue (skip frame)               │
│  Edge: Camera failures → process exit (requires restart)    │
│  Edge: Alert failures → logged (alert lost)                 │
│  Edge: GPIO failures → safe state (no fire)                 │
│                                                             │
│  API: Startup failures → immediate exit                     │
│  API: Request failures → error response (500)               │
│  API: Job failures → retry (remains in queue)               │
│                                                             │
│  Cloud: DB failures → 503 response                          │
│  Cloud: Cache failures → silent degradation                 │
│                                                             │
│  Chain: Transaction failures → retry with backoff           │
│  Chain: Confirmation failures → stay unconfirmed (retry)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. What Changes Under Load or Latency

### Frame Buffering Behavior

**OpenCV frame source** (`apps/detector/src/frame_sources.py`):

```python
self._cap.set(cv2.CAP_PROP_BUFFERSIZE, self._buffer_size)
```

Default buffer size: **1 frame**

| Scenario               | Buffer Size | Behavior                                   |
| ---------------------- | ----------- | ------------------------------------------ |
| Normal                 | 1           | Minimal latency, frames dropped under load |
| High load              | 1           | Older frames discarded, processing newest  |
| Streaming backpressure | 1           | Clients get freshest frame, older dropped  |

**Streaming frame buffer** (`apps/detector/src/streaming.py`):

```python
def put(self, frame: StreamFrame) -> None:
    if queue.full():
        try:
            queue.get_nowait()  # Drop oldest
        except asyncio.QueueEmpty:
            pass
    queue.put_nowait(frame)
```

MJPEG streaming **drops frames under backpressure**. Slow clients receive newest
available frame, not queued stale frames.

### Inference Latency Scaling

Resolution auto-tuning based on hardware capability:

| Platform     | Resolution | Inference Time | Accuracy Trade-off |
| ------------ | ---------- | -------------- | ------------------ |
| Pi 3         | 320x240    | ~100ms         | Lower accuracy     |
| Pi 4         | 480x360    | ~50ms          | Medium accuracy    |
| Pi 5         | 640x480    | ~25ms          | Higher accuracy    |
| Pi 5 + Coral | 640x480    | ~8ms           | Highest accuracy   |

Threading model adapts to available cores:

```python
# Pi3 (4 cores): 2 inference threads
# Pi5 (4 cores): 4 inference threads
self._num_threads = hardware.recommended_inference_threads
```

### Tracking Drift Under Fast Motion

The centroid tracker has a **maximum distance constraint**:

```python
if distances[row, col] > self._max_distance:
    continue  # Don't match if too far
# Default: 100 pixels
```

Impact at different frame rates:

| Drone Speed | FPS | Motion/Frame | Track Status |
| ----------- | --- | ------------ | ------------ |
| 10 m/s      | 30  | 33px         | Maintained   |
| 20 m/s      | 30  | 67px         | Maintained   |
| 30 m/s      | 30  | 100px        | **Lost**     |
| 30 m/s      | 15  | 200px        | **Lost**     |

**Graceful degradation**: Lost tracks get new IDs. Confidence history resets.
The system continues operating but loses track continuity.

### Webhook Latency Impact

```python
def _send_single(self, alert_data: dict) -> bool:
    try:
        urllib.request.urlopen(req, timeout=self._timeout)  # 5s default
        return True
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        self._failed_count += 1
        return False
```

Under high latency:

1. Webhook blocks for up to 5 seconds
2. Pipeline continues (alerts are fire-and-forget)
3. Alert is lost (no retry queue)
4. Cooldown timer prevents immediate retry

**Design decision**: Alert loss is preferable to pipeline blocking. Real-time
detection takes priority over guaranteed alert delivery.

### Cosmos DB Throughput Behavior

RU (Request Unit) consumption under load:

| Operation       | Approximate RU | Impact Under Load |
| --------------- | -------------- | ----------------- |
| Point read      | 1 RU           | Scales well       |
| Query (simple)  | 2-5 RU         | Moderate scaling  |
| Query (complex) | 10-50 RU       | May throttle      |
| Write           | 5-10 RU        | May throttle      |

**Cache TTLs reduce load**:

- Embeddings: 7-day TTL (reduces AI API calls)
- Queries: 1-hour TTL (balances freshness vs. cost)

Connection pooling behavior:

```typescript
// Warm function: existing client reused
// Cold start: new client created (~100-500ms overhead)
```

### Blockchain Confirmation Latency

Normal operation timeline:

```
Evidence recorded → 0ms
SQLite insert    → 1-5ms
Next poll cycle  → 0-5000ms (poll interval)
Chain submission → 100-2000ms (network latency)
Block inclusion  → 2000-15000ms (block time)
Confirmation     → 30000ms+ (confirmation interval)
```

**Total latency**: 5-50 seconds typical

Under network congestion:

- Chain submission may fail → retry with backoff
- Block inclusion delayed → longer confirmation wait
- **Evidence never lost** (SQLite outbox persists)

### Load Impact Summary

| Component    | Under Load   | Behavior             |
| ------------ | ------------ | -------------------- |
| Frame buffer | Full         | Drop oldest frames   |
| Inference    | Slow         | Reduced FPS          |
| Tracking     | Fast motion  | Lost tracks, new IDs |
| Webhooks     | Timeout      | Alerts lost          |
| Streaming    | Backpressure | Drop frames          |
| Cosmos DB    | RU throttle  | 429 responses, retry |
| Blockchain   | Congestion   | Delayed confirmation |

---

## 5. Which Constraints Are Real vs Imagined

### Real Constraints

#### Hardware Memory (Edge)

**Constraint**: Pi 3 with 512MB cannot run streaming + inference simultaneously.

**Evidence**: Config falls back when aiohttp unavailable:

```python
if STREAMING_AVAILABLE:
    # Use streaming
else:
    print("WARNING: Streaming requested but aiohttp not available")
    renderer = base_renderer  # Fall back
```

**Impact**: Monolithic pipeline only on low-memory devices.

#### Camera Frame Rate (Hardware-Limited)

**Constraint**: USB cameras rarely exceed 30fps. Hardware determines maximum.

**Evidence**: System reads back actual FPS:

```python
self._actual_fps = self._cap.get(cv2.CAP_PROP_FPS)
```

Setting `CAP_PROP_FPS` to 120 doesn't make a 30fps camera faster.

**Real capabilities**:

| Camera        | Max FPS | Max Resolution |
| ------------- | ------- | -------------- |
| Pi Camera v2  | 60      | 3280x2464      |
| Pi Camera v3  | 120     | 4608x2592      |
| USB (typical) | 30      | 1920x1080      |

#### Inference Quantization Trade-off

**Constraint**: Quantized models (int8) sacrifice 1-3% accuracy for 3-4x speed.

**Evidence**: Different normalization paths for quantized vs. floating-point:

```python
# Quantized: uint8 input, no normalization
# Floating-point: float32 input, normalized to [-1, 1]
```

This is a **physics constraint**: fewer bits = less precision.

#### Tracking Frame Rate Dependency

**Constraint**: Centroid tracker assumes small inter-frame motion.

At 15fps with 100px max_distance, a drone moving >100px/frame (>30m/s at typical
resolution) will lose track.

**Not software-fixable**: Kalman prediction helps but cannot overcome
fundamental frame rate limits.

#### Fire Net Hardware Safety

**Constraint**: GPIO 17 requires specific Pi hardware and correct wiring.

**Evidence**: Hard-coded safety:

```python
fire_net_arm_required = True  # Cannot be disabled
```

**Physical constraint**: Wrong wiring = no fire. Right wiring + wrong software =
no fire (safe default).

#### Cosmos DB Partition Key

**Constraint**: `/id` partition key requires unique document IDs.

**Evidence**: Azure enforces at write time. Duplicate ID = conflict error.

**Not optional**: Cosmos DB architecture requires partition key selection at
container creation.

#### RPC Rate Limits

**Constraint**: Free-tier blockchain RPC endpoints have 40-100 req/s limits.

**Evidence**: Keeper batches jobs to stay under limits.

**Cost constraint**: Higher limits require paid plans.

### Imagined Constraints

#### "Must Use Coral TPU for Speed"

**Reality**: TFLite on Pi 5 achieves 25-30ms inference without TPU. Coral
reduces to 8-10ms.

**Both work**. Coral is an optimization, not a requirement.

#### "Tracking Requires Kalman Filter"

**Reality**: Centroid tracker handles typical drone speeds adequately. Kalman
adds complexity for marginal benefit in most scenarios.

**Config allows**:

```python
tracker_type: none     # No persistence
tracker_type: centroid # Simple, fast (default)
tracker_type: kalman   # Complex, predictive
```

#### "Evidence Must Go to Blockchain Immediately"

**Reality**: System uses 5-second batch processing. Latency is acceptable for
post-hoc audit trails.

**Not real-time critical**: Evidence anchoring is forensic, not operational.

#### "Must Support Video Streaming"

**Reality**: Streaming is optional. System works headless:

```python
if STREAMING_AVAILABLE:
    # Use streaming
else:
    renderer = base_renderer  # No stream, still functional
```

#### "Cannot Run Without a Model File"

**Reality**: `--mock` mode uses synthetic detections. Demo possible without ML
model:

```bash
python -m src.main --mock
```

### Constraint Classification Matrix

| Constraint                 | Type                | Mitigation                   |
| -------------------------- | ------------------- | ---------------------------- |
| Pi 3 memory limit          | **REAL** (hardware) | Feature fallback             |
| Camera FPS limit           | **REAL** (hardware) | Accept limitation            |
| Quantization accuracy loss | **REAL** (physics)  | Accept trade-off             |
| Tracking motion limit      | **REAL** (math)     | Increase FPS or max_distance |
| GPIO wiring                | **REAL** (hardware) | Correct installation         |
| Partition key requirement  | **REAL** (Azure)    | Design around it             |
| RPC rate limits            | **REAL** (cost)     | Batching, paid plans         |
| Coral TPU required         | **IMAGINED**        | TFLite works fine            |
| Kalman required            | **IMAGINED**        | Centroid sufficient          |
| Immediate blockchain       | **IMAGINED**        | Batch acceptable             |
| Streaming required         | **IMAGINED**        | Headless works               |
| Model file required        | **IMAGINED**        | Mock mode available          |

---

## Configuration Reference

### Environment Variables

```bash
# Edge (Python)
CAPTURE_WIDTH=640
CAPTURE_HEIGHT=480
CAPTURE_FPS=30
INFERENCE_MODEL_PATH=/models/model.tflite
INFERENCE_CONFIDENCE_THRESHOLD=0.5
TARGETING_FIRE_NET_ENABLED=false
ALERT_WEBHOOK_URL=https://webhook.example.com

# Rust Keeper
KEEPER_PROVIDER=stub              # Options: stub, etherlink, solana, multi
KEEPER_DB_URL=sqlite://blockchain_outbox.sqlite3
KEEPER_POLL_MS=5000
KEEPER_CONFIRM_POLL_MS=30000
KEEPER_HTTP_PORT=8081
ETHERLINK_ENDPOINT=https://node.ghostnet.etherlink.com  # Testnet default
ETHERLINK_NETWORK=ghostnet

# Azure Functions
COSMOS_DB_CONNECTION_STRING=AccountEndpoint=...
COSMOS_DB_DATABASE=phoenix-docs
```

### Hard-Coded Constraints

| Constraint                 | Value  | Source           | Modifiable      |
| -------------------------- | ------ | ---------------- | --------------- |
| Max track disappear frames | 30     | `trackers.py`    | Yes (config)    |
| Centroid max distance      | 100px  | Settings default | Yes (config)    |
| Drone score threshold      | 0.5    | `interfaces.py`  | Yes (config)    |
| Fire net min confidence    | 0.85   | Settings         | Yes (config)    |
| Fire net min track frames  | 10     | Settings         | Yes (config)    |
| Fire net cooldown          | 10s    | Settings         | Yes (config)    |
| Fire net distance envelope | 5-50m  | Settings         | Yes (config)    |
| Fire net arm required      | True   | Hard-coded       | **No** (safety) |
| Webhook timeout            | 5s     | Alert handler    | Yes (config)    |
| Cache TTL (embeddings)     | 7 days | `cache.ts`       | Yes (code)      |
| Cache TTL (queries)        | 1 hour | `cache.ts`       | Yes (code)      |
| Keeper poll interval       | 5s     | Default          | Yes (env)       |
| Confirmation interval      | 30s    | Default          | Yes (env)       |

---

## Conclusion

The PhoenixRooivalk architecture succeeds because it **embraces uncertainty**:

1. **Auto-detecting hardware** removes manual configuration burden
2. **Providing sensible defaults** enables zero-config deployment
3. **Offering multiple implementations** handles diverse environments
4. **Failing safely** when constraints are violated protects users and hardware

The system distinguishes between **real constraints** (hardware limits, physics,
cost) and **imagined constraints** (perceived requirements that are actually
optional). Understanding this distinction enables informed trade-offs during
deployment and optimization.

---

_Document version: 1.0_ _Last updated: 2026-01-11_
