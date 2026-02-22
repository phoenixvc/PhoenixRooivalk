//! Integration tests for the address-validation crate.
//!
//! These tests extend the three inline unit tests in lib.rs with broader
//! coverage of EVM edge cases, Solana edge cases, metadata retrieval, and
//! the EvmAddressInfo helper.

use address_validation::*;

// ---------------------------------------------------------------------------
// EVM valid addresses
// ---------------------------------------------------------------------------

/// Well-known checksummed and all-lowercase addresses must both pass when
/// checksum is not required.
#[test]
fn evm_valid_checksummed_addresses() {
    // Checksummed form — passes with or without checksum enforcement.
    assert!(
        validate_evm_address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", true).is_ok(),
        "mixed-case checksummed address should pass require_checksum=true"
    );
    assert!(
        validate_evm_address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", false).is_ok(),
        "mixed-case checksummed address should pass require_checksum=false"
    );
}

#[test]
fn evm_valid_lowercase_address_without_checksum() {
    // All-lowercase is valid hex but fails EIP-55 checksum enforcement.
    assert!(
        validate_evm_address("0x742d35cc6634c0532925a3b844bc454e4438f44e", false).is_ok(),
        "all-lowercase address must pass when checksum is not required"
    );
}

#[test]
fn evm_valid_uppercase_hex_digits_without_checksum() {
    // All-uppercase hex chars — structurally valid, checksum not enforced.
    assert!(
        validate_evm_address("0xABCDEF1234567890ABCDEF1234567890ABCDEF12", false).is_ok()
    );
}

// ---------------------------------------------------------------------------
// EVM edge cases — zero address and max address
// ---------------------------------------------------------------------------

#[test]
fn evm_zero_address_passes_basic_validation() {
    let zero = "0x0000000000000000000000000000000000000000";
    assert!(validate_evm_address(zero, false).is_ok(), "zero address must be structurally valid");
}

#[test]
fn evm_zero_address_checksum_is_itself() {
    // The zero address has only digit characters; EIP-55 capitalisation rules
    // never apply to digits, so the checksummed form is identical to the
    // all-lowercase (all-zero) form.
    let zero = "0x0000000000000000000000000000000000000000";
    let checksummed = to_eip55_checksum(zero).unwrap();
    assert_eq!(
        checksummed, zero,
        "EIP-55 of zero address must equal itself (digits are unaffected)"
    );
    assert!(validate_evm_address(&checksummed, true).is_ok());
}

#[test]
fn evm_max_address_passes_basic_validation() {
    // 0xFFFF...FFFF — 40 hex chars after 0x prefix, structurally valid.
    let max = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
    assert!(validate_evm_address(max, false).is_ok(), "max address must be structurally valid");
}

// ---------------------------------------------------------------------------
// EVM invalid addresses
// ---------------------------------------------------------------------------

#[test]
fn evm_invalid_too_short() {
    // 41 characters total (39 hex digits after 0x).
    assert!(
        validate_evm_address("0x742d35Cc6634C0532925a3b844Bc454e4438f4", false).is_err(),
        "address that is one char too short must fail"
    );
}

#[test]
fn evm_invalid_too_long() {
    // 43 characters total (41 hex digits after 0x).
    assert!(
        validate_evm_address("0x742d35Cc6634C0532925a3b844Bc454e4438f44ee", false).is_err(),
        "address that is one char too long must fail"
    );
}

#[test]
fn evm_invalid_no_prefix() {
    assert!(
        validate_evm_address("742d35Cc6634C0532925a3b844Bc454e4438f44e", false).is_err(),
        "address without 0x prefix must fail"
    );
}

#[test]
fn evm_invalid_non_hex_characters() {
    // Replace one hex digit with 'g' — invalid hex char.
    assert!(
        validate_evm_address("0x742d35Cc6634C0532925a3b844Bc454e4438f44g", false).is_err(),
        "address with non-hex character must fail"
    );
}

#[test]
fn evm_invalid_empty_string() {
    assert!(
        validate_evm_address("", false).is_err(),
        "empty string must fail"
    );
}

#[test]
fn evm_invalid_only_prefix() {
    assert!(
        validate_evm_address("0x", false).is_err(),
        "bare 0x prefix with no hex digits must fail"
    );
}

// ---------------------------------------------------------------------------
// EVM checksum enforcement
// ---------------------------------------------------------------------------

/// A structurally valid address in all-lowercase fails when require_checksum=true
/// because the expected EIP-55 form has mixed case.
#[test]
fn evm_lowercase_fails_checksum_enforcement() {
    // "0x742d35cc..." is the all-lowercase version of the checksummed address
    // "0x742d35Cc..." verified by the inline tests. It is valid hex but its
    // casing does not match the EIP-55 output.
    let lowercase = "0x742d35cc6634c0532925a3b844bc454e4438f44e";
    assert!(
        validate_evm_address(lowercase, true).is_err(),
        "all-lowercase address must fail when checksum is required"
    );
}

/// The all-uppercase form of a known address differs from its EIP-55 form
/// (which is mixed-case) and must therefore fail checksum enforcement.
#[test]
fn evm_wrong_case_fails_checksum_enforcement() {
    // The EIP-55 checksummed form of this address is "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    // (mixed-case). The all-uppercase variant is structurally valid (42 chars,
    // valid hex) but has the wrong casing, so require_checksum=true must reject it.
    let all_uppercase = "0x742D35CC6634C0532925A3B844BC454E4438F44E";
    assert!(
        validate_evm_address(all_uppercase, false).is_ok(),
        "all-uppercase address must be structurally valid (require_checksum=false)"
    );
    assert!(
        validate_evm_address(all_uppercase, true).is_err(),
        "all-uppercase address must fail when checksum is required (expected mixed-case)"
    );
}

// ---------------------------------------------------------------------------
// EIP-55 roundtrip
// ---------------------------------------------------------------------------

/// to_eip55_checksum() output must itself pass validate_evm_address(..., true).
#[test]
fn eip55_roundtrip_basic_address() {
    let lowercase = "0x742d35cc6634c0532925a3b844bc454e4438f44e";
    let checksummed = to_eip55_checksum(lowercase).unwrap();
    assert!(
        validate_evm_address(&checksummed, true).is_ok(),
        "to_eip55_checksum output must satisfy require_checksum=true; got {:?}",
        checksummed
    );
}

#[test]
fn eip55_roundtrip_uppercase_input() {
    let upper = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
    let checksummed = to_eip55_checksum(upper).unwrap();
    assert!(
        validate_evm_address(&checksummed, true).is_ok(),
        "to_eip55_checksum output must satisfy require_checksum=true; got {:?}",
        checksummed
    );
}

#[test]
fn eip55_roundtrip_idempotent() {
    // Calling to_eip55_checksum twice on the same address must yield the same result.
    let addr = "0x742d35cc6634c0532925a3b844bc454e4438f44e";
    let first = to_eip55_checksum(addr).unwrap();
    let second = to_eip55_checksum(&first).unwrap();
    assert_eq!(first, second, "to_eip55_checksum must be idempotent");
}

// ---------------------------------------------------------------------------
// Solana valid addresses
// ---------------------------------------------------------------------------

/// A genuine Solana public key (base58-encoded 32 bytes) must pass.
#[test]
fn solana_valid_mainnet_address() {
    // This is the example address from the crate's own metadata.
    assert!(
        validate_solana_address("4Nd1mY3iQz9dKqG2m9X3pQxvGXn3a6TT5p7H1cDJ5b5P").is_ok(),
        "known-good 32-byte Solana address must pass"
    );
}

/// The system program address (all zeros) is the shortest valid base58 for 32
/// bytes of zeros — base58 encodes them as a string of '1' characters.
#[test]
fn solana_valid_system_program_all_ones_base58() {
    // 32 zero bytes encode in base58 as 32 '1' characters.
    let system_program = "11111111111111111111111111111111";
    assert!(
        validate_solana_address(system_program).is_ok(),
        "32 zero bytes (base58 all-ones) must be valid Solana address"
    );
}

// ---------------------------------------------------------------------------
// Solana invalid addresses
// ---------------------------------------------------------------------------

#[test]
fn solana_invalid_too_few_decoded_bytes() {
    // bs58-encode fewer than 32 bytes: 16 bytes of 0x42 → shorter base58 string.
    let short_bytes = vec![0x42u8; 16];
    let short_address = bs58::encode(&short_bytes).into_string();
    assert!(
        validate_solana_address(&short_address).is_err(),
        "address decoding to fewer than 32 bytes must fail"
    );
}

#[test]
fn solana_invalid_too_many_decoded_bytes() {
    // bs58-encode more than 32 bytes: 40 bytes → longer base58 string.
    let long_bytes = vec![0xAAu8; 40];
    let long_address = bs58::encode(&long_bytes).into_string();
    assert!(
        validate_solana_address(&long_address).is_err(),
        "address decoding to more than 32 bytes must fail"
    );
}

#[test]
fn solana_invalid_base58_characters() {
    // Characters 0, O, I, l are not in the base58 alphabet.
    assert!(
        validate_solana_address("0OIl").is_err(),
        "string with characters outside base58 alphabet must fail"
    );
}

#[test]
fn solana_invalid_empty_string() {
    // Empty string decodes to zero bytes, which is not 32.
    assert!(
        validate_solana_address("").is_err(),
        "empty string must fail Solana address validation"
    );
}

// ---------------------------------------------------------------------------
// get_address_metadata
// ---------------------------------------------------------------------------

#[test]
fn metadata_ethereum_chain() {
    let meta = get_address_metadata("ethereum").unwrap();
    assert_eq!(meta.chain, "evm");
    assert!(!meta.address_format.is_empty());
    assert!(!meta.address_example.is_empty());
}

#[test]
fn metadata_etherlink_chain() {
    let meta = get_address_metadata("etherlink").unwrap();
    assert_eq!(meta.chain, "evm");
}

#[test]
fn metadata_evm_chain() {
    let meta = get_address_metadata("evm").unwrap();
    assert_eq!(meta.chain, "evm");
}

#[test]
fn metadata_case_insensitive_evm() {
    // The function calls to_lowercase() internally.
    let meta = get_address_metadata("EVM").unwrap();
    assert_eq!(meta.chain, "evm");
    let meta2 = get_address_metadata("Ethereum").unwrap();
    assert_eq!(meta2.chain, "evm");
}

#[test]
fn metadata_solana_chain() {
    let meta = get_address_metadata("solana").unwrap();
    assert_eq!(meta.chain, "solana");
    assert!(!meta.address_format.is_empty());
    assert!(!meta.address_example.is_empty());
}

#[test]
fn metadata_unsupported_chain_returns_err() {
    let result = get_address_metadata("bitcoin");
    assert!(result.is_err(), "unsupported chain must return an error");
    assert!(
        matches!(result.unwrap_err(), AddressError::InvalidPrefix(_)),
        "unsupported chain error should be InvalidPrefix variant"
    );
}

#[test]
fn metadata_empty_string_returns_err() {
    assert!(get_address_metadata("").is_err());
}

// ---------------------------------------------------------------------------
// get_evm_address_info
// ---------------------------------------------------------------------------

#[test]
fn evm_address_info_valid_checksummed() {
    let addr = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    let info = get_evm_address_info(addr, false);

    assert_eq!(info.chain, "evm");
    assert!(
        info.checksum_valid,
        "correctly-checksummed address must report checksum_valid=true"
    );
    assert_eq!(info.normalized_address, addr,
        "normalized form of a correctly-checksummed address must equal the input");
    assert!(info.validation_reason.is_empty(),
        "valid address must have an empty validation_reason");
}

#[test]
fn evm_address_info_valid_lowercase_reports_checksum_invalid() {
    let lowercase = "0x742d35cc6634c0532925a3b844bc454e4438f44e";
    let info = get_evm_address_info(lowercase, false);

    // The address is structurally valid (require_checksum=false).
    assert_eq!(info.chain, "evm");
    // But its checksum_valid flag reflects whether it passes EIP-55 check.
    assert!(
        !info.checksum_valid,
        "all-lowercase address must report checksum_valid=false"
    );
    // The normalized address should be the properly checksummed form.
    assert_eq!(
        info.normalized_address,
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "normalized address must be the EIP-55 checksummed form"
    );
}

#[test]
fn evm_address_info_invalid_address() {
    // Too-short address — fails validation entirely.
    let info = get_evm_address_info("0xdeadbeef", false);

    assert_eq!(info.chain, "evm");
    assert!(!info.checksum_valid);
    assert!(
        info.normalized_address.is_empty(),
        "invalid address must produce an empty normalized_address"
    );
    assert!(
        !info.validation_reason.is_empty(),
        "invalid address must populate validation_reason with the error message"
    );
}
