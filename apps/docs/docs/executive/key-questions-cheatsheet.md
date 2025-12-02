---
id: key-questions-cheatsheet
title: Key Questions Cheatsheet
sidebar_label: Key Questions Cheatsheet
difficulty: beginner
estimated_reading_time: 13
points: 10
phase: ["seed", "series-a", "series-b"]
tags:
  - executive
  - counter-uas
---

## Technology & Product

**Q: What do Morpheus and Solana each do?** A: Morpheus provides decentralized
AI decision-making at the edge; Solana anchors tamper-evident evidence on
blockchain. We use custom Rust crates for sensor fusion instead of third-party
solutions like Pinax (which would have added unnecessary overhead).

**Q: How is 50-195ms decision latency achieved?** A: Target latency through
edge-first architecture - entire fuse-classify-decide-actuate path designed to
run locally without WAN/cloud round-trips. Sensor fusion targeted at 20-50ms, AI
decision at 50-100ms, with parallel evidence queueing. These are design targets
to be validated with hardware testing.

**Q: What ensures safe actions and compliance?** A: Policy-based ROE guardrails
in the AI engine, soft-kill first approach design, geofencing capabilities,
human-in-the-loop for kinetic actions, and blockchain audit trail for
accountability.

**Q: How does the system handle EW and GPS denial?** A: Fully offline-autonomous
operation; evidence queues locally and anchors asynchronously when connectivity
resumes. Uses IMU, visual odometry, and multi-sensor correlation as GPS
alternatives.

**Q: Can sensors/vendors be swapped?** A: Yes, our Rust-based fusion layer
provides stable protobuf contracts abstracting sensor differences. New sensors
integrate via adapter pattern without affecting downstream components.

**Q: What advantage does it provide over fiber-anchored drones?** A: No physical
tether limitations, unlimited range within deployment zone, resilience in
contested environments, ability to operate in network-denied conditions while
maintaining cryptographic evidence trail, and multi-site scalability.

---

## Cognitive Mesh Integration

**Q: How does Cognitive Mesh enhance Phoenix Rooivalk beyond basic autonomy?**
A: Provides multi-agent orchestration allowing role specialization
(scout/interceptor/relay), hierarchical decision confidence, temporal pattern
recognition, and continuous learning capabilities while maintaining sub-200ms
latency targets.

**Q: Where does the Cognitive Mesh sit in the system architecture?** A: Operates
as orchestration layer above the hot decision path - doesn't slow down critical
decisions but provides coordination, learning, and optimization capabilities
across the swarm.

**Q: How does the Agent Registry manage 10-100 drone swarms?** A: Each drone
registers with ID, capabilities, role, authority level, and health status.
Registry dynamically assigns specialized roles, handles graceful degradation
when drones are damaged, and rebalances tasks in real-time.

**Q: How does the Hierarchical Decision Confidence Pack (HDCP) improve
accuracy?** A: HDCP is designed to weight sensor inputs by reliability,
decompose complex threats into sub-problems, and use ensemble voting. Target is
improving detection accuracy from 85.2% to 95.2-98.5% through multi-level
analysis.

**Q: How does the Temporal Decision Core interface with SAE Level 4
architecture?** A: TDC runs on edge nodes providing context enrichment within
50-100ms after sub-2ms authentication. Uses bypass mechanism for critical path
while maintaining eligibility traces for pattern matching.

**Q: How does Cognitive Mesh's Zero-Trust framework enhance security?** A: Every
drone command requires fresh authentication, implements least privilege, uses
encrypted channels with rotating keys, logs all attempts, and instantly revokes
compromised drone permissions.

**Q: What role does the Constraint & Load Engine play?** A: Dynamically balances
response time vs accuracy by modeling speed/accuracy/power/bandwidth constraints
simultaneously. Can relax accuracy requirements to maintain <2ms in critical
situations while ensuring no slowdown even under swarm attacks.

**Q: How does the Memory Flexibility Suite maintain situational awareness?** A:
Maintains 30-second working memory buffer (2GB/drone target), stores key events,
learns threat patterns, and automatically promotes important patterns from
working to long-term storage.

**Q: How does Cognitive Mesh enable swarm coordination under jamming?** A: Uses
delay-tolerant networking, short-range robust links, signed topics, CBBA-style
auction algorithms for task assignment, and maintains coordination even with
50%+ communication loss.

**Q: What is the Cognitive Sandwich Backend's role in weapon authorization?** A:
Implements phase-based workflow
(Detection→Assessment→Authorization→Engagement→Verification) with mandatory
human checkpoints for weapon release and full blockchain audit trail.

**Q: Do we need a blockchain data infrastructure service?** A: No. We chose to
implement direct Solana integration using our custom Rust crates rather than
using third-party services like Pinax, which would have added $1-2k/month in
unnecessary overhead. Our direct approach costs only $50-100/month for RPC
access.

---

## Evidence & Security

**Q: How is evidence tamper-proof?** A: Every decision is hash-chained,
Merkle-batched, and anchored on Solana with timestamps. Keys stored in TPM/HSM,
models/policies signed and verified at boot.

**Q: Why use Solana specifically?** A: High-throughput (65,000-100,000 TPS),
low-latency (~400ms finality), low-cost anchoring (~$0.00025/anchor), Proof of
History for cryptographic timestamping, and proven reliability.

**Q: What if Solana is congested or offline?** A: Evidence queues locally with
exponential backoff, local proofs remain verifiable, alerts raised for anchor
lag, optional dual-chain anchoring with Etherlink for redundancy.

**Q: Can logs be forged?** A: No - keys in TPM/HSM, signed models/policies,
on-chain root verification, and correlation IDs linking all evidence layers make
forgery cryptographically impossible.

**Q: What about data privacy?** A: Evidence encrypted off-chain in Azure
Blob/S3; only merkle roots on-chain; GDPR-compliant retention; zero-knowledge
proof options under exploration.

---

## Market & Business

**Q: Who are initial buyers?** A: Defense primes, critical infrastructure
operators (airports, power plants), NATO-aligned militaries, and civilian
security firms. Focus on customers needing autonomous operation in contested
environments.

**Q: Why now?** A: Ukraine conflict revealed vulnerabilities in
network-dependent systems; EW-heavy theaters demand offline autonomy; drone
threats evolving faster than traditional defenses can adapt.

**Q: Is this only military?** A: No - civilian applications include airports,
data centers, stadiums, power plants. Insurance and compliance requirements
driving civilian adoption.

**Q: What's the Lockheed Martin angle?** A: Initial discussions occurred but are
currently frozen pending MVP/POC development. They would serve as systems
integrator for sensor suite and C2 fabric once we demonstrate working prototype.
Focus now is on building the proof of concept to restart discussions.

**Q: What's the media/war-streamer strategy?** A: Engage Prof Gerdes (technical
analysis), ATP Geopolitics (conflict context), CombatVeteranReacts (operator
perspective) to build reputation and drive inbound interest - scheduled
post-MVP.

**Q: What are unit economics?** A: Target pricing around ZAR 850k (~$45k USD)
for base system, with recurring revenue from SaaS monitoring and evidence
storage services. Actual pricing will depend on configuration and scale.

**Q: How big is the market opportunity?** A: Counter-drone market estimated at
$2-3.5B (2024) with projections to $8-16B by 2030-2035 (15-25% CAGR). Total
drone industry is ~$73B, providing additional expansion opportunities.

---

## Deployment & Operations

**Q: Where does the system run?** A: Edge nodes on-premises (NVIDIA Jetson
clusters) with optional Azure cloud for monitoring/ops. Fully kubernetes
orchestrated (K3s edge, AKS cloud).

**Q: How does it scale?** A: Multi-tenant site controllers, batched evidence
anchoring, horizontal scaling via kubernetes. Design supports 100+ sites with
central monitoring.

**Q: How does Azure integration work?** A: AKS for orchestration, ACR for
containers, Key Vault for secrets, PostgreSQL/Redis for data, Monitor for
telemetry, Application Gateway for routing.

**Q: What's the deployment timeline?** A: Once funded and MVP built: 2-week base
deployment, 2-week sensor integration, 2-week testing/calibration. Total: 6-8
weeks from contract to operational.

**Q: Can it integrate with existing C2 systems?** A: Yes - REST APIs, webhook
notifications, working toward STANAG 4586 compliance, and adapter patterns for
major defense platforms.

---

## Safety & Compliance

**Q: Is the system export-control safe?** A: Design allows modular architecture
for export-controlled components isolation; ROE policy packs per jurisdiction;
working toward ITAR-compliant design.

**Q: How are ROE enforced?** A: Policy DSL translates rules to machine-readable
format; real-time validation of every decision; escalation for unclear
situations; geographic constraints via geofencing.

**Q: What about civilian casualties?** A: Soft-kill first approach,
proportionality assessment, confidence thresholds prevent engagement below
cutoffs, mandatory human authorization for kinetic actions.

**Q: Is evidence court-admissible?** A: Designed to meet both military tribunal
and civilian court standards through tamper-evident blockchain proof, complete
sensor data packages, and preserved chain of custody.

---

## Performance & Reliability

**Q: How is false positive risk managed?** A: Design includes confidence
thresholds, multi-sensor correlation, and human-in-the-loop for critical
decisions. Target false positive rate <0.5-1% to be validated through testing.

**Q: What happens if sensors degrade?** A: Architecture designed for graceful
degradation - if certain sensors fail, system continues with reduced capability.
Cognitive Mesh monitors health and adjusts operations accordingly.

**Q: What's the target uptime?** A: High availability through redundant edge
nodes and automatic failover. Target 99.9% SLA to be validated in production.

**Q: How does it perform in adverse weather?** A: Multi-sensor fusion designed
to compensate for individual sensor limitations. Weather performance will be
validated during pilot testing.

---

## Technical Deep Dive

**Q: Why Rust for core systems?** A: Memory safety without garbage collection;
predictable latency; excellent embedded support; strong cryptographic libraries;
proven in aerospace applications.

**Q: How are AI models updated?** A: Designed for A/B testing in sandbox; HITL
approval required; staged rollout capability; automatic rollback on performance
degradation; cryptographic signing of models.

**Q: What's the network architecture?** A: NATS for edge pub/sub; Kafka for
durable streams (planned); protobuf schemas; gRPC for service communication;
automatic retry with circuit breakers.

**Q: How does swarm coordination work?** A: CBBA auction algorithms for task
allocation; consensus-based leader election; gossip protocol for state sync;
Byzantine fault tolerance for resilience.

**Q: Can the system be simulated?** A: Planning for digital twin simulation
capability; hardware-in-loop testing; scenario replay from evidence logs; Monte
Carlo threat simulations.

---

## Cognitive Mesh Performance

**Q: How does Cognitive Mesh affect latency?** A: Designed to stay off critical
path - authentication and primary decisions remain fast while Cognitive
enhancements provide context enrichment in parallel.

**Q: What's the learning capability of the system?** A: AI-Research-on-AI
recursive loop designed for continuous improvement. Target 100x faster
recalibration than traditional systems. Specific learning rates to be
established through deployment.

**Q: How does Meta-Orchestration handle large swarms?** A: Designed with
hierarchical clustering - larger swarms divided into manageable sub-swarms with
distributed consensus per cluster. Scalability to be validated through testing.

**Q: What's the expected cognitive load reduction for operators?** A: System
designed to reduce operator workload through intelligent filtering and
automation. Specific metrics will be measured during pilot deployments.

---

## Risks & Challenges

**Q: What's the biggest technical risk?** A: Sensor variability in contested
environments. Mitigated by multi-sensor fusion, continuous calibration,
conservative confidence thresholds, and human oversight.

**Q: What if blockchain fails?** A: Local evidence remains valid and
timestamped; queuing with retry; optional dual-chain; can operate indefinitely
offline with post-hoc anchoring.

**Q: How do you prevent adversarial AI attacks?** A: Input validation, anomaly
detection, confidence bounds, gradual trust degradation, automatic reversion to
conservative modes planned.

**Q: What about swarm hijacking?** A: Cryptographic authentication per drone;
continuous re-validation; automatic quarantine of anomalous units; Byzantine
fault tolerance assumes 33% compromise.

---

## Team & Execution

**Q: What is the background of the team?** A: The team is led by Jurie Smit
(LinkedIn: juriesmit, GitHub: JustAGhosT) and Martyn Redelinghuys (LinkedIn:
martynrede). The Phoenix Rooivalk repository demonstrates strong technical
capabilities in Rust, blockchain integration (Solana/Etherlink), distributed
systems, and modern DevOps practices.

**Q: What is the current development status of Phoenix Rooivalk?** A: We have a
monorepo with core components built: Axum API service, blockchain keeper service
for Solana/Etherlink anchoring, custom Rust crates for evidence handling and
sensor fusion, Next.js marketing site, and Docusaurus documentation. The
software foundation is complete; seeking funding for hardware and MVP
demonstration.

**Q: How do you plan to go to market?** A: Two-pronged approach: (1) Defense
partnerships - Lockheed Martin discussions frozen pending MVP/POC demonstration.
Once prototype ready, restart engagement for integration and distribution. (2)
Media/influencer strategy targeting defense tech audiences through channels like
Prof Gerdes, ATP Geopolitics, and CombatVeteranReacts.

**Q: Are there any regulatory or ethical barriers?** A: Yes, autonomous defense
systems face significant scrutiny. Our approach: human-in-the-loop for kinetic
actions, modular architecture to isolate ITAR-controlled components, compliance
tracking (NIST AI RMF), tamper-proof evidence logging for accountability.

---

## Competition & Differentiation

**Q: Who are the main competitors or alternative solutions?** A: Competing
counter-drone systems fall into categories: signal jammers (can be defeated),
kinetic interceptors (expensive per engagement), and high-power lasers (weather
limitations). Phoenix Rooivalk aims to provide multi-layer defense with AI
autonomy and blockchain accountability.

**Q: What is your unique IP or defensibility?** A: Defensibility comes from
integration complexity and first-mover advantage in combining edge AI with
blockchain evidence. The Cognitive Mesh orchestration framework and custom
sensor fusion algorithms represent significant development effort.

---

## Investment & Partnership

**Q: What's the funding status?** A: Currently self-funded/unfunded. Built the
technical foundation (software, architecture, CI/CD). Urgently seeking seed
investment for hardware procurement and MVP completion.

**Q: What partnerships are needed?** A: Key needs: MVP/POC completion to restart
Lockheed Martin discussions, sensor manufacturers for hardware integration,
regulatory expertise for defense procurement, operational partners for pilot
deployments, seed funding for demonstrator.

**Q: What's the exit strategy?** A: Potential paths include strategic
acquisition by defense contractor, licensing of specific technologies, or
building standalone defense technology company. Path depends on market traction
and partner relationships.

**Q: How do you measure success?** A: Initial: completing MVP/POC, validating
sub-200ms latency targets, demonstrating blockchain evidence chain integrity,
restarting Lockheed discussions. Long-term: becoming the standard for autonomous
counter-drone defense.

---

## Roadmap & Future

**Q: What's the next major milestone?** A: Complete MVP/POC hardware build to
demonstrate the integrated system (sensor fusion, Morpheus AI decision engine,
Solana evidence anchoring) working end-to-end. Then restart Lockheed Martin
discussions and proceed to pilot deployments.

**Q: What is the timeline for deployment?** A: Currently October 2025. Software
foundation complete. Once funded: 3-6 months for MVP, then 2-4 weeks per site
deployment. Production timeline depends on pilot results and customer
commitments.

**Q: What proof will be shown at pilot exit?** A: Target metrics include latency
measurements (aiming for <200ms end-to-end), false positive rates <1%, ROE
compliance verification, and successful blockchain evidence chain validation.

**Q: How does Cognitive Mesh evolve?** A: The framework enables continuous
learning and adaptation. AI-Research-on-AI loop and Experimental Velocity
Backend designed to accelerate improvements based on operational data.

**Q: What's the competitive moat?** A: First-mover advantage in combining edge
AI autonomy with cryptographic evidence trails, complexity of integrating
multiple cutting-edge technologies, and operational data/relationships from
early deployments.

---

## Quick Reference

**Focus Areas**: Edge autonomy without network dependency, blockchain evidence
for accountability, modular architecture for flexibility.

**Performance Metrics**: Design targets pending hardware validation - 50-195ms
latency, <1-2% false positive rate, 99.9% uptime target.

**Current Status**: October 2025. Software foundation 75 to 85% complete.
Seeking seed funding for completion and MVP hardware demonstration.

**Team**: Jurie Smit and Martyn Redelinghuys leading development with strong
technical capabilities in Rust, blockchain integration, and distributed systems.

**Key Differentiator**: First-mover advantage in combining edge AI autonomy with
cryptographic evidence trails for military-grade counter-drone defense.

---

_This document contains confidential technical information. Distribution is
restricted to authorized personnel only. © 2025 Phoenix Rooivalk. All rights
reserved._
