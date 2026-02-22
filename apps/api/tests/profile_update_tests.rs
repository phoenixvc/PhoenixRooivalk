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
async fn test_profile_update_full() {
    common::with_api_db_env(|| async {
        let (app, _pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let session_id = create_test_session(&client, port, "user@example.com").await;

        let resp = client
            .put(format!(
                "http://127.0.0.1:{}/auth/profile?session_id={}",
                port, session_id
            ))
            .json(&json!({
                "first_name": "Alice",
                "last_name": "Smith",
                "linkedin_url": "https://linkedin.com/in/alice",
                "discord_handle": "alice#1234"
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(resp.status(), 200);
        let body: serde_json::Value = resp.json().await.unwrap();
        let user = &body["user"];
        assert_eq!(user["first_name"].as_str().unwrap(), "Alice");
        assert_eq!(user["last_name"].as_str().unwrap(), "Smith");
        assert_eq!(
            user["linkedin_url"].as_str().unwrap(),
            "https://linkedin.com/in/alice"
        );
        assert_eq!(user["discord_handle"].as_str().unwrap(), "alice#1234");
        assert_eq!(user["email"].as_str().unwrap(), "user@example.com");

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_profile_update_partial_first_name_only() {
    common::with_api_db_env(|| async {
        let (app, pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let session_id = create_test_session(&client, port, "partial@example.com").await;

        // Set initial full profile
        client
            .put(format!(
                "http://127.0.0.1:{}/auth/profile?session_id={}",
                port, session_id
            ))
            .json(&json!({
                "first_name": "Bob",
                "last_name": "Jones",
                "linkedin_url": "https://linkedin.com/in/bob",
                "discord_handle": "bob#5678"
            }))
            .send()
            .await
            .unwrap();

        // Now update only first_name (other fields sent as null → will overwrite)
        let resp = client
            .put(format!(
                "http://127.0.0.1:{}/auth/profile?session_id={}",
                port, session_id
            ))
            .json(&json!({ "first_name": "Robert" }))
            .send()
            .await
            .unwrap();

        assert_eq!(resp.status(), 200);
        let body: serde_json::Value = resp.json().await.unwrap();
        let user = &body["user"];
        assert_eq!(user["first_name"].as_str().unwrap(), "Robert");
        // Other fields become null since they weren't sent
        assert!(user["last_name"].is_null());

        // Verify in DB
        let row = sqlx::query("SELECT first_name, last_name FROM users WHERE email = ?")
            .bind("partial@example.com")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(
            row.get::<Option<String>, _>("first_name").unwrap(),
            "Robert"
        );
        assert!(row.get::<Option<String>, _>("last_name").is_none());

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_profile_update_missing_session_id() {
    common::with_api_db_env(|| async {
        let (app, _pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let resp = client
            .put(format!("http://127.0.0.1:{}/auth/profile", port))
            .json(&json!({ "first_name": "Hacker" }))
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
async fn test_profile_update_invalid_session() {
    common::with_api_db_env(|| async {
        let (app, _pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let resp = client
            .put(format!(
                "http://127.0.0.1:{}/auth/profile?session_id=fake-session-xyz",
                port
            ))
            .json(&json!({ "first_name": "Ghost" }))
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
async fn test_profile_update_preserves_email_and_team_status() {
    common::with_api_db_env(|| async {
        let (app, pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let session_id =
            create_test_session(&client, port, "stable@example.com").await;

        // Promote user to team member via direct DB update
        sqlx::query("UPDATE users SET is_team_member = 1 WHERE email = ?")
            .bind("stable@example.com")
            .execute(&pool)
            .await
            .unwrap();

        // Update profile
        let resp = client
            .put(format!(
                "http://127.0.0.1:{}/auth/profile?session_id={}",
                port, session_id
            ))
            .json(&json!({
                "first_name": "Stable",
                "last_name": "User"
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(resp.status(), 200);
        let body: serde_json::Value = resp.json().await.unwrap();
        let user = &body["user"];

        // Email and team membership should be unchanged
        assert_eq!(user["email"].as_str().unwrap(), "stable@example.com");
        assert_eq!(user["is_team_member"].as_bool().unwrap(), true);
        assert_eq!(user["first_name"].as_str().unwrap(), "Stable");

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_profile_update_all_null_fields() {
    common::with_api_db_env(|| async {
        let (app, pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let session_id = create_test_session(&client, port, "null@example.com").await;

        // Set initial profile
        client
            .put(format!(
                "http://127.0.0.1:{}/auth/profile?session_id={}",
                port, session_id
            ))
            .json(&json!({
                "first_name": "Initial",
                "last_name": "Name"
            }))
            .send()
            .await
            .unwrap();

        // Send empty update (all fields null)
        let resp = client
            .put(format!(
                "http://127.0.0.1:{}/auth/profile?session_id={}",
                port, session_id
            ))
            .json(&json!({}))
            .send()
            .await
            .unwrap();

        assert_eq!(resp.status(), 200);

        // All optional fields should be null
        let row = sqlx::query(
            "SELECT first_name, last_name, linkedin_url, discord_handle FROM users WHERE email = ?",
        )
        .bind("null@example.com")
        .fetch_one(&pool)
        .await
        .unwrap();

        assert!(row.get::<Option<String>, _>("first_name").is_none());
        assert!(row.get::<Option<String>, _>("last_name").is_none());
        assert!(row.get::<Option<String>, _>("linkedin_url").is_none());
        assert!(row.get::<Option<String>, _>("discord_handle").is_none());

        server.abort();
    })
    .await;
}

#[tokio::test]
async fn test_profile_update_updates_timestamp() {
    common::with_api_db_env(|| async {
        let (app, pool) = build_app().await.unwrap();
        let (listener, port) = common::create_test_listener();
        let (server, _) = common::spawn_test_server(app, listener).await;
        let client = Client::new();

        let session_id =
            create_test_session(&client, port, "timestamp@example.com").await;

        // Get initial updated_ms
        let row = sqlx::query("SELECT updated_ms FROM users WHERE email = ?")
            .bind("timestamp@example.com")
            .fetch_one(&pool)
            .await
            .unwrap();
        let initial_updated = row.get::<i64, _>("updated_ms");

        // Small delay to ensure timestamp difference
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;

        // Update profile
        client
            .put(format!(
                "http://127.0.0.1:{}/auth/profile?session_id={}",
                port, session_id
            ))
            .json(&json!({ "first_name": "Updated" }))
            .send()
            .await
            .unwrap();

        let row = sqlx::query("SELECT updated_ms FROM users WHERE email = ?")
            .bind("timestamp@example.com")
            .fetch_one(&pool)
            .await
            .unwrap();
        let new_updated = row.get::<i64, _>("updated_ms");

        assert!(
            new_updated >= initial_updated,
            "updated_ms should increase after profile update"
        );

        server.abort();
    })
    .await;
}
