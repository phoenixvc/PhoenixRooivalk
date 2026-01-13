//! Overlay components for game UI
#![allow(dead_code)] // Props are used via Leptos view! macro, compiler doesn't detect this

use leptos::prelude::*;

#[component]
pub fn SimulationWarning<F>(show: ReadSignal<bool>, on_close: F) -> impl IntoView
where
    F: Fn() + Copy + 'static + Send + Sync,
{
    view! {
        <Show when=move || show.get() fallback=|| view! { <div></div> }>
            <div class="warning-overlay">
                <div class="warning-content">
                    <div class="warning-icon">"⚠️"</div>
                    <div class="warning-text">
                        <div class="warning-title">"SIMULATION MODULE"</div>
                        <div class="warning-description">
                            "This interactive module is designed to visualize counter-drone concepts. "
                            "It does not represent real-world sensor performance, detection ranges, or decision latency."
                        </div>
                    </div>
                    <button class="warning-close" on:click=move |_| on_close()>
                        "✕"
                    </button>
                </div>
            </div>
        </Show>
    }
}

#[component]
pub fn IntegratedSimulationWarning() -> impl IntoView {
    view! {
        <div class="integrated-warning">
            <div class="warning-icon">"⚠️"</div>
            <div class="warning-text">
                <div class="warning-title">"SIMULATION MODULE"</div>
                <div class="warning-description">
                    "This interactive module is designed to visualize counter-drone concepts. "
                    "It does not represent real-world sensor performance, detection ranges, or decision latency."
                </div>
                <div class="warning-accept">
                    "By clicking 'START MISSION', you acknowledge this is a demonstration simulation."
                </div>
            </div>
        </div>
    }
}

#[component]
pub fn AchievementNotification<F>(
    message: ReadSignal<Option<String>>,
    on_dismiss: F,
) -> impl IntoView
where
    F: Fn() + Copy + 'static + Send + Sync,
{
    view! {
        <Show when=move || message.get().is_some() fallback=|| view! { <div></div> }>
            <div class="achievement-notification">
                <div class="achievement-icon">"🏆"</div>
                <div class="achievement-text">
                    <div class="achievement-title">"ACHIEVEMENT UNLOCKED"</div>
                    <div class="achievement-message">
                        {move || message.get().unwrap_or_default()}
                    </div>
                </div>
                <button class="achievement-close" on:click=move |_| on_dismiss()>
                    "✕"
                </button>
            </div>
        </Show>
    }
}

#[component]
pub fn GameOverOverlay<F>(
    show: ReadSignal<bool>,
    final_score: ReadSignal<u32>,
    waves_survived: ReadSignal<u8>,
    threats_neutralized: ReadSignal<u32>,
    on_restart: F,
) -> impl IntoView
where
    F: Fn() + Copy + 'static + Send + Sync,
{
    view! {
        <Show when=move || show.get() fallback=|| view! { <div></div> }>
            <div class="modal-overlay">
                <div class="game-over-modal">
                    <h2 class="game-over-title">"MISSION ENDED"</h2>

                    <div class="final-stats">
                        <div class="final-stat-item">
                            <span class="final-stat-label">"Final Score"</span>
                            <span class="final-stat-value">{move || final_score.get()}</span>
                        </div>
                        <div class="final-stat-item">
                            <span class="final-stat-label">"Waves Survived"</span>
                            <span class="final-stat-value">{move || waves_survived.get()}</span>
                        </div>
                        <div class="final-stat-item">
                            <span class="final-stat-label">"Threats Neutralized"</span>
                            <span class="final-stat-value">
                                {move || threats_neutralized.get()}
                            </span>
                        </div>
                    </div>

                    <button class="control-button primary large" on:click=move |_| on_restart()>
                        "RESTART MISSION"
                    </button>
                </div>
            </div>
        </Show>
    }
}

#[component]
pub fn FullscreenPrompt<F1, F2>(show: ReadSignal<bool>, on_enter: F1, on_skip: F2) -> impl IntoView
where
    F1: Fn() + Copy + 'static + Send + Sync,
    F2: Fn() + Copy + 'static + Send + Sync,
{
    view! {
        <Show when=move || show.get() fallback=|| view! { <div></div> }>
            <div class="modal-overlay">
                <div class="fullscreen-prompt">
                    <div class="prompt-icon">"⛶"</div>
                    <h3>"Enhanced Experience"</h3>
                    <p>"For the best tactical simulation experience, enter fullscreen mode."</p>

                    <div class="prompt-actions">
                        <button class="control-button primary" on:click=move |_| on_enter()>
                            "ENTER FULLSCREEN"
                        </button>
                        <button class="control-button" on:click=move |_| on_skip()>
                            "CONTINUE WINDOWED"
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    }
}
