/// Database provider abstraction layer
/// Defines traits for database operations that can be implemented by different providers

use crate::entities::{CareerApplication, Evidence, Session, User};
use async_trait::async_trait;
use std::fmt::Debug;
use thiserror::Error;

pub mod sqlite;

#[cfg(feature = "cosmos")]
pub mod cosmos;

#[derive(Error, Debug)]
pub enum ProviderError {
    #[error("Database error: {0}")]
    Database(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Conflict: {0}")]
    Conflict(String),
    #[error("Validation error: {0}")]
    Validation(String),
    #[error("Connection error: {0}")]
    Connection(String),
}

pub type Result<T> = std::result::Result<T, ProviderError>;

/// Generic filter for querying entities
#[derive(Debug, Clone)]
pub struct Filter {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub field: Option<String>,
    pub value: Option<String>,
}

impl Default for Filter {
    fn default() -> Self {
        Self {
            limit: Some(100),
            offset: Some(0),
            field: None,
            value: None,
        }
    }
}

/// Core database provider trait
/// All database implementations must implement this trait
#[async_trait]
pub trait DatabaseProvider: Send + Sync + Debug {
    /// Get provider name (e.g., "sqlite", "cosmos")
    fn name(&self) -> &str;

    /// Check if the provider is healthy
    async fn health_check(&self) -> Result<()>;

    /// Initialize the database schema
    async fn initialize(&self) -> Result<()>;

    /// Get current schema version
    async fn get_version(&self) -> Result<u32>;

    /// Run migrations up to a specific version
    async fn migrate(&self, target_version: Option<u32>) -> Result<()>;
}

/// User repository trait
#[async_trait]
pub trait UserRepository: Send + Sync {
    /// Create a new user
    async fn create(&self, user: &User) -> Result<String>;

    /// Get user by ID
    async fn get_by_id(&self, id: &str) -> Result<Option<User>>;

    /// Get user by email
    async fn get_by_email(&self, email: &str) -> Result<Option<User>>;

    /// Update user
    async fn update(&self, id: &str, user: &User) -> Result<()>;

    /// Delete user
    async fn delete(&self, id: &str) -> Result<()>;

    /// List users with filter
    async fn list(&self, filter: &Filter) -> Result<(Vec<User>, i64)>;
}

/// Session repository trait
#[async_trait]
pub trait SessionRepository: Send + Sync {
    /// Create a new session
    async fn create(&self, session: &Session) -> Result<String>;

    /// Get session by ID
    async fn get_by_id(&self, id: &str) -> Result<Option<Session>>;

    /// Get active sessions for a user
    async fn get_by_user_id(&self, user_id: &str) -> Result<Vec<Session>>;

    /// Delete session
    async fn delete(&self, id: &str) -> Result<()>;

    /// Delete expired sessions
    async fn delete_expired(&self) -> Result<u64>;
}

/// Evidence repository trait
#[async_trait]
pub trait EvidenceRepository: Send + Sync {
    /// Create a new evidence job
    async fn create(&self, evidence: &Evidence) -> Result<String>;

    /// Get evidence by ID
    async fn get_by_id(&self, id: &str) -> Result<Option<Evidence>>;

    /// Update evidence status
    async fn update_status(&self, id: &str, status: &str, error: Option<&str>) -> Result<()>;

    /// List evidence with filter
    async fn list(&self, filter: &Filter) -> Result<(Vec<Evidence>, i64)>;

    /// Get ready jobs for processing
    async fn get_ready_jobs(&self, limit: i64) -> Result<Vec<Evidence>>;
}

/// Career application repository trait
#[async_trait]
pub trait ApplicationRepository: Send + Sync {
    /// Create a new application
    async fn create(&self, application: &CareerApplication) -> Result<String>;

    /// Get application by ID
    async fn get_by_id(&self, id: &str) -> Result<Option<CareerApplication>>;

    /// List applications by user
    async fn get_by_user_id(&self, user_id: &str) -> Result<Vec<CareerApplication>>;

    /// Update application status
    async fn update_status(&self, id: &str, status: &str) -> Result<()>;

    /// List applications with filter
    async fn list(&self, filter: &Filter) -> Result<(Vec<CareerApplication>, i64)>;
}
