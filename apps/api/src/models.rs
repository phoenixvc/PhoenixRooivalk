use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct Pagination {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct EvidenceIn {
    pub id: Option<String>,
    pub digest_hex: String,
    pub payload_mime: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct EvidenceOut {
    pub id: String,
    pub digest_hex: String,
    pub status: String,
    pub attempts: i64,
    pub last_error: Option<String>,
    pub created_ms: i64,
    pub updated_ms: i64,
}

// Countermeasure Deployment models
#[derive(Debug, Deserialize)]
pub struct CountermeasureDeploymentIn {
    pub job_id: String,
    pub deployed_by: String,
    pub countermeasure_type: String,
    pub effectiveness_score: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CountermeasureDeploymentOut {
    pub id: String,
    pub job_id: String,
    pub deployed_at: i64,
    pub deployed_by: String,
    pub countermeasure_type: String,
    pub effectiveness_score: Option<f64>,
    pub notes: Option<String>,
    pub created_ms: i64,
    pub updated_ms: i64,
}

// Signal Disruption Audit models
#[derive(Debug, Deserialize)]
pub struct SignalDisruptionAuditIn {
    pub target_id: String,
    pub event_type: String,
    pub detected_by: String,
    pub severity: String,
    pub outcome: String,
    pub evidence_blob: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SignalDisruptionAuditOut {
    pub id: String,
    pub target_id: String,
    pub event_type: String,
    pub event_timestamp: i64,
    pub detected_by: String,
    pub severity: String,
    pub outcome: String,
    pub evidence_blob: Option<String>,
    pub created_ms: i64,
    pub updated_ms: i64,
}

// Jamming Operation models
#[derive(Debug, Deserialize)]
pub struct JammingOperationIn {
    pub operation_id: String,
    pub job_id: String,
    pub target_frequency_range: String,
    pub power_level: f64,
    pub success_metric: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct JammingOperationOut {
    pub id: String,
    pub operation_id: String,
    pub job_id: String,
    pub started_ms: i64,
    pub ended_ms: Option<i64>,
    pub target_frequency_range: String,
    pub power_level: f64,
    pub success_metric: Option<f64>,
    pub attempts: i32,
    pub last_error: Option<String>,
    pub created_ms: i64,
    pub updated_ms: i64,
}

// x402 Payment Receipt models
#[derive(Debug, Serialize)]
pub struct PaymentReceiptOut {
    pub id: String,
    pub evidence_id: String,
    pub tx_signature: String,
    pub amount_usdc: String,
    pub tier: String,
    pub sender_wallet: Option<String>,
    pub verified_at: i64,
    pub created_ms: i64,
}

// User Authentication models
#[derive(Debug, Deserialize)]
pub struct UserLoginIn {
    pub email: String,
}

#[derive(Debug, Serialize)]
pub struct UserOut {
    pub id: String,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub is_team_member: bool,
    pub linkedin_url: Option<String>,
    pub discord_handle: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SessionOut {
    pub session_id: String,
    pub user: UserOut,
    pub expires_at: i64,
}

// Career Application models
#[derive(Debug, Deserialize)]
pub struct CareerApplicationIn {
    pub position: String,
    pub cover_letter: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CareerApplicationOut {
    pub id: String,
    pub user_id: String,
    pub position: String,
    pub cover_letter: Option<String>,
    pub status: String,
    pub created_ms: i64,
    pub updated_ms: i64,
}
