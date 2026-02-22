---
id: api-documentation
title: Phoenix Rooivalk API Documentation
sidebar_label: Phoenix Rooivalk API
difficulty: advanced
estimated_reading_time: 8
points: 25
tags:
  - technical
  - integration
---

# Phoenix Rooivalk API Documentation

## Overview

The Phoenix Rooivalk API is a Rust Axum REST service that provides evidence
management, counter-drone operations tracking, authentication, and preorder
management. The API runs on port 8080 by default.

### Base URL

```
http://localhost:8080
```

Production deployments should be configured via the `NEXT_PUBLIC_API_URL`
environment variable in frontend applications.

### Authentication

The API uses **session-based authentication** via email login. No passwords are
required — sessions are identified by a session ID returned at login. The
marketing frontend stores the session ID in `localStorage`.

- `POST /auth/login` — initiates a session with an email address
- Session ID is included as a cookie or `Authorization` header in subsequent
  requests

There are no API keys or OAuth flows. The x402 payment protocol endpoints use
machine-to-machine Solana wallet verification instead.

### Pagination

List endpoints accept optional query parameters:

| Parameter  | Default | Max | Description              |
| ---------- | ------- | --- | ------------------------ |
| `page`     | 1       | —   | Page number (1-indexed)  |
| `per_page` | 10      | 100 | Items per page           |

---

## Health Check

### `GET /health`

Returns API health status.

**Response** `200 OK`:

```json
{
  "status": "ok"
}
```

---

## Evidence Management

Evidence jobs track SHA-256 digests submitted for blockchain anchoring via the
keeper service.

### `POST /evidence`

Create a new evidence job.

**Request Body**:

```json
{
  "digest_hex": "a1b2c3d4e5f6...64-char-hex-string",
  "payload_mime": "application/json",
  "metadata": { "source": "detector", "camera_id": "cam-01" }
}
```

| Field          | Type   | Required | Description                        |
| -------------- | ------ | -------- | ---------------------------------- |
| `id`           | string | No       | Custom ID (auto-generated if omitted) |
| `digest_hex`   | string | Yes      | SHA-256 hex digest of the evidence |
| `payload_mime` | string | No       | MIME type of the original payload  |
| `metadata`     | object | No       | Arbitrary JSON metadata            |

**Response** `201 Created`:

```json
{
  "id": "ev_01HXYZ...",
  "digest_hex": "a1b2c3d4e5f6...",
  "status": "pending",
  "attempts": 0,
  "last_error": null,
  "created_ms": 1708617600000,
  "updated_ms": 1708617600000
}
```

### `GET /evidence`

List evidence jobs (paginated).

**Query Parameters**: `page`, `per_page`

**Response** `200 OK`: Array of `EvidenceOut` objects.

### `GET /evidence/{id}`

Get a single evidence job by ID.

**Response** `200 OK`: Single `EvidenceOut` object.
**Response** `404 Not Found`: Evidence job not found.

---

## Countermeasure Deployments

Track counter-drone countermeasure deployments linked to evidence jobs.

### `POST /countermeasures`

Record a countermeasure deployment.

**Request Body**:

```json
{
  "job_id": "ev_01HXYZ...",
  "deployed_by": "operator-alpha",
  "countermeasure_type": "rf_jammer",
  "effectiveness_score": 0.95,
  "notes": "Target neutralized at 200m altitude"
}
```

| Field                 | Type   | Required | Description                          |
| --------------------- | ------ | -------- | ------------------------------------ |
| `job_id`              | string | Yes      | Associated evidence job ID           |
| `deployed_by`         | string | Yes      | Operator identifier                  |
| `countermeasure_type` | string | Yes      | Type (e.g., rf_jammer, net_capture)  |
| `effectiveness_score` | float  | No       | 0.0–1.0 effectiveness rating        |
| `notes`               | string | No       | Operator notes                       |

**Response** `201 Created`: `CountermeasureDeploymentOut` object.

### `GET /countermeasures`

List countermeasure deployments (paginated).

### `GET /countermeasures/{id}`

Get a single countermeasure deployment by ID.

---

## Signal Disruption Audits

Track RF signal disruption events for compliance auditing.

### `POST /signal-disruptions`

Record a signal disruption event.

**Request Body**:

```json
{
  "target_id": "drone-uav-042",
  "event_type": "rf_interference",
  "detected_by": "sensor-array-north",
  "severity": "high",
  "outcome": "target_grounded",
  "evidence_blob": "base64-encoded-sensor-data"
}
```

| Field           | Type   | Required | Description                     |
| --------------- | ------ | -------- | ------------------------------- |
| `target_id`     | string | Yes      | Target drone identifier         |
| `event_type`    | string | Yes      | Disruption event classification |
| `detected_by`   | string | Yes      | Detecting sensor/operator       |
| `severity`      | string | Yes      | low, medium, high, critical     |
| `outcome`       | string | Yes      | Result of the disruption        |
| `evidence_blob` | string | No       | Base64-encoded evidence data    |

**Response** `201 Created`: `SignalDisruptionAuditOut` object.

### `GET /signal-disruptions`

List signal disruption audits (paginated).

### `GET /signal-disruptions/{id}`

Get a single signal disruption audit by ID.

---

## Jamming Operations

Track electronic warfare (EW) jamming operations.

### `POST /jamming-operations`

Record a jamming operation.

**Request Body**:

```json
{
  "operation_id": "op-2026-001",
  "job_id": "ev_01HXYZ...",
  "target_frequency_range": "2.4GHz-5.8GHz",
  "power_level": 25.0,
  "success_metric": 0.98
}
```

| Field                    | Type   | Required | Description                      |
| ------------------------ | ------ | -------- | -------------------------------- |
| `operation_id`           | string | Yes      | Unique operation identifier      |
| `job_id`                 | string | Yes      | Associated evidence job ID       |
| `target_frequency_range` | string | Yes      | Targeted RF frequency band       |
| `power_level`            | float  | Yes      | Transmission power level (dBm)   |
| `success_metric`         | float  | No       | 0.0–1.0 success rating          |

**Response** `201 Created`: `JammingOperationOut` object.

### `GET /jamming-operations`

List jamming operations (paginated).

### `GET /jamming-operations/{id}`

Get a single jamming operation by ID.

---

## Authentication

### `POST /auth/login`

Initiate a session via email. No password required.

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Response** `200 OK`:

```json
{
  "session_id": "sess_01HXYZ...",
  "user": {
    "id": "usr_01HXYZ...",
    "email": "user@example.com",
    "first_name": null,
    "last_name": null,
    "is_team_member": false,
    "linkedin_url": null,
    "discord_handle": null
  },
  "expires_at": 1708704000000
}
```

### `GET /auth/me`

Get the current authenticated user.

**Headers**: `Authorization: Bearer <session_id>` or session cookie

**Response** `200 OK`: `UserOut` object.
**Response** `401 Unauthorized`: No valid session.

### `PUT /auth/profile`

Update the authenticated user's profile.

**Request Body** (all fields optional):

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "linkedin_url": "https://linkedin.com/in/janedoe",
  "discord_handle": "janedoe#1234"
}
```

**Response** `200 OK`: Updated `UserOut` object.

---

## Career Applications

### `POST /career/apply`

Submit a career application. Requires an authenticated session. Team members
cannot apply (returns `409 Conflict`).

**Request Body**:

```json
{
  "position": "Rust Backend Engineer",
  "cover_letter": "Optional cover letter text..."
}
```

**Response** `201 Created`: `CareerApplicationOut` object.
**Response** `401 Unauthorized`: No valid session.
**Response** `409 Conflict`: User is already a team member.

---

## Preorders

### `POST /preorders`

Create a product preorder.

**Request Body**:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Security",
  "address": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "zip": "78701",
  "country": "US",
  "notes": "Interested in enterprise deployment",
  "items": [
    {
      "sku": "AERONET-ENT-001",
      "name": "AeroNet Enterprise",
      "quantity": 2,
      "unit_price": 149999.99
    }
  ]
}
```

**Response** `201 Created`:

```json
{
  "id": "po_01HXYZ...",
  "status": "pending",
  "total": 299999.98,
  "item_count": 2,
  "created_ms": 1708617600000
}
```

### `GET /preorders`

List preorders (paginated).

### `GET /preorders/{id}`

Get a single preorder by ID.

---

## x402 Payment Protocol

The x402 payment protocol enables machine-to-machine premium evidence
verification via Solana USDC payments. Disabled by default — set
`X402_ENABLED=true` and `X402_WALLET_ADDRESS` to activate.

These endpoints reject browser cookie-based authentication (M2M only).

### `POST /api/v1/evidence/verify-premium`

Submit evidence for premium blockchain verification with payment.

**Headers**: `X-402-Payment: <solana-transaction-signature>`

**Response** `200 OK`: `PaymentReceiptOut` object with transaction details.
**Response** `402 Payment Required`: Valid payment signature required.
**Response** `503 Service Unavailable`: x402 protocol not enabled.

### `GET /api/v1/x402/status`

Check x402 payment protocol status.

**Response** `200 OK`:

```json
{
  "enabled": true,
  "wallet_address": "So1ana...",
  "supported_tokens": ["USDC"]
}
```

---

## Admin Endpoints

### `POST /admin/seed-team-members`

Seed fixture team member data. Intended for development and testing.

**Response** `200 OK`: Confirmation of seeded records.

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

### Common Status Codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| 200  | Success                                        |
| 201  | Created                                        |
| 400  | Bad request — invalid input                    |
| 401  | Unauthorized — missing or invalid session      |
| 402  | Payment required — x402 payment needed         |
| 404  | Not found                                      |
| 409  | Conflict — e.g., team member applying to role  |
| 422  | Unprocessable entity — validation failure      |
| 429  | Rate limited                                   |
| 500  | Internal server error                          |
| 503  | Service unavailable — e.g., x402 not enabled   |

---

## Database

The API uses SQLite with automatic migrations on startup. Key configuration:

- **PRAGMA foreign_keys = ON**: Enforced on every connection
- **PRAGMA extended_result_codes = ON**: Enables specific constraint violation
  detection (code 2067 for UNIQUE, 1555 for PRIMARY KEY)
- **DB URL priority**: `API_DB_URL` > `KEEPER_DB_URL` >
  `sqlite://blockchain_outbox.sqlite3`

---

## Environment Variables

| Variable              | Default                               | Description                    |
| --------------------- | ------------------------------------- | ------------------------------ |
| `API_DB_URL`          | —                                     | SQLite connection URL          |
| `KEEPER_DB_URL`       | —                                     | Fallback DB URL (shared)       |
| `RUST_LOG`            | `info`                                | Log level filter               |
| `X402_ENABLED`        | `false`                               | Enable x402 payment protocol   |
| `X402_WALLET_ADDRESS` | —                                     | Solana wallet for x402         |

---

## Integration Examples

### Create and Track an Evidence Job

```bash
# 1. Create evidence job
curl -X POST http://localhost:8080/evidence \
  -H "Content-Type: application/json" \
  -d '{"digest_hex": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}'

# 2. Check status (keeper anchors to blockchain asynchronously)
curl http://localhost:8080/evidence/ev_01HXYZ...

# 3. Record countermeasure deployment
curl -X POST http://localhost:8080/countermeasures \
  -H "Content-Type: application/json" \
  -d '{"job_id": "ev_01HXYZ...", "deployed_by": "op-1", "countermeasure_type": "net_capture"}'
```

### Authentication Flow

```bash
# 1. Login with email
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
# Returns: { "session_id": "sess_...", "user": {...}, "expires_at": ... }

# 2. Use session for authenticated requests
curl http://localhost:8080/auth/me \
  -H "Authorization: Bearer sess_..."
```

---

## Related Services

| Service           | Port | Description                              |
| ----------------- | ---- | ---------------------------------------- |
| **API**           | 8080 | This REST API                            |
| **Keeper**        | 8081 | Blockchain anchoring background service  |
| **Marketing**     | 3000 | Next.js frontend                         |
| **Docs**          | 3000 | Docusaurus documentation site            |
| **Detector**      | —    | Python drone detection (separate process)|

---

_This document reflects the actual API implementation in `apps/api/`. For the
Rust source code, see `apps/api/src/lib.rs` and `apps/api/src/models.rs`.
© 2025 Phoenix Rooivalk. All rights reserved._
