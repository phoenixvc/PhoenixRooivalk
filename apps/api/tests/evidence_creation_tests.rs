mod common;

use phoenix_api::build_app;
use reqwest::Client;
use serde_json::json;
use sqlx::Row;

#[tokio::test]
async fn test_health_endpoint() {
    // Use specialized helper for API database environment setup
    common::with_api_db_env(|| async {
        // Build app
        let (app, _pool) = build_app().await.unwrap();

        // Use helpers for test listener creation and server setup
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
    // Use specialized helper for API database environment setup
    common::with_api_db_env(|| async {
        // Build app
        let (app, pool) = build_app().await.unwrap();

        // Use helpers for test listener creation and server setup
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let client = Client::new();

        // Test evidence submission
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

        // Verify job was created in database
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
        assert_eq!(row.get::<i64, _>("attempts"), 0);

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_post_evidence_with_custom_id() {
    // Use specialized helper for API database environment setup
    common::with_api_db_env(|| async {
        // Build app
        let (app, _pool) = build_app().await.unwrap();

        // Use helpers for test listener creation and server setup
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let client = Client::new();

        // Test evidence submission with custom ID
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

        // Use helper for JSON response validation
        common::assert_json_response(
            &result,
            &[("id", "custom-evidence-123"), ("status", "queued")],
        );

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_post_evidence_with_metadata() {
    // Use specialized helper for API database environment setup
    common::with_api_db_env(|| async {
        // Build app
        let (app, _pool) = build_app().await.unwrap();

        // Use helpers for test listener creation and server setup
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let client = Client::new();

        // Test evidence submission with metadata
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

        // Use helper for JSON response validation
        common::assert_json_response(&result, &[("status", "queued")]);

        server.abort();
    })
    .await;
}
