# Run the test suite

Run the test suite for the project. Accepts an optional argument to scope tests.

Arguments: $ARGUMENTS

If no argument is provided, run all test suites:

1. `pnpm --filter marketing test && pnpm --filter docs test && pnpm --filter ui test`
   — JS/TS tests
2. `cargo test` — Rust workspace tests
3. `pytest apps/detector` — Python detector tests

If an argument is provided, scope the tests:

- `marketing` → `pnpm --filter marketing test` (Vitest)
- `docs` → `pnpm --filter docs test` (Jest)
- `ui` → `pnpm --filter ui test` (Jest)
- `rust` → `cargo test`
- `api` → `cargo test -p phoenix-api`
- `keeper` → `cargo test -p phoenix-keeper`
- `detector` or `python` → `pytest apps/detector`
- `sim` → `pnpm sim:test`
- Any other value → try `pnpm --filter $ARGUMENTS test`

Report pass/fail counts and any failures in detail.
