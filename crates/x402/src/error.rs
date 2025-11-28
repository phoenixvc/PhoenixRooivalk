//! Error types for x402 payment operations

use thiserror::Error;

/// Errors that can occur during x402 payment processing
#[derive(Debug, Error)]
pub enum X402Error {
    /// Payment was not provided in the request
    #[error("payment required: {0}")]
    PaymentRequired(String),

    /// Payment verification failed
    #[error("payment verification failed: {0}")]
    VerificationFailed(String),

    /// Payment amount is insufficient
    #[error("insufficient payment: expected {expected}, received {received}")]
    InsufficientPayment { expected: String, received: String },

    /// Payment has expired
    #[error("payment expired: {0}")]
    PaymentExpired(String),

    /// Invalid payment proof format
    #[error("invalid payment proof: {0}")]
    InvalidProof(String),

    /// Network error communicating with facilitator
    #[error("facilitator network error: {0}")]
    NetworkError(String),

    /// Configuration error
    #[error("configuration error: {0}")]
    ConfigError(String),

    /// The payment token/currency is not supported
    #[error("unsupported token: {0}")]
    UnsupportedToken(String),
}

impl X402Error {
    /// Returns true if this error should result in a 402 Payment Required response
    pub fn is_payment_required(&self) -> bool {
        matches!(
            self,
            X402Error::PaymentRequired(_)
                | X402Error::InsufficientPayment { .. }
                | X402Error::PaymentExpired(_)
        )
    }

    /// Returns true if this error indicates a client-side issue with the payment
    pub fn is_client_error(&self) -> bool {
        matches!(
            self,
            X402Error::InvalidProof(_) | X402Error::UnsupportedToken(_)
        )
    }
}
