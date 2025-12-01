import type { Slide } from "../SlideDeckDownload";

/**
 * Phoenix Rooivalk Comprehensive Investor Pitch Deck
 * Full presentation covering market, technology, business model, and traction
 */
export const pitchDeckSlides: Slide[] = [
  {
    number: 1,
    title: "The Problem: Drone Threats Are Escalating Globally",
    duration: 60,
    icon: "🚨",
    keyPoints: [
      "Ukraine produced 1M+ drones in 2024 - drones account for 15% of casualties",
      "Critical infrastructure (airports, power plants, prisons) under constant threat",
      "Existing solutions: slow (5-30s response), unreliable offline, no accountability",
      "Market gap: No system combines speed, autonomy, and legal evidence generation",
    ],
    script:
      "Drones are no longer hobbyist toys. Ukraine produced over 1 million drones in 2024, and they account for 15% of all casualties in modern warfare. Airports, power plants, and prisons face daily threats. Existing counter-drone systems are too slow, fail offline, and provide no legal accountability. There's a massive gap in the market for a solution that's fast, autonomous, and legally defensible.",
  },
  {
    number: 2,
    title: "Our Solution: SAE Level 4 Autonomous Defense",
    duration: 60,
    icon: "🛡️",
    keyPoints: [
      "Sub-200ms end-to-end response time (10-150x faster than competitors)",
      "True autonomy: Operates in RF-denied, GPS-denied, fully offline environments",
      "Blockchain-anchored evidence: Legally defensible, tamper-proof audit trail",
      "Modular weapons: Nets, RF jammers, kinetic - adapt to threat and regulations",
    ],
    script:
      "Phoenix Rooivalk is SAE Level 4 autonomous counter-drone defense. We deliver sub-200ms response times - that's 10 to 150 times faster than existing systems. We operate completely offline in RF-denied and GPS-denied environments where others fail. Every engagement generates blockchain-anchored evidence for legal defense. And our modular weapon system adapts to any threat level and regulatory environment.",
  },
  {
    number: 3,
    title: "Market Opportunity: $2.51B by 2030",
    duration: 50,
    icon: "📈",
    keyPoints: [
      "Current market: $1.2-1.8B (2024)",
      "Projected: $2.51B by 2030 at 23.5% CAGR",
      "Target segments: Military ($1.2B), Critical Infrastructure ($0.8B), Commercial ($0.5B)",
      "International focus: EU & Canada (immediate need), South Africa (Phase 2)",
    ],
    script:
      "The counter-drone market is $1.2 to $1.8 billion today and growing to $2.51 billion by 2030 at 23.5% annually. We're targeting military, critical infrastructure, and commercial segments. Our go-to-market strategy prioritizes EU and Canada where the threat is immediate, with South Africa as a Phase 2 expansion market.",
  },
  {
    number: 4,
    title: "Technology: Edge-First AI + Blockchain",
    duration: 50,
    icon: "⚡",
    keyPoints: [
      "Edge AI: All processing on-device, no cloud dependency, sub-2ms authentication",
      "Blockchain: Solana (mainnet) + EtherLink (private) for evidence anchoring",
      "x402 Protocol: Revenue-generating API for evidence verification (live today)",
      "Modular architecture: Rust core, React UI, WASM for cross-platform deployment",
    ],
    script:
      "Our edge-first AI processes everything on-device with sub-2-millisecond authentication. Blockchain provides immutable evidence anchoring using Solana for public verification and EtherLink for private operations. Our x402 protocol is live today, generating revenue through evidence verification APIs. The modular Rust architecture with React UI and WASM ensures cross-platform deployment from embedded systems to web browsers.",
  },
  {
    number: 5,
    title: "Competitive Advantage: 10-150x Faster",
    duration: 50,
    icon: "🏆",
    keyPoints: [
      "Response time: 50-195ms vs competitors' 5,000-30,000ms",
      "True offline capability (competitors require connectivity)",
      "Only solution with blockchain evidence generation",
      "Open architecture vs proprietary vendor lock-in",
    ],
    script:
      "We're 10 to 150 times faster than any competitor. While others need 5 to 30 seconds to respond, we react in under 200 milliseconds. We're the only solution that works completely offline and generates blockchain-based legal evidence. Unlike proprietary systems, our open architecture prevents vendor lock-in and enables customer customization.",
  },
  {
    number: 6,
    title: "Hardware Progress: Prototype Ready",
    duration: 45,
    icon: "🔧",
    keyPoints: [
      "Net launcher and net designs complete - ready for prototyping",
      "In-house Kevlar manufacturing: 60% cost reduction, no import delays, IP protection",
      "Using Pieter's domestic Kevlar stock for immediate production",
      "Ground-based launcher designed for Grover UGV integration",
    ],
    script:
      "Hardware development is on track. Net launcher and net designs are complete and ready for prototyping. We're manufacturing Kevlar nets in-house using domestic stock, which cuts costs by 60%, eliminates import delays, and keeps our IP protected. The ground-based launcher is designed for integration with our Grover UGV platform.",
  },
  {
    number: 7,
    title: "Business Model: Pre-Hardware Revenue",
    duration: 50,
    icon: "💰",
    keyPoints: [
      "x402 Protocol: Blockchain micropayments for evidence verification API (live)",
      "SaaS licensing: Cloud-hosted AI analysis and monitoring dashboards",
      "Hardware sales: Net launchers, UGV platforms, sensor suites",
      "Professional services: Integration, training, regulatory compliance consulting",
    ],
    script:
      "Our business model generates revenue before hardware ships. The x402 protocol is live today, providing blockchain micropayments for evidence verification API access. We offer SaaS licensing for cloud-hosted AI and monitoring. Hardware sales include net launchers, UGV platforms, and sensor suites. Professional services cover integration, training, and regulatory compliance.",
  },
  {
    number: 8,
    title: "Market Validation: EU & Canada Priority",
    duration: 50,
    icon: "🎯",
    keyPoints: [
      "Interviewed 3 South African airports + Boeing pilot",
      "Finding: SA has zero drone incidents - operators are responsible",
      "Current SA threats: Lasers and kites (cheaper, more accessible)",
      "Strategy: EU & Canada first (immediate need), SA Phase 2",
    ],
    script:
      "We completed market validation by interviewing three South African airports and a Boeing pilot. Key finding: South Africa has zero drone incidents because operators are responsible. The real threats there are lasers and kites. This validates our international-first strategy. EU and Canada face the drone problem today. South Africa is our Phase 2 market.",
  },
  {
    number: 9,
    title: "Engineering Velocity: Production-Ready",
    duration: 40,
    icon: "🚀",
    keyPoints: [
      "Week 48: 370+ commits, 40+ PRs, 10+ ADRs published",
      "Full platform deployed: RAG integration, auth, gamification, monitoring",
      "Azure Functions + Cosmos DB backend fully operational",
      "Static site deployed on Azure SWA with CI/CD pipelines",
    ],
    script:
      "Our engineering velocity is exceptional. Week 48 alone saw 370+ commits, 40+ pull requests, and 10+ architecture decision records. The full platform is deployed with RAG integration, authentication, gamification, and monitoring. Azure Functions with Cosmos DB backend is operational. Static site runs on Azure SWA with complete CI/CD pipelines.",
  },
  {
    number: 10,
    title: "Traction: x402 Protocol Live",
    duration: 40,
    icon: "✅",
    keyPoints: [
      "x402 payment protocol deployed to production",
      "Blockchain micropayments operational (Solana + EtherLink)",
      "Evidence verification API available for integration",
      "Full security audit completed, zero critical vulnerabilities",
    ],
    script:
      "We have real traction. The x402 payment protocol is deployed to production with blockchain micropayments running on Solana and EtherLink. Our evidence verification API is available for third-party integration. We completed a full security audit with zero critical vulnerabilities found.",
  },
  {
    number: 11,
    title: "Regulatory Compliance: Built-In from Day 1",
    duration: 45,
    icon: "⚖️",
    keyPoints: [
      "Blockchain evidence trail meets legal admissibility requirements",
      "Modular weapons adapt to local regulations (nets vs kinetic vs RF)",
      "Compliance-first documentation: 140+ pages of technical/legal specs",
      "Integration with existing airspace management systems (ADS-B, FlightRadar24)",
    ],
    script:
      "Regulatory compliance is built into our architecture. Blockchain evidence trails meet legal admissibility requirements. Modular weapons adapt to local regulations - nets for civilian areas, kinetic for military zones. We maintain 140+ pages of compliance documentation. The system integrates with existing airspace management including ADS-B and FlightRadar24.",
  },
  {
    number: 12,
    title: "Deployment Models: Flexible & Scalable",
    duration: 45,
    icon: "🌐",
    keyPoints: [
      "Mobile Picket: Portable UGV-based for temporary security perimeters",
      "Site-Fixed: Permanent installation for airports, prisons, power plants",
      "Fiber Engage: High-density urban with fiber backbone for coordination",
      "Swarm Defense: Multi-unit coordination for large area coverage",
    ],
    script:
      "We support four deployment models. Mobile Picket uses portable UGV platforms for temporary perimeters. Site-Fixed provides permanent installations for airports and critical facilities. Fiber Engage handles high-density urban environments with fiber backbones for coordination. Swarm Defense coordinates multiple units for large area coverage.",
  },
  {
    number: 13,
    title: "Team: Deep Aerospace & Blockchain Expertise",
    duration: 40,
    icon: "👥",
    keyPoints: [
      "Combined 15+ years experience in aerospace, defense, and blockchain",
      "Prior work on military-grade systems and cryptographic protocols",
      "Strategic advisors from airport operations and aviation safety",
      "Growing network of university researchers and government contacts",
    ],
    script:
      "Our team brings deep domain expertise. Combined 15+ years in aerospace, defense, and blockchain. We've built military-grade systems and cryptographic protocols. Strategic advisors include airport operations and aviation safety professionals. We're building relationships with university researchers and government agencies.",
  },
  {
    number: 14,
    title: "Investment Ask: Series Seed",
    duration: 50,
    icon: "💵",
    keyPoints: [
      "Raising: $500K-$1M seed round",
      "Use of funds: Hardware prototyping (30%), EU/Canada market entry (40%), team expansion (30%)",
      "Milestones: 5 pilot installations, 10 x402 enterprise customers, regulatory certifications",
      "18-month runway to Series A with revenue traction",
    ],
    script:
      "We're raising a $500K to $1M seed round. Funds will go to hardware prototyping, EU and Canada market entry, and team expansion - 30, 40, 30 percent respectively. Target milestones are 5 pilot installations, 10 x402 enterprise customers, and key regulatory certifications. This provides an 18-month runway to Series A with proven revenue traction.",
  },
  {
    number: 15,
    title: "Next 6 Months: Aggressive Milestones",
    duration: 45,
    icon: "📅",
    keyPoints: [
      "Q1 2026: Complete net launcher prototype, first pilot installation (EU airport)",
      "Q2 2026: x402 enterprise contracts, regulatory certification (EU), 3 installations",
      "Q3 2026: Series A fundraise with proven revenue and 5 operational installations",
      "Q4 2026: Expand to Canada, begin scaling manufacturing partnerships",
    ],
    script:
      "Our roadmap is aggressive. Q1 2026: Complete net launcher prototype and secure our first EU airport pilot. Q2: Sign x402 enterprise contracts, achieve EU regulatory certification, reach 3 installations. Q3: Raise Series A with proven revenue and 5 operational sites. Q4: Expand to Canada and establish manufacturing partnerships for scale.",
  },
  {
    number: 16,
    title: "Vision: The Standard for Autonomous Defense",
    duration: 40,
    icon: "🌟",
    keyPoints: [
      "Become the de facto standard for counter-drone defense globally",
      "Open platform enabling ecosystem of third-party integrations",
      "Expand beyond drones: Autonomous defense for all aerial threats",
      "IPO candidate: $2.51B market with clear path to 20%+ market share",
    ],
    script:
      "Our vision is to become the global standard for counter-drone defense. We're building an open platform that enables an ecosystem of third-party integrations. Beyond drones, we see expansion to all autonomous aerial threat defense. This is an IPO-track company in a $2.51 billion market where we have a clear path to 20%+ market share. Let's build the future of autonomous defense together.",
  },
];

export const pitchDeckMeta = {
  title: "Phoenix Rooivalk: Investor Pitch Deck",
  duration: 12,
  audience: "Investors, Strategic Partners, Enterprise Customers",
  date: "December 2025",
};
