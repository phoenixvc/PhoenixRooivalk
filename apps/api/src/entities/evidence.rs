use serde::{Deserialize, Serialize};

/// Evidence entity representing an evidence job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Evidence {
    pub id: String,
    pub payload_sha256: String,
    pub status: String,
    pub attempts: i64,
    pub last_error: Option<String>,
    pub created_ms: i64,
    pub updated_ms: i64,
    pub next_attempt_ms: i64,
}

impl Evidence {
    pub fn new(id: String, payload_sha256: String) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id,
            payload_sha256,
            status: "queued".to_string(),
            attempts: 0,
            last_error: None,
            created_ms: now,
            updated_ms: now,
            next_attempt_ms: 0,
        }
    }
}
