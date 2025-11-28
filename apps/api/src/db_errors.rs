//! Database error utilities for portable constraint violation detection
//!
//! This module provides database-agnostic helpers for detecting constraint
//! violations across different SQL backends (SQLite, PostgreSQL, MySQL).
//!
//! # Supported Backends
//!
//! | Backend    | Unique Constraint Codes | Detection Method |
//! |------------|------------------------|------------------|
//! | SQLite     | 2067, 1555, 19         | code() + message heuristic |
//! | PostgreSQL | 23505                  | code() |
//! | MySQL      | 1062                   | code() |
//!
//! # Usage
//!
//! ```rust,ignore
//! use crate::db_errors::is_unique_constraint_violation;
//!
//! match create_record(&pool, &data).await {
//!     Ok(_) => { /* success */ }
//!     Err(sqlx::Error::Database(db_err)) => {
//!         if is_unique_constraint_violation(db_err.as_ref()) {
//!             // Handle duplicate key
//!         }
//!     }
//!     Err(e) => { /* other error */ }
//! }
//! ```
//!
//! # Infrastructure Notes
//!
//! The detection relies on error codes returned by the database driver.
//! Ensure your database connection is properly configured and the driver
//! returns appropriate error metadata.

use sqlx::error::DatabaseError;

/// SQLite error codes for unique constraint violations
mod sqlite_codes {
    /// SQLITE_CONSTRAINT_UNIQUE (extended error code)
    pub const CONSTRAINT_UNIQUE: &str = "2067";
    /// SQLITE_CONSTRAINT_PRIMARYKEY (extended error code)
    pub const CONSTRAINT_PRIMARYKEY: &str = "1555";
    /// SQLITE_CONSTRAINT (base error code, less specific)
    pub const CONSTRAINT_BASE: &str = "19";
}

/// PostgreSQL error codes for unique constraint violations
mod postgres_codes {
    /// unique_violation (SQLSTATE)
    pub const UNIQUE_VIOLATION: &str = "23505";
}

/// MySQL error codes for unique constraint violations
mod mysql_codes {
    /// ER_DUP_ENTRY
    pub const DUP_ENTRY: &str = "1062";
}

/// Detects if a database error represents a unique constraint violation.
///
/// This function provides database-agnostic detection of unique constraint
/// violations by checking driver-specific error codes and falling back to
/// message text heuristics as a last resort.
///
/// # Arguments
///
/// * `db_err` - A reference to the database error from sqlx
///
/// # Returns
///
/// `true` if the error indicates a unique constraint violation, `false` otherwise.
///
/// # Supported Backends
///
/// - **SQLite**: Checks for codes 2067 (SQLITE_CONSTRAINT_UNIQUE),
///   1555 (SQLITE_CONSTRAINT_PRIMARYKEY), or 19 (SQLITE_CONSTRAINT)
/// - **PostgreSQL**: Checks for SQLSTATE 23505 (unique_violation)
/// - **MySQL**: Checks for error code 1062 (ER_DUP_ENTRY)
///
/// # Fallback Behavior
///
/// If no known error code is detected, falls back to searching the error
/// message for "unique" and "constraint" keywords. This heuristic is less
/// reliable but provides compatibility with unknown database drivers or
/// edge cases.
///
/// # Example
///
/// ```rust,ignore
/// if let sqlx::Error::Database(db_err) = &error {
///     if is_unique_constraint_violation(db_err.as_ref()) {
///         return Err(ConflictError::DuplicateEntry);
///     }
/// }
/// ```
pub fn is_unique_constraint_violation(db_err: &dyn DatabaseError) -> bool {
    // First, try driver-specific error code detection (most reliable)
    if let Some(code) = db_err.code() {
        let code_str = code.as_ref();

        // SQLite error codes
        if code_str == sqlite_codes::CONSTRAINT_UNIQUE
            || code_str == sqlite_codes::CONSTRAINT_PRIMARYKEY
            || code_str == sqlite_codes::CONSTRAINT_BASE
        {
            return true;
        }

        // PostgreSQL error codes
        if code_str == postgres_codes::UNIQUE_VIOLATION {
            return true;
        }

        // MySQL error codes
        if code_str == mysql_codes::DUP_ENTRY {
            return true;
        }
    }

    // Fallback: Check error message for unique constraint patterns
    // This is less reliable but handles edge cases and unknown drivers
    let message = db_err.message().to_lowercase();
    if message.contains("unique") && message.contains("constraint") {
        return true;
    }

    // Additional fallback patterns for different database messages
    if message.contains("duplicate key")
        || message.contains("duplicate entry")
        || message.contains("uniqueness violation")
    {
        return true;
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Mock database error for testing
    struct MockDatabaseError {
        code: Option<String>,
        message: String,
    }

    impl std::fmt::Display for MockDatabaseError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{}", self.message)
        }
    }

    impl std::fmt::Debug for MockDatabaseError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "MockDatabaseError({:?})", self.message)
        }
    }

    impl std::error::Error for MockDatabaseError {}

    impl DatabaseError for MockDatabaseError {
        fn message(&self) -> &str {
            &self.message
        }

        fn code(&self) -> Option<std::borrow::Cow<'_, str>> {
            self.code.as_ref().map(|c| std::borrow::Cow::Borrowed(c.as_str()))
        }

        fn as_error(&self) -> &(dyn std::error::Error + Send + Sync + 'static) {
            self
        }

        fn as_error_mut(&mut self) -> &mut (dyn std::error::Error + Send + Sync + 'static) {
            self
        }

        fn into_error(self: Box<Self>) -> Box<dyn std::error::Error + Send + Sync + 'static> {
            self
        }

        fn kind(&self) -> sqlx::error::ErrorKind {
            sqlx::error::ErrorKind::UniqueViolation
        }
    }

    #[test]
    fn test_sqlite_unique_constraint_code() {
        let err = MockDatabaseError {
            code: Some("2067".to_string()),
            message: "UNIQUE constraint failed".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_sqlite_primary_key_constraint_code() {
        let err = MockDatabaseError {
            code: Some("1555".to_string()),
            message: "PRIMARY KEY constraint failed".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_sqlite_base_constraint_code() {
        let err = MockDatabaseError {
            code: Some("19".to_string()),
            message: "constraint failed".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_postgres_unique_violation_code() {
        let err = MockDatabaseError {
            code: Some("23505".to_string()),
            message: "duplicate key value violates unique constraint".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_mysql_dup_entry_code() {
        let err = MockDatabaseError {
            code: Some("1062".to_string()),
            message: "Duplicate entry 'value' for key 'idx_name'".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_message_fallback_unique_constraint() {
        let err = MockDatabaseError {
            code: None,
            message: "UNIQUE constraint failed: table.column".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_message_fallback_duplicate_key() {
        let err = MockDatabaseError {
            code: None,
            message: "duplicate key value violates unique constraint".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_message_fallback_duplicate_entry() {
        let err = MockDatabaseError {
            code: None,
            message: "Duplicate entry for key".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_unrelated_error_not_detected() {
        let err = MockDatabaseError {
            code: Some("1234".to_string()),
            message: "Some other database error".to_string(),
        };
        assert!(!is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_foreign_key_violation_not_detected() {
        let err = MockDatabaseError {
            code: Some("23503".to_string()), // Postgres FK violation
            message: "foreign key constraint violated".to_string(),
        };
        assert!(!is_unique_constraint_violation(&err));
    }
}
