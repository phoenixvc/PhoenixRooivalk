//! Integration tests for x402 premium evidence verification endpoints

mod common;

use reqwest::StatusCode;
use serde_json::{json, Value};
use tokio::task::JoinHandle;

/// Test context that properly cleans up resources when dropped
struct TestContext {
    base_url: String,
    server: JoinHandle<()>,
    env_vars: Vec<String>,
}

impl TestContext {
    /// Create a new test context with a running server
    async fn new() -> Self {
        Self::with_x402(false, None).await
    }

    /// Create a test context with x402 enabled
    async fn with_x402(enabled: bool, wallet: Option<&str>) -> Self {
        let mut env_vars = Vec::new();

        // Set database URL for tests
        std::env::set_var("API_DB_URL", common::create_test_db_url());
        env_vars.push("API_DB_URL".to_string());

        if enabled {
            std::env::set_var("X402_ENABLED", "true");
            env_vars.push("X402_ENABLED".to_string());

            if let Some(addr) = wallet {
                std::env::set_var("X402_WALLET_ADDRESS", addr);
                env_vars.push("X402_WALLET_ADDRESS".to_string());
            }

            std::env::set_var("SOLANA_NETWORK", "devnet");
            env_vars.push("SOLANA_NETWORK".to_string());
        }

        let (listener, port) = common::create_test_listener();
        let (app, _pool) = phoenix_api::build_app().await.expect("Failed to build app");
        let (server, _) = common::spawn_test_server(app, listener).await;

        Self {
            base_url: format!("http://127.0.0.1:{}", port),
            server,
            env_vars,
        }
    }

    fn url(&self, path: &str) -> String {
        format!("{}{}", self.base_url, path)
    }
}

impl Drop for TestContext {
    fn drop(&mut self) {
        // Abort the server to free resources
        self.server.abort();

        // Clean up environment variables
        for var in &self.env_vars {
            std::env::remove_var(var);
        }
    }
}

/// Test that x402 status endpoint returns disabled when not configured
#[tokio::test]
async fn test_x402_status_not_configured() {
    let ctx = TestContext::new().await;

    let client = reqwest::Client::new();
    let response = client
        .get(ctx.url("/api/v1/x402/status"))
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
    let ctx = TestContext::new().await;

    let client = reqwest::Client::new();
    let response = client
        .post(ctx.url("/api/v1/evidence/verify-premium"))
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
    let ctx = TestContext::with_x402(true, Some("PhxRvkTestWallet123")).await;

    let client = reqwest::Client::new();

    // Step 1: Request without payment should return 402
    let response = client
        .post(ctx.url("/api/v1/evidence/verify-premium"))
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
}

/// Test x402 status endpoint shows correct configuration when enabled
#[tokio::test]
async fn test_x402_status_configured() {
    let ctx = TestContext::with_x402(true, Some("PhxRvkTestWallet456")).await;

    let client = reqwest::Client::new();
    let response = client
        .get(ctx.url("/api/v1/x402/status"))
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
}

/// Test different price tiers in 402 response
#[tokio::test]
async fn test_x402_price_tiers() {
    let ctx = TestContext::with_x402(true, Some("PhxRvkTestWallet789")).await;
    let client = reqwest::Client::new();

    // Test basic tier
    let response = client
        .post(ctx.url("/api/v1/evidence/verify-premium"))
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
        .post(ctx.url("/api/v1/evidence/verify-premium"))
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
        .post(ctx.url("/api/v1/evidence/verify-premium"))
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
}
