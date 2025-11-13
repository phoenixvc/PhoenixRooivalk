mod common;

use phoenix_api::build_app;
use reqwest::Client;
use serde_json::Value;
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
async fn test_evidence_pagination_clamp() {
    common::with_api_db_env(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool.clone()).await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let now = chrono::Utc::now().timestamp_millis();
        for i in 0..150 {
            let id = format!("job-{}", i);
            sqlx::query(
                "INSERT INTO outbox_jobs (id, payload_sha256, status, attempts, created_ms, updated_ms, next_attempt_ms)
                 VALUES (?1, ?2, 'queued', 0, ?3, ?3, 0)"
            )
            .bind(id)
            .bind("seedhash")
            .bind(now)
            .execute(&pool)
            .await
            .unwrap();
        }

        let client = Client::new();
        let url = format!("http://127.0.0.1:{}/evidence?per_page=1000&page=1", port);

        let resp = client.get(&url).send().await.unwrap();
        assert!(resp.status().is_success());
        let body: Value = resp.json().await.unwrap();

        assert_eq!(body["per_page"].as_i64().unwrap_or(0), 100);
        let data = body["data"].as_array().unwrap();
        assert!(data.len() <= 100);

        server.abort();
    })
    .await;
}
