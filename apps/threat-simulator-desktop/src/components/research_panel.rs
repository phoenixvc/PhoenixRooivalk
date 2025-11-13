use crate::game::{DroneType, WeaponType};
use leptos::prelude::*;

#[derive(Debug, Clone)]
pub struct ResearchItem {
    pub id: String,
    pub name: String,
    pub category: ResearchCategory,
    pub description: String,
    pub cost: u32,
    pub research_time: f32,
    pub requirements: Vec<String>,
    pub unlocks_weapon: Option<WeaponType>,
    pub unlocks_drone: Option<DroneType>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResearchCategory {
    Weapon,
    Drone,
    System,
    Upgrade,
}

#[component]
pub fn ResearchPanel<F>(show: ReadSignal<bool>, on_close: F) -> impl IntoView
where
    F: Fn() + Copy + 'static + Send + Sync,
{
    let (selected_category, set_selected_category) = create_signal(ResearchCategory::Weapon);
    let (unlocked_items, set_unlocked_items) = create_signal(Vec::<String>::new());
    let (research_points, set_research_points) = create_signal(100_u32);

    let research_catalog = store_value(get_research_catalog());

    let start_research = move |item_id: String, cost: u32| {
        if research_points.get() >= cost {
            set_research_points.update(|p| *p -= cost);
            set_unlocked_items.update(|items| items.push(item_id));
        }
    };

    view! {
        <Show when=move || show.get() fallback=|| view! { <div></div> }>
            <div class="modal-overlay" on:click=move |_| on_close()>
                <div class="research-modal" on:click=|e| e.stop_propagation()>
                    <div class="research-header">
                        <h2>"🔬 RESEARCH & DEVELOPMENT"</h2>
                        <button class="close-button" on:click=move |_| on_close()>
                            "✕"
                        </button>
                    </div>

                    <div class="research-points-display">
                        <span class="points-label">"Research Points:"</span>
                        <span class="points-value">{move || format!("🔬 {}", research_points.get())}</span>
                    </div>

                    <div class="category-tabs">
                        <button
                            class=move || {
                                if selected_category.get() == ResearchCategory::Weapon {
                                    "category-tab active"
                                } else {
                                    "category-tab"
                                }
                            }

                            on:click=move |_| set_selected_category.set(ResearchCategory::Weapon)
                        >
                            "⚔️ WEAPONS"
                        </button>
                        <button
                            class=move || {
                                if selected_category.get() == ResearchCategory::Drone {
                                    "category-tab active"
                                } else {
                                    "category-tab"
                                }
                            }

                            on:click=move |_| set_selected_category.set(ResearchCategory::Drone)
                        >
                            "🚁 DRONES"
                        </button>
                        <button
                            class=move || {
                                if selected_category.get() == ResearchCategory::System {
                                    "category-tab active"
                                } else {
                                    "category-tab"
                                }
                            }

                            on:click=move |_| set_selected_category.set(ResearchCategory::System)
                        >
                            "⚙️ SYSTEMS"
                        </button>
                        <button
                            class=move || {
                                if selected_category.get() == ResearchCategory::Upgrade {
                                    "category-tab active"
                                } else {
                                    "category-tab"
                                }
                            }

                            on:click=move |_| set_selected_category.set(ResearchCategory::Upgrade)
                        >
                            "⬆️ UPGRADES"
                        </button>
                    </div>

                    <div class="research-catalog">
                        <For
                            each=move || {
                                research_catalog
                                    .get_value()
                                    .iter()
                                    .filter(|item| {
                                        item.category == selected_category.get()
                                            && !unlocked_items.get().contains(&item.id)
                                    })
                                    .cloned()
                                    .collect::<Vec<_>>()
                            }

                            key=|item| item.id.clone()
                            children=move |item: ResearchItem| {
                                let can_afford = move || research_points.get() >= item.cost;
                                let item_id = item.id.clone();
                                let item_cost = item.cost;
                                view! {
                                    <div class="research-item">
                                        <div class="research-item-header">
                                            <h4>{item.name}</h4>
                                            <span class="research-cost">
                                                {format!("🔬 {} RP", item.cost)}
                                            </span>
                                        </div>
                                        <p class="research-description">{item.description}</p>
                                        {(!item.requirements.is_empty())
                                            .then(|| {
                                                view! {
                                                    <div class="research-requirements">
                                                        <small>
                                                            "Requires: "
                                                            {item.requirements.join(", ")}
                                                        </small>
                                                    </div>
                                                }
                                            })}
                                        {item
                                            .unlocks_weapon
                                            .map(|weapon| {
                                                view! {
                                                    <div class="research-unlock">
                                                        <small>{format!("🔓 Unlocks: {:?} Weapon", weapon)}</small>
                                                    </div>
                                                }
                                            })}
                                        {item
                                            .unlocks_drone
                                            .map(|drone| {
                                                view! {
                                                    <div class="research-unlock">
                                                        <small>{format!("🔓 Unlocks: {:?} Drone", drone)}</small>
                                                    </div>
                                                }
                                            })}
                                        <div class="research-footer">
                                            <div class="research-time">
                                                {format!("⏱️ {:.0}s", item.research_time)}
                                            </div>
                                            <button
                                                class=move || {
                                                    if can_afford() {
                                                        "research-button"
                                                    } else {
                                                        "research-button disabled"
                                                    }
                                                }

                                                disabled=move || !can_afford()
                                                on:click=move |_| {
                                                    start_research(item_id.clone(), item_cost)
                                                }
                                            >

                                                "RESEARCH"
                                            </button>
                                        </div>
                                    </div>
                                }
                            }
                        />

                    </div>
                </div>
            </div>
        </Show>
    }
}

fn get_research_catalog() -> Vec<ResearchItem> {
    vec![
        // Weapons
        ResearchItem {
            id: "laser_mk2".to_string(),
            name: "Laser MK2".to_string(),
            category: ResearchCategory::Weapon,
            description: "Enhanced directed energy weapon with 50% more power".to_string(),
            cost: 150,
            research_time: 30.0,
            requirements: vec![],
            unlocks_weapon: Some(WeaponType::Laser),
            unlocks_drone: None,
        },
        ResearchItem {
            id: "hpm_advanced".to_string(),
            name: "Advanced HPM".to_string(),
            category: ResearchCategory::Weapon,
            description: "High Power Microwave with extended range and area effect".to_string(),
            cost: 200,
            research_time: 45.0,
            requirements: vec![],
            unlocks_weapon: Some(WeaponType::Hpm),
            unlocks_drone: None,
        },
        // Drones
        ResearchItem {
            id: "interceptor_squadron".to_string(),
            name: "Interceptor Squadron".to_string(),
            category: ResearchCategory::Drone,
            description: "Deploy coordinated interceptor drones in formation".to_string(),
            cost: 180,
            research_time: 40.0,
            requirements: vec![],
            unlocks_weapon: None,
            unlocks_drone: Some(DroneType::Interceptor),
        },
        ResearchItem {
            id: "swarm_coordinator".to_string(),
            name: "Swarm Coordination".to_string(),
            category: ResearchCategory::Drone,
            description: "Advanced AI for multi-drone swarm tactics".to_string(),
            cost: 250,
            research_time: 60.0,
            requirements: vec!["interceptor_squadron".to_string()],
            unlocks_weapon: None,
            unlocks_drone: Some(DroneType::SwarmCoordinator),
        },
        // Systems
        ResearchItem {
            id: "enhanced_targeting".to_string(),
            name: "Enhanced Targeting".to_string(),
            category: ResearchCategory::System,
            description: "AI-assisted target acquisition and tracking".to_string(),
            cost: 120,
            research_time: 25.0,
            requirements: vec![],
            unlocks_weapon: None,
            unlocks_drone: None,
        },
        ResearchItem {
            id: "power_management".to_string(),
            name: "Power Management".to_string(),
            category: ResearchCategory::System,
            description: "Optimized energy distribution and regeneration".to_string(),
            cost: 100,
            research_time: 20.0,
            requirements: vec![],
            unlocks_weapon: None,
            unlocks_drone: None,
        },
        // Upgrades
        ResearchItem {
            id: "reactor_upgrade".to_string(),
            name: "Reactor Upgrade".to_string(),
            category: ResearchCategory::Upgrade,
            description: "Increase maximum energy capacity by 50%".to_string(),
            cost: 300,
            research_time: 90.0,
            requirements: vec!["power_management".to_string()],
            unlocks_weapon: None,
            unlocks_drone: None,
        },
        ResearchItem {
            id: "cooling_system".to_string(),
            name: "Advanced Cooling".to_string(),
            category: ResearchCategory::Upgrade,
            description: "Faster cooling regeneration and higher capacity".to_string(),
            cost: 200,
            research_time: 50.0,
            requirements: vec![],
            unlocks_weapon: None,
            unlocks_drone: None,
        },
    ]
}
