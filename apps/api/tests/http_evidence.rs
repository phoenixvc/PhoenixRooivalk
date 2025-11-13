mod common;

use anchor_etherlink::EtherlinkProviderStub;
use phoenix_api::build_app;
use phoenix_keeper::{run_job_loop, SqliteJobProvider};
use reqwest::Client;
use serde_json::json;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite, Row};
use std::time::Duration;
use tempfile::NamedTempFile;
use tokio::time::timeout;

async fn setup_pool(db_url: &str) -> Pool<Sqlite> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5) // Allow more connections for this test
        .connect(db_url)
        .await
        .unwrap();
    // Run migrations
    let migration_manager = phoenix_api::migrations::MigrationManager::new(pool.clone());
    migration_manager.migrate().await.unwrap();
    pool
}

#[tokio::test]
async fn test_http_evidence_flow() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = format!("sqlite://{}", db_path);

    common::with_env_var("API_DB_URL", &db_url, || async {
        common::with_env_var("KEEPER_DB_URL", &db_url, || async {
            let pool = setup_pool(&db_url).await;
            let app = build_app(pool.clone()).await.unwrap();

            let (listener, port) = common::create_test_listener();
            let (server, _) = common::spawn_test_server(app, listener).await;

            let keeper_pool = pool.clone();
            let keeper = tokio::spawn(async move {
                let mut jp = SqliteJobProvider::new(keeper_pool);
                let anchor = EtherlinkProviderStub;
                run_job_loop(&mut jp, &anchor, Duration::from_millis(100)).await;
            });

            let client = Client::new();
            let base_url = format!("http://127.0.0.1:{}", port);

            let mut last_err = None;
            let server_ready = timeout(Duration::from_secs(5), async {
                loop {
                    match client.get(format!("{}/health", base_url)).send().await {
                        Ok(resp) if resp.status().is_success() => break,
                        Ok(resp) => last_err = Some(format!("Server returned status: {}", resp.status())),
                        Err(e) => last_err = Some(format!("Connection error: {}", e)),
                    }
                    tokio::time::sleep(Duration::from_millis(100)).await;
                }
            })
            .await;

            if let Err(elapsed) = server_ready {
                panic!("Server failed to start within timeout period: {}. Last error: {:?}", elapsed, last_err);
            }

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

            common::assert_json_response(&result, &[("status", "done"), ("id", job_id)]);

            let tx_ref_exists =
                sqlx::query("SELECT COUNT(*) as count FROM outbox_tx_refs WHERE job_id = ?1")
                    .bind(job_id)
                    .fetch_one(&pool)
                    .await
                    .unwrap();
            let count: i64 = tx_ref_exists.get("count");
            assert_eq!(count, 1, "Should have exactly one tx ref for the job");

            server.abort();
            keeper.abort();
        }).await;
    }).await;
}
