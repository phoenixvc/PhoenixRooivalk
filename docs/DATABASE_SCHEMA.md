# Database Schema Documentation

## Overview

Phoenix Rooivalk uses SQLite for the blockchain evidence outbox pattern. This
document describes the schema, relationships, and usage patterns.

## Database Files

| File          | Purpose                                 | Location       |
| ------------- | --------------------------------------- | -------------- |
| `keeper.db`   | Outbox pattern for blockchain anchoring | `apps/keeper/` |
| `evidence.db` | Evidence record storage (if used)       | `apps/api/`    |

## Schema Version

**Current Version:** 1.0  
**Last Updated:** November 18, 2024

---

## Tables

### `outbox_jobs`

Stores evidence anchoring jobs awaiting blockchain confirmation.

```sql
CREATE TABLE IF NOT EXISTS outbox_jobs (
    id TEXT PRIMARY KEY,
    payload_sha256 TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_ms INTEGER NOT NULL,
    updated_ms INTEGER NOT NULL,
    next_attempt_ms INTEGER NOT NULL DEFAULT 0
);
```

#### Columns

| Column            | Type    | Nullable | Description                                           |
| ----------------- | ------- | -------- | ----------------------------------------------------- |
| `id`              | TEXT    | NO       | Unique evidence record ID                             |
| `payload_sha256`  | TEXT    | NO       | SHA-256 digest of evidence payload                    |
| `status`          | TEXT    | NO       | Job status: `queued`, `in_progress`, `done`, `failed` |
| `attempts`        | INTEGER | NO       | Number of anchoring attempts                          |
| `last_error`      | TEXT    | YES      | Last error message if failed                          |
| `created_ms`      | INTEGER | NO       | Unix timestamp (ms) when job created                  |
| `updated_ms`      | INTEGER | NO       | Unix timestamp (ms) of last update                    |
| `next_attempt_ms` | INTEGER | NO       | Unix timestamp (ms) for next retry attempt            |

#### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_outbox_status
ON outbox_jobs(status, next_attempt_ms);

CREATE INDEX IF NOT EXISTS idx_outbox_created
ON outbox_jobs(created_ms);
```

#### Status State Machine

```
queued → in_progress → done
   ↓           ↓
   ↓        failed
   └──────────┘
```

- `queued`: Waiting to be processed
- `in_progress`: Currently being anchored to blockchain
- `done`: Successfully anchored and confirmed
- `failed`: Permanent failure (e.g., invalid payload)

#### Retry Logic

- Temporary failures (network issues) → status reverts to `queued`
- Exponential backoff: `next_attempt_ms = now_ms + backoff + jitter`
- Backoff formula: `min(5000 * 2^attempts, 300000)` (5s to 5min cap)
- Jitter: random 0-1000ms to prevent thundering herd

#### Example Queries

**Fetch next job:**

```sql
SELECT id, payload_sha256, created_ms
FROM outbox_jobs
WHERE status='queued' AND next_attempt_ms <= ?1
ORDER BY created_ms ASC
LIMIT 1;
```

**Update job to in_progress:**

```sql
UPDATE outbox_jobs
SET status='in_progress', updated_ms=?1, attempts=attempts+1
WHERE id=?2;
```

**Mark job as done:**

```sql
UPDATE outbox_jobs
SET status='done', updated_ms=?1
WHERE id=?2;
```

**Requeue with backoff:**

```sql
UPDATE outbox_jobs
SET status='queued', last_error=?1, updated_ms=?2, next_attempt_ms=?3
WHERE id=?4;
```

---

### `outbox_tx_refs`

Stores blockchain transaction references for each anchored evidence record.

```sql
CREATE TABLE IF NOT EXISTS outbox_tx_refs (
    job_id TEXT NOT NULL,
    network TEXT NOT NULL,
    chain TEXT NOT NULL,
    tx_id TEXT NOT NULL,
    confirmed INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER,
    PRIMARY KEY (job_id, network, chain, tx_id),
    FOREIGN KEY (job_id) REFERENCES outbox_jobs(id)
);
```

#### Columns

| Column      | Type    | Nullable | Description                                         |
| ----------- | ------- | -------- | --------------------------------------------------- |
| `job_id`    | TEXT    | NO       | References `outbox_jobs.id`                         |
| `network`   | TEXT    | NO       | Network name: `mainnet`, `devnet`, `testnet`        |
| `chain`     | TEXT    | NO       | Chain name: `solana`, `etherlink`                   |
| `tx_id`     | TEXT    | NO       | Transaction ID/signature on blockchain              |
| `confirmed` | INTEGER | NO       | 0 = pending, 1 = confirmed                          |
| `timestamp` | INTEGER | YES      | Unix timestamp (seconds) when transaction confirmed |

#### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_tx_refs_confirmed
ON outbox_tx_refs(confirmed);

CREATE INDEX IF NOT EXISTS idx_tx_refs_job
ON outbox_tx_refs(job_id);
```

#### Composite Primary Key

- Allows multiple transactions per job (multi-chain anchoring)
- Prevents duplicate transaction records

#### Example Queries

**Insert transaction reference:**

```sql
INSERT OR REPLACE INTO outbox_tx_refs
(job_id, network, chain, tx_id, confirmed, timestamp)
VALUES (?1, ?2, ?3, ?4, ?5, ?6);
```

**Fetch unconfirmed transactions:**

```sql
SELECT job_id, network, chain, tx_id, confirmed, timestamp
FROM outbox_tx_refs
WHERE confirmed = 0;
```

**Update confirmation status:**

```sql
UPDATE outbox_tx_refs
SET confirmed = ?1
WHERE tx_id = ?2 AND network = ?3 AND chain = ?4;
```

**Get all anchors for a job:**

```sql
SELECT network, chain, tx_id, confirmed, timestamp
FROM outbox_tx_refs
WHERE job_id = ?1;
```

---

## Relationships

```
outbox_jobs (1) ──< (N) outbox_tx_refs
     ↑
     │
   job_id
```

- One `outbox_jobs` record can have multiple `outbox_tx_refs` (dual-chain
  anchoring)
- Each `outbox_tx_refs` record references exactly one `outbox_jobs` record

---

## ER Diagram

```
┌─────────────────────┐
│   outbox_jobs       │
├─────────────────────┤
│ id (PK)             │───┐
│ payload_sha256      │   │
│ status              │   │
│ attempts            │   │
│ last_error          │   │
│ created_ms          │   │
│ updated_ms          │   │
│ next_attempt_ms     │   │
└─────────────────────┘   │
                          │
                          │ 1:N
                          │
                          ↓
┌─────────────────────────────────────┐
│      outbox_tx_refs                 │
├─────────────────────────────────────┤
│ job_id (PK, FK)                     │
│ network (PK)                        │
│ chain (PK)                          │
│ tx_id (PK)                          │
│ confirmed                           │
│ timestamp                           │
└─────────────────────────────────────┘
```

---

## Configuration

### WAL Mode (Recommended)

Write-Ahead Logging improves concurrency and prevents database locks.

```sql
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
```

Apply at database initialization:

```rust
sqlx::query("PRAGMA journal_mode=WAL").execute(&pool).await?;
sqlx::query("PRAGMA synchronous=NORMAL").execute(&pool).await?;
```

### Busy Timeout

Prevent immediate lock errors:

```rust
use sqlx::sqlite::SqliteConnectOptions;

let options = SqliteConnectOptions::new()
    .filename("keeper.db")
    .busy_timeout(Duration::from_secs(30));

let pool = SqlitePool::connect_with(options).await?;
```

### Auto Vacuum

Reclaim space from deleted records:

```sql
PRAGMA auto_vacuum=INCREMENTAL;
```

---

## Backup Strategy

### Manual Backup

```bash
# Online backup (WAL mode)
sqlite3 keeper.db ".backup keeper_backup_$(date +%Y%m%d).db"

# Or copy while running
cp keeper.db keeper-wal keeper-shm backups/
```

### Automated Backup

```bash
#!/bin/bash
# backup-keeper-db.sh

BACKUP_DIR="/backups/phoenix-keeper"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
sqlite3 keeper.db ".backup $BACKUP_DIR/keeper_$DATE.db"

# Keep last 30 days
find "$BACKUP_DIR" -name "keeper_*.db" -mtime +30 -delete
```

Run via cron:

```cron
0 2 * * * /scripts/backup-keeper-db.sh
```

---

## Maintenance

### Vacuum Database

Reclaim space and optimize:

```bash
sqlite3 keeper.db "VACUUM;"
```

### Analyze Statistics

Update query planner statistics:

```bash
sqlite3 keeper.db "ANALYZE;"
```

### Integrity Check

```bash
sqlite3 keeper.db "PRAGMA integrity_check;"
```

---

## Monitoring Queries

### Job Status Distribution

```sql
SELECT status, COUNT(*) as count
FROM outbox_jobs
GROUP BY status;
```

### Failed Jobs

```sql
SELECT id, last_error, attempts, updated_ms
FROM outbox_jobs
WHERE status='failed'
ORDER BY updated_ms DESC
LIMIT 10;
```

### Oldest Pending Job

```sql
SELECT id, created_ms, attempts
FROM outbox_jobs
WHERE status='queued'
ORDER BY created_ms ASC
LIMIT 1;
```

### Unconfirmed Transactions

```sql
SELECT COUNT(*) as pending_confirmations
FROM outbox_tx_refs
WHERE confirmed = 0;
```

### Average Confirmation Time

```sql
SELECT
    AVG(tx.timestamp - jobs.created_ms / 1000) as avg_confirm_time_seconds
FROM outbox_tx_refs tx
JOIN outbox_jobs jobs ON tx.job_id = jobs.id
WHERE tx.confirmed = 1;
```

---

## Migration Strategy

### Schema Versioning

Track schema version:

```sql
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL
);

INSERT INTO schema_version (version, applied_at) VALUES (1, strftime('%s', 'now'));
```

### Migration Example

```rust
async fn migrate_to_v2(pool: &Pool<Sqlite>) -> Result<()> {
    let current_version: i32 = sqlx::query_scalar("SELECT MAX(version) FROM schema_version")
        .fetch_one(pool)
        .await?;

    if current_version < 2 {
        // Apply migration
        sqlx::query("ALTER TABLE outbox_jobs ADD COLUMN priority INTEGER DEFAULT 0")
            .execute(pool)
            .await?;

        sqlx::query("INSERT INTO schema_version (version, applied_at) VALUES (2, strftime('%s', 'now'))")
            .execute(pool)
            .await?;
    }

    Ok(())
}
```

---

## Security Considerations

1. **File Permissions**: Restrict database file access

   ```bash
   chmod 600 keeper.db
   ```

2. **Encryption at Rest**: Use SQLCipher for encrypted SQLite

   ```bash
   sqlcipher keeper.db
   ```

3. **SQL Injection**: Always use parameterized queries (SQLx does this
   automatically)

4. **Backup Encryption**: Encrypt backups before offsite storage
   ```bash
   gpg --encrypt keeper_backup.db
   ```

---

## Troubleshooting

### Database is locked

- Check for long-running transactions
- Increase busy timeout
- Enable WAL mode

### High disk usage

- Run `VACUUM`
- Check for orphaned WAL files
- Implement log rotation

### Slow queries

- Run `ANALYZE` to update statistics
- Add indexes on commonly queried columns
- Check query plans with `EXPLAIN QUERY PLAN`

---

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQLx Rust Documentation](https://docs.rs/sqlx/)
- [SQLite WAL Mode](https://www.sqlite.org/wal.html)

---

_Last Updated: November 18, 2024_
