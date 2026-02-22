---
id: architecture-decision-records
title: Architecture Decision Records
sidebar_label: Architecture Decision Records
difficulty: expert
estimated_reading_time: 11
points: 50
tags:
  - technical
  - architecture
  - counter-uas
prerequisites:
  - system-overview
---

## Executive Summary

This document contains the Architecture Decision Records (ADRs) for the Phoenix
Rooivalk Counter-Drone Defense System. These records document key architectural
decisions, rationale, and consequences to ensure consistent decision-making and
knowledge preservation.

---

## ADR 0001: Chain Selection for On-Chain Anchoring (Solana vs Others)

**Date**: 2025-09-24  
**Status**: Accepted (pilot on Solana)

### Context

We need a Layer 1 anchoring target for tamper-evident hashes of mission
evidence. Criteria include security, latency, cost, resilience,
interoperability, and operational fit for contested environments.

### Options Considered

- **Ethereum (L1)**: High security but high fees and slow finality
- **Solana (L1)**: High throughput with low latency and low fees
- **Avalanche (L1/Subnets)**: Good performance with subnet capabilities
- **Polkadot (Relay + Parachains)**: Interoperability focus with complex
  architecture
- **Bitcoin (L1)**: Highest security but slow and expensive

### Decision

Adopt Solana as the initial pilot chain for anchoring evidence digests.

### Rationale

- **Low-Latency Finality**: High throughput supports near-real-time anchoring
  for dynamic operations
- **Low Fees**: Enable frequent anchoring without prohibitive cost
- **Mature Memo Program**: Simple, contract-free anchoring path
- **Ecosystem Tooling**: Sufficient tooling for pilot implementation
  (solana-py/solders)
- **Performance**: 3,000-4,500 TPS with sub-2-second finality
- **Cost Efficiency**: $0.00025 per transaction

### Consequences

- **Resilience Monitoring**: Must monitor resilience during high network load
- **Retry/Backoff**: Add retry/backoff and outbox batching for reliability
- **Compliance Anchoring**: May implement periodic Ethereum anchoring for
  compliance/archival
- **Classified Deployments**: Subnet/private chain options (e.g., Avalanche) for
  classified deployments

### Implementation

- **Solana Anchor**: Implementation using Solana Anchor framework
- **Blockchain Handler**: API specifications for blockchain integration
- **Operations**: Solana on-chain anchoring pilot implementation

---

## ADR 0002: Solana Memo vs Smart Contract Approach

**Date**: 2025-09-24  
**Status**: Accepted (Memo approach)

### Context

Need to decide between using Solana's Memo program for simple data anchoring
versus deploying custom smart contracts for evidence anchoring.

### Options Considered

- **Memo Program**: Simple, built-in program for data anchoring
- **Smart Contracts**: Custom smart contracts with complex logic
- **Hybrid Approach**: Combination of both approaches

### Decision

Use Solana Memo program for initial implementation with option to upgrade to
smart contracts.

### Rationale

- **Simplicity**: Memo program provides simple, reliable data anchoring
- **Cost Efficiency**: Lower transaction costs with Memo program
- **Speed**: Faster transaction processing with Memo program
- **Flexibility**: Easy to upgrade to smart contracts if needed
- **Compliance**: Sufficient for legal admissibility requirements

### Consequences

- **Limited Logic**: Memo program has limited programmability
- **Upgrade Path**: Clear upgrade path to smart contracts if needed
- **Cost Savings**: Significant cost savings with Memo approach
- **Implementation Speed**: Faster implementation with Memo program

---

## ADR 0003: SAE Level 4 Autonomy Adoption Strategy

**Date**: 2025-09-24  
**Status**: Accepted (SAE Level 4 autonomy)

### Context

Need to determine the level of autonomy for the counter-drone system, balancing
operational effectiveness with safety and compliance requirements.

### Options Considered

- **SAE Level 4 Autonomy**: High automation within a defined Operational Design
  Domain (ODD); capable of performing all driving tasks without human
  intervention while inside the ODD, but may require fallback or limited
  operation outside it.
- **SAE Level 3 Autonomy**: Conditional automation with human fallback
- **SAE Level 2 Autonomy**: Partial automation with human monitoring
- **SAE Level 1 Autonomy**: Driver assistance with human control
- **Hybrid Approach**: Different autonomy levels for different scenarios

### Decision

Implement SAE Level 4 autonomy with comprehensive safety and compliance
frameworks.

### Rationale

- **Operational Effectiveness**: SAE Level 4 autonomy provides maximum
  operational effectiveness
- **Response Time**: Sub-200ms response time requires autonomous operation
- **GPS-Denied Environments**: Autonomous operation essential for GPS-denied
  environments
- **Safety Framework**: Comprehensive safety framework ensures safe operation
- **Compliance**: Full compliance with DoD Directive 3000.09
- **Industry Standard**: SAE J3016 standard provides clear autonomy level
  definitions

### Consequences

- **Safety Requirements**: Comprehensive safety framework required
- **Compliance**: Full compliance with autonomous weapons policies
- **Testing**: Extensive testing and validation required
- **Documentation**: Comprehensive documentation of safety measures
- **SAE J3016 Compliance**: Must adhere to SAE J3016 standard definitions
- **Industry Alignment**: Aligns with automotive and aerospace autonomy
  standards

---

## ADR 0004: Layered Strategy (L1/L2/L3)

**Date**: 2025-09-24  
**Status**: Accepted (Layered approach)

### Context

Need to determine the blockchain architecture strategy, considering Layer 1,
Layer 2, and Layer 3 solutions for different use cases and requirements.

### Options Considered

- **L1 Only**: Single Layer 1 solution
- **L2 Solutions**: Layer 2 solutions for scaling
- **L3 Solutions**: Layer 3 solutions for specific use cases
- **Layered Approach**: Combination of L1/L2/L3 solutions

### Decision

Implement layered strategy with L1 anchoring, L2 scaling, and L3 applications.

### Rationale

- **Scalability**: L2 solutions provide scalability for high-volume operations
- **Cost Efficiency**: L2 solutions reduce transaction costs
- **Flexibility**: L3 solutions provide flexibility for specific use cases
- **Security**: L1 provides security and finality
- **Performance**: L2 provides performance and throughput

### Consequences

- **Complexity**: Increased complexity with layered approach
- **Integration**: Complex integration between layers
- **Maintenance**: Increased maintenance requirements
- **Performance**: Improved performance and scalability

---

## ADR 0005: Sensor Integration Architecture

**Date**: 2025-09-24  
**Status**: Accepted (Multi-sensor fusion)

### Context

Need to determine the sensor integration architecture for multi-modal threat
detection and classification.

### Options Considered

- **Single Sensor**: Single sensor type for detection
- **Multi-Sensor**: Multiple sensor types for detection
- **Sensor Fusion**: Advanced sensor fusion for detection
- **Hybrid Approach**: Combination of approaches

### Decision

Implement multi-sensor fusion architecture with advanced sensor integration.

### Rationale

- **Accuracy**: Multi-sensor fusion improves detection accuracy
- **Robustness**: Multiple sensors provide robustness and redundancy
- **False Positive Reduction**: Multi-sensor validation reduces false positives
- **Environmental Adaptation**: Better performance across diverse environments

### Consequences

- **Complexity**: Increased complexity with multi-sensor integration
- **Calibration**: Complex sensor calibration and synchronization
- **Processing**: Increased processing requirements
- **Performance**: Improved detection performance and accuracy

---

## ADR 0006: AI/ML Architecture

**Date**: 2025-09-24  
**Status**: Accepted (Edge AI with cloud backup)

### Context

Need to determine the AI/ML architecture for threat detection, classification,
and response.

### Options Considered

- **Edge AI Only**: All AI processing at edge
- **Cloud AI Only**: All AI processing in cloud
- **Hybrid Approach**: Edge AI with cloud backup
- **Distributed AI**: Distributed AI across multiple nodes

### Decision

Implement edge AI with cloud backup and distributed learning capabilities.

### Rationale

- **Latency**: Edge AI provides low-latency processing
- **Autonomy**: Edge AI enables autonomous operation
- **Scalability**: Cloud backup provides scalability
- **Learning**: Distributed learning improves performance

### Consequences

- **Complexity**: Increased complexity with hybrid approach
- **Integration**: Complex integration between edge and cloud
- **Data Management**: Complex data management requirements
- **Performance**: Improved performance and capabilities

---

## ADR 0007: Security Architecture

**Date**: 2025-09-24  
**Status**: Accepted (Zero-trust security)

### Context

Need to determine the security architecture for the counter-drone system,
considering threats, vulnerabilities, and compliance requirements.

### Options Considered

- **Traditional Security**: Traditional security approaches
- **Zero-Trust Security**: Zero-trust security model
- **Defense in Depth**: Multiple layers of security
- **Hybrid Approach**: Combination of security approaches

### Decision

Implement zero-trust security architecture with defense in depth.

### Rationale

- **Threat Landscape**: Zero-trust addresses modern threat landscape
- **Compliance**: Meets compliance requirements
- **Security**: Provides comprehensive security coverage
- **Flexibility**: Adaptable to changing threats

### Consequences

- **Complexity**: Increased complexity with zero-trust
- **Implementation**: Complex implementation requirements
- **Maintenance**: Increased maintenance requirements
- **Security**: Improved security posture

---

## ADR 0008: Compliance Architecture

**Date**: 2025-09-24  
**Status**: Accepted (Comprehensive compliance)

### Context

Need to determine the compliance architecture for regulatory requirements,
including ITAR, DoD, and international standards.

### Options Considered

- **Basic Compliance**: Basic compliance requirements
- **Comprehensive Compliance**: Comprehensive compliance framework
- **Automated Compliance**: Automated compliance monitoring
- **Hybrid Approach**: Combination of compliance approaches

### Decision

Implement comprehensive compliance architecture with automated monitoring.

### Rationale

- **Regulatory Requirements**: Meets all regulatory requirements
- **Risk Mitigation**: Reduces compliance risks
- **Automation**: Automated compliance monitoring
- **Documentation**: Comprehensive compliance documentation

### Consequences

- **Complexity**: Increased complexity with comprehensive compliance
- **Cost**: Increased compliance costs
- **Maintenance**: Increased maintenance requirements
- **Compliance**: Improved compliance posture

---

## ADR 0009: Integration Architecture

**Date**: 2025-09-24  
**Status**: Accepted (API-first integration)

### Context

Need to determine the integration architecture for third-party systems, cloud
platforms, and external services.

### Options Considered

- **Custom Integration**: Custom integration approaches
- **API-First Integration**: API-first integration approach
- **Middleware Integration**: Middleware-based integration
- **Hybrid Approach**: Combination of integration approaches

### Decision

Implement API-first integration architecture with comprehensive API support.

### Rationale

- **Flexibility**: API-first provides flexibility and scalability
- **Standardization**: Standardized integration approaches
- **Compatibility**: Better compatibility with existing systems
- **Maintenance**: Easier maintenance and updates

### Consequences

- **Complexity**: Increased complexity with API-first approach
- **Development**: Increased development requirements
- **Documentation**: Comprehensive API documentation required
- **Integration**: Improved integration capabilities

---

## ADR 0010: Performance Architecture

**Date**: 2025-09-24  
**Status**: Accepted (High-performance architecture)

### Context

Need to determine the performance architecture for the counter-drone system,
considering latency, throughput, and scalability requirements.

### Options Considered

- **Standard Performance**: Standard performance requirements
- **High Performance**: High-performance requirements
- **Scalable Performance**: Scalable performance architecture
- **Hybrid Approach**: Combination of performance approaches

### Decision

Implement high-performance architecture with scalable performance capabilities.

### Rationale

- **Operational Requirements**: Meets operational performance requirements
- **Competitive Advantage**: Provides competitive performance advantages
- **Scalability**: Scalable performance architecture
- **Future-Proofing**: Future-proof performance architecture

### Consequences

- **Complexity**: Increased complexity with high-performance architecture
- **Cost**: Increased development and implementation costs
- **Maintenance**: Increased maintenance requirements
- **Performance**: Improved performance and capabilities

---

## Conclusion

The Architecture Decision Records provide a comprehensive record of key
architectural decisions for the Phoenix Rooivalk system. These decisions ensure
consistent architecture, knowledge preservation, and informed decision-making
throughout the system development and deployment.

Key architectural decisions include:

- **Blockchain**: Solana for evidence anchoring with layered architecture
- **Autonomy**: SAE Level 4 autonomy with comprehensive safety frameworks
- **Sensors**: Multi-sensor fusion for improved detection accuracy
- **AI/ML**: Edge AI with cloud backup and distributed learning
- **Security**: Zero-trust security with defense in depth
- **Compliance**: Comprehensive compliance with automated monitoring
- **Integration**: API-first integration with comprehensive support
- **Performance**: High-performance architecture with scalability

These decisions provide the foundation for a robust, scalable, and effective
counter-drone defense system that meets all operational, regulatory, and
performance requirements.

---

## Development Architecture Decisions

The following ADRs document technical implementation decisions for the
development infrastructure and tooling.

> **Note**: ADRs D001–D009 below are inline stubs documenting the original
> decision rationale. They lack the full options analysis, consequences, and
> implementation sections required by the
> [ADR-0000 template](./adr-0000-template-and-guide.md). These should be
> expanded into standalone ADR files as capacity allows. See the
> [AGENT_BACKLOG.md](../../../../AGENT_BACKLOG.md) Wave 6 backlog for tracking.

---

### ADR-D001: Monorepo Structure with Turborepo

**Date**: 2024-01-15 **Status**: Accepted

#### Context

Need to manage multiple applications (marketing, docs, API, keeper) and shared
packages efficiently.

#### Decision

Use a monorepo structure with Turborepo for build orchestration and pnpm for
package management.

#### Rationale

- **Code Sharing**: Shared types, UI components, and utilities across apps
- **Atomic Changes**: Single PR can update multiple apps simultaneously
- **Build Performance**: Turborepo provides intelligent caching and parallel
  execution
- **Developer Experience**: Single `pnpm install`, unified tooling configuration

#### Consequences

**Positive:**

- Simplified dependency management
- Faster CI/CD with smart caching
- Easier refactoring across packages
- Consistent tooling and linting

**Negative:**

- Larger repository size
- More complex CI/CD configuration
- Learning curve for monorepo patterns

---

### ADR-D002: Dual Blockchain Anchoring (Solana + EtherLink)

**Date**: 2024-01-20 **Status**: Accepted

#### Context

Need tamper-proof evidence trail for military compliance and legal
defensibility.

#### Decision

Implement dual-chain anchoring to both Solana and EtherLink blockchains.

#### Rationale

- **Redundancy**: Multiple chains provide backup if one fails
- **Speed vs Cost**: Solana for fast confirmations, EtherLink for Ethereum
  ecosystem
- **Legal Compliance**: Multiple independent witnesses strengthen legal validity
- **Cross-Chain Verification**: Independent verification from different
  consensus mechanisms

#### Consequences

**Positive:**

- Enhanced tamper-resistance
- Geographic and technical diversity
- Compliance with multiple regulatory frameworks

**Negative:**

- Increased operational complexity
- Higher anchoring costs
- More complex verification logic

---

### ADR-D003: Rust for Backend Services

**Date**: 2024-01-22 **Status**: Accepted

#### Context

Need high-performance, secure backend services for API, keeper, and CLI tools.

#### Decision

Use Rust with Axum for all backend services and command-line tools.

#### Rationale

- **Memory Safety**: Eliminates entire classes of security vulnerabilities
- **Performance**: Near C/C++ performance for blockchain operations
- **Concurrency**: Tokio async runtime for high-throughput I/O
- **Type Safety**: Compile-time guarantees reduce runtime errors
- **Cryptography**: Strong ecosystem for cryptographic operations

#### Technology Stack

- **Web Framework**: Axum 0.8
- **Async Runtime**: Tokio 1.48
- **Database**: SQLx with SQLite
- **Serialization**: serde with serde_json

---

### ADR-D004: Next.js for Marketing Site

**Date**: 2024-01-25 **Status**: Accepted

#### Context

Need modern, performant marketing website with SEO optimization.

#### Decision

Use Next.js 14 with static export for the marketing website.

#### Rationale

- **SEO**: Server-side rendering and static generation for search engines
- **Performance**: Automatic code splitting and optimization
- **Developer Experience**: Hot reload, TypeScript support, file-based routing
- **Deployment**: Static export works with any hosting (Netlify, Vercel, S3)

---

### ADR-D005: SQLite for Outbox Pattern

**Date**: 2024-02-01 **Status**: Accepted

#### Context

Need reliable outbox pattern for queuing blockchain anchoring jobs.

#### Decision

Use SQLite with SQLx for the blockchain outbox pattern.

#### Rationale

- **Simplicity**: No separate database server required
- **ACID Transactions**: Full transactional support
- **Portability**: Single file, easy backup and migration
- **Performance**: Sufficient for single-instance keeper service

---

### ADR-D006: WASM Threat Simulator with Leptos

**Date**: 2024-02-10 **Status**: Accepted

#### Context

Need high-performance threat simulation that runs in the browser.

#### Decision

Build threat simulator in Rust with Leptos, compile to WebAssembly.

#### Rationale

- **Performance**: Native-speed computation for physics and collision detection
- **Code Reuse**: Share logic between desktop (Tauri) and web versions
- **Type Safety**: Rust type system prevents runtime errors
- **Size**: Smaller bundle than equivalent JavaScript

---

### ADR-D007: Evidence-Based Architecture

**Date**: 2024-02-15 **Status**: Accepted

#### Context

Core system architecture must support military-grade audit trails.

#### Decision

Design entire system around immutable evidence records with cryptographic
proofs.

#### Evidence Model

```rust
pub struct EvidenceRecord {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub digest: EvidenceDigest,
    pub payload_mime: Option<String>,
    pub metadata: serde_json::Value,
}

pub struct ChainTxRef {
    pub network: String,
    pub chain: String,
    pub tx_id: String,
    pub confirmed: bool,
    pub timestamp: Option<DateTime<Utc>>,
}
```

---

### ADR-D008: TypeScript Shared Packages

**Date**: 2024-03-01 **Status**: Accepted

#### Context

Need shared type definitions and utilities across frontend apps.

#### Decision

Create shared TypeScript packages for types, UI components, and utilities.

#### Package Structure

```
packages/
├── types/       # Core type definitions
├── ui/          # React UI components
└── utils/       # Shared utilities
```

---

### ADR-D009: Iframe Isolation for WASM

**Date**: 2024-03-05 **Status**: Accepted

#### Context

Leptos WASM app was rendering outside designated container.

#### Decision

Embed WASM simulator via iframe for true DOM isolation.

#### Rationale

- **DOM Isolation**: Prevents WASM from affecting parent page
- **CSS Isolation**: No style conflicts with parent
- **Fullscreen Support**: Native fullscreen API support
- **Security**: Additional sandboxing layer

---

### ADR-D010: Calendar Export and Integration

**Date**: 2025-12-09 **Status**: Accepted

> Renumbered from D001 to D010 to resolve collision with ADR-D001 (Monorepo
> Structure with Turborepo).

#### Context

Project timeline and milestones need to be importable into user calendars for
tracking and reminders.

#### Decision

Implement iCal/ICS export with Google Calendar and Outlook integration, plus
Cal.com scheduling widget.

#### Rationale

- **Universal Compatibility**: iCal format works with all major calendar
  applications
- **Privacy-Preserving**: No OAuth or calendar permissions required
- **Low Maintenance**: No API dependencies for core functionality
- **Enhanced UX**: Direct calendar links reduce friction
- **Scheduling Integration**: Cal.com widget enables demo/meeting booking

For detailed analysis and implementation plan, see
[ADR-D010: Calendar Export and Integration](./adr-D010-calendar-export-integration.md).

---

_This document contains confidential architectural information. Distribution is
restricted to authorized personnel only. © 2025 Phoenix Rooivalk. All rights
reserved._
