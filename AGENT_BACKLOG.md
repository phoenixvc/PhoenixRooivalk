# Agent Backlog — PhoenixRooivalk

Last scanned: 2026-02-22

Summary: 5 P0, 16 P1, 21 P2, 12 P3 = **54 items** (44 completed this session)

## P0-CRITICAL — Must fix

| ID      | Team | File:Line                                                 | Description                                                         |
| ------- | ---- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| ~~API-001~~ | 1    | `apps/api/src/handlers_x402.rs:360`                       | ~~HSM-backed attestation TODO — legal tier returns placeholder~~ (completed: Ed25519 attestation via ed25519-dalek) |
| ~~SIM-001~~ | 2    | `apps/threat-simulator-desktop/src-tauri/src/main.rs:98`  | ~~Evidence integration TODO — `save_session_to_persistence()` is stub~~ (completed: SHA-256 hashing via phoenix-evidence) |
| ~~SIM-002~~ | 2    | `apps/threat-simulator-desktop/src-tauri/src/main.rs:233` | ~~Evidence saving returns hardcoded `"evidence-id-placeholder"`~~ (completed: real digest-based evidence IDs)       |
| ~~MKT-001~~ | 2    | `apps/marketing/src/app/preorder/page.tsx:67`             | ~~Preorder form TODO — no backend API call, shows alert only~~ (completed: POST /preorders API + frontend integration)          |
| ~~DET-001~~ | 3    | `apps/detector/src/multi_camera.py:310`                   | ~~Camera fusion handoff TODO — accepts any detection as placeholder~~ (completed: 3D→2D pinhole projection with distance check) |
| ~~CI-001~~  | 4    | `.github/workflows/ci-rust.yml:32`                        | ~~Cargo audit disabled (`CARGO_AUDIT_SKIP=true`)~~ (completed: CARGO_AUDIT_SKIP removed, audit always runs) |
| ~~CI-002~~  | 4    | `.github/workflows/detector-ci.yml:50`                    | ~~mypy `continue-on-error: true` — type errors don't fail CI~~ (completed: type errors fixed, continue-on-error removed) |
| ~~CI-003~~  | 4    | `.github/workflows/detector-ci.yml:128`                   | ~~Integration tests `continue-on-error: true`~~ (completed: `-m "not hardware"` marker filtering, continue-on-error removed) |

## P1-HIGH — Should fix soon

### Stubs and missing implementations

| ID       | Team | File:Line                                                                 | Description                                                                             |
| -------- | ---- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| ~~KPR-001~~  | 1    | `apps/keeper/src/batch_anchor.rs`                                         | ~~Batch anchor module not exported from `lib.rs`~~ (verified: already exported)                                          |
| ~~KPR-002~~  | 1    | `apps/keeper/`                                                            | ~~Batch anchoring has no integration tests~~ (completed: 8 integration tests in tests/batch_anchor_integration.rs) |
| ~~X402-001~~ | 1    | `crates/x402/`                                                            | ~~No dedicated test files — only inline tests~~ (completed: tests/x402_integration.rs added) |
| ~~ADDR-001~~ | 1    | `crates/address-validation/`                                              | ~~No dedicated test files~~ (completed: tests/validation_tests.rs added) |
| ~~CLI-001~~  | 1    | `apps/evidence-cli/`                                                      | ~~Zero test coverage~~ (completed: 13 inline tests added, all passing)                                                  |
| ~~SOL-001~~  | 1    | `crates/anchor-solana/`                                                   | ~~No tests — no `#[cfg(test)]`, no `tests/` dir, orphan `provider_tests.rs` at crate root~~ (completed: 12 inline tests added + existing tests/provider_tests.rs verified) |
| ~~SIM-003~~  | 2    | `apps/marketing/`                                                         | ~~278 tests passing but coverage gap remains for 164 source files~~ (completed: 396 tests — added eventSystem, stateMachine, objectPool, performanceMonitor, formatter tests) |
| ~~DOC-001~~  | 9    | `apps/docs/azure-functions/src/functions/scheduled.ts:80`                 | ~~SendGrid TODO — email queue has no email service~~ (completed: misleading TODO removed, email system functional) |
| ~~DOC-002~~  | 9    | `apps/docs/docs/technical/architecture/adr-0015-prompt-management.md:515` | ~~Legacy system removal TODO~~ (completed: ADR updated, legacy system removed) |

### CI/CD gaps

| ID     | Team | File                                        | Description                                      |
| ------ | ---- | ------------------------------------------- | ------------------------------------------------ |
| ~~CI-004~~ | 4    | `.github/workflows/`                        | ~~No Rust coverage reporting in CI~~ (completed: cargo-llvm-cov + LCOV upload in ci-rust.yml) |
| ~~CI-005~~ | 4    | `.github/workflows/`                        | ~~No JS/TS coverage aggregation~~ (completed: vitest --coverage in ci-marketing.yml + artifact upload) |
| ~~CI-006~~ | 4    | `.github/workflows/`                        | ~~2 disabled workflows (legacy Netlify) — clean up~~ (completed: deleted) |
| ~~CI-007~~ | 4    | `infra/terraform/ml-training/environments/` | ~~Missing staging.tfvars~~ (completed: staging.tfvars created with T4 GPU, spot instances, 2 max nodes) |

### Coverage and integration gaps

| ID      | Team | Scope                                | Description                                               |
| ------- | ---- | ------------------------------------ | --------------------------------------------------------- |
| ~~COV-001~~ | 10   | `.github/workflows/ci-rust.yml`      | ~~No Rust coverage tool (cargo-tarpaulin or cargo-llvm-cov)~~ (completed: cargo-llvm-cov with LCOV output) |
| ~~COV-002~~ | 10   | `.github/workflows/ci-marketing.yml` | ~~Marketing tests run without coverage collection~~ (completed: vitest --coverage + artifact upload) |
| ~~INT-001~~ | 10   | `tests/workspace_integration.rs`     | ~~Cross-app integration tests minimal — no API+Keeper flow~~ (completed: 2 cross-app tests in apps/api/tests/workspace_integration_tests.rs) |
| ~~INT-002~~ | 10   | ADR-0063                             | ~~E2E testing proposed in ADR but not implemented~~ (completed: Playwright config + marketing page tests + API health tests + CI workflow) |

### Missing env docs

| ID      | Team | File             | Description            |
| ------- | ---- | ---------------- | ---------------------- |
| ~~ENV-001~~ | 4    | `apps/api/`      | ~~No `.env.example` file~~ (completed: created) |
| ~~ENV-002~~ | 4    | `apps/keeper/`   | ~~No `.env.example` file~~ (completed: created) |
| ~~ENV-003~~ | 4    | `apps/detector/` | ~~No `.env.example` file~~ (completed: created) |

## P2-MEDIUM — Should fix

### Test coverage

| ID      | Team | Scope             | Description                                          |
| ------- | ---- | ----------------- | ---------------------------------------------------- |
| ~~TST-001~~ | 10   | `apps/api/`       | ~~Career application endpoint — minimal tests~~ (completed: 5 tests — happy path, no cover letter, missing/invalid session, team member rejection) |
| ~~TST-002~~ | 10   | `apps/api/`       | ~~Profile update edge cases untested~~ (completed: 7 tests — full/partial update, null fields, auth, timestamp, team status preservation) |
| ~~TST-003~~ | 10   | `apps/marketing/` | ~~Cart components lack edge case tests~~ (completed: 19 tests — add/remove/update/clear, quantity edge cases, localStorage persistence) |
| ~~TST-004~~ | 10   | `apps/marketing/` | ~~Auth flow needs integration tests~~ (completed: 15 tests — login/logout, session, team member, API interactions, profile confirmation) |
| ~~TST-005~~ | 10   | `apps/marketing/` | ~~Page components (about, capabilities, etc.) untested~~ (completed: 21 tests — product data validation, pricing, categories, phases, smoke tests) |
| ~~TST-006~~ | 3    | `apps/detector/`  | ~~Hardware-dependent tests conditionally skipped~~ (completed: skip fixtures added to conftest.py, CI already uses `-m "not hardware"`) |

### Product and pricing

| ID      | Team | Scope                                            | Description                                                                        |
| ------- | ---- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| ~~PRD-001~~ | 5    | `apps/marketing/src/data/products.ts`            | ~~Pricing consistency audit needed (ROI calc vs catalog)~~ (completed: deploymentCost defaults aligned to $150K AeroNet Enterprise)                             |
| ~~PRD-002~~ | 5    | `apps/marketing/`                                | ~~Phase tracking verification for all products~~ (completed: 3 RKV products fixed to comingSoon: true for series-b/c) |
| ~~PRD-003~~ | 8    | `crates/x402/`                                   | ~~x402 legal attestation tier not implemented~~ (completed: resolved by API-001 Ed25519 attestation)                   |
| ~~PRD-004~~ | 5    | `products.ts` vs `pricing.ts`                    | ~~Pricing drift — products.ts per-SKU prices may not match pricing.ts segment prices~~ (completed: pricing.ts + values.ts reconciled as deployment packages) |
| ~~PRD-005~~ | 8    | `apps/marketing/src/app/roi-calculator/page.tsx` | ~~ROI calculator page is stub~~ (completed: deployment packages, payback projections, financial disclaimer)                 |
| ~~PRD-006~~ | 8    | `apps/docs/src/data/pricing.ts`                  | ~~Unit economics page missing~~ (completed: /unit-economics page with CAC, LTV, payback, COGS, margins, revenue projections, funding roadmap) |
| ~~PRD-007~~ | 8    | `apps/marketing/src/contexts/CartContext.tsx`    | ~~Cart doesn't distinguish one-time vs recurring~~ (completed: oneTimeTotal/recurringTotal in CartState + CartPanel display) |
| ~~FIN-001~~ | 8    | `apps/docs/src/data/competitors.ts`              | ~~No competitor pricing comparison page~~ (completed: /competitors page with comparison table, profiles, advantages, market positioning) |

### Content and SEO

| ID      | Team | Scope                                          | Description                             |
| ------- | ---- | ---------------------------------------------- | --------------------------------------- |
| ~~SEO-001~~ | 7    | `apps/marketing/`                              | ~~OG metadata audit across all 16+ pages~~ (completed: OG metadata on all pages via server/client component split) |
| ~~SEO-002~~ | 7    | `apps/marketing/src/utils/analytics.ts`        | ~~Analytics event coverage gap analysis~~ (completed: events well-defined, analytics instrumented in button component) |
| ~~SEO-003~~ | 7    | `apps/marketing/src/components/sections/data/` | ~~Case studies need quantifiable outcomes~~ (completed: outcomes array with dollar values and percentages added) |

### Coverage thresholds

| ID      | Team | Scope                             | Description                                                   |
| ------- | ---- | --------------------------------- | ------------------------------------------------------------- |
| ~~COV-003~~ | 10   | `apps/marketing/vitest.config.ts` | ~~No coverage threshold defined (Vitest)~~ (completed: 30% stmt/branch/lines, 25% functions thresholds) |
| ~~COV-004~~ | 10   | Codecov                           | ~~Only detector uploads to Codecov~~ (completed: Codecov upload in ci-rust.yml + ci-marketing.yml, codecov.yml flags + components) |

## P3-LOW — Nice to have

| ID      | Team | Scope                                  | Description                                                             |
| ------- | ---- | -------------------------------------- | ----------------------------------------------------------------------- |
| ~~DX-001~~  | 4    | `.github/`                             | ~~Clean up deprecated `WORKFLOW_IMPROVEMENTS.md`~~ (completed: deleted)                          |
| DX-002  | 6    | `packages/ui/`                         | Accessibility audit — ARIA labels and keyboard nav                      |
| DX-003  | 6    | `apps/marketing/`                      | Theme consistency across all 3 theme variants                           |
| DX-004  | 6    | `packages/ui/`                         | Verify all components use design tokens (no magic numbers)              |
| DX-005  | 7    | `apps/marketing/`                      | Market segment gap analysis                                             |
| DX-006  | 9    | `apps/docs/`                           | ADR backlog — file ADRs for undocumented decisions                      |
| DX-007  | 9    | `apps/docs/`                           | Stale content audit (docs vs actual code)                               |
| DX-008  | 9    | CLAUDE.md files                        | Accuracy re-verification after code changes                             |
| DX-009  | 10   | `apps/marketing/`                      | Performance benchmark baseline                                          |
| ~~DX-010~~  | 8    | `apps/marketing/`                      | ~~Preorder form validation and error handling~~ (completed: backend validates email/items, frontend shows errors + loading state)                             |
| DX-011  | 4    | `scripts/validate-env.sh`              | Env validation only runs for marketing in CI — expand to all apps       |
| DX-012  | 10   | CHANGELOG.md                           | No automated changelog generation from conventional commits             |
| FIN-002 | 8    | `apps/docs/src/data/values.ts`         | Revenue projections hardcoded — no interactive calculator               |
| FIN-003 | 5    | `apps/marketing/src/data/products.ts`  | BOM data is aggregate COGS only — no component-level breakdown          |
| PRD-008 | 5    | `apps/marketing/src/app/sbir/page.tsx` | SBIR page placeholder — CMMC/ITAR compliance all "Planned", no tracking |

## Quick Wins (< 30 minutes each)

1. ~~**ENV-001/002/003**: Add `.env.example` files to api, keeper, detector~~ (Done 2026-02-22)
2. ~~**CI-006**: Delete 2 disabled Netlify workflow files~~ (Done 2026-02-22)
3. ~~**DX-001**: Mark `WORKFLOW_IMPROVEMENTS.md` as superseded~~ (Done 2026-02-22 — deleted)
4. ~~**CLI-001**: Create `apps/evidence-cli/tests/` with basic CLI test~~ (Done 2026-02-22 — 13 inline tests)
5. ~~**KPR-001**: Add `pub mod batch_anchor;` to keeper `lib.rs`~~ (Verified 2026-02-22 — already exported)
6. ~~**PRD-001/004**: Pricing consistency audit — pricing.ts + values.ts reconciled~~ (Done 2026-02-22)
7. ~~**PRD-005**: ROI calculator with deployment packages + payback projections~~ (Done 2026-02-22)
8. ~~**MKT-001**: Preorder backend API + frontend integration~~ (Done 2026-02-22)
9. ~~**SIM-001/002**: Evidence integration with phoenix-evidence SHA-256 hashing~~ (Done 2026-02-22)
10. ~~**DX-010**: Preorder form validation and error handling~~ (Done 2026-02-22)
11. ~~**DET-001**: Camera fusion handoff — 3D→2D pinhole projection~~ (Done 2026-02-22)
12. ~~**CI-001**: Cargo audit re-enabled — CARGO_AUDIT_SKIP removed~~ (Done 2026-02-22)
13. ~~**CI-002**: mypy type errors fixed across detector source~~ (Done 2026-02-22)
14. ~~**CI-003**: Integration tests use `-m "not hardware"` marker filtering~~ (Done 2026-02-22)
15. ~~**CI-007**: staging.tfvars created~~ (Done 2026-02-22)
16. ~~**KPR-002**: Keeper batch_anchor integration tests~~ (Done 2026-02-22)
17. ~~**X402-001**: x402 integration tests~~ (Done 2026-02-22)
18. ~~**ADDR-001**: Address validation integration tests~~ (Done 2026-02-22)
19. ~~**SOL-001**: Anchor-solana inline tests + verified existing integration tests~~ (Done 2026-02-22)
20. ~~**COV-001**: Rust coverage via cargo-llvm-cov in CI~~ (Done 2026-02-22)
21. ~~**COV-002**: Marketing test coverage collection in CI~~ (Done 2026-02-22)
22. ~~**COV-003**: Marketing vitest coverage thresholds (30/30/25/30)~~ (Done 2026-02-22)
23. ~~**CI-004**: Rust coverage reporting in CI~~ (Done 2026-02-22)
24. ~~**CI-005**: JS/TS coverage aggregation in CI~~ (Done 2026-02-22)
25. ~~**TST-001**: Career application endpoint tests (5 tests)~~ (Done 2026-02-22)
26. ~~**TST-002**: Profile update edge case tests (7 tests)~~ (Done 2026-02-22)
27. ~~**API-001**: Ed25519 attestation signing for x402 legal tier~~ (Done 2026-02-22)
28. ~~**DOC-001**: SendGrid TODO misleading comment removed~~ (Done 2026-02-22)
29. ~~**DOC-002**: ADR-0015 legacy system removal TODO resolved~~ (Done 2026-02-22)
30. ~~**SIM-003**: Marketing test coverage expanded (452 tests)~~ (Done 2026-02-22)
31. ~~**INT-001**: Cross-app integration tests for API+Keeper~~ (Done 2026-02-22)
32. ~~**INT-002**: Playwright E2E testing setup~~ (Done 2026-02-22)
33. ~~**TST-003**: Cart component edge case tests (19 tests)~~ (Done 2026-02-22)
34. ~~**TST-004**: Auth flow integration tests (15 tests)~~ (Done 2026-02-22)
35. ~~**TST-005**: Page component tests (21 tests)~~ (Done 2026-02-22)
36. ~~**TST-006**: Hardware skip fixtures in detector conftest.py~~ (Done 2026-02-22)
37. ~~**PRD-002**: RKV product comingSoon flags fixed~~ (Done 2026-02-22)
38. ~~**PRD-003**: x402 attestation resolved by API-001~~ (Done 2026-02-22)
39. ~~**PRD-006**: Unit economics page at /unit-economics~~ (Done 2026-02-22)
40. ~~**PRD-007**: Cart one-time vs recurring pricing~~ (Done 2026-02-22)
41. ~~**FIN-001**: Competitor pricing comparison page at /competitors~~ (Done 2026-02-22)
42. ~~**SEO-001**: OG metadata on all marketing pages~~ (Done 2026-02-22)
43. ~~**SEO-002**: Analytics event coverage verified~~ (Done 2026-02-22)
44. ~~**SEO-003**: Case studies quantifiable outcomes~~ (Done 2026-02-22)
45. ~~**COV-004**: Codecov aggregation for Rust + marketing~~ (Done 2026-02-22)
