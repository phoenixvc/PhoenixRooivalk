//! Batch evidence anchoring with Merkle tree aggregation.
//!
//! Collects multiple evidence hashes and anchors them as a single Merkle root.
//! This reduces blockchain transaction costs by up to 100x while maintaining
//! full cryptographic proof for each individual evidence item.
//!
//! # How it works
//!
//! 1. Evidence hashes are collected into a batch
//! 2. When batch is full or timeout expires, compute Merkle root
//! 3. Anchor only the Merkle root to blockchain
//! 4. Store individual Merkle proofs in local database
//! 5. Proof verification: evidence hash + Merkle proof → Merkle root → blockchain

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use phoenix_evidence::anchor::{AnchorError, AnchorProvider};
use phoenix_evidence::model::{ChainTxRef, DigestAlgo, EvidenceDigest, EvidenceRecord};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{Pool, Row, Sqlite};
use std::sync::Arc;
use std::time::Duration;
use thiserror::Error;
use tokio::sync::Mutex;

/// Errors that can occur during Merkle tree operations
#[derive(Debug, Error)]
pub enum MerkleError {
    #[error("Invalid hex encoding: {0}")]
    HexDecode(#[from] hex::FromHexError),
    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
}

/// Errors that can occur during batch anchoring operations
#[derive(Debug, Error)]
pub enum BatchError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Merkle tree error: {0}")]
    Merkle(#[from] MerkleError),
}

/// Configuration for batch anchoring
#[derive(Debug, Clone)]
pub struct BatchConfig {
    /// Maximum number of evidence items per batch
    pub max_batch_size: usize,
    /// Maximum time to wait before anchoring a partial batch (seconds)
    pub max_batch_age_seconds: u64,
    /// Minimum batch size before anchoring (unless timeout)
    pub min_batch_size: usize,
}

impl Default for BatchConfig {
    fn default() -> Self {
        Self {
            max_batch_size: 100,
            max_batch_age_seconds: 60,
            min_batch_size: 1,
        }
    }
}

/// Merkle proof for a single evidence item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleProof {
    /// The evidence hash being proven
    pub leaf_hash: String,
    /// Index of the leaf in the original batch
    pub leaf_index: usize,
    /// Sibling hashes from leaf to root
    pub siblings: Vec<MerkleProofSibling>,
    /// The computed Merkle root
    pub root: String,
}

/// A sibling node in the Merkle proof
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleProofSibling {
    /// The hash of the sibling node
    pub hash: String,
    /// Whether the sibling is on the left (true) or right (false)
    pub is_left: bool,
}

impl MerkleProof {
    /// Verify this proof against a given root hash.
    ///
    /// Returns an error if any hex string in the proof is malformed.
    pub fn verify(&self, expected_root: &str) -> Result<bool, MerkleError> {
        let mut current_hash = hex::decode(&self.leaf_hash)?;

        for sibling in &self.siblings {
            let sibling_hash = hex::decode(&sibling.hash)?;

            let mut hasher = Sha256::new();
            if sibling.is_left {
                hasher.update(&sibling_hash);
                hasher.update(&current_hash);
            } else {
                hasher.update(&current_hash);
                hasher.update(&sibling_hash);
            }
            current_hash = hasher.finalize().to_vec();
        }

        Ok(hex::encode(current_hash) == expected_root)
    }
}

/// A batch of evidence awaiting anchoring
#[derive(Debug)]
struct EvidenceBatch {
    /// Evidence items in this batch
    items: Vec<BatchItem>,
    /// When this batch was created
    created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
struct BatchItem {
    job_id: String,
    payload_sha256: String,
}

/// Merkle tree for batch anchoring
#[derive(Debug)]
pub struct MerkleTree {
    /// Leaf hashes (bottom level)
    leaves: Vec<Vec<u8>>,
    /// All levels of the tree (leaves at 0, root at end)
    levels: Vec<Vec<Vec<u8>>>,
}

impl MerkleTree {
    /// Build a Merkle tree from leaf hashes.
    ///
    /// Returns an error if any input hash is not valid hex.
    pub fn from_leaves(leaf_hashes: Vec<String>) -> Result<Self, MerkleError> {
        let leaves: Vec<Vec<u8>> = leaf_hashes
            .iter()
            .map(|h| hex::decode(h))
            .collect::<Result<Vec<_>, _>>()?;

        let mut levels = vec![leaves.clone()];
        let mut current_level = leaves.clone();

        // Build tree bottom-up
        while current_level.len() > 1 {
            let mut next_level = Vec::new();

            for chunk in current_level.chunks(2) {
                let mut hasher = Sha256::new();
                hasher.update(&chunk[0]);
                if chunk.len() > 1 {
                    hasher.update(&chunk[1]);
                } else {
                    // Odd number of nodes - duplicate the last one
                    hasher.update(&chunk[0]);
                }
                next_level.push(hasher.finalize().to_vec());
            }

            levels.push(next_level.clone());
            current_level = next_level;
        }

        Ok(Self { leaves, levels })
    }

    /// Get the Merkle root hash
    pub fn root(&self) -> String {
        if let Some(top_level) = self.levels.last() {
            if let Some(root) = top_level.first() {
                return hex::encode(root);
            }
        }
        String::new()
    }

    /// Generate a proof for a specific leaf index
    pub fn proof(&self, index: usize) -> Option<MerkleProof> {
        if index >= self.leaves.len() {
            return None;
        }

        let mut siblings = Vec::new();
        let mut current_index = index;

        for level in &self.levels[..self.levels.len().saturating_sub(1)] {
            let sibling_index = if current_index % 2 == 0 {
                current_index + 1
            } else {
                current_index - 1
            };

            if sibling_index < level.len() {
                siblings.push(MerkleProofSibling {
                    hash: hex::encode(&level[sibling_index]),
                    is_left: current_index % 2 == 1,
                });
            } else {
                // Odd number of nodes - sibling is self
                siblings.push(MerkleProofSibling {
                    hash: hex::encode(&level[current_index]),
                    is_left: current_index % 2 == 1,
                });
            }

            current_index /= 2;
        }

        Some(MerkleProof {
            leaf_hash: hex::encode(&self.leaves[index]),
            leaf_index: index,
            siblings,
            root: self.root(),
        })
    }
}

/// Batch anchoring job processor
pub struct BatchAnchor {
    pool: Pool<Sqlite>,
    anchor: Arc<dyn AnchorProvider + Send + Sync>,
    config: BatchConfig,
    current_batch: Mutex<Option<EvidenceBatch>>,
}

impl BatchAnchor {
    /// Create a new batch anchor
    pub fn new(
        pool: Pool<Sqlite>,
        anchor: Arc<dyn AnchorProvider + Send + Sync>,
        config: BatchConfig,
    ) -> Self {
        Self {
            pool,
            anchor,
            config,
            current_batch: Mutex::new(None),
        }
    }

    /// Initialize database schema for batch anchoring
    pub async fn ensure_schema(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
        // Batch metadata table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS merkle_batches (
                id TEXT PRIMARY KEY,
                merkle_root TEXT NOT NULL,
                item_count INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                anchored_at INTEGER,
                tx_network TEXT,
                tx_chain TEXT,
                tx_id TEXT,
                tx_confirmed INTEGER DEFAULT 0
            )
            "#,
        )
        .execute(pool)
        .await?;

        // Individual proofs table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS merkle_proofs (
                job_id TEXT PRIMARY KEY,
                batch_id TEXT NOT NULL,
                leaf_index INTEGER NOT NULL,
                proof_json TEXT NOT NULL,
                FOREIGN KEY (batch_id) REFERENCES merkle_batches(id)
            )
            "#,
        )
        .execute(pool)
        .await?;

        // Index for batch lookups
        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_proofs_batch_id
            ON merkle_proofs(batch_id)
            "#,
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Add an evidence item to the current batch
    pub async fn add_to_batch(&self, job_id: &str, payload_sha256: &str) -> Result<(), BatchError> {
        let mut batch = self.current_batch.lock().await;

        if batch.is_none() {
            *batch = Some(EvidenceBatch {
                items: Vec::new(),
                created_at: Utc::now(),
            });
        }

        if let Some(ref mut b) = *batch {
            b.items.push(BatchItem {
                job_id: job_id.to_string(),
                payload_sha256: payload_sha256.to_string(),
            });

            // Check if batch is full
            if b.items.len() >= self.config.max_batch_size {
                let items = std::mem::take(&mut b.items);
                // Reset batch to None to clear stale created_at timestamp
                *batch = None;
                drop(batch);
                self.anchor_batch(items).await?;
            }
        }

        Ok(())
    }

    /// Check if batch should be flushed due to timeout
    pub async fn check_timeout(&self) -> Result<bool, BatchError> {
        let mut batch = self.current_batch.lock().await;

        if let Some(ref b) = *batch {
            let age = Utc::now()
                .signed_duration_since(b.created_at)
                .num_seconds() as u64;

            if age >= self.config.max_batch_age_seconds && b.items.len() >= self.config.min_batch_size
            {
                let items = b.items.clone();
                *batch = None;
                drop(batch);
                self.anchor_batch(items).await?;
                return Ok(true);
            }
        }

        Ok(false)
    }

    /// Flush the current batch immediately
    pub async fn flush(&self) -> Result<(), BatchError> {
        let mut batch = self.current_batch.lock().await;

        if let Some(ref b) = *batch {
            if !b.items.is_empty() {
                let items = b.items.clone();
                *batch = None;
                drop(batch);
                self.anchor_batch(items).await?;
            }
        }

        Ok(())
    }

    /// Anchor a batch of evidence items
    async fn anchor_batch(&self, items: Vec<BatchItem>) -> Result<(), BatchError> {
        if items.is_empty() {
            return Ok(());
        }

        // Build Merkle tree
        let leaf_hashes: Vec<String> = items.iter().map(|i| i.payload_sha256.clone()).collect();
        let tree = MerkleTree::from_leaves(leaf_hashes)?;
        let merkle_root = tree.root();

        // Generate batch ID
        let batch_id = format!("batch_{}", uuid::Uuid::new_v4());
        let now_ms = Utc::now().timestamp_millis();

        // Store batch metadata
        sqlx::query(
            "INSERT INTO merkle_batches (id, merkle_root, item_count, created_at) VALUES (?1, ?2, ?3, ?4)",
        )
        .bind(&batch_id)
        .bind(&merkle_root)
        .bind(items.len() as i64)
        .bind(now_ms)
        .execute(&self.pool)
        .await?;

        // Store individual proofs
        for (index, item) in items.iter().enumerate() {
            if let Some(proof) = tree.proof(index) {
                let proof_json = serde_json::to_string(&proof)
                    .map_err(MerkleError::from)?;
                sqlx::query(
                    "INSERT INTO merkle_proofs (job_id, batch_id, leaf_index, proof_json) VALUES (?1, ?2, ?3, ?4)",
                )
                .bind(&item.job_id)
                .bind(&batch_id)
                .bind(index as i64)
                .bind(&proof_json)
                .execute(&self.pool)
                .await?;
            }
        }

        // Anchor the Merkle root
        let evidence = EvidenceRecord {
            id: batch_id.clone(),
            created_at: Utc::now(),
            digest: EvidenceDigest {
                algo: DigestAlgo::Sha256,
                hex: merkle_root.clone(),
            },
            payload_mime: Some("application/x-merkle-root".to_string()),
            metadata: serde_json::json!({
                "type": "merkle_batch",
                "item_count": items.len(),
            }),
        };

        match self.anchor.anchor(&evidence).await {
            Ok(tx_ref) => {
                // Update batch with transaction info
                let anchored_at = Utc::now().timestamp_millis();
                sqlx::query(
                    r#"
                    UPDATE merkle_batches
                    SET anchored_at = ?1, tx_network = ?2, tx_chain = ?3, tx_id = ?4, tx_confirmed = ?5
                    WHERE id = ?6
                    "#,
                )
                .bind(anchored_at)
                .bind(&tx_ref.network)
                .bind(&tx_ref.chain)
                .bind(&tx_ref.tx_id)
                .bind(if tx_ref.confirmed { 1 } else { 0 })
                .bind(&batch_id)
                .execute(&self.pool)
                .await?;

                // Update individual job statuses
                for item in &items {
                    sqlx::query("UPDATE outbox_jobs SET status = 'done', updated_ms = ?1 WHERE id = ?2")
                        .bind(anchored_at)
                        .bind(&item.job_id)
                        .execute(&self.pool)
                        .await?;
                }

                tracing::info!(
                    batch_id = %batch_id,
                    item_count = items.len(),
                    merkle_root = %merkle_root,
                    tx_id = %tx_ref.tx_id,
                    "Batch anchored successfully"
                );
            }
            Err(e) => {
                tracing::error!(
                    batch_id = %batch_id,
                    error = %e,
                    "Failed to anchor batch"
                );
                // Batch remains in database for retry
            }
        }

        Ok(())
    }

    /// Get proof for a specific job
    pub async fn get_proof(&self, job_id: &str) -> Result<Option<(MerkleProof, ChainTxRef)>, BatchError> {
        let row = sqlx::query(
            r#"
            SELECT p.proof_json, b.tx_network, b.tx_chain, b.tx_id, b.tx_confirmed
            FROM merkle_proofs p
            JOIN merkle_batches b ON p.batch_id = b.id
            WHERE p.job_id = ?1
            "#,
        )
        .bind(job_id)
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            let proof_json: String = row.get("proof_json");
            let tx_network: Option<String> = row.get("tx_network");
            let tx_chain: Option<String> = row.get("tx_chain");
            let tx_id: Option<String> = row.get("tx_id");
            let tx_confirmed: i32 = row.get("tx_confirmed");

            let proof: MerkleProof = serde_json::from_str(&proof_json)
                .map_err(MerkleError::from)?;

            if let (Some(network), Some(chain), Some(tx_id)) = (tx_network, tx_chain, tx_id) {
                return Ok(Some((
                    proof,
                    ChainTxRef {
                        network,
                        chain,
                        tx_id,
                        confirmed: tx_confirmed != 0,
                        timestamp: None,
                    },
                )));
            }
        }

        Ok(None)
    }

    /// Get batch statistics
    pub async fn get_stats(&self) -> Result<BatchStats, sqlx::Error> {
        let batch = self.current_batch.lock().await;
        let pending_items = batch.as_ref().map(|b| b.items.len()).unwrap_or(0);
        drop(batch);

        let row = sqlx::query(
            "SELECT COUNT(*) as total, SUM(item_count) as items FROM merkle_batches WHERE anchored_at IS NOT NULL",
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(BatchStats {
            pending_items,
            total_batches: row.get::<i64, _>("total") as usize,
            total_items: row.get::<Option<i64>, _>("items").unwrap_or(0) as usize,
        })
    }
}

/// Batch anchoring statistics
#[derive(Debug, Clone)]
pub struct BatchStats {
    /// Items waiting to be batched
    pub pending_items: usize,
    /// Total batches anchored
    pub total_batches: usize,
    /// Total items anchored
    pub total_items: usize,
}

/// Run the batch anchoring loop
pub async fn run_batch_loop(
    batch_anchor: Arc<BatchAnchor>,
    poll_interval: Duration,
) {
    loop {
        if let Err(e) = batch_anchor.check_timeout().await {
            tracing::error!(error = %e, "Batch timeout check failed");
        }
        tokio::time::sleep(poll_interval).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_tree_single_leaf() {
        // Use valid hex strings for testing
        let tree = MerkleTree::from_leaves(vec!["abc123".to_string()]).unwrap();
        assert!(!tree.root().is_empty());
    }

    #[test]
    fn test_merkle_tree_multiple_leaves() {
        // Use valid hex strings for testing
        let leaves = vec![
            "abcd".to_string(),
            "1234".to_string(),
            "5678".to_string(),
            "9abc".to_string(),
        ];
        let tree = MerkleTree::from_leaves(leaves).unwrap();

        // Verify each proof
        for i in 0..4 {
            let proof = tree.proof(i).unwrap();
            assert!(proof.verify(&tree.root()).unwrap());
        }
    }

    #[test]
    fn test_merkle_proof_verification() {
        // Use valid hex strings for testing
        let leaves = vec!["aa".to_string(), "bb".to_string()];
        let tree = MerkleTree::from_leaves(leaves).unwrap();

        let proof0 = tree.proof(0).unwrap();
        let proof1 = tree.proof(1).unwrap();

        assert!(proof0.verify(&tree.root()).unwrap());
        assert!(proof1.verify(&tree.root()).unwrap());

        // Wrong root should fail (but return Ok(false), not an error for valid hex)
        assert!(!proof0.verify(&tree.root().replace("a", "b")).unwrap());
    }

    #[test]
    fn test_merkle_tree_invalid_hex() {
        // Invalid hex should return an error
        let result = MerkleTree::from_leaves(vec!["not_valid_hex!".to_string()]);
        assert!(result.is_err());
    }

    #[test]
    fn test_merkle_proof_verify_invalid_hex() {
        let leaves = vec!["aa".to_string(), "bb".to_string()];
        let tree = MerkleTree::from_leaves(leaves).unwrap();
        let proof = tree.proof(0).unwrap();

        // Invalid hex in expected_root should return an error
        // Note: The expected_root is compared as hex string, so this tests
        // that invalid sibling hashes would be caught
        let mut bad_proof = proof.clone();
        bad_proof.siblings = vec![MerkleProofSibling {
            hash: "not_valid_hex!".to_string(),
            is_left: false,
        }];
        assert!(bad_proof.verify(&tree.root()).is_err());
    }
}
