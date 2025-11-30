---
id: mechanical-design-records
title: Phoenix Rooivalk Mechanical Design Records
sidebar_label: Phoenix Rooivalk Mechanical
difficulty: advanced
estimated_reading_time: 7
points: 25
tags:
  - technical
  - hardware
---

# Phoenix Rooivalk Mechanical Design Records

## Executive Summary

This document consolidates the mechanical design documentation for the Phoenix
Rooivalk RKV-M (Rotor/Powerplant) system. The design records include
Architecture Decision Records (ADRs) for critical mechanical design decisions,
trade studies, and engineering briefs for the tilt-quad configuration.

**Design Scope**: RKV-M Tilt-Quad rotor/powerplant trades including tilt-pod
geometry, rotor topology, blade count, and motor/energy options.

---

## 1. Engineer Brief

### 1.1 Baseline Configuration (Accepted)

**Pod Design**: Ducted, single rotor, 3-blade configuration

- **Outer Duct Diameter**: 0.60 m
- **Tip Clearance**: ≥ 10 mm
- **Motor/ESC**: E2 HV outrunner (16–20S)
- **Kv Sizing**: Maintain tip speed ≤ 120 m/s at hover thrust

**Performance Gates**:

- **Ducted Static Figure of Merit (FoM)**: ≥ 0.68
- **ESC Temperature Rise**: < 25°C at 60s hover
- **IMU/EO Jitter**: < 0.08 g rms at 2P/3P
- **Acoustic Performance**: OASPL@10m ≤ baseline + 3 dB
- **Tilt Servo Margin**: ≥ 2× I·ω·θ̇

### 1.2 Mission-Specific Kits

#### TQ-Q (Quiet/Thermal Kit)

- **Configuration**: Ducted single 4-blade
- **Performance**: -10–15% RPM for equal thrust
- **Trade-offs**: Small FoM penalty, lower acoustic tone
- **Use Case**: Stealth operations, thermal management

#### TQ-XR (High-Lift Kit)

- **Configuration**: Ducted coax 3+3 blade
- **Performance**: +60–80% static thrust in same diameter
- **Trade-offs**: +10–25% power for same thrust, torque-neutral
- **Considerations**: Higher mass, tones, tilt loads
- **Use Case**: High-payload missions, heavy lift operations

#### QP Tail Pusher (Variant)

- **Configuration**: Open 2-blade folding prop
- **Performance**: Cruise-only operation (not a TQ pod)
- **Use Case**: Long-range missions, efficiency optimization

---

## 2. Architecture Decision Records (ADRs)

### ADR-0001: Ducted vs Open Rotor Configuration

**Decision**: Ducted rotor configuration selected for primary design.

**Rationale**:

- **Acoustic Performance**: Ducted rotors provide superior acoustic signature
  reduction
- **Safety**: Ducted configuration offers better protection for ground personnel
- **Efficiency**: Improved hover efficiency in ducted configuration
- **Integration**: Better integration with tilt mechanism and control systems

**Constraints**:

- Increased manufacturing complexity
- Higher weight compared to open rotors
- More complex maintenance procedures

**Risks/Open Issues**:

- Duct manufacturing tolerances and quality control
- Acoustic performance validation in real-world conditions
- Maintenance accessibility for ducted configuration

**Reversibility**: Medium - requires significant redesign of tilt mechanism and
control systems.

### ADR-0002: Single vs Coaxial Rotor Topology

**Decision**: Single rotor topology selected for baseline configuration.

**Rationale**:

- **Simplicity**: Single rotor design reduces mechanical complexity
- **Maintenance**: Easier maintenance and repair procedures
- **Control**: Simplified control algorithms and systems
- **Weight**: Lower overall system weight

**Constraints**:

- Lower maximum thrust compared to coaxial configuration
- Single point of failure for propulsion system
- Limited redundancy in propulsion

**Risks/Open Issues**:

- Single rotor failure modes and mitigation strategies
- Thrust limitations for high-payload missions
- Control system complexity for tilt operations

**Reversibility**: High - coaxial option available as TQ-XR kit for high-lift
missions.

### ADR-0003: Blade Count Selection

**Decision**: 3-blade configuration selected for baseline design.

**Rationale**:

- **Balance**: Optimal balance between efficiency and complexity
- **Acoustic Performance**: Good acoustic signature characteristics
- **Manufacturing**: Standard blade count for manufacturing processes
- **Control**: Well-established control algorithms for 3-blade rotors

**Constraints**:

- 4-blade option available for quiet operations (TQ-Q kit)
- Blade count affects acoustic signature and efficiency
- Manufacturing complexity increases with blade count

**Risks/Open Issues**:

- Acoustic performance optimization for different blade counts
- Manufacturing quality control for blade consistency
- Dynamic balance and vibration characteristics

**Reversibility**: Medium - requires rotor redesign and control system updates.

### ADR-0004: Powerplant Classes

**Decision**: E2 HV outrunner motor class selected for primary configuration.

**Rationale**:

- **Performance**: High voltage operation provides better efficiency
- **Reliability**: Outrunner design offers better thermal management
- **Scalability**: HV configuration allows for power scaling
- **Integration**: Better integration with ESC and control systems

**Constraints**:

- Higher voltage requirements for power systems
- Increased complexity in power management
- Higher cost compared to lower voltage systems

**Risks/Open Issues**:

- High voltage safety considerations
- Power system integration and management
- Thermal management for high power operation

**Reversibility**: Low - requires significant power system redesign.

### ADR-0005: Variant Strategy

**Decision**: Modular kit-based approach for mission-specific configurations.

**Rationale**:

- **Flexibility**: Different missions require different performance
  characteristics
- **Cost**: Avoids over-engineering for specific mission requirements
- **Maintenance**: Easier maintenance with standardized components
- **Development**: Allows for incremental development and testing

**Constraints**:

- Increased complexity in configuration management
- Higher inventory requirements for multiple kits
- Training requirements for different configurations

**Risks/Open Issues**:

- Configuration management and documentation
- Training and maintenance procedures for different kits
- Performance validation for each configuration

**Reversibility**: High - modular approach allows for easy configuration
changes.

---

## 3. Trade Studies

### 3.1 Rotor/Powerplant Trade Matrix

The trade matrix evaluates different combinations of rotor configurations, blade
counts, and powerplant options across key performance parameters:

| Configuration                 | Thrust (N) | Power (W) | Efficiency | Acoustic (dB) | Weight (kg) |
| ----------------------------- | ---------- | --------- | ---------- | ------------- | ----------- |
| **Baseline (Ducted 3-blade)** | 100        | 800       | 0.68       | 85            | 2.5         |
| **TQ-Q (Ducted 4-blade)**     | 100        | 820       | 0.66       | 82            | 2.6         |
| **TQ-XR (Ducted Coax)**       | 160        | 1000      | 0.64       | 88            | 3.2         |
| **Open 3-blade**              | 95         | 750       | 0.70       | 90            | 2.2         |

### 3.2 Performance Analysis

#### Acoustic Performance

- **Ducted Configuration**: 3-5 dB reduction compared to open rotors
- **4-blade Option**: Additional 2-3 dB reduction for quiet operations
- **Coaxial Configuration**: Higher acoustic signature due to increased
  complexity

#### Efficiency Analysis

- **Ducted vs Open**: 2-4% efficiency penalty for ducted configuration
- **Blade Count**: 4-blade provides 1-2% efficiency improvement
- **Coaxial**: 4-6% efficiency penalty due to increased complexity

#### Weight Analysis

- **Ducted Configuration**: 0.3-0.5 kg additional weight per rotor
- **4-blade Option**: 0.1-0.2 kg additional weight per rotor
- **Coaxial Configuration**: 0.6-0.8 kg additional weight per rotor

---

## 4. Design Validation

### 4.1 Performance Validation

#### Static Testing

- **Thrust Measurement**: Load cell testing for thrust validation
- **Power Measurement**: Electrical power consumption monitoring
- **Efficiency Calculation**: Thrust-to-power ratio analysis
- **Temperature Monitoring**: Thermal performance validation

#### Dynamic Testing

- **Vibration Analysis**: IMU and accelerometer data collection
- **Acoustic Testing**: Sound pressure level measurements
- **Control Response**: Step and frequency response testing
- **Endurance Testing**: Long-duration operation validation

### 4.2 Manufacturing Validation

#### Quality Control

- **Dimensional Inspection**: Critical dimension verification
- **Balance Testing**: Rotor balance and vibration analysis
- **Material Testing**: Material property validation
- **Assembly Testing**: Integration and fit verification

#### Performance Testing

- **Factory Acceptance**: Performance validation before delivery
- **Integration Testing**: System-level performance validation
- **Field Testing**: Real-world performance validation
- **Reliability Testing**: Long-term reliability assessment

---

## 5. Manufacturing Considerations

### 5.1 Production Requirements

#### Volume Production

- **Annual Production**: 100-500 units per year
- **Lead Time**: 8-12 weeks from order to delivery
- **Quality Standards**: Aerospace-grade manufacturing standards
- **Documentation**: Complete manufacturing documentation and traceability

#### Supply Chain

- **Vendor Management**: Qualified supplier network
- **Quality Assurance**: Supplier quality management
- **Cost Management**: Competitive pricing and cost optimization
- **Risk Management**: Supply chain risk mitigation

### 5.2 Assembly and Integration

#### Assembly Procedures

- **Work Instructions**: Detailed assembly procedures
- **Tooling Requirements**: Specialized assembly tooling
- **Quality Control**: In-process quality verification
- **Testing Procedures**: Assembly-level testing and validation

#### Integration Requirements

- **System Integration**: Integration with flight control systems
- **Testing Procedures**: System-level testing and validation
- **Documentation**: Integration and testing documentation
- **Training**: Assembly and integration training programs

---

## 6. Maintenance and Support

### 6.1 Maintenance Procedures

#### Preventive Maintenance

- **Inspection Intervals**: Regular inspection schedules
- **Replacement Parts**: Standard replacement part requirements
- **Lubrication**: Lubrication procedures and schedules
- **Calibration**: Performance calibration and adjustment

#### Corrective Maintenance

- **Troubleshooting**: Diagnostic procedures and tools
- **Repair Procedures**: Component repair and replacement
- **Testing**: Post-repair testing and validation
- **Documentation**: Maintenance record keeping

### 6.2 Support Requirements

#### Technical Support

- **Documentation**: Complete technical documentation
- **Training**: Maintenance and repair training programs
- **Tools**: Specialized maintenance tools and equipment
- **Parts**: Spare parts inventory and management

#### Field Support

- **Field Service**: On-site maintenance and repair
- **Remote Support**: Remote diagnostic and support capabilities
- **Training**: Field maintenance training programs
- **Documentation**: Field service documentation and procedures

---

## Conclusion

The Phoenix Rooivalk mechanical design records provide a comprehensive
foundation for the RKV-M tilt-quad system development. The modular kit-based
approach allows for mission-specific optimization while maintaining commonality
across configurations. The ADR process ensures that critical design decisions
are well-documented and reversible, supporting future development and
optimization efforts.

The trade studies and performance validation provide the technical foundation
for system optimization, while the manufacturing and support considerations
ensure successful production and field operations. This comprehensive approach
supports the development of a robust, efficient, and maintainable mechanical
system for counter-drone defense operations.

---

_This document contains confidential technical specifications. Distribution is
restricted to authorized personnel only. © 2025 Phoenix Rooivalk. All rights
reserved._

_Context improved by Giga AI_
