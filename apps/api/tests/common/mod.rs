//! # Common Test Utilities
//! 
//! This module provides shared utilities for Phoenix API tests.
//!
//! ## Environment Management
//!
//! Use the environment variable helpers to safely set and restore environment variables:
//!
//! ```
//! common::with_env_var("API_DB_URL", "sqlite::memory:", || async {
//!     // Your test code here - API_DB_URL will be set to sqlite::memory:
//!     // and automatically restored afterward
//! }).await;
//!
//! // For common database scenarios:
//! common::with_api_db_env(|| async {
//!     // Test with in-memory API database
//! }).await;
//!
//! common::with_keeper_db_fallback(|| async {
//!     // Test API fallback to keeper database
//! }).await;
//! ```
//!
//! ## Server Testing
//!
//! For server tests, use these helpers to avoid race conditions and simplify setup:
//!
//! ```
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
//! ```
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

use std::net::TcpListener as StdTcpListener;
use tokio::net::TcpListener;
use axum::{serve, Router};
use std::time::Duration;

/// Helper function to set environment variable with automatic restoration
pub async fn with_env_var<F, Fut>(key: &str, value: &str, f: F)
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    println!("Setting environment variable {}={}", key, value);
    let original_value = std::env::var(key).ok();
    std::env::set_var(key, value);
    
    // Verify the variable was actually set
    match std::env::var(key) {
        Ok(current) => {
            println!("Verified {}={}", key, current);
        },
        Err(e) => {
            panic!("Failed to set environment variable {}: {}", key, e);
        }
    }

    f().await;

    // Restore original value
    match original_value {
        Some(val) => {
            println!("Restoring {}={}", key, val);
            std::env::set_var(key, val);
        },
        None => {
            println!("Removing {}", key);
            std::env::remove_var(key);
        }
    }
}

/// Creates a Tokio TcpListener bound to an available port on localhost
pub fn create_test_listener() -> (TcpListener, u16) {
    let std_listener = StdTcpListener::bind("127.0.0.1:0").unwrap();
    std_listener.set_nonblocking(true).unwrap();
    let port = std_listener.local_addr().unwrap().port();
    
    let listener = TcpListener::from_std(std_listener).unwrap();
    (listener, port)
}

/// Spawns a test server using the Axum Router and returns the port it's listening on
pub async fn spawn_test_server(app: Router, listener: TcpListener) -> (tokio::task::JoinHandle<()>, u16) 
{
    let port = listener.local_addr().unwrap().port();
    
    let server = tokio::spawn(async move {
        serve(listener, app.into_make_service()).await.unwrap();
    });

    // Wait for server to start
    tokio::time::sleep(Duration::from_millis(100)).await;
    
    (server, port)
}

/// Creates an in-memory SQLite database string for testing
pub fn create_test_db_url() -> String {
    "sqlite::memory:".to_string()
}

/// Utility to assert JSON response properties
pub fn assert_json_response(json: &serde_json::Value, expected_values: &[(&str, &str)]) {
    for (key, expected) in expected_values {
        assert_eq!(json[key].as_str().unwrap_or_default(), *expected, 
                  "Expected json[{}] to be {}, but got {}", 
                  key, expected, json[key]);
    }
}

/// Sets up environment for API database tests with in-memory SQLite
pub async fn with_api_db_env<F, Fut>(f: F)
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    with_env_var("API_DB_URL", "sqlite::memory:", f).await
}

/// Sets up environment for Keeper database fallback tests
pub async fn with_keeper_db_fallback<F, Fut>(f: F)
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    let original_api_url = std::env::var("API_DB_URL").ok();
    std::env::remove_var("API_DB_URL");
    
    with_env_var("KEEPER_DB_URL", "sqlite::memory:", f).await;
    
    // Restore original API_DB_URL if it existed
    match original_api_url {
        Some(val) => std::env::set_var("API_DB_URL", val),
        None => std::env::remove_var("API_DB_URL"),
    }
}

/// Sets up environment with no database URLs (for default URL testing)
pub async fn with_default_db_env<F, Fut>(f: F)
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    // Save original values
    let original_api_url = std::env::var("API_DB_URL").ok();
    let original_keeper_url = std::env::var("KEEPER_DB_URL").ok();
    
    // Clear environment variables
    std::env::remove_var("API_DB_URL");
    std::env::remove_var("KEEPER_DB_URL");
    
    f().await;
    
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