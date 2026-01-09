use serde::{Deserialize, Serialize};
use serde_json::Value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    async fn invoke(cmd: &str, args: JsValue) -> JsValue;
}

#[derive(Serialize, Deserialize)]
#[allow(dead_code)]
pub struct GameSession {
    pub session_id: String,
    pub start_time: i64,
    pub score: u32,
    pub threats_neutralized: u32,
    pub level: u8,
}

// =============================================================================
// Detection Types
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct Detection {
    pub class_id: i32,
    pub class_name: String,
    pub confidence: f32,
    pub bbox: Vec<f32>,
    pub drone_score: f32,
    pub track_id: Option<i32>,
    pub is_drone: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct DetectionEvent {
    pub event: String,
    pub timestamp: String,
    pub frame_number: i32,
    pub source_id: String,
    pub detection: Detection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct DetectorStatus {
    pub running: bool,
    pub stream_url: Option<String>,
    pub frame_number: i32,
    pub detection_count: i32,
    pub inference_time_ms: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct DetectorConfig {
    pub host: String,
    pub port: u16,
    pub python_path: String,
    pub detector_path: String,
    pub source: String,
    pub headless: bool,
    pub stream_enabled: bool,
}

/// API functions for Tauri desktop integration
/// These are currently unused in the web version but will be used when running as a desktop app
#[allow(dead_code)]
pub async fn start_game_session() -> Result<GameSession, String> {
    let result = invoke("start_game_session", JsValue::NULL).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

#[allow(dead_code)]
pub async fn end_game_session(final_score: u32, threats_neutralized: u32) -> Result<(), String> {
    let args = serde_wasm_bindgen::to_value(&serde_json::json!({
        "finalScore": final_score,
        "threatsNeutralized": threats_neutralized,
    }))
    .map_err(|e| e.to_string())?;

    let result = invoke("end_game_session", args).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

#[allow(dead_code)]
pub async fn save_evidence(
    session_id: String,
    event_type: String,
    event_data: Value,
) -> Result<String, String> {
    let args = serde_wasm_bindgen::to_value(&serde_json::json!({
        "sessionId": session_id,
        "eventType": event_type,
        "eventData": event_data,
    }))
    .map_err(|e| e.to_string())?;

    let result = invoke("save_evidence", args).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

#[allow(dead_code)]
pub async fn get_system_info() -> Result<Value, String> {
    let result = invoke("get_system_info", JsValue::NULL).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

// =============================================================================
// Detector Management API
// =============================================================================

/// Start the detector process with optional configuration
#[allow(dead_code)]
pub async fn start_detector(config: Option<DetectorConfig>) -> Result<DetectorStatus, String> {
    let args = if let Some(cfg) = config {
        serde_wasm_bindgen::to_value(&serde_json::json!({ "config": cfg }))
            .map_err(|e| e.to_string())?
    } else {
        JsValue::NULL
    };

    let result = invoke("start_detector", args).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

/// Stop the detector process
#[allow(dead_code)]
pub async fn stop_detector() -> Result<(), String> {
    let result = invoke("stop_detector", JsValue::NULL).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

/// Get the current detector status
#[allow(dead_code)]
pub async fn get_detector_status() -> Result<DetectorStatus, String> {
    let result = invoke("get_detector_status", JsValue::NULL).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

/// Get the current detector configuration
#[allow(dead_code)]
pub async fn get_detector_config() -> Result<DetectorConfig, String> {
    let result = invoke("get_detector_config", JsValue::NULL).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

/// Update the detector configuration
#[allow(dead_code)]
pub async fn set_detector_config(config: DetectorConfig) -> Result<(), String> {
    let args = serde_wasm_bindgen::to_value(&serde_json::json!({ "config": config }))
        .map_err(|e| e.to_string())?;

    let result = invoke("set_detector_config", args).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

/// Trigger a test detection event (for development)
#[allow(dead_code)]
pub async fn trigger_test_detection() -> Result<(), String> {
    let result = invoke("trigger_test_detection", JsValue::NULL).await;
    serde_wasm_bindgen::from_value(result).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_game_session_structure() {
        let session = GameSession {
            session_id: "test-123".to_string(),
            start_time: 1234567890,
            score: 1000,
            threats_neutralized: 50,
            level: 5,
        };

        assert_eq!(session.session_id, "test-123");
        assert_eq!(session.score, 1000);
        assert_eq!(session.threats_neutralized, 50);
        assert_eq!(session.level, 5);
    }

    #[test]
    fn test_detection_event_structure() {
        let detection = Detection {
            class_id: 0,
            class_name: "drone".to_string(),
            confidence: 0.95,
            bbox: vec![100.0, 100.0, 50.0, 50.0],
            drone_score: 0.92,
            track_id: Some(1),
            is_drone: true,
        };

        assert_eq!(detection.class_name, "drone");
        assert!(detection.is_drone);
        assert_eq!(detection.track_id, Some(1));
    }

    #[test]
    fn test_detector_config_structure() {
        let config = DetectorConfig {
            host: "127.0.0.1".to_string(),
            port: 8080,
            python_path: "python3".to_string(),
            detector_path: "../detector/src/main.py".to_string(),
            source: "mock".to_string(),
            headless: true,
            stream_enabled: true,
        };

        assert_eq!(config.port, 8080);
        assert!(config.headless);
    }
}
