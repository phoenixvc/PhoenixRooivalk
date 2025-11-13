use crate::game::GameStateManager;
use leptos::prelude::*;

// Small epsilon for floating-point comparisons (cooldown readiness check)
const COOLDOWN_EPSILON: f32 = 1e-6;

#[component]
pub fn StatsPanel(game_state: GameStateManager, show: ReadSignal<bool>) -> impl IntoView {
    view! {
        <Show when=move || show.get() fallback=|| view! { <div></div> }>
            <div class="stats-detail-panel">
                <div class="panel-header">
                    <h2>"Detailed Statistics"</h2>
                </div>

                <div class="stats-grid">
                    // Combat Stats
                    <div class="stat-section">
                        <h3>"Combat Performance"</h3>
                        <div class="stat-row">
                            <span class="stat-label">"Total Score:"</span>
                            <span class="stat-value">{move || game_state.score.get()}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">"Threats Neutralized:"</span>
                            <span class="stat-value">{move || game_state.neutralized.get()}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">"Current Wave:"</span>
                            <span class="stat-value">{move || game_state.level.get()}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">"Active Threats:"</span>
                            <span class="stat-value">
                                {move || game_state.threats.get().len()}
                            </span>
                        </div>
                    </div>

                    // Resource Stats
                    <div class="stat-section">
                        <h3>"Resources"</h3>
                        <div class="stat-row">
                            <span class="stat-label">"Energy:"</span>
                            <span class="stat-value">
                                {move || format!("{:.0}%", game_state.energy.get())}
                            </span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">"Cooling:"</span>
                            <span class="stat-value">
                                {move || format!("{:.0}%", game_state.cooling.get())}
                            </span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">"Mothership Health:"</span>
                            <span class="stat-value">
                                {move || format!("{:.0}%", game_state.mothership_health.get())}
                            </span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">"Active Drones:"</span>
                            <span class="stat-value">
                                {move || game_state.drones.get().len()}
                            </span>
                        </div>
                    </div>

                    // Performance Stats
                    <div class="stat-section">
                        <h3>"Performance"</h3>
                        <div class="stat-row">
                            <span class="stat-label">"Frame Rate:"</span>
                            <span class="stat-value">
                                {move || format!("{:.0} FPS", game_state.frame_rate.get())}
                            </span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">"Game Time:"</span>
                            <span class="stat-value">
                                {move || format!("{:.1}s", game_state.game_time.get())}
                            </span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">"Active Power-ups:"</span>
                            <span class="stat-value">
                                {move || game_state.power_ups.get().len()}
                            </span>
                        </div>
                    </div>

                    // Weapon Stats
                    <div class="stat-section">
                        <h3>"Weapon Status"</h3>
                        <div class="weapon-cooldowns">
                            {move || {
                                game_state
                                    .weapons
                                    .get()
                                    .into_iter()
                                    .map(|weapon| {
                                        let cooldown_pct = if weapon.max_cooldown > 0.0 {
                                            (weapon.cooldown / weapon.max_cooldown * 100.0).min(100.0)
                                        } else {
                                            0.0
                                        };
                                        // Use epsilon comparison to handle floating-point precision
                                        let is_ready = weapon.cooldown <= COOLDOWN_EPSILON;
                                        view! {
                                            <div class="weapon-status-item">
                                                <span class="weapon-type">
                                                    {format!("{:?}", weapon.weapon_type)}
                                                </span>
                                                <div class="cooldown-bar">
                                                    <div
                                                        class="cooldown-fill"
                                                        style:width=format!("{}%", cooldown_pct)
                                                        style:background-color=if is_ready {
                                                            "#00ff00"
                                                        } else {
                                                            "#ff6600"
                                                        }
                                                    ></div>
                                                </div>
                                            </div>
                                        }
                                    })
                                    .collect_view()
                            }}

                        </div>
                    </div>
                </div>
            </div>
        </Show>
    }
}
