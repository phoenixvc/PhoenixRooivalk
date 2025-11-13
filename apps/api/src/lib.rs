use axum::{
    routing::{get, post},
    Router,
};
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};

pub mod connection;
pub mod db;
pub mod handlers;
pub mod migrations;
pub mod models;
pub mod repository;

#[derive(Clone)]
pub struct AppState {
    pub pool: Pool<Sqlite>,
}

pub async fn build_app() -> anyhow::Result<(Router, Pool<Sqlite>)> {
    // DB pool (use API_DB_URL, fallback to KEEPER_DB_URL, then sqlite file)
    let db_url = std::env::var("API_DB_URL")
        .ok()
        .or_else(|| std::env::var("KEEPER_DB_URL").ok())
        .unwrap_or_else(|| "sqlite://blockchain_outbox.sqlite3".to_string());
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .after_connect(|conn| {
            Box::pin(async move {
                // Enforce foreign key constraints for SQLite reliability on every connection
                sqlx::query("PRAGMA foreign_keys = ON")
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

    let state = AppState { pool: pool.clone() };
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
        .with_state(state);
    Ok((app, pool))
}
