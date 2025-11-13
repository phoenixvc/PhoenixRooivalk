//! # Common Test Utilities
//!
//! This module provides shared utilities for Phoenix API tests.
//!
//! ## Environment Management
//!
//! Use the environment variable helpers to safely set and restore environment variables:
//!
//! ```ignore
//! common::with_env_var("API_DB_URL", "sqlite::memory:?cache=shared", || async {
//!     // Your test code here - API_DB_URL will be set to sqlite::memory:?cache=shared
//!     // and automatically restored afterward
//! }).await;
//!
//! // For common database scenarios:
//! common::with_api_db_env(|| async {
//!     // Test with in-memory API database
//! }).await;
//! ```
//!
//! ## Server Testing
//!
//! For server tests, use these helpers to avoid race conditions and simplify setup:
//!
//! ```ignore
//! // Create a listener on a free port
//! let (listener, port) = common::create_test_listener();
//!
//! // Build your application
//! let app = build_app().await.unwrap();
//!
//! // Spawn the test server
//! let (server, port) = common::spawn_test_server(app, listener).await;
//!
//! // Make requests to your server using the port
//! let client = reqwest::Client::new();
//! let response = client
//!     .get(format!("http://127.0.0.1:{}/health", port))
//!     .send()
//!     .await
//!     .unwrap();
//!
//! // Don't forget to abort the server when done
//! server.abort();
//! ```
//!
//! ## Other Utilities
//!
//! The module also provides utilities for common test operations:
//!
//! ```ignore
//! // Create an in-memory database URL
//! let db_url = common::create_test_db_url();
//!
//! // Assert JSON response properties
//! common::assert_json_response(&result, &[
//!     ("id", job_id),
//!     ("status", "done"),
//!     ("attempts", "1")
//! ]);
//! ```

use axum::{serve, Router};
use once_cell::sync::Lazy;
use std::net::TcpListener as StdTcpListener;
use std::time::Duration;
use tokio::net::TcpListener;
use tokio::sync::Mutex;

// Define a global mutex for environment variable operations
// This prevents race conditions in parallel tests when modifying environment variables
static ENV_MUTEX: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

/// Helper function to set environment variable with automatic restoration
pub async fn with_env_var<F, Fut>(key: &str, value: &str, f: F)
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    // Acquire the mutex to ensure exclusive access to environment variables
    let _guard = ENV_MUTEX.lock().await;

    let original_value = std::env::var(key).ok();
    std::env::set_var(key, value);

    // Execute the provided function while holding the lock
    // This ensures no other test can modify environment variables during execution
    f().await;

    // Restore original value (still holding the lock)
    match original_value {
        Some(val) => std::env::set_var(key, val),
        None => std::env::remove_var(key),
    }
    // Lock is automatically released when _guard goes out of scope
}

/// Creates a Tokio TcpListener bound to an available port on localhost
#[allow(dead_code)]
pub fn create_test_listener() -> (TcpListener, u16) {
    let std_listener = StdTcpListener::bind("127.0.0.1:0").unwrap();
    std_listener.set_nonblocking(true).unwrap();
    let port = std_listener.local_addr().unwrap().port();

    let listener = TcpListener::from_std(std_listener).unwrap();
    (listener, port)
}

/// Spawns a test server using the Axum Router and returns the port it's listening on
#[allow(dead_code)]
pub async fn spawn_test_server(
    app: Router,
    listener: TcpListener,
) -> (tokio::task::JoinHandle<()>, u16) {
    let port = listener.local_addr().unwrap().port();

    let server = tokio::spawn(async move {
        serve(listener, app.into_make_service()).await.unwrap();
    });

    // Wait for server to start
    tokio::time::sleep(Duration::from_millis(100)).await;

    (server, port)
}

/// Creates an in-memory SQLite database string for testing
/// Uses shared cache to ensure multiple connections share the same database
#[allow(dead_code)]
pub fn create_test_db_url() -> String {
    "sqlite::memory:?cache=shared".to_string()
}

/// Utility to assert JSON response properties
#[allow(dead_code)]
pub fn assert_json_response(json: &serde_json::Value, expected_values: &[(&str, &str)]) {
    for (key, expected) in expected_values {
        assert_eq!(
            json[key].as_str().unwrap_or_default(),
            *expected,
            "Expected json[{}] to be {}, but got {}",
            key,
            expected,
            json[key]
        );
    }
}

/// Sets up environment for API database tests with in-memory SQLite
#[allow(dead_code)]
pub async fn with_api_db_env<F, Fut>(f: F)
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    // Use the shared test DB URL for consistency
    let db_url = create_test_db_url();
    with_env_var("API_DB_URL", &db_url, f).await
}
