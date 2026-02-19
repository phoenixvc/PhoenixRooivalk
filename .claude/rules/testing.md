---
paths:
  - "**/tests/**"
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/*_test.rs"
---

# Testing Standards

- JS/TS: Marketing uses Vitest, Docs and UI use Jest
- Rust: `cargo test` — game engine tests run natively (not WASM)
- Python: pytest with markers `slow`, `integration`, `hardware`
- Skip slow/hardware tests in quick feedback loops:
  `pytest -m "not slow and not hardware"`
- Coverage thresholds: Python 50%, JS/TS varies by app
- Rust tests use `#[serial]` from `serial_test` crate for DB isolation
- Python tests use `tempfile` for isolated databases
- Mock external services — never call real blockchain/APIs in unit tests
- Keeper tests use `MockAnchorProvider` and `MockJobProvider`
- API tests use in-memory SQLite with auto-migrations
- Name test files to match source: `foo.ts` -> `foo.test.ts`,
  `foo.rs` -> inline `#[cfg(test)]` or `tests/foo.rs`
