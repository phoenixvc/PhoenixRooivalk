---
id: adr-0201-evidence-hashing-algorithm
title: "ADR 0201: Evidence Hashing Algorithm — SHA-256"
sidebar_label: "ADR 0201: Evidence Hashing"
difficulty: intermediate
estimated_reading_time: 6
points: 25
tags:
  - technical
  - architecture
  - blockchain
  - security
  - evidence
prerequisites:
  - adr-0200-dual-chain-evidence-anchoring
---

# ADR 0201: Evidence Hashing Algorithm — SHA-256

**Date**: 2026-02-22 **Status**: Accepted (Implemented)

---

## Executive Summary

1. **Problem**: The evidence pipeline needs a cryptographic hash algorithm to
   create tamper-evident digests of counter-drone operation data. The algorithm
   choice has legal implications for court admissibility and must be consistent
   across all system components (API, CLI, threat simulator, keeper).
2. **Decision**: Use SHA-256 exclusively via the `sha2` Rust crate. The
   `EvidenceDigest` model enforces `DigestAlgo::Sha256` as the only variant.
   Digests are stored and transmitted as lowercase hex strings.
3. **Trade-off**: SHA-256 is not the fastest hash (BLAKE3 is ~3x faster) but
   has the broadest legal acceptance and is the standard for blockchain
   transactions on both Solana and EtherLink.

---

## Context

Every counter-drone operation produces evidence data that must be:

- **Integrity-verified**: Detect any tampering after initial recording
- **Court-admissible**: Accepted by legal systems as authentic
- **Blockchain-compatible**: Used as the payload for on-chain anchoring
- **Cross-platform**: Computed identically on Rust API, Rust CLI, Rust WASM
  simulator, and potentially Python detector

The hash is the foundation of the entire evidence chain — from initial capture
through blockchain anchoring to forensic export. Changing the algorithm after
deployment would invalidate all existing evidence records.

---

## Options Considered

### Option 1: SHA-256 ✅ Selected

**Description**: NIST-standard SHA-2 family, 256-bit output, via the `sha2`
Rust crate.

**Pros**:

- **Legal standard**: FIPS 180-4, accepted by US courts, NIST-approved
- **Blockchain native**: Both Solana and Ethereum/EtherLink use SHA-256
  internally
- **Universal**: Available in every language and platform
- **Proven**: 20+ years of cryptanalysis with no practical attacks
- **Audit-friendly**: Widely understood by security auditors

**Cons**:

- Not the fastest option (~500 MB/s on modern x86 without hardware acceleration)
- 256-bit output is larger than necessary for collision resistance alone

### Option 2: BLAKE3 ❌ Rejected

**Description**: Modern hash function, ~3x faster than SHA-256 on x86.

**Pros**:

- Fastest general-purpose hash available
- Parallelizable (SIMD-optimized)
- 256-bit output

**Cons**:

- Not FIPS-certified (blocks government/DoD use)
- Not native to Solana or Ethereum (would need SHA-256 conversion for anchoring)
- Less legal precedent for court admissibility
- Less familiar to security auditors

### Option 3: SHA-3 (Keccak-256) ❌ Rejected

**Description**: NIST SHA-3 standard, based on Keccak sponge construction.

**Pros**:

- NIST-approved (FIPS 202)
- Different internal structure from SHA-2 (diversity hedge)
- Native to Ethereum (but not Solana)

**Cons**:

- Slower than SHA-256 on most platforms
- Not native to Solana (adds conversion complexity)
- Less widely deployed than SHA-256
- Overkill — SHA-256 has no known weaknesses

---

## Decision

### Core Implementation

The `crates/evidence` crate provides the canonical hashing function:

```rust
pub mod hash {
    use sha2::{Digest, Sha256};
    use hex::ToHex;

    pub fn sha256_hex(data: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data);
        let out = hasher.finalize();
        out.encode_hex::<String>()
    }
}
```

### Data Model

```rust
pub enum DigestAlgo {
    Sha256,
}

pub struct EvidenceDigest {
    pub algo: DigestAlgo,
    pub hex: String,  // 64-character lowercase hex
}

pub struct EvidenceRecord {
    pub id: String,
    pub created_at: u64,
    pub digest: EvidenceDigest,
    pub payload_mime: Option<String>,
    pub metadata: Option<serde_json::Value>,
}
```

The `DigestAlgo` enum has only `Sha256` as a variant. This is intentional —
adding a new algorithm requires a conscious decision (new ADR) rather than
silent addition.

### Consistency Across Components

| Component          | Hash Source                   | Format           |
| ------------------ | ----------------------------- | ---------------- |
| API                | `crates/evidence::hash`       | 64-char hex      |
| Evidence CLI       | `crates/evidence::hash`       | 64-char hex      |
| Threat Simulator   | `crates/evidence::hash` (WASM)| 64-char hex      |
| Keeper             | Reads `digest_hex` from DB    | 64-char hex      |
| Merkle Tree        | `sha2::Sha256` directly       | Binary → hex     |

All components use the same `sha2` crate version (workspace dependency) to
ensure identical output for identical input.

### Hex String Format

- Always lowercase: `a1b2c3...` not `A1B2C3...`
- Always 64 characters (256 bits / 4 bits per hex char)
- No `0x` prefix (to distinguish from Ethereum transaction hashes)
- Validated on API input via length and hex character checks

---

## Consequences

### Positive

1. **Legal compliance**: FIPS 180-4 certification ensures court admissibility
2. **Blockchain alignment**: Native format for Solana memo and EtherLink data
3. **Simplicity**: One algorithm, one format, one crate across all components
4. **Auditability**: Security auditors immediately understand SHA-256
5. **Immutability**: `DigestAlgo` enum prevents accidental algorithm mixing

### Negative

1. **Performance ceiling**: SHA-256 is ~3x slower than BLAKE3 for large payloads
   (not a bottleneck for evidence metadata, which is typically <1KB)
2. **Algorithm lock-in**: Changing algorithms requires migrating all existing
   evidence records (mitigated by the `DigestAlgo` field enabling future
   multi-algorithm support)

### Neutral

1. **Empty hash**: `sha256_hex(b"")` = `e3b0c44298fc1c14...` is a well-known
   constant. The API should reject empty payloads.

---

## Related ADRs

- ADR 0200: Dual-Chain Evidence Anchoring (consumer of evidence digests)
- ADR 0034: Keeper Service Dual-Loop Design (processes evidence jobs)
- ADR 0101: Rust Workspace and rustls-Only TLS Policy (shared crate versioning)

---

## References

- [FIPS 180-4: Secure Hash Standard](https://csrc.nist.gov/publications/detail/fips/180/4/final)
- [sha2 Rust crate](https://docs.rs/sha2/)
- [NIST Hash Function Policy](https://csrc.nist.gov/projects/hash-functions)

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
