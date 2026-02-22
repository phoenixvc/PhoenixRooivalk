use async_trait::async_trait;
use chrono::Utc;
use phoenix_evidence::anchor::{AnchorError, AnchorProvider};
use phoenix_evidence::model::{ChainTxRef, EvidenceRecord};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::Duration;

#[derive(Clone)]
pub struct SolanaProviderStub;

#[async_trait]
impl AnchorProvider for SolanaProviderStub {
    async fn anchor(&self, evidence: &EvidenceRecord) -> Result<ChainTxRef, AnchorError> {
        Ok(ChainTxRef {
            network: "solana".to_string(),
            chain: "devnet".to_string(),
            tx_id: format!("fake:{}", &evidence.digest.hex),
            confirmed: false,
            timestamp: Some(Utc::now()),
        })
    }

    async fn confirm(&self, tx: &ChainTxRef) -> Result<ChainTxRef, AnchorError> {
        let mut t = tx.clone();
        t.confirmed = true;
        Ok(t)
    }
}

#[derive(Debug, Clone)]
pub struct SolanaProvider {
    pub client: Client,
    pub endpoint: String,
    pub network: String,
}

#[derive(Debug, Serialize)]
pub struct SolanaRpcRequest {
    pub jsonrpc: String,
    pub id: u64,
    pub method: String,
    pub params: Value,
}

#[derive(Debug, Deserialize)]
pub struct SolanaRpcResponse {
    #[allow(dead_code)]
    pub jsonrpc: String,
    #[allow(dead_code)]
    pub id: u64,
    pub result: Option<Value>,
    pub error: Option<SolanaRpcError>,
}

#[derive(Debug, Deserialize)]
pub struct SolanaRpcError {
    pub code: i32,
    pub message: String,
    #[allow(dead_code)]
    pub data: Option<Value>,
}

#[derive(Debug, Deserialize)]
struct TransactionStatus {
    slot: u64,
    #[allow(dead_code)]
    confirmations: Option<u64>,
    err: Option<Value>,
    confirmation_status: Option<String>,
}

impl SolanaProvider {
    pub fn new(endpoint: String, network: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            endpoint,
            network,
        }
    }

    async fn rpc_call(&self, method: &str, params: Value) -> Result<Value, AnchorError> {
        let request = SolanaRpcRequest {
            jsonrpc: "2.0".to_string(),
            id: 1,
            method: method.to_string(),
            params,
        };

        let response = self
            .client
            .post(&self.endpoint)
            .json(&request)
            .send()
            .await
            .map_err(|e| AnchorError::Network(format!("HTTP request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AnchorError::Network(format!(
                "HTTP error: {}",
                response.status()
            )));
        }

        let rpc_response: SolanaRpcResponse = response
            .json()
            .await
            .map_err(|e| AnchorError::Network(format!("Failed to parse JSON: {}", e)))?;

        if let Some(error) = rpc_response.error {
            return Err(AnchorError::Provider(format!(
                "RPC error {}: {}",
                error.code, error.message
            )));
        }

        rpc_response
            .result
            .ok_or_else(|| AnchorError::Provider("RPC response missing result field".to_string()))
    }

    async fn send_memo_transaction(&self, memo_data: &str) -> Result<String, AnchorError> {
        // Create a memo transaction
        // In a real implementation, you'd create and sign a proper Solana transaction
        // For now, return a deterministic fake signature
        // sha256_hex already returns a hex string, so we use it directly as the signature
        let signature = phoenix_evidence::hash::sha256_hex(memo_data.as_bytes());

        tracing::info!(
            signature = %signature,
            memo_data = %memo_data,
            "Anchored evidence to Solana (simulated)"
        );

        Ok(signature)
    }

    async fn get_signature_status(
        &self,
        signature: &str,
    ) -> Result<Option<TransactionStatus>, AnchorError> {
        let result = self
            .rpc_call(
                "getSignatureStatuses",
                json!([[signature], {"searchTransactionHistory": true}]),
            )
            .await?;

        let statuses = result
            .get("value")
            .and_then(|v| v.as_array())
            .ok_or_else(|| AnchorError::Provider("Invalid response format".to_string()))?;

        if statuses.is_empty() {
            return Ok(None);
        }

        let status_value = &statuses[0];
        if status_value.is_null() {
            return Ok(None);
        }

        let status: TransactionStatus = serde_json::from_value(status_value.clone())
            .map_err(|e| AnchorError::Provider(format!("Failed to parse status: {}", e)))?;

        Ok(Some(status))
    }
}

#[async_trait]
impl AnchorProvider for SolanaProvider {
    async fn anchor(&self, evidence: &EvidenceRecord) -> Result<ChainTxRef, AnchorError> {
        // Create memo with evidence digest
        let memo = format!("evidence:{}", evidence.digest.hex);

        let signature = self.send_memo_transaction(&memo).await?;

        Ok(ChainTxRef {
            network: "solana".to_string(),
            chain: self.network.clone(),
            tx_id: signature,
            confirmed: false,
            timestamp: Some(Utc::now()),
        })
    }

    async fn confirm(&self, tx: &ChainTxRef) -> Result<ChainTxRef, AnchorError> {
        let status = self.get_signature_status(&tx.tx_id).await?;

        let mut confirmed_tx = tx.clone();

        if let Some(status) = status {
            // Transaction is confirmed if it has no error and is finalized
            let is_confirmed =
                status.err.is_none() && status.confirmation_status.as_deref() == Some("finalized");

            confirmed_tx.confirmed = is_confirmed;
            if is_confirmed {
                tracing::info!(
                    signature = %tx.tx_id,
                    slot = %status.slot,
                    "Transaction confirmed on Solana"
                );
            }
        }

        Ok(confirmed_tx)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use phoenix_evidence::model::{DigestAlgo, EvidenceDigest};
    use serde_json::json;

    // ------------------------------------------------------------------
    // Helper: build a minimal EvidenceRecord for use in multiple tests.
    // ------------------------------------------------------------------
    fn make_evidence(hex: &str) -> EvidenceRecord {
        EvidenceRecord {
            id: "unit-test-id".to_string(),
            created_at: Utc::now(),
            digest: EvidenceDigest {
                algo: DigestAlgo::Sha256,
                hex: hex.to_string(),
            },
            payload_mime: Some("application/json".to_string()),
            metadata: json!({"source": "unit-test"}),
        }
    }

    // ------------------------------------------------------------------
    // 1. SolanaProviderStub::anchor — correct network/chain/tx_id format
    // ------------------------------------------------------------------
    #[tokio::test]
    async fn stub_anchor_returns_correct_network_chain_and_tx_id_format() {
        let stub = SolanaProviderStub;
        let evidence = make_evidence("cafe0011deadbeef");

        let result = stub.anchor(&evidence).await;
        assert!(result.is_ok(), "stub anchor must not fail");

        let tx = result.unwrap();
        assert_eq!(tx.network, "solana");
        assert_eq!(tx.chain, "devnet");
        // tx_id must be "fake:" followed by the digest hex verbatim
        assert_eq!(tx.tx_id, format!("fake:{}", evidence.digest.hex));
        // newly anchored tx starts as unconfirmed
        assert!(!tx.confirmed);
        // timestamp must be populated
        assert!(tx.timestamp.is_some());
    }

    // ------------------------------------------------------------------
    // 2. SolanaProviderStub::confirm — flips `confirmed` to true
    // ------------------------------------------------------------------
    #[tokio::test]
    async fn stub_confirm_flips_confirmed_flag() {
        let stub = SolanaProviderStub;

        let unconfirmed = ChainTxRef {
            network: "solana".to_string(),
            chain: "devnet".to_string(),
            tx_id: "fake:cafe0011deadbeef".to_string(),
            confirmed: false,
            timestamp: Some(Utc::now()),
        };

        let result = stub.confirm(&unconfirmed).await;
        assert!(result.is_ok(), "stub confirm must not fail");

        let confirmed = result.unwrap();
        // The flag must have flipped
        assert!(confirmed.confirmed);
        // All other fields must be preserved unchanged
        assert_eq!(confirmed.network, unconfirmed.network);
        assert_eq!(confirmed.chain, unconfirmed.chain);
        assert_eq!(confirmed.tx_id, unconfirmed.tx_id);
        assert_eq!(confirmed.timestamp, unconfirmed.timestamp);
    }

    // ------------------------------------------------------------------
    // 3. SolanaProvider::new — sets endpoint and network fields correctly
    // ------------------------------------------------------------------
    #[test]
    fn provider_new_sets_endpoint_and_network() {
        let endpoint = "https://api.devnet.solana.com".to_string();
        let network = "devnet".to_string();

        let provider = SolanaProvider::new(endpoint.clone(), network.clone());

        assert_eq!(provider.endpoint, endpoint);
        assert_eq!(provider.network, network);
    }

    #[test]
    fn provider_new_accepts_mainnet_beta() {
        let provider = SolanaProvider::new(
            "https://api.mainnet-beta.solana.com".to_string(),
            "mainnet-beta".to_string(),
        );

        assert_eq!(provider.network, "mainnet-beta");
        assert_eq!(provider.endpoint, "https://api.mainnet-beta.solana.com");
    }

    // ------------------------------------------------------------------
    // 4. SolanaRpcRequest serialization — verify JSON output structure
    // ------------------------------------------------------------------
    #[test]
    fn rpc_request_serializes_all_fields() {
        let request = SolanaRpcRequest {
            jsonrpc: "2.0".to_string(),
            id: 42,
            method: "getTransaction".to_string(),
            params: json!(["some-signature", {"encoding": "json"}]),
        };

        let serialized = serde_json::to_string(&request).expect("serialization must succeed");
        let parsed: Value = serde_json::from_str(&serialized).expect("must parse back to JSON");

        assert_eq!(parsed["jsonrpc"], "2.0");
        assert_eq!(parsed["id"], 42);
        assert_eq!(parsed["method"], "getTransaction");
        assert!(parsed["params"].is_array());
        assert_eq!(parsed["params"][1]["encoding"], "json");
    }

    #[test]
    fn rpc_request_serializes_null_params() {
        let request = SolanaRpcRequest {
            jsonrpc: "2.0".to_string(),
            id: 1,
            method: "getHealth".to_string(),
            params: Value::Null,
        };

        let serialized = serde_json::to_string(&request).expect("serialization must succeed");
        let parsed: Value = serde_json::from_str(&serialized).expect("must parse back to JSON");

        assert_eq!(parsed["method"], "getHealth");
        assert!(parsed["params"].is_null());
    }

    // ------------------------------------------------------------------
    // 5. SolanaRpcResponse deserialization — result variant and error variant
    // ------------------------------------------------------------------
    #[test]
    fn rpc_response_deserializes_result_variant() {
        let json_str = r#"{
            "jsonrpc": "2.0",
            "id": 7,
            "result": {"slot": 1234, "confirmations": 10}
        }"#;

        let response: SolanaRpcResponse =
            serde_json::from_str(json_str).expect("deserialization must succeed");

        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.id, 7);
        assert!(response.result.is_some());
        assert!(response.error.is_none());

        let result = response.result.unwrap();
        assert_eq!(result["slot"], 1234);
        assert_eq!(result["confirmations"], 10);
    }

    #[test]
    fn rpc_response_deserializes_error_variant() {
        let json_str = r#"{
            "jsonrpc": "2.0",
            "id": 3,
            "error": {
                "code": -32602,
                "message": "Invalid params",
                "data": null
            }
        }"#;

        let response: SolanaRpcResponse =
            serde_json::from_str(json_str).expect("deserialization must succeed");

        assert_eq!(response.id, 3);
        assert!(response.result.is_none());
        assert!(response.error.is_some());

        let err = response.error.unwrap();
        assert_eq!(err.code, -32602);
        assert_eq!(err.message, "Invalid params");
    }

    #[test]
    fn rpc_response_result_and_error_can_both_be_absent() {
        // Some JSON-RPC implementations omit both fields on certain error paths.
        let json_str = r#"{"jsonrpc": "2.0", "id": 0}"#;

        let response: SolanaRpcResponse =
            serde_json::from_str(json_str).expect("deserialization must succeed");

        assert!(response.result.is_none());
        assert!(response.error.is_none());
    }

    // ------------------------------------------------------------------
    // 6. SolanaRpcError deserialization — error code and message
    // ------------------------------------------------------------------
    #[test]
    fn rpc_error_deserializes_code_and_message() {
        let json_str = r#"{"code": -32601, "message": "Method not found"}"#;

        let error: SolanaRpcError =
            serde_json::from_str(json_str).expect("deserialization must succeed");

        assert_eq!(error.code, -32601);
        assert_eq!(error.message, "Method not found");
        assert!(error.data.is_none());
    }

    #[test]
    fn rpc_error_deserializes_with_data_field() {
        let json_str =
            r#"{"code": -32000, "message": "Server error", "data": {"logs": ["error log"]}}"#;

        let error: SolanaRpcError =
            serde_json::from_str(json_str).expect("deserialization must succeed");

        assert_eq!(error.code, -32000);
        assert_eq!(error.message, "Server error");
        assert!(error.data.is_some());
        assert_eq!(error.data.unwrap()["logs"][0], "error log");
    }

    #[test]
    fn rpc_error_accepts_positive_codes() {
        // Non-standard positive error codes should also deserialize correctly.
        let json_str = r#"{"code": 429, "message": "Too Many Requests"}"#;

        let error: SolanaRpcError =
            serde_json::from_str(json_str).expect("deserialization must succeed");

        assert_eq!(error.code, 429);
        assert_eq!(error.message, "Too Many Requests");
    }
}
