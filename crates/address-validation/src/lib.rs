use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AddressError {
    #[error("invalid length: expected {expected}, got {actual}")]
    InvalidLength { expected: usize, actual: usize },
    #[error("invalid prefix: {0}")]
    InvalidPrefix(String),
    #[error("invalid characters: {0}")]
    InvalidCharacters(String),
    #[error("invalid checksum")]
    InvalidChecksum,
    #[error("base58 decode error: {0}")]
    Base58Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressMetadata {
    pub chain: String,
    pub address_format: String,
    pub address_example: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvmAddressInfo {
    pub chain: String,
    pub address_format: String,
    pub address_example: String,
    pub normalized_address: String,
    pub checksum_valid: bool,
    pub validation_reason: String,
}

pub fn get_address_metadata(chain: &str) -> Result<AddressMetadata, AddressError> {
    match chain.to_lowercase().as_str() {
        "ethereum" | "etherlink" | "evm" => Ok(AddressMetadata {
            chain: "evm".to_string(),
            address_format: "0x-prefixed hex (42 chars, 20 bytes). EIP-55 checksum recommended."
                .to_string(),
            address_example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e".to_string(),
        }),
        "solana" => Ok(AddressMetadata {
            chain: "solana".to_string(),
            address_format: "Base58 encoded; decodes to exactly 32 bytes (length varies)."
                .to_string(),
            address_example: "4Nd1mY3iQz9dKqG2m9X3pQxvGXn3a6TT5p7H1cDJ5b5P".to_string(),
        }),
        _ => Err(AddressError::InvalidPrefix(format!(
            "Unsupported chain: {}",
            chain
        ))),
    }
}

pub fn validate_evm_address(address: &str, require_checksum: bool) -> Result<(), AddressError> {
    // Check prefix
    if !address.starts_with("0x") {
        return Err(AddressError::InvalidPrefix(
            "must start with 0x".to_string(),
        ));
    }

    // Check length
    if address.len() != 42 {
        return Err(AddressError::InvalidLength {
            expected: 42,
            actual: address.len(),
        });
    }

    let hex_part = &address[2..];

    // Check hex characters
    if !hex_part.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(AddressError::InvalidCharacters(
            "contains non-hex characters".to_string(),
        ));
    }

    // Check EIP-55 checksum if required
    if require_checksum {
        let expected_checksum = to_eip55_checksum(address)?;
        if address != expected_checksum {
            return Err(AddressError::InvalidChecksum);
        }
    }

    Ok(())
}

pub fn to_eip55_checksum(address: &str) -> Result<String, AddressError> {
    // Validate basic format first
    validate_evm_address(address, false)?;

    let hex_part = &address[2..].to_lowercase();
    let hash = Keccak256::digest(hex_part.as_bytes());
    let hash_hex = hex::encode(hash);

    let mut result = String::with_capacity(42);
    result.push_str("0x");

    for (i, c) in hex_part.chars().enumerate() {
        if c.is_ascii_digit() {
            result.push(c);
        } else {
            let hash_char = hash_hex.chars().nth(i).unwrap();
            if hash_char >= '8' {
                result.push(c.to_ascii_uppercase());
            } else {
                result.push(c);
            }
        }
    }

    Ok(result)
}

pub fn get_evm_address_info(address: &str, require_checksum: bool) -> EvmAddressInfo {
    let metadata = get_address_metadata("evm").unwrap();

    match validate_evm_address(address, require_checksum) {
        Ok(()) => {
            let normalized = to_eip55_checksum(address).unwrap_or_else(|_| address.to_string());
            let checksum_valid = validate_evm_address(address, true).is_ok();

            EvmAddressInfo {
                chain: "evm".to_string(),
                address_format: metadata.address_format,
                address_example: metadata.address_example,
                normalized_address: normalized,
                checksum_valid,
                validation_reason: String::new(),
            }
        }
        Err(e) => EvmAddressInfo {
            chain: "evm".to_string(),
            address_format: metadata.address_format,
            address_example: metadata.address_example,
            normalized_address: String::new(),
            checksum_valid: false,
            validation_reason: e.to_string(),
        },
    }
}

pub fn validate_solana_address(address: &str) -> Result<(), AddressError> {
    let decoded = bs58::decode(address)
        .into_vec()
        .map_err(|e| AddressError::Base58Error(e.to_string()))?;

    if decoded.len() != 32 {
        return Err(AddressError::InvalidLength {
            expected: 32,
            actual: decoded.len(),
        });
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_evm_address_validation() {
        // Valid address
        assert!(validate_evm_address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", false).is_ok());

        // Invalid prefix
        assert!(validate_evm_address("742d35Cc6634C0532925a3b844Bc454e4438f44e", false).is_err());

        // Invalid length
        assert!(validate_evm_address("0x742d35Cc6634C0532925a3b844Bc454e4438f44", false).is_err());

        // Invalid characters
        assert!(validate_evm_address("0x742d35Cc6634C0532925a3b844Bc454e4438f44g", false).is_err());
    }

    #[test]
    fn test_eip55_checksum() {
        let address = "0x742d35cc6634c0532925a3b844bc454e4438f44e";
        let checksum = to_eip55_checksum(address).unwrap();
        assert_eq!(checksum, "0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
    }

    #[test]
    fn test_solana_address_validation() {
        // Valid Solana address
        assert!(validate_solana_address("4Nd1mY3iQz9dKqG2m9X3pQxvGXn3a6TT5p7H1cDJ5b5P").is_ok());

        // Invalid Base58
        assert!(validate_solana_address("invalid0OIl").is_err());
    }
}
