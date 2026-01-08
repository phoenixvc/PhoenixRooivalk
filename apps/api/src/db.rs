use crate::models::{EvidenceIn, EvidenceOut};
use chrono::Utc;
use sqlx::{Pool, Row, Sqlite};
use uuid::Uuid;

pub async fn create_evidence_job(
    pool: &Pool<Sqlite>,
    body: &EvidenceIn,
) -> Result<(String, u64), sqlx::Error> {
    let id = body
        .id
        .clone()
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    let current_timestamp_ms = Utc::now().timestamp_millis();
    let result = sqlx::query(
        "INSERT OR IGNORE INTO outbox_jobs (id, payload_sha256, status, attempts, created_ms, updated_ms) VALUES (?1, ?2, 'queued', 0, ?3, ?3)"
    )
    .bind(&id)
    .bind(&body.digest_hex)
    .bind(current_timestamp_ms)
    .execute(pool)
    .await?;
    Ok((id, result.rows_affected()))
}

pub async fn get_evidence_by_id(
    pool: &Pool<Sqlite>,
    id: &str,
) -> Result<Option<EvidenceOut>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, payload_sha256, status, attempts, last_error, created_ms, updated_ms FROM outbox_jobs WHERE id=?1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| EvidenceOut {
        id: row.get::<String, _>(0),
        digest_hex: row.get::<String, _>(1),
        status: row.get::<String, _>(2),
        attempts: row.get::<i64, _>(3),
        last_error: row.get::<Option<String>, _>(4),
        created_ms: row.get::<i64, _>(5),
        updated_ms: row.get::<i64, _>(6),
    }))
}

pub async fn list_evidence_jobs(
    pool: &Pool<Sqlite>,
    limit: i64,
    offset: i64,
) -> Result<(Vec<EvidenceOut>, i64), sqlx::Error> {
    // First, get the total count of jobs
    let count_row = sqlx::query("SELECT COUNT(*) FROM outbox_jobs")
        .fetch_one(pool)
        .await?;
    let total_count: i64 = count_row.get(0);

    // Then, get the paginated list of jobs
    let rows = sqlx::query(
        "SELECT id, payload_sha256, status, attempts, last_error, created_ms, updated_ms FROM outbox_jobs ORDER BY created_ms DESC LIMIT ?1 OFFSET ?2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let evidence_jobs = rows
        .into_iter()
        .map(|row| EvidenceOut {
            id: row.get::<String, _>(0),
            digest_hex: row.get::<String, _>(1),
            status: row.get::<String, _>(2),
            attempts: row.get::<i64, _>(3),
            last_error: row.get::<Option<String>, _>(4),
            created_ms: row.get::<i64, _>(5),
            updated_ms: row.get::<i64, _>(6),
        })
        .collect();

    Ok((evidence_jobs, total_count))
}

// Countermeasure Deployment functions
pub async fn create_countermeasure_deployment(
    pool: &Pool<Sqlite>,
    deployment: &crate::models::CountermeasureDeploymentIn,
) -> Result<String, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let current_timestamp_ms = Utc::now().timestamp_millis();

    sqlx::query(
        "INSERT INTO countermeasure_deployments (id, job_id, deployed_at, deployed_by, countermeasure_type, effectiveness_score, notes, created_ms, updated_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
    )
    .bind(&id)
    .bind(&deployment.job_id)
    .bind(current_timestamp_ms)
    .bind(&deployment.deployed_by)
    .bind(&deployment.countermeasure_type)
    .bind(deployment.effectiveness_score)
    .bind(&deployment.notes)
    .bind(current_timestamp_ms)
    .bind(current_timestamp_ms)
    .execute(pool)
    .await?;

    Ok(id)
}

pub async fn get_countermeasure_deployment_by_id(
    pool: &Pool<Sqlite>,
    id: &str,
) -> Result<Option<crate::models::CountermeasureDeploymentOut>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, job_id, deployed_at, deployed_by, countermeasure_type, effectiveness_score, notes, created_ms, updated_ms FROM countermeasure_deployments WHERE id=?1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| crate::models::CountermeasureDeploymentOut {
        id: row.get::<String, _>(0),
        job_id: row.get::<String, _>(1),
        deployed_at: row.get::<i64, _>(2),
        deployed_by: row.get::<String, _>(3),
        countermeasure_type: row.get::<String, _>(4),
        effectiveness_score: row.get::<Option<f64>, _>(5),
        notes: row.get::<Option<String>, _>(6),
        created_ms: row.get::<i64, _>(7),
        updated_ms: row.get::<i64, _>(8),
    }))
}

pub async fn list_countermeasure_deployments(
    pool: &Pool<Sqlite>,
    limit: i64,
    offset: i64,
) -> Result<(Vec<crate::models::CountermeasureDeploymentOut>, i64), sqlx::Error> {
    let count_row = sqlx::query("SELECT COUNT(*) FROM countermeasure_deployments")
        .fetch_one(pool)
        .await?;
    let total_count: i64 = count_row.get(0);

    let rows = sqlx::query(
        "SELECT id, job_id, deployed_at, deployed_by, countermeasure_type, effectiveness_score, notes, created_ms, updated_ms FROM countermeasure_deployments ORDER BY deployed_at DESC LIMIT ?1 OFFSET ?2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let deployments = rows
        .into_iter()
        .map(|row| crate::models::CountermeasureDeploymentOut {
            id: row.get::<String, _>(0),
            job_id: row.get::<String, _>(1),
            deployed_at: row.get::<i64, _>(2),
            deployed_by: row.get::<String, _>(3),
            countermeasure_type: row.get::<String, _>(4),
            effectiveness_score: row.get::<Option<f64>, _>(5),
            notes: row.get::<Option<String>, _>(6),
            created_ms: row.get::<i64, _>(7),
            updated_ms: row.get::<i64, _>(8),
        })
        .collect();

    Ok((deployments, total_count))
}

// Signal Disruption Audit functions
pub async fn create_signal_disruption_audit(
    pool: &Pool<Sqlite>,
    audit: &crate::models::SignalDisruptionAuditIn,
) -> Result<String, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let current_timestamp_ms = Utc::now().timestamp_millis();

    sqlx::query(
        "INSERT INTO signal_disruption_audit (id, target_id, event_type, event_timestamp, detected_by, severity, outcome, evidence_blob, created_ms, updated_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )
    .bind(&id)
    .bind(&audit.target_id)
    .bind(&audit.event_type)
    .bind(current_timestamp_ms)
    .bind(&audit.detected_by)
    .bind(&audit.severity)
    .bind(&audit.outcome)
    .bind(&audit.evidence_blob)
    .bind(current_timestamp_ms)
    .bind(current_timestamp_ms)
    .execute(pool)
    .await?;

    Ok(id)
}

pub async fn get_signal_disruption_audit_by_id(
    pool: &Pool<Sqlite>,
    id: &str,
) -> Result<Option<crate::models::SignalDisruptionAuditOut>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, target_id, event_type, event_timestamp, detected_by, severity, outcome, evidence_blob, created_ms, updated_ms FROM signal_disruption_audit WHERE id=?1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| crate::models::SignalDisruptionAuditOut {
        id: row.get::<String, _>(0),
        target_id: row.get::<String, _>(1),
        event_type: row.get::<String, _>(2),
        event_timestamp: row.get::<i64, _>(3),
        detected_by: row.get::<String, _>(4),
        severity: row.get::<String, _>(5),
        outcome: row.get::<String, _>(6),
        evidence_blob: row.get::<Option<String>, _>(7),
        created_ms: row.get::<i64, _>(8),
        updated_ms: row.get::<i64, _>(9),
    }))
}

pub async fn list_signal_disruption_audits(
    pool: &Pool<Sqlite>,
    limit: i64,
    offset: i64,
) -> Result<(Vec<crate::models::SignalDisruptionAuditOut>, i64), sqlx::Error> {
    let count_row = sqlx::query("SELECT COUNT(*) FROM signal_disruption_audit")
        .fetch_one(pool)
        .await?;
    let total_count: i64 = count_row.get(0);

    let rows = sqlx::query(
        "SELECT id, target_id, event_type, event_timestamp, detected_by, severity, outcome, evidence_blob, created_ms, updated_ms FROM signal_disruption_audit ORDER BY event_timestamp DESC LIMIT ?1 OFFSET ?2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let audits = rows
        .into_iter()
        .map(|row| crate::models::SignalDisruptionAuditOut {
            id: row.get::<String, _>(0),
            target_id: row.get::<String, _>(1),
            event_type: row.get::<String, _>(2),
            event_timestamp: row.get::<i64, _>(3),
            detected_by: row.get::<String, _>(4),
            severity: row.get::<String, _>(5),
            outcome: row.get::<String, _>(6),
            evidence_blob: row.get::<Option<String>, _>(7),
            created_ms: row.get::<i64, _>(8),
            updated_ms: row.get::<i64, _>(9),
        })
        .collect();

    Ok((audits, total_count))
}

// Jamming Operation functions
pub async fn create_jamming_operation(
    pool: &Pool<Sqlite>,
    operation: &crate::models::JammingOperationIn,
) -> Result<String, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let current_timestamp_ms = Utc::now().timestamp_millis();

    sqlx::query(
        "INSERT INTO jamming_operations (id, operation_id, job_id, started_ms, target_frequency_range, power_level, success_metric, attempts, created_ms, updated_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )
    .bind(&id)
    .bind(&operation.operation_id)
    .bind(&operation.job_id)
    .bind(current_timestamp_ms)
    .bind(&operation.target_frequency_range)
    .bind(operation.power_level)
    .bind(operation.success_metric)
    .bind(0) // attempts
    .bind(current_timestamp_ms)
    .bind(current_timestamp_ms)
    .execute(pool)
    .await?;

    Ok(id)
}

pub async fn get_jamming_operation_by_id(
    pool: &Pool<Sqlite>,
    id: &str,
) -> Result<Option<crate::models::JammingOperationOut>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, operation_id, job_id, started_ms, ended_ms, target_frequency_range, power_level, success_metric, attempts, last_error, created_ms, updated_ms FROM jamming_operations WHERE id=?1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| crate::models::JammingOperationOut {
        id: row.get::<String, _>(0),
        operation_id: row.get::<String, _>(1),
        job_id: row.get::<String, _>(2),
        started_ms: row.get::<i64, _>(3),
        ended_ms: row.get::<Option<i64>, _>(4),
        target_frequency_range: row.get::<String, _>(5),
        power_level: row.get::<f64, _>(6),
        success_metric: row.get::<Option<f64>, _>(7),
        attempts: row.get::<i32, _>(8),
        last_error: row.get::<Option<String>, _>(9),
        created_ms: row.get::<i64, _>(10),
        updated_ms: row.get::<i64, _>(11),
    }))
}

pub async fn list_jamming_operations(
    pool: &Pool<Sqlite>,
    limit: i64,
    offset: i64,
) -> Result<(Vec<crate::models::JammingOperationOut>, i64), sqlx::Error> {
    let count_row = sqlx::query("SELECT COUNT(*) FROM jamming_operations")
        .fetch_one(pool)
        .await?;
    let total_count: i64 = count_row.get(0);

    let rows = sqlx::query(
        "SELECT id, operation_id, job_id, started_ms, ended_ms, target_frequency_range, power_level, success_metric, attempts, last_error, created_ms, updated_ms FROM jamming_operations ORDER BY started_ms DESC LIMIT ?1 OFFSET ?2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let operations = rows
        .into_iter()
        .map(|row| crate::models::JammingOperationOut {
            id: row.get::<String, _>(0),
            operation_id: row.get::<String, _>(1),
            job_id: row.get::<String, _>(2),
            started_ms: row.get::<i64, _>(3),
            ended_ms: row.get::<Option<i64>, _>(4),
            target_frequency_range: row.get::<String, _>(5),
            power_level: row.get::<f64, _>(6),
            success_metric: row.get::<Option<f64>, _>(7),
            attempts: row.get::<i32, _>(8),
            last_error: row.get::<Option<String>, _>(9),
            created_ms: row.get::<i64, _>(10),
            updated_ms: row.get::<i64, _>(11),
        })
        .collect();

    Ok((operations, total_count))
}

// Payment Receipt functions for x402 audit trail and replay protection

/// Check if a payment signature has already been used (replay protection)
pub async fn is_payment_signature_used(
    pool: &Pool<Sqlite>,
    tx_signature: &str,
) -> Result<bool, sqlx::Error> {
    let row = sqlx::query("SELECT 1 FROM payment_receipts WHERE tx_signature = ?1")
        .bind(tx_signature)
        .fetch_optional(pool)
        .await?;
    Ok(row.is_some())
}

/// Store a payment receipt for audit trail
pub async fn create_payment_receipt(
    pool: &Pool<Sqlite>,
    evidence_id: &str,
    tx_signature: &str,
    amount_usdc: &str,
    tier: &str,
    sender_wallet: Option<&str>,
) -> Result<String, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let current_timestamp_ms = Utc::now().timestamp_millis();

    sqlx::query(
        "INSERT INTO payment_receipts (id, evidence_id, tx_signature, amount_usdc, tier, sender_wallet, verified_at, created_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
    )
    .bind(&id)
    .bind(evidence_id)
    .bind(tx_signature)
    .bind(amount_usdc)
    .bind(tier)
    .bind(sender_wallet)
    .bind(current_timestamp_ms)
    .bind(current_timestamp_ms)
    .execute(pool)
    .await?;

    Ok(id)
}

/// Get payment receipt by transaction signature
pub async fn get_payment_receipt_by_signature(
    pool: &Pool<Sqlite>,
    tx_signature: &str,
) -> Result<Option<crate::models::PaymentReceiptOut>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, evidence_id, tx_signature, amount_usdc, tier, sender_wallet, verified_at, created_ms FROM payment_receipts WHERE tx_signature = ?1"
    )
    .bind(tx_signature)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| crate::models::PaymentReceiptOut {
        id: row.get::<String, _>(0),
        evidence_id: row.get::<String, _>(1),
        tx_signature: row.get::<String, _>(2),
        amount_usdc: row.get::<String, _>(3),
        tier: row.get::<String, _>(4),
        sender_wallet: row.get::<Option<String>, _>(5),
        verified_at: row.get::<i64, _>(6),
        created_ms: row.get::<i64, _>(7),
    }))
}

// User Management functions

/// Try to parse name from email
/// Returns (first_name, last_name) if parseable
fn parse_name_from_email(email: &str) -> (Option<String>, Option<String>) {
    // Extract username part before @
    let username = email.split('@').next().unwrap_or(email);

    // Split on common separators: dot, underscore, dash
    let parts: Vec<&str> = username
        .split(['.', '_', '-'])
        .filter(|s| !s.is_empty())
        .collect();

    // Helper function to capitalize first letter safely
    fn capitalize(s: &str) -> String {
        if s.is_empty() {
            return String::new();
        }
        let mut chars = s.chars();
        match chars.next() {
            Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
            None => String::new(),
        }
    }

    match parts.len() {
        0 => (None, None),
        1 => {
            // Single part, can't determine first/last
            if parts[0].is_empty() {
                return (None, None);
            }
            (Some(capitalize(parts[0])), None)
        }
        2 => {
            // Two parts, assume first.last format
            if parts[0].is_empty() || parts[1].is_empty() {
                return (None, None);
            }
            (Some(capitalize(parts[0])), Some(capitalize(parts[1])))
        }
        _ => {
            // Multiple parts, take first and last
            if parts[0].is_empty() || parts[parts.len() - 1].is_empty() {
                return (None, None);
            }
            (
                Some(capitalize(parts[0])),
                Some(capitalize(parts[parts.len() - 1])),
            )
        }
    }
}

/// Get or create user by email, with optional team member data
pub async fn get_or_create_user(
    pool: &Pool<Sqlite>,
    email: &str,
    is_team_member: bool,
    linkedin_url: Option<&str>,
    discord_handle: Option<&str>,
) -> Result<crate::models::UserOut, sqlx::Error> {
    // Check if user exists
    let existing_user = sqlx::query(
        "SELECT id, email, first_name, last_name, is_team_member, linkedin_url, discord_handle FROM users WHERE email = ?1"
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = existing_user {
        return Ok(crate::models::UserOut {
            id: row.get::<String, _>(0),
            email: row.get::<String, _>(1),
            first_name: row.get::<Option<String>, _>(2),
            last_name: row.get::<Option<String>, _>(3),
            is_team_member: row.get::<i64, _>(4) == 1,
            linkedin_url: row.get::<Option<String>, _>(5),
            discord_handle: row.get::<Option<String>, _>(6),
        });
    }

    // Create new user
    let id = Uuid::new_v4().to_string();
    let current_timestamp_ms = Utc::now().timestamp_millis();
    let (first_name, last_name) = parse_name_from_email(email);

    sqlx::query(
        "INSERT INTO users (id, email, first_name, last_name, is_team_member, linkedin_url, discord_handle, created_ms, updated_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
    )
    .bind(&id)
    .bind(email)
    .bind(&first_name)
    .bind(&last_name)
    .bind(if is_team_member { 1 } else { 0 })
    .bind(linkedin_url)
    .bind(discord_handle)
    .bind(current_timestamp_ms)
    .bind(current_timestamp_ms)
    .execute(pool)
    .await?;

    Ok(crate::models::UserOut {
        id,
        email: email.to_string(),
        first_name,
        last_name,
        is_team_member,
        linkedin_url: linkedin_url.map(|s| s.to_string()),
        discord_handle: discord_handle.map(|s| s.to_string()),
    })
}

/// Create a session for a user
pub async fn create_session(
    pool: &Pool<Sqlite>,
    user_id: &str,
    ttl_seconds: i64,
) -> Result<String, sqlx::Error> {
    let session_id = Uuid::new_v4().to_string();
    let current_timestamp_ms = Utc::now().timestamp_millis();
    let expires_at = current_timestamp_ms + (ttl_seconds * 1000);

    sqlx::query(
        "INSERT INTO sessions (id, user_id, expires_at, created_ms) VALUES (?1, ?2, ?3, ?4)",
    )
    .bind(&session_id)
    .bind(user_id)
    .bind(expires_at)
    .bind(current_timestamp_ms)
    .execute(pool)
    .await?;

    Ok(session_id)
}

/// Validate session and return user if valid
pub async fn get_user_by_session(
    pool: &Pool<Sqlite>,
    session_id: &str,
) -> Result<Option<crate::models::UserOut>, sqlx::Error> {
    let current_timestamp_ms = Utc::now().timestamp_millis();

    let row = sqlx::query(
        "SELECT u.id, u.email, u.first_name, u.last_name, u.is_team_member, u.linkedin_url, u.discord_handle 
         FROM users u 
         JOIN sessions s ON u.id = s.user_id 
         WHERE s.id = ?1 AND s.expires_at > ?2"
    )
    .bind(session_id)
    .bind(current_timestamp_ms)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| crate::models::UserOut {
        id: row.get::<String, _>(0),
        email: row.get::<String, _>(1),
        first_name: row.get::<Option<String>, _>(2),
        last_name: row.get::<Option<String>, _>(3),
        is_team_member: row.get::<i64, _>(4) == 1,
        linkedin_url: row.get::<Option<String>, _>(5),
        discord_handle: row.get::<Option<String>, _>(6),
    }))
}

/// Update user profile
pub async fn update_user_profile(
    pool: &Pool<Sqlite>,
    user_id: &str,
    first_name: Option<&str>,
    last_name: Option<&str>,
    linkedin_url: Option<&str>,
    discord_handle: Option<&str>,
) -> Result<crate::models::UserOut, sqlx::Error> {
    let current_timestamp_ms = Utc::now().timestamp_millis();

    sqlx::query(
        "UPDATE users SET first_name = ?1, last_name = ?2, linkedin_url = ?3, discord_handle = ?4, updated_ms = ?5 WHERE id = ?6"
    )
    .bind(first_name)
    .bind(last_name)
    .bind(linkedin_url)
    .bind(discord_handle)
    .bind(current_timestamp_ms)
    .bind(user_id)
    .execute(pool)
    .await?;

    // Fetch and return updated user
    let row = sqlx::query(
        "SELECT id, email, first_name, last_name, is_team_member, linkedin_url, discord_handle FROM users WHERE id = ?1"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(crate::models::UserOut {
        id: row.get::<String, _>(0),
        email: row.get::<String, _>(1),
        first_name: row.get::<Option<String>, _>(2),
        last_name: row.get::<Option<String>, _>(3),
        is_team_member: row.get::<i64, _>(4) == 1,
        linkedin_url: row.get::<Option<String>, _>(5),
        discord_handle: row.get::<Option<String>, _>(6),
    })
}

/// Create a career application
pub async fn create_career_application(
    pool: &Pool<Sqlite>,
    user_id: &str,
    position: &str,
    cover_letter: Option<&str>,
) -> Result<String, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let current_timestamp_ms = Utc::now().timestamp_millis();

    sqlx::query(
        "INSERT INTO career_applications (id, user_id, position, cover_letter, status, created_ms, updated_ms) VALUES (?1, ?2, ?3, ?4, 'pending', ?5, ?6)"
    )
    .bind(&id)
    .bind(user_id)
    .bind(position)
    .bind(cover_letter)
    .bind(current_timestamp_ms)
    .bind(current_timestamp_ms)
    .execute(pool)
    .await?;

    Ok(id)
}

/// Seed team members from known data
pub async fn seed_team_members(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    let team_members = vec![
        (
            "smit.jurie@gmail.com",
            "Jurie",
            "Smit",
            Some("https://www.linkedin.com/in/juriesmit/"),
            None::<&str>,
        ),
        (
            "chanelle.fellinger@gmail.com",
            "Chanelle",
            "Fellinger",
            Some("https://www.linkedin.com/in/chanelle-fellinger/"),
            None::<&str>,
        ),
        (
            "martyn@phoenixrooivalk.com",
            "Martyn",
            "",
            None::<&str>,
            None::<&str>,
        ),
        (
            "pieter@phoenixrooivalk.com",
            "Pieter",
            "",
            None::<&str>,
            None::<&str>,
        ),
        (
            "eben@phoenixrooivalk.com",
            "Eben",
            "",
            None::<&str>,
            None::<&str>,
        ),
    ];

    for (email, first_name, last_name, linkedin_url, discord_handle) in team_members {
        // Check if user already exists
        let existing = sqlx::query("SELECT id FROM users WHERE email = ?1")
            .bind(email)
            .fetch_optional(pool)
            .await?;

        if existing.is_none() {
            let id = Uuid::new_v4().to_string();
            let current_timestamp_ms = Utc::now().timestamp_millis();

            sqlx::query(
                "INSERT INTO users (id, email, first_name, last_name, is_team_member, linkedin_url, discord_handle, created_ms, updated_ms) VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?7, ?8)"
            )
            .bind(&id)
            .bind(email)
            .bind(if first_name.is_empty() { None } else { Some(first_name) })
            .bind(if last_name.is_empty() { None } else { Some(last_name) })
            .bind(linkedin_url)
            .bind(discord_handle)
            .bind(current_timestamp_ms)
            .bind(current_timestamp_ms)
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}
