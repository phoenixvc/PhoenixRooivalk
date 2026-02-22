---
id: adr-0102-sqlite-operational-database
title: "ADR 0102: SQLite as Primary Operational Database"
sidebar_label: "ADR 0102: SQLite Database"
difficulty: intermediate
estimated_reading_time: 7
points: 25
tags:
  - technical
  - architecture
  - database
  - infrastructure
prerequisites: []
---

# ADR 0102: SQLite as Primary Operational Database

**Date**: 2026-02-22 **Status**: Accepted

---

## Executive Summary

1. **Problem**: The API and keeper services need a reliable, zero-configuration
   database that works on edge devices (Raspberry Pi, Jetson), cloud VMs, and
   developer laptops without external infrastructure.
2. **Decision**: Use SQLite via SQLx with enforced PRAGMAs (foreign keys,
   extended result codes), a priority-based connection URL chain, and
   idempotent versioned migrations that run automatically on startup.
3. **Trade-off**: SQLite limits concurrent write throughput and lacks built-in
   replication, but eliminates operational complexity for single-node
   edge deployments.

---

## Context

Phoenix Rooivalk deploys to diverse environments:

- **Edge devices**: Raspberry Pi 4/5, NVIDIA Jetson Nano/Xavier
- **Cloud VMs**: Azure Virtual Machines
- **Developer machines**: macOS, Linux, Windows (WSL)

The system processes evidence jobs, countermeasure deployments, signal disruption
audits, and jamming operations. The keeper service additionally maintains a
blockchain outbox for asynchronous anchoring. Both services can share the same
SQLite database file.

Requirements:

- Zero external dependencies (no PostgreSQL/MySQL server to provision)
- Works reliably on resource-constrained edge hardware
- Supports the evidence-to-blockchain pipeline with ACID guarantees
- Shared schema between API and keeper when co-located

---

## Options Considered

### Option 1: SQLite via SQLx ✅ Selected

**Description**: Embedded SQLite database accessed through the SQLx async driver
with compile-time query checking.

**Pros**:

- Zero infrastructure — single file, no server process
- Works identically on ARM edge devices and x86_64 cloud VMs
- ACID transactions for evidence integrity
- SQLx provides async access with compile-time SQL verification
- Foreign key enforcement via PRAGMA for referential integrity
- Extended result codes enable precise constraint violation detection

**Cons**:

- Single-writer limitation (one write transaction at a time)
- No built-in replication or clustering
- Maximum practical database size ~1TB (sufficient for operational data)
- No built-in full-text search (not needed for current workload)

### Option 2: PostgreSQL ❌ Rejected

**Description**: Use PostgreSQL for all environments.

**Pros**:

- Concurrent writes, full-text search, JSONB, replication
- Industry standard for production workloads

**Cons**:

- Requires running a PostgreSQL server on edge devices (resource-heavy)
- Operational complexity for field deployments
- Overkill for single-node evidence pipelines
- Raspberry Pi memory constraints (~1-4GB RAM)

### Option 3: SQLite for Edge + PostgreSQL for Cloud ❌ Rejected

**Description**: Use SQLite on edge, PostgreSQL in cloud.

**Pros**:

- Best of both worlds per environment

**Cons**:

- Two database backends to maintain, test, and debug
- Schema drift risk between SQLite and PostgreSQL dialects
- SQLx compile-time checks would need dual configuration
- Double the migration scripts

---

## Decision

### Connection URL Priority Chain

The API resolves its database URL with a three-tier fallback:

```rust
let db_url = std::env::var("API_DB_URL")
    .ok()
    .or_else(|| std::env::var("KEEPER_DB_URL").ok())
    .unwrap_or_else(|| "sqlite://blockchain_outbox.sqlite3".to_string());
```

1. **`API_DB_URL`** — explicit API-specific database (highest priority)
2. **`KEEPER_DB_URL`** — shared database with the keeper service (co-located
   deployments)
3. **Hardcoded default** — `sqlite://blockchain_outbox.sqlite3` (development
   fallback)

This allows co-located API+keeper to share one database file while supporting
separate databases when deployed independently.

### PRAGMA Enforcement

Every new connection executes two PRAGMAs via SQLx's `after_connect` hook:

```rust
.after_connect(|conn, _meta| {
    Box::pin(async move {
        sqlx::query("PRAGMA foreign_keys = ON").execute(&mut *conn).await?;
        sqlx::query("PRAGMA extended_result_codes = ON").execute(&mut *conn).await?;
        Ok(())
    })
})
```

- **`foreign_keys = ON`**: SQLite disables foreign keys by default. This PRAGMA
  enforces referential integrity on every connection (not just per-database).
- **`extended_result_codes = ON`**: Returns specific constraint codes (2067 for
  UNIQUE violations, 1555 for PRIMARY KEY) instead of the generic code 19. This
  enables `is_unique_constraint_violation()` to distinguish conflict types.

### Migration System

Migrations are managed by a custom `MigrationManager` (not SQLx's built-in
migrator) with these properties:

- **11 versioned migrations** tracked in a `schema_migrations` table
- **Idempotent**: Uses `CREATE TABLE IF NOT EXISTS` and `INSERT OR IGNORE`
- **Automatic**: Runs on every startup via `build_app()`
- **Forward-only**: No down migrations (rollback by deploying previous version)
- **Cross-service**: Migration 8 unifies schema differences between API and
  keeper (tx_refs primary key normalization)

### Connection Pool

SQLx pool configured with `max_connections(5)` — sufficient for single-node
deployments where the API handles concurrent HTTP requests but SQLite serializes
writes.

---

## Consequences

### Positive

1. **Zero ops**: No database server to install, configure, or monitor
2. **Portable**: Same database engine on Raspberry Pi, Jetson, and Azure VMs
3. **Reliable**: ACID transactions protect evidence integrity
4. **Shared state**: API and keeper can use the same SQLite file for co-located
   deployments
5. **Precise errors**: Extended result codes enable specific constraint handling

### Negative

1. **Write serialization**: Only one write transaction at a time (sufficient for
   current throughput)
2. **No replication**: Cannot replicate to read replicas (mitigated by
   blockchain anchoring for data durability)
3. **Schema coupling**: API and keeper share migration history, requiring
   coordination for schema changes

### Neutral

1. **File-based backup**: `cp database.sqlite3 backup.sqlite3` is a valid backup
   strategy for operational data (evidence integrity is blockchain-anchored)
2. **WAL mode**: Could be enabled for concurrent reads during writes if needed

---

## Related ADRs

- ADR 0101: Rust Workspace and rustls-Only TLS Policy (SQLx uses `tls-rustls`)
- ADR D003: Rust and Axum for Backend (web framework)
- ADR 0200: Dual-Chain Evidence Anchoring (consumer of evidence jobs)

---

## References

- [SQLite documentation](https://www.sqlite.org/docs.html)
- [SQLx async SQLite driver](https://docs.rs/sqlx/latest/sqlx/sqlite/)
- [SQLite PRAGMA reference](https://www.sqlite.org/pragma.html)
- [Extended result codes](https://www.sqlite.org/rescode.html)

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
