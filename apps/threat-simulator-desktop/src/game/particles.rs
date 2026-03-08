// Particle effects system for explosions, trails, and visual feedback

use super::types::Vector2;
use rand::RngExt;

#[derive(Debug, Clone)]
pub struct Particle {
    pub id: String,
    pub position: Vector2,
    pub velocity: Vector2,
    pub size: f32,
    pub life: f32,
    pub max_life: f32,
    pub rotation: f32,
    pub rotation_speed: f32,
    pub color: ParticleColor,
    pub particle_type: ParticleType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ParticleType {
    Explosion,
    Trail,
    Debris,
    Spark,
    Smoke,
    PowerUp,
}

#[derive(Debug, Clone, Copy)]
pub enum ParticleColor {
    Red,
    Orange,
    Yellow,
    Cyan,
    Blue,
    Purple,
    White,
}

impl ParticleColor {
    pub fn to_css(&self) -> &'static str {
        match self {
            ParticleColor::Red => "#ff3333",
            ParticleColor::Orange => "#ffaa33",
            ParticleColor::Yellow => "#ffff33",
            ParticleColor::Cyan => "#00ffff",
            ParticleColor::Blue => "#3366ff",
            ParticleColor::Purple => "#9933ff",
            ParticleColor::White => "#ffffff",
        }
    }
}

pub struct ParticleSystem {
    particles: Vec<Particle>,
    next_id: u32,
}

impl ParticleSystem {
    pub fn new() -> Self {
        Self {
            particles: Vec::new(),
            next_id: 0,
        }
    }

    /// Create explosion particles at position
    pub fn create_explosion(&mut self, position: Vector2, intensity: f32, color: ParticleColor) {
        let mut rng = rand::rng();
        let particle_count = (20.0 * intensity) as usize;

        for _ in 0..particle_count {
            let angle = rng.random::<f32>() * 2.0 * std::f32::consts::PI;
            let speed = rng.random::<f32>() * 200.0 * intensity;

            let velocity = Vector2::new(angle.cos() * speed, angle.sin() * speed);

            self.particles.push(Particle {
                id: format!("particle-{}", self.next_id),
                position,
                velocity,
                size: rng.random::<f32>() * 5.0 + 2.0,
                life: 1.0,
                max_life: 1.0,
                rotation: rng.random::<f32>() * 360.0,
                rotation_speed: (rng.random::<f32>() - 0.5) * 720.0,
                color,
                particle_type: ParticleType::Explosion,
            });

            self.next_id += 1;
        }
    }

    /// Create trail particles (for projectiles)
    pub fn create_trail(&mut self, position: Vector2, velocity: Vector2, color: ParticleColor) {
        self.particles.push(Particle {
            id: format!("particle-{}", self.next_id),
            position,
            velocity: velocity.scale(0.2), // Slower than parent
            size: 3.0,
            life: 0.5,
            max_life: 0.5,
            rotation: 0.0,
            rotation_speed: 0.0,
            color,
            particle_type: ParticleType::Trail,
        });

        self.next_id += 1;
    }

    /// Create debris particles (for destroyed entities)
    pub fn create_debris(&mut self, position: Vector2, count: usize) {
        let mut rng = rand::rng();

        for _ in 0..count {
            let angle = rng.random::<f32>() * 2.0 * std::f32::consts::PI;
            let speed = rng.random::<f32>() * 150.0 + 50.0;

            self.particles.push(Particle {
                id: format!("particle-{}", self.next_id),
                position,
                velocity: Vector2::new(angle.cos() * speed, angle.sin() * speed),
                size: rng.random::<f32>() * 4.0 + 1.0,
                life: rng.random::<f32>() * 1.5 + 0.5,
                max_life: 2.0,
                rotation: rng.random::<f32>() * 360.0,
                rotation_speed: (rng.random::<f32>() - 0.5) * 360.0,
                color: if rng.random::<bool>() {
                    ParticleColor::Orange
                } else {
                    ParticleColor::Red
                },
                particle_type: ParticleType::Debris,
            });

            self.next_id += 1;
        }
    }

    /// Create power-up visual effect
    pub fn create_powerup_effect(&mut self, position: Vector2, radius: f32) {
        for i in 0..12 {
            let angle = (i as f32 / 12.0) * 2.0 * std::f32::consts::PI;

            self.particles.push(Particle {
                id: format!("particle-{}", self.next_id),
                position: Vector2::new(
                    position.x + angle.cos() * radius,
                    position.y + angle.sin() * radius,
                ),
                velocity: Vector2::new(angle.cos() * 50.0, angle.sin() * 50.0),
                size: 4.0,
                life: 1.5,
                max_life: 1.5,
                rotation: 0.0,
                rotation_speed: 360.0,
                color: ParticleColor::Cyan,
                particle_type: ParticleType::PowerUp,
            });

            self.next_id += 1;
        }
    }

    /// Update all particles
    pub fn update(&mut self, delta_time: f32) {
        for particle in &mut self.particles {
            // Update position
            particle.position.x += particle.velocity.x * delta_time;
            particle.position.y += particle.velocity.y * delta_time;

            // Update rotation
            particle.rotation += particle.rotation_speed * delta_time;

            // Apply gravity/drag for certain particle types
            match particle.particle_type {
                ParticleType::Explosion | ParticleType::Debris => {
                    particle.velocity.y += 200.0 * delta_time; // Gravity
                    particle.velocity.x *= 0.98; // Drag
                    particle.velocity.y *= 0.98;
                }
                ParticleType::Trail => {
                    particle.velocity.x *= 0.90; // More drag for trails
                    particle.velocity.y *= 0.90;
                }
                _ => {}
            }

            // Update life
            particle.life -= delta_time;
        }

        // Remove dead particles
        self.particles.retain(|p| p.life > 0.0);
    }

    /// Get all active particles
    pub fn get_particles(&self) -> &[Particle] {
        &self.particles
    }

    /// Get particle count
    pub fn count(&self) -> usize {
        self.particles.len()
    }

    /// Clear all particles
    pub fn clear(&mut self) {
        self.particles.clear();
    }
}

impl Default for ParticleSystem {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_explosion() {
        let mut system = ParticleSystem::new();
        let pos = Vector2::new(100.0, 100.0);

        system.create_explosion(pos, 1.0, ParticleColor::Red);

        assert!(system.count() > 0);
    }

    #[test]
    fn test_particle_lifecycle() {
        let mut system = ParticleSystem::new();
        let pos = Vector2::new(100.0, 100.0);

        system.create_explosion(pos, 0.5, ParticleColor::Orange);
        let initial_count = system.count();

        // Update for a long time
        for _ in 0..100 {
            system.update(0.1);
        }

        // All particles should be dead and removed
        assert_eq!(system.count(), 0);
        assert!(initial_count > 0);
    }

    #[test]
    fn test_particle_movement() {
        let mut system = ParticleSystem::new();
        let pos = Vector2::new(100.0, 100.0);

        system.create_trail(pos, Vector2::new(50.0, 0.0), ParticleColor::Cyan);

        let initial_pos = system.particles[0].position;
        system.update(0.1);
        let new_pos = system.particles[0].position;

        // Particle should have moved
        assert_ne!(initial_pos.x, new_pos.x);
    }

    #[test]
    fn test_debris_creation() {
        let mut system = ParticleSystem::new();
        let pos = Vector2::new(200.0, 200.0);

        system.create_debris(pos, 10);

        assert_eq!(system.count(), 10);
    }

    #[test]
    fn test_powerup_effect() {
        let mut system = ParticleSystem::new();
        let pos = Vector2::new(300.0, 300.0);

        system.create_powerup_effect(pos, 50.0);

        assert_eq!(system.count(), 12); // Always creates 12 particles
    }

    #[test]
    fn test_clear_particles() {
        let mut system = ParticleSystem::new();
        system.create_explosion(Vector2::new(0.0, 0.0), 1.0, ParticleColor::White);

        assert!(system.count() > 0);

        system.clear();

        assert_eq!(system.count(), 0);
    }
}
