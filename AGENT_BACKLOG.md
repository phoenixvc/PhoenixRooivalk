# Agent Backlog — PhoenixRooivalk

Last scanned: 2026-02-20

Summary: 8 P0, 20 P1, 24 P2, 15 P3 = **67 items**

## P0-CRITICAL — Must fix

| ID | Team | File:Line | Description |
|----|------|-----------|-------------|
| API-001 | 1 | `apps/api/src/handlers_x402.rs:360` | HSM-backed attestation TODO — legal tier returns placeholder |
| SIM-001 | 2 | `apps/threat-simulator-desktop/src-tauri/src/main.rs:98` | Evidence integration TODO — `save_session_to_persistence()` is stub |
| SIM-002 | 2 | `apps/threat-simulator-desktop/src-tauri/src/main.rs:233` | Evidence saving returns hardcoded `"evidence-id-placeholder"` |
| MKT-001 | 2 | `apps/marketing/src/app/preorder/page.tsx:67` | Preorder form TODO — no backend API call, shows alert only |
| DET-001 | 3 | `apps/detector/src/multi_camera.py:310` | Camera fusion handoff TODO — accepts any detection as placeholder |
| CI-001 | 4 | `.github/workflows/ci-rust.yml:32` | Cargo audit disabled (`CARGO_AUDIT_SKIP=true`) |
| CI-002 | 4 | `.github/workflows/detector-ci.yml:50` | mypy `continue-on-error: true` — type errors don't fail CI |
| CI-003 | 4 | `.github/workflows/detector-ci.yml:128` | Integration tests `continue-on-error: true` |

## P1-HIGH — Should fix soon

### Stubs and missing implementations

| ID | Team | File:Line | Description |
|----|------|-----------|-------------|
| KPR-001 | 1 | `apps/keeper/src/batch_anchor.rs` | Batch anchor module not exported from `lib.rs` |
| KPR-002 | 1 | `apps/keeper/` | Batch anchoring has no integration tests |
| X402-001 | 1 | `crates/x402/` | No dedicated test files — only inline tests |
| ADDR-001 | 1 | `crates/address-validation/` | No dedicated test files |
| CLI-001 | 1 | `apps/evidence-cli/` | Zero test coverage — no test directory |
| SOL-001 | 1 | `crates/anchor-solana/` | No tests — no `#[cfg(test)]`, no `tests/` dir, orphan `provider_tests.rs` at crate root |
| SIM-003 | 2 | `apps/marketing/` | ~11 tests for 164 source files — major gap |
| DOC-001 | 9 | `apps/docs/azure-functions/src/functions/scheduled.ts:80` | SendGrid TODO — email queue has no email service |
| DOC-002 | 9 | `apps/docs/docs/technical/architecture/adr-0015-prompt-management.md:515` | Legacy system removal TODO |

### CI/CD gaps

| ID | Team | File | Description |
|----|------|------|-------------|
| CI-004 | 4 | `.github/workflows/` | No Rust coverage reporting in CI |
| CI-005 | 4 | `.github/workflows/` | No JS/TS coverage aggregation |
| CI-006 | 4 | `.github/workflows/` | 2 disabled workflows (legacy Netlify) — clean up |
| CI-007 | 4 | `infra/terraform/ml-training/environments/` | Missing staging.tfvars |

### Coverage and integration gaps

| ID | Team | Scope | Description |
|----|------|-------|-------------|
| COV-001 | 10 | `.github/workflows/ci-rust.yml` | No Rust coverage tool (cargo-tarpaulin or cargo-llvm-cov) |
| COV-002 | 10 | `.github/workflows/ci-marketing.yml` | Marketing tests run without coverage collection |
| INT-001 | 10 | `tests/workspace_integration.rs` | Cross-app integration tests minimal — no API+Keeper flow |
| INT-002 | 10 | ADR-0063 | E2E testing proposed in ADR but not implemented |

### Missing env docs

| ID | Team | File | Description |
|----|------|------|-------------|
| ENV-001 | 4 | `apps/api/` | No `.env.example` file |
| ENV-002 | 4 | `apps/keeper/` | No `.env.example` file |
| ENV-003 | 4 | `apps/detector/` | No `.env.example` file |

## P2-MEDIUM — Should fix

### Test coverage

| ID | Team | Scope | Description |
|----|------|-------|-------------|
| TST-001 | 10 | `apps/api/` | Career application endpoint — minimal tests |
| TST-002 | 10 | `apps/api/` | Profile update edge cases untested |
| TST-003 | 10 | `apps/marketing/` | Cart components lack edge case tests |
| TST-004 | 10 | `apps/marketing/` | Auth flow needs integration tests |
| TST-005 | 10 | `apps/marketing/` | Page components (about, capabilities, etc.) untested |
| TST-006 | 3 | `apps/detector/` | Hardware-dependent tests conditionally skipped |

### Product and pricing

| ID | Team | Scope | Description |
|----|------|-------|-------------|
| PRD-001 | 5 | `apps/marketing/src/data/products.ts` | Pricing consistency audit needed (ROI calc vs catalog) |
| PRD-002 | 5 | `apps/marketing/` | Phase tracking verification for all products |
| PRD-003 | 8 | `crates/x402/` | x402 legal attestation tier not implemented |
| PRD-004 | 5 | `products.ts` vs `pricing.ts` | Pricing drift — products.ts per-SKU prices may not match pricing.ts segment prices |
| PRD-005 | 8 | `apps/marketing/src/app/roi-calculator/page.tsx` | ROI calculator page is stub (wrapper only, no projections content) |
| PRD-006 | 8 | `apps/docs/src/data/pricing.ts` | Unit economics page missing — CAC/LTV/payback data exists but no UI |
| PRD-007 | 8 | `apps/marketing/src/contexts/CartContext.tsx` | Cart doesn't distinguish one-time vs recurring (monthlyFee) purchases |
| FIN-001 | 8 | `apps/docs/src/data/competitors.ts` | No competitor pricing comparison page — data exists, no frontend |

### Content and SEO

| ID | Team | Scope | Description |
|----|------|-------|-------------|
| SEO-001 | 7 | `apps/marketing/` | OG metadata audit across all 16+ pages |
| SEO-002 | 7 | `apps/marketing/src/utils/analytics.ts` | Analytics event coverage gap analysis |
| SEO-003 | 7 | `apps/marketing/src/components/sections/data/` | Case studies need quantifiable outcomes |

### Coverage thresholds

| ID | Team | Scope | Description |
|----|------|-------|-------------|
| COV-003 | 10 | `apps/marketing/vitest.config.ts` | No coverage threshold defined (Vitest) |
| COV-004 | 10 | Codecov | Only detector uploads to Codecov — JS/TS and Rust not tracked |

## P3-LOW — Nice to have

| ID | Team | Scope | Description |
|----|------|-------|-------------|
| DX-001 | 4 | `.github/` | Clean up deprecated `WORKFLOW_IMPROVEMENTS.md` |
| DX-002 | 6 | `packages/ui/` | Accessibility audit — ARIA labels and keyboard nav |
| DX-003 | 6 | `apps/marketing/` | Theme consistency across all 3 theme variants |
| DX-004 | 6 | `packages/ui/` | Verify all components use design tokens (no magic numbers) |
| DX-005 | 7 | `apps/marketing/` | Market segment gap analysis |
| DX-006 | 9 | `apps/docs/` | ADR backlog — file ADRs for undocumented decisions |
| DX-007 | 9 | `apps/docs/` | Stale content audit (docs vs actual code) |
| DX-008 | 9 | CLAUDE.md files | Accuracy re-verification after code changes |
| DX-009 | 10 | `apps/marketing/` | Performance benchmark baseline |
| DX-010 | 8 | `apps/marketing/` | Preorder form validation and error handling |
| DX-011 | 4 | `scripts/validate-env.sh` | Env validation only runs for marketing in CI — expand to all apps |
| DX-012 | 10 | CHANGELOG.md | No automated changelog generation from conventional commits |
| FIN-002 | 8 | `apps/docs/src/data/values.ts` | Revenue projections hardcoded — no interactive calculator |
| FIN-003 | 5 | `apps/marketing/src/data/products.ts` | BOM data is aggregate COGS only — no component-level breakdown |
| PRD-008 | 5 | `apps/marketing/src/app/sbir/page.tsx` | SBIR page placeholder — CMMC/ITAR compliance all "Planned", no tracking |

## Quick Wins (< 30 minutes each)

1. **ENV-001/002/003**: Add `.env.example` files to api, keeper, detector
2. **CI-006**: Delete 2 disabled Netlify workflow files
3. **DX-001**: Mark `WORKFLOW_IMPROVEMENTS.md` as superseded
4. **CLI-001**: Create `apps/evidence-cli/tests/` with basic CLI test
5. **KPR-001**: Add `pub mod batch_anchor;` to keeper `lib.rs`
