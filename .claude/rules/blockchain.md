---
paths:
  - "crates/anchor-*/**"
  - "crates/x402/**"
  - "crates/evidence/**"
  - "apps/keeper/**"
---

# Blockchain Coding Standards

- Evidence hashing uses SHA-256 from the `phoenix-evidence` crate
- Keeper uses outbox pattern: SQLite queue -> blockchain anchor -> confirm
- Dual-chain support: EtherLink and Solana (via `KEEPER_PROVIDER` env var)
- Batch anchoring via Merkle trees reduces costs ~100x
- Transaction confirmation requires polling — never assume immediate finality
- Exponential backoff for retries: `(5s * 2^attempts).min(5min) + jitter`
- Temporary errors (network/provider) retry; permanent errors (validation) fail
- x402 payment protocol: disabled by default, set `X402_ENABLED=true`
- Devnet mode simulates verification (always valid if amount >= min)
- Wallet addresses validated via `address-validation` crate before use
