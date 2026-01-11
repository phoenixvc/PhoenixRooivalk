//! Video Stream Component
//!
//! Displays the MJPEG video stream from the Python detector.
//! Supports both live streaming and snapshot modes.

use leptos::prelude::*;

/// Stream display mode
#[derive(Debug, Clone, Copy, PartialEq, Default)]
#[allow(dead_code)] // All variants used in match expressions via view! macro
pub enum StreamMode {
    /// Live MJPEG stream
    #[default]
    Live,
    /// Single snapshot (refreshes periodically)
    Snapshot,
    /// Picture-in-picture overlay
    PictureInPicture,
}

/// Video stream status
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub enum StreamStatus {
    #[default]
    Disconnected,
    Loading,
    Connected,
    Error,
}

/// Video Stream component for displaying the detector feed
#[component]
pub fn VideoStream(
    /// URL for the MJPEG stream (e.g., "http://localhost:8080/stream")
    stream_url: ReadSignal<Option<String>>,
    /// Whether the stream should be active
    is_active: ReadSignal<bool>,
    /// Display mode
    #[prop(default = StreamMode::Live)]
    mode: StreamMode,
    /// Callback when stream status changes
    #[prop(optional)]
    on_status_change: Option<Callback<StreamStatus>>,
    /// Whether to show controls
    #[prop(default = true)]
    show_controls: bool,
) -> impl IntoView {
    let (stream_status, set_stream_status) = signal(StreamStatus::Disconnected);
    let (is_fullscreen, set_is_fullscreen) = signal(false);
    let (snapshot_counter, set_snapshot_counter) = signal(0u32);

    // Notify parent of status changes
    Effect::new(move |_| {
        if let Some(callback) = on_status_change {
            callback.run(stream_status.get());
        }
    });

    // Update status based on active state
    Effect::new(move |_| {
        if is_active.get() && stream_url.get().is_some() {
            set_stream_status.set(StreamStatus::Loading);
        } else {
            set_stream_status.set(StreamStatus::Disconnected);
        }
    });

    // For snapshot mode, we'll rely on manual refresh via the button
    // The counter is incremented by the refresh button click

    let container_class = move || {
        let mut classes = vec!["video-stream-container"];
        if is_fullscreen.get() {
            classes.push("fullscreen");
        }
        match mode {
            StreamMode::Live => classes.push("mode-live"),
            StreamMode::Snapshot => classes.push("mode-snapshot"),
            StreamMode::PictureInPicture => classes.push("mode-pip"),
        }
        classes.join(" ")
    };

    view! {
        <div class=container_class>
            <div class="stream-header">
                <span class="stream-title">
                    {match mode {
                        StreamMode::Live => "LIVE FEED",
                        StreamMode::Snapshot => "SNAPSHOT",
                        StreamMode::PictureInPicture => "PIP",
                    }}
                </span>
                <div class="stream-status-indicator">
                    <span
                        class=move || {
                            match stream_status.get() {
                                StreamStatus::Connected => "status-dot connected",
                                StreamStatus::Loading => "status-dot loading",
                                StreamStatus::Error => "status-dot error",
                                StreamStatus::Disconnected => "status-dot disconnected",
                            }
                        }
                    ></span>
                </div>
            </div>

            <div class="stream-viewport">
                <Show
                    when=move || is_active.get() && stream_url.get().is_some()
                    fallback=move || {
                        view! {
                            <div class="stream-placeholder">
                                <div class="placeholder-icon">"cam_off"</div>
                                <div class="placeholder-text">
                                    {move || {
                                        if stream_url.get().is_none() {
                                            "No stream URL configured"
                                        } else {
                                            "Stream inactive"
                                        }
                                    }}
                                </div>
                            </div>
                        }
                    }
                >
                    {move || {
                        let url = stream_url.get().unwrap_or_default();

                        match mode {
                            StreamMode::Live => {
                                // For MJPEG, we use an img tag that continuously updates
                                view! {
                                    <img
                                        class="stream-image"
                                        src=url.clone()
                                        alt="Live detector stream"
                                        on:load=move |_| set_stream_status.set(StreamStatus::Connected)
                                        on:error=move |_| set_stream_status.set(StreamStatus::Error)
                                    />
                                }
                                .into_any()
                            }
                            StreamMode::Snapshot => {
                                // For snapshots, append a cache-busting query param
                                let snapshot_url = format!(
                                    "{}?t={}",
                                    url.replace("/stream", "/snapshot"),
                                    snapshot_counter.get()
                                );
                                view! {
                                    <img
                                        class="stream-image snapshot"
                                        src=snapshot_url
                                        alt="Detector snapshot"
                                        on:load=move |_| set_stream_status.set(StreamStatus::Connected)
                                        on:error=move |_| set_stream_status.set(StreamStatus::Error)
                                    />
                                }
                                .into_any()
                            }
                            StreamMode::PictureInPicture => {
                                view! {
                                    <img
                                        class="stream-image pip"
                                        src=url
                                        alt="PIP detector stream"
                                        on:load=move |_| set_stream_status.set(StreamStatus::Connected)
                                        on:error=move |_| set_stream_status.set(StreamStatus::Error)
                                    />
                                }
                                .into_any()
                            }
                        }
                    }}
                </Show>

                // Overlay for status/error messages
                <Show when=move || stream_status.get() == StreamStatus::Loading>
                    <div class="stream-overlay loading">
                        <div class="loading-spinner"></div>
                        <span>"Connecting to stream..."</span>
                    </div>
                </Show>

                <Show when=move || stream_status.get() == StreamStatus::Error>
                    <div class="stream-overlay error">
                        <span class="error-icon">"error"</span>
                        <span>"Stream connection failed"</span>
                        <button
                            class="retry-btn"
                            on:click=move |_| {
                                set_stream_status.set(StreamStatus::Loading);
                                // Force reload by incrementing counter
                                set_snapshot_counter.update(|c| *c += 1);
                            }
                        >
                            "Retry"
                        </button>
                    </div>
                </Show>
            </div>

            <Show when=move || show_controls>
                <div class="stream-controls">
                    <button
                        class="stream-control-btn"
                        on:click=move |_| set_is_fullscreen.update(|f| *f = !*f)
                        title=move || if is_fullscreen.get() { "Exit fullscreen" } else { "Fullscreen" }
                    >
                        {move || if is_fullscreen.get() { "fullscreen_exit" } else { "fullscreen" }}
                    </button>

                    <Show when=move || mode == StreamMode::Snapshot>
                        <button
                            class="stream-control-btn"
                            on:click=move |_| set_snapshot_counter.update(|c| *c += 1)
                            title="Refresh snapshot"
                        >
                            "refresh"
                        </button>
                    </Show>
                </div>
            </Show>
        </div>
    }
}

/// Compact video preview for sidebar/overlay use
#[allow(dead_code)] // Props used via Leptos view! macro
#[component]
pub fn VideoPreview(
    /// URL for the stream
    stream_url: ReadSignal<Option<String>>,
    /// Whether active
    is_active: ReadSignal<bool>,
    /// Click callback to expand
    on_click: Callback<()>,
) -> impl IntoView {
    view! {
        <div class="video-preview" on:click=move |_| on_click.run(())>
            <Show
                when=move || is_active.get() && stream_url.get().is_some()
                fallback=|| {
                    view! {
                        <div class="preview-placeholder">
                            <span>"No Feed"</span>
                        </div>
                    }
                }
            >
                {move || {
                    let url = stream_url.get().unwrap_or_default();
                    view! {
                        <img class="preview-image" src=url alt="Stream preview" />
                    }
                }}
            </Show>
            <div class="preview-overlay">
                <span class="expand-icon">"expand"</span>
            </div>
        </div>
    }
}
