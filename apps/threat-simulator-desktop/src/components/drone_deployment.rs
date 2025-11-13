use crate::game::{Drone, DroneType, GameStateManager, Vector2};
use leptos::prelude::*;

#[component]
pub fn DroneDeploymentPanel(game_state: GameStateManager) -> impl IntoView {
    let (selected_drone_type, set_selected_drone_type) = create_signal(DroneType::Interceptor);
    let (deployment_count, set_deployment_count) = create_signal(1_u32);

    let drone_types = store_value(vec![
        (
            DroneType::Interceptor,
            "Interceptor",
            "Fast attack drone",
            10.0,
        ),
        (DroneType::Jammer, "Jammer", "Electronic warfare", 15.0),
        (
            DroneType::Surveillance,
            "Surveillance",
            "Recon and tracking",
            5.0,
        ),
        (DroneType::Effector, "Effector", "Heavy payload", 20.0),
        (DroneType::Shield, "Shield", "Defensive barrier", 15.0),
        (DroneType::SpotterUav, "Spotter", "Target designation", 8.0),
        (
            DroneType::NetCaptureUav,
            "Net Capture",
            "Non-lethal capture",
            12.0,
        ),
        (
            DroneType::PerimeterSentry,
            "Sentry",
            "Perimeter defense",
            10.0,
        ),
        (
            DroneType::SwarmCoordinator,
            "Coordinator",
            "Swarm control",
            15.0,
        ),
    ]);

    let deploy_drone = move |_| {
        let count = deployment_count.get();
        let drone_type = selected_drone_type.get();

        for i in 0..count {
            let angle = (i as f32 / count as f32) * 2.0 * std::f32::consts::PI;
            let radius = 100.0;

            let drone = Drone {
                id: format!("drone-{}-{}", drone_type as u32, i),
                drone_type,
                position: Vector2::new(960.0 + angle.cos() * radius, 540.0 + angle.sin() * radius),
                velocity: Vector2::zero(),
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
        <div class="drone-deployment-panel">
            <div class="deployment-header">
                <h3>"DEPLOY DRONES"</h3>
            </div>

            <div class="drone-selector">
                <label class="selector-label">"Type:"</label>
                <select
                    class="drone-select"
                    on:change=move |ev| {
                        let value = event_target_value(&ev);
                        if let Ok(index) = value.parse::<usize>() {
                            if let Some((drone_type, _, _, _)) = drone_types.get_value().get(index) {
                                set_selected_drone_type.set(*drone_type);
                            }
                        }
                    }
                >

                    {drone_types
                        .get_value()
                        .iter()
                        .enumerate()
                        .map(|(i, (_, name, _desc, cost))| {
                            view! {
                                <option value=i.to_string()>
                                    {format!("{} - {} energy", name, cost)}
                                </option>
                            }
                        })
                        .collect_view()}

                </select>
            </div>

            <div class="drone-count-selector">
                <label class="selector-label">"Count:"</label>
                <input
                    type="range"
                    min="1"
                    max="10"
                    class="drone-count-slider"
                    prop:value=move || deployment_count.get()
                    on:input=move |ev| {
                        let value = event_target_value(&ev);
                        if let Ok(count) = value.parse::<u32>() {
                            set_deployment_count.set(count);
                        }
                    }
                />

                <span class="count-display">{move || deployment_count.get()}</span>
            </div>

            <div class="drone-info">
                <div class="info-row">
                    <span class="info-label">"Selected:"</span>
                    <span class="info-value">
                        {move || {
                            drone_types
                                .get_value()
                                .iter()
                                .find(|(dt, _, _, _)| *dt == selected_drone_type.get())
                                .map(|(_, name, _, _)| *name)
                                .unwrap_or("Unknown")
                        }}

                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">"Description:"</span>
                    <span class="info-value">
                        {move || {
                            drone_types
                                .get_value()
                                .iter()
                                .find(|(dt, _, _, _)| *dt == selected_drone_type.get())
                                .map(|(_, _, desc, _)| *desc)
                                .unwrap_or("N/A")
                        }}

                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">"Total Cost:"</span>
                    <span class="info-value">
                        {move || {
                            drone_types
                                .get_value()
                                .iter()
                                .find(|(dt, _, _, _)| *dt == selected_drone_type.get())
                                .map(|(_, _, _, cost)| cost * deployment_count.get() as f32)
                                .unwrap_or(0.0)
                        }}
                        " energy"
                    </span>
                </div>
            </div>

            <button class="deploy-button" on:click=deploy_drone>
                "DEPLOY"
            </button>
        </div>
    }
}
