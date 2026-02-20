# Keeper App — Claude Code Context

## Overview

Rust background service for blockchain evidence anchoring. Processes jobs from a
SQLite outbox, anchors evidence hashes to EtherLink/Solana, and polls for
transaction confirmations. Runs on port 8081.

## Architecture

Dual-loop design running concurrently via `tokio::select!`:

1. **Job processing loop** — Fetches queued jobs, anchors to blockchain, stores
   transaction references
2. **Confirmation loop** — Polls blockchain until transactions are confirmed

Exponential backoff for transient failures:
`(5s * 2^attempts).min(5min) + rand(0..1s)`. Permanent failures are marked
failed with no retry.

## Key Traits

```rust
pub trait JobProvider {
    async fn fetch_next(&mut self) -> Result<Option<EvidenceJob>, JobError>;
    async fn mark_done(&mut self, id: &str) -> Result<(), JobError>;
    async fn mark_failed(&mut self, id: &str, reason: &str) -> Result<(), JobError>;
}

pub trait JobProviderExt: JobProvider {
    async fn mark_tx_and_done(&mut self, id: &str, tx: &ChainTxRef) -> ...;
    async fn mark_failed_or_backoff(&mut self, id: &str, reason: &str, temporary: bool) -> ...;
}
```

Concrete implementation: `SqliteJobProvider`.

## Database Schema

Created automatically on startup via `ensure_schema()`:

- `outbox_jobs` — id, payload_sha256, status (queued/in_progress/done/failed),
  attempts, last_error, created_ms, updated_ms, next_attempt_ms
- `outbox_tx_refs` — job_id, network, chain, tx_id, confirmed, timestamp
- `merkle_batches` — Batch anchoring aggregation (WIP)
- `merkle_proofs` — Per-job Merkle proofs (WIP)

## Environment Variables

| Variable                | Default                              | Notes                       |
| ----------------------- | ------------------------------------ | --------------------------- |
| `KEEPER_USE_STUB`       | `false`                              | Stub provider for dev       |
| `KEEPER_DB_URL`         | `sqlite://blockchain_outbox.sqlite3` | SQLite connection           |
| `KEEPER_POLL_MS`        | `5000`                               | Job polling interval (ms)   |
| `KEEPER_HTTP_PORT`      | `8081`                               | Health check port           |
| `KEEPER_PROVIDER`       | `stub`                               | stub/etherlink/solana/multi |
| `ETHERLINK_ENDPOINT`    | `https://node.etherlink.com`         | EtherLink node URL          |
| `ETHERLINK_NETWORK`     | `mainnet`                            | EtherLink network           |
| `ETHERLINK_PRIVATE_KEY` | —                                    | Signing key (required)      |
| `SOLANA_ENDPOINT`       | `https://api.devnet.solana.com`      | Solana RPC endpoint         |
| `SOLANA_NETWORK`        | `devnet`                             | Solana network              |
| `RUST_LOG`              | `info`                               | Log level                   |

## Provider Types

Configured via `KEEPER_PROVIDER`:

- **stub** — Development mode, simulates anchoring
- **etherlink** — EtherLink blockchain (requires `ETHERLINK_PRIVATE_KEY`)
- **solana** — Solana blockchain
- **multi** — Both EtherLink and Solana simultaneously

## Batch Anchoring (WIP)

Merkle tree aggregation reduces blockchain costs by ~100x. Batches up to 100
items with a 60-second timeout flush. Not yet exported from `lib.rs`.

## Testing

```bash
cargo test -p phoenix-keeper          # All keeper tests
```

3 test files: `integration_tests.rs` (13 tests), `core_functions.rs` (7 tests),
`db_evidence.rs` (2 tests). Uses `MockAnchorProvider`, `MockJobProvider`,
in-memory SQLite, and `tempfile` for isolation. Tests marked `#[serial]` for
database isolation.

## Dependencies

Uses `phoenix-evidence`, `anchor-etherlink`, and `phoenix-common` crates. All
HTTP via `rustls` (no native-tls).
