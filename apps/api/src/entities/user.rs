use serde::{Deserialize, Serialize};

/// User entity representing a user in the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub is_team_member: bool,
    pub linkedin_url: Option<String>,
    pub discord_handle: Option<String>,
    pub created_ms: i64,
    pub updated_ms: i64,
}

impl User {
    pub fn new(
        id: String,
        email: String,
        first_name: Option<String>,
        last_name: Option<String>,
        is_team_member: bool,
        linkedin_url: Option<String>,
        discord_handle: Option<String>,
    ) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id,
            email,
            first_name,
            last_name,
            is_team_member,
            linkedin_url,
            discord_handle,
            created_ms: now,
            updated_ms: now,
        }
    }
}
