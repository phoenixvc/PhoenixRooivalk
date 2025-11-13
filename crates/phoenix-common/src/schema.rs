use sqlx::{Pool, Sqlite, Row};
use crate::queries;

/// Shared database schema initialization logic
/// Creates the core outbox tables and indexes used across multiple applications
pub async fn ensure_schema(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    sqlx::query(queries::CREATE_OUTBOX_JOBS_TABLE)
        .execute(pool)
        .await?;
    sqlx::query(queries::CREATE_OUTBOX_TX_REFS_TABLE)
        .execute(pool)
        .await?;

    let rows = sqlx::query("PRAGMA table_info(outbox_jobs)")
        .fetch_all(pool)
        .await?;
    let has_column = rows.iter().any(|row| {
        row.get::<&str, _>("name") == "next_attempt_ms"
    });

    if !has_column {
        sqlx::query(queries::ADD_NEXT_ATTEMPT_MS_COLUMN)
            .execute(pool)
            .await?;
    }

    Ok(())
}
