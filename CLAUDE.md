# PhoenixRooivalk - Claude Code Instructions

## Project Overview

PhoenixRooivalk is a dual-brand modular counter-UAS (counter-drone) defense
platform. SkySnare targets consumer sports/training; AeroNet targets AI-enabled
enterprise infrastructure security. The system combines blockchain-based
evidence anchoring, edge AI processing, and a threat simulation engine.

**This is a simulation/gameplay system for testing and training purposes.**

## Tech Stack

| Layer          | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Frontend       | Next.js 16, React 19, Docusaurus 3, Leptos/WASM, Tauri 2 |
| Backend        | Rust (Axum 0.8), Python 3.9+ (detector)                  |
| Blockchain     | Solana SDK, EtherLink, x402 payment protocol             |
| Database       | SQLite via SQLx, Azure Cosmos DB (Docs)                  |
| Package Mgr    | pnpm 9.6.0 (enforced via corepack)                       |
| Monorepo       | Turborepo 2.8                                            |
| JS Testing     | Vitest (marketing), Jest (docs, ui)                      |
| Rust Testing   | cargo test                                               |
| Python Testing | pytest                                                   |
| JS Linting     | ESLint 9, Prettier 3.8                                   |
| Rust Linting   | Clippy, cargo fmt                                        |
| Python Linting | Ruff, Black, isort, mypy, bandit (pre-commit)             |
| CI/CD          | GitHub Actions, Azure Static Web Apps                    |
| Styling        | Tailwind CSS 4.1, CSS Modules                            |
| Infrastructure | Azure Bicep, Terraform (ML training)                     |

## Repository Structure

```text
apps/
  marketing/       # Next.js 16 marketing website
  docs/            # Docusaurus 3 docs + Azure Functions
  api/             # Rust Axum REST API
  keeper/          # Rust blockchain keeper service
  evidence-cli/    # Rust CLI for evidence hashing
  detector/        # Python drone detection
  threat-simulator-desktop/  # Tauri 2 + Leptos WASM
crates/
  evidence/        # Core evidence logging, SHA-256
  anchor-solana/   # Solana blockchain anchoring
  anchor-etherlink/# EtherLink blockchain anchoring
  address-validation/ # Blockchain address validation
  phoenix-common/  # Shared Rust DB utilities
  x402/            # HTTP 402 payment protocol
packages/
  types/           # Shared TypeScript types
  ui/              # Shared React components
  utils/           # Shared utility functions
config/            # Tooling configs (symlinked to root)
scripts/           # Deployment and utility scripts
infra/             # IaC: azure/ (Bicep), terraform/
tools/             # pdf_generator (Python CLI)
e2e/               # Playwright end-to-end tests
```

## Key Commands

```bash
# Install dependencies
pnpm install

# Build
pnpm build                        # All JS/TS apps via Turborepo
pnpm --filter marketing build     # Single app (runs sync:wasm first)
pnpm --filter docs build          # Docs site
cargo build                       # Rust workspace

# Dev servers
pnpm dev                          # All apps
pnpm --filter marketing dev       # Marketing on :3000
pnpm --filter docs start          # Docs on :3000
pnpm sim:dev                      # Threat simulator on :8080
pnpm sim:dev:tauri                # Full desktop app

# Test
pnpm --filter marketing test      # Marketing tests (Vitest)
pnpm --filter docs test           # Docs tests (Jest)
pnpm --filter ui test             # UI package tests (Jest)
cargo test                        # All Rust tests
pnpm sim:test                     # Threat simulator tests
pytest apps/detector              # Python tests
pytest apps/detector -m "not slow and not hardware"

# Lint & Format
pnpm lint                         # ESLint
pnpm typecheck                    # TypeScript
pnpm format                       # Prettier write
pnpm format:check                 # Prettier check
cargo clippy -- -D warnings       # Rust lint
cargo fmt --all                   # Rust format
cargo fmt --all -- --check        # Rust format check
pnpm fx                           # Combined: format + lint

# Python linting (in apps/detector/)
ruff check src/                   # Fast Python linter
black --check src/                # Format check
isort --check-only src/           # Import order check
mypy src/                         # Type checking

# Desktop threat simulator
pnpm sim:build:tauri              # Build release
pnpm sim:test                     # Run simulator tests
pnpm sim:lint                     # Clippy on simulator
```

## App-Specific Details

### API (`apps/api/`) — Rust Axum on port 8080

Key routes:

- `GET/POST /evidence` — Evidence job management
- `GET /evidence/{id}` — Individual evidence lookup
- `GET/POST /countermeasures` — Counter-drone deployments
- `GET/POST /signal-disruptions` — RF disruption tracking
- `GET/POST /jamming-operations` — EW operations
- `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`
- `POST /career/apply` — Career applications
- `POST /admin/seed-team-members` — Seed fixture data
- `GET /health` — Health check
- `POST /api/v1/evidence/verify-premium` — x402 premium
- `GET /api/v1/x402/status` — Payment protocol status
- `GET/POST /preorders` — Preorder management
- `GET /preorders/{id}` — Individual preorder lookup

Database: SQLite with automatic migrations on startup. Foreign keys enforced. DB
URL priority: `API_DB_URL` > `KEEPER_DB_URL` > hardcoded default. Pagination:
Default 10 items/page, max 100. x402 payment protocol: disabled by default, set
`X402_ENABLED=true` to enable.

### Keeper (`apps/keeper/`) — Rust background service on port 8081

Processes blockchain anchoring jobs from an outbox database. Dual-loop: job
processing + transaction confirmation polling.

Environment variables:

- `KEEPER_PROVIDER=stub` — Provider selection: `stub`/`etherlink`/`solana`/`multi`
- `KEEPER_DB_URL=sqlite://blockchain_outbox.sqlite3`
- `KEEPER_POLL_MS=5000` — Job polling interval
- `KEEPER_CONFIRM_POLL_MS=30000` — Confirmation polling interval
- `KEEPER_HTTP_PORT=8081` — HTTP health check port
- `KEEPER_USE_STUB=false` — Legacy; prefer `KEEPER_PROVIDER`
- `ETHERLINK_ENDPOINT`, `ETHERLINK_NETWORK`, `ETHERLINK_PRIVATE_KEY`

### Marketing (`apps/marketing/`) — Next.js 16 on port 3000

- Build requires WASM sync: `pnpm --filter marketing sync:wasm` runs
  automatically before `next build`
- Email-based auth (no passwords), session via localStorage
- Team member detection prevents self-applications
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ENABLE_TOUR_SKIP`,
  `NEXT_PUBLIC_TOUR_AUTO_START`

### Docs (`apps/docs/`) — Docusaurus 3

- Has its own Azure Functions backend in `azure-functions/` (Node 20, Jest
  tests)
- Azure Entra ID (B2C) authentication
- Comment system backed by Azure Cosmos DB
- PWA offline support, Mermaid diagrams, local search
- Env: `CLOUD_PROVIDER`, `AZURE_ENTRA_CLIENT_ID`, `AZURE_ENTRA_TENANT_ID`, plus
  more in `.env.example`

### Detector (`apps/detector/`) — Python 3.9+

Platform-specific installation:

```bash
pip install -e ".[pi]"       # Raspberry Pi (TFLite)
pip install -e ".[jetson]"   # NVIDIA Jetson (ONNX)
pip install -e ".[desktop]"  # Desktop (TensorFlow)
pip install -e ".[coral]"    # Coral Edge TPU
pip install -e ".[dev]"      # Development tools
```

Modular architecture: pluggable cameras, inference engines, trackers via Factory
pattern. Hardware auto-detection selects appropriate backend. Run with
`drone-detector` CLI or `python -m main`.

### Threat Simulator Desktop (`apps/threat-simulator-desktop/`)

Two development modes:

- **Frontend only**: `trunk serve --port 8080` (WASM only)
- **Full desktop**: `cargo tauri dev` (includes Tauri backend)

Requires: Rust, `wasm32-unknown-unknown` target, Trunk, Tauri CLI. Linux build
deps: `libwebkit2gtk-4.1-dev`, `build-essential`, `libssl-dev`,
`libayatana-appindicator3-dev`.

### Evidence CLI (`apps/evidence-cli/`)

```bash
# Hash a payload locally
cargo run -p evidence-cli -- --payload '{"event":"test"}'

# Hash and submit to API
cargo run -p evidence-cli -- \
  --payload @file.json --submit \
  --api-url http://localhost:8080
```

## Workspace Gotchas

- **All Rust crates use `rustls`** instead of native OpenSSL
  (RUSTSEC-2025-0004). Never add `native-tls` features to reqwest or other HTTP
  clients.
- **Unsafe code is forbidden** workspace-wide in Cargo.toml.
- **Marketing build depends on WASM**: `sync:wasm` copies compiled WASM from the
  threat simulator. If the simulator hasn't been built, marketing build will use
  a fallback.
- **pnpm workspace includes nested apps**: `apps/*/*` covers
  `apps/docs/azure-functions/` (src-tauri has no package.json, not a pnpm member).
- **`getrandom` crate** requires `wasm_js` feature for WASM targets (configured
  in workspace Cargo.toml).
- **Config files are symlinks**: Edit files in `config/`, not the root symlinks.
- **Tauri desktop app has conditional compilation**: WASM-only vs native deps
  gated with `#[cfg(target_arch = "wasm32")]`.
- **Rust CI builds require Linux GUI deps** for Tauri (GTK, webkit,
  appindicator).
- **Cargo audit** runs in CI with `--ignore RUSTSEC-2023-0071` (pending
  investigation).
- **Python mypy** type errors are resolved — CI enforces mypy (no
  `continue-on-error`).

## Coding Standards

### TypeScript/JavaScript

- Strict mode TypeScript, avoid `any`
- Functional components with hooks (no class components)
- Named exports preferred over default exports
- CSS Modules for component styling (dark tactical theme)
- WCAG AA+ accessibility: ARIA labels, keyboard nav, 4.5:1
- ESLint security plugin enabled

### Rust

- snake_case functions, PascalCase types
- `Result<T, E>` with `?` operator, avoid panics
- Doc comments on public APIs
- All clippy warnings must be resolved (deny warnings in CI)
- Unsafe code is forbidden (workspace setting)
- Use `rustls` for all HTTP/TLS operations

### Python (detector app)

- Type hints with pydantic v2
- Ruff for linting (E/W/F/I/B/C4/UP rules), Black for formatting
  (line-length 100)
- isort for import ordering (black profile)
- pytest markers: `slow`, `integration`, `hardware`
- bandit for security scanning
- 50% coverage target (not yet enforced in CI)

## Commit Conventions

Use conventional commits:

```text
feat: Add tactical grid overlay
fix: Resolve header gap spacing
docs: Update README with installation steps
refactor: Extract button variants
test: Add accessibility tests
perf: Optimize grid rendering
chore: Update dependencies
```

## Architecture Decision Records

When creating ADRs, reference the template at:
`apps/docs/docs/technical/architecture/adr-0000-template-and-guide.md`

Numbering: 0001-0099 (Core), 0100-0199 (Security), 0200-0299 (Blockchain),
0300-0399 (AI/ML), D001-D999 (Dev Decisions).

## Workspace Dependencies

Cross-package imports use workspace protocol:
`"@phoenix-rooivalk/types": "workspace:*"`

Shared Rust crates are referenced as path dependencies in workspace Cargo.toml.

## Environment Variables

See `.env.example` in each app for full details. Key variables:

| App       | Variable                   | Purpose                 |
| --------- | -------------------------- | ----------------------- |
| Marketing | `NEXT_PUBLIC_API_URL`      | Backend API URL         |
| Docs      | `CLOUD_PROVIDER`           | `azure` or `offline`    |
| Docs      | `AZURE_ENTRA_CLIENT_ID`    | Azure AD B2C client     |
| Docs      | `AZURE_FUNCTIONS_BASE_URL` | Functions URL           |
| Keeper    | `KEEPER_PROVIDER`          | `stub` for dev          |
| Keeper    | `KEEPER_DB_URL`            | SQLite connection       |
| API       | `RUST_LOG`                 | Log level               |
| API       | `API_DB_URL`               | SQLite URL              |
| API       | `X402_ENABLED`             | Enable payment protocol |
| API       | `X402_WALLET_ADDRESS`      | Solana wallet           |

Never commit `.env` files.

## Config Files

Tooling configs live in `config/` and are symlinked to root:

- `.eslintrc.js` -> `config/eslintrc.js`
- `.prettierrc` -> `config/prettierrc`
- `.prettierignore` -> `config/prettierignore`
- `.editorconfig` -> `config/editorconfig`
- `.markdownlint.json` -> `config/markdownlint.json`
- `clippy.toml` -> `config/clippy.toml`
- `cspell.json` -> `config/cspell.json`

## Infrastructure

- **Azure Bicep** (`infra/azure/`): Static Web Apps, Cosmos DB, Functions, Key
  Vault, App Insights, Notification Hubs. Environments: dev/prod.
- **Terraform** (`infra/terraform/ml-training/`): Azure ML workspace with GPU
  compute for YOLO drone detection model training.
- **Deployment scripts** in `scripts/`: Azure setup, Cosmos container creation,
  deployment validation, diagnostics.

## Per-App Instructions

Each app has its own `CLAUDE.md` with app-specific gotchas, commands, and
architecture details. These are loaded automatically when working in that
directory:

- `apps/api/CLAUDE.md` — Routes, DB priority, x402 payment protocol, migrations
- `apps/keeper/CLAUDE.md` — Dual-loop anchoring, providers, batch Merkle trees
- `apps/docs/CLAUDE.md` — Docusaurus, Azure Functions, build-time env vars
- `apps/marketing/CLAUDE.md` — Next.js static export, WASM sync, dual game
  engines
- `apps/detector/CLAUDE.md` — Python config system, hardware platforms, linting
- `apps/threat-simulator-desktop/CLAUDE.md` — WASM/native compilation, Trunk,
  Tauri
