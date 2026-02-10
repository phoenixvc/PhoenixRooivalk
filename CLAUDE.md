# PhoenixRooivalk - Claude Code Instructions

## Project Overview

PhoenixRooivalk is a dual-brand modular counter-UAS (counter-drone) defense
platform. SkySnare targets consumer sports/training; AeroNet targets AI-enabled
enterprise infrastructure security. The system combines blockchain-based evidence
anchoring, edge AI processing, and a threat simulation engine.

**This is a simulation/gameplay system for testing and training purposes.**

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 19, Docusaurus, Leptos/WASM, Tauri |
| Backend | Rust (Axum), Python (detector) |
| Blockchain | Solana SDK, EtherLink |
| Package Manager | pnpm 9.6.0 (enforced via corepack) |
| Monorepo | Turborepo |
| Testing | Vitest (JS/TS), cargo test (Rust), pytest (Python) |
| Linting | ESLint, Prettier, Clippy, cargo fmt |
| CI/CD | GitHub Actions, Azure Static Web Apps |
| Styling | Tailwind CSS 4.1, CSS Modules |

## Repository Structure

```
apps/
  marketing/       # Next.js 14 marketing website (threat simulator, ROI calc)
  docs/            # Docusaurus technical documentation portal
  api/             # Rust Axum REST API server
  keeper/          # Rust blockchain keeper service
  evidence-cli/    # Rust CLI for evidence management
  detector/        # Python drone detection (RPi, Jetson, Desktop)
  threat-simulator-desktop/  # Tauri + Leptos WASM desktop app
crates/
  evidence/        # Core evidence logging
  anchor-solana/   # Solana blockchain anchoring
  anchor-etherlink/# EtherLink blockchain anchoring
  address-validation/ # Blockchain address validation
  phoenix-common/  # Shared Rust utilities
  x402/            # Specialized module
packages/
  types/           # Shared TypeScript type definitions
  ui/              # Shared React UI components and hooks
  utils/           # Shared utility functions
config/            # Tooling configs (eslint, prettier, clippy, etc.)
scripts/           # Deployment and utility scripts
infra/             # Infrastructure as Code (Bicep templates)
```

## Key Commands

```bash
# Install dependencies
pnpm install

# Build
pnpm build                        # All apps via turbo
pnpm --filter marketing build     # Single app
cargo build                       # Rust workspace

# Dev
pnpm dev                          # All apps
pnpm --filter marketing dev       # Single app

# Test
pnpm test                         # JS/TS tests (Vitest)
pnpm test:coverage                # With coverage
cargo test                        # Rust tests
pytest apps/detector              # Python tests

# Lint & Format
pnpm lint                         # ESLint across all packages
pnpm typecheck                    # TypeScript type checking
pnpm format                       # Prettier write
pnpm format:check                 # Prettier check only
cargo clippy                      # Rust linting
cargo fmt --all                   # Rust formatting
cargo fmt --all -- --check        # Rust format check

# Combined quality check
pnpm fx                           # format + lint

# Threat Simulator Desktop
pnpm sim:dev                      # Dev mode
pnpm sim:build:tauri              # Build Tauri app
```

## Coding Standards

### TypeScript/JavaScript
- Strict mode TypeScript, avoid `any`
- Functional components with hooks (no class components)
- Named exports preferred over default exports
- CSS Modules for component styling
- WCAG AA+ accessibility: ARIA labels, keyboard nav, 4.5:1 contrast

### Rust
- snake_case functions, PascalCase types
- `Result<T, E>` with `?` operator, avoid panics
- Doc comments on public APIs
- All clippy warnings must be resolved
- Unsafe code is forbidden (workspace setting)

### Python (detector app)
- Type hints with pydantic
- pytest for testing
- bandit for security scanning

## Commit Conventions

Use conventional commits:
```
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

Cross-package imports use workspace protocol: `"@phoenix/ui": "workspace:*"`

## Environment Variables

- Marketing: `NEXT_PUBLIC_DOCS_URL` (public runtime)
- Docs: `MARKETING_URL` (build-time)
- See `.env.example` files in each app for specifics
- Never commit `.env` files

## Config Files

Tooling configs live in `config/` and are symlinked to the root:
- `.eslintrc.js` -> `config/eslintrc.js`
- `.prettierrc` -> `config/prettierrc`
- `.markdownlint.json` -> `config/markdownlint.json`
- `clippy.toml` -> `config/clippy.toml`
- `cspell.json` -> `config/cspell.json`
