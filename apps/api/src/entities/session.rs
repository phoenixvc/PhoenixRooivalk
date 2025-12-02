use serde::{Deserialize, Serialize};

/// Session entity representing a user session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub user_id: String,
    pub expires_at: i64,
    pub created_ms: i64,
}

impl Session {
    pub fn new(id: String, user_id: String, expires_at: i64) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id,
            user_id,
            expires_at,
            created_ms: now,
        }
    }

    pub fn is_expired(&self) -> bool {
        let now = chrono::Utc::now().timestamp_millis();
        now >= self.expires_at
    }
}
