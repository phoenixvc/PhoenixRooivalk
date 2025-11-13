use crate::game::{DroneType, GameStateManager};
use js_sys::Date;
use leptos::prelude::*;

#[component]
pub fn TokenStore<F>(
    game_state: GameStateManager,
    show: ReadSignal<bool>,
    on_close: F,
) -> impl IntoView
where
    F: Fn() + Copy + 'static,
{
    let (tokens, set_tokens) = create_signal(1000_u32);

    let drone_catalog = std::rc::Rc::new(vec![
        (
            DroneType::Interceptor,
            "Interceptor",
            "Fast attack drone",
            "Rapid response to incoming threats",
            100,
        ),
        (
            DroneType::Jammer,
            "Jammer",
            "Electronic warfare platform",
            "Disrupts enemy communications",
            150,
        ),
        (
            DroneType::Surveillance,
            "Surveillance",
            "Reconnaissance drone",
            "Enhanced threat detection",
            80,
        ),
        (
            DroneType::Effector,
            "Effector",
            "Heavy payload carrier",
            "Maximum firepower delivery",
            200,
        ),
        (
            DroneType::Shield,
            "Shield",
            "Defensive barrier drone",
            "Protects critical assets",
            150,
        ),
        (
            DroneType::SpotterUav,
            "Spotter",
            "Target designation",
            "Improves targeting accuracy",
            120,
        ),
        (
            DroneType::NetCaptureUav,
            "Net Capture",
            "Non-lethal capture system",
            "Capture for intelligence",
            180,
        ),
        (
            DroneType::PerimeterSentry,
            "Perimeter Sentry",
            "Autonomous patrol",
            "24/7 perimeter security",
            140,
        ),
        (
            DroneType::SwarmCoordinator,
            "Swarm Coordinator",
            "Multi-drone control",
            "Coordinate formations",
            250,
        ),
    ]);

    let purchase_drone = move |drone_type: DroneType, cost: u32| {
        if tokens.get() >= cost {
            set_tokens.update(|t| *t -= cost);

            // Add drone to game
            let drone = crate::game::Drone {
                id: format!(
                    "purchased-{:?}-{}",
                    drone_type,
                    Date::new_0().get_time() as i64
                ),
                drone_type,
                position: crate::game::Vector2::new(960.0, 540.0),
                velocity: crate::game::Vector2::zero(),
                health: 100.0,
                max_health: 100.0,
                battery: 100.0,
                max_battery: 100.0,
                target_id: None,
            };

            game_state.drones.update(|drones| drones.push(drone));
        }
    };

    view! {
        <Show when=move || show.get() fallback=|| view! { <div></div> }>
            <div class="modal-overlay" on:click=move |_| on_close()>
                <div class="token-store-modal" on:click=|e| e.stop_propagation()>
                    <div class="store-header">
                        <h2>"🪙 TOKEN STORE"</h2>
                        <button class="close-button" on:click=move |_| on_close()>
                            "✕"
                        </button>
                    </div>

                    <div class="token-balance-display">
                        <span class="balance-label">"Available Tokens:"</span>
                        <span class="balance-value">{move || format!("🪙 {}", tokens.get())}</span>
                    </div>

                    <div class="store-section">
                        <h3>"Deploy Drones"</h3>
                        <p class="section-description">
                            "Purchase drones for deployment. Tokens earned by neutralizing threats."
                        </p>

                        <div class="drone-catalog">
                            {(*drone_catalog)
                                .iter()
                                .map(|(drone_type, name, role, desc, cost)| {
                                    let drone_type = *drone_type;
                                    let cost = *cost;
                                    let name = *name;
                                    let role = *role;
                                    let desc = *desc;
                                    let can_afford = move || tokens.get() >= cost;
                                    view! {
                                        <div class="catalog-item">
                                            <div class="item-header">
                                                <h4>{name}</h4>
                                                <span class="item-role">{role}</span>
                                            </div>
                                            <p class="item-description">{desc}</p>
                                            <div class="item-footer">
                                                <div class="item-cost">{format!("🪙 {} Tokens", cost)}</div>
                                                <button
                                                    class=move || {
                                                        if can_afford() {
                                                            "purchase-button"
                                                        } else {
                                                            "purchase-button disabled"
                                                        }
                                                    }

                                                    disabled=move || !can_afford()
                                                    on:click=move |_| purchase_drone(drone_type, cost)
                                                >
                                                    "PURCHASE"
                                                </button>
                                            </div>
                                        </div>
                                    }
                                })
                                .collect_view()}

                        </div>
                    </div>

                    <div class="store-section">
                        <h3>"Earn Tokens"</h3>
                        <div class="earning-methods">
                            <div class="earning-item">
                                <span class="earning-icon">"🎯"</span>
                                <div class="earning-text">
                                    <strong>"Neutralize Threats"</strong>
                                    <p>"Earn 10 tokens per threat"</p>
                                </div>
                            </div>
                            <div class="earning-item">
                                <span class="earning-icon">"🏆"</span>
                                <div class="earning-text">
                                    <strong>"Complete Waves"</strong>
                                    <p>"Bonus 100 tokens per wave"</p>
                                </div>
                            </div>
                            <div class="earning-item">
                                <span class="earning-icon">"⭐"</span>
                                <div class="earning-text">
                                    <strong>"Unlock Achievements"</strong>
                                    <p>"Various token rewards"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    }
}
