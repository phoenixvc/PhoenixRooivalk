# PhoenixRooivalk

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Docusaurus](https://img.shields.io/badge/Docusaurus-2CA5E0?logo=docusaurus&logoColor=white)](https://docusaurus.io/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turbo](https://img.shields.io/badge/Turbo-5C4EE5?logo=turbo&logoColor=white)](https://turbo.build/)
[![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)](https://netlify.com/)
[![Netlify Status](https://api.netlify.com/api/v1/badges/d93acd89-28c3-4edd-9af3-cd5497ceadb9/deploy-status)](https://app.netlify.com/projects/docs-phoenixrooivalk/deploys)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![CodeQL](https://img.shields.io/badge/CodeQL-2088FF?logo=github&logoColor=white)](https://codeql.github.com/)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=white)](https://prettier.io/)

## 🚁 **PhoenixRooivalk Counter-Drone Defense Platform**

PhoenixRooivalk is a next-generation modular counter-Unmanned Aircraft System (c-UAS) defense platform that operates autonomously even when communications are completely jammed. Our system delivers military-grade drone threat detection and neutralization in 120-195ms response times - 25-40x faster than traditional systems that fail when enemies jam communications.

**Key Features:**
• **Edge Autonomy**: SAE Level 4 autonomous operation without network dependency
• **Modular Architecture**: VTOL motherships, interceptors, and ground support systems  
• **Blockchain Evidence**: Tamper-proof dual-chain (Solana + EtherLink) audit trails
• **Real-time Processing**: Multi-sensor fusion with 95%+ AI detection accuracy
• **EW Resilience**: GPS-denied and jamming-resistant operation

**Technology Stack:**
• Rust-based blockchain evidence management
• Solana and EtherLink dual-chain anchoring
• NVIDIA Jetson AGX Orin (275 TOPS AI performance)
• Real-time threat simulation and response systems
• Military-grade sensor fusion algorithms

Our platform addresses the critical gap in defense systems that fail when communications are compromised, providing reliable protection for critical infrastructure, military installations, and civilian areas against increasingly sophisticated drone threats.

**Corporate Status**: Nexamesh Technologies (Delaware C-Corp in progress)

---

Modular Counter‑UAS System (restricted partner access)

## 🌐 Live Sites

- **Marketing Website**: [phoenixrooivalk.netlify.app](https://phoenixrooivalk.netlify.app) - Interactive demo, capabilities overview, and contact information
- **Documentation Site**: [docs-phoenixrooivalk.netlify.app](https://docs-phoenixrooivalk.netlify.app) - Technical specifications, architecture, and implementation guides

## Monorepo overview

This repository uses a Turborepo + pnpm monorepo to host multiple apps and
shared packages.

Structure:

- `apps/`
  - `docs/` — Docusaurus site (published under `/docs`).
    - Comprehensive technical documentation with executive, business, technical, legal, and operations sections.
  - `marketing/` — Next.js 14 static marketing site (exports to `out/`).
    - Includes threat simulator, ROI calculator, and interactive demos.
  - `api/` — Rust (Axum) API server.
  - `keeper/` — Rust blockchain keeper service.
  - `evidence-cli/` — Rust CLI for evidence management.
  - `scripts/` — Application-specific scripts.
- `packages/`
  - `types/` — Shared TypeScript type definitions.
  - `ui/` — Shared React UI components and hooks.
  - `utils/` — Shared utility functions.
- `crates/`
  - `evidence/` — Core evidence logging functionality.
  - `anchor-solana/` — Solana blockchain anchoring.
  - `anchor-etherlink/` — EtherLink blockchain anchoring.
  - `address-validation/` — Blockchain address validation.
- `config/` — Tooling configuration files (ESLint, Prettier, Clippy, etc.).
  - Configuration files are symlinked to root for tool compatibility.
- `.ai/` — AI IDE assistant rules (Cursor, Continue, Windsurf).
- `docs/` — Project documentation and development guides.
  - Includes technical summaries, improvement guides, and environment validation.
  - Legacy documentation (migrated to `apps/docs/`).
- `scripts/` — Root-level deployment and utility scripts.
- Root configuration files:
  - `ACCESS.md` — Access request information for defense partners.
  - `CONTRIBUTING.md` — Contribution guidelines.
  - `DEPLOYMENT.md` — Deployment documentation.
  - `RESPONSIBLE_USE.md` — Responsible use guidelines.
  - `SECURITY.md` — Security policy and reporting.

Tooling:

- Package manager: `pnpm` (via `corepack`).
- Orchestrator: `turbo` (see `turbo.json`).
- Linting: `eslint` with TypeScript, React, and security plugins.
- Formatting: `prettier` with consistent code style.
- Pre-commit: `husky` and `lint-staged` for automated quality checks.
- Spell checking: `cspell` for documentation and code comments.
- Rust tooling: `clippy` for Rust code quality and `cargo` for dependency management.
- Configuration: `tsconfig.base.json` for shared TypeScript configuration.

### Development commands

Run from the repository root:

```bash
# enable pnpm via corepack
corepack enable

# install workspace dependencies
pnpm install

# develop marketing (Next.js) - http://localhost:3000
pnpm --filter marketing dev

# develop docs (Docusaurus) - http://localhost:3000
pnpm --filter docs start

# build all
pnpm build

# build single app (static export)
pnpm --filter marketing build  # outputs to apps/marketing/out/
pnpm --filter docs build       # outputs to apps/docs/build/

# run Rust API locally
cargo run --manifest-path apps/api/Cargo.toml

# run Rust services
cargo run --manifest-path apps/keeper/Cargo.toml    # Blockchain keeper
cargo run --manifest-path apps/evidence-cli/Cargo.toml -- <command>  # Evidence CLI

# run utility scripts
./scripts/deploy.sh                    # Deployment script
./scripts/Invoke-Tests.ps1            # PowerShell test runner
./scripts/Invoke-OutboxWorker.ps1     # Blockchain outbox worker
./scripts/validate-env.sh <app>        # Validate environment variables (docs, marketing, api, keeper)

# linting and formatting
pnpm lint                              # Run ESLint on all packages
pnpm typecheck                         # TypeScript type checking
pnpm format                            # Format code with Prettier
pnpm format:check                      # Check formatting without fixing

# Rust development
cargo check                            # Check Rust code without building
cargo clippy                           # Run Rust linter
cargo test                             # Run Rust tests
```

### Deployment

Deployments are performed by GitHub Actions to two separate Netlify sites:

- **Docs**: `.github/workflows/deploy-docs-site.yml` publishes `apps/docs/build/`
  - Secrets: `NETLIFY_AUTH_TOKEN`, `NETLIFY_DOCS_SITE_ID`
  - Triggers: Push to `main` branch, changes to `apps/docs/**`
- **Marketing**: `.github/workflows/deploy-marketing-site.yml` publishes `apps/marketing/out/`
  - Secrets: `NETLIFY_AUTH_TOKEN`, `NETLIFY_MARKETING_SITE_ID`
  - Triggers: Push to `main` branch, changes to `apps/marketing/**`

Additional workflows:

- **CI/CD**: `.github/workflows/ci-marketing.yml`, `.github/workflows/ci-rust.yml`
- **Security**: `.github/workflows/codeql.yml` for vulnerability scanning

Netlify's "Deploys from Git" is disabled; Actions upload artifacts directly.

### Cross‑site links (env)

- Docs site can link back to marketing via `MARKETING_URL` (build‑time env for
  `apps/docs`).
- Marketing site can link to docs via `NEXT_PUBLIC_DOCS_URL` (public runtime env
  for `apps/marketing`).

Set these in each Netlify site’s Environment variables if you want absolute
cross‑links.

### Redirects

- Marketing site publishes `public/_redirects` to forward common paths to the
  docs site. Update the hostnames there to match your actual docs domain if it
  changes.

> Notice: This repository contains restricted content intended for approved
> defense partners. Redistribution or public disclosure is prohibited. See
> `RESPONSIBLE_USE.md` and `ACCESS.md`.

Quick access: [Glossary](./docs/glossary.md)

## Overview

PhoenixRooivalk delivers a layered, modular counter‑UAS capability for contested
EM environments. The public materials in this repository provide a high‑level
overview and governance. Partner‑only details (specifications, simulations,
integration guides) are shared upon approval.

## Mission

Provide a modular, layered defense against low‑cost UAS threats by cueing the
cheapest effective effector first, preserving high‑value effectors, and
maintaining C2 in heavy EW through resilient optical and RF links.

## System overview (abstract)

- RKV‑M: Aerial VTOL mothership for picket, relay, and mini launch; resilient
  comms and survivability provisions.
- RKV‑I: Deployable minis (interceptor, decoy, ISR). Control via RF or optional
  fiber for jam‑resistant teleoperation. Non‑kinetic baseline.
- RKV‑G: Ground support rover acting as mobile GCS, mast, and logistics node;
  can bear fiber spools for engagements.
- RKV‑C2: Command, control, and data plane with strict QoS, eventing, and
  observability; weapon‑agnostic integration patterns.

For detailed specifications and planning baselines, see [`index.md`](./index.md)
(restricted).

## Operating modes

- Mobile picket: Extend detection/relay ahead of maneuver elements.
- Site‑fixed overwatch: Short micro‑tether or elevated optical mast.
- Fiber‑engage: Rover establishes fiber link for spoof‑resistant control.
- Logistics: Resupply, magazine swap, and net deployment support.

## Documentation map

- **Live Documentation**: [phoenixrooivalk-docs.netlify.app](https://phoenixrooivalk-docs.netlify.app) - Complete technical documentation
- **Project Structure**: [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) - Repository organization and file structure
- **Environment Validation**: [docs/ENVIRONMENT_VALIDATION.md](./docs/ENVIRONMENT_VALIDATION.md) - Environment variable validation guide
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment and configuration
- **Legacy Documentation**: See `docs/` directory for historical reference
  - Executive: [Executive Summary](./docs/executive/Executive_Summary.md)
  - Business: [Market Analysis](./docs/business/Market_Analysis.md), [Business Model](./docs/business/Business_Model.md)
  - Technical: [Technical Analysis](./docs/technical/Technical_Analysis.md), [Glossary](./docs/technical/Glossary.md)
  - Operations: [Implementation Plan](./docs/operations/Implementation_Plan.md), [Operations Manual](./docs/operations/Operations_Manual.md)
  - Legal: [Compliance Framework](./docs/legal/Compliance_Framework.md)
  - Architecture Decisions: [Mechanical Design ADRs](./docs/technical/mechanical/Mechanical_Design_ADRs.md)

> **Note**: The primary documentation is now hosted in the Docusaurus site at `apps/docs/`. The `docs/` directory contains legacy documentation for reference.

## Operational tasks

### Evidence management (CLI)

- Rust CLI: `cargo run --bin evidence-cli -- <command>`
- Examples:

```powershell
# Record evidence
cargo run --bin evidence-cli -- record engagement_summary '{"missionId":"M-123","result":"success"}'

# Process anchoring jobs
cargo run --bin keeper -- --interval 5 --batch-limit 25
```

For runbook-style metrics capture, use the Operations Log template:

- [Operations log template — anchoring runs](./docs/operations/monitoring/Operations_Log_Template.md)

## Access request (partners)

Approved defense partners may request access to extended documentation and
artifacts. Please see [`ACCESS.md`](./ACCESS.md) for intake details and required
information.

## Responsible use

This project is weapon‑agnostic by design. Integration of restricted payloads
occurs only under applicable law and export controls. See
[`RESPONSIBLE_USE.md`](./RESPONSIBLE_USE.md).

## Site preview

Both sites are automatically deployed to Netlify via GitHub Actions:

- **Marketing Site**: Built with Next.js 14 and deployed from `apps/marketing/out/`
- **Documentation Site**: Built with Docusaurus and deployed from `apps/docs/build/`

You can view the live sites at the configured Netlify domains (see [Live Sites](#-live-sites) section above).

## Contributing

Contributions are limited to approved collaborators. Review
[`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under a proprietary license. See [`LICENSE`](./LICENSE)
for details.

## Contact

Jurie Smit  
PhoenixVC  
mailto:smit.jurie@gmail.com
