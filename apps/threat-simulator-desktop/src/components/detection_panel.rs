//! Detection Panel Component
//!
//! Displays real-time detection events from the Python detector
//! and provides controls for managing the detector process.

use leptos::prelude::*;

/// Detection data from the Python detector
#[derive(Debug, Clone, PartialEq)]
pub struct DetectionData {
    pub class_name: String,
    pub confidence: f32,
    pub drone_score: f32,
    pub track_id: Option<i32>,
    pub timestamp: String,
    pub frame_number: i32,
}

/// Detector connection status
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub enum DetectorConnectionStatus {
    #[default]
    Disconnected,
    Connecting,
    Connected,
    Error,
}

/// Detection Panel component for displaying detection events
#[component]
pub fn DetectionPanel(
    /// Signal containing recent detection events
    detections: ReadSignal<Vec<DetectionData>>,
    /// Signal for detector connection status
    connection_status: ReadSignal<DetectorConnectionStatus>,
    /// Signal for detector running state
    is_detector_running: ReadSignal<bool>,
    /// Callback to start detector
    on_start: Callback<()>,
    /// Callback to stop detector
    on_stop: Callback<()>,
    /// Callback to trigger test detection
    #[prop(optional)]
    on_test: Option<Callback<()>>,
) -> impl IntoView {
    view! {
        <div class="detection-panel">
            <div class="panel-header">
                <span class="panel-title">"DETECTION FEED"</span>
                <div class="connection-status">
                    <span
                        class=move || {
                            match connection_status.get() {
                                DetectorConnectionStatus::Connected => "status-dot connected",
                                DetectorConnectionStatus::Connecting => "status-dot connecting",
                                DetectorConnectionStatus::Error => "status-dot error",
                                DetectorConnectionStatus::Disconnected => "status-dot disconnected",
                            }
                        }
                    ></span>
                    <span class="status-text">
                        {move || {
                            match connection_status.get() {
                                DetectorConnectionStatus::Connected => "Connected",
                                DetectorConnectionStatus::Connecting => "Connecting...",
                                DetectorConnectionStatus::Error => "Error",
                                DetectorConnectionStatus::Disconnected => "Disconnected",
                            }
                        }}
                    </span>
                </div>
            </div>

            <div class="detector-controls">
                <button
                    class=move || {
                        if is_detector_running.get() {
                            "control-btn stop"
                        } else {
                            "control-btn start"
                        }
                    }
                    on:click=move |_| {
                        if is_detector_running.get() {
                            on_stop.run(());
                        } else {
                            on_start.run(());
                        }
                    }
                >
                    {move || if is_detector_running.get() { "Stop Detector" } else { "Start Detector" }}
                </button>

                {move || {
                    if let Some(on_test_cb) = on_test {
                        view! {
                            <button class="control-btn test" on:click=move |_| on_test_cb.run(())>
                                "Test Detection"
                            </button>
                        }
                        .into_any()
                    } else {
                        view! { <span></span> }.into_any()
                    }
                }}
            </div>

            <div class="detection-list">
                <For
                    each=move || detections.get().into_iter().enumerate()
                    key=|(idx, d)| (*idx, d.frame_number, d.track_id)
                    children=move |(_, detection)| {
                        let confidence_pct = (detection.confidence * 100.0) as u32;
                        let drone_score_pct = (detection.drone_score * 100.0) as u32;
                        let is_high_confidence = detection.confidence > 0.8;
                        let is_drone = detection.drone_score > 0.5;

                        view! {
                            <div class=move || {
                                if is_drone && is_high_confidence {
                                    "detection-item high-priority"
                                } else if is_drone {
                                    "detection-item drone"
                                } else {
                                    "detection-item"
                                }
                            }>
                                <div class="detection-header">
                                    <span class="detection-class">{detection.class_name.clone()}</span>
                                    {detection.track_id.map(|id| {
                                        view! { <span class="track-id">{format!("#{}", id)}</span> }
                                    })}
                                </div>
                                <div class="detection-metrics">
                                    <div class="metric">
                                        <span class="metric-label">"Conf:"</span>
                                        <div class="metric-bar">
                                            <div
                                                class="metric-fill confidence"
                                                style:width=format!("{}%", confidence_pct)
                                            ></div>
                                        </div>
                                        <span class="metric-value">{format!("{}%", confidence_pct)}</span>
                                    </div>
                                    <div class="metric">
                                        <span class="metric-label">"Drone:"</span>
                                        <div class="metric-bar">
                                            <div
                                                class=move || {
                                                    if is_drone { "metric-fill drone-high" } else { "metric-fill drone-low" }
                                                }
                                                style:width=format!("{}%", drone_score_pct)
                                            ></div>
                                        </div>
                                        <span class="metric-value">{format!("{}%", drone_score_pct)}</span>
                                    </div>
                                </div>
                                <div class="detection-footer">
                                    <span class="frame-number">{format!("Frame #{}", detection.frame_number)}</span>
                                    <span class="timestamp">{detection.timestamp.clone()}</span>
                                </div>
                            </div>
                        }
                    }
                />

                <Show
                    when=move || detections.get().is_empty()
                    fallback=|| view! { <span></span> }
                >
                    <div class="no-detections">
                        <span class="no-detections-icon">"radar"</span>
                        <span class="no-detections-text">"No detections yet"</span>
                        <span class="no-detections-hint">
                            {move || {
                                if is_detector_running.get() {
                                    "Monitoring for drones..."
                                } else {
                                    "Start the detector to begin"
                                }
                            }}
                        </span>
                    </div>
                </Show>
            </div>

            <div class="detection-stats">
                <div class="stat">
                    <span class="stat-value">{move || detections.get().len()}</span>
                    <span class="stat-label">"Total"</span>
                </div>
                <div class="stat">
                    <span class="stat-value">
                        {move || detections.get().iter().filter(|d| d.drone_score > 0.5).count()}
                    </span>
                    <span class="stat-label">"Drones"</span>
                </div>
                <div class="stat">
                    <span class="stat-value">
                        {move || detections.get().iter().filter(|d| d.confidence > 0.8).count()}
                    </span>
                    <span class="stat-label">"High Conf"</span>
                </div>
            </div>
        </div>
    }
}

/// Compact detection indicator for the HUD
#[component]
pub fn DetectionIndicator(
    /// Number of active detections
    detection_count: ReadSignal<usize>,
    /// Whether detector is running
    is_running: ReadSignal<bool>,
    /// Callback when clicked
    on_click: Callback<()>,
) -> impl IntoView {
    view! {
        <div
            class=move || {
                if !is_running.get() {
                    "detection-indicator offline"
                } else if detection_count.get() > 0 {
                    "detection-indicator active"
                } else {
                    "detection-indicator idle"
                }
            }
            on:click=move |_| on_click.run(())
        >
            <span class="indicator-icon">
                {move || if is_running.get() { "DETECT" } else { "OFF" }}
            </span>
            <span class="indicator-count">
                {move || {
                    if is_running.get() {
                        format!("{}", detection_count.get())
                    } else {
                        "-".to_string()
                    }
                }}
            </span>
        </div>
    }
}
