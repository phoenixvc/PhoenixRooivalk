//! Integration tests for x402 premium evidence verification endpoints

mod common;

use reqwest::StatusCode;
use serde_json::{json, Value};

/// Helper to set up a test server and return the base URL
async fn setup_test_app() -> String {
    // Use in-memory database for tests
    std::env::set_var("API_DB_URL", common::create_test_db_url());

    let (listener, port) = common::create_test_listener();
    let (app, _pool) = phoenix_api::build_app().await.expect("Failed to build app");
    let (server, _) = common::spawn_test_server(app, listener).await;

    // Leak the server handle so it stays running for the duration of the test
    std::mem::forget(server);

    format!("http://127.0.0.1:{}", port)
}

/// Test that x402 status endpoint returns disabled when not configured
#[tokio::test]
async fn test_x402_status_not_configured() {
    let base_url = setup_test_app().await;

    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/api/v1/x402/status", base_url))
        .send()
        .await
        .expect("Failed to send request");

    assert_eq!(response.status(), StatusCode::OK);

    let body: Value = response.json().await.expect("Failed to parse JSON");
    assert_eq!(body["enabled"], false);
}

/// Test that premium verification returns 503 when x402 is not configured
#[tokio::test]
async fn test_verify_premium_not_configured() {
    let base_url = setup_test_app().await;

    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/api/v1/evidence/verify-premium", base_url))
        .json(&json!({
            "evidence_id": "test-evidence-001",
            "tier": "basic"
        }))
        .send()
        .await
        .expect("Failed to send request");

    assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

    let body: Value = response.json().await.expect("Failed to parse JSON");
    assert!(body["error"]
        .as_str()
        .unwrap()
        .contains("not configured"));
}

/// Test x402 payment flow simulation (with environment configured)
#[tokio::test]
async fn test_x402_payment_flow_simulation() {
    // Set up environment for x402
    std::env::set_var("X402_ENABLED", "true");
    std::env::set_var("X402_WALLET_ADDRESS", "PhxRvkTestWallet123");
    std::env::set_var("SOLANA_NETWORK", "devnet");

    let base_url = setup_test_app().await;

    let client = reqwest::Client::new();

    // Step 1: Request without payment should return 402
    let response = client
        .post(format!("{}/api/v1/evidence/verify-premium", base_url))
        .json(&json!({
            "evidence_id": "test-evidence-002",
            "tier": "basic"
        }))
        .send()
        .await
        .expect("Failed to send request");

    assert_eq!(response.status(), StatusCode::PAYMENT_REQUIRED);

    let body: Value = response.json().await.expect("Failed to parse JSON");
    assert_eq!(body["price"], "0.01");
    assert_eq!(body["currency"], "USDC");
    assert_eq!(body["recipient"], "PhxRvkTestWallet123");
    assert!(body["memo"]
        .as_str()
        .unwrap()
        .contains("evidence:test-evidence-002"));

    // Clean up environment
    std::env::remove_var("X402_ENABLED");
    std::env::remove_var("X402_WALLET_ADDRESS");
    std::env::remove_var("SOLANA_NETWORK");
}

/// Test x402 status endpoint shows correct configuration when enabled
#[tokio::test]
async fn test_x402_status_configured() {
    // Set up environment for x402
    std::env::set_var("X402_ENABLED", "true");
    std::env::set_var("X402_WALLET_ADDRESS", "PhxRvkTestWallet456");
    std::env::set_var("SOLANA_NETWORK", "devnet");

    let base_url = setup_test_app().await;

    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/api/v1/x402/status", base_url))
        .send()
        .await
        .expect("Failed to send request");

    assert_eq!(response.status(), StatusCode::OK);

    let body: Value = response.json().await.expect("Failed to parse JSON");
    assert_eq!(body["enabled"], true);
    assert_eq!(body["network"], "devnet");
    assert_eq!(body["wallet_address"], "PhxRvkTestWallet456");

    // Check price tiers are present
    assert!(body["price_tiers"]["basic"]["price"].is_string());
    assert!(body["price_tiers"]["multi_chain"]["price"].is_string());
    assert!(body["price_tiers"]["legal_attestation"]["price"].is_string());

    // Clean up environment
    std::env::remove_var("X402_ENABLED");
    std::env::remove_var("X402_WALLET_ADDRESS");
    std::env::remove_var("SOLANA_NETWORK");
}

/// Test different price tiers in 402 response
#[tokio::test]
async fn test_x402_price_tiers() {
    std::env::set_var("X402_ENABLED", "true");
    std::env::set_var("X402_WALLET_ADDRESS", "PhxRvkTestWallet789");
    std::env::set_var("SOLANA_NETWORK", "devnet");

    let base_url = setup_test_app().await;
    let client = reqwest::Client::new();

    // Test basic tier
    let response = client
        .post(format!("{}/api/v1/evidence/verify-premium", base_url))
        .json(&json!({
            "evidence_id": "test-001",
            "tier": "basic"
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::PAYMENT_REQUIRED);
    let body: Value = response.json().await.unwrap();
    assert_eq!(body["price"], "0.01");

    // Test multi_chain tier
    let response = client
        .post(format!("{}/api/v1/evidence/verify-premium", base_url))
        .json(&json!({
            "evidence_id": "test-002",
            "tier": "multi_chain"
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::PAYMENT_REQUIRED);
    let body: Value = response.json().await.unwrap();
    assert_eq!(body["price"], "0.05");

    // Test legal_attestation tier
    let response = client
        .post(format!("{}/api/v1/evidence/verify-premium", base_url))
        .json(&json!({
            "evidence_id": "test-003",
            "tier": "legal_attestation"
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::PAYMENT_REQUIRED);
    let body: Value = response.json().await.unwrap();
    assert_eq!(body["price"], "1.00");

    // Clean up
    std::env::remove_var("X402_ENABLED");
    std::env::remove_var("X402_WALLET_ADDRESS");
    std::env::remove_var("SOLANA_NETWORK");
}
