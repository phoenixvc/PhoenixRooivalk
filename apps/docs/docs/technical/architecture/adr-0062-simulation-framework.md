---
id: adr-0062-simulation-framework
title: "ADR 0062: Simulation Framework"
sidebar_label: "ADR 0062: Simulation"
difficulty: expert
estimated_reading_time: 10
points: 50
tags:
  - technical
  - architecture
  - simulation
  - gazebo
  - testing
  - demo
prerequisites:
  - architecture-decision-records
  - adr-0060-testing-strategy
  - adr-0061-hardware-in-loop-testing
---

# ADR 0062: Simulation Framework

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Development, testing, and investor demos require realistic
   simulation of C-UAS scenarios without physical hardware or flight operations
2. **Decision**: Implement Gazebo-based simulation with ROS 2 integration,
   enabling software-in-the-loop testing and visual demonstrations
3. **Trade-off**: Simulation fidelity vs. development/computation cost

---

## Context

### Simulation Use Cases

| Use Case              | Fidelity Required | Real-time? |
| --------------------- | ----------------- | ---------- |
| Algorithm development | Medium            | No         |
| Integration testing   | High              | Yes        |
| Investor demos        | High visual       | Yes        |
| Operator training     | High              | Yes        |
| Scenario planning     | Low               | No         |

### Requirements

| Requirement   | Specification                     |
| ------------- | --------------------------------- |
| Physics       | Rigid body dynamics, aerodynamics |
| Sensors       | Radar, camera, IMU simulation     |
| Visualization | 3D rendering for demos            |
| Integration   | ROS 2, direct API                 |
| Performance   | Real-time capable                 |

---

## Decision

Adopt **Gazebo Harmonic** with ROS 2 Jazzy integration:

### Simulation Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Simulation Framework                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SCENARIO LAYER                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │  Scenario    │  │   Target     │  │  Environment │          ││
│  │  │  Manager     │──│   Spawner    │──│   Config     │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                │                                     │
│                                ▼                                     │
│  GAZEBO SIMULATION                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Physics    │  │   Sensor     │  │   Rendering  │          ││
│  │  │   Engine     │──│   Plugins    │──│   Engine     │          ││
│  │  │   (DART)     │  │              │  │   (Ogre2)    │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                │                                     │
│                                ▼                                     │
│  ROS 2 INTEGRATION                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │  ros_gz_     │  │   Sensor     │  │   Control    │          ││
│  │  │  bridge      │──│   Topics     │──│   Interface  │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                │                                     │
│                                ▼                                     │
│  PHOENIX ROOIVALK SOFTWARE                                          │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Sensor     │  │   Targeting  │  │   Effector   │          ││
│  │  │   Fusion     │  │   System     │  │   Control    │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## World Models

### Environment Definition

```xml
<!-- worlds/airport_perimeter.sdf -->
<?xml version="1.0" ?>
<sdf version="1.9">
  <world name="airport_perimeter">
    <!-- Physics configuration -->
    <physics type="dart">
      <real_time_update_rate>1000</real_time_update_rate>
      <max_step_size>0.001</max_step_size>
    </physics>

    <!-- Atmosphere -->
    <atmosphere type="adiabatic">
      <temperature>288.15</temperature>
      <pressure>101325</pressure>
    </atmosphere>

    <!-- Wind model -->
    <wind>
      <linear_velocity>3 2 0</linear_velocity>
    </wind>

    <!-- Ground plane -->
    <model name="ground">
      <static>true</static>
      <link name="ground_link">
        <collision name="ground_collision">
          <geometry>
            <plane>
              <normal>0 0 1</normal>
              <size>1000 1000</size>
            </plane>
          </geometry>
        </collision>
        <visual name="ground_visual">
          <geometry>
            <plane>
              <normal>0 0 1</normal>
              <size>1000 1000</size>
            </plane>
          </geometry>
          <material>
            <ambient>0.2 0.3 0.2 1</ambient>
          </material>
        </visual>
      </link>
    </model>

    <!-- Include RKV-M model -->
    <include>
      <uri>model://rkv_m</uri>
      <pose>0 0 0.5 0 0 0</pose>
    </include>

    <!-- Sensor plugins -->
    <plugin filename="gz-sim-sensors-system" name="gz::sim::systems::Sensors">
      <render_engine>ogre2</render_engine>
    </plugin>
  </world>
</sdf>
```

### RKV-M Platform Model

```xml
<!-- models/rkv_m/model.sdf -->
<model name="rkv_m">
  <link name="base_link">
    <!-- Inertial properties -->
    <inertial>
      <mass>25.0</mass>
      <inertia>
        <ixx>1.5</ixx>
        <iyy>1.5</iyy>
        <izz>2.5</izz>
      </inertia>
    </inertial>

    <!-- Visual mesh -->
    <visual name="body_visual">
      <geometry>
        <mesh>
          <uri>meshes/rkv_m_body.dae</uri>
        </mesh>
      </geometry>
    </visual>
  </link>

  <!-- Radar sensor -->
  <link name="radar_link">
    <sensor name="radar" type="gpu_lidar">
      <pose>0.3 0 0.1 0 0 0</pose>
      <update_rate>10</update_rate>
      <lidar>
        <scan>
          <horizontal>
            <samples>360</samples>
            <resolution>1</resolution>
            <min_angle>-3.14159</min_angle>
            <max_angle>3.14159</max_angle>
          </horizontal>
        </scan>
        <range>
          <min>1.0</min>
          <max>500.0</max>
        </range>
      </lidar>
    </sensor>
  </link>

  <!-- Camera sensor -->
  <link name="camera_link">
    <sensor name="tracking_camera" type="camera">
      <pose>0.2 0 0 0 0 0</pose>
      <update_rate>30</update_rate>
      <camera>
        <horizontal_fov>1.047</horizontal_fov>
        <image>
          <width>1920</width>
          <height>1080</height>
        </image>
        <clip>
          <near>0.1</near>
          <far>1000</far>
        </clip>
      </camera>
    </sensor>
  </link>

  <!-- Net launcher -->
  <link name="launcher_link">
    <pose>0 0 -0.2 0 0 0</pose>
  </link>

  <!-- Plugins -->
  <plugin filename="gz-sim-multicopter-motor-model-system"
          name="gz::sim::systems::MulticopterMotorModel">
    <!-- Motor configuration -->
  </plugin>
</model>
```

---

## Target Simulation

### Drone Target Model

```rust
pub struct DroneTarget {
    pub id: String,
    pub drone_type: DroneType,
    pub behavior: TargetBehavior,
    pub initial_pose: Pose,
}

pub enum DroneType {
    /// Small consumer quadcopter (DJI Mavic style)
    SmallQuad { mass: f64, max_speed: f64 },
    /// Racing drone (fast, agile)
    RacingDrone { mass: f64, max_speed: f64 },
    /// Fixed wing (aircraft style)
    FixedWing { mass: f64, cruise_speed: f64, wingspan: f64 },
    /// Large hexacopter (payload carrier)
    HeavyLift { mass: f64, payload: f64 },
}

pub enum TargetBehavior {
    /// Fly straight path
    Linear { velocity: Vector3<f64> },
    /// Waypoint following
    Waypoints { points: Vec<Vector3<f64>>, speed: f64 },
    /// Evasive maneuvers
    Evasive { base_path: Vec<Vector3<f64>>, agility: f64 },
    /// Loiter pattern
    Loiter { center: Vector3<f64>, radius: f64, altitude: f64 },
    /// Swarm behavior
    Swarm { swarm_id: String, role: SwarmRole },
}
```

### Scenario Manager

```rust
pub struct ScenarioManager {
    gazebo: GazeboClient,
    targets: HashMap<String, DroneTarget>,
    events: Vec<ScenarioEvent>,
}

impl ScenarioManager {
    pub async fn load_scenario(&mut self, config: &ScenarioConfig) -> Result<(), SimError> {
        // Load world
        self.gazebo.load_world(&config.world).await?;

        // Spawn RKV-M platform
        self.gazebo.spawn_model("rkv_m", &config.platform_pose).await?;

        // Prepare target spawns
        for target in &config.targets {
            self.targets.insert(target.id.clone(), target.clone());
        }

        // Queue events
        self.events = config.events.clone();

        Ok(())
    }

    pub async fn run(&mut self) -> Result<ScenarioResult, SimError> {
        let start = Instant::now();

        for event in &self.events {
            // Wait for event time
            while start.elapsed() < event.time {
                tokio::time::sleep(Duration::from_millis(10)).await;
            }

            // Execute event
            match &event.action {
                EventAction::SpawnTarget(target_id) => {
                    let target = &self.targets[target_id];
                    self.spawn_target(target).await?;
                }
                EventAction::UpdateBehavior(target_id, behavior) => {
                    self.update_target_behavior(target_id, behavior).await?;
                }
                EventAction::RemoveTarget(target_id) => {
                    self.gazebo.remove_model(target_id).await?;
                }
            }
        }

        Ok(ScenarioResult::default())
    }
}
```

---

## ROS 2 Integration

### Bridge Configuration

```yaml
# config/ros_gz_bridge.yaml
- ros_topic_name: /sensors/radar/points
  gz_topic_name: /rkv_m/radar/points
  ros_type_name: sensor_msgs/msg/PointCloud2
  gz_type_name: gz.msgs.PointCloudPacked
  direction: GZ_TO_ROS

- ros_topic_name: /sensors/camera/image
  gz_topic_name: /rkv_m/camera/image
  ros_type_name: sensor_msgs/msg/Image
  gz_type_name: gz.msgs.Image
  direction: GZ_TO_ROS

- ros_topic_name: /control/motors
  gz_topic_name: /rkv_m/motors
  ros_type_name: std_msgs/msg/Float64MultiArray
  gz_type_name: gz.msgs.Actuators
  direction: ROS_TO_GZ
```

### Launch File

```python
# launch/simulation.launch.py
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        # Gazebo simulation
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([
                PathJoinSubstitution([
                    FindPackageShare('ros_gz_sim'),
                    'launch',
                    'gz_sim.launch.py'
                ])
            ]),
            launch_arguments={
                'gz_args': '-r worlds/airport_perimeter.sdf'
            }.items()
        ),

        # ROS-Gazebo bridge
        Node(
            package='ros_gz_bridge',
            executable='parameter_bridge',
            parameters=[{
                'config_file': 'config/ros_gz_bridge.yaml'
            }],
        ),

        # Phoenix Rooivalk nodes
        Node(
            package='phoenix_rooivalk',
            executable='sensor_fusion_node',
        ),
        Node(
            package='phoenix_rooivalk',
            executable='targeting_node',
        ),
    ])
```

---

## Demo Mode

### Investor Demo Scenario

```rust
pub fn create_investor_demo_scenario() -> ScenarioConfig {
    ScenarioConfig {
        name: "Investor Demo - Airport Protection".into(),
        world: "worlds/airport_perimeter.sdf".into(),
        platform_pose: Pose::new(0.0, 0.0, 0.5, 0.0, 0.0, 0.0),
        targets: vec![
            DroneTarget {
                id: "hostile_1".into(),
                drone_type: DroneType::SmallQuad {
                    mass: 0.9,
                    max_speed: 15.0,
                },
                behavior: TargetBehavior::Linear {
                    velocity: Vector3::new(-5.0, 0.0, 0.0),
                },
                initial_pose: Pose::new(200.0, 0.0, 50.0, 0.0, 0.0, 0.0),
            },
        ],
        events: vec![
            ScenarioEvent {
                time: Duration::from_secs(5),
                action: EventAction::SpawnTarget("hostile_1".into()),
            },
            // Demo continues with detection, tracking, engagement...
        ],
        // UI overlays for demo
        ui_config: UiConfig {
            show_detection_boxes: true,
            show_track_trails: true,
            show_engagement_status: true,
        },
    }
}
```

---

## Consequences

### Positive

- **Safe development**: Test without flight risk
- **Repeatability**: Identical scenarios every time
- **Demos**: Impressive visualizations for investors
- **Coverage**: Test scenarios impossible in reality

### Negative

- **Fidelity limits**: Simulation != reality
- **Compute cost**: Real-time sim needs good hardware
- **Maintenance**: Keep sim synced with real system

---

## Related ADRs

- [ADR 0060: Testing Strategy](./adr-0060-testing-strategy)
- [ADR 0061: Hardware-in-Loop Testing](./adr-0061-hardware-in-loop-testing)
- [ADR 0063: E2E Testing](./adr-0063-e2e-testing)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
