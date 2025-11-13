use crate::game::GameStateManager;
use leptos::prelude::*;

#[component]
pub fn EnergyManagement(game_state: GameStateManager) -> impl IntoView {
    view! {
        <div class="energy-management-panel">
            <div class="energy-header">
                <h3>"POWER SYSTEMS"</h3>
            </div>

            // Main Energy
            <div class="energy-system">
                <div class="system-header">
                    <span class="system-name">"PRIMARY REACTOR"</span>
                    <span class="system-value">
                        {move || format!("{:.0}%", game_state.energy.get())}
                    </span>
                </div>
                <div class="energy-bar-large">
                    <div
                        class="energy-fill-large"
                        style:width=move || format!("{}%", game_state.energy.get())
                        style:background=move || {
                            let energy = game_state.energy.get();
                            if energy > 60.0 {
                                "linear-gradient(90deg, #00ff00, #00ffaa)"
                            } else if energy > 30.0 {
                                "linear-gradient(90deg, #ffaa00, #ff6600)"
                            } else {
                                "linear-gradient(90deg, #ff3333, #ff0000)"
                            }
                        }
                    ></div>
                </div>
                <div class="energy-status">
                    {move || {
                        let energy = game_state.energy.get();
                        if energy > 80.0 {
                            "OPTIMAL"
                        } else if energy > 40.0 {
                            "NOMINAL"
                        } else if energy > 15.0 {
                            "LOW POWER"
                        } else {
                            "CRITICAL"
                        }
                    }}

                </div>
            </div>

            // Cooling System
            <div class="energy-system">
                <div class="system-header">
                    <span class="system-name">"THERMAL MANAGEMENT"</span>
                    <span class="system-value">
                        {move || format!("{:.0}%", game_state.cooling.get())}
                    </span>
                </div>
                <div class="energy-bar-large">
                    <div
                        class="energy-fill-large cooling"
                        style:width=move || format!("{}%", game_state.cooling.get())
                    ></div>
                </div>
                <div class="energy-status">
                    {move || {
                        let cooling = game_state.cooling.get();
                        if cooling > 70.0 {
                            "NOMINAL"
                        } else if cooling > 35.0 {
                            "ELEVATED"
                        } else {
                            "OVERHEAT WARNING"
                        }
                    }}

                </div>
            </div>

            // Power Budget Breakdown
            <div class="power-budget">
                <div class="budget-title">"POWER ALLOCATION"</div>

                <div class="budget-item">
                    <span class="budget-system">"Weapons"</span>
                    <div class="budget-bar">
                        <div class="budget-fill" style:width="40%"></div>
                    </div>
                    <span class="budget-percentage">"40%"</span>
                </div>

                <div class="budget-item">
                    <span class="budget-system">"Shields"</span>
                    <div class="budget-bar">
                        <div class="budget-fill" style:width="25%"></div>
                    </div>
                    <span class="budget-percentage">"25%"</span>
                </div>

                <div class="budget-item">
                    <span class="budget-system">"Sensors"</span>
                    <div class="budget-bar">
                        <div class="budget-fill" style:width="20%"></div>
                    </div>
                    <span class="budget-percentage">"20%"</span>
                </div>

                <div class="budget-item">
                    <span class="budget-system">"Reserves"</span>
                    <div class="budget-bar">
                        <div class="budget-fill" style:width="15%"></div>
                    </div>
                    <span class="budget-percentage">"15%"</span>
                </div>
            </div>

            // Regeneration Rate
            <div class="regen-info">
                <span class="regen-label">"Regen Rate:"</span>
                <span class="regen-value">"10.0 units/sec"</span>
            </div>
        </div>
    }
}
