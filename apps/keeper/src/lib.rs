use async_trait::async_trait;
use chrono::{TimeZone, Utc};
use phoenix_evidence::anchor::{AnchorError, AnchorProvider};
use phoenix_evidence::model::{ChainTxRef, DigestAlgo, EvidenceDigest, EvidenceRecord};
use rand::Rng;
use sqlx::{Pool, Row, Sqlite};

pub mod batch_anchor;
pub mod config;

/// Initialize database schema for the keeper
pub async fn ensure_schema(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // Create outbox_jobs table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS outbox_jobs (
            id TEXT PRIMARY KEY,
            payload_sha256 TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'queued',
            attempts INTEGER NOT NULL DEFAULT 0,
            last_error TEXT,
            created_ms INTEGER NOT NULL,
            updated_ms INTEGER NOT NULL,
            next_attempt_ms INTEGER NOT NULL DEFAULT 0
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create outbox_tx_refs table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS outbox_tx_refs (
            job_id TEXT NOT NULL,
            network TEXT NOT NULL,
            chain TEXT NOT NULL,
            tx_id TEXT NOT NULL,
            confirmed INTEGER NOT NULL DEFAULT 0,
            timestamp INTEGER,
            PRIMARY KEY (job_id, network, chain, tx_id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[derive(Debug, Clone)]
pub struct EvidenceJob {
    pub id: String,
    pub payload_sha256: String,
    pub created_ms: i64,
}

#[derive(Debug, thiserror::Error)]
pub enum JobError {
    #[error("temporary: {0}")]
    Temporary(String),
    #[error("permanent: {0}")]
    Permanent(String),
}

impl From<sqlx::Error> for JobError {
    fn from(e: sqlx::Error) -> Self {
        JobError::Temporary(e.to_string())
    }
}

#[async_trait]
pub trait JobProvider {
    async fn fetch_next(&mut self) -> Result<Option<EvidenceJob>, JobError>;
    async fn mark_done(&mut self, id: &str) -> Result<(), JobError>;
    async fn mark_failed(&mut self, id: &str, reason: &str) -> Result<(), JobError>;
}

#[async_trait]
pub trait JobProviderExt: JobProvider {
    async fn mark_tx_and_done(&mut self, id: &str, tx: &ChainTxRef) -> Result<(), JobError>;
    async fn mark_failed_or_backoff(
        &mut self,
        id: &str,
        reason: &str,
        temporary: bool,
    ) -> Result<(), JobError>;
}

pub async fn run_job_loop<J: JobProvider + JobProviderExt, A: AnchorProvider + ?Sized>(
    provider: &mut J,
    anchor: &A,
    poll: std::time::Duration,
) {
    loop {
        match provider.fetch_next().await {
            Ok(Some(job)) => {
                let ev = EvidenceRecord {
                    id: job.id.clone(),
                    created_at: Utc::now(),
                    digest: EvidenceDigest {
                        algo: DigestAlgo::Sha256,
                        hex: job.payload_sha256.clone(),
                    },
                    payload_mime: None,
                    metadata: serde_json::json!({}),
                };
                match anchor.anchor(&ev).await {
                    Ok(txref) => {
                        let _ = provider.mark_tx_and_done(&job.id, &txref).await;
                    }
                    Err(e) => {
                        let temporary =
                            matches!(e, AnchorError::Network(_) | AnchorError::Provider(_));
                        let _ = provider
                            .mark_failed_or_backoff(&job.id, &e.to_string(), temporary)
                            .await;
                    }
                }
            }
            Ok(None) => {
                tokio::time::sleep(poll).await;
            }
            Err(e) => {
                tracing::error!(error = %e, "Failed to fetch next job");
                tokio::time::sleep(poll).await;
            }
        }
    }
}

pub async fn run_confirmation_loop<A: AnchorProvider + ?Sized>(
    pool: &Pool<Sqlite>,
    anchor: &A,
    poll: std::time::Duration,
) {
    loop {
        match fetch_unconfirmed_tx_refs(pool).await {
            Ok(tx_refs) => {
                for tx_ref in tx_refs {
                    match anchor.confirm(&tx_ref).await {
                        Ok(updated_tx) => {
                            if updated_tx.confirmed != tx_ref.confirmed {
                                let _ = update_tx_ref_confirmation(pool, &updated_tx).await;
                                if updated_tx.confirmed {
                                    tracing::info!(
                                        tx_id = %updated_tx.tx_id,
                                        network = %updated_tx.network,
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            tracing::warn!(
                                tx_id = %tx_ref.tx_id,
                                error = %e,
                                "Failed to check confirmation status"
                            );
                        }
                    }
                }
            }
            Err(e) => {
                tracing::error!(error = %e, "Failed to fetch unconfirmed tx refs");
            }
        }
        tokio::time::sleep(poll).await;
    }
}

async fn fetch_unconfirmed_tx_refs(pool: &Pool<Sqlite>) -> Result<Vec<ChainTxRef>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT job_id, network, chain, tx_id, confirmed, timestamp FROM outbox_tx_refs WHERE confirmed = 0"
    )
    .fetch_all(pool)
    .await?;

    let mut tx_refs = Vec::new();
    for row in rows {
        let timestamp_opt: Option<i64> = row.get("timestamp");
        let timestamp = timestamp_opt.and_then(|ts| {
            // Convert seconds to milliseconds and use the non-deprecated API
            Utc.timestamp_millis_opt(ts * 1000).single()
        });

        tx_refs.push(ChainTxRef {
            network: row.get("network"),
            chain: row.get("chain"),
            tx_id: row.get("tx_id"),
            confirmed: row.get::<i32, _>("confirmed") != 0,
            timestamp,
        });
    }

    Ok(tx_refs)
}

async fn update_tx_ref_confirmation(
    pool: &Pool<Sqlite>,
    tx_ref: &ChainTxRef,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE outbox_tx_refs SET confirmed = ?1 WHERE tx_id = ?2 AND network = ?3 AND chain = ?4",
    )
    .bind(if tx_ref.confirmed { 1 } else { 0 })
    .bind(&tx_ref.tx_id)
    .bind(&tx_ref.network)
    .bind(&tx_ref.chain)
    .execute(pool)
    .await?;

    Ok(())
}

pub struct SqliteJobProvider {
    pool: Pool<Sqlite>,
}

impl SqliteJobProvider {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl JobProvider for SqliteJobProvider {
    async fn fetch_next(&mut self) -> Result<Option<EvidenceJob>, JobError> {
        let mut tx = self.pool.begin().await?;
        let now_ms = chrono::Utc::now().timestamp_millis();
        if let Some(row) = sqlx::query(
            "SELECT id, payload_sha256, created_ms FROM outbox_jobs WHERE status='queued' AND next_attempt_ms <= ?1 ORDER BY created_ms ASC LIMIT 1",
        )
        .bind(now_ms)
        .fetch_optional(&mut *tx)
        .await?
        {
            let id: String = row.get(0);
            sqlx::query(
                "UPDATE outbox_jobs SET status='in_progress', updated_ms=?1, attempts=attempts+1 WHERE id=?2",
            )
            .bind(now_ms)
            .bind(&id)
            .execute(&mut *tx)
            .await?;
            tx.commit().await?;
            let payload_sha256: String = row.get(1);
            let created_ms: i64 = row.get(2);
            return Ok(Some(EvidenceJob {
                id,
                payload_sha256,
                created_ms,
            }));
        }
        tx.commit().await?;
        Ok(None)
    }

    async fn mark_done(&mut self, id: &str) -> Result<(), JobError> {
        let now_ms = chrono::Utc::now().timestamp_millis();
        sqlx::query("UPDATE outbox_jobs SET status='done', updated_ms=?1 WHERE id=?2")
            .bind(now_ms)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn mark_failed(&mut self, id: &str, reason: &str) -> Result<(), JobError> {
        let now_ms = chrono::Utc::now().timestamp_millis();
        sqlx::query(
            "UPDATE outbox_jobs SET status='failed', last_error=?1, updated_ms=?2, next_attempt_ms=?2 WHERE id=?3",
        )
        .bind(reason)
        .bind(now_ms)
        .bind(id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}

#[async_trait]
impl JobProviderExt for SqliteJobProvider {
    async fn mark_tx_and_done(&mut self, id: &str, tx: &ChainTxRef) -> Result<(), JobError> {
        let mut t = self.pool.begin().await?;
        sqlx::query(
            "INSERT OR REPLACE INTO outbox_tx_refs (job_id, network, chain, tx_id, confirmed, timestamp) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )
        .bind(id)
        .bind(&tx.network)
        .bind(&tx.chain)
        .bind(&tx.tx_id)
        .bind(if tx.confirmed { 1 } else { 0 })
        .bind(tx.timestamp.map(|dt| dt.timestamp()))
        .execute(&mut *t)
        .await?;
        let now_ms = chrono::Utc::now().timestamp_millis();
        sqlx::query("UPDATE outbox_jobs SET status='done', updated_ms=?1 WHERE id=?2")
            .bind(now_ms)
            .bind(id)
            .execute(&mut *t)
            .await?;
        t.commit().await?;
        Ok(())
    }

    async fn mark_failed_or_backoff(
        &mut self,
        id: &str,
        reason: &str,
        temporary: bool,
    ) -> Result<(), JobError> {
        let now_ms = chrono::Utc::now().timestamp_millis();
        if temporary {
            let rec = sqlx::query("SELECT attempts FROM outbox_jobs WHERE id=?1")
                .bind(id)
                .fetch_one(&self.pool)
                .await?;
            let attempts: i64 = rec.get(0);
            let base: i64 = 5000; // 5s
            let cap: i64 = 300000; // 5m
            let exp: u32 = attempts.clamp(0, 20) as u32;
            let backoff = (base.saturating_mul(2i64.pow(exp))).min(cap);
            let jitter = rand::rng().random_range(0..1000);
            let next = now_ms + backoff + jitter;
            sqlx::query(
                "UPDATE outbox_jobs SET status='queued', last_error=?1, updated_ms=?2, next_attempt_ms=?3 WHERE id=?4",
            )
            .bind(reason)
            .bind(now_ms)
            .bind(next)
            .bind(id)
            .execute(&self.pool)
            .await?;
            return Ok(());
        }
        sqlx::query(
            "UPDATE outbox_jobs SET status='failed', last_error=?1, updated_ms=?2, next_attempt_ms=?2 WHERE id=?3",
        )
        .bind(reason)
        .bind(now_ms)
        .bind(id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
