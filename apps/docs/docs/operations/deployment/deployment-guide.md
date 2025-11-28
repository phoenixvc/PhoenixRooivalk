---
id: deployment-guide
title: Phoenix Rooivalk Deployment Guide
sidebar_label: Phoenix Rooivalk Deployment
difficulty: intermediate
estimated_reading_time: 8
points: 15
tags:
  - operations
  - deployment
---

# Phoenix Rooivalk Deployment Guide

## Executive Summary

This guide provides comprehensive deployment procedures for the Phoenix Rooivalk
Counter-Drone Defense System. The system supports multiple deployment patterns
from laboratory testing to production field operations, with emphasis on
security, compliance, and operational resilience.

---

## Deployment Environments

### Environment Classifications

**Local Development**

- **Purpose**: Simulation and documentation preview
- **Hardware**: Development workstations and simulators
- **Network**: Isolated development networks
- **Security**: Basic security controls for development

**Lab/Staging**

- **Purpose**: Hardware-in-the-loop testing and controlled RF environments
- **Hardware**: Production-equivalent hardware in controlled environment
- **Network**: Isolated test networks with RF simulation
- **Security**: Production-level security controls

**Field Production**

- **Purpose**: Operational deployment with theater policies and governance
- **Hardware**: Production hardware in operational environment
- **Network**: Tactical networks with operational security
- **Security**: Full operational security controls

---

## Deployment Patterns

### Immutable Artifacts

**Software Bill of Materials (SBOM)**

- **Component Inventory**: Complete inventory of all software components
- **Version Pinning**: Specific versions of all dependencies
- **Vulnerability Scanning**: Security assessment of all components
- **Compliance**: ITAR and export control compliance

**Cryptographic Signatures**

- **Artifact Signing**: All artifacts signed with cryptographic keys
- **Chain of Trust**: Verifiable chain of trust from source to deployment
- **Integrity Verification**: Automatic verification of artifact integrity
- **Tamper Detection**: Detection of any unauthorized modifications

### Configuration Management

**Configuration-as-Data**

- **Environment Overlays**: Different configurations for different environments
- **Parameter Management**: Centralized management of configuration parameters
- **Version Control**: All configurations under version control
- **Validation**: Automated validation of configuration parameters

**Environment-Specific Settings**

- **Development**: Relaxed security for development efficiency
- **Staging**: Production-like security with test data
- **Production**: Full security controls with operational data
- **Compliance**: Environment-specific compliance requirements

### Deployment Strategies

**Blue/Green Deployment**

- **Zero Downtime**: Seamless deployment without service interruption
- **Rollback Capability**: Instant rollback to previous version
- **Testing**: Full testing of new version before cutover
- **Risk Mitigation**: Reduced risk of deployment failures

**Canary Deployment**

- **Gradual Rollout**: Gradual deployment to subset of systems
- **Performance Monitoring**: Real-time monitoring of deployment impact
- **Automatic Rollback**: Automatic rollback on performance degradation
- **Risk Management**: Limited impact of deployment issues

---

## Security Controls

### Access Control

**Documentation Site Access**

- **Authentication**: Password-based or SSO authentication
- **Authorization**: Role-based access control
- **Audit Logging**: Complete audit trail of access
- **Session Management**: Secure session management

**C2 Endpoint Security**

- **Network Security**: Secure network access controls
- **Authentication**: Multi-factor authentication for C2 access
- **Encryption**: End-to-end encryption for all communications
- **Monitoring**: Real-time monitoring of C2 access

### Audit and Compliance

**Audit Logging**

- **Comprehensive Logging**: All system activities logged
- **Immutable Logs**: Tamper-evident audit logs
- **Retention**: Long-term retention for compliance
- **Analysis**: Automated analysis of audit logs

**Version Pinning**

- **Mission Runs**: Specific versions pinned for mission runs
- **Reproducibility**: Identical deployments across environments
- **Traceability**: Complete traceability of deployed versions
- **Compliance**: Version control for regulatory compliance

### Secret Management

**Platform Vaults**

- **Centralized Storage**: All secrets stored in platform vaults
- **Encryption**: All secrets encrypted at rest and in transit
- **Access Control**: Role-based access to secrets
- **Rotation**: Automatic secret rotation

**No Secrets in Repository**

- **Security**: No secrets stored in code repository
- **Compliance**: ITAR and export control compliance
- **Best Practices**: Industry best practices for secret management
- **Audit**: Complete audit trail of secret access

### API and Proxy Security

**Header Normalization**

The Phoenix Rooivalk API uses `X-Forwarded-For` and `X-Real-IP` headers for
client IP identification (used in rate limiting). These headers can be spoofed
by untrusted clients, so proper infrastructure configuration is **required**:

- **Load Balancer Configuration**: Configure load balancers (ALB, NLB, NGINX,
  etc.) to strip incoming `X-Forwarded-For` and `X-Real-IP` headers from client
  requests
- **Header Injection**: Configure infrastructure to set these headers based on
  the actual TCP connection source IP
- **Trust Chain**: Only trust headers set by your own infrastructure, never
  headers passed through from clients

**NGINX Example Configuration**:

```nginx
# Strip client-supplied headers and set from real connection
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $remote_addr;
```

**AWS ALB Configuration**:

- ALB automatically sets `X-Forwarded-For` based on client connection
- Ensure no upstream proxies pass through untrusted headers

**Rate Limiting Considerations**:

- Without proper header normalization, malicious clients can bypass rate limits
- The API trusts the first IP in `X-Forwarded-For` as the client IP
- Ensure your infrastructure adds only one hop to the forwarding chain

### Database Backend Support

The Phoenix Rooivalk API supports multiple database backends for flexibility
across different deployment environments:

| Backend    | Unique Constraint Codes | Status      |
|------------|------------------------|-------------|
| SQLite     | 2067, 1555, 19         | Supported   |
| PostgreSQL | 23505                  | Supported   |
| MySQL      | 1062                   | Supported   |

**Database Error Handling**:

- Unique constraint violations are detected across all supported backends
- The system uses driver-specific error codes when available
- Message-based fallback detection is available for edge cases

**SQLite (Default)**:

```bash
# Development and testing
export API_DB_URL="sqlite://blockchain_outbox.sqlite3"
```

**PostgreSQL**:

```bash
# Production deployment
export API_DB_URL="postgres://user:password@host:5432/phoenix_db"
```

**MySQL**:

```bash
# Alternative production deployment
export API_DB_URL="mysql://user:password@host:3306/phoenix_db"
```

**Migration Notes**:

- The migration system automatically adapts to the configured backend
- Schema differences are handled at the SQL dialect level
- Test thoroughly when switching between backends in production

---

## Hardware Deployment

### NVIDIA Jetson Deployment

**Jetson AGX Orin 64GB**

- **Primary Processing**: 275 TOPS AI performance
- **Memory**: 32GB LPDDR5 unified memory
- **Storage**: 512GB NVMe SSD for evidence caching
- **Network**: Dual 10GbE for redundant connectivity
- **Power**: 60W typical, 100W peak consumption

**Jetson Orin NX 16GB**

- **Distributed Processing**: 157 TOPS for swarm coordination
- **Memory**: 16GB LPDDR5 unified memory
- **Storage**: 256GB NVMe SSD
- **Network**: Single 10GbE connection
- **Power**: 30W typical, 50W peak consumption

**Jetson Nano**

- **Lightweight Deployment**: 7W power consumption
- **Sensor Nodes**: Distributed sensor processing
- **Memory**: 4GB LPDDR4
- **Storage**: 32GB eMMC
- **Network**: WiFi and Ethernet connectivity

### Sensor Integration

**Camera Systems**

- **MIPI CSI-2**: Up to 6 cameras (16 via virtual channels)
- **Resolution**: 1080p-4K coverage
- **Frame Rate**: 30-60 FPS sustained processing
- **Integration**: Seamless integration with Jetson platform

**LiDAR Systems**

- **PCIe Gen4**: 22 lanes for LiDAR and radar sensors
- **Performance**: 42,000 measurements per second
- **Accuracy**: Sub-meter accuracy
- **Range**: 500m-2km depending on sensor modality

**RF Detection**

- **10GbE Networking**: High-speed RF detection arrays
- **Frequency Range**: 100MHz-6GHz
- **Protocol Analysis**: MAC address capture and signal analysis
- **Jamming Resistance**: Frequency hopping and adaptive filtering

**Acoustic Arrays**

- **I2S Interfaces**: 4 interfaces for acoustic sensor arrays
- **Frequency Range**: 50Hz-20kHz
- **Range**: 300-500m range detecting autonomous drones
- **Environmental**: Works in GPS-denied areas

---

## Network Architecture

### Local Area Network (LAN)

**High-Speed Connections**

- **10GbE**: High-speed connections between edge compute nodes
- **Redundancy**: Redundant paths for fault tolerance
- **QoS**: Quality of service prioritization for real-time traffic
- **Security**: Network segmentation and access controls

**Mesh Networking**

- **MANETs**: Mobile ad-hoc networks for drone coordination
- **Frequency Hopping**: Doodle Labs "Sense" technology
- **Range**: Over 50km with automatic network reconfiguration
- **Resilience**: Automatic failover and network healing

### Cloud Connectivity

**Azure Government Cloud**

- **DoD Impact Level 2-6**: FedRAMP High through classified Secret networks
- **SIPRNet Connectivity**: Exclusive US DoD regions
- **Physical Separation**: Separation from non-DoD tenants
- **DISA Authorization**: Provisional authorizations validated

**Edge-to-Cloud Architecture**

- **Azure Stack Edge**: Hardware-accelerated ML inferencing
- **Data Filtering**: Filter data before cloud transmission
- **Satellite Connectivity**: Low-earth orbit satellite connectivity
- **Zero-Touch Provisioning**: Automated device provisioning

---

## Software Deployment

### Operating System

**Ubuntu 20.04/22.04**

- **Base System**: Standard Ubuntu LTS
- **JetPack 5.1+**: NVIDIA Jetson software stack
- **Security Updates**: Regular security updates
- **Compliance**: ITAR and export control compliance

**RedHawk Linux RTOS**

- **Real-Time Performance**: Sub-5 microsecond event response
- **Processor Shielding**: Isolating real-time cores from Linux
- **Mission-Critical**: Deterministic performance for weapon control
- **Hardware Integration**: Direct hardware access for real-time control

### Middleware and Frameworks

**ROS 2 Humble**

- **Middleware**: Robot Operating System for distributed systems
- **Isaac ROS**: CUDA-accelerated perception packages
- **NITROS Transport**: Zero-copy data transport
- **Micro-ROS**: Distributed processing with MCUs

**TensorRT Optimization**

- **Inference Acceleration**: 8-10x speedup over standard inference
- **Model Optimization**: Optimized models for edge deployment
- **Performance**: Real-time inference on edge devices
- **Compatibility**: NVIDIA GPU acceleration

**DeepStream 3D**

- **Sensor Fusion**: Heterogeneous data integration
- **Temporal Synchronization**: Multi-sensor data synchronization
- **Calibration**: Automatic sensor calibration
- **Visualization**: Multi-view visualization capabilities

---

## Configuration Management

### Environment Configuration

**Development Environment**

- **Relaxed Security**: Development-friendly security settings
- **Debug Mode**: Enhanced logging and debugging
- **Test Data**: Synthetic test data for development
- **Local Storage**: Local evidence storage for testing

**Staging Environment**

- **Production-Like**: Production-equivalent security
- **Test Data**: Realistic test data
- **Performance Testing**: Load testing and performance validation
- **Integration Testing**: End-to-end system testing

**Production Environment**

- **Full Security**: Complete security controls
- **Operational Data**: Real operational data
- **Compliance**: Full regulatory compliance
- **Monitoring**: Comprehensive monitoring and alerting

### Parameter Management

**System Parameters**

- **Detection Thresholds**: Configurable detection parameters
- **Response Times**: Adjustable response time requirements
- **Resource Limits**: System resource allocation
- **Performance Tuning**: Performance optimization parameters

**Security Parameters**

- **Authentication**: Authentication method configuration
- **Encryption**: Encryption algorithm selection
- **Access Control**: Role-based access control settings
- **Audit Logging**: Audit log configuration

---

## Monitoring and Observability

### System Monitoring

**Performance Metrics**

- **CPU Utilization**: Real-time CPU usage monitoring
- **Memory Usage**: Memory consumption tracking
- **Network Performance**: Network latency and throughput
- **Storage Usage**: Disk space and I/O performance

**Sensor Health**

- **Sensor Status**: Real-time sensor health monitoring
- **Calibration**: Automatic calibration status
- **Performance**: Sensor performance metrics
- **Failures**: Sensor failure detection and alerting

### Business Metrics

**Operational Metrics**

- **Threats Detected**: Number of threats detected
- **Response Time**: Average response time
- **Accuracy**: Detection accuracy rates
- **False Positives**: False positive rates

**System Metrics**

- **Uptime**: System availability
- **Performance**: System performance metrics
- **Errors**: Error rates and types
- **Capacity**: System capacity utilization

### Alerting and Notifications

**Alert Rules**

- **Performance Thresholds**: Alert on performance degradation
- **Security Events**: Alert on security incidents
- **System Health**: Alert on system health issues
- **Business Metrics**: Alert on business metric anomalies

**Notification Channels**

- **Email**: Email notifications for critical alerts
- **SMS**: SMS notifications for urgent issues
- **Slack/Teams**: Team communication channels
- **PagerDuty**: On-call escalation for critical issues

---

## Maintenance and Updates

### Software Updates

**Update Process**

- **Testing**: Comprehensive testing in staging environment
- **Validation**: Validation of update compatibility
- **Deployment**: Blue/green or canary deployment
- **Rollback**: Automatic rollback on failure

**Security Updates**

- **Critical Updates**: Immediate deployment of critical security updates
- **Regular Updates**: Scheduled deployment of regular updates
- **Vulnerability Scanning**: Continuous vulnerability scanning
- **Patch Management**: Automated patch management

### Hardware Maintenance

**Preventive Maintenance**

- **Scheduled Maintenance**: Regular scheduled maintenance
- **Component Replacement**: Proactive component replacement
- **Calibration**: Regular sensor calibration
- **Performance Optimization**: Continuous performance optimization

**Reactive Maintenance**

- **Failure Response**: Rapid response to hardware failures
- **Component Replacement**: Quick component replacement
- **System Recovery**: Fast system recovery procedures
- **Documentation**: Complete documentation of maintenance activities

---

## Troubleshooting

### Common Issues

**Performance Issues**

- **Resource Constraints**: CPU, memory, or storage limitations
- **Network Latency**: Network performance issues
- **Sensor Problems**: Sensor calibration or hardware issues
- **Software Bugs**: Application or system software issues

**Security Issues**

- **Authentication Failures**: Login or access problems
- **Network Security**: Network security incidents
- **Data Integrity**: Data corruption or tampering
- **Compliance**: Regulatory compliance issues

### Diagnostic Procedures

**System Diagnostics**

- **Health Checks**: Comprehensive system health checks
- **Performance Analysis**: Detailed performance analysis
- **Log Analysis**: Analysis of system and application logs
- **Network Diagnostics**: Network connectivity and performance testing

**Sensor Diagnostics**

- **Calibration Checks**: Sensor calibration verification
- **Hardware Tests**: Hardware functionality testing
- **Performance Tests**: Sensor performance testing
- **Integration Tests**: Sensor integration testing

---

## Conclusion

The Phoenix Rooivalk deployment guide provides comprehensive procedures for
deploying the counter-drone defense system across multiple environments. The
guide emphasizes security, compliance, and operational resilience while
maintaining the highest standards of performance and reliability.

Key deployment features include:

- **Multi-Environment Support**: Development, staging, and production
  environments
- **Security Controls**: Comprehensive security and access controls
- **Hardware Integration**: NVIDIA Jetson platform with multi-sensor support
- **Network Architecture**: Resilient mesh networking with cloud connectivity
- **Monitoring**: Comprehensive monitoring and observability
- **Maintenance**: Proactive maintenance and update procedures

The deployment architecture ensures operational effectiveness across the full
spectrum of defense scenarios while maintaining the highest standards of
security, compliance, and performance.

---

_This document contains confidential deployment information. Distribution is
restricted to authorized personnel only. © 2025 Phoenix Rooivalk. All rights
reserved._
