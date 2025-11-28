//! Database error utilities for portable constraint violation detection
//!
//! This module provides database-agnostic helpers for detecting constraint
//! violations across different SQL backends (SQLite, PostgreSQL, MySQL).
//!
//! # Supported Backends
//!
//! | Backend    | Unique Constraint Codes | Detection Method |
//! |------------|------------------------|------------------|
//! | SQLite     | 2067, 1555             | code() (extended codes) |
//! | SQLite     | 19                     | code() + message validation |
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
//! # Infrastructure Requirements
//!
//! For accurate SQLite unique constraint detection, enable extended result codes:
//!
//! ```sql
//! PRAGMA extended_result_codes = ON
//! ```
//!
//! This ensures SQLite returns specific codes (2067, 1555) instead of the
//! generic constraint code 19. The connection setup in `lib.rs` enables this
//! automatically.

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
///   1555 (SQLITE_CONSTRAINT_PRIMARYKEY). Code 19 (SQLITE_CONSTRAINT) requires
///   message validation to distinguish from CHECK/NOT NULL/FOREIGN KEY violations.
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
/// # Infrastructure Requirements
///
/// For SQLite, extended result codes should be enabled via:
/// ```sql
/// PRAGMA extended_result_codes = ON
/// ```
/// This ensures specific codes (2067, 1555) are returned instead of generic 19.
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
    let message = db_err.message().to_lowercase();

    // First, try driver-specific error code detection (most reliable)
    if let Some(code) = db_err.code() {
        let code_str = code.as_ref();

        // SQLite extended error codes (most specific, preferred)
        if code_str == sqlite_codes::CONSTRAINT_UNIQUE
            || code_str == sqlite_codes::CONSTRAINT_PRIMARYKEY
        {
            return true;
        }

        // SQLite base constraint code (19) - requires message validation
        // Code 19 is generic and covers ALL constraint types:
        // - UNIQUE constraint
        // - PRIMARY KEY constraint
        // - CHECK constraint
        // - NOT NULL constraint
        // - FOREIGN KEY constraint
        // We only treat it as unique if the message confirms it.
        if code_str == sqlite_codes::CONSTRAINT_BASE {
            return message_indicates_unique_violation(&message);
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
    // This is less reliable but handles edge cases and unknown drivers.
    // NOTE: Message-based detection assumes English error messages.
    // Internationalized database drivers may not be detected via fallback,
    // but code-based detection should still work for known backends.
    message_indicates_unique_violation(&message)
}

/// Checks if the error message indicates a unique constraint violation.
///
/// This helper validates message text to identify unique/duplicate violations
/// while explicitly excluding messages that indicate other constraint types.
fn message_indicates_unique_violation(message: &str) -> bool {
    // Explicit exclusion patterns for non-unique constraint violations
    // These help avoid false positives when using generic constraint code 19
    if message.contains("foreign key")
        || message.contains("not null")
        || message.contains("check constraint")
    {
        return false;
    }

    // Positive patterns for unique constraint violations
    if message.contains("unique") && message.contains("constraint") {
        return true;
    }

    // Additional patterns for different database messages
    if message.contains("duplicate key")
        || message.contains("duplicate entry")
        || message.contains("uniqueness violation")
    {
        return true;
    }

    // SQLite-specific pattern: "UNIQUE constraint failed"
    if message.contains("unique") && message.contains("failed") {
        return true;
    }

    // SQLite-specific pattern for PRIMARY KEY acting as unique
    if message.contains("primary key") && message.contains("failed") {
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
            self.code
                .as_ref()
                .map(|c| std::borrow::Cow::Borrowed(c.as_str()))
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
    fn test_sqlite_base_constraint_code_with_unique_message() {
        // Code 19 with explicit UNIQUE message should be detected
        let err = MockDatabaseError {
            code: Some("19".to_string()),
            message: "UNIQUE constraint failed: table.column".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_sqlite_base_constraint_code_with_primary_key_message() {
        // Code 19 with PRIMARY KEY message should be detected
        let err = MockDatabaseError {
            code: Some("19".to_string()),
            message: "PRIMARY KEY constraint failed".to_string(),
        };
        assert!(is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_sqlite_base_constraint_code_with_generic_message() {
        // Code 19 with generic message should NOT be detected (could be CHECK, NOT NULL, etc.)
        let err = MockDatabaseError {
            code: Some("19".to_string()),
            message: "constraint failed".to_string(),
        };
        assert!(!is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_sqlite_base_constraint_code_with_check_message() {
        // Code 19 with CHECK constraint message should NOT be detected
        let err = MockDatabaseError {
            code: Some("19".to_string()),
            message: "CHECK constraint failed: value > 0".to_string(),
        };
        assert!(!is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_sqlite_base_constraint_code_with_not_null_message() {
        // Code 19 with NOT NULL message should NOT be detected
        let err = MockDatabaseError {
            code: Some("19".to_string()),
            message: "NOT NULL constraint failed: table.column".to_string(),
        };
        assert!(!is_unique_constraint_violation(&err));
    }

    #[test]
    fn test_sqlite_base_constraint_code_with_foreign_key_message() {
        // Code 19 with FOREIGN KEY message should NOT be detected
        let err = MockDatabaseError {
            code: Some("19".to_string()),
            message: "FOREIGN KEY constraint failed".to_string(),
        };
        assert!(!is_unique_constraint_violation(&err));
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
