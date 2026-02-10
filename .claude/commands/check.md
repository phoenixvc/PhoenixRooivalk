Run the full quality check suite for the project. Run these steps sequentially and report results:

1. `pnpm format:check` — Verify Prettier formatting
2. `pnpm lint` — Run ESLint across all packages
3. `pnpm typecheck` — TypeScript type checking
4. `cargo fmt --all -- --check` — Rust formatting check
5. `cargo clippy -- -D warnings` — Rust linting (deny warnings)

If any step fails, report the specific errors and offer to fix them.
