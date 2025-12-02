use crate::{
    db::{
        create_countermeasure_deployment, create_evidence_job, create_jamming_operation,
        create_signal_disruption_audit, get_countermeasure_deployment_by_id, get_evidence_by_id,
        get_jamming_operation_by_id, get_signal_disruption_audit_by_id,
        list_countermeasure_deployments, list_evidence_jobs, list_signal_disruption_audits,
    },
    models::{
        CountermeasureDeploymentIn, EvidenceIn, JammingOperationIn, Pagination,
        SignalDisruptionAuditIn,
    },
    AppState,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Serialize;

/// Parse pagination parameters and calculate offset
/// Returns (page, items_per_page, offset)
fn parse_pagination(pagination: Pagination) -> (i64, i64, i64) {
    let page = pagination.page.unwrap_or(1).max(1);
    let per_page = pagination.per_page.unwrap_or(10).clamp(1, 100);
    let offset = (page - 1) * per_page;
    (page, per_page, offset)
}

/// Create an error response with a given status code and error message
fn error_response(status: StatusCode, error: impl std::fmt::Display) -> axum::response::Response {
    (
        status,
        Json(serde_json::json!({ "error": error.to_string() })),
    )
        .into_response()
}

/// Handle GET by ID responses with consistent error handling
fn handle_get_by_id_response<T: Serialize>(
    result: Result<Option<T>, sqlx::Error>,
    id: String,
) -> axum::response::Response {
    match result {
        Ok(Some(item)) => match serde_json::to_value(item) {
            Ok(json) => (StatusCode::OK, Json(json)).into_response(),
            Err(serialization_error) => {
                error_response(StatusCode::INTERNAL_SERVER_ERROR, serialization_error)
            }
        },
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "id": id, "status": "not_found" })),
        )
            .into_response(),
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

/// Create a paginated list response
fn create_paginated_response<T: Serialize>(
    items: Vec<T>,
    page: i64,
    items_per_page: i64,
    total_count: i64,
) -> axum::response::Response {
    let response = serde_json::json!({
        "data": items,
        "page": page,
        "per_page": items_per_page,
        "total": total_count,
    });
    (StatusCode::OK, Json(response)).into_response()
}

pub async fn health() -> &'static str {
    "OK"
}

pub async fn list_evidence(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let (page, items_per_page, offset) = parse_pagination(pagination);

    match list_evidence_jobs(&state.pool, items_per_page, offset).await {
        Ok((evidence_jobs, total_count)) => {
            create_paginated_response(evidence_jobs, page, items_per_page, total_count)
        }
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

pub async fn post_evidence(
    State(state): State<AppState>,
    Json(body): Json<EvidenceIn>,
) -> impl IntoResponse {
    match create_evidence_job(&state.pool, &body).await {
        Ok((id, rows_affected)) => {
            if rows_affected > 0 {
                (
                    StatusCode::OK,
                    Json(serde_json::json!({ "id": id, "status": "queued" })),
                )
                    .into_response()
            } else {
                (StatusCode::CONFLICT, Json(serde_json::json!({ "error": "evidence with this ID already exists", "id": id }))).into_response()
            }
        }
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

pub async fn get_evidence(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let result = get_evidence_by_id(&state.pool, &id).await;
    handle_get_by_id_response(result, id)
}

// Countermeasure Deployment handlers
pub async fn post_countermeasure(
    State(state): State<AppState>,
    Json(body): Json<CountermeasureDeploymentIn>,
) -> impl IntoResponse {
    match create_countermeasure_deployment(&state.pool, &body).await {
        Ok(id) => (
            StatusCode::CREATED,
            Json(serde_json::json!({ "id": id, "status": "created" })),
        )
            .into_response(),
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

pub async fn get_countermeasure(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let result = get_countermeasure_deployment_by_id(&state.pool, &id).await;
    handle_get_by_id_response(result, id)
}

pub async fn list_countermeasures(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let (page, items_per_page, offset) = parse_pagination(pagination);

    match list_countermeasure_deployments(&state.pool, items_per_page, offset).await {
        Ok((deployments, total_count)) => {
            create_paginated_response(deployments, page, items_per_page, total_count)
        }
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

// Signal Disruption Audit handlers
pub async fn post_signal_disruption(
    State(state): State<AppState>,
    Json(body): Json<SignalDisruptionAuditIn>,
) -> impl IntoResponse {
    match create_signal_disruption_audit(&state.pool, &body).await {
        Ok(id) => (
            StatusCode::CREATED,
            Json(serde_json::json!({ "id": id, "status": "created" })),
        )
            .into_response(),
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

pub async fn get_signal_disruption(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let result = get_signal_disruption_audit_by_id(&state.pool, &id).await;
    handle_get_by_id_response(result, id)
}

pub async fn list_signal_disruptions(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let (page, items_per_page, offset) = parse_pagination(pagination);

    match list_signal_disruption_audits(&state.pool, items_per_page, offset).await {
        Ok((audits, total_count)) => {
            create_paginated_response(audits, page, items_per_page, total_count)
        }
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

// Jamming Operation handlers
pub async fn post_jamming_operation(
    State(state): State<AppState>,
    Json(body): Json<JammingOperationIn>,
) -> impl IntoResponse {
    match create_jamming_operation(&state.pool, &body).await {
        Ok(id) => (
            StatusCode::CREATED,
            Json(serde_json::json!({ "id": id, "status": "created" })),
        )
            .into_response(),
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

pub async fn get_jamming_operation(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let result = get_jamming_operation_by_id(&state.pool, &id).await;
    handle_get_by_id_response(result, id)
}

pub async fn list_jamming_operations(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let (page, items_per_page, offset) = parse_pagination(pagination);

    match crate::db::list_jamming_operations(&state.pool, items_per_page, offset).await {
        Ok((operations, total_count)) => {
            create_paginated_response(operations, page, items_per_page, total_count)
        }
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

// Authentication handlers

/// Login or create user by email (simplified auth for demo)
pub async fn post_login(
    State(state): State<AppState>,
    Json(body): Json<crate::models::UserLoginIn>,
) -> impl IntoResponse {
    // Get or create user (not a team member by default)
    match crate::db::get_or_create_user(&state.pool, &body.email, false, None, None).await {
        Ok(user) => {
            // Create session (24 hours)
            match crate::db::create_session(&state.pool, &user.id, 86400).await {
                Ok(session_id) => {
                    let expires_at = chrono::Utc::now().timestamp_millis() + (86400 * 1000);
                    let session = crate::models::SessionOut {
                        session_id,
                        user,
                        expires_at,
                    };
                    (StatusCode::OK, Json(serde_json::json!(session))).into_response()
                }
                Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
            }
        }
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

/// Get current user from session
pub async fn get_me(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let session_id = match params.get("session_id") {
        Some(id) => id,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({ "error": "Missing session_id" })),
            )
                .into_response()
        }
    };

    match crate::db::get_user_by_session(&state.pool, session_id).await {
        Ok(Some(user)) => (StatusCode::OK, Json(serde_json::json!(user))).into_response(),
        Ok(None) => (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "Invalid or expired session" })),
        )
            .into_response(),
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

/// Submit career application
pub async fn post_career_application(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
    Json(body): Json<crate::models::CareerApplicationIn>,
) -> impl IntoResponse {
    let session_id = match params.get("session_id") {
        Some(id) => id,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({ "error": "Missing session_id" })),
            )
                .into_response()
        }
    };

    // Validate session and get user
    let user = match crate::db::get_user_by_session(&state.pool, session_id).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({ "error": "Invalid or expired session" })),
            )
                .into_response()
        }
        Err(db_error) => return error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    };

    // Check if user is team member
    if user.is_team_member {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Team members cannot apply for positions" })),
        )
            .into_response();
    }

    // Create application
    match crate::db::create_career_application(
        &state.pool,
        &user.id,
        &body.position,
        body.cover_letter.as_deref(),
    )
    .await
    {
        Ok(id) => (
            StatusCode::CREATED,
            Json(serde_json::json!({ "id": id, "status": "pending" })),
        )
            .into_response(),
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}

/// Seed team members (admin endpoint - should be protected in production)
pub async fn post_seed_team_members(State(state): State<AppState>) -> impl IntoResponse {
    match crate::db::seed_team_members(&state.pool).await {
        Ok(()) => (
            StatusCode::OK,
            Json(serde_json::json!({ "status": "success", "message": "Team members seeded" })),
        )
            .into_response(),
        Err(db_error) => error_response(StatusCode::INTERNAL_SERVER_ERROR, db_error),
    }
}
