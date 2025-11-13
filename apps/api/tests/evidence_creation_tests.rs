mod common;

use phoenix_api::build_app;
use reqwest::Client;
use serde_json::json;
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
async fn test_health_endpoint() {
    common::with_api_db_env(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool).await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let client = Client::new();
        let response = client
            .get(format!("http://127.0.0.1:{}/health", port))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
        let body = response.text().await.unwrap();
        assert_eq!(body, "OK");

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_post_evidence_endpoint() {
    common::with_api_db_env(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool.clone()).await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let client = Client::new();

        let evidence_payload = json!({
            "digest_hex": "deadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcdef"
        });
        let response = client
            .post(format!("http://127.0.0.1:{}/evidence", port))
            .json(&evidence_payload)
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
        let result: serde_json::Value = response.json().await.unwrap();
        assert!(result["id"].is_string());

        let job_id = result["id"].as_str().unwrap();
        let row = sqlx::query(
            "SELECT id, status, attempts, created_ms, updated_ms FROM outbox_jobs WHERE id = ?",
        )
        .bind(job_id)
        .fetch_optional(&pool)
        .await
        .unwrap();

        assert!(row.is_some());
        let row = row.unwrap();
        assert_eq!(row.get::<String, _>("id"), job_id);
        assert_eq!(row.get::<String, _>("status"), "queued");
        
        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_post_evidence_with_custom_id() {
    common::with_api_db_env(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool).await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let client = Client::new();

        let evidence_payload = json!({
            "id": "custom-evidence-123",
            "digest_hex": "deadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcdef"
        });
        let response = client
            .post(format!("http://127.0.0.1:{}/evidence", port))
            .json(&evidence_payload)
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
        let result: serde_json::Value = response.json().await.unwrap();
        common::assert_json_response(&result, &[("id", "custom-evidence-123")]);
        
        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_post_evidence_with_metadata() {
    common::with_api_db_env(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool).await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let client = Client::new();

        let evidence_payload = json!({
            "digest_hex": "deadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcdef",
            "payload_mime": "application/json",
            "metadata": {
                "source": "test",
                "priority": "high"
            }
        });

        let response = client
            .post(format!("http://127.0.0.1:{}/evidence", port))
            .json(&evidence_payload)
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
        let result: serde_json::Value = response.json().await.unwrap();
        assert!(result["id"].is_string());
        
        server.abort();
    })
    .await;
}
