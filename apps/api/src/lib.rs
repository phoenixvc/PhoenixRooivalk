use axum::{
    routing::{get, post},
    Router,
};
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};

pub mod connection;
pub mod db;
pub mod db_errors;
pub mod entities;
pub mod handlers;
pub mod handlers_x402;
pub mod migrations;
pub mod models;
pub mod providers;
pub mod rate_limit;
pub mod repository;

/// Application state shared across all handlers
#[derive(Clone)]
pub struct AppState {
    /// Database connection pool
    pub pool: Pool<Sqlite>,
    /// x402 payment protocol state (None if not configured)
    pub x402: Option<handlers_x402::X402State>,
    /// Rate limiter for x402 endpoints
    pub rate_limiter: rate_limit::X402RateLimiter,
}

pub async fn build_app() -> anyhow::Result<(Router, Pool<Sqlite>)> {
    // DB pool (use API_DB_URL, fallback to KEEPER_DB_URL, then sqlite file)
    let db_url = std::env::var("API_DB_URL")
        .ok()
        .or_else(|| std::env::var("KEEPER_DB_URL").ok())
        .unwrap_or_else(|| "sqlite://blockchain_outbox.sqlite3".to_string());
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                // Enforce foreign key constraints for SQLite reliability on every connection
                sqlx::query("PRAGMA foreign_keys = ON")
                    .execute(&mut *conn)
                    .await?;
                // Enable extended result codes so we get specific constraint violation codes
                // (e.g., 2067 for UNIQUE, 1555 for PRIMARY KEY) instead of generic code 19.
                // This improves the accuracy of is_unique_constraint_violation() detection.
                sqlx::query("PRAGMA extended_result_codes = ON")
                    .execute(&mut *conn)
                    .await?;
                Ok(())
            })
        })
        .connect(&db_url)
        .await?;

    // Run full migrations (includes outbox + countermeasures + audits + jamming)
    let migration_manager = crate::migrations::MigrationManager::new(pool.clone());
    migration_manager.migrate().await?;

    // Initialize x402 payment protocol (once at startup, not per-request)
    let x402 = handlers_x402::X402State::from_env();
    if x402.is_some() {
        tracing::info!("x402 payment protocol enabled");
    } else {
        tracing::debug!("x402 payment protocol disabled (not configured)");
    }

    // Initialize rate limiter for x402 endpoints
    let rate_limiter = rate_limit::X402RateLimiter::new();
    tracing::debug!("x402 rate limiter initialized");

    let state = AppState {
        pool: pool.clone(),
        x402,
        rate_limiter,
    };
    let app = Router::new()
        .route("/health", get(handlers::health))
        // Evidence
        .route(
            "/evidence",
            post(handlers::post_evidence).get(handlers::list_evidence),
        )
        .route("/evidence/{id}", get(handlers::get_evidence))
        // Countermeasures
        .route(
            "/countermeasures",
            post(handlers::post_countermeasure).get(handlers::list_countermeasures),
        )
        .route("/countermeasures/{id}", get(handlers::get_countermeasure))
        // Signal disruptions
        .route(
            "/signal-disruptions",
            post(handlers::post_signal_disruption).get(handlers::list_signal_disruptions),
        )
        .route(
            "/signal-disruptions/{id}",
            get(handlers::get_signal_disruption),
        )
        // Jamming operations
        .route(
            "/jamming-operations",
            post(handlers::post_jamming_operation).get(handlers::list_jamming_operations),
        )
        .route(
            "/jamming-operations/{id}",
            get(handlers::get_jamming_operation),
        )
        // Authentication
        .route("/auth/login", post(handlers::post_login))
        .route("/auth/me", get(handlers::get_me))
        .route("/auth/profile", axum::routing::put(handlers::put_profile))
        // Career applications
        .route("/career/apply", post(handlers::post_career_application))
        // Admin endpoints
        .route(
            "/admin/seed-team-members",
            post(handlers::post_seed_team_members),
        )
        // x402 Premium Evidence Verification
        .route(
            "/api/v1/evidence/verify-premium",
            post(handlers_x402::verify_evidence_premium),
        )
        .route("/api/v1/x402/status", get(handlers_x402::x402_status))
        .with_state(state);
    Ok((app, pool))
}
