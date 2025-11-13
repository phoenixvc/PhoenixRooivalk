use sqlx::{Pool, Sqlite};

/// Shared database schema initialization logic
/// Creates the core outbox tables and indexes used across multiple applications
pub async fn ensure_schema(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // Jobs table - core evidence job tracking
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
    .execute(pool)
    .await?;

    // Transaction references table - blockchain anchoring metadata
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS outbox_tx_refs (
            job_id TEXT NOT NULL,
            network TEXT NOT NULL,
            chain TEXT NOT NULL,
            tx_id TEXT NOT NULL,
            confirmed INTEGER NOT NULL,
            timestamp INTEGER,
            PRIMARY KEY (job_id, network, chain)
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Best-effort migration for next_attempt_ms column (for backward compatibility)
    let _ = sqlx::query(
        "ALTER TABLE outbox_jobs ADD COLUMN next_attempt_ms INTEGER NOT NULL DEFAULT 0",
    )
    .execute(pool)
    .await;

    Ok(())
}
