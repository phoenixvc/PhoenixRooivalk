# Check

Run the full quality check suite across all languages. Run these steps
sequentially and report results:

**TypeScript/JavaScript:**

1. `pnpm format:check` — Verify Prettier formatting
2. `pnpm lint` — Run ESLint across all packages
3. `pnpm typecheck` — TypeScript type checking

**Rust:**

1. `cargo fmt --all -- --check` — Rust formatting check
2. `cargo clippy -- -D warnings` — Rust linting (deny warnings)

**Python (apps/detector/):**

1. `cd apps/detector && ruff check src/` — Python linting
2. `cd apps/detector && black --check src/` — Python format check
3. `cd apps/detector && isort --check-only src/` — Import order check

If any step fails, report the specific errors and offer to fix them.
At the end, provide a summary table showing pass/fail for each step.
