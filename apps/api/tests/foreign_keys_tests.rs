mod common;

use phoenix_api::build_app;
use reqwest::Client;
use serde_json::json;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};

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
async fn test_countermeasure_fk_enforced() {
    common::with_api_db_env(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool.clone()).await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;

        let client = Client::new();
        let url = format!("http://127.0.0.1:{}/countermeasures", port);

        let payload = json!({
            "job_id": "missing-job",
            "deployed_by": "tester",
            "countermeasure_type": "rf_jam",
            "effectiveness_score": 0.9,
            "notes": "test insert with missing fk"
        });

        let resp = client.post(&url).json(&payload).send().await.unwrap();

        assert_eq!(resp.status(), 500);

        server.abort();
    })
    .await;
}
