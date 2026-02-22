---
id: adr-0034-keeper-dual-loop-design
title: "ADR 0034: Keeper Service Dual-Loop Design"
sidebar_label: "ADR 0034: Keeper Dual-Loop"
difficulty: expert
estimated_reading_time: 7
points: 30
tags:
  - technical
  - architecture
  - blockchain
  - reliability
prerequisites:
  - adr-0101-rust-workspace-rustls-policy
  - adr-0102-sqlite-operational-database
---

# ADR 0034: Keeper Service Dual-Loop Design

**Date**: 2026-02-22 **Status**: Accepted (Implemented)

---

## Executive Summary

1. **Problem**: Blockchain anchoring is inherently asynchronous — submitting a
   transaction and confirming it are separate operations with different timing
   requirements, and transient failures must not lose evidence jobs.
2. **Decision**: Run two concurrent `tokio::spawn` loops inside `tokio::select!`:
   a job processing loop (polls for new evidence, anchors to blockchain) and a
   confirmation loop (polls for unconfirmed transactions). Use exponential
   backoff with jitter for transient failures.
3. **Trade-off**: Two loops add operational complexity but decouple submission
   latency from confirmation latency, preventing slow confirmations from
   blocking new job processing.

---

## Context

The keeper service bridges the gap between the API's evidence database and the
blockchain networks (Solana, EtherLink). Evidence jobs are submitted to the
`outbox_jobs` table by the API, and the keeper must:

1. **Submit**: Read pending jobs, create blockchain transactions, record tx refs
2. **Confirm**: Poll submitted transactions until finalized on-chain
3. **Recover**: Retry failed jobs with exponential backoff

Blockchain confirmation times vary dramatically:

| Chain     | Typical Confirmation | Worst Case   |
| --------- | -------------------- | ------------ |
| Solana    | 400ms–2s             | 30s+ (congestion) |
| EtherLink | 5–15s                | 60s+ (reorg) |

A single-loop design would block new job processing while waiting for slow
confirmations. This is unacceptable when evidence jobs arrive continuously
during active drone operations.

---

## Options Considered

### Option 1: Dual Concurrent Loops with tokio::select! ✅ Selected

**Description**: Two `tokio::spawn` tasks running concurrently, coordinated by
`tokio::select!` for graceful shutdown.

**Pros**:

- Job submission never blocked by slow confirmations
- Each loop has independent polling intervals (configurable)
- `tokio::select!` detects unexpected loop exits for alerting
- Clean separation of concerns (submit vs. confirm)

**Cons**:

- Two concurrent database readers (mitigated by SQLite WAL mode)
- More complex shutdown logic
- Harder to reason about state transitions

### Option 2: Single Loop with State Machine ❌ Rejected

**Description**: One loop that alternates between processing new jobs and
checking confirmations.

**Pros**:

- Simpler code, single database connection
- Easier to reason about ordering

**Cons**:

- Slow confirmations block new job processing
- Must manually interleave job types
- Confirmation polling interval tied to job polling interval
- Higher latency for evidence anchoring during busy periods

### Option 3: Queue-Based with External Broker ❌ Rejected

**Description**: Use RabbitMQ or Redis Streams as a job broker.

**Pros**:

- Battle-tested distributed job processing
- Built-in retry, dead-letter, and monitoring

**Cons**:

- External infrastructure dependency (violates edge deployment constraint)
- Overkill for single-node deployments
- Network dependency for local operations

---

## Decision

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  Keeper Service                  │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │   Job Loop        │  │  Confirmation Loop   │ │
│  │                    │  │                      │ │
│  │  poll: 5000ms      │  │  poll: 30000ms       │ │
│  │  fetch_next()      │  │  fetch_unconfirmed() │ │
│  │  anchor()          │  │  confirm()           │ │
│  │  mark_done/fail()  │  │  update_tx_ref()     │ │
│  └──────────────────┘  └──────────────────────┘ │
│         ↕                      ↕                 │
│  ┌──────────────────────────────────────────┐   │
│  │         SQLite (outbox_jobs +            │   │
│  │         outbox_tx_refs tables)           │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  HTTP health endpoint (:8081/health)       │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### JobProvider Trait

```rust
#[async_trait]
pub trait JobProvider: Send + Sync {
    async fn fetch_next(&mut self) -> Result<Option<OutboxJob>>;
    async fn mark_done(&self, id: &str) -> Result<()>;
    async fn mark_failed(&self, id: &str, error: &str) -> Result<()>;
}

pub trait JobProviderExt: JobProvider {
    async fn mark_tx_and_done(&self, id: &str, tx: &ChainTxRef) -> Result<()>;
    async fn mark_failed_or_backoff(&self, id: &str, err: &str, temporary: bool) -> Result<()>;
}
```

### Exponential Backoff

For transient failures (network errors, provider timeouts):

```
backoff = min(5000ms * 2^attempts, 300000ms) + random(0..1000ms)
```

- **Base**: 5 seconds
- **Cap**: 5 minutes
- **Jitter**: 0–1000ms random to prevent thundering herd
- **Attempts clamped**: 0–20 to prevent overflow

Permanent failures (invalid payload, deserialization errors) are immediately
marked as `failed` without backoff.

### Configuration

| Variable                | Default | Description                 |
| ----------------------- | ------- | --------------------------- |
| `KEEPER_POLL_MS`        | 5000    | Job loop polling interval   |
| `KEEPER_CONFIRM_POLL_MS`| 30000   | Confirmation polling interval|
| `KEEPER_PROVIDER`       | `stub`  | Provider: stub/etherlink/solana/multi |
| `KEEPER_HTTP_PORT`      | 8081    | Health check HTTP port      |

---

## Consequences

### Positive

1. **Non-blocking**: New evidence jobs processed immediately regardless of
   confirmation backlog
2. **Resilient**: Exponential backoff prevents cascade failures during chain
   congestion
3. **Observable**: Health endpoint + tracing logs for both loops independently
4. **Configurable**: Independent polling intervals tune for different chain
   speeds

### Negative

1. **Complexity**: Two concurrent database readers require careful transaction
   isolation
2. **Resource usage**: Two long-running tokio tasks per keeper instance
3. **Testing**: Integration tests must account for async dual-loop behavior

### Neutral

1. **Graceful shutdown**: `tokio::select!` warns on unexpected loop exit but
   doesn't restart — a supervisor (systemd, Docker) should restart the process

---

## Related ADRs

- ADR 0101: Rust Workspace and rustls-Only TLS Policy
- ADR 0102: SQLite as Primary Operational Database (shared outbox schema)
- ADR 0200: Dual-Chain Evidence Anchoring (AnchorProvider consumers)
- ADR 0201: Evidence Hashing Algorithm (evidence digest format)

---

## References

- [tokio::select! documentation](https://docs.rs/tokio/latest/tokio/macro.select.html)
- [Exponential backoff and jitter (AWS)](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
