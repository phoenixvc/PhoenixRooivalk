use anchor_etherlink::{EtherlinkProvider, EtherlinkProviderStub};
use axum::{routing::get, Router};
use phoenix_evidence::anchor::AnchorProvider;
use phoenix_keeper::{ensure_schema, run_confirmation_loop, run_job_loop, SqliteJobProvider};
use sqlx::sqlite::SqlitePoolOptions;
use std::time::Duration;
use tokio::signal;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

/// Creates the appropriate Etherlink provider based on environment configuration
fn create_etherlink_provider() -> Box<dyn AnchorProvider + Send + Sync> {
    let use_stub = match std::env::var("KEEPER_USE_STUB") {
        Ok(value) => {
            match value.trim().to_lowercase().as_str() {
                "true" | "1" | "yes" | "on" => true,
                "false" | "0" | "no" | "off" => false,
                unrecognized_value => {
                    // Emit warning for unrecognized values
                    tracing::warn!("Invalid KEEPER_USE_STUB value '{}'. Expected true/false/1/0/yes/no/on/off. Using real provider for safety.", unrecognized_value);
                    false // Default to false (real provider) for unrecognized values
                }
            }
        }
        Err(_) => false, // Default to false (real provider) if env var is missing or unparsable
    };

    if use_stub {
        tracing::info!("Using EtherlinkProviderStub for development/testing");
        Box::new(EtherlinkProviderStub)
    } else {
        tracing::info!("Using real EtherlinkProvider for production");

        let endpoint = std::env::var("ETHERLINK_ENDPOINT")
            .unwrap_or_else(|_| "https://node.etherlink.com".to_string());
        let network = std::env::var("ETHERLINK_NETWORK").unwrap_or_else(|_| "mainnet".to_string());
        let private_key = std::env::var("ETHERLINK_PRIVATE_KEY").ok();

        match EtherlinkProvider::new(endpoint.clone(), network.clone(), private_key) {
            Ok(provider) => {
                tracing::info!(
                    endpoint = %endpoint,
                    network = %network,
                    "Successfully created EtherlinkProvider"
                );
                Box::new(provider)
            }
            Err(error) => {
                tracing::error!(
                    endpoint = %endpoint,
                    network = %network,
                    error = %error,
                    "Failed to create EtherlinkProvider"
                );
                std::process::exit(1);
            }
        }
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // HTTP health endpoint
    let app = Router::new().route("/health", get(|| async { "OK" }));
    let http = tokio::spawn(async move {
        let addr = "0.0.0.0:8081";
        tracing::info!(%addr, "keeper http starting");

        let listener = match tokio::net::TcpListener::bind(addr).await {
            Ok(listener) => listener,
            Err(bind_error) => {
                tracing::error!(address=%addr, error=%bind_error, "Failed to bind HTTP server");
                std::process::exit(1);
            }
        };

        if let Err(serve_error) = axum::serve(listener, app.into_make_service()).await {
            tracing::error!(error=%serve_error, "HTTP server runtime error");
            std::process::exit(1);
        }
    });

    // Job runner
    let runner = tokio::spawn(async move {
        let poll_interval = std::env::var("KEEPER_POLL_MS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .map(Duration::from_millis)
            .unwrap_or_else(|| Duration::from_secs(5));

        let db_url = std::env::var("KEEPER_DB_URL")
            .unwrap_or_else(|_| "sqlite://blockchain_outbox.sqlite3".to_string());
        match SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
            .await
        {
            Ok(pool) => {
                if let Err(schema_error) = ensure_schema(&pool).await {
                    tracing::error!(error=%schema_error, "schema init failed");
                    tracing::error!("Exiting due to schema initialization failure");
                    std::process::exit(1);
                }

                let mut job_provider = SqliteJobProvider::new(pool.clone());
                let anchor = create_etherlink_provider();

                // Start job processing loop
                let job_anchor = anchor;
                let job_handle = tokio::spawn(async move {
                    run_job_loop(&mut job_provider, job_anchor.as_ref(), poll_interval).await;
                });

                // Start confirmation polling loop
                let confirm_interval = Duration::from_secs(30); // Check confirmations every 30s
                let confirm_anchor = create_etherlink_provider();
                let confirm_handle = tokio::spawn(async move {
                    run_confirmation_loop(&pool, confirm_anchor.as_ref(), confirm_interval).await;
                });

                // Wait for either loop to complete (they shouldn't)
                tokio::select! {
                    _ = job_handle => {
                        tracing::warn!("Job loop exited unexpectedly");
                    }
                    _ = confirm_handle => {
                        tracing::warn!("Confirmation loop exited unexpectedly");
                    }
                }
            }
            Err(_) => {
                tracing::error!("db connect failed; keeper idle");
                tokio::time::sleep(Duration::from_secs(10)).await;
            }
        }
    });

    // Wait for Ctrl+C
    tokio::select! {
        _ = signal::ctrl_c() => {
            tracing::info!("shutdown signal received");
        }
        _ = http => {}
        _ = runner => {}
    }
}
