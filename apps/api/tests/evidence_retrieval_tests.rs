mod common;

use axum::serve;
use phoenix_api::build_app;
use reqwest::Client;
use serde_json::json;
use sqlx::Row;
use std::time::Duration;
use std::net::TcpListener as StdTcpListener;
use tokio::net::TcpListener;

#[tokio::test]
async fn test_get_evidence_endpoint() {
    // Create temp DB - using in-memory database for reliability in tests
    let db_url = "sqlite::memory:";

    common::with_env_var("API_DB_URL", db_url, || async {
        // Build app
        let (app, pool) = build_app().await.unwrap();

        // Bind with std TcpListener first
        let std_listener = StdTcpListener::bind("127.0.0.1:0").unwrap();
        std_listener.set_nonblocking(true).unwrap();
        let port = std_listener.local_addr().unwrap().port();
        
        // Convert to tokio listener
        let listener = TcpListener::from_std(std_listener).unwrap();

        // Start server with the converted listener
        let server = tokio::spawn(async move {
            serve(listener, app.into_make_service()).await.unwrap();
        });

        // Wait for server to start
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Insert a test job directly into the database
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

        // Test getting evidence status
        let response = client
            .get(format!("http://127.0.0.1:{}/evidence/{}", port, job_id))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
        let result: serde_json::Value = response.json().await.unwrap();
        assert_eq!(result["id"], job_id);
        assert_eq!(result["status"], "done");
        assert_eq!(result["attempts"], 1);
        assert_eq!(result["last_error"], "test error");

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_get_evidence_not_found() {
    // Create temp DB - using in-memory database for reliability in tests
    let db_url = "sqlite::memory:";

    common::with_env_var("API_DB_URL", db_url, || async {
        // Build app
        let (app, _pool) = build_app().await.unwrap();

        // Bind with std TcpListener first
        let std_listener = StdTcpListener::bind("127.0.0.1:0").unwrap();
        std_listener.set_nonblocking(true).unwrap();
        let port = std_listener.local_addr().unwrap().port();
        
        // Convert to tokio listener
        let listener = TcpListener::from_std(std_listener).unwrap();

        // Start server with the converted listener
        let server = tokio::spawn(async move {
            serve(listener, app.into_make_service()).await.unwrap();
        });

        // Wait for server to start
        tokio::time::sleep(Duration::from_millis(100)).await;

        let client = Client::new();

        // The ID we're requesting that doesn't exist
        let requested_id = "non-existent";

        // Test getting non-existent evidence
        let response = client
            .get(format!("http://127.0.0.1:{}/evidence/{}", port, requested_id))
            .send()
            .await
            .unwrap();

        // Assert that status is 404 Not Found
            assert_eq!(
            response.status(), 404,
            "Expected status 404 Not Found, got {}",
            response.status()
            );
        
        // Read response body and parse as JSON
        let response_text = response.text().await.unwrap();
        let result: serde_json::Value = serde_json::from_str(&response_text)
            .unwrap_or_else(|_| panic!("Failed to parse response as JSON: {}", response_text));
        
        // Verify JSON structure contains expected fields with correct values
        assert_eq!(
            result["id"].as_str().unwrap_or_default(), requested_id,
            "Expected result[\"id\"] to be {}, got: {}",
            requested_id, result["id"]
            );
        
        assert_eq!(
            result["status"].as_str().unwrap_or_default(), "not_found",
            "Expected result[\"status\"] to be \"not_found\", got: {}",
            result["status"]
        );
        
        // Clean up server after response is fully processed
        server.abort();
    })
    .await;
}