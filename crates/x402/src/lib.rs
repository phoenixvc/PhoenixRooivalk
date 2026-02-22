//! x402 Payment Protocol Integration
//!
//! This crate provides HTTP 402 "Payment Required" protocol support for
//! Phoenix Rooivalk evidence verification API monetization.
//!
//! # Overview
//!
//! The x402 protocol enables instant micropayments for API access without requiring:
//! - Account creation
//! - OAuth flows
//! - Complex authentication signatures
//! - Subscription management
//!
//! # Features
//!
//! - Zero protocol fees (vs 2.9% + $0.30 for traditional payment processors)
//! - Micropayment-friendly ($0.001 viable)
//! - AI agent-native (autonomous payments)
//! - Settlement via Solana (400ms finality)

pub mod attestation;
pub mod config;
pub mod error;
pub mod facilitator;
pub mod middleware;
pub mod types;

pub use attestation::AttestationSigner;
pub use config::X402Config;
pub use error::X402Error;
pub use facilitator::X402Facilitator;
pub use types::{
    AttestationInfo, EvidenceDigestInfo, PaymentDetails, PaymentProof, PaymentVerification,
    PriceTier, VerifyEvidenceRequest, VerifyEvidenceResponse,
};
