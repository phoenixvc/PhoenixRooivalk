# Migrate

Run or inspect database migrations.

Arguments: $ARGUMENTS

If no argument is provided, show migration status. Supported arguments:

- `status` — Show current migration version and pending migrations
- `run` — Run all pending migrations (API auto-migrates on startup, but this
  forces it standalone)
- `check` — Verify migration code compiles and tests pass

## How Migrations Work

The API uses **code-based migrations** in `apps/api/src/migrations.rs`, not
file-based SQL scripts. Migrations run automatically on API startup via
`migration_manager.migrate()` in `apps/api/src/lib.rs`.

The keeper app (`apps/keeper/`) has its own migration path for the blockchain
outbox database.

## Commands

**Check migration status:**

```bash
# Start API briefly to trigger auto-migration, then check DB
cargo run -p phoenix-api -- --migrate-only 2>&1 || \
  echo "Note: API auto-migrates on startup. Start the API to apply migrations."
```

**Verify migrations compile:**

```bash
cargo test -p phoenix-api -- migration
```

**Inspect the SQLite database directly:**

```bash
sqlite3 blockchain_outbox.sqlite3 "PRAGMA user_version;"
sqlite3 blockchain_outbox.sqlite3 ".tables"
```

## Provider Support

Migrations are provider-agnostic via the `DataProvider` trait
(`apps/api/src/providers/mod.rs`):

- `SQLiteProvider` — Full migration support with version tracking
- `CosmosProvider` — No-op migrations (schema-less)

When adding a new migration:

1. Add the migration step to `migrations.rs`
2. Increment the version number
3. Add a test in the `#[cfg(test)]` block for idempotency
4. Verify both fresh-DB and upgrade-from-previous scenarios
