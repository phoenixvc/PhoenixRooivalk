use serde::{Deserialize, Serialize};

/// Career application entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CareerApplication {
    pub id: String,
    pub user_id: String,
    pub position: String,
    pub cover_letter: Option<String>,
    pub status: String,
    pub created_ms: i64,
    pub updated_ms: i64,
}

impl CareerApplication {
    pub fn new(
        id: String,
        user_id: String,
        position: String,
        cover_letter: Option<String>,
    ) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id,
            user_id,
            position,
            cover_letter,
            status: "pending".to_string(),
            created_ms: now,
            updated_ms: now,
        }
    }
}
