//! Core types for x402 payment protocol

use serde::{Deserialize, Serialize};

/// Supported price tiers for evidence verification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PriceTier {
    /// Basic single-chain verification ($0.01 USDC)
    Basic,
    /// Multi-chain verification across Solana + EtherLink ($0.05 USDC)
    MultiChain,
    /// Court-admissible legal attestation ($1.00 USDC)
    LegalAttestation,
    /// Bulk verification rate ($0.005 USDC per verification)
    Bulk,
}

impl PriceTier {
    /// Get the price in USDC as a string (for precision)
    pub fn price_usdc(&self) -> &'static str {
        match self {
            PriceTier::Basic => "0.01",
            PriceTier::MultiChain => "0.05",
            PriceTier::LegalAttestation => "1.00",
            PriceTier::Bulk => "0.005",
        }
    }

    /// Get a human-readable description of this tier
    pub fn description(&self) -> &'static str {
        match self {
            PriceTier::Basic => "Single-chain evidence verification",
            PriceTier::MultiChain => "Multi-chain verification (Solana + EtherLink)",
            PriceTier::LegalAttestation => "Court-admissible legal attestation",
            PriceTier::Bulk => "Bulk verification (100+ records)",
        }
    }
}

impl Default for PriceTier {
    fn default() -> Self {
        PriceTier::Basic
    }
}

/// Payment details returned in a 402 response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentDetails {
    /// Price amount (as string for precision)
    pub price: String,

    /// Currency (e.g., "USDC", "USDT", "SOL")
    pub currency: String,

    /// Recipient wallet address (Solana)
    pub recipient: String,

    /// Memo to include in payment for correlation
    pub memo: String,

    /// x402 facilitator endpoint URL
    pub facilitator: String,

    /// List of supported tokens for payment
    pub supported_tokens: Vec<String>,

    /// Payment expiration timestamp (ISO 8601)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,

    /// Price tier for this request
    pub tier: PriceTier,
}

impl PaymentDetails {
    /// Create payment details for a specific evidence verification
    pub fn for_evidence(
        evidence_id: &str,
        tier: PriceTier,
        recipient: &str,
        facilitator: &str,
    ) -> Self {
        Self {
            price: tier.price_usdc().to_string(),
            currency: "USDC".to_string(),
            recipient: recipient.to_string(),
            memo: format!("evidence:{}", evidence_id),
            facilitator: facilitator.to_string(),
            supported_tokens: vec!["USDC".to_string(), "USDT".to_string(), "SOL".to_string()],
            expires_at: None,
            tier,
        }
    }
}

/// Payment proof submitted by the client in the X-PAYMENT header
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentProof {
    /// Solana transaction signature
    pub signature: String,

    /// Payment amount
    pub amount: String,

    /// Token used for payment
    pub token: String,

    /// Sender wallet address
    pub sender: String,

    /// Memo from the transaction
    pub memo: String,

    /// Timestamp of the payment
    pub timestamp: String,
}

impl PaymentProof {
    /// Decode a payment proof from base64-encoded X-PAYMENT header
    pub fn from_header(header_value: &str) -> Result<Self, crate::X402Error> {
        let decoded =
            base64::Engine::decode(&base64::engine::general_purpose::STANDARD, header_value)
                .map_err(|e| {
                    crate::X402Error::InvalidProof(format!("base64 decode error: {}", e))
                })?;

        let json_str = String::from_utf8(decoded)
            .map_err(|e| crate::X402Error::InvalidProof(format!("UTF-8 decode error: {}", e)))?;

        serde_json::from_str(&json_str)
            .map_err(|e| crate::X402Error::InvalidProof(format!("JSON parse error: {}", e)))
    }

    /// Encode this payment proof for the X-PAYMENT header
    pub fn to_header(&self) -> Result<String, crate::X402Error> {
        let json = serde_json::to_string(self)
            .map_err(|e| crate::X402Error::InvalidProof(format!("JSON encode error: {}", e)))?;

        Ok(base64::Engine::encode(
            &base64::engine::general_purpose::STANDARD,
            json.as_bytes(),
        ))
    }
}

/// Result of payment verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentVerification {
    /// Whether the payment is valid
    pub valid: bool,

    /// Transaction signature on Solana
    pub tx_signature: String,

    /// Amount paid in USDC
    pub amount_usdc: String,

    /// Block height of the transaction
    pub block: Option<u64>,

    /// Confirmation timestamp
    pub confirmed_at: Option<String>,

    /// Error message if verification failed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Request to verify evidence with premium features
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyEvidenceRequest {
    /// Evidence ID to verify
    pub evidence_id: String,

    /// Specific chain to verify (optional, defaults to primary)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chain: Option<String>,

    /// Requested price tier
    #[serde(default)]
    pub tier: PriceTier,
}

/// Response from premium evidence verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyEvidenceResponse {
    /// Whether the evidence was verified
    pub verified: bool,

    /// Evidence ID
    pub evidence_id: String,

    /// Chain confirmations
    pub chain_confirmations: serde_json::Value,

    /// Evidence digest
    pub digest: EvidenceDigestInfo,

    /// Attestation details (for legal tier)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attestation: Option<AttestationInfo>,
}

/// Evidence digest information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvidenceDigestInfo {
    /// Hash algorithm used
    pub algo: String,

    /// Hex-encoded digest
    pub hex: String,
}

/// Legal attestation information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttestationInfo {
    /// Entity that signed the attestation
    pub signed_by: String,

    /// Digital signature
    pub signature: String,

    /// Attestation expiration
    pub valid_until: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_price_tier_prices() {
        assert_eq!(PriceTier::Basic.price_usdc(), "0.01");
        assert_eq!(PriceTier::MultiChain.price_usdc(), "0.05");
        assert_eq!(PriceTier::LegalAttestation.price_usdc(), "1.00");
        assert_eq!(PriceTier::Bulk.price_usdc(), "0.005");
    }

    #[test]
    fn test_payment_details_for_evidence() {
        let details = PaymentDetails::for_evidence(
            "evt-2025-001",
            PriceTier::Basic,
            "PhxRvk123ABC",
            "https://x402.org/facilitator",
        );

        assert_eq!(details.price, "0.01");
        assert_eq!(details.currency, "USDC");
        assert_eq!(details.memo, "evidence:evt-2025-001");
        assert_eq!(details.recipient, "PhxRvk123ABC");
        assert!(details.supported_tokens.contains(&"USDC".to_string()));
    }

    #[test]
    fn test_payment_proof_roundtrip() {
        let proof = PaymentProof {
            signature: "5xKj789abc".to_string(),
            amount: "0.01".to_string(),
            token: "USDC".to_string(),
            sender: "sender123".to_string(),
            memo: "evidence:evt-001".to_string(),
            timestamp: "2025-11-28T10:00:00Z".to_string(),
        };

        let header = proof.to_header().unwrap();
        let decoded = PaymentProof::from_header(&header).unwrap();

        assert_eq!(decoded.signature, proof.signature);
        assert_eq!(decoded.amount, proof.amount);
        assert_eq!(decoded.memo, proof.memo);
    }
}
