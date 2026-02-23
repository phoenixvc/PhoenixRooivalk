//! Workspace integration tests
//! 
//! This module contains comprehensive integration tests that verify
//! the interaction between different components across the entire workspace.

use phoenix_evidence::{
    model::{EvidenceRecord, EvidenceDigest, DigestAlgo, ChainTxRef},
    hash, convert, anchor::AnchorProvider,
};
use phoenix_keeper::{
    ensure_schema, JobProvider, JobProviderExt, SqliteJobProvider,
    run_job_loop, run_confirmation_loop, JobError, EvidenceJob,
};
use anchor_etherlink::{EtherlinkProvider, EtherlinkProviderStub};
use anchor_solana::{SolanaProvider, SolanaProviderStub};
use phoenix_api::{
    connection::{ConnectionManager, DatabaseUrlBuilder},
    migrations::MigrationManager,
    repository::{EvidenceRepository, RepositoryError},
    models::{EvidenceIn, EvidenceOut},
};
use sqlx::sqlite::SqlitePoolOptions;
use tempfile::NamedTempFile;
use std::time::Duration;
use chrono::Utc;
use serde_json::json;

/// Test the complete evidence lifecycle from creation to blockchain anchoring
#[tokio::test]
async fn test_complete_evidence_lifecycle() {
    // Setup database
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);
    
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url)
        .await
        .unwrap();
    
    // Initialize schema
    ensure_schema(&pool).await.unwrap();
    
    // Create evidence record
    let evidence = EvidenceRecord {
        id: "integration-test-123".to_string(),
        created_at: Utc::now(),
        digest: EvidenceDigest {
            algo: DigestAlgo::Sha256,
            hex: "abcd1234efgh5678".to_string(),
        },
        payload_mime: Some("application/json".to_string()),
        metadata: json!({
            "source": "integration_test",
            "priority": "high"
        }),
    };
    
    // Test hash function
    let hash_result = hash::sha256_hex(b"test data");
    assert_eq!(hash_result.len(), 64);
    
    // Test conversion from map
    let mut map = serde_json::Map::new();
    map.insert("id".to_string(), json!("test-id"));
    map.insert("digest_hex".to_string(), json!("abcd1234"));
    let converted_evidence = convert::from_map_to_evidence(map);
    assert_eq!(converted_evidence.id, "test-id");
    assert_eq!(converted_evidence.digest.hex, "abcd1234");
    
    // Test anchor providers
    let etherlink_stub = EtherlinkProviderStub;
    let solana_stub = SolanaProviderStub;
    
    // Test anchoring with stub providers
    let etherlink_result = etherlink_stub.anchor(&evidence).await.unwrap();
    assert_eq!(etherlink_result.network, "etherlink");
    assert_eq!(etherlink_result.chain, "testnet");
    
    let solana_result = solana_stub.anchor(&evidence).await.unwrap();
    assert_eq!(solana_result.network, "solana");
    assert_eq!(solana_result.chain, "devnet");
    
    // Test confirmation
    let confirmed_etherlink = etherlink_stub.confirm(&etherlink_result).await.unwrap();
    assert!(confirmed_etherlink.confirmed);
    
    let confirmed_solana = solana_stub.confirm(&solana_result).await.unwrap();
    assert!(confirmed_solana.confirmed);
}

/// Test the complete API workflow from HTTP request to database storage
#[tokio::test]
async fn test_api_workflow() {
    // Setup database and API
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);
    
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url)
        .await
        .unwrap();
    
    // Initialize schema using migration manager
    let migration_manager = MigrationManager::new(pool.clone());
    migration_manager.migrate().await.unwrap();
    
    // Create repository
    let repo = EvidenceRepository::new(pool.clone());
    
    // Test evidence creation
    let evidence = EvidenceIn {
        id: Some("api-workflow-test".to_string()),
        digest_hex: "api-test-hash".to_string(),
        payload_mime: Some("application/json".to_string()),
        metadata: Some(json!({
            "test": "api_workflow",
            "timestamp": Utc::now().timestamp()
        })),
    };
    
    let job_id = repo.create_evidence_job(&evidence).await.unwrap();
    assert_eq!(job_id, "api-workflow-test");
    
    // Test job retrieval
    let job = repo.get_evidence_by_id(&job_id).await.unwrap().unwrap();
    assert_eq!(job.id, "api-workflow-test");
    assert_eq!(job.status, "queued");
    
    // Test job processing workflow
    repo.mark_in_progress(&job_id).await.unwrap();
    let job = repo.get_evidence_by_id(&job_id).await.unwrap().unwrap();
    assert_eq!(job.status, "in_progress");
    
    repo.mark_completed(&job_id).await.unwrap();
    let job = repo.get_evidence_by_id(&job_id).await.unwrap().unwrap();
    assert_eq!(job.status, "done");
}

/// Test keeper job processing with real database operations
#[tokio::test]
async fn test_keeper_job_processing() {
    // Setup database
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);
    
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url)
        .await
        .unwrap();
    
    // Initialize schema
    ensure_schema(&pool).await.unwrap();
    
    // Create job provider
    let mut job_provider = SqliteJobProvider::new(pool.clone());
    
    // Insert a test job
    sqlx::query(
        "INSERT INTO outbox_jobs (id, payload_sha256, status, attempts, created_ms, updated_ms, next_attempt_ms) VALUES (?1, ?2, 'queued', 0, ?3, ?3, 0)"
    )
    .bind("keeper-test-job")
    .bind("test-hash")
    .bind(Utc::now().timestamp_millis())
    .execute(&pool)
    .await
    .unwrap();
    
    // Test job fetching
    let job = job_provider.fetch_next().await.unwrap().unwrap();
    assert_eq!(job.id, "keeper-test-job");
    
    // Test job completion
    job_provider.mark_done("keeper-test-job").await.unwrap();
    
    // Verify job is marked as done
    let status: String = sqlx::query_scalar("SELECT status FROM outbox_jobs WHERE id = 'keeper-test-job'")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(status, "done");
}

/// Test error handling across the entire system
#[tokio::test]
async fn test_system_error_handling() {
    // Test evidence hash with various inputs
    let empty_hash = hash::sha256_hex(b"");
    assert_eq!(empty_hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    
    let simple_hash = hash::sha256_hex(b"hello");
    assert_eq!(simple_hash, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    
    // Test conversion with minimal input
    let empty_map = serde_json::Map::new();
    let evidence = convert::from_map_to_evidence(empty_map);
    assert_eq!(evidence.id, "");
    assert_eq!(evidence.digest.hex, "");
    
    // Test database error handling
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);
    
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url)
        .await
        .unwrap();
    
    let repo = EvidenceRepository::new(pool);
    repo.ensure_schema().await.unwrap();
    
    // Test duplicate job creation
    let evidence = EvidenceIn {
        id: Some("error-test".to_string()),
        digest_hex: "test-hash".to_string(),
        payload_mime: None,
        metadata: None,
    };
    
    // First creation should succeed
    let job_id = repo.create_evidence_job(&evidence).await.unwrap();
    assert_eq!(job_id, "error-test");
    
    // Second creation should fail
    let result = repo.create_evidence_job(&evidence).await;
    assert!(matches!(result, Err(RepositoryError::Conflict(_))));
    
    // Test not found error
    let result = repo.get_evidence_by_id("non-existent").await.unwrap();
    assert!(result.is_none());
}

/// Test connection management and health checking
#[tokio::test]
async fn test_connection_management() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);
    
    // Test connection manager
    let manager = ConnectionManager::new(&db_url).await.unwrap();
    manager.test_connection().await.unwrap();
    
    // Test health checking
    let health = phoenix_api::connection::HealthChecker::check_health(manager.pool()).await.unwrap();
    assert!(health.is_healthy);
    assert!(health.response_time < Duration::from_secs(1));
    
    // Test connection statistics
    let stats = manager.get_stats().await.unwrap();
    assert!(stats.size >= 1);
    assert!(stats.active >= 0);
    assert!(stats.idle >= 0);
}

/// Test migration system
#[tokio::test]
async fn test_migration_system() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);
    
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url)
        .await
        .unwrap();
    
    let migration_manager = MigrationManager::new(pool);
    
    // Run migrations
    migration_manager.migrate().await.unwrap();
    
    // Check status
    let status = migration_manager.get_status().await.unwrap();
    assert!(status.is_up_to_date);
    assert_eq!(status.current_version, status.latest_version);
    assert_eq!(status.applied_migrations.len(), status.latest_version as usize);
    
    // Test idempotency
    migration_manager.migrate().await.unwrap();
    let status = migration_manager.get_status().await.unwrap();
    assert!(status.is_up_to_date);
}

/// Test anchor provider implementations
#[tokio::test]
async fn test_anchor_providers() {
    // Test Etherlink provider
    let etherlink_stub = EtherlinkProviderStub;
    let etherlink_provider = EtherlinkProvider::new(
        "https://testnet.etherlink.com".to_string(),
        "testnet".to_string(),
        Some("test-key".to_string()),
    ).unwrap();
    
    assert_eq!(etherlink_provider.endpoint, "https://testnet.etherlink.com");
    assert_eq!(etherlink_provider.network, "testnet");
    
    // Test Solana provider
    let solana_stub = SolanaProviderStub;
    let solana_provider = SolanaProvider::new(
        "https://api.devnet.solana.com".to_string(),
        "devnet".to_string(),
    );
    
    assert_eq!(solana_provider.endpoint, "https://api.devnet.solana.com");
    assert_eq!(solana_provider.network, "devnet");
    
    // Test evidence anchoring
    let evidence = EvidenceRecord {
        id: "anchor-test".to_string(),
        created_at: Utc::now(),
        digest: EvidenceDigest {
            algo: DigestAlgo::Sha256,
            hex: "anchor-test-hash".to_string(),
        },
        payload_mime: None,
        metadata: json!({}),
    };
    
    // Test stub anchoring
    let etherlink_result = etherlink_stub.anchor(&evidence).await.unwrap();
    assert_eq!(etherlink_result.network, "etherlink");
    assert_eq!(etherlink_result.chain, "testnet");
    
    let solana_result = solana_stub.anchor(&evidence).await.unwrap();
    assert_eq!(solana_result.network, "solana");
    assert_eq!(solana_result.chain, "devnet");
}

/// Test job processing with mock anchor provider
#[tokio::test]
async fn test_job_processing_with_mock_anchor() {
    // Setup database
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);
    
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url)
        .await
        .unwrap();
    
    // Initialize schema
    ensure_schema(&pool).await.unwrap();
    
    // Insert test job
    sqlx::query(
        "INSERT INTO outbox_jobs (id, payload_sha256, status, attempts, created_ms, updated_ms, next_attempt_ms) VALUES (?1, ?2, 'queued', 0, ?3, ?3, 0)"
    )
    .bind("mock-anchor-test")
    .bind("mock-hash")
    .bind(Utc::now().timestamp_millis())
    .execute(&pool)
    .await
    .unwrap();
    
    // Create job provider and mock anchor
    let mut job_provider = SqliteJobProvider::new(pool.clone());
    let mock_anchor = EtherlinkProviderStub;
    
    // Test job processing
    let job = job_provider.fetch_next().await.unwrap().unwrap();
    assert_eq!(job.id, "mock-anchor-test");
    
    // Test anchoring
    let evidence = EvidenceRecord {
        id: job.id.clone(),
        created_at: Utc::now(),
        digest: EvidenceDigest {
            algo: DigestAlgo::Sha256,
            hex: job.payload_sha256.clone(),
        },
        payload_mime: None,
        metadata: json!({}),
    };
    
    let tx_ref = mock_anchor.anchor(&evidence).await.unwrap();
    assert_eq!(tx_ref.network, "etherlink");
    
    // Test confirmation
    let confirmed_tx = mock_anchor.confirm(&tx_ref).await.unwrap();
    assert!(confirmed_tx.confirmed);
    
    // Mark job as done
    job_provider.mark_done(&job.id).await.unwrap();
    
    // Verify job completion
    let status: String = sqlx::query_scalar("SELECT status FROM outbox_jobs WHERE id = ?1")
        .bind(&job.id)
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(status, "done");
}

/// Test pagination and statistics
#[tokio::test]
async fn test_pagination_and_statistics() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);
    
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url)
        .await
        .unwrap();
    
    let repo = EvidenceRepository::new(pool);
    repo.ensure_schema().await.unwrap();
    
    // Create multiple jobs
    for i in 0..10 {
        let evidence = EvidenceIn {
            id: Some(format!("pagination-test-{}", i)),
            digest_hex: format!("hash-{}", i),
            payload_mime: None,
            metadata: None,
        };
        repo.create_evidence_job(&evidence).await.unwrap();
    }
    
    // Test pagination
    let (jobs, total) = repo.list_evidence_jobs(5, 0).await.unwrap();
    assert_eq!(jobs.len(), 5);
    assert_eq!(total, 10);
    
    // Test second page
    let (jobs, total) = repo.list_evidence_jobs(5, 5).await.unwrap();
    assert_eq!(jobs.len(), 5);
    assert_eq!(total, 10);
    
    // Test statistics
    let stats = repo.get_job_stats().await.unwrap();
    assert_eq!(stats.total, 10);
    assert_eq!(stats.queued, 10);
    assert_eq!(stats.done, 0);
    
    // Process some jobs
    for i in 0..3 {
        let job_id = format!("pagination-test-{}", i);
        repo.mark_in_progress(&job_id).await.unwrap();
        repo.mark_completed(&job_id).await.unwrap();
    }
    
    // Check updated statistics
    let stats = repo.get_job_stats().await.unwrap();
    assert_eq!(stats.total, 10);
    assert_eq!(stats.queued, 7);
    assert_eq!(stats.done, 3);
}

/// Test database URL building for different environments
#[test]
fn test_database_url_building() {
    // Test file database
    let file_url = DatabaseUrlBuilder::sqlite("data/evidence.db");
    assert_eq!(file_url, "sqlite://data/evidence.db");
    
    // Test in-memory database
    let memory_url = DatabaseUrlBuilder::sqlite_memory();
    assert_eq!(memory_url, "sqlite://:memory:");
    
    // Test temporary database
    let temp_url = DatabaseUrlBuilder::sqlite_temp().unwrap();
    assert!(temp_url.starts_with("sqlite://"));
    assert!(temp_url.contains("phoenix_evidence.db"));
}

/// Test error conversion and handling
#[tokio::test]
async fn test_error_conversion() {
    // Test JobError conversion from sqlx::Error
    let sqlx_error = sqlx::Error::PoolClosed;
    let job_error: JobError = sqlx_error.into();
    
    match job_error {
        JobError::Temporary(msg) => {
            assert!(msg.contains("PoolClosed") || msg.contains("pool") || msg.contains("closed"));
        }
        _ => panic!("Expected Temporary error"),
    }
}

/// Test the complete cross-app flow: API creates evidence → Keeper processes → anchors
#[tokio::test]
async fn test_api_to_keeper_cross_app_flow() {
    // Shared database between API and Keeper (simulates production SQLite file)
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);

    let pool = SqlitePoolOptions::new()
        .max_connections(2)
        .connect(&db_url)
        .await
        .unwrap();

    // Initialize both API and Keeper schemas
    let migration_manager = MigrationManager::new(pool.clone());
    migration_manager.migrate().await.unwrap();
    ensure_schema(&pool).await.unwrap();

    // === API side: submit evidence ===
    let repo = EvidenceRepository::new(pool.clone());
    let evidence_in = EvidenceIn {
        id: Some("cross-app-e2e-001".to_string()),
        digest_hex: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90".to_string(),
        payload_mime: Some("application/json".to_string()),
        metadata: Some(json!({ "source": "cross-app-test" })),
    };
    let job_id = repo.create_evidence_job(&evidence_in).await.unwrap();
    assert_eq!(job_id, "cross-app-e2e-001");

    // Verify queued via API repo
    let queued_job = repo.get_evidence_by_id(&job_id).await.unwrap().unwrap();
    assert_eq!(queued_job.status, "queued");
    assert_eq!(queued_job.attempts, 0);

    // === Keeper side: fetch and process ===
    let mut job_provider = SqliteJobProvider::new(pool.clone());
    let keeper_job = job_provider.fetch_next().await.unwrap().unwrap();
    assert_eq!(keeper_job.id, "cross-app-e2e-001");
    assert_eq!(
        keeper_job.payload_sha256,
        "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90"
    );

    // Verify the API sees in_progress
    let in_progress = repo.get_evidence_by_id(&job_id).await.unwrap().unwrap();
    assert_eq!(in_progress.status, "in_progress");
    assert_eq!(in_progress.attempts, 1);

    // Anchor via stub provider
    let anchor = EtherlinkProviderStub;
    let evidence_record = EvidenceRecord {
        id: keeper_job.id.clone(),
        created_at: Utc::now(),
        digest: EvidenceDigest {
            algo: DigestAlgo::Sha256,
            hex: keeper_job.payload_sha256.clone(),
        },
        payload_mime: None,
        metadata: json!({}),
    };
    let tx_ref = anchor.anchor(&evidence_record).await.unwrap();
    assert_eq!(tx_ref.network, "etherlink");
    assert!(!tx_ref.confirmed);

    // Mark done with tx ref (full Keeper flow)
    job_provider
        .mark_tx_and_done(&keeper_job.id, &tx_ref)
        .await
        .unwrap();

    // === Verify final state from API perspective ===
    let done_job = repo.get_evidence_by_id(&job_id).await.unwrap().unwrap();
    assert_eq!(done_job.status, "done");

    // Verify tx reference stored
    let tx_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM outbox_tx_refs WHERE job_id = ?1")
            .bind(&job_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(tx_count, 1);

    // Verify tx details
    let (tx_network, tx_chain): (String, String) = sqlx::query_as(
        "SELECT network, chain FROM outbox_tx_refs WHERE job_id = ?1",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(tx_network, "etherlink");
    assert_eq!(tx_chain, "testnet");
}

/// Test API→Keeper flow with failure and retry
#[tokio::test]
async fn test_api_to_keeper_failure_and_retry() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap();
    let db_url = DatabaseUrlBuilder::sqlite(db_path);

    let pool = SqlitePoolOptions::new()
        .max_connections(2)
        .connect(&db_url)
        .await
        .unwrap();

    let migration_manager = MigrationManager::new(pool.clone());
    migration_manager.migrate().await.unwrap();
    ensure_schema(&pool).await.unwrap();

    // API creates evidence job
    let repo = EvidenceRepository::new(pool.clone());
    let evidence_in = EvidenceIn {
        id: Some("retry-test-001".to_string()),
        digest_hex: "retry-hash-001".to_string(),
        payload_mime: None,
        metadata: None,
    };
    repo.create_evidence_job(&evidence_in).await.unwrap();

    // Keeper picks it up
    let mut job_provider = SqliteJobProvider::new(pool.clone());
    let job = job_provider.fetch_next().await.unwrap().unwrap();
    assert_eq!(job.id, "retry-test-001");

    // Simulate a temporary failure
    job_provider
        .mark_failed_or_backoff(&job.id, "network timeout", true)
        .await
        .unwrap();

    // Job should be back to queued with incremented attempts
    let failed_job = repo.get_evidence_by_id("retry-test-001").await.unwrap().unwrap();
    assert_eq!(failed_job.status, "queued");
    assert!(failed_job.last_error.as_deref() == Some("network timeout"));
}

/// Test serialization and deserialization
#[tokio::test]
async fn test_serialization() {
    // Test EvidenceRecord serialization
    let evidence = EvidenceRecord {
        id: "serialization-test".to_string(),
        created_at: Utc::now(),
        digest: EvidenceDigest {
            algo: DigestAlgo::Sha256,
            hex: "serialization-hash".to_string(),
        },
        payload_mime: Some("application/json".to_string()),
        metadata: json!({"test": "serialization"}),
    };
    
    let json_str = serde_json::to_string(&evidence).unwrap();
    assert!(json_str.contains("serialization-test"));
    assert!(json_str.contains("serialization-hash"));
    
    let deserialized: EvidenceRecord = serde_json::from_str(&json_str).unwrap();
    assert_eq!(deserialized.id, evidence.id);
    assert_eq!(deserialized.digest.hex, evidence.digest.hex);
    
    // Test ChainTxRef serialization
    let tx_ref = ChainTxRef {
        network: "ethereum".to_string(),
        chain: "mainnet".to_string(),
        tx_id: "0x1234567890abcdef".to_string(),
        confirmed: true,
        timestamp: Some(Utc::now()),
    };
    
    let json_str = serde_json::to_string(&tx_ref).unwrap();
    assert!(json_str.contains("ethereum"));
    assert!(json_str.contains("mainnet"));
    assert!(json_str.contains("0x1234567890abcdef"));
    
    let deserialized: ChainTxRef = serde_json::from_str(&json_str).unwrap();
    assert_eq!(deserialized.network, tx_ref.network);
    assert_eq!(deserialized.chain, tx_ref.chain);
    assert_eq!(deserialized.tx_id, tx_ref.tx_id);
}
