# Discover

Scan the codebase for health issues, TODOs, stubs, and quality gaps.

Arguments: $ARGUMENTS

If an argument is provided, scope the scan to that app or area. If no argument
is provided, scan the entire workspace.

## Scan Categories

Run each check and collect results:

**1. Build Health:**

1. `pnpm build 2>&1 | tail -20` — JS/TS build status
2. `cargo check 2>&1 | tail -20` — Rust build status

**2. TODO/FIXME/HACK Comments:**

Search for `TODO`, `FIXME`, `HACK`, `XXX`, `STUB` across all source files.
Group by app/crate and count per category.

**3. Test Coverage Gaps:**

Identify source files without corresponding test files:
- `src/**/*.ts` without `__tests__/**/*.test.ts`
- `src/**/*.rs` without `tests/` or inline `#[cfg(test)]`
- `src/**/*.py` without `tests/`

**4. Dependency Health:**

1. `pnpm outdated 2>&1 | head -30` — Outdated JS packages
2. `cargo outdated 2>&1 | head -30` — Outdated Rust crates (if available)

**5. Security Quick Scan:**

1. Check for `.env` files tracked in git
2. Search for hardcoded URLs containing `password`, `token`, `secret`, `key`
3. `pnpm audit --audit-level moderate 2>&1 | tail -10`

**6. Dead Code:**

Search for unused exports, unreferenced files, and orphan components.

## Output Format

```text
## Codebase Health Report

### Build: PASS/FAIL
### TODOs: N items (breakdown by category)
### Test Gaps: N files without tests
### Dependencies: N outdated
### Security: N findings
### Dead Code: N candidates

### Grade: A-F (A = clean, F = critical issues)
```

Provide a prioritized action list of the top 10 items to fix.
