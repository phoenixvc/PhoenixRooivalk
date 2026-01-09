// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::Child;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use tracing::{debug, error, info, warn};
use tracing_subscriber::fmt;

// Game state that will be managed by Tauri backend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GameSession {
    session_id: String,
    start_time: i64,
    score: u32,
    threats_neutralized: u32,
    level: u8,
}

struct AppState {
    current_session: Mutex<Option<GameSession>>,
    detector_process: Mutex<Option<Child>>,
    detector_config: Mutex<DetectorConfig>,
}

// Detection types matching Python detector output
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoundingBox {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Detection {
    pub class_id: i32,
    pub class_name: String,
    pub confidence: f32,
    pub bbox: Vec<f32>, // [x, y, width, height]
    pub drone_score: f32,
    pub track_id: Option<i32>,
    pub is_drone: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectionEvent {
    pub event: String,
    pub timestamp: String,
    pub frame_number: i32,
    pub source_id: String,
    pub detection: Detection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectorStatus {
    pub running: bool,
    pub stream_url: Option<String>,
    pub frame_number: i32,
    pub detection_count: i32,
    pub inference_time_ms: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectorConfig {
    pub host: String,
    pub port: u16,
    pub python_path: String,
    pub detector_path: String,
    pub source: String, // "mock", "usb", "picamera", "file:<path>"
    pub headless: bool,
    pub stream_enabled: bool,
}

impl Default for DetectorConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8080,
            python_path: "python3".to_string(),
            detector_path: "../detector/src/main.py".to_string(),
            source: "mock".to_string(),
            headless: true,
            stream_enabled: true,
        }
    }
}

// Persist session data to database/evidence chain
fn save_session_to_persistence(session: &GameSession) -> Result<String, String> {
    // TODO: Integrate with phoenix-evidence crate and blockchain anchoring
    // For now, we'll serialize to JSON as a placeholder
    let session_json = serde_json::to_string_pretty(session)
        .map_err(|e| format!("Failed to serialize session: {}", e))?;

    debug!("Persisting session data: {}", session_json);

    // Placeholder for actual database/blockchain persistence
    // In production, this would:
    // 1. Save to local SQLite database
    // 2. Queue for blockchain anchoring (Solana/EtherLink)
    // 3. Generate tamper-evident hash

    let evidence_id = format!("evidence-{}", session.session_id);
    info!(
        session_id = %session.session_id,
        score = session.score,
        threats = session.threats_neutralized,
        level = session.level,
        evidence_id = %evidence_id,
        "Session persisted successfully"
    );

    Ok(evidence_id)
}

// Tauri commands that can be called from the frontend

// Input struct for end_game_session to handle camelCase from frontend
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EndGameSessionInput {
    final_score: u32,
    threats_neutralized: u32,
}

// Input struct for save_evidence to handle camelCase from frontend
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EvidencePayload {
    session_id: String,
    event_type: String,
    event_data: serde_json::Value,
}

#[tauri::command]
fn start_game_session(state: State<'_, AppState>) -> Result<GameSession, String> {
    debug!("Starting new game session");

    let session = GameSession {
        session_id: uuid::Uuid::new_v4().to_string(),
        start_time: chrono::Utc::now().timestamp(),
        score: 0,
        threats_neutralized: 0,
        level: 1,
    };

    let mut current = state.current_session.lock().map_err(|e| {
        error!("Failed to acquire session lock (mutex poisoned): {}", e);
        format!("Failed to acquire session lock (mutex poisoned): {}", e)
    })?;

    info!(
        session_id = %session.session_id,
        start_time = session.start_time,
        "New game session created"
    );

    *current = Some(session.clone());

    Ok(session)
}

#[tauri::command]
fn end_game_session(state: State<'_, AppState>, input: EndGameSessionInput) -> Result<(), String> {
    debug!(
        final_score = input.final_score,
        threats_neutralized = input.threats_neutralized,
        "Ending game session"
    );

    let mut current = match state.current_session.lock() {
        Ok(guard) => guard,
        Err(e) => {
            error!("Failed to acquire session lock (mutex poisoned): {}", e);
            return Err(format!(
                "Failed to acquire session lock (mutex poisoned): {}",
                e
            ));
        }
    };

    if let Some(session) = current.as_mut() {
        // Update session with final stats
        session.score = input.final_score;
        session.threats_neutralized = input.threats_neutralized;

        info!(
            session_id = %session.session_id,
            duration_secs = chrono::Utc::now().timestamp() - session.start_time,
            final_score = input.final_score,
            threats_neutralized = input.threats_neutralized,
            level = session.level,
            "Game session ending, persisting data"
        );

        // Persist session to database/evidence chain
        match save_session_to_persistence(session) {
            Ok(evidence_id) => {
                info!(
                    session_id = %session.session_id,
                    evidence_id = %evidence_id,
                    "Session persisted successfully, clearing current session"
                );
                // Only clear session if persistence succeeded
                *current = None;
                Ok(())
            }
            Err(e) => {
                error!(
                    session_id = %session.session_id,
                    error = %e,
                    "Failed to persist session data"
                );
                Err(format!("Failed to persist session: {}", e))
            }
        }
    } else {
        error!("No active session to end");
        Err("No active session to end".to_string())
    }
}

#[tauri::command]
async fn save_evidence(payload: EvidencePayload) -> Result<String, String> {
    // TODO: Integrate with phoenix-evidence crate
    println!(
        "Saving evidence: session={}, type={}, data={:?}",
        payload.session_id, payload.event_type, payload.event_data
    );
    Ok("evidence-id-placeholder".to_string())
}

#[tauri::command]
fn get_system_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

// =============================================================================
// Detector Management Commands
// =============================================================================

/// Start the Python detector process
#[tauri::command]
fn start_detector(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    config: Option<DetectorConfig>,
) -> Result<DetectorStatus, String> {
    let mut detector = state.detector_process.lock().map_err(|e| {
        error!("Failed to acquire detector lock: {}", e);
        format!("Lock error: {}", e)
    })?;

    // Check if already running
    if let Some(ref mut child) = *detector {
        match child.try_wait() {
            Ok(Some(_)) => {
                // Process has exited, clear it
                *detector = None;
            }
            Ok(None) => {
                // Still running
                let config = state.detector_config.lock().map_err(|e| e.to_string())?;
                return Ok(DetectorStatus {
                    running: true,
                    stream_url: Some(format!("http://{}:{}/stream", config.host, config.port)),
                    frame_number: 0,
                    detection_count: 0,
                    inference_time_ms: 0.0,
                });
            }
            Err(e) => {
                warn!("Error checking detector process: {}", e);
                *detector = None;
            }
        }
    }

    // Update config if provided
    let config = if let Some(cfg) = config {
        let mut stored_config = state.detector_config.lock().map_err(|e| e.to_string())?;
        *stored_config = cfg.clone();
        cfg
    } else {
        state
            .detector_config
            .lock()
            .map_err(|e| e.to_string())?
            .clone()
    };

    info!(
        python_path = %config.python_path,
        detector_path = %config.detector_path,
        source = %config.source,
        port = config.port,
        "Starting detector process"
    );

    // Build command arguments
    let mut args = vec![
        config.detector_path.clone(),
        "--source".to_string(),
        config.source.clone(),
        "--stream-port".to_string(),
        config.port.to_string(),
        "--stream-host".to_string(),
        config.host.clone(),
    ];

    if config.headless {
        args.push("--headless".to_string());
    }

    if config.stream_enabled {
        args.push("--stream".to_string());
    }

    // Add webhook URL pointing back to Tauri
    // Note: The detector will POST detection events to this endpoint
    let webhook_port = config.port + 1; // Use a different port for webhook receiver
    args.push("--webhook".to_string());
    args.push(format!("http://127.0.0.1:{}/detection", webhook_port));

    // Spawn the process
    let child = std::process::Command::new(&config.python_path)
        .args(&args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| {
            error!("Failed to spawn detector process: {}", e);
            format!("Failed to start detector: {}", e)
        })?;

    info!(pid = child.id(), "Detector process started");
    *detector = Some(child);

    // Emit event to frontend
    let _ = app_handle.emit("detector-started", &config);

    Ok(DetectorStatus {
        running: true,
        stream_url: Some(format!("http://{}:{}/stream", config.host, config.port)),
        frame_number: 0,
        detection_count: 0,
        inference_time_ms: 0.0,
    })
}

/// Stop the Python detector process
#[tauri::command]
fn stop_detector(state: State<'_, AppState>, app_handle: AppHandle) -> Result<(), String> {
    let mut detector = state.detector_process.lock().map_err(|e| {
        error!("Failed to acquire detector lock: {}", e);
        format!("Lock error: {}", e)
    })?;

    if let Some(ref mut child) = *detector {
        info!(pid = child.id(), "Stopping detector process");

        // Try graceful shutdown first
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            // Send SIGTERM
            unsafe {
                libc::kill(child.id() as i32, libc::SIGTERM);
            }
        }

        #[cfg(windows)]
        {
            // On Windows, just kill the process
            let _ = child.kill();
        }

        // Wait a bit for graceful shutdown
        std::thread::sleep(std::time::Duration::from_millis(500));

        // Force kill if still running
        match child.try_wait() {
            Ok(Some(_)) => {
                info!("Detector process terminated gracefully");
            }
            Ok(None) => {
                warn!("Detector process did not terminate, killing forcefully");
                let _ = child.kill();
                let _ = child.wait();
            }
            Err(e) => {
                warn!("Error checking detector process: {}", e);
            }
        }

        *detector = None;
        let _ = app_handle.emit("detector-stopped", ());
        Ok(())
    } else {
        debug!("No detector process running");
        Ok(())
    }
}

/// Get the current detector status
#[tauri::command]
fn get_detector_status(state: State<'_, AppState>) -> Result<DetectorStatus, String> {
    let mut detector = state.detector_process.lock().map_err(|e| {
        error!("Failed to acquire detector lock: {}", e);
        format!("Lock error: {}", e)
    })?;

    let running = if let Some(ref mut child) = *detector {
        match child.try_wait() {
            Ok(Some(_)) => {
                *detector = None;
                false
            }
            Ok(None) => true,
            Err(_) => {
                *detector = None;
                false
            }
        }
    } else {
        false
    };

    let config = state.detector_config.lock().map_err(|e| e.to_string())?;

    Ok(DetectorStatus {
        running,
        stream_url: if running {
            Some(format!("http://{}:{}/stream", config.host, config.port))
        } else {
            None
        },
        frame_number: 0,
        detection_count: 0,
        inference_time_ms: 0.0,
    })
}

/// Get the detector configuration
#[tauri::command]
fn get_detector_config(state: State<'_, AppState>) -> Result<DetectorConfig, String> {
    let config = state.detector_config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

/// Update the detector configuration
#[tauri::command]
fn set_detector_config(state: State<'_, AppState>, config: DetectorConfig) -> Result<(), String> {
    let mut stored_config = state.detector_config.lock().map_err(|e| e.to_string())?;
    *stored_config = config;
    Ok(())
}

/// Receive a detection event from the Python detector (webhook endpoint)
/// This is called by the detector's WebhookAlertHandler
#[tauri::command]
fn receive_detection(app_handle: AppHandle, event: DetectionEvent) -> Result<(), String> {
    debug!(
        event = %event.event,
        frame = event.frame_number,
        class = %event.detection.class_name,
        confidence = event.detection.confidence,
        "Received detection event"
    );

    // Emit to frontend
    app_handle
        .emit("detection-event", &event)
        .map_err(|e| format!("Failed to emit detection event: {}", e))?;

    Ok(())
}

/// Manually trigger a test detection event (for development/testing)
#[tauri::command]
fn trigger_test_detection(app_handle: AppHandle) -> Result<(), String> {
    let test_event = DetectionEvent {
        event: "drone_detected".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        frame_number: 1,
        source_id: "test".to_string(),
        detection: Detection {
            class_id: 0,
            class_name: "drone".to_string(),
            confidence: 0.95,
            bbox: vec![100.0, 100.0, 50.0, 50.0],
            drone_score: 0.92,
            track_id: Some(1),
            is_drone: true,
        },
    };

    app_handle
        .emit("detection-event", &test_event)
        .map_err(|e| format!("Failed to emit test detection: {}", e))?;

    info!("Test detection event emitted");
    Ok(())
}

fn main() {
    // Initialize structured logging with tracing
    fmt()
        .with_target(true)
        .with_level(true)
        .with_line_number(true)
        .with_thread_ids(true)
        .init();

    info!("Phoenix Rooivalk Threat Simulator starting");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            current_session: Mutex::new(None),
            detector_process: Mutex::new(None),
            detector_config: Mutex::new(DetectorConfig::default()),
        })
        .invoke_handler(tauri::generate_handler![
            // Game session commands
            start_game_session,
            end_game_session,
            save_evidence,
            get_system_info,
            // Detector management commands
            start_detector,
            stop_detector,
            get_detector_status,
            get_detector_config,
            set_detector_config,
            receive_detection,
            trigger_test_detection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
