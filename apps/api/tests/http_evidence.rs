use anchor_etherlink::EtherlinkProviderStub;
use axum::serve;
use phoenix_api::build_app;
use phoenix_keeper::{run_job_loop, SqliteJobProvider};
use reqwest::Client;
use serde_json::json;
use sqlx::Row;
use std::net::TcpListener;
use std::time::Duration;
use tempfile::NamedTempFile;
use tokio::net::TcpListener as TokioTcpListener;
use tokio::time::timeout;

#[tokio::test]
async fn test_http_evidence_flow() {
    // Create temp DB
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = format!("sqlite://{}", db_path);

    // Set env for API and keeper to use same DB
    std::env::set_var("API_DB_URL", &db_url);
    std::env::set_var("KEEPER_DB_URL", &db_url);

    // Build API app
    let (app, pool) = build_app().await.unwrap();

    // Find available port
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap();
    let port = addr.port();
    drop(listener);

    // Start API server
    let server = tokio::spawn(async move {
        let listener = TokioTcpListener::bind(addr).await.unwrap();
        serve(listener, app.into_make_service()).await.unwrap();
    });

    // Start keeper
    let keeper_pool = pool.clone();
    let keeper = tokio::spawn(async move {
        let mut jp = SqliteJobProvider::new(keeper_pool);
        let anchor = EtherlinkProviderStub;
        run_job_loop(&mut jp, &anchor, Duration::from_millis(100)).await;
    });

    let client = Client::new();
    let base_url = format!("http://127.0.0.1:{}", port);

    // Wait for server to start with retry loop instead of fixed sleep
    let mut last_err = None;
    let server_ready = timeout(Duration::from_secs(5), async {
        loop {
            match client.get(format!("{}/health", base_url)).send().await {
                Ok(resp) if resp.status().is_success() => {
                    // Server is ready, break out of the loop instead of returning Ok(())
                    break;
                }
                Ok(resp) => {
                    // Got a response but not 200
                    last_err = Some(format!("Server returned status: {}", resp.status()));
                }
                Err(e) => {
                    // Connection failed
                    last_err = Some(format!("Connection error: {}", e));
                }
            }

            // Short backoff before retry
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    })
    .await;

    // Check if we hit the timeout and failed to connect
    if let Err(elapsed) = server_ready {
        panic!(
            "Server failed to start within timeout period: {}. Last error: {:?}",
            elapsed, last_err
        );
    }

    // Submit evidence
    let evidence_payload = json!({
        "digest_hex": "deadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcdef"
    });

    let submit_resp = client
        .post(format!("{}/evidence", base_url))
        .json(&evidence_payload)
        .send()
        .await
        .unwrap();

    assert_eq!(submit_resp.status(), 200);
    let submit_json: serde_json::Value = submit_resp.json().await.unwrap();
    let job_id = submit_json["id"].as_str().unwrap();

    // Poll until job is done (with timeout)
    let result = timeout(Duration::from_secs(10), async {
        loop {
            let status_resp = client
                .get(format!("{}/evidence/{}", base_url, job_id))
                .send()
                .await
                .unwrap();

            let status_json: serde_json::Value = status_resp.json().await.unwrap();
            let status = status_json["status"].as_str().unwrap();

            if status == "done" {
                break status_json;
            } else if status == "failed" {
                panic!("Job failed: {:?}", status_json);
            }

            tokio::time::sleep(Duration::from_millis(200)).await;
        }
    })
    .await
    .expect("Job should complete within timeout");

    // Verify job completed successfully
    assert_eq!(result["status"], "done");
    assert_eq!(result["id"], job_id);

    // Verify tx ref was created in DB
    let tx_ref_exists =
        sqlx::query("SELECT COUNT(*) as count FROM outbox_tx_refs WHERE job_id = ?1")
            .bind(job_id)
            .fetch_one(&pool)
            .await
            .unwrap();

    let count: i64 = tx_ref_exists.get("count");
    assert_eq!(count, 1, "Should have exactly one tx ref for the job");

    // Cleanup
    server.abort();
    keeper.abort();
}
