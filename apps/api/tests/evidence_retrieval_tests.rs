mod common;

use phoenix_api::build_app;
use reqwest::Client;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite, Row};

async fn setup_pool(db_url: &str) -> Pool<Sqlite> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(db_url)
        .await
        .unwrap();
    // Run migrations
    let migration_manager = phoenix_api::migrations::MigrationManager::new(pool.clone());
    migration_manager.migrate().await.unwrap();
    pool
}

#[tokio::test]
async fn test_get_evidence_endpoint() {
    common::with_api_db_env(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool.clone()).await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let job_id = "test-job-123";
        let now = chrono::Utc::now().timestamp_millis();
        
        sqlx::query(
            "INSERT INTO outbox_jobs (id, payload_sha256, status, attempts, last_error, created_ms, updated_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(job_id)
        .bind("abcd1234")
        .bind("done")
        .bind(1i64)
        .bind(Some("test error"))
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await
        .unwrap();

        let client = Client::new();
        let response = client
            .get(format!("http://127.0.0.1:{}/evidence/{}", port, job_id))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
        let result: serde_json::Value = response.json().await.unwrap();
        common::assert_json_response(&result, &[("id", job_id), ("status", "done")]);

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_get_evidence_not_found() {
    common::with_api_db_env(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool.clone()).await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let client = Client::new();
        let requested_id = "non-existent";
        let response = client
            .get(format!("http://127.0.0.1:{}/evidence/{}", port, requested_id))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 404);
        
        server.abort();
    })
    .await;
}
