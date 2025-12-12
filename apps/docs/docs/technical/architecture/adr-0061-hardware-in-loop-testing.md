---
id: adr-0061-hardware-in-loop-testing
title: "ADR 0061: Hardware-in-Loop Testing"
sidebar_label: "ADR 0061: HIL Testing"
difficulty: expert
estimated_reading_time: 10
points: 50
tags:
  - technical
  - architecture
  - testing
  - hardware
  - simulation
  - hil
prerequisites:
  - architecture-decision-records
  - adr-0060-testing-strategy
  - adr-0030-net-launcher-architecture
---

# ADR 0061: Hardware-in-Loop Testing

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Flight controller, sensors, and effectors must be tested with real hardware before field deployment to catch timing and integration issues
2. **Decision**: Implement HIL test framework with simulated environment feeding real hardware, enabling repeatable automated testing
3. **Trade-off**: Test infrastructure cost vs. field failure risk reduction

---

## Context

### Why HIL Testing

| Issue Type | Caught by Unit Tests | Caught by HIL |
|------------|---------------------|---------------|
| Logic errors | ✅ | ✅ |
| Timing issues | ❌ | ✅ |
| Sensor noise handling | ❌ | ✅ |
| Hardware interface bugs | ❌ | ✅ |
| Real-time performance | ❌ | ✅ |

### Components Requiring HIL

| Component | Interface | Test Focus |
|-----------|-----------|------------|
| Flight controller | PWM, serial | Control loops, safety |
| Net launcher | GPIO, serial | Firing sequence, safety interlocks |
| Radar module | SPI, serial | Detection, tracking |
| Camera system | USB, CSI | Recognition, latency |

---

## Decision

Implement **HIL test framework** with simulated environment:

### HIL Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HIL Test Architecture                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TEST ORCHESTRATOR (PC)                                             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Test       │  │   Scenario   │  │   Result     │          ││
│  │  │   Runner     │──│   Generator  │──│   Validator  │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│              │                                                       │
│              ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  SIMULATION ENGINE                                               ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Physics    │  │   Sensor     │  │   Target     │          ││
│  │  │   Model      │──│   Simulation │──│   Generator  │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│              │                                                       │
│              ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  INTERFACE BRIDGE                                                ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Sensor     │  │   Actuator   │  │   Timing     │          ││
│  │  │   Injection  │  │   Capture    │  │   Sync       │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│              │                                                       │
│              ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  HARDWARE UNDER TEST                                             ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Flight     │  │   Net        │  │   Edge       │          ││
│  │  │   Controller │  │   Launcher   │  │   Compute    │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Test Framework

### Test Definition

```rust
pub struct HILTest {
    pub name: String,
    pub description: String,
    pub timeout: Duration,
    pub scenario: Scenario,
    pub assertions: Vec<Assertion>,
    pub hardware_config: HardwareConfig,
}

pub struct Scenario {
    /// Initial conditions
    pub initial_state: SystemState,
    /// Sequence of events
    pub events: Vec<TimedEvent>,
    /// Expected outcomes
    pub expected_outcomes: Vec<ExpectedOutcome>,
}

pub struct TimedEvent {
    pub time: Duration,
    pub event: Event,
}

pub enum Event {
    /// Inject simulated sensor data
    SensorData(SensorReading),
    /// Inject target appearance
    TargetAppear(TargetConfig),
    /// Simulate operator action
    OperatorAction(OperatorCommand),
    /// Trigger fault condition
    FaultInjection(Fault),
}

pub enum Assertion {
    /// Check output within time window
    OutputWithin { output: Output, value: Value, window: Duration },
    /// Check sequence of outputs
    OutputSequence(Vec<(Output, Value)>),
    /// Check no output occurs
    NoOutput { output: Output, duration: Duration },
    /// Check timing constraint
    TimingConstraint { from: Event, to: Output, max_latency: Duration },
}
```

### Test Execution

```rust
pub struct HILTestRunner {
    simulation: SimulationEngine,
    bridge: InterfaceBridge,
    hardware: HardwareInterface,
    results: TestResultCollector,
}

impl HILTestRunner {
    pub async fn run_test(&mut self, test: &HILTest) -> TestResult {
        // Initialize hardware
        self.hardware.reset().await?;
        self.hardware.configure(&test.hardware_config).await?;

        // Initialize simulation
        self.simulation.set_state(&test.scenario.initial_state);

        // Start timing
        let start = Instant::now();
        let mut event_queue: BinaryHeap<_> = test.scenario.events.iter()
            .map(|e| Reverse((e.time, e.clone())))
            .collect();

        // Run simulation loop
        while start.elapsed() < test.timeout {
            // Process due events
            while let Some(Reverse((time, event))) = event_queue.peek() {
                if start.elapsed() >= *time {
                    event_queue.pop();
                    self.process_event(event).await?;
                } else {
                    break;
                }
            }

            // Step simulation
            self.simulation.step(Duration::from_millis(1));

            // Inject sensor data to hardware
            let sensor_data = self.simulation.get_sensor_outputs();
            self.bridge.inject_sensors(&sensor_data).await?;

            // Capture hardware outputs
            let outputs = self.bridge.capture_outputs().await?;
            self.results.record_outputs(start.elapsed(), &outputs);

            // Check for early termination
            if self.all_outcomes_achieved(&test.scenario.expected_outcomes) {
                break;
            }
        }

        // Validate assertions
        self.validate_assertions(&test.assertions)
    }
}
```

---

## Test Scenarios

### Net Launcher Firing Test

```rust
#[hil_test]
async fn test_net_launcher_firing_sequence() -> TestResult {
    let test = HILTest {
        name: "Net Launcher Firing Sequence".into(),
        timeout: Duration::from_secs(10),
        scenario: Scenario {
            initial_state: SystemState {
                armed: false,
                pressure_psi: 200.0,
                target_present: false,
            },
            events: vec![
                TimedEvent {
                    time: Duration::from_secs(1),
                    event: Event::TargetAppear(TargetConfig {
                        position: Vector3::new(20.0, 0.0, -10.0),
                        velocity: Vector3::new(-5.0, 0.0, 0.0),
                        classification: ThreatClassification::HostileConfirmed,
                    }),
                },
                TimedEvent {
                    time: Duration::from_secs(2),
                    event: Event::OperatorAction(OperatorCommand::Arm),
                },
                TimedEvent {
                    time: Duration::from_secs(3),
                    event: Event::OperatorAction(OperatorCommand::Fire),
                },
            ],
            expected_outcomes: vec![
                ExpectedOutcome::EffectorFired,
            ],
        },
        assertions: vec![
            // Arming should complete within 100ms
            Assertion::TimingConstraint {
                from: Event::OperatorAction(OperatorCommand::Arm),
                to: Output::ArmedIndicator(true),
                max_latency: Duration::from_millis(100),
            },
            // Firing should occur within 50ms of command
            Assertion::TimingConstraint {
                from: Event::OperatorAction(OperatorCommand::Fire),
                to: Output::SolenoidActuated,
                max_latency: Duration::from_millis(50),
            },
            // Pressure should drop after firing
            Assertion::OutputWithin {
                output: Output::Pressure,
                value: Value::LessThan(150.0),
                window: Duration::from_millis(500),
            },
        ],
        hardware_config: HardwareConfig::NetLauncher,
    };

    runner.run_test(&test).await
}
```

### Safety Interlock Test

```rust
#[hil_test]
async fn test_safety_interlock_prevents_firing() -> TestResult {
    let test = HILTest {
        name: "Safety Interlock Test".into(),
        timeout: Duration::from_secs(5),
        scenario: Scenario {
            initial_state: SystemState {
                armed: true,
                safety_engaged: true,  // Safety ON
                pressure_psi: 200.0,
            },
            events: vec![
                TimedEvent {
                    time: Duration::from_secs(1),
                    event: Event::OperatorAction(OperatorCommand::Fire),
                },
            ],
            expected_outcomes: vec![
                ExpectedOutcome::FireBlocked,
            ],
        },
        assertions: vec![
            // Solenoid should NOT actuate
            Assertion::NoOutput {
                output: Output::SolenoidActuated,
                duration: Duration::from_secs(2),
            },
            // Error should be reported
            Assertion::OutputWithin {
                output: Output::Error,
                value: Value::Equals("SAFETY_ENGAGED".into()),
                window: Duration::from_millis(100),
            },
        ],
        hardware_config: HardwareConfig::NetLauncher,
    };

    runner.run_test(&test).await
}
```

---

## Hardware Interface

### Interface Bridge

```rust
pub struct InterfaceBridge {
    /// Serial connections to hardware
    serial_ports: HashMap<String, SerialPort>,
    /// GPIO for digital I/O
    gpio: GpioController,
    /// ADC for analog inputs
    adc: AdcController,
    /// DAC for analog outputs
    dac: DacController,
    /// PWM capture/generation
    pwm: PwmController,
}

impl InterfaceBridge {
    /// Inject simulated sensor data
    pub async fn inject_sensors(&self, data: &SensorData) -> Result<(), BridgeError> {
        // Inject radar data via serial
        if let Some(radar_data) = &data.radar {
            self.serial_ports["radar"].write(&radar_data.serialize())?;
        }

        // Inject camera data via CSI simulator
        if let Some(camera_data) = &data.camera {
            self.inject_camera_frame(camera_data)?;
        }

        // Inject analog sensor values
        for (channel, value) in &data.analog_sensors {
            self.dac.set_channel(*channel, *value)?;
        }

        Ok(())
    }

    /// Capture hardware outputs
    pub async fn capture_outputs(&self) -> Result<Outputs, BridgeError> {
        Ok(Outputs {
            pwm_signals: self.pwm.capture_all()?,
            digital_outputs: self.gpio.read_outputs()?,
            serial_output: self.capture_serial_output()?,
        })
    }
}
```

---

## Test Infrastructure

### HIL Test Rig

| Component | Purpose | Interface |
|-----------|---------|-----------|
| Test PC | Orchestration, simulation | USB, Ethernet |
| Signal interface | DAC/ADC, GPIO | USB |
| PWM capture board | Motor/servo signals | USB |
| Power supply | Controlled power delivery | USB (programmable) |
| Load simulator | Motor loading | I2C |

### Test Rig Schematic

```
┌──────────────┐
│   Test PC    │
│  (Ubuntu)    │
└──────┬───────┘
       │ USB Hub
       ▼
┌──────────────────────────────────────────────────────┐
│                    Test Rig                           │
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │  Signal    │  │   PWM      │  │  Power     │     │
│  │  Interface │  │  Capture   │  │  Supply    │     │
│  │  (Labjack) │  │  (Logic)   │  │  (Keysight)│     │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘     │
│        │               │               │             │
│        └───────────────┼───────────────┘             │
│                        │                             │
│                        ▼                             │
│  ┌─────────────────────────────────────────────────┐│
│  │            Hardware Under Test                   ││
│  │  ┌────────────┐  ┌────────────┐                 ││
│  │  │  Flight    │  │    Net     │                 ││
│  │  │ Controller │  │  Launcher  │                 ││
│  │  └────────────┘  └────────────┘                 ││
│  └─────────────────────────────────────────────────┘│
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Consequences

### Positive

- **Early bug detection**: Catch hardware issues before flight test
- **Repeatability**: Automated, deterministic testing
- **Safety**: Test dangerous scenarios without risk
- **Coverage**: Test edge cases impossible in field

### Negative

- **Infrastructure cost**: Test rig hardware ~$5K
- **Maintenance**: Rig requires upkeep
- **Fidelity limits**: Simulation != reality

---

## Related ADRs

- [ADR 0060: Testing Strategy](./adr-0060-testing-strategy)
- [ADR 0062: Simulation Framework](./adr-0062-simulation-framework)
- [ADR 0033: Hardware Versioning](./adr-0033-hardware-versioning)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
