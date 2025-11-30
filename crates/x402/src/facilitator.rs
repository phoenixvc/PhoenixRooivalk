//! x402 Facilitator client for payment verification

use crate::{PaymentProof, PaymentVerification, X402Config, X402Error};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Client for interacting with x402 facilitator service
#[derive(Debug, Clone)]
pub struct X402Facilitator {
    client: Client,
    config: X402Config,
}

#[derive(Debug, Serialize)]
struct VerifyPaymentRequest {
    signature: String,
    expected_recipient: String,
    expected_memo: String,
    min_amount: String,
    token: String,
}

#[derive(Debug, Deserialize)]
struct FacilitatorResponse {
    valid: bool,
    amount: Option<String>,
    block: Option<u64>,
    confirmed_at: Option<String>,
    error: Option<String>,
}

impl X402Facilitator {
    /// Create a new facilitator client with the given configuration
    pub fn new(config: X402Config) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self { client, config }
    }

    /// Verify a payment proof against the facilitator
    pub async fn verify_payment(
        &self,
        proof: &PaymentProof,
        expected_memo: &str,
        min_amount: &str,
    ) -> Result<PaymentVerification, X402Error> {
        // For devnet/testing, simulate verification
        if self.config.network == "devnet" {
            return self.simulate_verification(proof, expected_memo, min_amount);
        }

        let request = VerifyPaymentRequest {
            signature: proof.signature.clone(),
            expected_recipient: self.config.wallet_address.clone(),
            expected_memo: expected_memo.to_string(),
            min_amount: min_amount.to_string(),
            token: proof.token.clone(),
        };

        let response = self
            .client
            .post(format!("{}/verify", self.config.facilitator_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| X402Error::NetworkError(format!("Facilitator request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(X402Error::NetworkError(format!(
                "Facilitator returned error: {}",
                response.status()
            )));
        }

        let result: FacilitatorResponse = response
            .json()
            .await
            .map_err(|e| X402Error::NetworkError(format!("Failed to parse response: {}", e)))?;

        Ok(PaymentVerification {
            valid: result.valid,
            tx_signature: proof.signature.clone(),
            amount_usdc: result.amount.unwrap_or_else(|| proof.amount.clone()),
            block: result.block,
            confirmed_at: result.confirmed_at,
            error: result.error,
        })
    }

    /// Verify payment directly on Solana (without facilitator)
    pub async fn verify_on_chain(
        &self,
        proof: &PaymentProof,
    ) -> Result<PaymentVerification, X402Error> {
        let request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTransaction",
            "params": [
                proof.signature,
                {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}
            ]
        });

        let response = self
            .client
            .post(&self.config.solana_rpc_url)
            .json(&request)
            .send()
            .await
            .map_err(|e| X402Error::NetworkError(format!("Solana RPC failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(X402Error::NetworkError(format!(
                "Solana RPC error: {}",
                response.status()
            )));
        }

        let rpc_response: serde_json::Value = response
            .json()
            .await
            .map_err(|e| X402Error::NetworkError(format!("Failed to parse RPC response: {}", e)))?;

        // Check if transaction exists and is confirmed
        if let Some(error) = rpc_response.get("error") {
            return Err(X402Error::VerificationFailed(format!(
                "RPC error: {}",
                error
            )));
        }

        let result = rpc_response.get("result");
        if result.is_none() || result.unwrap().is_null() {
            return Ok(PaymentVerification {
                valid: false,
                tx_signature: proof.signature.clone(),
                amount_usdc: proof.amount.clone(),
                block: None,
                confirmed_at: None,
                error: Some("Transaction not found".to_string()),
            });
        }

        let tx = result.unwrap();
        let slot = tx.get("slot").and_then(|s| s.as_u64());
        let block_time = tx.get("blockTime").and_then(|t| t.as_i64());

        // Check if transaction was successful (no error)
        let is_valid = tx
            .get("meta")
            .and_then(|m| m.get("err"))
            .map(|e| e.is_null())
            .unwrap_or(false);

        Ok(PaymentVerification {
            valid: is_valid,
            tx_signature: proof.signature.clone(),
            amount_usdc: proof.amount.clone(),
            block: slot,
            confirmed_at: block_time.map(|t| {
                chrono::DateTime::from_timestamp(t, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            }),
            error: if is_valid {
                None
            } else {
                Some("Transaction failed or not confirmed".to_string())
            },
        })
    }

    /// Simulate payment verification for testing (devnet)
    fn simulate_verification(
        &self,
        proof: &PaymentProof,
        expected_memo: &str,
        min_amount: &str,
    ) -> Result<PaymentVerification, X402Error> {
        // Basic validation for testing
        if proof.memo != expected_memo {
            return Ok(PaymentVerification {
                valid: false,
                tx_signature: proof.signature.clone(),
                amount_usdc: proof.amount.clone(),
                block: None,
                confirmed_at: None,
                error: Some(format!(
                    "Memo mismatch: expected '{}', got '{}'",
                    expected_memo, proof.memo
                )),
            });
        }

        // Parse amounts for comparison
        let proof_amount: f64 = proof.amount.parse().unwrap_or(0.0);
        let min: f64 = min_amount.parse().unwrap_or(0.0);

        if proof_amount < min {
            return Ok(PaymentVerification {
                valid: false,
                tx_signature: proof.signature.clone(),
                amount_usdc: proof.amount.clone(),
                block: None,
                confirmed_at: None,
                error: Some(format!(
                    "Insufficient payment: {} < {}",
                    proof.amount, min_amount
                )),
            });
        }

        // Simulate successful verification
        Ok(PaymentVerification {
            valid: true,
            tx_signature: proof.signature.clone(),
            amount_usdc: proof.amount.clone(),
            block: Some(999999),
            confirmed_at: Some(chrono::Utc::now().to_rfc3339()),
            error: None,
        })
    }

    /// Check if x402 payments are enabled
    pub fn is_enabled(&self) -> bool {
        self.config.enabled
    }

    /// Get the configured wallet address
    pub fn wallet_address(&self) -> &str {
        &self.config.wallet_address
    }

    /// Get the facilitator URL
    pub fn facilitator_url(&self) -> &str {
        &self.config.facilitator_url
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_facilitator_creation() {
        let config = X402Config::devnet("PhxRvk123");
        let facilitator = X402Facilitator::new(config);

        assert!(facilitator.is_enabled());
        assert_eq!(facilitator.wallet_address(), "PhxRvk123");
    }

    #[tokio::test]
    async fn test_simulate_verification_success() {
        let config = X402Config::devnet("PhxRvk123");
        let facilitator = X402Facilitator::new(config);

        let proof = PaymentProof {
            signature: "test-sig-123".to_string(),
            amount: "0.01".to_string(),
            token: "USDC".to_string(),
            sender: "sender123".to_string(),
            memo: "evidence:evt-001".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = facilitator
            .verify_payment(&proof, "evidence:evt-001", "0.01")
            .await
            .unwrap();

        assert!(result.valid);
        assert_eq!(result.tx_signature, "test-sig-123");
    }

    #[tokio::test]
    async fn test_simulate_verification_memo_mismatch() {
        let config = X402Config::devnet("PhxRvk123");
        let facilitator = X402Facilitator::new(config);

        let proof = PaymentProof {
            signature: "test-sig-123".to_string(),
            amount: "0.01".to_string(),
            token: "USDC".to_string(),
            sender: "sender123".to_string(),
            memo: "evidence:wrong-id".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = facilitator
            .verify_payment(&proof, "evidence:evt-001", "0.01")
            .await
            .unwrap();

        assert!(!result.valid);
        assert!(result.error.unwrap().contains("Memo mismatch"));
    }

    #[tokio::test]
    async fn test_simulate_verification_insufficient_payment() {
        let config = X402Config::devnet("PhxRvk123");
        let facilitator = X402Facilitator::new(config);

        let proof = PaymentProof {
            signature: "test-sig-123".to_string(),
            amount: "0.001".to_string(),
            token: "USDC".to_string(),
            sender: "sender123".to_string(),
            memo: "evidence:evt-001".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = facilitator
            .verify_payment(&proof, "evidence:evt-001", "0.01")
            .await
            .unwrap();

        assert!(!result.valid);
        assert!(result.error.unwrap().contains("Insufficient"));
    }
}
