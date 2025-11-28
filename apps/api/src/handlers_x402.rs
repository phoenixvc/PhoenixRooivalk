//! x402 Payment Protocol handlers for premium evidence verification
//!
//! This module implements HTTP 402 "Payment Required" endpoints for
//! monetizing evidence verification API access.

use crate::{
    db::{create_payment_receipt, get_evidence_by_id, is_payment_signature_used},
    db_errors::is_unique_constraint_violation,
    AppState,
};
use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use phoenix_x402::{
    middleware::extract_payment_proof, PaymentDetails, PaymentProof, PaymentVerification,
    PriceTier, VerifyEvidenceRequest, VerifyEvidenceResponse, X402Config, X402Facilitator,
};
use serde_json::json;
use sha2::{Digest, Sha256};

/// State extension for x402 configuration
#[derive(Clone)]
pub struct X402State {
    pub facilitator: X402Facilitator,
    pub config: X402Config,
}

impl X402State {
    /// Create x402 state from environment configuration
    pub fn from_env() -> Option<Self> {
        match X402Config::from_env() {
            Ok(config) if config.enabled => {
                let facilitator = X402Facilitator::new(config.clone());
                Some(Self {
                    facilitator,
                    config,
                })
            }
            Ok(_) => {
                tracing::info!("x402 payments disabled");
                None
            }
            Err(e) => {
                tracing::warn!("x402 config error: {}", e);
                None
            }
        }
    }

    /// Create x402 state for devnet testing
    pub fn devnet(wallet_address: &str) -> Self {
        let config = X402Config::devnet(wallet_address);
        let facilitator = X402Facilitator::new(config.clone());
        Self {
            facilitator,
            config,
        }
    }
}

/// Premium evidence verification endpoint with x402 payment
///
/// POST /api/v1/evidence/verify-premium
///
/// # Security
///
/// This endpoint is **machine-to-machine (M2M) only** and is protected against CSRF
/// attacks through the following mechanisms:
///
/// - **Bearer token authentication required**: All requests must include a valid
///   `Authorization: Bearer <token>` header. Cookie-based authentication is not
///   accepted, preventing browser-originated CSRF attacks.
/// - **Strict CORS policy**: The API should be configured to reject cross-origin
///   requests or only allow trusted origins via infrastructure.
/// - **Browser origin detection**: Requests with browser-specific headers like
///   `Cookie` or `Sec-Fetch-*` without proper Bearer auth will be rejected.
///
/// # Infrastructure Requirements
///
/// Operators must configure edge proxies/load balancers to:
/// - Set and normalize X-Forwarded-For/X-Real-IP headers
/// - Strip client-supplied values of these headers before forwarding
/// - Enforce strict CORS policies at the infrastructure level
///
/// Without X-PAYMENT header: Returns 402 Payment Required with payment details
/// With X-PAYMENT header: Verifies payment and returns premium evidence verification
pub async fn verify_evidence_premium(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<VerifyEvidenceRequest>,
) -> Response {
    // Enforce machine-to-machine access only - reject browser-originated requests
    // without proper API authentication to prevent CSRF attacks
    if let Err(response) = enforce_m2m_access(&headers) {
        return response;
    }

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip_from_headers(&headers);

    // Check rate limit for premium verification endpoint
    if let Err(response) = state.rate_limiter.check_verify(&client_ip) {
        return response;
    }

    // Get x402 configuration from AppState (initialized once at startup)
    let x402_state = match &state.x402 {
        Some(s) => s.clone(),
        None => {
            // x402 not configured - return 503 Service Unavailable
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "error": "Premium verification service not configured",
                    "hint": "Set X402_ENABLED=true and X402_WALLET_ADDRESS to enable"
                })),
            )
                .into_response();
        }
    };

    // Check for X-PAYMENT header
    match extract_payment_proof(&headers) {
        Ok(Some(proof)) => {
            // Payment provided - verify and process
            handle_paid_verification(state, x402_state, req, proof).await
        }
        Ok(None) => {
            // No payment - return 402 with payment details
            create_payment_required_response(&req.evidence_id, req.tier, &x402_state)
        }
        Err(e) => {
            // Invalid payment proof format
            (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "Invalid payment proof",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// Create 402 Payment Required response
fn create_payment_required_response(
    evidence_id: &str,
    tier: PriceTier,
    x402_state: &X402State,
) -> Response {
    let details = PaymentDetails::for_evidence(
        evidence_id,
        tier,
        &x402_state.config.wallet_address,
        &x402_state.config.facilitator_url,
    );

    // Add custom headers for x402 protocol
    let mut response = Json(details).into_response();
    *response.status_mut() = StatusCode::PAYMENT_REQUIRED;

    response
}

/// Handle verification request with valid payment
async fn handle_paid_verification(
    state: AppState,
    x402_state: X402State,
    req: VerifyEvidenceRequest,
    proof: PaymentProof,
) -> Response {
    // Check for payment replay attack
    match is_payment_signature_used(&state.pool, &proof.signature).await {
        Ok(true) => {
            return (
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "Payment already used",
                    "tx_signature": proof.signature,
                    "hint": "This payment signature has already been redeemed"
                })),
            )
                .into_response();
        }
        Ok(false) => {} // Payment not used yet, continue
        Err(e) => {
            tracing::error!("Failed to check payment signature: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "Failed to verify payment uniqueness",
                    "details": e.to_string()
                })),
            )
                .into_response();
        }
    }

    let expected_memo = format!("evidence:{}", req.evidence_id);
    let min_amount = req.tier.price_usdc();

    // Verify payment with facilitator
    let verification = match x402_state
        .facilitator
        .verify_payment(&proof, &expected_memo, min_amount)
        .await
    {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::BAD_GATEWAY,
                Json(json!({
                    "error": "Payment verification failed",
                    "details": e.to_string()
                })),
            )
                .into_response();
        }
    };

    if !verification.valid {
        // Payment verification failed - return 402 with details
        let mut response = Json(json!({
            "error": "Payment verification failed",
            "verification": verification,
            "payment_details": PaymentDetails::for_evidence(
                &req.evidence_id,
                req.tier,
                &x402_state.config.wallet_address,
                &x402_state.config.facilitator_url,
            )
        }))
        .into_response();
        *response.status_mut() = StatusCode::PAYMENT_REQUIRED;
        return response;
    }

    // Store payment receipt for audit trail and replay protection
    // Uses UNIQUE constraint on tx_signature to prevent race conditions
    let tier_str = format!("{:?}", req.tier).to_lowercase();
    match create_payment_receipt(
        &state.pool,
        &req.evidence_id,
        &proof.signature,
        &verification.amount_usdc,
        &tier_str,
        Some(&proof.sender),
    )
    .await
    {
        Ok(_) => {
            // Receipt stored successfully, payment is unique
        }
        Err(e) => {
            // Check if this is a UNIQUE constraint violation (payment replay)
            // Uses database-agnostic helper for portable detection across backends
            let is_replay = match &e {
                sqlx::Error::Database(db_err) => {
                    is_unique_constraint_violation(db_err.as_ref())
                }
                _ => false,
            };

            if is_replay {
                return (
                    StatusCode::CONFLICT,
                    Json(json!({
                        "error": "Payment already used",
                        "tx_signature": proof.signature,
                        "hint": "This payment signature has already been redeemed"
                    })),
                )
                    .into_response();
            }
            // Any other DB error is fatal - do not proceed without audit trail
            tracing::error!("Failed to store payment receipt: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "Failed to record payment receipt",
                    "details": "Database error during payment processing"
                })),
            )
                .into_response();
        }
    }

    // Payment verified and receipt stored - perform premium evidence verification
    perform_premium_verification(state, req, verification).await
}

/// Perform the actual premium evidence verification
async fn perform_premium_verification(
    state: AppState,
    req: VerifyEvidenceRequest,
    payment: PaymentVerification,
) -> Response {
    // Check if legal attestation is enabled (gated behind feature flag)
    // Until proper HSM/cryptographic signing is implemented, legal attestation
    // is only available in preview mode with explicit warning
    let legal_attestation_enabled =
        std::env::var("X402_LEGAL_ATTESTATION_ENABLED").unwrap_or_default() == "true";

    if req.tier == PriceTier::LegalAttestation && !legal_attestation_enabled {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "Legal attestation tier is not yet available",
                "message": "Court-admissible legal attestation requires HSM-backed cryptographic signing infrastructure which is currently in development.",
                "available_tiers": ["basic", "multi_chain", "bulk"],
                "payment": {
                    "verified": true,
                    "tx_signature": payment.tx_signature,
                    "refund_eligible": true,
                    "hint": "Payment will be refunded. Please retry with a different tier."
                }
            })),
        )
            .into_response();
    }

    // Get evidence from database
    let evidence = match get_evidence_by_id(&state.pool, &req.evidence_id).await {
        Ok(Some(e)) => e,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({
                    "error": "Evidence not found",
                    "evidence_id": req.evidence_id,
                    "payment": {
                        "verified": true,
                        "tx_signature": payment.tx_signature,
                        "refund_eligible": true
                    }
                })),
            )
                .into_response();
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "Database error",
                    "details": e.to_string()
                })),
            )
                .into_response();
        }
    };

    // Build chain confirmations based on tier
    let chain_confirmations = build_chain_confirmations(&evidence, &req);

    // Build attestation for legal tier (only when explicitly enabled in preview mode)
    let attestation = if req.tier == PriceTier::LegalAttestation && legal_attestation_enabled {
        // In preview mode, generate a placeholder attestation with clear warning
        // TODO: Replace with HSM-backed Ed25519 or ECDSA signature when available
        let attestation_data = format!(
            "{}:{}:{}",
            evidence.id,
            evidence.digest_hex,
            chrono::Utc::now().timestamp()
        );
        let mut hasher = Sha256::new();
        hasher.update(attestation_data.as_bytes());
        let preview_signature = format!("PREVIEW:sha256:{}", hex::encode(hasher.finalize()));

        Some(phoenix_x402::AttestationInfo {
            signed_by: "PhoenixRooivalk Evidence Authority (PREVIEW MODE)".to_string(),
            signature: preview_signature,
            valid_until: (chrono::Utc::now() + chrono::Duration::days(365)).to_rfc3339(),
        })
    } else {
        None
    };

    let response = VerifyEvidenceResponse {
        verified: true,
        evidence_id: evidence.id.clone(),
        chain_confirmations,
        digest: phoenix_x402::EvidenceDigestInfo {
            algo: "sha256".to_string(),
            hex: evidence.digest_hex.clone(),
        },
        attestation,
    };

    (
        StatusCode::OK,
        Json(json!({
            "verification": response,
            "payment": {
                "verified": true,
                "tx_signature": payment.tx_signature,
                "amount_usdc": payment.amount_usdc,
                "block": payment.block
            }
        })),
    )
        .into_response()
}

/// Build chain confirmation details based on evidence and tier
fn build_chain_confirmations(
    evidence: &crate::models::EvidenceOut,
    req: &VerifyEvidenceRequest,
) -> serde_json::Value {
    let chain = req.chain.as_deref().unwrap_or("solana");

    match req.tier {
        PriceTier::MultiChain | PriceTier::LegalAttestation => {
            // Multi-chain verification
            json!({
                "solana": {
                    "tx_id": format!("pending:{}", evidence.id),
                    "confirmed": evidence.status == "done",
                    "network": "devnet"
                },
                "etherlink": {
                    "tx_id": format!("pending:{}", evidence.id),
                    "confirmed": evidence.status == "done",
                    "network": "testnet"
                }
            })
        }
        _ => {
            // Single-chain verification
            json!({
                chain: {
                    "tx_id": format!("pending:{}", evidence.id),
                    "confirmed": evidence.status == "done",
                    "network": "devnet"
                }
            })
        }
    }
}

/// Enforce machine-to-machine (M2M) access only
///
/// This function validates that requests originate from authorized API clients
/// rather than browser contexts, protecting against CSRF attacks.
///
/// # Security
///
/// The x402 premium verification endpoint is designed for M2M communication
/// between authorized services and clients. This function enforces this by:
///
/// 1. **Requiring Bearer token authentication**: Requests must include a valid
///    `Authorization: Bearer <token>` header. This prevents browser-based CSRF
///    attacks since browsers cannot automatically include custom headers.
///
/// 2. **Rejecting browser-originated requests**: Requests containing browser-specific
///    indicators (e.g., Cookie headers without proper Bearer auth, or Sec-Fetch-*
///    headers indicating browser navigation) are rejected.
///
/// # Returns
///
/// - `Ok(())` if the request is from a valid M2M client
/// - `Err(Response)` with 403 Forbidden if the request appears to be browser-originated
///
/// # Infrastructure Requirements
///
/// This validation works in conjunction with infrastructure-level controls:
/// - CORS policies should reject unauthorized origins at the edge
/// - API gateways should validate Bearer tokens before forwarding requests
#[allow(clippy::result_large_err)]
fn enforce_m2m_access(headers: &HeaderMap) -> Result<(), Response> {
    // Check for Authorization header - required for M2M access
    let has_bearer_auth = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .map(|auth| auth.to_lowercase().starts_with("bearer "))
        .unwrap_or(false);

    // Check for browser-specific indicators that suggest this is not a M2M request
    let has_cookie = headers.contains_key("cookie");
    let has_sec_fetch = headers
        .keys()
        .any(|k| k.as_str().to_lowercase().starts_with("sec-fetch"));

    // If we have Bearer auth, allow the request (proper M2M access)
    if has_bearer_auth {
        return Ok(());
    }

    // If there's no Bearer auth but there are browser indicators, reject
    if has_cookie || has_sec_fetch {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({
                "error": "Browser access not permitted",
                "message": "This endpoint is for machine-to-machine (M2M) API access only. Browser-originated requests must use the standard web interface.",
                "hint": "Include an Authorization: Bearer <token> header for API access"
            })),
        )
            .into_response());
    }

    // No Bearer auth and no browser indicators - could be a simple API client
    // Require Bearer auth anyway for security
    Err((
        StatusCode::FORBIDDEN,
        Json(json!({
            "error": "Authentication required",
            "message": "This endpoint requires Bearer token authentication for machine-to-machine access",
            "hint": "Include an Authorization: Bearer <token> header with a valid API token"
        })),
    )
        .into_response())
}

/// Helper to extract client IP from headers
///
/// Checks X-Forwarded-For and X-Real-IP headers for proxied requests.
/// Falls back to "unknown" if no IP can be determined.
///
/// # Security Warning
///
/// **This function trusts the X-Forwarded-For and X-Real-IP headers, which can be
/// spoofed by untrusted clients.** For secure rate limiting and IP-based controls:
///
/// - **Required deployment configuration**: Upstream proxies (load balancers, CDN,
///   API gateways) MUST strip or normalize client-supplied X-Forwarded-For and
///   X-Real-IP headers at the edge before forwarding requests.
/// - The first hop in X-Forwarded-For is trusted as the client IP; all subsequent
///   hops are expected to be added by trusted infrastructure.
/// - If no trusted proxy is configured, malicious clients can bypass rate limiting
///   by forging these headers.
///
/// See `apps/docs/docs/operations/deployment/deployment-guide.md` for infrastructure
/// configuration requirements and header normalization guidance.
fn extract_client_ip_from_headers(headers: &HeaderMap) -> String {
    // Check X-Forwarded-For header first (standard for proxies)
    if let Some(forwarded) = headers.get("x-forwarded-for") {
        if let Ok(forwarded_str) = forwarded.to_str() {
            // Take the first IP in the chain (original client)
            if let Some(first_ip) = forwarded_str.split(',').next() {
                return first_ip.trim().to_string();
            }
        }
    }

    // Check X-Real-IP header (nginx default)
    if let Some(real_ip) = headers.get("x-real-ip") {
        if let Ok(ip_str) = real_ip.to_str() {
            return ip_str.trim().to_string();
        }
    }

    // Fallback for direct connections or unknown proxies
    "unknown".to_string()
}

/// Get x402 payment status and configuration
///
/// GET /api/v1/x402/status
pub async fn x402_status(State(state): State<AppState>, headers: HeaderMap) -> Response {
    // Extract client IP for rate limiting
    let client_ip = extract_client_ip_from_headers(&headers);

    // Check rate limit for status endpoint
    if let Err(response) = state.rate_limiter.check_status(&client_ip) {
        return response;
    }
    match &state.x402 {
        Some(x402) => (
            StatusCode::OK,
            Json(json!({
                "enabled": true,
                "network": x402.config.network,
                "wallet_address": x402.config.wallet_address,
                "facilitator_url": x402.config.facilitator_url,
                "supported_tokens": ["USDC", "USDT", "SOL"],
                "price_tiers": {
                    "basic": {
                        "price": PriceTier::Basic.price_usdc(),
                        "currency": "USDC",
                        "description": PriceTier::Basic.description()
                    },
                    "multi_chain": {
                        "price": PriceTier::MultiChain.price_usdc(),
                        "currency": "USDC",
                        "description": PriceTier::MultiChain.description()
                    },
                    "legal_attestation": {
                        "price": PriceTier::LegalAttestation.price_usdc(),
                        "currency": "USDC",
                        "description": PriceTier::LegalAttestation.description()
                    },
                    "bulk": {
                        "price": PriceTier::Bulk.price_usdc(),
                        "currency": "USDC",
                        "description": PriceTier::Bulk.description()
                    }
                }
            })),
        )
            .into_response(),
        None => (
            StatusCode::OK,
            Json(json!({
                "enabled": false,
                "message": "x402 payments not configured"
            })),
        )
            .into_response(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_x402_state_devnet() {
        let state = X402State::devnet("PhxRvk123");
        assert!(state.facilitator.is_enabled());
        assert_eq!(state.config.wallet_address, "PhxRvk123");
        assert_eq!(state.config.network, "devnet");
    }

    #[test]
    fn test_price_tier_descriptions() {
        assert!(!PriceTier::Basic.description().is_empty());
        assert!(!PriceTier::MultiChain.description().is_empty());
        assert!(!PriceTier::LegalAttestation.description().is_empty());
        assert!(!PriceTier::Bulk.description().is_empty());
    }
}
