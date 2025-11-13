use crate::game::{GameStateManager, WeaponType};
use leptos::prelude::*;

#[component]
pub fn WeaponPanel(game_state: GameStateManager) -> impl IntoView {
    let weapons = vec![
        (WeaponType::Kinetic, "1", "Kinetic"),
        (WeaponType::Electronic, "2", "EW"),
        (WeaponType::Laser, "3", "Laser"),
        (WeaponType::Net, "4", "Net"),
        (WeaponType::Hpm, "5", "HPM"),
        (WeaponType::RfTakeover, "6", "RF-Take"),
        (WeaponType::GnssDeny, "7", "GNSS"),
        (WeaponType::OpticalDazzle, "8", "Dazzle"),
        (WeaponType::Acoustic, "9", "Acoustic"),
        (WeaponType::DecoyBeacon, "0", "Decoy"),
        (WeaponType::Chaff, "C", "Chaff"),
        (WeaponType::SmartSlug, "S", "Smart"),
        (WeaponType::AiDeception, "A", "AI-Decept"),
    ];

    view! {
        <div class="weapon-panel">
            <div class="weapon-grid">
                {weapons
                    .into_iter()
                    .map(|(weapon_type, key, label)| {
                        let game_state_clone = game_state.clone();
                        let is_selected =
                            move || game_state_clone.selected_weapon.get() == weapon_type;
                        let game_state_click = game_state.clone();
                        view! {
                            <button
                                class=move || {
                                    if is_selected() { "weapon-button active" } else { "weapon-button" }
                                }

                                on:click=move |_| {
                                    game_state_click.selected_weapon.set(weapon_type);
                                }

                                title=move || get_weapon_description(weapon_type)
                            >
                                <div class="weapon-key">{key}</div>
                                <div class="weapon-name">{label}</div>
                            </button>
                        }
                    })
                    .collect_view()}

            </div>
        </div>
    }
}

fn get_weapon_description(weapon_type: WeaponType) -> &'static str {
    match weapon_type {
        WeaponType::Kinetic => "Kinetic Interceptor - High rate of fire, physical projectiles",
        WeaponType::Electronic => "Electronic Warfare - Disrupts drone communication and control",
        WeaponType::Laser => "Directed Energy Laser - Instant hit, high precision, long range",
        WeaponType::Net => "Net Capture System - Non-lethal capture and recovery",
        WeaponType::Hpm => "High Power Microwave - Area effect electronic disruption",
        WeaponType::RfTakeover => "RF Takeover - Hijack and control hostile drones",
        WeaponType::GnssDeny => "GNSS Denial - Jam GPS and navigation signals",
        WeaponType::OpticalDazzle => "Optical Dazzler - Blind optical sensors and cameras",
        WeaponType::Acoustic => "Acoustic Weapon - Sonic disruption and disorientation",
        WeaponType::DecoyBeacon => "Decoy Beacon - Lure threats away from protected assets",
        WeaponType::Chaff => "Chaff Dispenser - Create radar and sensor interference",
        WeaponType::SmartSlug => "Smart Slug - AI-guided kinetic projectile",
        WeaponType::AiDeception => "AI Deception - Spoof and confuse drone AI systems",
    }
}
