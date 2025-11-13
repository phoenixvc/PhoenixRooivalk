use axum::{
    routing::{get, post},
    Router,
};
use sqlx::{Pool, Sqlite};

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

macro_rules! resource_routes {
    ($path:expr, $post_handler:expr, $list_handler:expr, $get_handler:expr) => {
        Router::new()
            .route($path, post($post_handler).get($list_handler))
            .route(&format!("{}/{{id}}", $path), get($get_handler))
    };
}

pub async fn build_app(pool: Pool<Sqlite>) -> anyhow::Result<Router> {
    let state = AppState { pool: pool.clone() };
    let app = Router::new()
        .route("/health", get(handlers::health))
        .merge(resource_routes!(
            "/evidence",
            handlers::post_evidence,
            handlers::list_evidence,
            handlers::get_evidence
        ))
        .merge(resource_routes!(
            "/countermeasures",
            handlers::post_countermeasure,
            handlers::list_countermeasures,
            handlers::get_countermeasure
        ))
        .merge(resource_routes!(
            "/signal-disruptions",
            handlers::post_signal_disruption,
            handlers::list_signal_disruptions,
            handlers::get_signal_disruption
        ))
        .merge(resource_routes!(
            "/jamming-operations",
            handlers::post_jamming_operation,
            handlers::list_jamming_operations,
            handlers::get_jamming_operation
        ))
        .with_state(state);
    Ok(app)
}
