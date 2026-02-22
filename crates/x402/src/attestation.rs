//! Ed25519-based attestation signing for legal-tier evidence verification.
//!
//! Provides cryptographic signing of evidence verification attestations using
//! Ed25519 digital signatures. Keys can be loaded from environment variables
//! or generated ephemerally for development.

use crate::types::AttestationInfo;
use ed25519_dalek::{Signer, SigningKey, VerifyingKey};

/// Attestation signer backed by an Ed25519 keypair.
#[derive(Clone)]
pub struct AttestationSigner {
    signing_key: SigningKey,
    authority: String,
}

impl AttestationSigner {
    /// Create a signer from a hex-encoded 32-byte Ed25519 seed.
    ///
    /// The seed is loaded from `X402_ATTESTATION_PRIVATE_KEY` environment variable.
    /// Authority label is loaded from `X402_ATTESTATION_AUTHORITY` (defaults to
    /// "PhoenixRooivalk Evidence Authority").
    pub fn from_env() -> Option<Self> {
        let key_hex = std::env::var("X402_ATTESTATION_PRIVATE_KEY").ok()?;
        let key_bytes = hex::decode(key_hex.trim())
            .inspect_err(|e| {
                tracing::warn!("X402_ATTESTATION_PRIVATE_KEY is not valid hex: {e}");
            })
            .ok()?;

        if key_bytes.len() != 32 {
            tracing::warn!(
                "X402_ATTESTATION_PRIVATE_KEY must be 32 bytes (64 hex chars), got {}",
                key_bytes.len()
            );
            return None;
        }

        let seed: [u8; 32] = key_bytes.try_into().ok()?;
        let signing_key = SigningKey::from_bytes(&seed);

        let authority = std::env::var("X402_ATTESTATION_AUTHORITY")
            .unwrap_or_else(|_| "PhoenixRooivalk Evidence Authority".to_string());

        tracing::info!("Attestation signer initialized (authority: {authority})");
        Some(Self {
            signing_key,
            authority,
        })
    }

    /// Create a signer with an ephemeral key for development/testing.
    pub fn ephemeral() -> Self {
        let mut rng = rand::thread_rng();
        let signing_key = SigningKey::generate(&mut rng);
        Self {
            signing_key,
            authority: "PhoenixRooivalk Evidence Authority (DEV)".to_string(),
        }
    }

    /// Return the hex-encoded Ed25519 public (verifying) key.
    pub fn public_key_hex(&self) -> String {
        hex::encode(self.verifying_key().as_bytes())
    }

    /// Return the Ed25519 verifying key.
    pub fn verifying_key(&self) -> VerifyingKey {
        self.signing_key.verifying_key()
    }

    /// Sign an evidence attestation and return the [`AttestationInfo`].
    ///
    /// The signed payload is: `{evidence_id}:{digest_hex}:{timestamp_unix}`
    pub fn sign_attestation(
        &self,
        evidence_id: &str,
        digest_hex: &str,
        valid_days: i64,
    ) -> AttestationInfo {
        let timestamp = chrono::Utc::now().timestamp();
        let payload = format!("{evidence_id}:{digest_hex}:{timestamp}");
        let signature = self.signing_key.sign(payload.as_bytes());

        AttestationInfo {
            signed_by: self.authority.clone(),
            signature: format!("ed25519:{}", hex::encode(signature.to_bytes())),
            valid_until: (chrono::Utc::now() + chrono::Duration::days(valid_days)).to_rfc3339(),
        }
    }
}

/// Verify an Ed25519 attestation signature.
///
/// `public_key_hex` is the 32-byte verifying key in hex.
/// `signature_str` is the `"ed25519:<hex>"` string from [`AttestationInfo::signature`].
pub fn verify_attestation(
    public_key_hex: &str,
    signature_str: &str,
    evidence_id: &str,
    digest_hex: &str,
    timestamp_unix: i64,
) -> bool {
    let sig_hex = match signature_str.strip_prefix("ed25519:") {
        Some(h) => h,
        None => return false,
    };

    let Ok(pub_bytes) = hex::decode(public_key_hex) else {
        return false;
    };
    let Ok(sig_bytes) = hex::decode(sig_hex) else {
        return false;
    };

    let Ok(pub_key_arr): Result<[u8; 32], _> = pub_bytes.try_into() else {
        return false;
    };
    let Ok(sig_arr): Result<[u8; 64], _> = sig_bytes.try_into() else {
        return false;
    };

    let Ok(verifying_key) = VerifyingKey::from_bytes(&pub_key_arr) else {
        return false;
    };
    let signature = ed25519_dalek::Signature::from_bytes(&sig_arr);

    let payload = format!("{evidence_id}:{digest_hex}:{timestamp_unix}");
    verifying_key.verify_strict(payload.as_bytes(), &signature).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sign_and_verify_roundtrip() {
        let signer = AttestationSigner::ephemeral();
        let evidence_id = "evt-2025-001";
        let digest = "deadbeef1234567890abcdef";

        let info = signer.sign_attestation(evidence_id, digest, 365);

        assert!(info.signature.starts_with("ed25519:"));
        assert!(!info.valid_until.is_empty());
        assert!(!info.signed_by.is_empty());

        // Extract timestamp from the signature payload
        let timestamp = chrono::Utc::now().timestamp();
        let result = verify_attestation(
            &signer.public_key_hex(),
            &info.signature,
            evidence_id,
            digest,
            timestamp,
        );
        assert!(result);
    }

    #[test]
    fn test_verify_wrong_evidence_id_fails() {
        let signer = AttestationSigner::ephemeral();
        let info = signer.sign_attestation("evt-001", "aabbccdd", 365);
        let timestamp = chrono::Utc::now().timestamp();

        let result = verify_attestation(
            &signer.public_key_hex(),
            &info.signature,
            "evt-WRONG",
            "aabbccdd",
            timestamp,
        );
        assert!(!result);
    }

    #[test]
    fn test_verify_wrong_key_fails() {
        let signer = AttestationSigner::ephemeral();
        let other = AttestationSigner::ephemeral();
        let info = signer.sign_attestation("evt-001", "aabbccdd", 365);
        let timestamp = chrono::Utc::now().timestamp();

        let result = verify_attestation(
            &other.public_key_hex(),
            &info.signature,
            "evt-001",
            "aabbccdd",
            timestamp,
        );
        assert!(!result);
    }

    #[test]
    fn test_from_env_returns_none_without_key() {
        // Without X402_ATTESTATION_PRIVATE_KEY set, should return None
        std::env::remove_var("X402_ATTESTATION_PRIVATE_KEY");
        assert!(AttestationSigner::from_env().is_none());
    }

    #[test]
    fn test_invalid_signature_format() {
        assert!(!verify_attestation(
            "0000000000000000000000000000000000000000000000000000000000000000",
            "not-ed25519:abc",
            "evt",
            "digest",
            0,
        ));
    }
}
