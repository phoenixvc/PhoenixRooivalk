mod common;

use phoenix_api::build_app;
use reqwest::Client;
use serde_json::json;
use sqlx::Row;

/// Helper: create a user and session, returning the session_id
async fn create_test_session(client: &Client, port: u16, email: &str) -> String {
    let resp = client
        .post(format!("http://127.0.0.1:{}/auth/login", port))
        .json(&json!({ "email": email }))
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = resp.json().await.unwrap();
    body["session_id"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn test_career_apply_success() {
    common::with_api_db_env(|| async {
        let (app, pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let session_id = create_test_session(&client, port, "applicant@example.com").await;

        let resp = client
            .post(format!(
                "http://127.0.0.1:{}/career/apply?session_id={}",
                port, session_id
            ))
            .json(&json!({
                "position": "Rust Engineer",
                "cover_letter": "I love Rust and counter-UAS systems."
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(resp.status(), 201);
        let body: serde_json::Value = resp.json().await.unwrap();
        assert!(body["id"].is_string());
        assert_eq!(body["status"].as_str().unwrap(), "pending");

        // Verify database row
        let app_id = body["id"].as_str().unwrap();
        let row = sqlx::query(
            "SELECT user_id, position, cover_letter, status FROM career_applications WHERE id = ?",
        )
        .bind(app_id)
        .fetch_one(&pool)
        .await
        .unwrap();

        assert_eq!(row.get::<String, _>("position"), "Rust Engineer");
        assert_eq!(
            row.get::<Option<String>, _>("cover_letter").unwrap(),
            "I love Rust and counter-UAS systems."
        );
        assert_eq!(row.get::<String, _>("status"), "pending");

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_career_apply_without_cover_letter() {
    common::with_api_db_env(|| async {
        let (app, pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let session_id = create_test_session(&client, port, "nocl@example.com").await;

        let resp = client
            .post(format!(
                "http://127.0.0.1:{}/career/apply?session_id={}",
                port, session_id
            ))
            .json(&json!({ "position": "Frontend Dev" }))
            .send()
            .await
            .unwrap();

        assert_eq!(resp.status(), 201);
        let body: serde_json::Value = resp.json().await.unwrap();
        assert!(body["id"].is_string());

        // cover_letter should be NULL in DB
        let app_id = body["id"].as_str().unwrap();
        let row =
            sqlx::query("SELECT cover_letter FROM career_applications WHERE id = ?")
                .bind(app_id)
                .fetch_one(&pool)
                .await
                .unwrap();

        assert!(row.get::<Option<String>, _>("cover_letter").is_none());

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_career_apply_missing_session_id() {
    common::with_api_db_env(|| async {
        let (app, _pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let resp = client
            .post(format!("http://127.0.0.1:{}/career/apply", port))
            .json(&json!({ "position": "Rust Engineer" }))
            .send()
            .await
            .unwrap();

        assert_eq!(resp.status(), 401);
        let body: serde_json::Value = resp.json().await.unwrap();
        assert_eq!(body["error"].as_str().unwrap(), "Missing session_id");

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_career_apply_invalid_session_id() {
    common::with_api_db_env(|| async {
        let (app, _pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let resp = client
            .post(format!(
                "http://127.0.0.1:{}/career/apply?session_id=bogus-session-999",
                port
            ))
            .json(&json!({ "position": "Rust Engineer" }))
            .send()
            .await
            .unwrap();

        assert_eq!(resp.status(), 401);
        let body: serde_json::Value = resp.json().await.unwrap();
        assert_eq!(
            body["error"].as_str().unwrap(),
            "Invalid or expired session"
        );

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_career_apply_team_member_rejected() {
    common::with_api_db_env(|| async {
        let (app, pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        // Create a team member user directly in the DB
        let session_id =
            create_test_session(&client, port, "team@phoenixrooivalk.com").await;

        // Promote user to team member
        sqlx::query("UPDATE users SET is_team_member = 1 WHERE email = ?")
            .bind("team@phoenixrooivalk.com")
            .execute(&pool)
            .await
            .unwrap();

        let resp = client
            .post(format!(
                "http://127.0.0.1:{}/career/apply?session_id={}",
                port, session_id
            ))
            .json(&json!({ "position": "Rust Engineer" }))
            .send()
            .await
            .unwrap();

        assert_eq!(resp.status(), 400);
        let body: serde_json::Value = resp.json().await.unwrap();
        assert_eq!(
            body["error"].as_str().unwrap(),
            "Team members cannot apply for positions"
        );

        server.abort();
    })
    .await;
}
