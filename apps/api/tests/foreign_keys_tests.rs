use axum::serve;
use phoenix_api::build_app;
use reqwest::Client;
use serde_json::json;
use std::net::TcpListener as StdTcpListener;
use tokio::net::TcpListener;

#[tokio::test]
async fn test_countermeasure_fk_enforced() {
    // Use in-memory DB
    let db_url = "sqlite::memory:?cache=shared";
    std::env::set_var("API_DB_URL", db_url);

    let (app, _pool) = build_app().await.unwrap();

    // Start server
    let std_listener = StdTcpListener::bind("127.0.0.1:0").unwrap();
    std_listener.set_nonblocking(true).unwrap();
    let addr = std_listener.local_addr().unwrap();
    let port = addr.port();
    let listener = TcpListener::from_std(std_listener).unwrap();

    let server = tokio::spawn(async move {
        serve(listener, app.into_make_service()).await.unwrap();
    });

    let client = Client::new();
    let url = format!("http://127.0.0.1:{}/countermeasures", port);

    // Post a countermeasure referencing a non-existent job_id
    let payload = json!({
        "job_id": "missing-job",
        "deployed_by": "tester",
        "countermeasure_type": "rf_jam",
        "effectiveness_score": 0.9,
        "notes": "test insert with missing fk"
    });

    let resp = client.post(&url).json(&payload).send().await.unwrap();

    // Should fail with 500 due to FK enforcement
    assert_eq!(resp.status(), 500);

    server.abort();
}
