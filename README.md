# PhoenixRooivalk

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Docusaurus](https://img.shields.io/badge/Docusaurus-2CA5E0?logo=docusaurus&logoColor=white)](https://docusaurus.io/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turbo](https://img.shields.io/badge/Turbo-5C4EE5?logo=turbo&logoColor=white)](https://turbo.build/)
[![Azure](https://img.shields.io/badge/Azure-0078D4?logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![CodeQL](https://img.shields.io/badge/CodeQL-2088FF?logo=github&logoColor=white)](https://codeql.github.com/)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=white)](https://prettier.io/)

## 🚁 **PhoenixRooivalk: Dual-Brand Counter-Drone Platform**

PhoenixRooivalk transforms proven pneumatic platform technology into two
world-leading brands:

### **SkySnare™ Consumer**

Premium sports and training equipment for the consumer market. Safety-certified,
reliability-proven devices that demonstrate our core technology at scale.

### **AeroNet™ Enterprise**

AI-enabled infrastructure security for regulated enterprise markets.
Compliance-focused, automated counter-drone systems with measurable risk
reduction.

**Strategic Vision:** Prove reliability and safety at consumer scale
(SkySnare™), then apply that track record to high-value enterprise markets
(AeroNet™) that demand compliance, automation, and accountability.

**Key Features:**

• **Dual Certification Path**: Consumer safety (CPSC) + Enterprise compliance
(FAA) • **AI Edge Processing**: On-device intelligence for privacy and low
latency • **Safety First**: Sub-200ms response times with human oversight •
**Compliance Logging**: Automated regulatory and insurance audit trails • **Data
Asset Creation**: Proprietary training data from deployments

**Technology Stack:**

• Rust-based blockchain evidence management • Solana and EtherLink dual-chain
anchoring • Edge AI processing (NVIDIA Jetson AGX Orin) • Real-time sensor
fusion and tracking • Multi-site coordination and cloud learning

**Market Opportunity**: $5.9B combined TAM (Consumer: $1.68B @ 8.2% CAGR |
Enterprise: $4.2B @ 47% CAGR)

**Corporate Status**: Nexamesh Technologies (Delaware C-Corp in progress)

---

Modular Counter‑UAS System (restricted partner access)

## 🌐 Live Sites

The project is deployed to Azure Static Web Apps via GitHub Actions:

- **Marketing Website** - Interactive demo, capabilities overview, and contact
  information
- **Documentation Site** - Technical specifications, architecture, and
  implementation guides

See [Deployment](#deployment) section below for details on Azure infrastructure
and CI/CD workflows.

## Monorepo overview

This repository uses a Turborepo + pnpm monorepo to host multiple apps and
shared packages.

Structure:

- `apps/` — All applications and services (see [apps/README.md](apps/README.md)
  for detailed overview)
  - `docs/` — Docusaurus site (published under `/docs`).
    - Comprehensive technical documentation with executive, business, technical,
      legal, and operations sections.
  - `marketing/` — Next.js 14 static marketing site (exports to `out/`).
    - Includes threat simulator, ROI calculator, and interactive demos.
  - `detector/` — Python drone detection system for edge devices.
    - Modular architecture supporting Raspberry Pi, NVIDIA Jetson, and desktop.
    - See [apps/detector/README.md](apps/detector/README.md) for user guide.
  - `threat-simulator-desktop/` — Tauri desktop application (Rust +
    Leptos/WASM).
    - Desktop version of the threat simulator with blockchain evidence
      recording.
    - See
      [apps/threat-simulator-desktop/README.md](apps/threat-simulator-desktop/README.md)
      for user guide.
  - `api/` — Rust (Axum) API server.
  - `keeper/` — Rust blockchain keeper service.
  - `evidence-cli/` — Rust CLI for evidence management.
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
- Rust tooling: `clippy` for Rust code quality and `cargo` for dependency
  management.
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
# Blockchain keeper
cargo run --manifest-path apps/keeper/Cargo.toml
# Evidence CLI
cargo run --manifest-path apps/evidence-cli/Cargo.toml -- <command>

# run utility scripts
./scripts/deploy.sh                    # Deployment script
./scripts/Invoke-Tests.ps1             # PowerShell test runner
# Blockchain outbox worker
./scripts/Invoke-OutboxWorker.ps1
# Validate environment variables (docs, marketing, api, keeper)
./scripts/validate-env.sh <app>

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

#### Automated Infrastructure-First Deployment

PhoenixRooivalk uses a three-phase deployment approach:

1. **Infrastructure** (`.github/workflows/deploy-infrastructure.yml`):
   - Deploy all Azure resources (Static Web Apps, Functions, Cosmos DB, Key
     Vault)
   - Automatically configure GitHub secrets
   - Run via GitHub Actions UI or CLI
   - See [Quick Reference](.github/QUICK_REFERENCE.md)

2. **Secrets** (Automated):
   - Deployment tokens extracted automatically
   - GitHub secrets populated (if GH_PAT configured)
   - Manual fallback instructions provided

3. **Applications** (Triggered on push or manual):
   - **Docs**: `.github/workflows/deploy-docs-azure.yml` → Azure Static Web Apps
   - **Marketing**: `.github/workflows/deploy-marketing-azure.yml` → Azure
     Static Web Apps
   - **Functions**: `.github/workflows/deploy-azure-functions.yml` → Azure
     Functions

**Quick Start:**

```bash
# One-time: Configure Azure credentials
gh secret set AZURE_SUBSCRIPTION_ID --body "<subscription-id>"
gh secret set AZURE_CREDENTIALS --body '<service-principal-json>'

# Deploy infrastructure via UI: Actions → Deploy Azure Infrastructure
# → Run workflow
# Or via CLI:
gh workflow run deploy-infrastructure.yml -f environment=dev \
  -f location=eastus2

# Deploy applications (automatic on push to main)
git push origin main
```

**Documentation:**

- 📖 [Deployment Workflow Guide](.github/DEPLOYMENT_WORKFLOW_GUIDE.md) -
  Complete guide
- 🚀 [Quick Reference](.github/QUICK_REFERENCE.md) - Cheat sheet
- 📋 [Deployment Sequence](.github/DEPLOYMENT_SEQUENCE.md) - Detailed steps
- 🔧 [Azure Setup](.github/AZURE_SETUP.md) - Secrets configuration

Additional workflows:

- **CI/CD**: `.github/workflows/ci-marketing.yml`,
  `.github/workflows/ci-rust.yml`
- **Security**: `.github/workflows/codeql.yml` for vulnerability scanning
- **Link Checking**: `.github/workflows/docs-link-checker.yml` for documentation
  links

See `.github/AZURE_SETUP.md` for Azure infrastructure setup and configuration.

### Cross‑site links (env)

- Docs site can link back to marketing via `MARKETING_URL` (build‑time env for
  `apps/docs`).
- Marketing site can link to docs via `NEXT_PUBLIC_DOCS_URL` (public runtime env
  for `apps/marketing`).

Set these as GitHub repository variables or Azure Static Web App environment
variables if you want absolute cross‑links.

### Redirects

Azure Static Web Apps handles routing via `staticwebapp.config.json` files in
each app. Update these files if you need to configure custom redirects or
routing rules.

> Notice: This repository contains restricted content intended for approved
> defense partners. Redistribution or public disclosure is prohibited. See
> `RESPONSIBLE_USE.md` and `ACCESS.md`.

## Overview

PhoenixRooivalk delivers a layered, modular counter‑UAS capability for contested
EM environments. The public materials in this repository provide a high‑level
overview and governance. Partner‑only details (specifications, simulations,
integration guides) are shared upon approval.

## Mission

Transform proven pneumatic platform technology into two world-leading brands:

- **SkySnare™** for consumer sports and training markets
- **AeroNet™** for regulated, AI-enabled infrastructure security

We aim to prove reliability and safety at consumer scale, then apply that track
record to high-value enterprise markets that demand compliance, automation, and
measurable risk reduction.

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

## Documentation

All project documentation is hosted on the live Docusaurus site (deployed to
Azure Static Web Apps):

- **📚 Documentation Portal**:
  - Executive Summaries & Pitch Materials
  - Technical Architecture & Specifications
  - Business Plans & Market Analysis
  - Operations Manuals & Deployment Guides
  - Legal & Compliance Frameworks
  - Funding Opportunities & Resources

- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
  and configuration
- **Azure Infrastructure**: [infra/azure/README.md](./infra/azure/README.md) -
  Azure deployment setup

> **Note**: Documentation source files are in `apps/docs/`. Run
> `pnpm --filter docs start` to view locally. Doc backlog (hardware phase,
> Hugging Face/MCP):
> [GitHub issues #674–#685](https://github.com/phoenixvc/PhoenixRooivalk/issues?q=is%3Aissue+674+675+676+677+678+679+680+681+682+683+684+685).

## Operational tasks

### Python Detector

Real-time drone detection system for edge devices. See
[apps/detector/README.md](apps/detector/README.md) for complete documentation.

**Quick Start:**

```bash
cd apps/detector

# Setup environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
# For Raspberry Pi, or [desktop] for development
pip install -e ".[pi]"

# Run detection
python src/main.py --model models/drone-detector_int8.tflite

# Headless mode (no display)
python src/main.py --model models/drone-detector_int8.tflite \
  --headless

# With Coral USB Accelerator (faster)
python src/main.py --model models/drone-detector_int8.tflite \
  --coral

# With object tracking and webhook alerts
python src/main.py --model models/drone-detector_int8.tflite \
  --tracker kalman \
  --alert-webhook https://api.example.com/detections
```

### Evidence management (CLI)

- Rust CLI: `cargo run --bin evidence-cli -- <command>`
- Examples:

  ```powershell
  # Record evidence
  cargo run --bin evidence-cli -- record engagement_summary \
    '{"missionId":"M-123","result":"success"}'

  # Process anchoring jobs
  cargo run --bin keeper -- --interval 5 --batch-limit 25
  ```

For runbook-style metrics capture, see the Operations Log template in the
documentation portal.

### Threat Simulator Desktop

Desktop application for simulating counter-drone defense scenarios. See
[apps/threat-simulator-desktop/README.md](apps/threat-simulator-desktop/README.md)
for complete documentation.

**Quick Start:**

```bash
# From repository root
pnpm sim:dev              # Frontend dev server (fastest)
pnpm sim:dev:tauri        # Full desktop app
pnpm sim:test             # Run tests
pnpm sim:build:tauri      # Build production installers
```

## Access request (partners)

Approved defense partners may request access to extended documentation and
artifacts. Please see [`ACCESS.md`](./ACCESS.md) for intake details and required
information.

## Responsible use

This project is weapon‑agnostic by design. Integration of restricted payloads
occurs only under applicable law and export controls. See
[`RESPONSIBLE_USE.md`](./RESPONSIBLE_USE.md).

## Site Deployment

Both sites are automatically deployed to Azure Static Web Apps via GitHub
Actions:

- **Marketing Site**: Built with Next.js 14 (static export from
  `apps/marketing/out/`)
- **Documentation Site**: Built with Docusaurus (static site from
  `apps/docs/build/`)

Deployment is triggered automatically on push to `main` branch. See the
[Deployment](#deployment) section and `.github/workflows/` for workflow details.

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
