//! Integration tests for the phoenix-x402 crate.
//!
//! These tests exercise the public API surface in ways that complement the
//! inline unit tests already present in each source module.

use axum::http::{HeaderMap, HeaderName, StatusCode};
use phoenix_x402::*;

// ---------------------------------------------------------------------------
// Error type tests
// ---------------------------------------------------------------------------

/// Every variant of X402Error is exercised against both predicate methods so
/// that a future change to the match arms is caught immediately.
#[test]
fn error_is_payment_required_true_variants() {
    let cases: &[X402Error] = &[
        X402Error::PaymentRequired("no header".to_string()),
        X402Error::InsufficientPayment {
            expected: "0.01".to_string(),
            received: "0.001".to_string(),
        },
        X402Error::PaymentExpired("2024-01-01T00:00:00Z".to_string()),
    ];

    for err in cases {
        assert!(
            err.is_payment_required(),
            "{:?} should report is_payment_required() == true",
            err
        );
        assert!(
            !err.is_client_error(),
            "{:?} should report is_client_error() == false",
            err
        );
    }
}

#[test]
fn error_is_client_error_true_variants() {
    let cases: &[X402Error] = &[
        X402Error::InvalidProof("bad base64".to_string()),
        X402Error::UnsupportedToken("XYZ".to_string()),
    ];

    for err in cases {
        assert!(
            err.is_client_error(),
            "{:?} should report is_client_error() == true",
            err
        );
        assert!(
            !err.is_payment_required(),
            "{:?} should report is_payment_required() == false",
            err
        );
    }
}

/// Variants that are neither payment-required nor client errors.
#[test]
fn error_neutral_variants_both_false() {
    let cases: &[X402Error] = &[
        X402Error::VerificationFailed("rpc timeout".to_string()),
        X402Error::NetworkError("connection refused".to_string()),
        X402Error::ConfigError("X402_WALLET_ADDRESS not set".to_string()),
    ];

    for err in cases {
        assert!(
            !err.is_payment_required(),
            "{:?} should not be payment_required",
            err
        );
        assert!(
            !err.is_client_error(),
            "{:?} should not be client_error",
            err
        );
    }
}

// ---------------------------------------------------------------------------
// PriceTier exhaustive tests
// ---------------------------------------------------------------------------

/// Every tier must have a non-empty description.
#[test]
fn price_tier_all_have_descriptions() {
    let tiers = [
        PriceTier::Basic,
        PriceTier::MultiChain,
        PriceTier::LegalAttestation,
        PriceTier::Bulk,
    ];

    for tier in tiers {
        let desc = tier.description();
        assert!(
            !desc.is_empty(),
            "{:?} has an empty description",
            tier
        );
    }
}

/// Price ordering: Bulk < Basic < MultiChain < LegalAttestation.
#[test]
fn price_tier_ordering_bulk_lt_basic_lt_multi_lt_legal() {
    // Parse prices as f64 for comparison.
    let price = |tier: PriceTier| -> f64 {
        tier.price_usdc()
            .parse()
            .expect("price_usdc() must be a valid decimal string")
    };

    let bulk = price(PriceTier::Bulk);
    let basic = price(PriceTier::Basic);
    let multi = price(PriceTier::MultiChain);
    let legal = price(PriceTier::LegalAttestation);

    assert!(
        bulk < basic,
        "Bulk ({}) must be cheaper than Basic ({})",
        bulk,
        basic
    );
    assert!(
        basic < multi,
        "Basic ({}) must be cheaper than MultiChain ({})",
        basic,
        multi
    );
    assert!(
        multi < legal,
        "MultiChain ({}) must be cheaper than LegalAttestation ({})",
        multi,
        legal
    );
}

// ---------------------------------------------------------------------------
// PaymentDetails construction
// ---------------------------------------------------------------------------

#[test]
fn payment_details_for_evidence_basic_tier() {
    let details = PaymentDetails::for_evidence(
        "evt-basic-001",
        PriceTier::Basic,
        "Wallet111",
        "https://x402.org/facilitator",
    );

    assert_eq!(details.price, "0.01");
    assert_eq!(details.currency, "USDC");
    assert_eq!(details.tier, PriceTier::Basic);
    assert_eq!(details.memo, "evidence:evt-basic-001");
    assert_eq!(details.recipient, "Wallet111");
    assert_eq!(details.facilitator, "https://x402.org/facilitator");
    assert!(details.supported_tokens.contains(&"USDC".to_string()));
    assert!(details.supported_tokens.contains(&"USDT".to_string()));
    assert!(details.supported_tokens.contains(&"SOL".to_string()));
    assert!(details.expires_at.is_none());
}

#[test]
fn payment_details_for_evidence_multi_chain_tier() {
    let details = PaymentDetails::for_evidence(
        "evt-multi-002",
        PriceTier::MultiChain,
        "WalletMulti",
        "https://facilitator.example",
    );

    assert_eq!(details.price, "0.05");
    assert_eq!(details.tier, PriceTier::MultiChain);
    assert_eq!(details.memo, "evidence:evt-multi-002");
}

#[test]
fn payment_details_for_evidence_legal_tier() {
    let details = PaymentDetails::for_evidence(
        "evt-legal-003",
        PriceTier::LegalAttestation,
        "WalletLegal",
        "https://facilitator.example",
    );

    assert_eq!(details.price, "1.00");
    assert_eq!(details.tier, PriceTier::LegalAttestation);
}

#[test]
fn payment_details_for_evidence_bulk_tier() {
    let details = PaymentDetails::for_evidence(
        "evt-bulk-999",
        PriceTier::Bulk,
        "WalletBulk",
        "https://facilitator.example",
    );

    assert_eq!(details.price, "0.005");
    assert_eq!(details.tier, PriceTier::Bulk);
}

// ---------------------------------------------------------------------------
// PaymentProof encoding edge cases
// ---------------------------------------------------------------------------

fn make_proof(signature: &str, amount: &str, memo: &str) -> PaymentProof {
    PaymentProof {
        signature: signature.to_string(),
        amount: amount.to_string(),
        token: "USDC".to_string(),
        sender: "sender-wallet".to_string(),
        memo: memo.to_string(),
        timestamp: "2025-11-28T10:00:00Z".to_string(),
    }
}

#[test]
fn payment_proof_roundtrip_empty_strings() {
    let proof = make_proof("", "", "");
    let encoded = proof.to_header().unwrap();
    let decoded = PaymentProof::from_header(&encoded).unwrap();

    assert_eq!(decoded.signature, "");
    assert_eq!(decoded.amount, "");
    assert_eq!(decoded.memo, "");
}

#[test]
fn payment_proof_roundtrip_special_characters() {
    // Memo with colons, slashes, unicode — all must survive the base64/JSON round-trip.
    let proof = make_proof(
        "sig/with+special=chars",
        "0.01",
        "evidence:evt-2025/drone\u{1F680}",
    );

    let encoded = proof.to_header().unwrap();
    let decoded = PaymentProof::from_header(&encoded).unwrap();

    assert_eq!(decoded.signature, "sig/with+special=chars");
    assert_eq!(decoded.memo, "evidence:evt-2025/drone\u{1F680}");
}

#[test]
fn payment_proof_roundtrip_large_payload() {
    // Signature that is 10 KiB of repeated 'a' — tests no size limit in encoding.
    let large_sig = "a".repeat(10_240);
    let proof = make_proof(&large_sig, "0.005", "evidence:bulk-batch");

    let encoded = proof.to_header().unwrap();
    let decoded = PaymentProof::from_header(&encoded).unwrap();

    assert_eq!(decoded.signature, large_sig);
    assert_eq!(decoded.memo, "evidence:bulk-batch");
}

// ---------------------------------------------------------------------------
// PaymentProof::from_header — invalid base64 inputs
// ---------------------------------------------------------------------------

#[test]
fn payment_proof_from_header_invalid_base64_returns_err() {
    let bad_inputs = [
        "!!!not-base64!!!",
        "====",
        " ",
        "\x00\x01\x02",
    ];

    for input in bad_inputs {
        let result = PaymentProof::from_header(input);
        assert!(
            result.is_err(),
            "Expected Err for input {:?}, got Ok",
            input
        );
        // The error must be the InvalidProof variant.
        assert!(
            matches!(result.unwrap_err(), X402Error::InvalidProof(_)),
            "Expected InvalidProof variant for input {:?}",
            input
        );
    }
}

#[test]
fn payment_proof_from_header_valid_base64_invalid_json_returns_err() {
    // "aGVsbG8=" decodes to b"hello" which is not valid JSON.
    let result = PaymentProof::from_header("aGVsbG8=");
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), X402Error::InvalidProof(_)));
}

// ---------------------------------------------------------------------------
// X402Config::from_env
// ---------------------------------------------------------------------------

/// Set env vars, call from_env(), verify the fields are populated correctly.
/// NOTE: env vars are process-global so the test is named uniquely to reduce
/// cross-test interference when the suite is run single-threaded.
#[test]
fn config_from_env_reads_wallet_address() {
    // SAFETY: std::env::set_var is safe in edition 2021 (Rust < 2024 semantics).
    // Integration test binary is single-process; run with -- --test-threads=1
    // if parallel execution causes flakiness.
    std::env::set_var("X402_WALLET_ADDRESS", "IntegTestWallet999");
    std::env::set_var("X402_FACILITATOR_URL", "https://integ-facilitator.example");
    std::env::set_var("SOLANA_RPC_URL", "https://integ-rpc.example");
    std::env::set_var("X402_ENABLED", "true");
    std::env::set_var("SOLANA_NETWORK", "devnet");
    std::env::set_var("X402_MIN_PAYMENT", "0.002");

    let config = X402Config::from_env().expect("from_env() must succeed when all vars are set");

    assert_eq!(config.wallet_address, "IntegTestWallet999");
    assert_eq!(config.facilitator_url, "https://integ-facilitator.example");
    assert_eq!(config.solana_rpc_url, "https://integ-rpc.example");
    assert!(config.enabled);
    assert_eq!(config.network, "devnet");
    assert_eq!(config.min_payment_usdc, "0.002");
}

#[test]
fn config_from_env_enabled_false_when_set_to_zero() {
    std::env::set_var("X402_WALLET_ADDRESS", "IntegTestWallet000");
    std::env::set_var("X402_ENABLED", "0");

    let config = X402Config::from_env().unwrap();
    assert!(!config.enabled);
}

#[test]
fn config_from_env_enabled_false_when_absent() {
    std::env::set_var("X402_WALLET_ADDRESS", "IntegTestWalletAbsent");
    std::env::remove_var("X402_ENABLED");

    let config = X402Config::from_env().unwrap();
    assert!(!config.enabled);
}

#[test]
fn config_from_env_missing_wallet_address_returns_err() {
    std::env::remove_var("X402_WALLET_ADDRESS");

    let result = X402Config::from_env();
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), X402Error::ConfigError(_)));
}

// ---------------------------------------------------------------------------
// middleware::extract_payment_proof
// ---------------------------------------------------------------------------

use phoenix_x402::middleware::extract_payment_proof;

#[test]
fn extract_payment_proof_missing_header_returns_none() {
    let headers = HeaderMap::new();
    let result = extract_payment_proof(&headers).unwrap();
    assert!(result.is_none());
}

#[test]
fn extract_payment_proof_malformed_header_returns_err() {
    let mut headers = HeaderMap::new();
    // Insert a value that is valid ASCII but not valid base64.
    headers.insert(
        HeaderName::from_static("x-payment"),
        "!!!malformed!!!".parse().unwrap(),
    );

    let result = extract_payment_proof(&headers);
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), X402Error::InvalidProof(_)));
}

#[test]
fn extract_payment_proof_valid_header_returns_proof() {
    let proof = make_proof("extract-sig-456", "0.05", "evidence:integ-test");
    let encoded = proof.to_header().unwrap();

    let mut headers = HeaderMap::new();
    headers.insert(
        HeaderName::from_static("x-payment"),
        encoded.parse().unwrap(),
    );

    let result = extract_payment_proof(&headers).unwrap();
    assert!(result.is_some());

    let extracted = result.unwrap();
    assert_eq!(extracted.signature, "extract-sig-456");
    assert_eq!(extracted.amount, "0.05");
    assert_eq!(extracted.memo, "evidence:integ-test");
    assert_eq!(extracted.token, "USDC");
}

// ---------------------------------------------------------------------------
// middleware::payment_required_response
// ---------------------------------------------------------------------------

use phoenix_x402::middleware::payment_required_response;

#[test]
fn payment_required_response_status_is_402() {
    let (status, _body) = payment_required_response(
        "evt-integ-001",
        PriceTier::Basic,
        "WalletRecipient",
        "https://x402.org/facilitator",
    );

    assert_eq!(status, StatusCode::PAYMENT_REQUIRED);
}

#[test]
fn payment_required_response_body_matches_tier() {
    let (status, axum::Json(body)) = payment_required_response(
        "evt-integ-002",
        PriceTier::LegalAttestation,
        "LegalWallet",
        "https://legal.facilitator.example",
    );

    assert_eq!(status, StatusCode::PAYMENT_REQUIRED);
    assert_eq!(body.price, "1.00");
    assert_eq!(body.currency, "USDC");
    assert_eq!(body.tier, PriceTier::LegalAttestation);
    assert_eq!(body.memo, "evidence:evt-integ-002");
    assert_eq!(body.recipient, "LegalWallet");
    assert_eq!(body.facilitator, "https://legal.facilitator.example");
}

#[test]
fn payment_required_response_supported_tokens_present() {
    let (_status, axum::Json(body)) = payment_required_response(
        "evt-integ-003",
        PriceTier::MultiChain,
        "MultiWallet",
        "https://x402.org/facilitator",
    );

    assert!(body.supported_tokens.contains(&"USDC".to_string()));
    assert!(body.supported_tokens.contains(&"USDT".to_string()));
    assert!(body.supported_tokens.contains(&"SOL".to_string()));
}
