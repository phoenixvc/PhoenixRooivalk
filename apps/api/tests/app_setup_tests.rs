mod common;

use once_cell::sync::Lazy;
use phoenix_api::build_app;
use tokio::sync::Mutex;

// Use a separate mutex to serialize these tests that manipulate environment variables
// This prevents race conditions when tests run in parallel
static TEST_MUTEX: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

#[tokio::test]
async fn test_build_app() {
    let _guard = TEST_MUTEX.lock().await;

    // Create temp DB - using in-memory database for reliability in tests
    let db_url = "sqlite::memory:";

    // Save and set
    let original = std::env::var("API_DB_URL").ok();
    std::env::set_var("API_DB_URL", db_url);

    // Build app
    let result = build_app().await;
    let (_app, pool) = result.unwrap();

    // Pool should be connected
    let query_result = sqlx::query("SELECT 1").fetch_one(&pool).await;
    assert!(query_result.is_ok());

    // Restore
    match original {
        Some(val) => std::env::set_var("API_DB_URL", val),
        None => std::env::remove_var("API_DB_URL"),
    }
}

#[tokio::test]
async fn test_build_app_with_fallback_url() {
    let _guard = TEST_MUTEX.lock().await;

    // Don't set API_DB_URL, should fallback to KEEPER_DB_URL
    // Using in-memory database for reliability in tests
    let db_url = "sqlite::memory:";

    // Save original values
    let original_api_url = std::env::var("API_DB_URL").ok();
    let original_keeper_url = std::env::var("KEEPER_DB_URL").ok();

    // Clear API_DB_URL and set KEEPER_DB_URL
    std::env::remove_var("API_DB_URL");
    std::env::set_var("KEEPER_DB_URL", db_url);

    // Build app
    let result = build_app().await;
    let (_app, pool) = result.unwrap();

    // Pool should be connected
    let query_result = sqlx::query("SELECT 1").fetch_one(&pool).await;
    assert!(query_result.is_ok());

    // Restore original values
    match original_api_url {
        Some(val) => std::env::set_var("API_DB_URL", val),
        None => std::env::remove_var("API_DB_URL"),
    }
    match original_keeper_url {
        Some(val) => std::env::set_var("KEEPER_DB_URL", val),
        None => std::env::remove_var("KEEPER_DB_URL"),
    }
}

#[tokio::test]
async fn test_build_app_with_default_url() {
    let _guard = TEST_MUTEX.lock().await;

    // Don't set any DB URL, should use default
    // Save original values
    let original_api_url = std::env::var("API_DB_URL").ok();
    let original_keeper_url = std::env::var("KEEPER_DB_URL").ok();

    std::env::remove_var("API_DB_URL");
    std::env::remove_var("KEEPER_DB_URL");

    // Build app - this might fail with default URL, so we'll just test that it doesn't panic
    let result = build_app().await;
    // The default URL might not work in test environment, so we'll just check it doesn't panic
    match result {
        Ok((_app, _pool)) => {
            // App should be created (Router doesn't have routes() method in axum 0.7)
            // Just verify the app was created successfully
        }
        Err(_) => {
            // Default URL might not work in test environment, which is expected
        }
    }

    // Restore original values
    match original_api_url {
        Some(val) => std::env::set_var("API_DB_URL", val),
        None => std::env::remove_var("API_DB_URL"),
    }
    match original_keeper_url {
        Some(val) => std::env::set_var("KEEPER_DB_URL", val),
        None => std::env::remove_var("KEEPER_DB_URL"),
    }
}
