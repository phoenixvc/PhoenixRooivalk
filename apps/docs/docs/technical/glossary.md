---
id: glossary
title: Glossary
sidebar_label: Glossary
---

## Executive Summary

This glossary provides comprehensive definitions of technical terms, acronyms,
and concepts used throughout the Phoenix Rooivalk Counter-Drone Defense System
documentation. The glossary serves as a reference for technical evaluators,
engineers, and system integrators.

---

## Operations and Concepts

**BLOS (Beyond Line of Sight)**

- Operations where direct visual or RF line of sight between controller and
  aircraft is not maintained
- Typically relies on relays or autonomous control
- Critical for extended range operations and swarm coordination

**C2 (Command and Control)**

- Interfaces and services used to task, monitor, and coordinate system
  components and effectors
- Includes STANAG 4586 compliance for standardized UAS control
- Supports both manned and unmanned command structures

**Counter-UAS / C-UAS**

- Systems designed to detect, identify, track, and neutralize unauthorized or
  hostile drones
- Includes both kinetic and non-kinetic countermeasures
- Supports multiple threat classifications and response protocols

**DEW (Directed Energy Weapon)**

- Non-kinetic effectors that use focused energy (e.g., lasers) to disrupt or
  disable targets
- Includes laser dazzlers, high-energy lasers, and microwave weapons
- Provides precision engagement with minimal collateral damage

**Edge Computing**

- Processing data at or near the sensor/source to reduce latency and reliance on
  backhaul connectivity
- Critical for sub-200ms response times in counter-drone operations
- Enables autonomous operation in GPS-denied and EW-contested environments

**SAE J3016**

- Society of Automotive Engineers standard defining levels of driving automation
  (0-5)
- Adapted for Counter-UAS systems: Level 0 (no automation) to Level 5 (full
  automation)
- Phoenix Rooivalk implements SAE Level 4 (high automation) for autonomous
  counter-drone operations
- Provides industry-standard framework for autonomy level classification

**EW (Electronic Warfare)**

- Military use of the electromagnetic spectrum to sense, protect, and attack
- Includes jamming, deception, and electronic attack capabilities
- Essential for operations in contested electromagnetic environments

**Fiber Control (Tethered/Spool)**

- Jam-resistant command link over optical fiber, avoiding RF denial environments
- Provides secure communication in high-threat environments
- Enables extended range operations with reduced vulnerability

**ISR (Intelligence, Surveillance, Reconnaissance)**

- Sensing and data fusion activities to build situational awareness
- Includes multi-sensor data collection and analysis
- Supports threat assessment and mission planning

**Swarm**

- Coordinated operation of multiple drones to achieve emergent effects
- Includes distributed sensing, coordinated attack, and formation flying
- Enables scalable operations with graceful degradation

**VTOL (Vertical Take-Off and Landing)**

- Aircraft capable of vertical take-off, hover, and landing without a runway
- Essential for operations in confined spaces and urban environments
- Supports rapid deployment and recovery operations

**Kill Chain (Detect-Identify-Decide-Act)**

- Operational sequence guiding engagement actions
- Details vary by mission and policy requirements
- Includes human-in-the-loop requirements for kinetic actions

**Geofencing**

- Virtual boundaries enforced by navigation logic to restrict or alert on
  movement into no-go areas
- Supports mission planning and safety requirements
- Enables automated compliance with operational restrictions

**Remote ID / Blue-Force ID**

- Broadcast identification and status for compliant or friendly drones
- Aids in deconfliction and friendly force identification
- Supports integration with existing air traffic management systems

---

## Messaging and Observability

**gRPC**

- High-performance, HTTP/2-based RPC framework used for control plane
  communications
- Provides efficient serialization and streaming capabilities
- Supports both synchronous and asynchronous communication patterns

**Protobuf (Protocol Buffers)**

- Language-neutral, platform-neutral serialization format
- Used for efficient data exchange between system components
- Supports schema evolution and backward compatibility

**WebSocket**

- Real-time, bidirectional communication protocol
- Used for live telemetry and command streaming
- Supports low-latency communication for time-critical operations

**MQTT**

- Lightweight messaging protocol for IoT devices
- Used for sensor data collection and device management
- Supports quality of service levels and message persistence

**Prometheus**

- Open-source monitoring and alerting toolkit
- Used for metrics collection and system monitoring
- Supports time-series data and complex queries

**Grafana**

- Open-source analytics and monitoring platform
- Used for visualization of system metrics and performance data
- Supports real-time dashboards and alerting

**Jaeger**

- Open-source distributed tracing system
- Used for request flow analysis and performance optimization
- Supports microservices architecture and complex request flows

---

## Communications and Electronic Warfare

**MANET (Mobile Ad-Hoc Network)**

- Self-configuring network of mobile devices
- Supports dynamic topology changes and automatic routing
- Essential for swarm operations and distributed systems

**LPI/LPD (Low Probability of Intercept/Detection)**

- Communication techniques that minimize detection by adversaries
- Includes frequency hopping, spread spectrum, and directional antennas
- Critical for operations in contested environments

**Frequency Hopping**

- Rapid switching between different frequencies during transmission
- Provides resistance to jamming and interception
- Supports secure communication in hostile environments

**Adaptive Filtering**

- Dynamic adjustment of signal processing parameters
- Responds to changing environmental conditions and threats
- Maintains performance in complex electromagnetic environments

**Jamming Resistance**

- Ability to maintain communication despite intentional interference
- Includes multiple frequency bands and adaptive techniques
- Essential for operations in electronic warfare environments

**Spectrum Analysis**

- Analysis of electromagnetic spectrum to identify and characterize signals
- Supports threat detection and signal intelligence
- Enables identification of hostile communication systems

---

## Navigation and PNT

**PNT (Positioning, Navigation, and Timing)**

- Integrated system providing position, navigation, and timing information
- Includes GPS, inertial navigation, and other positioning systems
- Critical for autonomous operations and precision engagement

**GNSS (Global Navigation Satellite System)**

- Global positioning system including GPS, GLONASS, Galileo, and BeiDou
- Provides worldwide positioning and timing services
- Supports multi-constellation positioning for improved accuracy

**INS (Inertial Navigation System)**

- Self-contained navigation system using accelerometers and gyroscopes
- Provides continuous navigation without external references
- Essential for operations in GPS-denied environments

**SLAM (Simultaneous Localization and Mapping)**

- Technique for mapping unknown environments while tracking location
- Supports autonomous navigation in GPS-denied environments
- Enables operations in complex terrain and urban environments

**VIO (Visual-Inertial Odometry)**

- Navigation technique combining visual and inertial sensors
- Provides accurate positioning without GPS
- Supports operations in GPS-denied and indoor environments

**Terrain-Aided Navigation**

- Navigation technique using terrain features for positioning
- Provides backup navigation when GPS is unavailable
- Supports operations in challenging terrain and weather conditions

**Dead Reckoning**

- Navigation technique using previous position and movement data
- Provides continuous navigation during GPS outages
- Essential for maintaining position accuracy in challenging environments

---

## System Components

**NVIDIA Jetson**

- Edge AI computing platform for autonomous systems
- Includes Jetson AGX Orin, Orin NX, and Nano variants
- Provides high-performance AI processing at the edge

**TensorRT**

- NVIDIA's inference optimization library
- Provides 2-10x speedup over standard inference
- Optimizes models for edge deployment and real-time processing

**DeepStream**

- NVIDIA's video analytics framework
- Supports multi-sensor data fusion and real-time processing
- Enables comprehensive sensor integration and analysis

**ROS 2 (Robot Operating System)**

- Middleware for distributed robotic systems
- Supports modular architecture and component integration
- Enables scalable system development and deployment

**RedHawk Linux**

- Real-time operating system for mission-critical applications
- Provides deterministic performance and low-latency response
- Supports hard real-time requirements for weapon control

**YOLOv9**

- Object detection algorithm optimized for real-time performance
- Provides 65.2% mAP with 30+ FPS on Jetson platforms
- Supports multi-class object detection and tracking

---

## Neutralization and Countermeasures

**Soft Kill**

- Non-destructive countermeasures including jamming and spoofing
- Provides reversible neutralization with minimal collateral damage
- Includes RF jamming, GPS spoofing, and communication disruption

**Hard Kill**

- Destructive countermeasures including kinetic interceptors
- Provides permanent neutralization of threats
- Includes missiles, projectiles, and directed energy weapons

**RF Jamming**

- Disruption of radio frequency communications
- Prevents drone control and data transmission
- Includes broadband and targeted jamming techniques

**GPS Spoofing**

- Transmission of false GPS signals to mislead navigation systems
- Causes drones to lose position or follow false trajectories
- Provides non-destructive neutralization of GPS-dependent threats

**Acoustic Detection**

- Detection of drones using acoustic signatures
- Identifies rotor noise and engine sounds
- Supports detection in GPS-denied and RF-silent environments

**LiDAR Detection**

- Detection using light detection and ranging sensors
- Provides high-resolution 3D imaging and tracking
- Supports detection in various weather and lighting conditions

**Radar Detection**

- Detection using radio frequency radar systems
- Provides long-range detection and tracking
- Supports detection in various weather conditions

**EO/IR Detection**

- Detection using electro-optical and infrared sensors
- Provides visual identification and tracking
- Supports day/night operations and weather conditions

---

## Blockchain and Evidence

**Solana**

- High-performance blockchain platform for evidence anchoring
- Provides 65,000-100,000 TPS with sub-400ms finality
- Supports cost-effective evidence anchoring at $0.00025 per transaction

**Evidence Anchoring**

- Process of storing evidence on blockchain for legal admissibility
- Provides tamper-evident storage with cryptographic proof
- Supports court-admissible evidence with chain of custody

**Hash Chain**

- Cryptographic linking of evidence records
- Provides tamper detection and integrity verification
- Supports legal admissibility and audit requirements

**Merkle Tree**

- Data structure for efficient verification of large datasets
- Enables verification of individual records without full dataset
- Supports scalable evidence verification and audit

**Proof of History**

- Solana's consensus mechanism for timestamping
- Provides cryptographically verifiable timestamps
- Supports audit trails and legal admissibility

**Smart Contracts**

- Self-executing contracts with terms directly written into code
- Automates evidence processing and verification
- Supports automated compliance and audit requirements

---

## AI and Machine Learning

**AI/ML (Artificial Intelligence/Machine Learning)**

- Technologies enabling autonomous decision-making and pattern recognition
- Supports threat detection, classification, and response
- Enables adaptive behavior and continuous learning

**Neural Networks**

- Computing systems inspired by biological neural networks
- Supports complex pattern recognition and decision-making
- Enables adaptive behavior and learning from experience

**Deep Learning**

- Machine learning technique using multiple layers of neural networks
- Supports complex pattern recognition and feature extraction
- Enables advanced AI capabilities for threat detection

**Computer Vision**

- AI technology for analyzing and understanding visual information
- Supports object detection, tracking, and classification
- Enables autonomous navigation and threat identification

**Natural Language Processing**

- AI technology for understanding and processing human language
- Supports voice commands and text analysis
- Enables human-machine interaction and communication

**Reinforcement Learning**

- Machine learning technique for learning through interaction
- Supports adaptive behavior and decision-making
- Enables continuous improvement and optimization

---

## Security and Compliance

**ITAR (International Traffic in Arms Regulations)**

- US regulations controlling export of defense-related technology
- Requires registration and compliance for defense contractors
- Affects system design, documentation, and export controls

**DoD (Department of Defense)**

- US Department of Defense and its regulations and requirements
- Includes security clearance requirements and compliance standards
- Affects system design, deployment, and operational procedures

**FedRAMP (Federal Risk and Authorization Management Program)**

- US government program for cloud security assessment
- Required for government cloud deployments
- Affects cloud architecture and security requirements

**CMMC (Cybersecurity Maturity Model Certification)**

- US Department of Defense cybersecurity framework
- Required for defense contractors and suppliers
- Affects security architecture and compliance requirements

**NIST (National Institute of Standards and Technology)**

- US government agency developing cybersecurity standards
- Provides frameworks for security and compliance
- Affects system design and security requirements

**Zero Trust**

- Security model requiring verification for all access requests
- Assumes no implicit trust based on location or network
- Affects system architecture and security design

---

## Performance and Metrics

**TOPS (Tera Operations Per Second)**

- Measure of AI processing performance
- Jetson AGX Orin provides 275 TOPS
- Critical for real-time AI processing requirements

**FPS (Frames Per Second)**

- Measure of video processing performance
- YOLOv9 provides 30+ FPS on Jetson Nano, 60+ FPS on Orin platforms
- Critical for real-time video analysis and processing

**mAP (mean Average Precision)**

- Measure of object detection accuracy
- YOLOv9 provides 65.2% mAP
- Critical for threat detection accuracy and reliability

**Latency**

- Time delay between input and output
- Target <200ms for counter-drone operations
- Critical for real-time response and threat neutralization

**Throughput**

- Rate of data processing or transmission
- Solana provides 65,000-100,000 TPS
- Critical for high-volume data processing and evidence anchoring

**Uptime**

- Percentage of time system is operational
- Target 99.9% uptime for critical operations
- Critical for mission success and operational effectiveness

---

## Conclusion

This glossary provides comprehensive definitions of technical terms and concepts
used throughout the Phoenix Rooivalk system. The glossary serves as a reference
for technical evaluators, engineers, and system integrators, ensuring consistent
understanding of system capabilities and requirements.

Key areas covered include:

- **Operations and Concepts**: Core operational terminology and concepts
- **Messaging and Observability**: Communication and monitoring technologies
- **Communications and EW**: Electronic warfare and communication systems
- **Navigation and PNT**: Positioning, navigation, and timing systems
- **System Components**: Hardware and software components
- **Neutralization and Countermeasures**: Threat neutralization technologies
- **Blockchain and Evidence**: Evidence anchoring and legal compliance
- **AI and Machine Learning**: Artificial intelligence and machine learning
  technologies
- **Security and Compliance**: Security frameworks and compliance requirements
- **Performance and Metrics**: Performance measures and system capabilities

The glossary ensures consistent understanding of technical concepts and supports
effective communication between technical teams, stakeholders, and system
integrators.

---

_This document contains confidential technical information. Distribution is
restricted to authorized personnel only. © 2025 Phoenix Rooivalk. All rights
reserved._
