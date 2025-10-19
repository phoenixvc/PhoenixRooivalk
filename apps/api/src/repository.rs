use crate::models::{EvidenceIn, EvidenceOut};
use sqlx::{Pool, Row, Sqlite, Transaction};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum RepositoryError {
    #[error("Database error: {0}")]
    Database(sqlx::Error),
    #[error("Validation error: {0}")]
    Validation(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Conflict: {0}")]
    Conflict(String),
}

impl From<sqlx::Error> for RepositoryError {
    fn from(error: sqlx::Error) -> Self {
        RepositoryError::Database(error)
    }
}

pub type Result<T> = std::result::Result<T, RepositoryError>;

/// Repository pattern for evidence job management
/// Provides a clean abstraction over database operations
pub struct EvidenceRepository {
    pool: Pool<Sqlite>,
}

impl EvidenceRepository {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Initialize database schema
    pub async fn ensure_schema(&self) -> Result<()> {
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
            );
            "#,
        )
        .execute(&self.pool)
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
            );
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Try to add next_attempt_ms if missing (best-effort migration)
        let _ = sqlx::query(
            "ALTER TABLE outbox_jobs ADD COLUMN next_attempt_ms INTEGER NOT NULL DEFAULT 0",
        )
        .execute(&self.pool)
        .await;

        Ok(())
    }

    /// Create a new evidence job
    pub async fn create_evidence_job(&self, evidence: &EvidenceIn) -> Result<String> {
        let id = evidence
            .id
            .clone()
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

        let now = chrono::Utc::now().timestamp_millis();

        let result = sqlx::query(
            "INSERT OR IGNORE INTO outbox_jobs (id, payload_sha256, status, attempts, created_ms, updated_ms, next_attempt_ms) VALUES (?1, ?2, 'queued', 0, ?3, ?3, 0)"
        )
        .bind(&id)
        .bind(&evidence.digest_hex)
        .bind(now)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(RepositoryError::Conflict(format!(
                "Evidence job with id '{}' already exists",
                id
            )));
        }

        Ok(id)
    }

    /// Get evidence job by ID
    pub async fn get_evidence_by_id(&self, id: &str) -> Result<Option<EvidenceOut>> {
        let row = sqlx::query(
            "SELECT id, status, attempts, last_error, created_ms, updated_ms FROM outbox_jobs WHERE id = ?1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|row| EvidenceOut {
            id: row.get::<String, _>(0),
            status: row.get::<String, _>(1),
            attempts: row.get::<i64, _>(2),
            last_error: row.get::<Option<String>, _>(3),
            created_ms: row.get::<i64, _>(4),
            updated_ms: row.get::<i64, _>(5),
        }))
    }

    /// List evidence jobs with pagination
    pub async fn list_evidence_jobs(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<EvidenceOut>, i64)> {
        // Get total count
        let count_row = sqlx::query("SELECT COUNT(*) FROM outbox_jobs")
            .fetch_one(&self.pool)
            .await?;
        let total_count: i64 = count_row.get(0);

        // Get paginated results
        let rows = sqlx::query(
            "SELECT id, status, attempts, last_error, created_ms, updated_ms FROM outbox_jobs ORDER BY created_ms DESC LIMIT ?1 OFFSET ?2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let jobs = rows
            .into_iter()
            .map(|row| EvidenceOut {
                id: row.get::<String, _>(0),
                status: row.get::<String, _>(1),
                attempts: row.get::<i64, _>(2),
                last_error: row.get::<Option<String>, _>(3),
                created_ms: row.get::<i64, _>(4),
                updated_ms: row.get::<i64, _>(5),
            })
            .collect();

        Ok((jobs, total_count))
    }

    /// Update job status
    pub async fn update_job_status(
        &self,
        id: &str,
        status: &str,
        error: Option<&str>,
    ) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis();

        let result = sqlx::query(
            "UPDATE outbox_jobs SET status = ?1, last_error = ?2, updated_ms = ?3 WHERE id = ?4",
        )
        .bind(status)
        .bind(error)
        .bind(now)
        .bind(id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(RepositoryError::NotFound(format!(
                "Evidence job with id '{}' not found",
                id
            )));
        }

        Ok(())
    }

    /// Increment job attempts
    pub async fn increment_attempts(&self, id: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis();

        let result = sqlx::query(
            "UPDATE outbox_jobs SET attempts = attempts + 1, updated_ms = ?1 WHERE id = ?2",
        )
        .bind(now)
        .bind(id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(RepositoryError::NotFound(format!(
                "Evidence job with id '{}' not found",
                id
            )));
        }

        Ok(())
    }

    /// Set next attempt time (for retry logic)
    pub async fn set_next_attempt(&self, id: &str, next_attempt_ms: i64) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis();

        let result = sqlx::query(
            "UPDATE outbox_jobs SET next_attempt_ms = ?1, updated_ms = ?2 WHERE id = ?3",
        )
        .bind(next_attempt_ms)
        .bind(now)
        .bind(id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(RepositoryError::NotFound(format!(
                "Evidence job with id '{}' not found",
                id
            )));
        }

        Ok(())
    }

    /// Get jobs ready for processing
    pub async fn get_ready_jobs(&self, limit: i64) -> Result<Vec<EvidenceOut>> {
        let now = chrono::Utc::now().timestamp_millis();

        let rows = sqlx::query(
            "SELECT id, status, attempts, last_error, created_ms, updated_ms FROM outbox_jobs WHERE status = 'queued' AND next_attempt_ms <= ?1 ORDER BY created_ms ASC LIMIT ?2"
        )
        .bind(now)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        let jobs = rows
            .into_iter()
            .map(|row| EvidenceOut {
                id: row.get::<String, _>(0),
                status: row.get::<String, _>(1),
                attempts: row.get::<i64, _>(2),
                last_error: row.get::<Option<String>, _>(3),
                created_ms: row.get::<i64, _>(4),
                updated_ms: row.get::<i64, _>(5),
            })
            .collect();

        Ok(jobs)
    }

    /// Mark job as in progress
    pub async fn mark_in_progress(&self, id: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis();

        let result = sqlx::query(
            "UPDATE outbox_jobs SET status = 'in_progress', updated_ms = ?1 WHERE id = ?2",
        )
        .bind(now)
        .bind(id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(RepositoryError::NotFound(format!(
                "Evidence job with id '{}' not found",
                id
            )));
        }

        Ok(())
    }

    /// Mark job as completed
    pub async fn mark_completed(&self, id: &str) -> Result<()> {
        self.update_job_status(id, "done", None).await
    }

    /// Mark job as failed
    pub async fn mark_failed(&self, id: &str, error: &str) -> Result<()> {
        self.update_job_status(id, "failed", Some(error)).await
    }

    /// Get job statistics
    pub async fn get_job_stats(&self) -> Result<JobStats> {
        let stats_row = sqlx::query(
            "SELECT 
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END), 0) as queued,
                COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress,
                COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) as done,
                COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed
            FROM outbox_jobs",
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(JobStats {
            total: stats_row.get::<i64, _>(0),
            queued: stats_row.get::<i64, _>(1),
            in_progress: stats_row.get::<i64, _>(2),
            done: stats_row.get::<i64, _>(3),
            failed: stats_row.get::<i64, _>(4),
        })
    }
}

/// Job statistics
#[derive(Debug, Clone)]
pub struct JobStats {
    pub total: i64,
    pub queued: i64,
    pub in_progress: i64,
    pub done: i64,
    pub failed: i64,
}

/// Transaction-based operations for complex operations
impl EvidenceRepository {
    /// Create evidence job with transaction
    pub async fn create_evidence_job_tx(
        &self,
        evidence: &EvidenceIn,
    ) -> Result<(Transaction<'_, Sqlite>, String)> {
        let mut tx = self.pool.begin().await?;

        let id = evidence
            .id
            .clone()
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

        let now = chrono::Utc::now().timestamp_millis();

        let result = sqlx::query(
            "INSERT OR IGNORE INTO outbox_jobs (id, payload_sha256, status, attempts, created_ms, updated_ms, next_attempt_ms) VALUES (?1, ?2, 'queued', 0, ?3, ?3, 0)"
        )
        .bind(&id)
        .bind(&evidence.digest_hex)
        .bind(now)
        .execute(&mut *tx)
        .await?;

        if result.rows_affected() == 0 {
            tx.rollback().await?;
            return Err(RepositoryError::Conflict(format!(
                "Evidence job with id '{}' already exists",
                id
            )));
        }

        Ok((tx, id))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn create_test_repo() -> EvidenceRepository {
        // Use in-memory database with shared cache
        let db_url = "sqlite::memory:?cache=shared";

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(db_url)
            .await
            .unwrap();

        // Enable foreign key support
        sqlx::query("PRAGMA foreign_keys = ON")
            .execute(&pool)
            .await
            .unwrap();

        let repo = EvidenceRepository::new(pool);
        repo.ensure_schema().await.unwrap();
        repo
    }

    #[tokio::test]
    async fn test_create_evidence_job() {
        let repo = create_test_repo().await;

        let evidence = EvidenceIn {
            id: Some("test-123".to_string()),
            digest_hex: "abcd1234".to_string(),
            payload_mime: Some("application/json".to_string()),
            metadata: Some(serde_json::json!({"key": "value"})),
        };

        let id = repo.create_evidence_job(&evidence).await.unwrap();
        assert_eq!(id, "test-123");

        let retrieved = repo.get_evidence_by_id(&id).await.unwrap().unwrap();
        assert_eq!(retrieved.id, "test-123");
        assert_eq!(retrieved.status, "queued");
    }

    #[tokio::test]
    async fn test_duplicate_evidence_job() {
        let repo = create_test_repo().await;

        let evidence = EvidenceIn {
            id: Some("test-123".to_string()),
            digest_hex: "abcd1234".to_string(),
            payload_mime: None,
            metadata: None,
        };

        // First creation should succeed
        let id = repo.create_evidence_job(&evidence).await.unwrap();
        assert_eq!(id, "test-123");

        // Second creation should fail
        let result = repo.create_evidence_job(&evidence).await;
        assert!(matches!(result, Err(RepositoryError::Conflict(_))));
    }

    #[tokio::test]
    async fn test_job_lifecycle() {
        let repo = create_test_repo().await;

        let evidence = EvidenceIn {
            id: Some("test-lifecycle".to_string()),
            digest_hex: "abcd1234".to_string(),
            payload_mime: None,
            metadata: None,
        };

        // Create job
        let id = repo.create_evidence_job(&evidence).await.unwrap();

        // Mark as in progress
        repo.mark_in_progress(&id).await.unwrap();

        let job = repo.get_evidence_by_id(&id).await.unwrap().unwrap();
        assert_eq!(job.status, "in_progress");

        // Mark as completed
        repo.mark_completed(&id).await.unwrap();

        let job = repo.get_evidence_by_id(&id).await.unwrap().unwrap();
        assert_eq!(job.status, "done");
    }

    #[tokio::test]
    async fn test_job_stats() {
        let repo = create_test_repo().await;

        // Create some test jobs
        for i in 0..5 {
            let evidence = EvidenceIn {
                id: Some(format!("test-{}", i)),
                digest_hex: "abcd1234".to_string(),
                payload_mime: None,
                metadata: None,
            };
            repo.create_evidence_job(&evidence).await.unwrap();
        }

        let stats = repo.get_job_stats().await.unwrap();
        assert_eq!(stats.total, 5);
        assert_eq!(stats.queued, 5);
        assert_eq!(stats.done, 0);
    }
}