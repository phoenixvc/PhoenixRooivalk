---
paths:
  - "**/*.rs"
  - "Cargo.toml"
  - "Cargo.lock"
---

# Rust Coding Standards

- snake_case functions, PascalCase types
- `Result<T, E>` with `?` operator — avoid panics in library code
- Doc comments (`///`) on all public APIs
- All clippy warnings must pass: `cargo clippy -- -D warnings`
- Unsafe code is **forbidden** workspace-wide (`forbid(unsafe_code)` in root
  Cargo.toml)
- Use `rustls` for all HTTP/TLS — never add `native-tls` features to reqwest
  or other HTTP clients (RUSTSEC-2025-0004)
- Cargo package names for `-p` flag: `phoenix-api`, `phoenix-keeper`,
  `evidence-cli`, `threat-simulator-desktop`, `phoenix-evidence`,
  `phoenix-common`, `anchor-etherlink`, `anchor-solana`,
  `address-validation`, `x402`
- `getrandom` crate requires `js` feature for WASM targets
- Conditional compilation: WASM-only vs native deps gated with
  `#[cfg(target_arch = "wasm32")]`
