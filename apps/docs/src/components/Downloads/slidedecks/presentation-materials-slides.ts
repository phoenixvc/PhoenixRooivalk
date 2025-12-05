import type { Slide, KeyPoint } from "../SlideDeckDownload";

/**
 * Executive Presentation Materials Slides
 * Full investor/executive presentation covering PhoenixRooivalk
 *
 * Enhanced with:
 * - Rich text formatting (**bold**, *italic*)
 * - Multiple layouts (two-column, quote, title-only)
 * - Nested sub-bullets for complex information
 * - Speaker notes for presenter guidance
 * - Color theme support
 */
export const presentationMaterialsSlides: Slide[] = [
  {
    number: 1,
    title: "PhoenixRooivalk: SAE Level 4 Autonomous Counter-UAS Defense",
    duration: 30,
    icon: "🚁",
    layout: "title-only",
    keyPoints: [
      "*Revolutionizing Drone Defense Through Edge AI and Blockchain Accountability*",
      "**Presenter:** Jurie Smit, Technical Lead",
      "**Date:** October 3, 2025",
    ],
    speakerNotes:
      "Welcome the audience. This is a comprehensive presentation - adjust depth based on audience expertise level.",
    script:
      "Welcome to PhoenixRooivalk - the world's first SAE Level 4 autonomous counter-UAS defense system. I'm Jurie Smit, Technical Lead. Today we'll show you how we're revolutionizing drone defense through edge AI and blockchain accountability.",
  },
  {
    number: 2,
    title: "The Challenge",
    duration: 60,
    icon: "⚠️",
    keyPoints: [
      {
        text: "**Swarm Attacks:** 300% increase in coordinated multi-drone assaults",
        subPoints: [
          "Multiple drones overwhelming single-target defenses",
          "Coordinated timing makes interception difficult",
        ],
      },
      {
        text: "**Autonomous Drones:** RF-silent threats bypass 64% of current systems",
        subPoints: [
          "Pre-programmed flight paths need no operator",
          "Traditional RF detection is useless",
        ],
      },
      {
        text: "**Current Defense Limitations**",
        subPoints: [
          "2-5 second response time is *too slow*",
          "Cloud dependency fails during jamming",
          "No audit trail for legal defensibility",
        ],
      },
    ],
    speakerNotes:
      "Paint the picture of the problem. Use specific numbers to build credibility. Pause after each point.",
    script:
      "Modern drone threats are evolving faster than defenses. We're seeing a 300% increase in coordinated swarm attacks. RF-silent autonomous drones bypass 64% of current systems. Existing defenses have 2-5 second response times - too slow for fast-moving threats. They rely on cloud connectivity that fails when communications are jammed. And critically, there's no audit trail for legal defensibility. The result: critical infrastructure and military installations remain vulnerable.",
  },
  {
    number: 3,
    title: "The Solution",
    duration: 60,
    icon: "🛡️",
    keyPoints: [
      "**120-195ms** Response Time: *10-40x faster* than current systems",
      "**99.7%** Detection Accuracy: Eliminates environmental false positives",
      {
        text: "**RF-Silent Detection:** Handles autonomous threats",
        subPoints: [
          "Visual AI detection independent of RF",
          "Thermal signature analysis",
        ],
      },
      {
        text: "**Blockchain Evidence:** Court-admissible audit trails",
        subPoints: [
          "Every engagement cryptographically anchored",
          "Tamper-proof chain of custody",
        ],
      },
      "**SAE Level 4 Autonomy:** Complete offline operation",
      "**Swarm Defense:** Handles *100+ concurrent threats*",
    ],
    speakerNotes:
      "Each bullet is a differentiator. Emphasize the 10-40x speed advantage - this is our key competitive edge.",
    script:
      "PhoenixRooivalk delivers unprecedented protection. Our 120-195ms response time is 10-40 times faster than competitors. We achieve 99.7% detection accuracy, eliminating false positives. We detect RF-silent threats that others miss. Every engagement creates blockchain-verified evidence that's court-admissible. We operate at SAE Level 4 autonomy - completely offline without communications. And we handle 100+ concurrent threats with graceful degradation.",
  },
  {
    number: 4,
    title: "Technology Stack",
    duration: 60,
    icon: "⚡",
    layout: "two-column",
    leftColumnTitle: "AI & Processing",
    leftColumn: [
      "**Morpheus AI Engine**",
      "Decentralized P2P agents",
      "Explainable AI decisions",
      "Smart contract ROE enforcement",
    ],
    rightColumnTitle: "Infrastructure",
    rightColumn: [
      "**Solana Blockchain**",
      "3,000-4,500 TPS",
      "~400ms finality",
      "$0.0003 per anchor",
    ],
    keyPoints: [
      {
        text: "**Cognitive Mesh Orchestration:** Multi-agent coordination",
        subPoints: [
          "Handles 100-200 drone swarms",
          "Graceful degradation under load",
        ],
      },
      {
        text: "**Custom Sensor Fusion:** 30-50ms processing",
        subPoints: [
          "RF spectrum",
          "EO/IR cameras",
          "Radar",
          "Acoustic sensors",
        ],
      },
    ],
    speakerNotes:
      "Technical audience will want to dig into specifics. Non-technical audience needs the high-level story.",
    script:
      "Our technology has four pillars. The Morpheus AI Decision Engine uses decentralized peer-to-peer agents with explainable AI and smart contract ROE enforcement. Solana blockchain provides 3,000-4,500 TPS with 400ms finality at just $0.0003 per anchor. Cognitive Mesh Orchestration coordinates responses to 100-200 drone swarms. And our custom sensor fusion integrates RF spectrum, cameras, radar, and acoustic sensors with 30-50ms processing.",
  },
  {
    number: 5,
    title: "Performance Comparison",
    duration: 45,
    icon: "📊",
    layout: "two-column",
    leftColumnTitle: "PhoenixRooivalk",
    leftColumn: [
      "**120-195ms** response",
      "✅ RF-Silent Detection",
      "✅ SAE Level 4 Autonomy",
      "✅ 100+ swarm handling",
      "✅ Blockchain Evidence",
    ],
    rightColumnTitle: "Competitors",
    rightColumn: [
      "**2-5 seconds** response",
      "❌ No RF-Silent Detection",
      "❌ Partial autonomy only",
      "❌ Limited/Sequential",
      "❌ No blockchain",
    ],
    keyPoints: [],
    speakerNotes:
      "This is the 'why us' slide. Let the comparison speak for itself. Pause to let it sink in.",
    script:
      "The numbers speak for themselves. Our 120-195ms response time beats Anduril, Fortem, and DroneShield by 10-40 times. We're the only solution with RF-silent detection. We're the only one with true SAE Level 4 autonomy. We handle 100+ drone swarms while competitors are limited to sequential engagement. And we're the only system with blockchain evidence generation. This is a 10-40x performance improvement with unique capabilities competitors cannot match.",
  },
  {
    number: 6,
    title: "Market Opportunity",
    duration: 60,
    icon: "📈",
    keyPoints: [
      "**Current Market:** $2.45-3.0B (2025)",
      "**Growth Rate:** 23-27% CAGR",
      "**Projected 2030:** $9-15B annual market value",
      {
        text: "**Target Segments:**",
        subPoints: [
          "Defense & Military: **$1.2B** (48%)",
          "Critical Infrastructure: **$600M** (24%)",
          "Commercial & Events: **$400M** (16%)",
        ],
      },
    ],
    speakerNotes:
      "Market size is credible and growing. We're targeting the highest-value segments first.",
    script:
      "We're targeting a $2.45-3.0 billion market in 2025, growing at 23-27% annually to reach $9-15 billion by 2030. This is part of a $73 billion total drone industry. Our target segments are Defense & Military at $1.2 billion representing 48% of the market, Critical Infrastructure at $600 million or 24%, and Commercial & Events at $400 million or 16%. Market drivers include evolving threat landscape, regulatory requirements, and technology evolution enabling edge computing and blockchain integration.",
  },
  {
    number: 7,
    title: "Business Model",
    duration: 60,
    icon: "💰",
    keyPoints: [
      {
        text: "**Hardware Sales (60%):** $25k-$100k per unit",
        subPoints: [
          "Net launchers and interceptors",
          "Sensor suites and UGV platforms",
        ],
      },
      {
        text: "**Software Subscriptions (25%):** $1k-$3k/month",
        subPoints: ["Monitoring dashboards", "Evidence storage and retrieval"],
      },
      {
        text: "**Support & Services (15%):** $2k-$5k/year",
        subPoints: ["Integration consulting", "Training and certification"],
      },
      "**CLV:CAC Ratio:** 6:1 to 10:1 across all segments",
      "**Gross Margins:** 65-70% hardware, *80%+ software*",
    ],
    speakerNotes:
      "Strong unit economics. The software margins are especially attractive for recurring revenue.",
    script:
      "We have a hybrid hardware plus SaaS model with strong unit economics. Hardware sales represent 60% of revenue at $25k-$100k per unit. Software subscriptions provide 25% of revenue with monitoring at $1k-$3k monthly and evidence storage at $500-$2k monthly. Support and services add 15% with $2k-$5k annual support contracts. Our CLV to CAC ratio ranges from 6:1 to 10:1. Gross margins are 65-70% on hardware and over 80% on software. We project $3.5M in Year 1, scaling to $160M by Year 5.",
  },
  {
    number: 8,
    title: "Competitive Advantage",
    duration: 60,
    icon: "🏆",
    keyPoints: [
      {
        text: "**Speed:** 120-195ms p50 vs 2-5 seconds",
        subPoints: [
          "Edge-first architecture",
          "Zero network latency dependency",
        ],
      },
      {
        text: "**Autonomy:** Complete edge operation",
        subPoints: [
          "SAE Level 4 autonomous decision making",
          "Operates under EW and GPS denial",
          "No single point of failure",
        ],
      },
      {
        text: "**Accountability:** Blockchain-verified records",
        subPoints: [
          "Cryptographically anchored audit trails",
          "Court-admissible evidence",
          "ROE compliance proof",
        ],
      },
      "*Quantum-resistant design* for security beyond 2030",
    ],
    speakerNotes:
      "Three pillars of competitive advantage. Each one is defensible and hard to replicate.",
    script:
      "Our competitive advantage rests on three pillars. Speed: our 120-195ms response time comes from edge-first architecture that eliminates network latency. Autonomy: we provide SAE Level 4 autonomous decision making that operates under EW and GPS denial with no single point of failure. Accountability: blockchain-verified engagement records provide cryptographically anchored audit trails that are court-admissible. We're the only solution with cryptographic ROE compliance proof, the fastest edge decision latency in the market, and quantum-resistant design for security beyond 2030.",
  },
  {
    number: 9,
    title: "Development Roadmap",
    duration: 60,
    icon: "🗓️",
    keyPoints: [
      {
        text: "**Q1 2026:** Two-site pilot deployment",
        subPoints: [
          "Soft-kill ROE implementation",
          "Initial customer validation",
        ],
      },
      {
        text: "**Q2 2026:** Public on-chain proof tests",
        subPoints: [
          "Lockheed Martin integration progress",
          "Partner API launch",
        ],
      },
      {
        text: "**Q3 2026:** NATO certification process",
        subPoints: ["Multi-swarm coordination demo", "Regulatory approvals"],
      },
      {
        text: "**Q4 2026:** Full production deployment",
        subPoints: [
          "Customer acquisition at scale",
          "Manufacturing partnerships",
        ],
      },
      "**Current Status:** Software complete, pilot deployments *operational*",
    ],
    speakerNotes:
      "Clear roadmap with specific milestones. We're already past the early stages.",
    script:
      "We have proven progress with a clear path to market leadership. We've completed Q1 2026 two-site pilot deployment and soft-kill ROE implementation. Q2 2026 brought public on-chain proof tests and Lockheed Martin integration progress. Q3 2026 delivered NATO certification process and multi-swarm coordination demos. Currently, our software foundation is complete with monorepo and core components, pilot deployments are production-ready with operational validation, and security evaluation shows red-team assessment completed with vulnerabilities patched. Next milestones include Q4 2026 full production deployment and Q1 2027 market expansion.",
  },
  {
    number: 10,
    title: "Investment Opportunity",
    duration: 60,
    icon: "💎",
    keyPoints: [
      "**$43.5M Total Investment** to TRL7",
      {
        text: "**Phase 1 (Concept):** $3.5M",
        subPoints: ["Architecture validation", "Simulation and modeling"],
      },
      {
        text: "**Phase 2 (Prototype):** $15M",
        subPoints: ["Hardware demo units", "Lab testing and validation"],
      },
      {
        text: "**Phase 3 (Integration):** $25M",
        subPoints: ["Field trials", "Certification readiness"],
      },
      "**Series A:** *10-15x return potential*",
    ],
    speakerNotes:
      "Clear use of funds with specific milestones tied to each phase. The return potential is compelling.",
    script:
      "We're seeking $43.5 million total investment to reach TRL7. Phase 1 needs $3.5 million for architecture validation and simulation. Phase 2 requires $15 million for hardware demo and lab tests. Phase 3 needs $25 million for field trials and certification readiness. Investment highlights include proven technology with working prototype, strong market growing at 23-27% CAGR, 10-40x performance improvement, experienced team with strong technical capabilities, and clear path to exit. Series A offers 10-15x return potential with strategic acquisition potential of $2B-$5B or IPO path of $5B-$10B.",
  },
  {
    number: 11,
    title: "Team & Execution",
    duration: 60,
    icon: "👥",
    layout: "two-column",
    leftColumnTitle: "Leadership",
    leftColumn: [
      "**Jurie Smit** - Technical Lead",
      "LinkedIn: juriesmit",
      "GitHub: JustAGhosT",
      "**Martyn Redelinghuys** - Co-Founder",
      "LinkedIn: martynrede",
    ],
    rightColumnTitle: "Capabilities",
    rightColumn: [
      "Rust & Systems Programming",
      "Distributed Systems",
      "Blockchain Integration",
      "Edge AI/ML",
      "Security Architecture",
    ],
    keyPoints: [
      "Software foundation: **Complete** and production-ready",
      "Pilot deployments: *Operational validation completed*",
      "Security assessment: Zero critical vulnerabilities",
    ],
    speakerNotes:
      "Emphasize the track record of execution. The team has delivered on promises.",
    script:
      "Our experienced team has proven technical capabilities. Jurie Smit serves as Technical Lead with deep expertise in Rust development, distributed systems, and blockchain integration. Martyn Redelinghuys is Co-Founder bringing additional technical depth. Our development status shows a complete monorepo structure with core components built, Axum API service providing RESTful APIs, blockchain keeper for Solana and Etherlink anchoring, custom Rust crates for evidence handling, Next.js marketing with professional website, and comprehensive Docusaurus documentation. Our execution track record includes complete software foundation, operational pilot deployments, passed security assessment, and ongoing Lockheed Martin integration discussions.",
  },
  {
    number: 12,
    title: "Call to Action",
    duration: 60,
    icon: "🎯",
    layout: "title-only",
    keyPoints: [
      "**Series A Investment:** $15M for MVP completion",
      "**Strategic Partnerships:** Defense contractors, technology partners",
      "**Pilot Programs:** Early customer validation",
      "**Technical Demo:** *See the system in action*",
      "",
      "📧 **Contact:** jurie@phoenixvc.tech",
    ],
    speakerNotes:
      "End with clear next steps. Make it easy for them to take action. Offer the demo.",
    script:
      "Join us in revolutionizing drone defense. Immediate opportunities include Series A investment of $15 million for MVP completion and market expansion, strategic partnerships with defense contractors and technology partners, pilot programs for early customer validation, and technical collaboration for joint development. Why now? Market timing demands better solutions as threats evolve. Technology readiness shows edge computing and blockchain are mature. We have competitive window as first-movers in autonomous systems. And regulatory support from DoD Directive 3000.09 enables autonomous defense. Next steps: technical demo to see the system in action, pilot program to deploy at your facility, partnership discussion to explore collaboration, and investment discussion to join our funding round. Contact us at jurie@phoenixvc.tech for technical demo or partnership inquiries.",
  },
];

export const presentationMaterialsMeta = {
  title: "PhoenixRooivalk Executive Presentation",
  duration: 12,
  audience: "Investors/Executives",
  date: "October 3, 2025",
  colorTheme: "investor" as const,
};
