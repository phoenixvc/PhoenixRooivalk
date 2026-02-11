# API App — Claude Code Context

## Overview

Rust Axum REST API on port 8080 (configurable via `PORT` env var). SQLite via
SQLx with automatic migrations on startup.

## Database URL Priority

```text
1. API_DB_URL (if set)
2. KEEPER_DB_URL (fallback — shared with keeper)
3. "sqlite://blockchain_outbox.sqlite3" (hardcoded default)
```

PRAGMAs enforced on every connection:

- `foreign_keys = ON`
- `extended_result_codes = ON` (codes 2067=UNIQUE, 1555=PRIMARY KEY)

## Routes

```text
GET    /health                          — Health check
GET    /evidence                        — List evidence (paginated)
POST   /evidence                        — Create evidence job
GET    /evidence/{id}                   — Get evidence by ID
GET    /countermeasures                 — List deployments
POST   /countermeasures                 — Record deployment
GET    /signal-disruptions              — List disruptions
POST   /signal-disruptions              — Record disruption
GET    /jamming-operations              — List operations
POST   /jamming-operations              — Record operation
POST   /auth/login                      — Email-based login
GET    /auth/me                         — Current user
PUT    /auth/profile                    — Update profile
POST   /career/apply                    — Career application
POST   /admin/seed-team-members         — Seed fixtures
POST   /api/v1/evidence/verify-premium  — x402 verification
GET    /api/v1/x402/status              — Payment status
```

Pagination: Default 10/page, max 100.

## x402 Payment Protocol

Environment variables (all optional — disabled by default):

| Variable | Default | Notes |
|---|---|---|
| `X402_ENABLED` | `false` | `true` or `1` to enable |
| `X402_WALLET_ADDRESS` | — | Required if x402 on |
| `X402_FACILITATOR_URL` | see below | Payment verifier |
| `SOLANA_RPC_URL` | see below | Solana endpoint |
| `SOLANA_NETWORK` | `devnet` | `devnet` or `mainnet-beta` |
| `X402_MIN_PAYMENT` | `0.001` | Minimum USDC |

Defaults: facilitator `https://x402.org/facilitator`,
RPC `https://api.devnet.solana.com`.

Price tiers: Basic ($0.01), MultiChain ($0.05),
LegalAttestation ($1.00), Bulk ($0.005/record for 100+).

x402 endpoint is M2M-only (requires Bearer token, rejects
browser cookies). Payment proof passed via `X-PAYMENT` header.

Devnet mode simulates verification (always valid if amount >= min).

## Migrations

Automatic on startup. Version-tracked in `migrations.rs`:

1. `outbox_jobs` table
2. `outbox_tx_refs` table
3. Job indexes
4. TX ref indexes
5. `countermeasure_deployments` (FK, ON DELETE CASCADE)
6. Signal disruptions, jamming operations

## Feature Flags

- `cosmos` feature — Enables Azure Cosmos DB support (optional,
  adds `azure_data_cosmos` + `azure_identity` dependencies)

## Testing

```bash
cargo test -p phoenix-api          # All API tests
```

9 test files in `tests/`: app_setup, evidence_creation,
evidence_retrieval, x402, pagination, doc_tests, foreign_keys,
http_evidence, common/.
