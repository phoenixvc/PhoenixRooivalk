// Formation management system for coordinated drone operations

use super::types::Vector2;
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FormationType {
    Circle,
    Line,
    Diamond,
    Wedge,
    Semicircle,
    Swarm,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FormationRole {
    Leader,
    Wingman,
    Flanker,
    Support,
    Reserve,
}

#[derive(Debug, Clone)]
pub struct Formation {
    pub id: String,
    pub formation_type: FormationType,
    pub center: Vector2,
    pub radius: f32,
    pub spacing: f32,
    pub drone_ids: Vec<String>,
    pub is_active: bool,
    pub priority: u8,
    pub effectiveness: f32,
}

#[derive(Debug, Clone)]
pub struct DronePosition {
    pub drone_id: String,
    pub current: Vector2,
    pub target: Vector2,
    pub role: FormationRole,
    pub priority: u8,
    pub relative_offset: Option<Vector2>, // For swarm formations: persistent offset from center
}

pub struct FormationManager {
    formations: HashMap<String, Formation>,
    drone_positions: HashMap<String, DronePosition>,
    formation_counter: u32,
}

impl FormationManager {
    pub fn new() -> Self {
        Self {
            formations: HashMap::new(),
            drone_positions: HashMap::new(),
            formation_counter: 0,
        }
    }

    /// Create a new formation with given drones
    pub fn create_formation(
        &mut self,
        formation_type: FormationType,
        center: Vector2,
        drone_ids: Vec<String>,
    ) -> String {
        self.formation_counter += 1;
        let formation_id = format!("formation-{}", self.formation_counter);

        let formation = Formation {
            id: formation_id.clone(),
            formation_type,
            center,
            radius: 100.0,
            spacing: 50.0,
            drone_ids: drone_ids.clone(),
            is_active: true,
            priority: 5,
            effectiveness: 1.0,
        };

        // Calculate positions for each drone
        self.calculate_formation_positions(&formation);

        self.formations.insert(formation_id.clone(), formation);
        formation_id
    }

    /// Calculate target positions for drones in a formation
    fn calculate_formation_positions(&mut self, formation: &Formation) {
        let drone_count = formation.drone_ids.len();
        if drone_count == 0 {
            return;
        }

        match formation.formation_type {
            FormationType::Circle => {
                self.calculate_circle_positions(formation, drone_count);
            }
            FormationType::Line => {
                self.calculate_line_positions(formation, drone_count);
            }
            FormationType::Diamond => {
                self.calculate_diamond_positions(formation, drone_count);
            }
            FormationType::Wedge => {
                self.calculate_wedge_positions(formation, drone_count);
            }
            FormationType::Semicircle => {
                self.calculate_semicircle_positions(formation, drone_count);
            }
            FormationType::Swarm => {
                self.calculate_swarm_positions(formation, drone_count);
            }
        }
    }

    fn calculate_circle_positions(&mut self, formation: &Formation, count: usize) {
        let angle_step = 2.0 * std::f32::consts::PI / count as f32;

        for (i, drone_id) in formation.drone_ids.iter().enumerate() {
            let angle = angle_step * i as f32;
            let x = formation.center.x + formation.radius * angle.cos();
            let y = formation.center.y + formation.radius * angle.sin();

            let role = if i == 0 {
                FormationRole::Leader
            } else if i < 3 {
                FormationRole::Wingman
            } else {
                FormationRole::Support
            };

            self.drone_positions.insert(
                drone_id.clone(),
                DronePosition {
                    drone_id: drone_id.clone(),
                    current: Vector2::new(x, y),
                    target: Vector2::new(x, y),
                    role,
                    priority: formation.priority,
                    relative_offset: None, // Circle formations don't use relative offsets
                },
            );
        }
    }

    fn calculate_line_positions(&mut self, formation: &Formation, count: usize) {
        let total_width = (count - 1) as f32 * formation.spacing;
        let start_x = formation.center.x - total_width / 2.0;

        for (i, drone_id) in formation.drone_ids.iter().enumerate() {
            let x = start_x + i as f32 * formation.spacing;
            let y = formation.center.y;

            let role = if i == count / 2 {
                FormationRole::Leader
            } else {
                FormationRole::Wingman
            };

            self.drone_positions.insert(
                drone_id.clone(),
                DronePosition {
                    drone_id: drone_id.clone(),
                    current: Vector2::new(x, y),
                    target: Vector2::new(x, y),
                    role,
                    priority: formation.priority,
                    relative_offset: None, // Line formations don't use relative offsets
                },
            );
        }
    }

    fn calculate_diamond_positions(&mut self, formation: &Formation, count: usize) {
        // Diamond formation: leader at front, sides, and rear
        for (i, drone_id) in formation.drone_ids.iter().enumerate() {
            let (x, y, role) = match i {
                0 => (
                    formation.center.x,
                    formation.center.y - formation.radius,
                    FormationRole::Leader,
                ),
                1 => (
                    formation.center.x + formation.radius,
                    formation.center.y,
                    FormationRole::Wingman,
                ),
                2 => (
                    formation.center.x - formation.radius,
                    formation.center.y,
                    FormationRole::Wingman,
                ),
                3 => (
                    formation.center.x,
                    formation.center.y + formation.radius,
                    FormationRole::Support,
                ),
                _ => {
                    // Additional drones fill in between
                    let angle = (i as f32 / count as f32) * 2.0 * std::f32::consts::PI;
                    (
                        formation.center.x + formation.radius * 0.7 * angle.cos(),
                        formation.center.y + formation.radius * 0.7 * angle.sin(),
                        FormationRole::Support,
                    )
                }
            };

            self.drone_positions.insert(
                drone_id.clone(),
                DronePosition {
                    drone_id: drone_id.clone(),
                    current: Vector2::new(x, y),
                    target: Vector2::new(x, y),
                    role,
                    priority: formation.priority,
                    relative_offset: None, // Diamond formations don't use relative offsets
                },
            );
        }
    }

    fn calculate_wedge_positions(&mut self, formation: &Formation, _count: usize) {
        // V-shaped formation with leader at tip
        for (i, drone_id) in formation.drone_ids.iter().enumerate() {
            // Calculate tier: each pair of wingmen advances one step down the V
            // Leader (i=0) at tier 0, then pairs at tiers 1, 2, 3, etc.
            let tier = i.div_ceil(2) as f32;
            let side = if i % 2 == 0 { 1.0 } else { -1.0 };

            let x = formation.center.x + side * tier * formation.spacing;
            let y = formation.center.y + tier * formation.spacing;

            let role = if i == 0 {
                FormationRole::Leader
            } else if i < 3 {
                FormationRole::Wingman
            } else {
                FormationRole::Flanker
            };

            self.drone_positions.insert(
                drone_id.clone(),
                DronePosition {
                    drone_id: drone_id.clone(),
                    current: Vector2::new(x, y),
                    target: Vector2::new(x, y),
                    role,
                    priority: formation.priority,
                    relative_offset: None, // Wedge formations don't use relative offsets
                },
            );
        }
    }

    fn calculate_semicircle_positions(&mut self, formation: &Formation, count: usize) {
        // Handle single-drone case to avoid division by zero
        if count == 1 {
            if let Some(drone_id) = formation.drone_ids.first() {
                // Place single drone at the top of the semicircle (angle = PI/2)
                let angle = std::f32::consts::PI / 2.0;
                let x = formation.center.x + formation.radius * angle.cos();
                let y = formation.center.y + formation.radius * angle.sin();

                self.drone_positions.insert(
                    drone_id.clone(),
                    DronePosition {
                        drone_id: drone_id.clone(),
                        current: Vector2::new(x, y),
                        target: Vector2::new(x, y),
                        role: FormationRole::Leader,
                        priority: formation.priority,
                        relative_offset: None, // Semicircle formations don't use relative offsets
                    },
                );
            }
            return;
        }

        // Handle multiple drones (count > 1)
        let angle_step = std::f32::consts::PI / (count - 1) as f32;

        for (i, drone_id) in formation.drone_ids.iter().enumerate() {
            let angle = angle_step * i as f32;
            let x = formation.center.x + formation.radius * angle.cos();
            let y = formation.center.y + formation.radius * angle.sin();

            let role = if i == count / 2 {
                FormationRole::Leader
            } else {
                FormationRole::Flanker
            };

            self.drone_positions.insert(
                drone_id.clone(),
                DronePosition {
                    drone_id: drone_id.clone(),
                    current: Vector2::new(x, y),
                    target: Vector2::new(x, y),
                    role,
                    priority: formation.priority,
                    relative_offset: None, // Semicircle formations don't use relative offsets
                },
            );
        }
    }

    fn calculate_swarm_positions(&mut self, formation: &Formation, _count: usize) {
        use rand::RngExt;
        let mut rng = rand::rng();

        for drone_id in formation.drone_ids.iter() {
            // Check if drone already has a relative offset (for swarm persistence)
            let relative_offset = if let Some(existing_pos) = self.drone_positions.get(drone_id) {
                // Use existing offset if available (prevents jumping when formation moves)
                existing_pos.relative_offset.unwrap_or_else(|| {
                    // Generate new offset if existing position didn't have one
                    let angle = rng.random::<f32>() * 2.0 * std::f32::consts::PI;
                    let distance = rng.random::<f32>() * formation.radius;
                    Vector2::new(distance * angle.cos(), distance * angle.sin())
                })
            } else {
                // New drone: generate random offset within radius
                let angle = rng.random::<f32>() * 2.0 * std::f32::consts::PI;
                let distance = rng.random::<f32>() * formation.radius;
                Vector2::new(distance * angle.cos(), distance * angle.sin())
            };

            // Apply relative offset to current formation center
            let x = formation.center.x + relative_offset.x;
            let y = formation.center.y + relative_offset.y;

            self.drone_positions.insert(
                drone_id.clone(),
                DronePosition {
                    drone_id: drone_id.clone(),
                    current: Vector2::new(x, y),
                    target: Vector2::new(x, y),
                    role: FormationRole::Support,
                    priority: formation.priority,
                    relative_offset: Some(relative_offset), // Persist offset for swarm formations
                },
            );
        }
    }

    /// Get target position for a drone
    pub fn get_drone_target(&self, drone_id: &str) -> Option<Vector2> {
        self.drone_positions.get(drone_id).map(|pos| pos.target)
    }

    /// Update formation center (all drones will adjust)
    pub fn move_formation(&mut self, formation_id: &str, new_center: Vector2) {
        if let Some(formation) = self.formations.get_mut(formation_id) {
            formation.center = new_center;
        }
        // Recalculate positions after releasing mutable borrow
        if let Some(formation) = self.formations.get(formation_id) {
            let formation_clone = formation.clone();
            self.calculate_formation_positions(&formation_clone);
        }
    }

    /// Disband a formation
    pub fn disband_formation(&mut self, formation_id: &str) {
        if let Some(formation) = self.formations.remove(formation_id) {
            for drone_id in formation.drone_ids {
                self.drone_positions.remove(&drone_id);
            }
        }
    }

    /// Get all active formations
    pub fn get_formations(&self) -> Vec<&Formation> {
        self.formations.values().collect()
    }
}

impl Default for FormationManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_circle_formation() {
        let mut manager = FormationManager::new();
        let drones = vec![
            "drone1".to_string(),
            "drone2".to_string(),
            "drone3".to_string(),
        ];
        let center = Vector2::new(500.0, 500.0);

        let formation_id = manager.create_formation(FormationType::Circle, center, drones);

        assert!(manager.formations.contains_key(&formation_id));
        assert_eq!(manager.drone_positions.len(), 3);
    }

    #[test]
    fn test_drone_positions_calculated() {
        let mut manager = FormationManager::new();
        let drones = vec!["drone1".to_string()];
        let center = Vector2::new(100.0, 100.0);

        manager.create_formation(FormationType::Circle, center, drones);

        let target = manager.get_drone_target("drone1");
        assert!(target.is_some());
    }

    #[test]
    fn test_move_formation() {
        let mut manager = FormationManager::new();
        let drones = vec!["drone1".to_string()];
        let center = Vector2::new(100.0, 100.0);

        let formation_id = manager.create_formation(FormationType::Line, center, drones);
        let new_center = Vector2::new(200.0, 200.0);

        manager.move_formation(&formation_id, new_center);

        let formation = manager.formations.get(&formation_id).unwrap();
        assert_eq!(formation.center.x, 200.0);
        assert_eq!(formation.center.y, 200.0);
    }

    #[test]
    fn test_disband_formation() {
        let mut manager = FormationManager::new();
        let drones = vec!["drone1".to_string(), "drone2".to_string()];
        let center = Vector2::new(100.0, 100.0);

        let formation_id = manager.create_formation(FormationType::Diamond, center, drones);

        manager.disband_formation(&formation_id);

        assert!(!manager.formations.contains_key(&formation_id));
        assert_eq!(manager.drone_positions.len(), 0);
    }

    #[test]
    fn test_multiple_formations() {
        let mut manager = FormationManager::new();
        let center = Vector2::new(500.0, 500.0);

        let id1 = manager.create_formation(
            FormationType::Circle,
            center,
            vec!["drone1".to_string(), "drone2".to_string()],
        );

        let id2 = manager.create_formation(
            FormationType::Line,
            Vector2::new(600.0, 600.0),
            vec!["drone3".to_string(), "drone4".to_string()],
        );

        assert_ne!(id1, id2);
        assert_eq!(manager.formations.len(), 2);
        assert_eq!(manager.drone_positions.len(), 4);
    }

    #[test]
    fn test_single_drone_semicircle() {
        let mut manager = FormationManager::new();
        let drones = vec!["drone1".to_string()];
        let center = Vector2::new(100.0, 100.0);

        // This should not panic with division by zero
        let formation_id = manager.create_formation(FormationType::Semicircle, center, drones);

        // Verify the formation was created
        assert!(manager.formations.contains_key(&formation_id));

        // Verify the single drone has a position
        assert_eq!(manager.drone_positions.len(), 1);

        // Verify the drone is assigned Leader role
        let drone_pos = manager.drone_positions.get("drone1").unwrap();
        assert_eq!(drone_pos.role, FormationRole::Leader);

        // Verify the drone is positioned at the top of the semicircle (angle = PI/2)
        // At PI/2: cos(PI/2) ≈ 0, sin(PI/2) = 1
        // So position should be approximately (center.x + 0, center.y + radius)
        assert!((drone_pos.target.x - center.x).abs() < 1.0); // Should be near center.x
        assert!(drone_pos.target.y > center.y); // Should be above center
    }
}
