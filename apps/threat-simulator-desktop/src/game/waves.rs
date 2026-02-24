// Wave management system for progressive difficulty and threat spawning

use super::types::{Threat, ThreatType, Vector2};
use rand::RngExt;

#[derive(Debug, Clone)]
pub struct WaveConfig {
    pub wave_number: u32,
    pub total_threats: u32,
    pub spawn_interval: f32, // seconds between spawns
    pub threat_types: Vec<ThreatTypeConfig>,
    pub difficulty: f32, // 1.0-10.0 scale
}

#[derive(Debug, Clone)]
pub struct ThreatTypeConfig {
    pub threat_type: ThreatType,
    pub count: u32,
    pub delay: f32, // seconds before spawning this type
}

#[derive(Debug, Clone)]
pub struct DifficultyScaling {
    pub speed_multiplier: f32,
    pub health_multiplier: f32,
    pub damage_multiplier: f32,
    pub spawn_rate_multiplier: f32,
    pub special_ability_chance: f32,
}

#[derive(Debug, Clone)]
pub struct WaveProgress {
    pub current_wave: u32,
    pub total_waves: u32,
    pub threats_spawned: u32,
    pub threats_remaining: u32,
    pub wave_progress: f32, // 0.0-1.0
    pub time_to_next_wave: Option<f32>,
}

pub struct WaveManager {
    current_wave: u32,
    threats_spawned: u32,
    threats_to_spawn: Vec<ThreatSpawnEvent>,
    spawn_timer: f32,
    wave_complete: bool,
    config: WaveConfig,
}

#[derive(Debug, Clone)]
struct ThreatSpawnEvent {
    threat_type: ThreatType,
    spawn_time: f32,
    spawned: bool,
}

impl WaveManager {
    pub fn new(starting_wave: u32) -> Self {
        let config = Self::generate_wave_config(starting_wave, 1.0);
        let mut manager = Self {
            current_wave: starting_wave,
            threats_spawned: 0,
            threats_to_spawn: Vec::new(),
            spawn_timer: 0.0,
            wave_complete: false,
            config,
        };
        manager.prepare_wave();
        manager
    }

    /// Generate wave configuration based on wave number
    pub fn generate_wave_config(wave_number: u32, base_difficulty: f32) -> WaveConfig {
        let scaling = Self::calculate_difficulty_scaling(wave_number);
        let base_threat_count = ((3 + wave_number * 2) as f32 * base_difficulty).min(50.0) as u32;

        let mut threat_types = Vec::new();

        // Basic drones always present
        if wave_number >= 1 {
            threat_types.push(ThreatTypeConfig {
                threat_type: ThreatType::Commercial,
                count: (base_threat_count as f32 * 0.6) as u32,
                delay: 0.0,
            });
        }

        // Swarms from wave 3
        if wave_number >= 3 {
            threat_types.push(ThreatTypeConfig {
                threat_type: ThreatType::Swarm,
                count: (base_threat_count as f32 * 0.3) as u32,
                delay: 2.0,
            });
        }

        // Military drones from wave 5
        if wave_number >= 5 {
            threat_types.push(ThreatTypeConfig {
                threat_type: ThreatType::Military,
                count: (base_threat_count as f32 * 0.2) as u32,
                delay: 4.0,
            });
        }

        // Stealth from wave 7
        if wave_number >= 7 {
            threat_types.push(ThreatTypeConfig {
                threat_type: ThreatType::Stealth,
                count: (base_threat_count as f32 * 0.15) as u32,
                delay: 6.0,
            });
        }

        // Kamikaze from wave 10
        if wave_number >= 10 {
            threat_types.push(ThreatTypeConfig {
                threat_type: ThreatType::Kamikaze,
                count: (base_threat_count as f32 * 0.1) as u32,
                delay: 8.0,
            });
        }

        WaveConfig {
            wave_number,
            total_threats: threat_types.iter().map(|t| t.count).sum(),
            spawn_interval: (1.0 / scaling.spawn_rate_multiplier).max(0.3),
            threat_types,
            difficulty: wave_number as f32,
        }
    }

    /// Calculate difficulty scaling
    pub fn calculate_difficulty_scaling(wave_number: u32) -> DifficultyScaling {
        let base_wave = wave_number.max(1);
        let scaling_factor = 1.0 + (base_wave - 1) as f32 * 0.15;

        DifficultyScaling {
            speed_multiplier: (scaling_factor * 0.67).min(3.0),
            health_multiplier: (scaling_factor * 1.33).min(5.0),
            damage_multiplier: scaling_factor.min(4.0),
            spawn_rate_multiplier: (1.0 + (base_wave - 1) as f32 * 0.05).min(2.0),
            special_ability_chance: ((base_wave - 1) as f32 * 0.03).min(0.5),
        }
    }

    /// Prepare spawn events for current wave
    fn prepare_wave(&mut self) {
        self.threats_to_spawn.clear();
        self.spawn_timer = 0.0;
        self.threats_spawned = 0;
        self.wave_complete = false;

        let _current_time = 0.0;

        for threat_config in &self.config.threat_types {
            let mut spawn_time = threat_config.delay;

            for _ in 0..threat_config.count {
                self.threats_to_spawn.push(ThreatSpawnEvent {
                    threat_type: threat_config.threat_type,
                    spawn_time,
                    spawned: false,
                });
                spawn_time += self.config.spawn_interval;
            }
        }

        // Sort by spawn time
        self.threats_to_spawn
            .sort_by(|a, b| a.spawn_time.partial_cmp(&b.spawn_time).unwrap());
    }

    /// Update wave manager and return threats to spawn
    pub fn update(&mut self, delta_time: f32) -> Vec<Threat> {
        self.spawn_timer += delta_time;
        let mut spawned_threats = Vec::new();
        let current_timer = self.spawn_timer;
        let current_wave = self.current_wave;

        for event in &mut self.threats_to_spawn {
            if !event.spawned && current_timer >= event.spawn_time {
                // Spawn threat using parameters from event
                spawned_threats.push(Self::create_threat(event.threat_type, current_wave));
                event.spawned = true;
                self.threats_spawned += 1;
            }
        }

        // Check if wave is complete
        if self.threats_spawned >= self.config.total_threats {
            self.wave_complete = true;
        }

        spawned_threats
    }

    /// Create a single threat (static method to avoid borrow issues)
    fn create_threat(threat_type: ThreatType, current_wave: u32) -> Threat {
        let mut rng = rand::rng();
        let scaling = Self::calculate_difficulty_scaling(current_wave);

        // Random spawn position on edge of map
        let angle = rng.random::<f32>() * 2.0 * std::f32::consts::PI;
        let spawn_radius = 800.0;
        let center = Vector2::new(960.0, 540.0);

        let position = Vector2::new(
            center.x + angle.cos() * spawn_radius,
            center.y + angle.sin() * spawn_radius,
        );

        let (base_health, base_speed, base_size) = match threat_type {
            ThreatType::Commercial => (100.0, 50.0, 20.0),
            ThreatType::Military => (200.0, 40.0, 30.0),
            ThreatType::Swarm => (50.0, 70.0, 15.0),
            ThreatType::Stealth => (80.0, 60.0, 18.0),
            ThreatType::Kamikaze => (120.0, 100.0, 25.0),
            ThreatType::Recon => (60.0, 80.0, 16.0),
            ThreatType::ElectronicWarfare => (150.0, 45.0, 28.0),
        };

        let health = base_health * scaling.health_multiplier;
        let speed = base_speed * scaling.speed_multiplier;

        // Calculate direction vector toward the base (center)
        let dx = center.x - position.x;
        let dy = center.y - position.y;
        let distance_to_base = (dx * dx + dy * dy).sqrt();

        // Initialize velocity toward the base
        let velocity = if distance_to_base > 0.0 {
            let scale = speed / distance_to_base;
            Vector2::new(dx * scale, dy * scale)
        } else {
            Vector2::zero()
        };

        Threat {
            id: format!("threat-{}-{}", current_wave, rng.random::<u32>()),
            threat_type,
            position,
            velocity,
            health,
            max_health: health,
            speed,
            size: base_size,
            is_targeted: false,
            distance_to_base,
        }
    }

    /// Check if current wave is complete
    pub fn is_wave_complete(&self) -> bool {
        self.wave_complete
    }

    /// Advance to next wave
    pub fn next_wave(&mut self) {
        self.current_wave += 1;
        self.config = Self::generate_wave_config(self.current_wave, 1.0);
        self.prepare_wave();
    }

    /// Get current wave progress
    pub fn get_progress(&self) -> WaveProgress {
        WaveProgress {
            current_wave: self.current_wave,
            total_waves: 0, // Endless mode
            threats_spawned: self.threats_spawned,
            threats_remaining: self.config.total_threats - self.threats_spawned,
            wave_progress: self.threats_spawned as f32 / self.config.total_threats as f32,
            time_to_next_wave: if self.wave_complete { Some(0.0) } else { None },
        }
    }

    /// Get current wave number
    pub fn current_wave(&self) -> u32 {
        self.current_wave
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wave_config_generation() {
        let config = WaveManager::generate_wave_config(1, 1.0);

        assert_eq!(config.wave_number, 1);
        assert!(config.total_threats > 0);
        assert!(config.spawn_interval > 0.0);
        assert!(!config.threat_types.is_empty());
    }

    #[test]
    fn test_difficulty_scaling() {
        let scaling1 = WaveManager::calculate_difficulty_scaling(1);
        let scaling5 = WaveManager::calculate_difficulty_scaling(5);

        assert!(scaling5.health_multiplier > scaling1.health_multiplier);
        assert!(scaling5.speed_multiplier > scaling1.speed_multiplier);
        assert!(scaling5.damage_multiplier > scaling1.damage_multiplier);
    }

    #[test]
    fn test_wave_progression() {
        let mut manager = WaveManager::new(1);

        assert_eq!(manager.current_wave(), 1);
        assert!(!manager.is_wave_complete());

        // Simulate until wave complete
        while !manager.is_wave_complete() {
            manager.update(1.0);
        }

        assert!(manager.is_wave_complete());

        manager.next_wave();
        assert_eq!(manager.current_wave(), 2);
        assert!(!manager.is_wave_complete());
    }

    #[test]
    fn test_threat_spawning() {
        let mut manager = WaveManager::new(1);

        // Update multiple times
        let mut total_spawned = 0;
        for _ in 0..100 {
            let threats = manager.update(0.5);
            total_spawned += threats.len();
        }

        assert!(total_spawned > 0);
    }

    #[test]
    fn test_wave_progress_tracking() {
        let mut manager = WaveManager::new(1);

        let progress1 = manager.get_progress();
        assert_eq!(progress1.current_wave, 1);
        assert_eq!(progress1.threats_spawned, 0);

        // Spawn some threats
        manager.update(5.0);

        let progress2 = manager.get_progress();
        assert!(progress2.threats_spawned > 0);
        assert!(progress2.wave_progress > 0.0);
    }

    #[test]
    fn test_higher_waves_have_more_threat_types() {
        let config1 = WaveManager::generate_wave_config(1, 1.0);
        let config10 = WaveManager::generate_wave_config(10, 1.0);

        assert!(config10.threat_types.len() >= config1.threat_types.len());
    }
}
