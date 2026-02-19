# Healthcheck

Pre-flight validation before committing, deploying, or shipping.

Arguments: $ARGUMENTS

If an argument is provided, scope to that app. If no argument is provided,
run all gates.

## Validation Gates

Run each gate sequentially. Stop on first failure unless `--continue` is passed.

**Gate 1: Build**

1. `pnpm build` — All JS/TS apps via Turborepo
2. `cargo check` — Rust workspace (faster than full build)

**Gate 2: Lint**

1. `pnpm format:check` — Prettier
2. `pnpm lint` — ESLint
3. `cargo fmt --all -- --check` — Rust format
4. `cargo clippy -- -D warnings` — Rust lint

**Gate 3: Tests**

1. `pnpm --filter marketing test` — Marketing (Vitest)
2. `pnpm --filter docs test` — Docs (Jest)
3. `pnpm --filter ui test` — UI (Jest)
4. `cargo test` — Rust workspace
5. `cd apps/detector && pytest -m "not slow and not hardware"` — Python (fast)

**Gate 4: Type Safety**

1. `pnpm typecheck` — TypeScript
2. `cd apps/detector && mypy src/` — Python (continue-on-error)

**Gate 5: Git Cleanliness**

1. No uncommitted changes
2. Branch is up to date with remote
3. No merge conflicts

## Output Format

```text
Gate 1: Build         PASS/FAIL
Gate 2: Lint          PASS/FAIL
Gate 3: Tests         PASS/FAIL (X passed, Y failed)
Gate 4: Type Safety   PASS/FAIL
Gate 5: Git Clean     PASS/FAIL

Overall: READY / NOT READY
```

If any gate fails, report the specific errors and offer to fix them.
