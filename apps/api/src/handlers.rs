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

fn parse_pagination(pagination: Pagination) -> (i64, i64, i64) {
    let page = pagination.page.unwrap_or(1).max(1);
    let per_page = pagination.per_page.unwrap_or(10).clamp(1, 100);
    let offset = (page - 1) * per_page;
    (page, per_page, offset)
}

pub async fn health() -> &'static str {
    "OK"
}

pub async fn list_evidence(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let (page, per_page, offset) = parse_pagination(pagination);

    match list_evidence_jobs(&state.pool, per_page, offset).await {
        Ok((jobs, total_count)) => {
            let response = serde_json::json!({
                "data": jobs,
                "page": page,
                "per_page": per_page,
                "total": total_count,
            });
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
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
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn get_evidence(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match get_evidence_by_id(&state.pool, &id).await {
        Ok(Some(evidence)) => match serde_json::to_value(evidence) {
            Ok(json) => (StatusCode::OK, Json(json)).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        },
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "id": id, "status": "not_found" })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
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
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn get_countermeasure(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match get_countermeasure_deployment_by_id(&state.pool, &id).await {
        Ok(Some(deployment)) => match serde_json::to_value(deployment) {
            Ok(json) => (StatusCode::OK, Json(json)).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        },
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "id": id, "status": "not_found" })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn list_countermeasures(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let (page, per_page, offset) = parse_pagination(pagination);

    match list_countermeasure_deployments(&state.pool, per_page, offset).await {
        Ok((deployments, total_count)) => {
            let response = serde_json::json!({
                "data": deployments,
                "page": page,
                "per_page": per_page,
                "total": total_count,
            });
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
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
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn get_signal_disruption(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match get_signal_disruption_audit_by_id(&state.pool, &id).await {
        Ok(Some(audit)) => match serde_json::to_value(audit) {
            Ok(json) => (StatusCode::OK, Json(json)).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        },
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "id": id, "status": "not_found" })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn list_signal_disruptions(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let (page, per_page, offset) = parse_pagination(pagination);

    match list_signal_disruption_audits(&state.pool, per_page, offset).await {
        Ok((audits, total_count)) => {
            let response = serde_json::json!({
                "data": audits,
                "page": page,
                "per_page": per_page,
                "total": total_count,
            });
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
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
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn get_jamming_operation(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match get_jamming_operation_by_id(&state.pool, &id).await {
        Ok(Some(operation)) => match serde_json::to_value(operation) {
            Ok(json) => (StatusCode::OK, Json(json)).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        },
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "id": id, "status": "not_found" })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn list_jamming_operations(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let (page, per_page, offset) = parse_pagination(pagination);

    match crate::db::list_jamming_operations(&state.pool, per_page, offset).await {
        Ok((operations, total_count)) => {
            let response = serde_json::json!({
                "data": operations,
                "page": page,
                "per_page": per_page,
                "total": total_count,
            });
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}
