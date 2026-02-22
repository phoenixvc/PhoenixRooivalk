---
id: adr-0101-rust-workspace-rustls-policy
title: "ADR 0101: Rust Workspace Structure and rustls-Only TLS Policy"
sidebar_label: "ADR 0101: Rust Workspace & rustls"
difficulty: intermediate
estimated_reading_time: 6
points: 25
tags:
  - technical
  - architecture
  - security
  - rust
prerequisites: []
---

# ADR 0101: Rust Workspace Structure and rustls-Only TLS Policy

**Date**: 2026-02-22 **Status**: Accepted

---

## Executive Summary

1. **Problem**: The Rust backend spans 15 crates across API, keeper, CLI tools,
   blockchain anchoring, evidence hashing, and a desktop app. A consistent
   workspace structure and TLS policy are needed to prevent dependency conflicts
   and mitigate RUSTSEC-2025-0004 (OpenSSL vulnerability).
2. **Decision**: Use a single Cargo workspace with shared dependencies, forbid
   unsafe code workspace-wide, and mandate `rustls` for all TLS operations —
   never `native-tls` or OpenSSL.
3. **Trade-off**: `rustls` has narrower certificate compatibility than OpenSSL
   but eliminates an entire class of memory-safety CVEs and simplifies
   cross-compilation.

---

## Context

Phoenix Rooivalk's Rust codebase consists of 15 workspace members:

- **Applications**: `api`, `keeper`, `evidence-cli`,
  `threat-simulator-desktop` (lib + src-tauri)
- **Libraries**: `evidence`, `anchor-solana`, `anchor-etherlink`,
  `address-validation`, `phoenix-common`, `x402`

All crates share common dependencies (SQLx, reqwest, tokio, serde) that must
resolve to compatible versions. The `native-tls` crate links to the system's
OpenSSL library, which was affected by RUSTSEC-2025-0004. Since the platform
targets edge deployments on diverse Linux distributions (Raspberry Pi, NVIDIA
Jetson, Azure VMs), relying on system OpenSSL creates both security risk and
deployment complexity.

Additionally, the threat simulator desktop app compiles to both native (Tauri)
and WASM targets, requiring the `getrandom` crate to use the `wasm_js` feature
for browser-compatible random number generation.

---

## Options Considered

### Option 1: rustls-Only with Workspace Enforcement ✅ Selected

**Description**: Configure the workspace `Cargo.toml` to use `rustls` features
for all HTTP/TLS crates. Forbid `unsafe` code workspace-wide via `[workspace.lints.rust]`.

**Pros**:

- Eliminates OpenSSL dependency entirely (RUSTSEC-2025-0004 mitigation)
- Pure Rust — no system library linking, simplifies cross-compilation
- Memory-safe TLS implementation (no C code in the TLS stack)
- Consistent behavior across all deployment targets
- Smaller container images (no libssl-dev needed)

**Cons**:

- Does not support all root CA formats that OpenSSL supports
- Some enterprise proxies with custom CA bundles may require additional
  configuration
- Slightly less mature than OpenSSL for edge-case TLS scenarios

### Option 2: native-tls (OpenSSL) ❌ Rejected

**Description**: Use the system's OpenSSL for TLS operations.

**Pros**:

- Broadest certificate compatibility
- System administrators can update OpenSSL independently

**Cons**:

- Vulnerable to RUSTSEC-2025-0004 and future OpenSSL CVEs
- Requires `libssl-dev` on every build host and deployment target
- Cross-compilation complexity (must match target's OpenSSL version)
- Links C code, undermining Rust's memory safety guarantees

### Option 3: Per-Crate TLS Selection ❌ Rejected

**Description**: Let each crate choose its own TLS backend.

**Pros**:

- Maximum flexibility per crate

**Cons**:

- Dependency conflicts when crates pull both `native-tls` and `rustls`
- Inconsistent security posture across the workspace
- Harder to audit and enforce

---

## Decision

### Workspace Configuration

The root `Cargo.toml` enforces:

```toml
[workspace.lints.rust]
unsafe_code = "forbid"

[workspace.dependencies]
reqwest = { version = "0.12", default-features = false, features = ["rustls-tls"] }
sqlx = { version = "0.8", features = ["runtime-tokio", "tls-rustls", "sqlite"] }
```

Every crate that needs HTTP or TLS must use the workspace dependency (which
has `rustls` features pre-selected). Adding `native-tls` features to any
dependency is a CI-blocking violation.

### Unsafe Code Prohibition

`unsafe_code = "forbid"` at the workspace level means no crate in the workspace
can contain `unsafe` blocks. This is enforced by `cargo clippy -- -D warnings`
in CI.

### getrandom WASM Configuration

The workspace pins `getrandom = { version = "0.4.1", features = ["wasm_js"] }`
so that WASM targets use the JavaScript-based entropy source. The threat
simulator additionally pulls `getrandom 0.3` (transitively via Leptos/rand)
with the same `wasm_js` feature for Cargo feature unification.

---

## Consequences

### Positive

1. **Security**: No OpenSSL in the dependency tree — immune to RUSTSEC-2025-0004
   and future OpenSSL CVEs
2. **Portability**: Pure Rust TLS compiles identically on x86_64, ARM (Pi),
   aarch64 (Jetson), and WASM
3. **Simplicity**: One TLS backend to audit, configure, and troubleshoot
4. **Safety**: `unsafe_code = "forbid"` prevents all unsafe blocks across 15
   crates

### Negative

1. **Certificate edge cases**: Some government/enterprise CAs may need manual
   `webpki-roots` configuration
2. **Contributor friction**: Contributors must remember to never add `native-tls`
   features when adding dependencies

### Neutral

1. **Performance**: `rustls` and OpenSSL have comparable TLS handshake
   performance for typical workloads
2. **Maintenance**: `rustls` is actively maintained by the Rust community

---

## Enforcement

- **CI**: `cargo clippy -- -D warnings` catches unsafe code
- **Code review**: Any PR adding `native-tls` to `Cargo.toml` must be rejected
- **CLAUDE.md**: Documents the `rustls`-only policy for AI assistants
- **Dependency audit**: `cargo audit` in CI flags OpenSSL advisories

---

## Related ADRs

- ADR D003: Rust and Axum for Backend (framework selection)
- ADR D005: SQLite as Primary Database (uses SQLx with `tls-rustls`)
- ADR 0035: CI/CD Pipeline (enforces clippy and audit)

---

## References

- [RUSTSEC-2025-0004](https://rustsec.org/advisories/RUSTSEC-2025-0004.html)
- [rustls documentation](https://docs.rs/rustls/)
- [Cargo workspace documentation](https://doc.rust-lang.org/cargo/reference/workspaces.html)

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
