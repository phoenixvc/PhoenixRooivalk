//! Integration tests for the BatchAnchor module (KPR-002).
//!
//! Covers: schema creation, add-and-flush, batch-size trigger,
//! proof retrieval, proof verification, statistics, empty-flush
//! no-op, and timeout-triggered flushing.

use async_trait::async_trait;
use chrono::Utc;
use phoenix_evidence::anchor::{AnchorError, AnchorProvider};
use phoenix_evidence::model::{ChainTxRef, EvidenceRecord};
use phoenix_keeper::batch_anchor::{BatchAnchor, BatchConfig, BatchStats};
use serial_test::serial;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Row, Sqlite};
use std::sync::Arc;
use std::time::SystemTime;

// ---------------------------------------------------------------------------
// Test helper: unique in-memory database per test
// ---------------------------------------------------------------------------

/// Create an isolated named in-memory SQLite pool.
///
/// Using a named in-memory database with `mode=memory&cache=shared` ensures
/// that all connections in the pool see the same data, which is required for
/// SQLite in-memory databases.  The name is seeded from the current nanosecond
/// timestamp so that tests that run concurrently do not share state.
async fn make_pool() -> Pool<Sqlite> {
    let name = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let url = format!(
        "sqlite:file:batch_anchor_test_{}?mode=memory&cache=shared",
        name
    );
    SqlitePoolOptions::new()
        .max_connections(4)
        .connect(&url)
        .await
        .expect("failed to open in-memory SQLite pool")
}

/// Set up both the keeper outbox schema and the batch-anchor Merkle schema on
/// the given pool.  `batch_anchor.rs` writes to `outbox_jobs` when updating
/// job statuses, so both sets of tables must exist.
async fn setup_schema(pool: &Pool<Sqlite>) {
    phoenix_keeper::ensure_schema(pool)
        .await
        .expect("ensure_schema (keeper) failed");
    BatchAnchor::ensure_schema(pool)
        .await
        .expect("BatchAnchor::ensure_schema failed");
}

// ---------------------------------------------------------------------------
// Mock AnchorProvider
// ---------------------------------------------------------------------------

/// Minimal mock that always succeeds, returning a predictable ChainTxRef.
struct MockAnchor;

#[async_trait]
impl AnchorProvider for MockAnchor {
    async fn anchor(&self, evidence: &EvidenceRecord) -> Result<ChainTxRef, AnchorError> {
        Ok(ChainTxRef {
            network: "test".to_string(),
            chain: "mock".to_string(),
            tx_id: format!("mock-tx-{}", &evidence.digest.hex[..8]),
            confirmed: true,
            timestamp: Some(Utc::now()),
        })
    }

    async fn confirm(&self, tx: &ChainTxRef) -> Result<ChainTxRef, AnchorError> {
        let mut confirmed = tx.clone();
        confirmed.confirmed = true;
        Ok(confirmed)
    }
}

/// Anchor provider that always returns a network error (used to verify that
/// the batch survives a failed anchor call and does not panic).
struct FailingAnchor;

#[async_trait]
impl AnchorProvider for FailingAnchor {
    async fn anchor(&self, _evidence: &EvidenceRecord) -> Result<ChainTxRef, AnchorError> {
        Err(AnchorError::Network(
            "simulated anchor failure".to_string(),
        ))
    }

    async fn confirm(&self, tx: &ChainTxRef) -> Result<ChainTxRef, AnchorError> {
        let mut t = tx.clone();
        t.confirmed = true;
        Ok(t)
    }
}

// ---------------------------------------------------------------------------
// Shared helper: valid 64-char hex SHA-256 digests for test payloads
// ---------------------------------------------------------------------------

/// Return the i-th deterministic test payload digest (valid 64-char hex).
fn test_digest(i: usize) -> String {
    // Each digest is 64 hex chars (32 bytes).  We fill with a repeating
    // nibble pattern derived from `i` so every digest is distinct and valid.
    let nibble = format!("{:x}", i % 16);
    nibble.repeat(64)
}

/// Insert a row into `outbox_jobs` so that `anchor_batch`'s UPDATE statement
/// has an actual row to touch.  SQLite does not error on zero-row UPDATEs, but
/// having real rows makes the stats assertions accurate.
async fn insert_outbox_job(pool: &Pool<Sqlite>, job_id: &str, digest: &str) {
    let now_ms = Utc::now().timestamp_millis();
    sqlx::query(
        "INSERT INTO outbox_jobs \
         (id, payload_sha256, status, attempts, created_ms, updated_ms, next_attempt_ms) \
         VALUES (?1, ?2, 'queued', 0, ?3, ?3, 0)",
    )
    .bind(job_id)
    .bind(digest)
    .bind(now_ms)
    .execute(pool)
    .await
    .expect("insert outbox_job failed");
}

// ---------------------------------------------------------------------------
// Test 1: Schema creation
// ---------------------------------------------------------------------------

/// `ensure_schema` creates the `merkle_batches` and `merkle_proofs` tables.
#[tokio::test]
#[serial]
async fn test_schema_creation() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    // Verify that the expected tables exist by querying the SQLite master table.
    let tables: Vec<String> = sqlx::query(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    )
    .fetch_all(&pool)
    .await
    .unwrap()
    .into_iter()
    .map(|row| row.get::<String, _>("name"))
    .collect();

    assert!(
        tables.contains(&"merkle_batches".to_string()),
        "merkle_batches table must exist; found: {:?}",
        tables
    );
    assert!(
        tables.contains(&"merkle_proofs".to_string()),
        "merkle_proofs table must exist; found: {:?}",
        tables
    );
}

/// Calling `ensure_schema` a second time on the same pool must be idempotent
/// (CREATE TABLE IF NOT EXISTS semantics).
#[tokio::test]
#[serial]
async fn test_schema_creation_is_idempotent() {
    let pool = make_pool().await;
    setup_schema(&pool).await;
    // Second call must not return an error.
    BatchAnchor::ensure_schema(&pool)
        .await
        .expect("second ensure_schema call should be idempotent");
}

// ---------------------------------------------------------------------------
// Test 2: Add to batch + manual flush
// ---------------------------------------------------------------------------

/// Adding items and then calling `flush()` anchors the batch and stores proofs.
#[tokio::test]
#[serial]
async fn test_add_to_batch_and_flush() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig {
        max_batch_size: 50,
        max_batch_age_seconds: 3600,
        min_batch_size: 1,
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let job_id = "flush-job-0";
    let digest = test_digest(0);
    insert_outbox_job(&pool, job_id, &digest).await;

    ba.add_to_batch(job_id, &digest).await.unwrap();

    // Proof must not exist yet (batch not yet anchored).
    let before = ba.get_proof(job_id).await.unwrap();
    assert!(
        before.is_none(),
        "proof should not exist before flush, got {:?}",
        before
    );

    ba.flush().await.unwrap();

    // After flush the proof must exist.
    let after = ba.get_proof(job_id).await.unwrap();
    assert!(
        after.is_some(),
        "proof should exist after flush"
    );
}

/// Adding three items and flushing anchors all of them in one batch.
#[tokio::test]
#[serial]
async fn test_flush_anchors_all_pending_items() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig {
        max_batch_size: 100,
        max_batch_age_seconds: 3600,
        min_batch_size: 1,
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let items: Vec<(String, String)> = (0..3)
        .map(|i| (format!("multi-job-{}", i), test_digest(i + 10)))
        .collect();

    for (job_id, digest) in &items {
        insert_outbox_job(&pool, job_id, digest).await;
        ba.add_to_batch(job_id, digest).await.unwrap();
    }

    ba.flush().await.unwrap();

    for (job_id, _) in &items {
        let proof = ba.get_proof(job_id).await.unwrap();
        assert!(
            proof.is_some(),
            "proof for {} should exist after flush",
            job_id
        );
    }
}

// ---------------------------------------------------------------------------
// Test 3: Batch size trigger (automatic anchor)
// ---------------------------------------------------------------------------

/// When `max_batch_size` items have been added the batch is anchored
/// automatically and proofs are immediately retrievable.
#[tokio::test]
#[serial]
async fn test_batch_size_triggers_automatic_anchor() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let max_batch_size: usize = 4;
    let config = BatchConfig {
        max_batch_size,
        max_batch_age_seconds: 3600,
        min_batch_size: 1,
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let items: Vec<(String, String)> = (0..max_batch_size)
        .map(|i| (format!("size-job-{}", i), test_digest(i + 20)))
        .collect();

    for (job_id, digest) in &items {
        insert_outbox_job(&pool, job_id, digest).await;
        ba.add_to_batch(job_id, digest).await.unwrap();
    }

    // No explicit flush was called; the batch should have been triggered at
    // the max_batch_size boundary.
    for (job_id, _) in &items {
        let proof = ba.get_proof(job_id).await.unwrap();
        assert!(
            proof.is_some(),
            "proof for {} should exist after automatic trigger",
            job_id
        );
    }

    // The in-flight batch must now be empty (was cleared on trigger).
    let stats = ba.get_stats().await.unwrap();
    assert_eq!(
        stats.pending_items, 0,
        "pending_items must be 0 after size-triggered anchor"
    );
}

// ---------------------------------------------------------------------------
// Test 4: Proof retrieval (MerkleProof + ChainTxRef returned correctly)
// ---------------------------------------------------------------------------

/// `get_proof` returns both a `MerkleProof` and a `ChainTxRef` after anchoring.
#[tokio::test]
#[serial]
async fn test_proof_retrieval_returns_merkle_proof_and_chain_tx_ref() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig::default();
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let job_id = "proof-retrieval-job";
    let digest = test_digest(30);
    insert_outbox_job(&pool, job_id, &digest).await;

    ba.add_to_batch(job_id, &digest).await.unwrap();
    ba.flush().await.unwrap();

    let result = ba.get_proof(job_id).await.unwrap();
    assert!(result.is_some(), "get_proof must return Some after anchoring");

    let (merkle_proof, tx_ref) = result.unwrap();

    // MerkleProof fields
    assert_eq!(
        merkle_proof.leaf_hash, digest,
        "leaf_hash must match the original digest"
    );
    assert_eq!(
        merkle_proof.leaf_index, 0,
        "single-item batch has leaf_index 0"
    );
    assert!(
        !merkle_proof.root.is_empty(),
        "Merkle root must not be empty"
    );

    // ChainTxRef fields (MockAnchor returns network="test", chain="mock")
    assert_eq!(tx_ref.network, "test");
    assert_eq!(tx_ref.chain, "mock");
    assert!(
        !tx_ref.tx_id.is_empty(),
        "tx_id must be non-empty"
    );
    assert!(
        tx_ref.confirmed,
        "MockAnchor always returns confirmed=true"
    );
}

/// For a multi-item batch the leaf_index stored in the proof matches the
/// insertion order.
#[tokio::test]
#[serial]
async fn test_proof_retrieval_leaf_indices_in_multi_item_batch() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig {
        max_batch_size: 100,
        max_batch_age_seconds: 3600,
        min_batch_size: 1,
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let items: Vec<(String, String)> = (0..4)
        .map(|i| (format!("idx-job-{}", i), test_digest(i + 40)))
        .collect();

    for (job_id, digest) in &items {
        insert_outbox_job(&pool, job_id, digest).await;
        ba.add_to_batch(job_id, digest).await.unwrap();
    }
    ba.flush().await.unwrap();

    for (expected_index, (job_id, _)) in items.iter().enumerate() {
        let (proof, _) = ba.get_proof(job_id).await.unwrap().unwrap();
        assert_eq!(
            proof.leaf_index, expected_index,
            "leaf_index for {} must be {}",
            job_id, expected_index
        );
    }
}

// ---------------------------------------------------------------------------
// Test 5: Proof verification
// ---------------------------------------------------------------------------

/// The `MerkleProof` returned by `get_proof` must verify correctly against its
/// own root.
#[tokio::test]
#[serial]
async fn test_proof_verification_single_item() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig::default();
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let job_id = "verify-single-job";
    let digest = test_digest(50);
    insert_outbox_job(&pool, job_id, &digest).await;

    ba.add_to_batch(job_id, &digest).await.unwrap();
    ba.flush().await.unwrap();

    let (proof, _) = ba.get_proof(job_id).await.unwrap().unwrap();
    let valid = proof.verify(&proof.root).unwrap();
    assert!(valid, "single-item MerkleProof must verify against its root");
}

/// Proofs from a multi-item batch all verify correctly.
#[tokio::test]
#[serial]
async fn test_proof_verification_multi_item_batch() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig {
        max_batch_size: 100,
        max_batch_age_seconds: 3600,
        min_batch_size: 1,
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let items: Vec<(String, String)> = (0..5)
        .map(|i| (format!("verify-multi-job-{}", i), test_digest(i + 60)))
        .collect();

    for (job_id, digest) in &items {
        insert_outbox_job(&pool, job_id, digest).await;
        ba.add_to_batch(job_id, digest).await.unwrap();
    }
    ba.flush().await.unwrap();

    // All proofs must share the same root (same batch) and each must verify.
    let mut roots: Vec<String> = Vec::new();
    for (job_id, _) in &items {
        let (proof, _) = ba.get_proof(job_id).await.unwrap().unwrap();
        let valid = proof.verify(&proof.root).unwrap();
        assert!(
            valid,
            "MerkleProof for {} must verify against its root",
            job_id
        );
        roots.push(proof.root.clone());
    }

    // Every item in the same batch must share the identical Merkle root.
    let first_root = &roots[0];
    for root in &roots {
        assert_eq!(
            root, first_root,
            "all proofs in a batch must share the same Merkle root"
        );
    }
}

/// A proof must NOT verify against a wrong (tampered) root.
#[tokio::test]
#[serial]
async fn test_proof_verification_fails_with_wrong_root() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig::default();
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let job_id = "verify-wrong-root-job";
    let digest = test_digest(70);
    insert_outbox_job(&pool, job_id, &digest).await;

    ba.add_to_batch(job_id, &digest).await.unwrap();
    ba.flush().await.unwrap();

    let (proof, _) = ba.get_proof(job_id).await.unwrap().unwrap();

    // Tamper with the root by flipping every 'a' to 'b'.
    let wrong_root = proof.root.replace('a', "b");
    // Guard: the tampered root must actually differ.
    if wrong_root == proof.root {
        // If the root had no 'a's, flip '0' to '1' instead.
        let alt_root = proof.root.replace('0', "1");
        if alt_root != proof.root {
            let valid = proof.verify(&alt_root).unwrap();
            assert!(!valid, "proof must not verify against a tampered root");
        }
        // If the root somehow has neither 'a' nor '0' we cannot reliably
        // construct a differing valid-hex root, so skip the assertion.
    } else {
        let valid = proof.verify(&wrong_root).unwrap();
        assert!(!valid, "proof must not verify against a tampered root");
    }
}

// ---------------------------------------------------------------------------
// Test 6: Statistics
// ---------------------------------------------------------------------------

/// `get_stats` returns correct counts for pending items, total batches anchored,
/// and total items anchored.
#[tokio::test]
#[serial]
async fn test_get_stats_after_flush() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig {
        max_batch_size: 100,
        max_batch_age_seconds: 3600,
        min_batch_size: 1,
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    // Initially everything must be zero.
    let initial: BatchStats = ba.get_stats().await.unwrap();
    assert_eq!(initial.pending_items, 0);
    assert_eq!(initial.total_batches, 0);
    assert_eq!(initial.total_items, 0);

    // Add 3 items and flush (one batch of 3).
    for i in 0..3_usize {
        let job_id = format!("stats-job-{}", i);
        let digest = test_digest(i + 80);
        insert_outbox_job(&pool, &job_id, &digest).await;
        ba.add_to_batch(&job_id, &digest).await.unwrap();
    }

    let mid: BatchStats = ba.get_stats().await.unwrap();
    assert_eq!(mid.pending_items, 3, "3 items pending before flush");
    assert_eq!(mid.total_batches, 0, "no batches anchored yet");

    ba.flush().await.unwrap();

    let after: BatchStats = ba.get_stats().await.unwrap();
    assert_eq!(after.pending_items, 0, "no items pending after flush");
    assert_eq!(after.total_batches, 1, "one batch anchored");
    assert_eq!(after.total_items, 3, "three items in the anchored batch");
}

/// After two separate flush calls the stats accumulate correctly.
#[tokio::test]
#[serial]
async fn test_get_stats_accumulates_across_multiple_flushes() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig {
        max_batch_size: 100,
        max_batch_age_seconds: 3600,
        min_batch_size: 1,
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    // First batch: 2 items.
    for i in 0..2_usize {
        let job_id = format!("stats-acc-a-{}", i);
        let digest = test_digest(i + 90);
        insert_outbox_job(&pool, &job_id, &digest).await;
        ba.add_to_batch(&job_id, &digest).await.unwrap();
    }
    ba.flush().await.unwrap();

    // Second batch: 3 items.
    for i in 0..3_usize {
        let job_id = format!("stats-acc-b-{}", i);
        let digest = test_digest(i + 92);
        insert_outbox_job(&pool, &job_id, &digest).await;
        ba.add_to_batch(&job_id, &digest).await.unwrap();
    }
    ba.flush().await.unwrap();

    let stats: BatchStats = ba.get_stats().await.unwrap();
    assert_eq!(stats.total_batches, 2, "two batches anchored");
    assert_eq!(stats.total_items, 5, "five items total");
    assert_eq!(stats.pending_items, 0);
}

// ---------------------------------------------------------------------------
// Test 7: Empty flush is a no-op
// ---------------------------------------------------------------------------

/// `flush()` on an empty batch returns `Ok(())` and does not create any
/// database rows.
#[tokio::test]
#[serial]
async fn test_flush_empty_batch_is_noop() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig::default();
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    // Flush an empty BatchAnchor — must succeed.
    ba.flush().await.unwrap();

    // No batch rows must have been inserted.
    let count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM merkle_batches")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(count, 0, "no batch rows for an empty flush");

    let stats: BatchStats = ba.get_stats().await.unwrap();
    assert_eq!(stats.pending_items, 0);
    assert_eq!(stats.total_batches, 0);
    assert_eq!(stats.total_items, 0);
}

/// Multiple consecutive empty flushes must all succeed.
#[tokio::test]
#[serial]
async fn test_multiple_empty_flushes_remain_noop() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig::default();
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    for _ in 0..5 {
        ba.flush().await.unwrap();
    }

    let stats: BatchStats = ba.get_stats().await.unwrap();
    assert_eq!(stats.total_batches, 0);
}

// ---------------------------------------------------------------------------
// Test 8: Timeout trigger
// ---------------------------------------------------------------------------

/// `check_timeout` with `max_batch_age_seconds = 0` anchors the batch
/// immediately (age 0 seconds >= threshold 0 seconds).
#[tokio::test]
#[serial]
async fn test_check_timeout_triggers_flush_when_age_zero_threshold() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    // Set the timeout to zero so that any non-empty batch immediately exceeds it.
    let config = BatchConfig {
        max_batch_size: 100,
        max_batch_age_seconds: 0,
        min_batch_size: 1,
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let job_id = "timeout-job-0";
    let digest = test_digest(0);
    insert_outbox_job(&pool, job_id, &digest).await;

    ba.add_to_batch(job_id, &digest).await.unwrap();

    // At this point the batch's `created_at` was just set to `Utc::now()`.
    // The age in whole seconds is 0, which satisfies `age >= 0`.
    let triggered = ba.check_timeout().await.unwrap();
    assert!(triggered, "check_timeout must return true when threshold is 0");

    // The item must have been anchored.
    let proof = ba.get_proof(job_id).await.unwrap();
    assert!(
        proof.is_some(),
        "proof must exist after timeout-triggered anchor"
    );
}

/// `check_timeout` on an empty batch must return `false` and be a no-op.
#[tokio::test]
#[serial]
async fn test_check_timeout_empty_batch_returns_false() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig {
        max_batch_size: 100,
        max_batch_age_seconds: 0,
        min_batch_size: 1,
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let triggered = ba.check_timeout().await.unwrap();
    assert!(
        !triggered,
        "check_timeout on an empty batch must return false"
    );
}

/// `check_timeout` must NOT trigger when the batch has fewer items than
/// `min_batch_size`, even if the age threshold is met.
#[tokio::test]
#[serial]
async fn test_check_timeout_respects_min_batch_size() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig {
        max_batch_size: 100,
        max_batch_age_seconds: 0, // age threshold always satisfied
        min_batch_size: 3,        // but we only add 1 item
    };
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let job_id = "min-batch-job-0";
    let digest = test_digest(0);
    insert_outbox_job(&pool, job_id, &digest).await;

    ba.add_to_batch(job_id, &digest).await.unwrap();

    // Only 1 item in batch, min_batch_size is 3 → must NOT trigger.
    let triggered = ba.check_timeout().await.unwrap();
    assert!(
        !triggered,
        "check_timeout must not trigger when batch is below min_batch_size"
    );

    // The item must still be pending (not anchored).
    let proof = ba.get_proof(job_id).await.unwrap();
    assert!(
        proof.is_none(),
        "proof must not exist when timeout was not triggered"
    );
}

// ---------------------------------------------------------------------------
// Test 9: Anchor failure does not panic and batch remains in the database
// ---------------------------------------------------------------------------

/// When the `AnchorProvider` fails, `flush()` returns `Ok(())` (error is
/// logged internally) and the `merkle_batches` row is preserved for retry.
#[tokio::test]
#[serial]
async fn test_flush_with_failing_anchor_survives_gracefully() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig {
        max_batch_size: 100,
        max_batch_age_seconds: 3600,
        min_batch_size: 1,
    };
    let anchor = Arc::new(FailingAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let job_id = "fail-anchor-job";
    let digest = test_digest(0);
    insert_outbox_job(&pool, job_id, &digest).await;

    ba.add_to_batch(job_id, &digest).await.unwrap();
    // flush must not propagate the anchor error.
    ba.flush().await.unwrap();

    // The batch row must exist (inserted before the failed anchor call).
    let batch_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM merkle_batches")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        batch_count, 1,
        "batch row must be present for retry even after anchor failure"
    );

    // The batch must not have been marked as anchored (anchored_at IS NULL).
    let anchored_at: Option<i64> =
        sqlx::query_scalar("SELECT anchored_at FROM merkle_batches LIMIT 1")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(
        anchored_at.is_none(),
        "anchored_at must be NULL when anchor failed"
    );

    // No proof must be available for the job because the anchor failed.
    // The proof row itself is stored, but `get_proof` requires the batch's
    // tx_id to be non-NULL.
    let proof = ba.get_proof(job_id).await.unwrap();
    assert!(
        proof.is_none(),
        "get_proof must return None when tx_id is NULL (anchor failed)"
    );
}

// ---------------------------------------------------------------------------
// Test 10: get_proof returns None for an unknown job_id
// ---------------------------------------------------------------------------

/// `get_proof` must return `Ok(None)` for a job_id that was never added.
#[tokio::test]
#[serial]
async fn test_get_proof_returns_none_for_unknown_job() {
    let pool = make_pool().await;
    setup_schema(&pool).await;

    let config = BatchConfig::default();
    let anchor = Arc::new(MockAnchor);
    let ba = BatchAnchor::new(pool.clone(), anchor, config);

    let result = ba.get_proof("nonexistent-job-id").await.unwrap();
    assert!(result.is_none(), "get_proof must return None for unknown job");
}
