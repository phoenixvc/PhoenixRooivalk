# Agent Teams — PhoenixRooivalk

## Overview

27 specialist agents organized into 10 code teams and 6 workflow agents. Teams
execute in 4 phases respecting the dependency direction: Backend -> Frontend ->
Product -> Quality.

## Code Teams

### Team 1: BACKEND (Rust Core)

| Agent                             | Role                                          |
| --------------------------------- | --------------------------------------------- |
| `engineering/rust-specialist`     | Axum API, SQLx, blockchain crates             |
| `engineering/evidence-specialist` | Evidence hashing, anchoring, chain-of-custody |

**Scope**: `apps/api/`, `apps/keeper/`, `apps/evidence-cli/`, `crates/`

**Outstanding work**:

- `apps/api/src/handlers_x402.rs:360` — HSM-backed attestation (TODO)
- `apps/keeper/src/batch_anchor.rs` — Not exported from lib.rs (WIP)
- `apps/evidence-cli/` — No test directory exists
- Missing `.env.example` for `apps/api/` and `apps/keeper/`

### Team 2: FRONTEND (Web + WASM)

| Agent                             | Role                          |
| --------------------------------- | ----------------------------- |
| `engineering/frontend-specialist` | Next.js, Docusaurus, Leptos   |
| `engineering/rapid-prototyper`    | Game engine, WASM experiments |

**Scope**: `apps/marketing/`, `apps/docs/`, `apps/threat-simulator-desktop/`,
`packages/`

**Outstanding work**:

- `apps/marketing/src/app/preorder/page.tsx:67` — Backend API call (TODO)
- `apps/threat-simulator-desktop/src-tauri/src/main.rs:98` — Evidence
  integration (TODO)
- `apps/threat-simulator-desktop/src-tauri/src/main.rs:233` — Evidence saving
  placeholder
- Marketing test coverage: ~11 tests for 164 source files

### Team 3: PYTHON (Detector + ML)

| Agent                           | Role                           |
| ------------------------------- | ------------------------------ |
| `engineering/python-specialist` | Detector app, edge ML pipeline |

**Scope**: `apps/detector/`, `tools/pdf_generator/`

**Outstanding work**:

- `apps/detector/src/multi_camera.py:310` — Camera fusion handoff (TODO)
- mypy type errors (CI runs with `continue-on-error`)
- Integration tests soft-fail in CI

### Team 4: DEVOPS (CI/CD + Infra)

| Agent                            | Role                                 |
| -------------------------------- | ------------------------------------ |
| `engineering/devops`             | GitHub Actions, Azure, Terraform     |
| `operations/dependency-watcher`  | Dependabot triage, cargo audit, SBOM |
| `operations/environment-manager` | .env.example files, env validation   |

**Scope**: `.github/workflows/`, `infra/`, `scripts/`, `config/`,
`.github/dependabot.yml`, `.env.example` files

**Outstanding work**:

- `.github/workflows/ci-rust.yml:32` — Cargo audit disabled (TODO)
- `.github/workflows/detector-ci.yml:50` — mypy continue-on-error (TODO)
- 2 disabled workflows (legacy Netlify deployments)
- No Rust/JS coverage reporting in CI
- Missing staging environment for Terraform ML training
- Missing `.env.example` for api, keeper, detector (ENV-001/002/003)
- 15 Dependabot vulnerability alerts unresolved

### Team 5: PRODUCT

| Agent                     | Role                              |
| ------------------------- | --------------------------------- |
| `product/product-manager` | Product catalog, phases, features |
| `product/product-pricer`  | Pricing, BOMs, margins            |
| `product/roadmap-tracker` | Milestones, phase transitions     |

**Scope**: `apps/marketing/src/data/products.ts`, `apps/docs/src/data/`
(values.ts, pricing.ts, market.ts, competitors.ts), timeline/schedule/sbir
pages, CHANGELOG.md, ADRs

**Outstanding work**:

- Pricing consistency audit across 3 sources (products.ts vs pricing.ts vs x402)
- Phase tracking: verify all 24 products have accurate phase assignments
- Missing ADRs for recent architectural decisions
- Pricing drift: products.ts per-SKU prices vs pricing.ts segment prices
  (PRD-004)
- BOM data is aggregate COGS — no component-level breakdown (FIN-003)
- SBIR page placeholder — compliance tracking not functional (PRD-008)

### Team 6: DESIGN

| Agent                   | Role                                   |
| ----------------------- | -------------------------------------- |
| `design/brand-guardian` | Theme system, design tokens, brand     |
| `design/ui-designer`    | Components, CSS Modules, accessibility |

**Scope**: `packages/ui/`, `apps/marketing/src/components/ui/`,
`apps/marketing/tailwind.config.js`, theme contexts

**Outstanding work**:

- Accessibility audit across all interactive components
- Theme consistency verification (3 themes x all components)
- Design token coverage: verify all components use tokens, not arbitrary values

### Team 7: MARKETING

| Agent                          | Role                                     |
| ------------------------------ | ---------------------------------------- |
| `marketing/content-strategist` | SEO, content, dual-brand voice           |
| `marketing/growth-analyst`     | Analytics, conversion, A/B testing       |
| `marketing/market-finder`      | Opportunities, competitors, partnerships |

**Scope**: `apps/marketing/src/components/sections/`, analytics, SEO, case
studies, competitive analysis

**Outstanding work**:

- SEO audit: verify all 16+ pages have OG metadata and canonical URLs
- Analytics event coverage: map all user interactions to tracked events
- Case study data: quantifiable outcomes for all entries
- Market segment gap analysis

### Team 8: FINANCE

| Agent                        | Role                       |
| ---------------------------- | -------------------------- |
| `operations/finance-tracker` | Cart, ROI, x402 payments   |
| `operations/finance-builder` | Financial page development |

**Scope**: Financial page, ROI calculator, preorder, cart, x402 crate,
`apps/docs/src/data/` (pricing.ts, values.ts for revenue projections)

**Outstanding work**:

- Preorder backend integration (TODO at page.tsx:67)
- x402 legal attestation tier (not yet available)
- ROI calculator page is stub — wrapper only, no content (PRD-005)
- Unit economics page missing — CAC/LTV data exists but no UI (PRD-006)
- Cart doesn't handle recurring vs one-time purchases (PRD-007)
- Competitor pricing comparison page — data exists, no frontend (FIN-001)
- Revenue projection calculator — numbers hardcoded in values.ts (FIN-002)
- ROI calculator assumption validation
- Cart edge case testing

### Team 9: DOCUMENTATION

| Agent                    | Role                            |
| ------------------------ | ------------------------------- |
| `operations/doc-checker` | Validates accuracy and coverage |
| `operations/doc-updater` | Keeps docs in sync with code    |

**Scope**: `apps/docs/`, CLAUDE.md files, README.md, CHANGELOG.md, ADRs,
`.github/*.md`

**Outstanding work**:

- Missing `.env.example` for api and keeper apps
- Stale content audit (docs vs actual code)
- ADR backlog: decisions made without ADRs filed
- CLAUDE.md accuracy verification after code changes

### Team 10: QUALITY + SECURITY

| Agent                                | Role                                         |
| ------------------------------------ | -------------------------------------------- |
| `testing/api-tester`                 | API endpoint testing                         |
| `testing/test-analyzer`              | Cross-stack test analysis, quality gates     |
| `testing/coverage-tracker`           | Coverage aggregation, threshold enforcement  |
| `testing/integration-tester`         | Cross-app E2E and contract testing           |
| `operations/security-auditor`        | OWASP, ITAR, compliance, dependency scanning |
| `project-management/project-shipper` | CI/CD orchestration                          |
| `project-management/release-manager` | Versioning, changelogs, release notes        |

**Scope**: All test suites, coverage metrics, security scanning, release
management, cross-app integration

**Outstanding work**:

- evidence-cli: zero test coverage
- anchor-solana: no tests, orphan provider_tests.rs (SOL-001)
- x402 crate: no dedicated test files
- address-validation crate: no dedicated test files
- Career application endpoint: minimal test coverage
- Cargo audit re-enablement (blocked on CVSS 4.0 support)
- No cross-app integration tests (API+Keeper, API+Marketing)
- No Rust coverage collection in CI
- Only detector uploads to Codecov (JS/TS coverage not tracked)
- No automated changelog generation or version bumping

## Workflow Agents

| #   | Agent          | Command                   | Purpose                       |
| --- | -------------- | ------------------------- | ----------------------------- |
| W1  | Discover       | `/project:discover`       | Codebase health scan          |
| W2  | Healthcheck    | `/project:healthcheck`    | Pre-flight validation         |
| W3  | Review         | `/project:review`         | Code review                   |
| W4  | Review PR      | `/project:review-pr`      | GitHub PR review              |
| W5  | Security Audit | `/project:security-audit` | Full security scan            |
| W6  | Migrate        | `/project:migrate`        | Database migration management |

## Execution Phases

### Phase 1: Foundation (Teams 1, 3, 4)

Backend core, Python detector, and CI/CD. These have no upstream dependencies.

- Team 1 (Backend): Fix TODOs, add env examples, export batch anchor
- Team 3 (Python): Fix mypy errors, complete camera fusion
- Team 4 (DevOps): Re-enable cargo audit, fix CI soft-failures

### Phase 2: Frontend + Product (Teams 2, 5, 8)

Depends on backend API being stable.

- Team 2 (Frontend): Preorder integration, evidence persistence, tests
- Team 5 (Product): Pricing audit, phase verification, ADR backlog
- Team 8 (Finance): ROI validation, cart testing, x402 attestation

### Phase 3: Quality + Content (Teams 6, 7, 9, 10)

Depends on features being implemented.

- Team 6 (Design): Accessibility audit, theme consistency, token coverage
- Team 7 (Marketing): SEO audit, analytics coverage, market analysis
- Team 9 (Docs): Sync all docs with code, fill coverage gaps
- Team 10 (Quality): Test coverage, security scan, release readiness

### Phase 4: Final Sweep (Teams 4, 9, 10)

Regression check and documentation finalization.

- Team 4 (DevOps): CI pipeline verification, deployment dry-run
- Team 9 (Docs): Final accuracy check, CHANGELOG update
- Team 10 (Quality): Full healthcheck, release sign-off

## Launching Agents

**Recommended**: Use `/project:orchestrate` for coordinated execution.

**Manual**: Run team-specific work by scoping the review command:

```bash
/project:review apps/api      # Team 1 scope
/project:review apps/marketing # Team 2 scope
/project:discover              # Workflow agent W1
/project:healthcheck           # Workflow agent W2
```
