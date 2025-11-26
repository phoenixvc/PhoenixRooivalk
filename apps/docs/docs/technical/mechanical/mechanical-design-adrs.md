---
id: mechanical-design-adrs
title: Phoenix Rooivalk Mechanical Design - Architecture Decision Records
sidebar_label: Phoenix Rooivalk Mechanical
difficulty: advanced
estimated_reading_time: 6
points: 25
tags:
  - technical
  - hardware
---

# Phoenix Rooivalk Mechanical Design - Architecture Decision Records

## Executive Summary

This document consolidates all Architecture Decision Records (ADRs) for the
Phoenix Rooivalk mechanical design, covering critical design decisions for the
RKV-M tilt-quad system. The ADRs document the rationale behind key mechanical
design choices, trade-offs, and implementation strategies.

**Design Philosophy**: Modular, mission-adaptable mechanical architecture with
emphasis on survivability, performance, and operational flexibility.

---

## ADR-0001: Ducted vs Open Props for Tilt Pods (RKV-M-TQ)

**Status**: Accepted • **Date**: 2025-09-25 • **Owner**: J

### Context

Tilt-quad pods must supply high static thrust, survive debris/strikes, control
acoustic signature, and tolerate frequent tilt transitions. Outer duct = **0.60
m**; tip clearance target **≥ 10 mm**; pod centers x = 0.50/1.20 m, ±y = 0.795
m.

### Options Considered

1. **Ducted + Single** rotor
2. **Ducted + Coax (3+3)**
3. **Open + Single** rotor
4. **Open + Coax**

### Decision

Adopt **Ducted + Single** as the **baseline** tilt pod. Keep **Ducted + Coax**
as a **mission kit** (TQ-XR) for hot/high or heavy payload cases. Open props are
reserved for the **QP tail pusher** variant only.

### Rationale

- **Survivability & Safety**: Duct protects tips and bystanders; best debris
  tolerance
- **Static Thrust & Control**: Ducted single has **higher FoM** at hover;
  smoother transitions than coax; simpler mixer/faults
- **Acoustics**: Duct enables **lower tip speed** for equal thrust; reduced
  tones vs open/coax
- **Mass/Complexity**: Ducted single is lowest for protected pods
- **Mission Flexibility**: Coax kit available for extreme conditions

### Implementation

- **Baseline Configuration**: 4x ducted single-rotor tilt pods
- **Mission Kit**: TQ-XR with ducted coax for high-altitude/heavy payload
  missions
- **Duct Design**: 0.60m outer diameter with 10mm+ tip clearance
- **Pod Positioning**: x = 0.50/1.20 m, ±y = 0.795 m

---

## ADR-0002: Single vs Coaxial Rotor for Tilt Pods

**Status**: Accepted • **Date**: 2025-09-26 • **Owner**: J

### Context

Decision between single and coaxial rotor configurations for the RKV-M tilt-quad
system, considering performance, complexity, and mission requirements.

### Options Considered

1. **Single Rotor**: One rotor per pod
2. **Coaxial Rotor**: Two counter-rotating rotors per pod

### Decision

**Single rotor** for baseline configuration, with **coaxial option** available
as mission kit for extreme conditions.

### Rationale

- **Performance**: Single rotor provides higher figure of merit (FoM) at hover
- **Complexity**: Single rotor reduces mechanical complexity and failure modes
- **Control**: Simpler control mixing and fault handling
- **Mass**: Lower mass for standard missions
- **Flexibility**: Coaxial available for high-altitude/heavy payload missions

### Implementation

- **Baseline**: Single rotor per tilt pod
- **Mission Kit**: Coaxial configuration (TQ-XR) for extreme conditions
- **Control System**: Simplified mixing for single rotor, advanced mixing for
  coaxial

---

## ADR-0003: Blade Count Selection

**Status**: Accepted • **Date**: 2025-09-27 • **Owner**: J

### Context

Selection of optimal blade count for the RKV-M tilt-quad system, balancing
performance, acoustics, and manufacturing considerations.

### Options Considered

1. **2-Blade**: Simple, lightweight
2. **3-Blade**: Balanced performance and complexity
3. **4-Blade**: High performance, increased complexity
4. **5+ Blade**: Maximum performance, high complexity

### Decision

**3-blade** configuration for baseline, with **4-blade** option for
high-performance missions.

### Rationale

- **Performance**: 3-blade provides optimal balance of thrust and efficiency
- **Acoustics**: Reduced blade passing frequency compared to 2-blade
- **Manufacturing**: Standard 3-blade manufacturing processes
- **Flexibility**: 4-blade option for high-performance missions
- **Maintenance**: Reasonable complexity for field maintenance

### Implementation

- **Baseline**: 3-blade rotors for all tilt pods
- **High-Performance**: 4-blade option for TQ-XR mission kit
- **Manufacturing**: Standard 3-blade tooling and processes

---

## ADR-0004: Powerplant Classes

**Status**: Accepted • **Date**: 2025-09-28 • **Owner**: J

### Context

Selection of powerplant classes for the RKV-M system, considering power
requirements, efficiency, and mission flexibility.

### Options Considered

1. **Electric**: Battery-powered electric motors
2. **Hybrid**: Electric with range-extending generator
3. **Turbine**: Small gas turbine engines
4. **Multi-Fuel**: Flexible fuel options

### Decision

**Electric** for baseline with **Hybrid** option for extended missions.

### Rationale

- **Efficiency**: Electric provides highest efficiency for short missions
- **Reliability**: Fewer moving parts, higher reliability
- **Maintenance**: Simplified maintenance requirements
- **Flexibility**: Hybrid option for extended range missions
- **Environmental**: Zero emissions for electric operation

### Implementation

- **Baseline**: High-performance electric motors with lithium-ion batteries
- **Extended Range**: Hybrid system with range-extending generator
- **Power Management**: Advanced power management and distribution

---

## ADR-0005: Variant Strategy

**Status**: Accepted • **Date**: 2025-09-29 • **Owner**: J

### Context

Development of variant strategy for the RKV-M system to address different
mission requirements and operational environments.

### Options Considered

1. **Single Variant**: One configuration for all missions
2. **Mission Kits**: Modular kits for different missions
3. **Multiple Variants**: Separate configurations for different missions
4. **Hybrid Approach**: Base system with mission-specific kits

### Decision

**Hybrid Approach**: Base RKV-M system with mission-specific kits and variants.

### Rationale

- **Flexibility**: Mission-specific optimization while maintaining commonality
- **Cost**: Shared base system reduces development and production costs
- **Logistics**: Common maintenance and training across variants
- **Performance**: Optimized performance for specific mission requirements
- **Scalability**: Easy to add new mission kits and variants

### Implementation

- **Base System**: RKV-M with standard configuration
- **Mission Kits**: TQ-XR (high-performance), TQ-LR (long-range), TQ-HP (heavy
  payload)
- **Variants**: RKV-M (mothership), RKV-I (interceptor), RKV-G (ground control)

---

## Design Specifications

### Tilt Pod Specifications

- **Outer Duct Diameter**: 0.60 m
- **Tip Clearance**: ≥ 10 mm
- **Pod Centers**: x = 0.50/1.20 m, ±y = 0.795 m
- **Rotor Configuration**: 3-blade single rotor (baseline)
- **Powerplant**: Electric motor with lithium-ion battery

### Mission Kit Specifications

- **TQ-XR (High-Performance)**: 4-blade coaxial rotors, hybrid powerplant
- **TQ-LR (Long-Range)**: Extended battery capacity, optimized aerodynamics
- **TQ-HP (Heavy Payload)**: Increased thrust capacity, reinforced structure

### Performance Targets

- **Hover Efficiency**: Figure of Merit (FoM) > 0.7
- **Acoustic Signature**: < 85 dB at 10m distance
- **Survivability**: Debris tolerance, tip protection
- **Control Authority**: Smooth tilt transitions, fault tolerance

---

## Manufacturing Considerations

### Production Strategy

- **Modular Design**: Standardized components across variants
- **Mission Kits**: Add-on components for mission-specific requirements
- **Commonality**: Shared tooling and processes where possible
- **Flexibility**: Easy reconfiguration for different missions

### Quality Control

- **Precision Manufacturing**: Tight tolerances for aerodynamic performance
- **Testing**: Comprehensive testing of all components and systems
- **Certification**: Compliance with aviation and military standards
- **Documentation**: Complete manufacturing and maintenance documentation

### Supply Chain

- **Standard Components**: Use of commercial off-the-shelf (COTS) components
  where possible
- **Custom Components**: Specialized components for unique requirements
- **Vendor Management**: Multiple suppliers for critical components
- **Quality Assurance**: Supplier qualification and ongoing monitoring

---

## Maintenance and Support

### Field Maintenance

- **Modular Replacement**: Easy replacement of mission kits and components
- **Tool Requirements**: Standard aviation tools and procedures
- **Training**: Comprehensive maintenance training programs
- **Documentation**: Detailed maintenance procedures and troubleshooting guides

### Depot Maintenance

- **Overhaul Procedures**: Major overhaul and refurbishment procedures
- **Component Testing**: Comprehensive testing of all components
- **Upgrade Paths**: Clear upgrade paths for new mission requirements
- **Lifecycle Management**: Component lifecycle tracking and replacement

### Support Infrastructure

- **Spare Parts**: Comprehensive spare parts inventory and management
- **Technical Support**: 24/7 technical support and troubleshooting
- **Training Programs**: Ongoing training for operators and maintainers
- **Documentation**: Complete technical and operational documentation

---

## Future Enhancements

### Technology Roadmap

- **Advanced Materials**: Composite materials for weight reduction
- **Improved Aerodynamics**: Advanced duct and rotor designs
- **Power Systems**: Next-generation battery and hybrid systems
- **Control Systems**: Advanced flight control and autonomy

### Mission Expansion

- **New Mission Kits**: Additional mission-specific configurations
- **Performance Improvements**: Enhanced performance capabilities
- **Operational Flexibility**: Increased operational envelope
- **Integration**: Enhanced integration with other systems

---

## Conclusion

The Phoenix Rooivalk mechanical design ADRs establish a comprehensive foundation
for the RKV-M tilt-quad system. The modular, mission-adaptable architecture
provides the flexibility to meet diverse operational requirements while
maintaining commonality and cost-effectiveness.

The design decisions documented in these ADRs ensure optimal performance,
reliability, and maintainability while providing the flexibility to adapt to
changing mission requirements and operational environments.

---

_This document contains confidential mechanical design specifications.
Distribution is restricted to authorized personnel only. © 2025 Phoenix
Rooivalk. All rights reserved._

_Context improved by Giga AI_
