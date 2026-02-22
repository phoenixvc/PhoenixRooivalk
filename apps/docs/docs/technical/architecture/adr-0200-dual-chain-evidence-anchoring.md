---
id: adr-0200-dual-chain-evidence-anchoring
title: "ADR 0200: Dual-Chain Evidence Anchoring Architecture"
sidebar_label: "ADR 0200: Dual-Chain Anchoring"
difficulty: expert
estimated_reading_time: 8
points: 35
tags:
  - technical
  - architecture
  - blockchain
  - evidence
prerequisites:
  - adr-0034-keeper-dual-loop-design
  - adr-0102-sqlite-operational-database
---

# ADR 0200: Dual-Chain Evidence Anchoring Architecture

**Date**: 2026-02-22 **Status**: Accepted (Implemented)

---

## Executive Summary

1. **Problem**: Evidence integrity claims require blockchain anchoring, but no
   single chain meets all requirements — Solana offers speed and low cost while
   EtherLink offers EVM compatibility and broader tooling. Chain-specific
   failures must not prevent evidence recording.
2. **Decision**: Define an `AnchorProvider` trait implemented by Solana,
   EtherLink, and stub providers. The keeper routes jobs via the
   `KEEPER_PROVIDER` environment variable (`stub`, `solana`, `etherlink`,
   `multi`). Batch anchoring via Merkle trees reduces per-item cost by ~100x.
3. **Trade-off**: Multi-chain adds operational complexity and double the
   transaction costs, but eliminates single-chain dependency risk and enables
   cross-chain evidence verification.

---

## Context

Phoenix Rooivalk's evidence pipeline must provide tamper-proof audit trails for
counter-drone operations. Customers in different sectors have different
blockchain preferences:

| Sector           | Preferred Chain | Reason                          |
| ---------------- | --------------- | ------------------------------- |
| Enterprise       | EtherLink       | EVM ecosystem, Tezos governance |
| Government/DoD   | Solana          | US-based, high throughput       |
| Law enforcement  | Either          | Courts accept both              |
| Consumer         | Stub (dev)      | No blockchain cost in freemium  |

The system must support:

- Running without any blockchain connection (development/testing)
- Single-chain deployments (cost-optimized)
- Dual-chain deployments (maximum evidence durability)
- Batch anchoring to reduce per-evidence transaction costs

---

## Options Considered

### Option 1: Trait-Based Provider Abstraction ✅ Selected

**Description**: Define an `AnchorProvider` trait that all chain implementations
conform to. Provider selection at startup via environment variable.

**Pros**:

- Clean abstraction — new chains added by implementing one trait
- Runtime provider selection without recompilation
- Stub provider enables testing without blockchain infrastructure
- Multi-provider mode anchors to all chains simultaneously

**Cons**:

- Trait object dispatch has minimal runtime overhead
- Provider-specific features (Solana priority fees, EtherLink gas estimation)
  require provider-aware configuration

### Option 2: Compile-Time Chain Selection ❌ Rejected

**Description**: Use Cargo features to compile only the selected chain support.

**Pros**:

- Zero runtime overhead, no unused code in binary
- Compile-time verification of chain configuration

**Cons**:

- Cannot switch chains without recompilation
- Multi-chain mode requires building a separate binary
- Feature combinations create testing matrix explosion

### Option 3: External Anchoring Service ❌ Rejected

**Description**: Use a third-party blockchain anchoring SaaS (e.g., Chainpoint).

**Pros**:

- No blockchain infrastructure to manage
- Multi-chain support built-in

**Cons**:

- External service dependency (violates edge deployment constraint)
- Recurring SaaS costs
- Cannot verify anchoring independently
- Data leaves the network boundary

---

## Decision

### AnchorProvider Trait

Defined in `crates/evidence/src/lib.rs`:

```rust
#[async_trait]
pub trait AnchorProvider: Send + Sync {
    async fn anchor(&self, evidence: &EvidenceRecord) -> Result<ChainTxRef, AnchorError>;
    async fn confirm(&self, tx: &ChainTxRef) -> Result<ChainTxRef, AnchorError>;
}
```

### Provider Implementations

| Crate              | Provider            | Description                          |
| ------------------ | ------------------- | ------------------------------------ |
| `anchor-solana`    | `SolanaProvider`     | Solana memo transactions via RPC     |
| `anchor-solana`    | `SolanaProviderStub` | Returns `"fake:{digest}"` for tests  |
| `anchor-etherlink` | `EtherlinkProvider`  | EtherLink transactions via JSON-RPC  |
| `anchor-etherlink` | `EtherlinkProviderStub` | Returns `"fake:{digest}"` for tests |

### Provider Selection

The keeper's `KEEPER_PROVIDER` env var controls routing:

| Value       | Behavior                                      |
| ----------- | --------------------------------------------- |
| `stub`      | No blockchain — returns fake tx IDs            |
| `solana`    | Anchor to Solana only                          |
| `etherlink` | Anchor to EtherLink only                       |
| `multi`     | Anchor to both Solana and EtherLink             |

### Batch Anchoring via Merkle Trees

For high-volume evidence streams, the keeper supports batch anchoring:

1. **Collect** evidence jobs until batch is full (default: 100) or timeout (60s)
2. **Build** a Merkle tree from individual SHA-256 digests
3. **Anchor** only the Merkle root to the blockchain (1 transaction)
4. **Store** individual Merkle proofs in `merkle_proofs` table
5. **Verify** any individual evidence by reconstructing path to root

This reduces blockchain costs by ~100x for high-volume deployments.

```
        Merkle Root (anchored on-chain)
           /                    \
      Hash(AB)               Hash(CD)
       /    \                /    \
   Hash(A) Hash(B)    Hash(C) Hash(D)
     ↑       ↑          ↑       ↑
   ev_001  ev_002    ev_003  ev_004
```

Each evidence item gets a `MerkleProof` containing the sibling hashes needed
to reconstruct the path from leaf to root. Verification:

```rust
impl MerkleProof {
    pub fn verify(&self, expected_root: &str) -> Result<bool> {
        let mut current = hex::decode(&self.leaf_hash)?;
        for sibling in &self.siblings {
            let sibling_hash = hex::decode(&sibling.hash)?;
            let mut hasher = Sha256::new();
            if sibling.is_left {
                hasher.update(&sibling_hash);
                hasher.update(&current);
            } else {
                hasher.update(&current);
                hasher.update(&sibling_hash);
            }
            current = hasher.finalize().to_vec();
        }
        Ok(hex::encode(current) == expected_root)
    }
}
```

### Transaction Data Format

Both chains use memo-style transactions containing the evidence digest:

- **Solana**: `"evidence:{digest_hex}"` as memo instruction data
- **EtherLink**: Hex-encoded evidence digest as transaction input data

---

## Consequences

### Positive

1. **Chain-agnostic**: New blockchains added by implementing one trait (2 async
   methods)
2. **Cost-efficient**: Merkle batching reduces per-evidence cost by ~100x
3. **Resilient**: Stub provider ensures the system works without any blockchain
4. **Verifiable**: Merkle proofs enable independent evidence verification
5. **Flexible**: `KEEPER_PROVIDER` switches chains without code changes

### Negative

1. **Double cost**: Multi-provider mode doubles transaction fees
2. **Complexity**: Merkle tree construction and proof storage add database
   tables and code paths
3. **Latency**: Multi-provider mode waits for the slowest chain

### Neutral

1. **Stub for development**: `KEEPER_PROVIDER=stub` is the default, so new
   developers never need blockchain infrastructure

---

## Related ADRs

- ADR 0034: Keeper Service Dual-Loop Design (job processing architecture)
- ADR 0201: Evidence Hashing Algorithm (SHA-256 digest format)
- ADR 0101: Rust Workspace and rustls-Only TLS Policy (HTTP client for RPC)
- ADR 0102: SQLite as Primary Operational Database (outbox tables)

---

## References

- [Solana Memo Program](https://spl.solana.com/memo)
- [EtherLink documentation](https://docs.etherlink.com/)
- [Merkle tree (Wikipedia)](https://en.wikipedia.org/wiki/Merkle_tree)

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
