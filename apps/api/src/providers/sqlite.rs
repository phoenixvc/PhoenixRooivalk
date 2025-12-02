/// SQLite database provider implementation
use super::{
    ApplicationRepository, DatabaseProvider, EvidenceRepository, Filter, ProviderError, Result,
    SessionRepository, UserRepository,
};
use crate::entities::{CareerApplication, Evidence, Session, User};
use async_trait::async_trait;
use sqlx::{Pool, Row, Sqlite};

/// SQLite database provider
#[derive(Debug, Clone)]
pub struct SqliteProvider {
    pool: Pool<Sqlite>,
}

impl SqliteProvider {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &Pool<Sqlite> {
        &self.pool
    }
}

impl From<sqlx::Error> for ProviderError {
    fn from(error: sqlx::Error) -> Self {
        ProviderError::Database(error.to_string())
    }
}

#[async_trait]
impl DatabaseProvider for SqliteProvider {
    fn name(&self) -> &str {
        "sqlite"
    }

    async fn health_check(&self) -> Result<()> {
        sqlx::query("SELECT 1")
            .fetch_one(&self.pool)
            .await
            .map(|_| ())
            .map_err(|e| ProviderError::Connection(e.to_string()))
    }

    async fn initialize(&self) -> Result<()> {
        // Foreign key support
        sqlx::query("PRAGMA foreign_keys = ON")
            .execute(&self.pool)
            .await?;

        // Create migration table if it doesn't exist
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at INTEGER NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    async fn get_version(&self) -> Result<u32> {
        let result = sqlx::query_scalar::<_, i32>("SELECT MAX(version) FROM schema_migrations")
            .fetch_optional(&self.pool)
            .await?;

        // Convert i32 to u32, treating negative values as 0
        Ok(result.unwrap_or(0).max(0) as u32)
    }

    async fn migrate(&self, _target_version: Option<u32>) -> Result<()> {
        // For SQLite, we use the existing migration system in migrations.rs
        // This is a placeholder to satisfy the trait
        Ok(())
    }
}

#[async_trait]
impl UserRepository for SqliteProvider {
    async fn create(&self, user: &User) -> Result<String> {
        sqlx::query(
            "INSERT INTO users (id, email, first_name, last_name, is_team_member, linkedin_url, discord_handle, created_ms, updated_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
        )
        .bind(&user.id)
        .bind(&user.email)
        .bind(&user.first_name)
        .bind(&user.last_name)
        .bind(if user.is_team_member { 1 } else { 0 })
        .bind(&user.linkedin_url)
        .bind(&user.discord_handle)
        .bind(user.created_ms)
        .bind(user.updated_ms)
        .execute(&self.pool)
        .await?;

        Ok(user.id.clone())
    }

    async fn get_by_id(&self, id: &str) -> Result<Option<User>> {
        let row = sqlx::query(
            "SELECT id, email, first_name, last_name, is_team_member, linkedin_url, discord_handle, created_ms, updated_ms FROM users WHERE id = ?1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|row| User {
            id: row.get(0),
            email: row.get(1),
            first_name: row.get(2),
            last_name: row.get(3),
            is_team_member: row.get::<i64, _>(4) == 1,
            linkedin_url: row.get(5),
            discord_handle: row.get(6),
            created_ms: row.get(7),
            updated_ms: row.get(8),
        }))
    }

    async fn get_by_email(&self, email: &str) -> Result<Option<User>> {
        let row = sqlx::query(
            "SELECT id, email, first_name, last_name, is_team_member, linkedin_url, discord_handle, created_ms, updated_ms FROM users WHERE email = ?1"
        )
        .bind(email)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|row| User {
            id: row.get(0),
            email: row.get(1),
            first_name: row.get(2),
            last_name: row.get(3),
            is_team_member: row.get::<i64, _>(4) == 1,
            linkedin_url: row.get(5),
            discord_handle: row.get(6),
            created_ms: row.get(7),
            updated_ms: row.get(8),
        }))
    }

    async fn update(&self, id: &str, user: &User) -> Result<()> {
        let result = sqlx::query(
            "UPDATE users SET email = ?1, first_name = ?2, last_name = ?3, is_team_member = ?4, linkedin_url = ?5, discord_handle = ?6, updated_ms = ?7 WHERE id = ?8"
        )
        .bind(&user.email)
        .bind(&user.first_name)
        .bind(&user.last_name)
        .bind(if user.is_team_member { 1 } else { 0 })
        .bind(&user.linkedin_url)
        .bind(&user.discord_handle)
        .bind(user.updated_ms)
        .bind(id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(ProviderError::NotFound(format!(
                "User with id '{}' not found",
                id
            )));
        }

        Ok(())
    }

    async fn delete(&self, id: &str) -> Result<()> {
        let result = sqlx::query("DELETE FROM users WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(ProviderError::NotFound(format!(
                "User with id '{}' not found",
                id
            )));
        }

        Ok(())
    }

    async fn list(&self, filter: &Filter) -> Result<(Vec<User>, i64)> {
        let limit = filter.limit.unwrap_or(100);
        let offset = filter.offset.unwrap_or(0);

        // Get total count
        let count_row = sqlx::query("SELECT COUNT(*) FROM users")
            .fetch_one(&self.pool)
            .await?;
        let total: i64 = count_row.get(0);

        // Get paginated results
        let rows = sqlx::query(
            "SELECT id, email, first_name, last_name, is_team_member, linkedin_url, discord_handle, created_ms, updated_ms FROM users ORDER BY created_ms DESC LIMIT ?1 OFFSET ?2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let users = rows
            .into_iter()
            .map(|row| User {
                id: row.get(0),
                email: row.get(1),
                first_name: row.get(2),
                last_name: row.get(3),
                is_team_member: row.get::<i64, _>(4) == 1,
                linkedin_url: row.get(5),
                discord_handle: row.get(6),
                created_ms: row.get(7),
                updated_ms: row.get(8),
            })
            .collect();

        Ok((users, total))
    }
}

#[async_trait]
impl SessionRepository for SqliteProvider {
    async fn create(&self, session: &Session) -> Result<String> {
        sqlx::query(
            "INSERT INTO sessions (id, user_id, expires_at, created_ms) VALUES (?1, ?2, ?3, ?4)",
        )
        .bind(&session.id)
        .bind(&session.user_id)
        .bind(session.expires_at)
        .bind(session.created_ms)
        .execute(&self.pool)
        .await?;

        Ok(session.id.clone())
    }

    async fn get_by_id(&self, id: &str) -> Result<Option<Session>> {
        let row =
            sqlx::query("SELECT id, user_id, expires_at, created_ms FROM sessions WHERE id = ?1")
                .bind(id)
                .fetch_optional(&self.pool)
                .await?;

        Ok(row.map(|row| Session {
            id: row.get(0),
            user_id: row.get(1),
            expires_at: row.get(2),
            created_ms: row.get(3),
        }))
    }

    async fn get_by_user_id(&self, user_id: &str) -> Result<Vec<Session>> {
        let rows = sqlx::query(
            "SELECT id, user_id, expires_at, created_ms FROM sessions WHERE user_id = ?1",
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;

        let sessions = rows
            .into_iter()
            .map(|row| Session {
                id: row.get(0),
                user_id: row.get(1),
                expires_at: row.get(2),
                created_ms: row.get(3),
            })
            .collect();

        Ok(sessions)
    }

    async fn delete(&self, id: &str) -> Result<()> {
        let result = sqlx::query("DELETE FROM sessions WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(ProviderError::NotFound(format!(
                "Session with id '{}' not found",
                id
            )));
        }

        Ok(())
    }

    async fn delete_expired(&self) -> Result<u64> {
        let now = chrono::Utc::now().timestamp_millis();
        let result = sqlx::query("DELETE FROM sessions WHERE expires_at < ?1")
            .bind(now)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected())
    }
}

#[async_trait]
impl EvidenceRepository for SqliteProvider {
    async fn create(&self, evidence: &Evidence) -> Result<String> {
        sqlx::query(
            "INSERT INTO outbox_jobs (id, payload_sha256, status, attempts, last_error, created_ms, updated_ms, next_attempt_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
        )
        .bind(&evidence.id)
        .bind(&evidence.payload_sha256)
        .bind(&evidence.status)
        .bind(evidence.attempts)
        .bind(&evidence.last_error)
        .bind(evidence.created_ms)
        .bind(evidence.updated_ms)
        .bind(evidence.next_attempt_ms)
        .execute(&self.pool)
        .await?;

        Ok(evidence.id.clone())
    }

    async fn get_by_id(&self, id: &str) -> Result<Option<Evidence>> {
        let row = sqlx::query(
            "SELECT id, payload_sha256, status, attempts, last_error, created_ms, updated_ms, next_attempt_ms FROM outbox_jobs WHERE id = ?1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|row| Evidence {
            id: row.get(0),
            payload_sha256: row.get(1),
            status: row.get(2),
            attempts: row.get(3),
            last_error: row.get(4),
            created_ms: row.get(5),
            updated_ms: row.get(6),
            next_attempt_ms: row.get(7),
        }))
    }

    async fn update_status(&self, id: &str, status: &str, error: Option<&str>) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis();
        let result = sqlx::query(
            "UPDATE outbox_jobs SET status = ?1, last_error = ?2, updated_ms = ?3 WHERE id = ?4",
        )
        .bind(status)
        .bind(error)
        .bind(now)
        .bind(id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(ProviderError::NotFound(format!(
                "Evidence with id '{}' not found",
                id
            )));
        }

        Ok(())
    }

    async fn list(&self, filter: &Filter) -> Result<(Vec<Evidence>, i64)> {
        let limit = filter.limit.unwrap_or(100);
        let offset = filter.offset.unwrap_or(0);

        // Get total count
        let count_row = sqlx::query("SELECT COUNT(*) FROM outbox_jobs")
            .fetch_one(&self.pool)
            .await?;
        let total: i64 = count_row.get(0);

        // Get paginated results
        let rows = sqlx::query(
            "SELECT id, payload_sha256, status, attempts, last_error, created_ms, updated_ms, next_attempt_ms FROM outbox_jobs ORDER BY created_ms DESC LIMIT ?1 OFFSET ?2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let evidence_list = rows
            .into_iter()
            .map(|row| Evidence {
                id: row.get(0),
                payload_sha256: row.get(1),
                status: row.get(2),
                attempts: row.get(3),
                last_error: row.get(4),
                created_ms: row.get(5),
                updated_ms: row.get(6),
                next_attempt_ms: row.get(7),
            })
            .collect();

        Ok((evidence_list, total))
    }

    async fn get_ready_jobs(&self, limit: i64) -> Result<Vec<Evidence>> {
        let now = chrono::Utc::now().timestamp_millis();
        let rows = sqlx::query(
            "SELECT id, payload_sha256, status, attempts, last_error, created_ms, updated_ms, next_attempt_ms FROM outbox_jobs WHERE status = 'queued' AND next_attempt_ms <= ?1 ORDER BY created_ms ASC LIMIT ?2"
        )
        .bind(now)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        let evidence_list = rows
            .into_iter()
            .map(|row| Evidence {
                id: row.get(0),
                payload_sha256: row.get(1),
                status: row.get(2),
                attempts: row.get(3),
                last_error: row.get(4),
                created_ms: row.get(5),
                updated_ms: row.get(6),
                next_attempt_ms: row.get(7),
            })
            .collect();

        Ok(evidence_list)
    }
}

#[async_trait]
impl ApplicationRepository for SqliteProvider {
    async fn create(&self, application: &CareerApplication) -> Result<String> {
        sqlx::query(
            "INSERT INTO career_applications (id, user_id, position, cover_letter, status, created_ms, updated_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
        )
        .bind(&application.id)
        .bind(&application.user_id)
        .bind(&application.position)
        .bind(&application.cover_letter)
        .bind(&application.status)
        .bind(application.created_ms)
        .bind(application.updated_ms)
        .execute(&self.pool)
        .await?;

        Ok(application.id.clone())
    }

    async fn get_by_id(&self, id: &str) -> Result<Option<CareerApplication>> {
        let row = sqlx::query(
            "SELECT id, user_id, position, cover_letter, status, created_ms, updated_ms FROM career_applications WHERE id = ?1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|row| CareerApplication {
            id: row.get(0),
            user_id: row.get(1),
            position: row.get(2),
            cover_letter: row.get(3),
            status: row.get(4),
            created_ms: row.get(5),
            updated_ms: row.get(6),
        }))
    }

    async fn get_by_user_id(&self, user_id: &str) -> Result<Vec<CareerApplication>> {
        let rows = sqlx::query(
            "SELECT id, user_id, position, cover_letter, status, created_ms, updated_ms FROM career_applications WHERE user_id = ?1 ORDER BY created_ms DESC"
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;

        let applications = rows
            .into_iter()
            .map(|row| CareerApplication {
                id: row.get(0),
                user_id: row.get(1),
                position: row.get(2),
                cover_letter: row.get(3),
                status: row.get(4),
                created_ms: row.get(5),
                updated_ms: row.get(6),
            })
            .collect();

        Ok(applications)
    }

    async fn update_status(&self, id: &str, status: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis();
        let result = sqlx::query(
            "UPDATE career_applications SET status = ?1, updated_ms = ?2 WHERE id = ?3",
        )
        .bind(status)
        .bind(now)
        .bind(id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(ProviderError::NotFound(format!(
                "Application with id '{}' not found",
                id
            )));
        }

        Ok(())
    }

    async fn list(&self, filter: &Filter) -> Result<(Vec<CareerApplication>, i64)> {
        let limit = filter.limit.unwrap_or(100);
        let offset = filter.offset.unwrap_or(0);

        // Get total count
        let count_row = sqlx::query("SELECT COUNT(*) FROM career_applications")
            .fetch_one(&self.pool)
            .await?;
        let total: i64 = count_row.get(0);

        // Get paginated results
        let rows = sqlx::query(
            "SELECT id, user_id, position, cover_letter, status, created_ms, updated_ms FROM career_applications ORDER BY created_ms DESC LIMIT ?1 OFFSET ?2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let applications = rows
            .into_iter()
            .map(|row| CareerApplication {
                id: row.get(0),
                user_id: row.get(1),
                position: row.get(2),
                cover_letter: row.get(3),
                status: row.get(4),
                created_ms: row.get(5),
                updated_ms: row.get(6),
            })
            .collect();

        Ok((applications, total))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use uuid::Uuid;

    async fn create_test_provider() -> SqliteProvider {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();

        let provider = SqliteProvider::new(pool);
        provider.initialize().await.unwrap();

        // Run migrations
        crate::migrations::MigrationManager::new(provider.pool().clone())
            .migrate()
            .await
            .unwrap();

        provider
    }

    #[tokio::test]
    async fn test_user_crud() {
        let provider = create_test_provider().await;

        let user = User::new(
            Uuid::new_v4().to_string(),
            "test@example.com".to_string(),
            Some("Test".to_string()),
            Some("User".to_string()),
            false,
            None,
            None,
        );

        // Create
        let id = UserRepository::create(&provider, &user).await.unwrap();
        assert_eq!(id, user.id);

        // Read
        let retrieved = UserRepository::get_by_id(&provider, &id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(retrieved.email, user.email);

        // Read by email
        let by_email = UserRepository::get_by_email(&provider, "test@example.com")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(by_email.id, user.id);

        // Update
        let mut updated = retrieved.clone();
        updated.first_name = Some("Updated".to_string());
        UserRepository::update(&provider, &id, &updated)
            .await
            .unwrap();

        let retrieved = UserRepository::get_by_id(&provider, &id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(retrieved.first_name, Some("Updated".to_string()));

        // List
        let (users, total) = UserRepository::list(&provider, &Filter::default())
            .await
            .unwrap();
        assert!(total >= 1);
        assert!(!users.is_empty());

        // Delete
        UserRepository::delete(&provider, &id).await.unwrap();
        let deleted = UserRepository::get_by_id(&provider, &id).await.unwrap();
        assert!(deleted.is_none());
    }

    #[tokio::test]
    async fn test_session_crud() {
        let provider = create_test_provider().await;

        // Create user first
        let user = User::new(
            Uuid::new_v4().to_string(),
            "session@example.com".to_string(),
            None,
            None,
            false,
            None,
            None,
        );
        UserRepository::create(&provider, &user).await.unwrap();

        // Create session
        let session = Session::new(
            Uuid::new_v4().to_string(),
            user.id.clone(),
            chrono::Utc::now().timestamp_millis() + 3600000,
        );
        let id = SessionRepository::create(&provider, &session)
            .await
            .unwrap();
        assert_eq!(id, session.id);

        // Read
        let retrieved = SessionRepository::get_by_id(&provider, &id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(retrieved.user_id, user.id);

        // Get by user ID
        let sessions = SessionRepository::get_by_user_id(&provider, &user.id)
            .await
            .unwrap();
        assert_eq!(sessions.len(), 1);

        // Delete
        SessionRepository::delete(&provider, &id).await.unwrap();
        let deleted = SessionRepository::get_by_id(&provider, &id).await.unwrap();
        assert!(deleted.is_none());
    }
}
