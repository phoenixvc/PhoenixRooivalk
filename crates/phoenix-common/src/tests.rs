
#[cfg(test)]
mod tests {
    use super::*;
    use crate::schema::ensure_schema;
    use sqlx::{Pool, Sqlite, sqlite::SqlitePoolOptions};

    async fn setup_db() -> Pool<Sqlite> {
        let pool = SqlitePoolOptions::new()
            .connect("sqlite::memory:")
            .await
            .unwrap();
        pool
    }

    #[tokio::test]
    async fn test_ensure_schema_is_idempotent() {
        let pool = setup_db().await;

        // Run schema creation twice to check for idempotency
        let result1 = ensure_schema(&pool).await;
        assert!(result1.is_ok());

        let result2 = ensure_schema(&pool).await;
        assert!(result2.is_ok());
    }
}
