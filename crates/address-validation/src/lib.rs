use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use thiserror::Error;
use base58check::{FromBase58Check, FromBase58CheckError};

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
    #[error("internal error: {0}")]
    InternalError(String),
    #[error("unsupported chain: {0}")]
    UnsupportedChain(String),
}

impl From<bs58::decode::Error> for AddressError {
    fn from(e: bs58::decode::Error) -> Self {
        match e {
            bs58::decode::Error::InvalidCharacter { character, index } => {
                AddressError::Base58Error(format!(
                    "invalid character '{}' at index {}",
                    character, index
                ))
            }
            _ => AddressError::Base58Error(e.to_string()),
        }
    }
}

impl From<FromBase58CheckError> for AddressError {
    fn from(e: FromBase58CheckError) -> Self {
        match e {
            FromBase58CheckError::InvalidBase58(e) => AddressError::Base58Error(format!("{:?}", e)),
            _ => AddressError::Base58Error("invalid base58check".to_string()),
        }
    }
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Chain {
    Evm,
    Solana,
    Bitcoin,
}

impl Chain {
    pub fn from_str(s: &str) -> Result<Self, AddressError> {
        match s.to_lowercase().as_str() {
            "ethereum" | "etherlink" | "evm" => Ok(Chain::Evm),
            "solana" => Ok(Chain::Solana),
            "bitcoin" => Ok(Chain::Bitcoin),
            _ => Err(AddressError::UnsupportedChain(s.to_string())),
        }
    }
}

pub fn get_address_metadata(chain: Chain) -> Result<AddressMetadata, AddressError> {
    match chain {
        Chain::Evm => Ok(AddressMetadata {
            chain: "evm".to_string(),
            address_format: "0x-prefixed hex (42 chars, 20 bytes). EIP-55 checksum recommended."
                .to_string(),
            address_example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e".to_string(),
        }),
        Chain::Solana => Ok(AddressMetadata {
            chain: "solana".to_string(),
            address_format: "Base58 encoded; decodes to exactly 32 bytes (length varies)."
                .to_string(),
            address_example: "4Nd1mY3iQz9dKqG2m9X3pQxvGXn3a6TT5p7H1cDJ5b5P".to_string(),
        }),
        Chain::Bitcoin => Ok(AddressMetadata {
            chain: "bitcoin".to_string(),
            address_format: "Base58Check encoded; P2PKH, P2SH, Bech32 formats.".to_string(),
            address_example: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2".to_string(),
        }),
    }
}

fn validate_evm_format(address: &str) -> Result<(), AddressError> {
    address
        .starts_with("0x")
        .then_some(())
        .ok_or_else(|| AddressError::InvalidPrefix("must start with 0x".to_string()))
        .and_then(|()| {
            if address.len() != 42 {
                Err(AddressError::InvalidLength {
                    expected: 42,
                    actual: address.len(),
                })
            } else {
                Ok(())
            }
        })
        .and_then(|()| {
            let hex_part = &address[2..];
            if !hex_part.chars().all(|c| c.is_ascii_hexdigit()) {
                Err(AddressError::InvalidCharacters(
                    "contains non-hex characters".to_string(),
                ))
            } else {
                Ok(())
            }
        })
}

fn calculate_checksum(address: &str) -> String {
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

    result
}

pub fn validate_evm_address(address: &str, require_checksum: bool) -> Result<(), AddressError> {
    validate_evm_format(address).and_then(|()| {
        if require_checksum {
            let expected_checksum = calculate_checksum(address);
            if address != expected_checksum {
                return Err(AddressError::InvalidChecksum);
            }
        }
        Ok(())
    })
}

pub fn to_eip55_checksum(address: &str) -> Result<String, AddressError> {
    validate_evm_format(address)?;
    Ok(calculate_checksum(address))
}

pub fn get_evm_address_info(
    address: &str,
    require_checksum: bool,
) -> Result<EvmAddressInfo, AddressError> {
    let metadata = get_address_metadata(Chain::Evm)
        .map_err(|e| AddressError::InternalError(e.to_string()))?;

    match validate_evm_address(address, require_checksum) {
        Ok(()) => {
            let normalized =
                to_eip55_checksum(address).unwrap_or_else(|_| address.to_string());
            let checksum_valid = validate_evm_address(address, true).is_ok();

            Ok(EvmAddressInfo {
                chain: "evm".to_string(),
                address_format: metadata.address_format,
                address_example: metadata.address_example,
                normalized_address: normalized,
                checksum_valid,
                validation_reason: String::new(),
            })
        }
        Err(e) => Err(e),
    }
}

pub fn validate_solana_address(address: &str) -> Result<(), AddressError> {
    let decoded = bs58::decode(address).into_vec()?;
    if decoded.len() != 32 {
        return Err(AddressError::InvalidLength {
            expected: 32,
            actual: decoded.len(),
        });
    }
    Ok(())
}

pub fn validate_bitcoin_address(address: &str) -> Result<(), AddressError> {
    address.from_base58check()?;
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
        let err = validate_solana_address("invalid0OIl").unwrap_err();
        assert!(matches!(err, AddressError::Base58Error(_)));
        assert!(err.to_string().contains("invalid character 'l' at index 4"));
    }

    #[test]
    fn test_get_evm_address_info_invalid() {
        let result = get_evm_address_info("invalid-address", false);
        assert!(result.is_err());
    }

    #[test]
    fn test_unsupported_chain() {
        let err = Chain::from_str("not-a-chain").unwrap_err();
        assert!(matches!(err, AddressError::UnsupportedChain(_)));
    }

    #[test]
    fn test_bitcoin_address_validation() {
        // Valid Bitcoin address
        assert!(validate_bitcoin_address("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2").is_ok());

        // Invalid Bitcoin address
        assert!(validate_bitcoin_address("invalid-bitcoin-address").is_err());
    }

}
