pub const CREATE_OUTBOX_JOBS_TABLE: &str = r#"
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
"#;

pub const CREATE_OUTBOX_TX_REFS_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS outbox_tx_refs (
        job_id TEXT NOT NULL,
        network TEXT NOT NULL,
        chain TEXT NOT NULL,
        tx_id TEXT NOT NULL,
        confirmed INTEGER NOT NULL,
        timestamp INTEGER,
        PRIMARY KEY (job_id, network, chain)
    );
"#;

pub const ADD_NEXT_ATTEMPT_MS_COLUMN: &str = r#"
    ALTER TABLE outbox_jobs ADD COLUMN next_attempt_ms INTEGER NOT NULL DEFAULT 0
"#;
