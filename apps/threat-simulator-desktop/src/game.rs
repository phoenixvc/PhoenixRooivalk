#[cfg(target_arch = "wasm32")]
use leptos::prelude::*;

pub mod auto_targeting;
pub mod engine;
pub mod formations;
pub mod particles;
pub mod physics;
pub mod types;
pub mod waves;
pub mod weapons;

pub use types::*;

/// Main game state manager using Leptos reactive signals
#[cfg(target_arch = "wasm32")]
#[derive(Clone)]
pub struct GameStateManager {
    // Core game state
    pub score: RwSignal<u32>,
    pub level: RwSignal<u8>,
    pub threats: RwSignal<Vec<Threat>>,
    pub drones: RwSignal<Vec<Drone>>,
    pub neutralized: RwSignal<u32>,

    // Player state
    pub selected_weapon: RwSignal<WeaponType>,
    pub weapons: RwSignal<Vec<Weapon>>,
    pub energy: RwSignal<f32>,
    pub cooling: RwSignal<f32>,

    // Game timing
    pub game_time: RwSignal<f64>,
    pub frame_rate: RwSignal<f32>,

    // Resources
    pub mothership_health: RwSignal<f32>,
    pub power_ups: RwSignal<Vec<PowerUp>>,

    // Auto-targeting
    pub auto_targeting_enabled: RwSignal<bool>,
}

#[cfg(target_arch = "wasm32")]
impl GameStateManager {
    pub fn new() -> Self {
        Self {
            score: rw_signal(0),
            level: rw_signal(1),
            threats: rw_signal(Vec::new()),
            drones: rw_signal(Vec::new()),
            neutralized: rw_signal(0),

            selected_weapon: rw_signal(WeaponType::Kinetic),
            weapons: rw_signal(Self::init_weapons()),
            energy: rw_signal(100.0),
            cooling: rw_signal(100.0),

            game_time: rw_signal(0.0),
            frame_rate: rw_signal(60.0),

            mothership_health: rw_signal(100.0),
            power_ups: rw_signal(Vec::new()),

            auto_targeting_enabled: rw_signal(false),
        }
    }

    fn init_weapons() -> Vec<Weapon> {
        vec![
            Weapon {
                weapon_type: WeaponType::Kinetic,
                cooldown: 0.0,
                max_cooldown: 0.5,
                damage: 25.0,
                range: 500.0,
                energy_cost: 5.0,
                available: true,
            },
            Weapon {
                weapon_type: WeaponType::Electronic,
                cooldown: 0.0,
                max_cooldown: 1.0,
                damage: 50.0,
                range: 600.0,
                energy_cost: 15.0,
                available: true,
            },
            Weapon {
                weapon_type: WeaponType::Laser,
                cooldown: 0.0,
                max_cooldown: 0.3,
                damage: 40.0,
                range: 800.0,
                energy_cost: 20.0,
                available: true,
            },
        ]
    }

    pub fn reset(&self) {
        self.score.set(0);
        self.level.set(1);
        self.threats.set(Vec::new());
        self.drones.set(Vec::new());
        self.neutralized.set(0);
        self.selected_weapon.set(WeaponType::Kinetic);
        self.weapons.set(Self::init_weapons());
        self.energy.set(100.0);
        self.cooling.set(100.0);
        self.game_time.set(0.0);
        self.mothership_health.set(100.0);
        self.power_ups.set(Vec::new());
        self.auto_targeting_enabled.set(false);
    }

    pub fn add_threat(&self, threat: Threat) {
        self.threats.update(|threats| threats.push(threat));
    }

    pub fn remove_threat(&self, id: &str) {
        self.threats.update(|threats| {
            threats.retain(|t| t.id != id);
        });
    }

    pub fn update_score(&self, points: u32) {
        self.score.update(|score| *score += points);
    }

    pub fn consume_energy(&self, amount: f32) -> bool {
        let current = self.energy.get();
        if current >= amount {
            self.energy.set(current - amount);
            true
        } else {
            false
        }
    }

    pub fn regenerate_energy(&self, delta_time: f32) {
        self.energy.update(|energy| {
            *energy = (*energy + 10.0 * delta_time).min(100.0);
        });
    }

    pub fn regenerate_cooling(&self, delta_time: f32) {
        self.cooling.update(|cooling| {
            *cooling = (*cooling + 15.0 * delta_time).min(100.0);
        });
    }

    pub fn update_weapon_cooldowns(&self, delta_time: f32) {
        self.weapons.update(|weapons| {
            for weapon in weapons.iter_mut() {
                if weapon.cooldown > 0.0 {
                    weapon.cooldown = (weapon.cooldown - delta_time).max(0.0);
                }
            }
        });
    }
}

#[cfg(target_arch = "wasm32")]
impl Default for GameStateManager {
    fn default() -> Self {
        Self::new()
    }
}
