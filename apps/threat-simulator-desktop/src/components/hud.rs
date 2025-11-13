use crate::game::GameStateManager;
use leptos::prelude::*;

#[component]
pub fn Hud(game_state: GameStateManager, is_running: ReadSignal<bool>) -> impl IntoView {
    view! {
        <div class="hud-container">
            // Left side - Main stats
            <div class="stats-panel">
                <div class="panel-title">"PHOENIX ROOIVALK"</div>

                <div class="stat-item">
                    <span class="stat-label">"Score:"</span>
                    <span class="stat-value score">
                        {move || format!("{:06}", game_state.score.get())}
                    </span>
                </div>

                <div class="stat-item">
                    <span class="stat-label">"Wave:"</span>
                    <span class="stat-value wave">
                        {move || format!("{:02}", game_state.level.get())}
                    </span>
                </div>

                <div class="stat-item">
                    <span class="stat-label">"Neutralized:"</span>
                    <span class="stat-value">{move || game_state.neutralized.get()}</span>
                </div>

                <div class="stat-item">
                    <span class="stat-label">"Active Threats:"</span>
                    <span class="stat-value threat-count">
                        {move || game_state.threats.get().len()}
                    </span>
                </div>

                <div class="stat-item">
                    <span class="stat-label">"Auto-Target:"</span>
                    <span
                        class=move || {
                            if game_state.auto_targeting_enabled.get() {
                                "stat-value auto-on"
                            } else {
                                "stat-value auto-off"
                            }
                        }
                    >

                        {move || {
                            if game_state.auto_targeting_enabled.get() { "ON" } else { "OFF" }
                        }}

                    </span>
                </div>

                <div class="stat-divider"></div>

                // Resource bars
                <div class="resource-section">
                    <div class="resource-item">
                        <div class="resource-header">
                            <span class="resource-label">"ENERGY"</span>
                            <span class="resource-value">
                                {move || format!("{:.0}%", game_state.energy.get())}
                            </span>
                        </div>
                        <div class="resource-bar">
                            <div
                                class="resource-fill energy"
                                style:width=move || format!("{}%", game_state.energy.get())
                            ></div>
                        </div>
                    </div>

                    <div class="resource-item">
                        <div class="resource-header">
                            <span class="resource-label">"COOLING"</span>
                            <span class="resource-value">
                                {move || format!("{:.0}%", game_state.cooling.get())}
                            </span>
                        </div>
                        <div class="resource-bar">
                            <div
                                class="resource-fill cooling"
                                style:width=move || format!("{}%", game_state.cooling.get())
                            ></div>
                        </div>
                    </div>

                    <div class="resource-item">
                        <div class="resource-header">
                            <span class="resource-label">"MOTHERSHIP"</span>
                            <span class="resource-value">
                                {move || format!("{:.0}%", game_state.mothership_health.get())}
                            </span>
                        </div>
                        <div class="resource-bar">
                            <div
                                class="resource-fill health"
                                style:width=move || {
                                    format!("{}%", game_state.mothership_health.get())
                                }
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            // Right side - Status indicators
            <div class="status-panel">
                <div class="fps-counter">
                    <div class="fps-label">"FPS"</div>
                    <div class="fps-value">{move || format!("{:.0}", game_state.frame_rate.get())}</div>
                </div>

                <div class="game-status">
                    <div class=move || {
                        if is_running.get() { "status-indicator running" } else { "status-indicator paused" }
                    }>
                        {move || if is_running.get() { "ACTIVE" } else { "PAUSED" }}
                    </div>
                </div>

                <div class="weapon-indicator">
                    <div class="current-weapon-label">"CURRENT WEAPON"</div>
                    <div class="current-weapon-name">
                        {move || format!("{:?}", game_state.selected_weapon.get())}
                    </div>
                </div>
            </div>
        </div>
    }
}
