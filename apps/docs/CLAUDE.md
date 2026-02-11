# Docs App — Claude Code Context

## Overview

Docusaurus 3 documentation portal with Azure Functions backend, Azure Entra ID
auth, Cosmos DB comment system, and AI-powered features (RAG search, competitor
analysis, reading recommendations).

## Critical Gotcha: Build-Time Environment Variables

Docusaurus reads env vars during **build time**, not runtime. They get embedded
into static JS bundles. If vars aren't set when `pnpm build` runs, features are
silently disabled.

- Must be set as GitHub **Variables** (not Secrets) with scope **"Builds"**
- `AZURE_FUNCTIONS_BASE_URL` must NOT have `/api` suffix
- Verify in browser: `window.__DOCUSAURUS__.siteConfig.customFields.azureConfig`

## Commands

```bash
pnpm --filter docs start       # Dev server on :3000
pnpm --filter docs build       # Production build
pnpm --filter docs test        # Jest tests
pnpm --filter docs lint        # Prettier + markdownlint check
pnpm --filter docs typecheck   # TypeScript check
```

## Azure Functions Backend (`azure-functions/`)

Separate Node 20 project with its own package.json and Jest tests.

Key functions:
- `askDocumentation` — RAG Q&A with cosine similarity + Azure OpenAI
- `analyzeCompetitors` — AI competitive analysis
- `searchDocs` — Hybrid search (keyword + semantic)
- `cosmos-proxy` — Cosmos DB CRUD for comments
- `health` + `health/ready` — Liveness/readiness (anonymous)
- `news`, `news-ingestion` — RSS-based news feed
- `send-email`, `weekly-reports`, `scheduled` — Background tasks

Protected endpoints use `requireAuthAsync()` + `checkRateLimitAsync()`.

```bash
cd apps/docs/azure-functions
npm install && npm run build    # Build functions
npm test                        # Jest tests
```

## Authentication

- Azure Entra ID (B2C) via MSAL.js (`@azure/msal-browser`)
- Google + GitHub OAuth through Azure AD B2C user flows
- `CLOUD_PROVIDER=azure` for real auth, `offline` for local dev without auth
- Internal user profiles detected from email domain
- `DISABLE_LOGIN=true` hides login UI entirely

## Custom Docusaurus Plugins (`src/plugins/`)

- **remark-doc-metadata** — Validates frontmatter (difficulty, points, tags,
  estimated_reading_time). Warns on build, doesn't fail.
- **sidebar-phase-enricher** — Builds phase map from frontmatter for filtering.
  Phases: seed, series-a, series-b, series-c, scale.
- **docusaurus-rag-indexer** — Indexes docs at build time for RAG search.
  Generates content hashes for incremental updates.

## Frontmatter Schema (Gamification)

```yaml
difficulty: beginner | intermediate | advanced | expert
estimated_reading_time: 5   # minutes
points: 10                  # non-negative
tags: ["business", "counter-uas"]
prerequisites: ["doc-id"]   # docIds that should be read first
```

## Cloud Provider Pattern

All services have Azure and offline implementations:
- `src/services/cloud/interfaces/` — Abstract interfaces
- `src/services/cloud/azure/` — Azure implementations
- `src/services/cloud/provider.ts` — Switches on `CLOUD_PROVIDER`

## Environment Variables

See `.env.example` for full list. Key ones:

| Variable | Required | Notes |
|---|---|---|
| `CLOUD_PROVIDER` | Yes | `azure` or `offline` |
| `AZURE_ENTRA_CLIENT_ID` | For auth | B2C client ID |
| `AZURE_ENTRA_TENANT_ID` | For auth | B2C tenant ID |
| `AZURE_ENTRA_AUTHORITY` | For auth | B2C authority URL |
| `AZURE_FUNCTIONS_BASE_URL` | For AI | NO `/api` suffix |
| `AZURE_APP_INSIGHTS_CONNECTION_STRING` | Optional | Analytics |
| `DISABLE_LOGIN` | Optional | `true` to hide login |

## Sidebar Structure (`sidebars.ts`)

9 top-level categories: Getting Started, Progress Reports, Executive, Technical,
Business, Operations, Legal & Compliance, Research, Resources. Most collapsed by
default. Progress reports use auto-generated sidebars.

## Testing

- Jest with jsdom, ts-jest, identity-obj-proxy for CSS modules
- Coverage threshold: 50%
- Setup mocks localStorage and navigator.onLine
- Azure Functions have separate Jest tests in `azure-functions/src/__tests__/`

## Static Web App Config

- SPA fallback: `rewrite: /index.html`
- API routes: anonymous + authenticated
- Platform: `node:20`
- WASM MIME type configured
- CORS header: `Cross-Origin-Embedder-Policy: unsafe-none`
