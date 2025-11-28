//! Axum middleware helpers for x402 payment processing

use crate::{PaymentDetails, PaymentProof, PriceTier, X402Error};

/// Header name for x402 payment proof
pub const X_PAYMENT_HEADER: &str = "X-PAYMENT";

/// Extract payment proof from request headers
pub fn extract_payment_proof(
    headers: &axum::http::HeaderMap,
) -> Result<Option<PaymentProof>, X402Error> {
    match headers.get(X_PAYMENT_HEADER) {
        Some(value) => {
            let header_str = value
                .to_str()
                .map_err(|_| X402Error::InvalidProof("Invalid header encoding".to_string()))?;
            Ok(Some(PaymentProof::from_header(header_str)?))
        }
        None => Ok(None),
    }
}

/// Create a 402 Payment Required response
pub fn payment_required_response(
    evidence_id: &str,
    tier: PriceTier,
    wallet_address: &str,
    facilitator_url: &str,
) -> (axum::http::StatusCode, axum::Json<PaymentDetails>) {
    let details = PaymentDetails::for_evidence(evidence_id, tier, wallet_address, facilitator_url);
    (axum::http::StatusCode::PAYMENT_REQUIRED, axum::Json(details))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderMap;

    #[test]
    fn test_extract_no_payment() {
        let headers = HeaderMap::new();
        let result = extract_payment_proof(&headers).unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_extract_valid_payment() {
        let proof = PaymentProof {
            signature: "sig123".to_string(),
            amount: "0.01".to_string(),
            token: "USDC".to_string(),
            sender: "sender".to_string(),
            memo: "test".to_string(),
            timestamp: "2025-01-01T00:00:00Z".to_string(),
        };

        let encoded = proof.to_header().unwrap();

        let mut headers = HeaderMap::new();
        headers.insert(
            axum::http::HeaderName::from_static("x-payment"),
            encoded.parse().unwrap(),
        );

        let result = extract_payment_proof(&headers).unwrap();
        assert!(result.is_some());

        let extracted = result.unwrap();
        assert_eq!(extracted.signature, "sig123");
        assert_eq!(extracted.amount, "0.01");
    }
}
