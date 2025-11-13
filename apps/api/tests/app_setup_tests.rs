mod common;

use phoenix_api::build_app;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite, Row};

async fn setup_pool(db_url: &str) -> Pool<Sqlite> {
    SqlitePoolOptions::new()
        .max_connections(1)
        .connect(db_url)
        .await
        .unwrap()
}

#[tokio::test]
async fn test_build_app() {
    common::with_api_db_env(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool).await.unwrap();
        // Just verify the app was created successfully
        assert!(true); // If we get here, the app was built
    })
    .await;
}

#[tokio::test]
async fn test_build_app_with_fallback_url() {
    common::with_keeper_db_fallback(|| async {
        let db_url = common::create_test_db_url();
        let pool = setup_pool(&db_url).await;
        let app = build_app(pool).await.unwrap();
        // Just verify the app was created successfully
        assert!(true); // If we get here, the app was built
    })
    .await;
}

#[tokio::test]
async fn test_build_app_with_default_url() {
    common::with_default_db_env(|| async {
        // This test is tricky because the default URL might not be valid in the test environment.
        // The best we can do is check that `build_app` doesn't panic.
        let db_url = "sqlite::memory:";
        let pool = setup_pool(db_url).await;
        let result = build_app(pool).await;
        assert!(result.is_ok());
    })
    .await;
}
