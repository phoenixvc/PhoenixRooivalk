use axum::serve;
use phoenix_api::build_app;
use reqwest::Client;
use serde_json::Value;
use sqlx::Row;
use std::net::TcpListener as StdTcpListener;
use tokio::net::TcpListener;

#[tokio::test]
async fn test_evidence_pagination_clamp() {
    // In-memory DB for reliability
    let db_url = "sqlite::memory:?cache=shared";
    std::env::set_var("API_DB_URL", db_url);

    let (app, pool) = build_app().await.unwrap();

    // Seed more than 100 jobs
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

    // Bind server to a random free port
    let std_listener = StdTcpListener::bind("127.0.0.1:0").unwrap();
    std_listener.set_nonblocking(true).unwrap();
    let addr = std_listener.local_addr().unwrap();
    let port = addr.port();
    let listener = TcpListener::from_std(std_listener).unwrap();

    // Start server
    let server = tokio::spawn(async move {
        serve(listener, app.into_make_service()).await.unwrap();
    });

    let client = Client::new();
    let url = format!("http://127.0.0.1:{}/evidence?per_page=1000&page=1", port);

    let resp = client.get(&url).send().await.unwrap();
    assert!(resp.status().is_success());
    let body: Value = resp.json().await.unwrap();

    // per_page should be clamped to 100
    assert_eq!(body["per_page"].as_i64().unwrap_or(0), 100);

    // data length should be <= 100
    let data = body["data"].as_array().unwrap();
    assert!(data.len() <= 100);

    server.abort();
}
