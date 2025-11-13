use crate::game::WeaponType;
use leptos::prelude::*;

#[derive(Debug, Clone)]
pub struct SynergyEffect {
    pub id: String,
    pub name: String,
    pub description: String,
    pub weapons: Vec<WeaponType>,
    pub bonus_damage: f32,
    pub bonus_range: f32,
    pub bonus_cooldown: f32,
    pub visual_effect: String,
    pub color: String,
}

#[component]
pub fn SynergySystem(
    active_weapons: ReadSignal<Vec<WeaponType>>,
    show: ReadSignal<bool>,
) -> impl IntoView {
    // Use get_all_synergies() as single source of truth
    let synergies = store_value(get_all_synergies());

    view! {
        <Show when=move || show.get() fallback=|| view! { <div></div> }>
            <div class="synergy-indicator">
                <div class="synergy-header">
                    <span class="synergy-title">"⚡ ACTIVE SYNERGIES"</span>
                    <span class="synergy-count">
                        {move || {
                            let active = active_weapons.get();
                            synergies
                                .get_value()
                                .iter()
                                .filter(|s| s.weapons.iter().all(|w| active.contains(w)))
                                .count()
                        }}

                    </span>
                </div>

                <div class="synergy-list">
                    <For
                        each=move || {
                            let active = active_weapons.get();
                            synergies
                                .get_value()
                                .iter()
                                .filter(|s| s.weapons.iter().all(|w| active.contains(w)))
                                .cloned()
                                .collect::<Vec<_>>()
                        }

                        key=|synergy| synergy.id.clone()
                        children=move |synergy: SynergyEffect| {
                            view! {
                                <div class="synergy-item" style:border-left-color=synergy.color.clone()>
                                    <div class="synergy-name">{synergy.name}</div>
                                    <div class="synergy-desc">{synergy.description}</div>
                                    <div class="synergy-bonuses">
                                        {(synergy.bonus_damage > 0.0)
                                            .then(|| {
                                                view! {
                                                    <span class="bonus">
                                                        {format!("+{:.0}% DMG", synergy.bonus_damage * 100.0)}
                                                    </span>
                                                }
                                            })}
                                        {(synergy.bonus_range > 0.0)
                                            .then(|| {
                                                view! {
                                                    <span class="bonus">
                                                        {format!("+{:.0}% RNG", synergy.bonus_range * 100.0)}
                                                    </span>
                                                }
                                            })}
                                        {(synergy.bonus_cooldown > 0.0)
                                            .then(|| {
                                                view! {
                                                    <span class="bonus">
                                                        {format!("-{:.0}% CD", synergy.bonus_cooldown * 100.0)}
                                                    </span>
                                                }
                                            })}
                                        {(!synergy.visual_effect.is_empty())
                                            .then(|| {
                                                view! {
                                                    <span class="visual-effect" title=&synergy.visual_effect>
                                                        "✨"
                                                    </span>
                                                }
                                            })}

                                    </div>
                                </div>
                            }
                        }
                    />

                </div>

                <Show
                    when=move || {
                        let active = active_weapons.get();
                        synergies
                            .get_value()
                            .iter()
                            .filter(|s| s.weapons.iter().all(|w| active.contains(w)))
                            .count()
                            == 0
                    }

                    fallback={
                        move || {
                            let active = active_weapons.get();
                            let (dmg, rng, cd) = calculate_synergy_bonuses(&active);
                            view! {
                                <div class="synergy-totals">
                                    <strong>"Total Bonuses: "</strong>
                                    {(dmg > 0.0)
                                        .then(|| {
                                            view! { <span class="bonus">{format!("+{:.0}% DMG ", dmg * 100.0)}</span> }
                                        })}
                                    {(rng > 0.0)
                                        .then(|| {
                                            view! { <span class="bonus">{format!("+{:.0}% RNG ", rng * 100.0)}</span> }
                                        })}
                                    {(cd > 0.0)
                                        .then(|| {
                                            view! { <span class="bonus">{format!("-{:.0}% CD", cd * 100.0)}</span> }
                                        })}
                                </div>
                            }
                        }
                    }
                >
                    <div class="no-synergies">
                        "No active synergies. Select compatible weapons to activate bonuses."
                    </div>
                </Show>
            </div>
        </Show>
    }
}

/// Calculate total synergy bonuses for current weapon selection
pub fn calculate_synergy_bonuses(active_weapons: &[WeaponType]) -> (f32, f32, f32) {
    let synergies = get_all_synergies();

    let mut total_damage = 0.0;
    let mut total_range = 0.0;
    let mut total_cooldown = 0.0;

    for synergy in synergies {
        if synergy.weapons.iter().all(|w| active_weapons.contains(w)) {
            total_damage += synergy.bonus_damage;
            total_range += synergy.bonus_range;
            total_cooldown += synergy.bonus_cooldown;
        }
    }

    (total_damage, total_range, total_cooldown)
}

pub fn get_all_synergies() -> Vec<SynergyEffect> {
    vec![
        SynergyEffect {
            id: "gnss_rf_combo".to_string(),
            name: "Navigation Disruption".to_string(),
            description:
                "GNSS Denial and RF Takeover combine to completely confuse drone navigation"
                    .to_string(),
            weapons: vec![WeaponType::GnssDeny, WeaponType::RfTakeover],
            bonus_damage: 0.0,
            bonus_range: 0.2,
            bonus_cooldown: 0.15,
            visual_effect: "navigation confusion".to_string(),
            color: "#8b5cf6".to_string(),
        },
        SynergyEffect {
            id: "optical_net_combo".to_string(),
            name: "Blind and Capture".to_string(),
            description: "Optical Dazzler blinds cameras while Net captures disabled drones"
                .to_string(),
            weapons: vec![WeaponType::OpticalDazzle, WeaponType::Net],
            bonus_damage: 0.0,
            bonus_range: 0.15,
            bonus_cooldown: 0.0,
            visual_effect: "blind capture".to_string(),
            color: "#70a1ff".to_string(),
        },
        SynergyEffect {
            id: "kinetic_laser_combo".to_string(),
            name: "Overwhelming Force".to_string(),
            description: "Kinetic and Laser weapons combine for maximum destruction".to_string(),
            weapons: vec![WeaponType::Kinetic, WeaponType::Laser],
            bonus_damage: 0.3,
            bonus_range: 0.1,
            bonus_cooldown: 0.0,
            visual_effect: "destruction field".to_string(),
            color: "#ff6b6b".to_string(),
        },
        SynergyEffect {
            id: "decoy_capture".to_string(),
            name: "Decoy and Capture".to_string(),
            description: "Decoy Beacon attracts threats into Net capture zones".to_string(),
            weapons: vec![WeaponType::DecoyBeacon, WeaponType::Net],
            bonus_damage: 0.0,
            bonus_range: 0.25,
            bonus_cooldown: 0.2,
            visual_effect: "attraction field".to_string(),
            color: "#4ecdc4".to_string(),
        },
        SynergyEffect {
            id: "electronic_dominance".to_string(),
            name: "Electronic Dominance".to_string(),
            description: "Multiple EW systems create layered electronic defense".to_string(),
            weapons: vec![
                WeaponType::Electronic,
                WeaponType::Hpm,
                WeaponType::RfTakeover,
            ],
            bonus_damage: 0.2,
            bonus_range: 0.3,
            bonus_cooldown: 0.1,
            visual_effect: "EM field".to_string(),
            color: "#a29bfe".to_string(),
        },
        SynergyEffect {
            id: "ai_deception_combo".to_string(),
            name: "Cognitive Warfare".to_string(),
            description: "AI Deception combined with decoys creates confusion".to_string(),
            weapons: vec![
                WeaponType::AiDeception,
                WeaponType::DecoyBeacon,
                WeaponType::Chaff,
            ],
            bonus_damage: 0.15,
            bonus_range: 0.2,
            bonus_cooldown: 0.25,
            visual_effect: "cognitive disruption".to_string(),
            color: "#fdcb6e".to_string(),
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_synergy_detection() {
        let active = vec![WeaponType::GnssDeny, WeaponType::RfTakeover];
        let (damage, range, cooldown) = calculate_synergy_bonuses(&active);

        assert!(range > 0.0);
        assert!(cooldown > 0.0);
    }

    #[test]
    fn test_no_synergy() {
        let active = vec![WeaponType::Kinetic];
        let (damage, range, cooldown) = calculate_synergy_bonuses(&active);

        assert_eq!(damage, 0.0);
        assert_eq!(range, 0.0);
        assert_eq!(cooldown, 0.0);
    }

    #[test]
    fn test_multiple_synergies() {
        let active = vec![
            WeaponType::Kinetic,
            WeaponType::Laser,
            WeaponType::GnssDeny,
            WeaponType::RfTakeover,
        ];
        let (damage, range, _) = calculate_synergy_bonuses(&active);

        // Should have both kinetic_laser and gnss_rf synergies
        assert!(damage > 0.0);
        assert!(range > 0.0);
    }
}
