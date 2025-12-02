import type { Slide } from "../SlideDeckDownload";

/**
 * Phoenix Rooivalk Comprehensive Investor Pitch Deck
 * Full presentation covering market, technology, business model, and traction
 *
 * Enhanced with:
 * - Rich text formatting (**bold**, *italic*)
 * - Multiple layouts (two-column, quote, title-only, code)
 * - Nested sub-bullets for complex information
 * - Speaker notes for presenter guidance
 * - Color theme support
 */
export const pitchDeckSlides: Slide[] = [
  {
    number: 1,
    title: "The Problem: Drone Threats Are Escalating Globally",
    duration: 60,
    icon: "🚨",
    keyPoints: [
      {
        text: "**Ukraine produced 1M+ drones in 2024** - drones account for 15% of casualties",
        subPoints: [
          "Commercial drones weaponized at scale",
          "Low cost makes swarm attacks viable",
        ],
      },
      {
        text: "Critical infrastructure under *constant* threat",
        subPoints: [
          "Airports, power plants, prisons",
          "Daily incursions worldwide",
        ],
      },
      {
        text: "**Existing solutions fail:**",
        subPoints: [
          "5-30 second response time - *too slow*",
          "Unreliable offline operation",
          "No legal accountability trail",
        ],
      },
      "*Market gap:* No system combines speed, autonomy, and legal evidence generation",
    ],
    speakerNotes:
      "Start with impact. The Ukraine stat gets attention. Pause after the market gap statement.",
    script:
      "Drones are no longer hobbyist toys. Ukraine produced over 1 million drones in 2024, and they account for 15% of all casualties in modern warfare. Airports, power plants, and prisons face daily threats. Existing counter-drone systems are too slow, fail offline, and provide no legal accountability. There's a massive gap in the market for a solution that's fast, autonomous, and legally defensible.",
  },
  {
    number: 2,
    title: "Our Solution: SAE Level 4 Autonomous Defense",
    duration: 60,
    icon: "🛡️",
    keyPoints: [
      "**Sub-200ms** end-to-end response time (*10-150x faster* than competitors)",
      {
        text: "**True autonomy:** Operates in denied environments",
        subPoints: [
          "RF-denied operation",
          "GPS-denied operation",
          "Fully offline capability",
        ],
      },
      {
        text: "**Blockchain-anchored evidence:**",
        subPoints: [
          "Legally defensible audit trail",
          "Tamper-proof chain of custody",
          "Court-admissible documentation",
        ],
      },
      {
        text: "**Modular weapons:** Adapt to threat and regulations",
        subPoints: ["Nets for soft capture", "RF jammers for disruption", "Kinetic for military zones"],
      },
    ],
    speakerNotes:
      "This is our value proposition slide. Each point is a differentiator. Emphasize the 10-150x speed advantage.",
    script:
      "Phoenix Rooivalk is SAE Level 4 autonomous counter-drone defense. We deliver sub-200ms response times - that's 10 to 150 times faster than existing systems. We operate completely offline in RF-denied and GPS-denied environments where others fail. Every engagement generates blockchain-anchored evidence for legal defense. And our modular weapon system adapts to any threat level and regulatory environment.",
  },
  {
    number: 3,
    title: "Market Opportunity: $2.51B by 2030",
    duration: 50,
    icon: "📈",
    keyPoints: [
      "**Current market:** $1.2-1.8B (2024)",
      "**Projected:** $2.51B by 2030 at *23.5% CAGR*",
      {
        text: "**Target segments:**",
        subPoints: [
          "Military: **$1.2B** - largest segment",
          "Critical Infrastructure: **$0.8B** - high security needs",
          "Commercial: **$0.5B** - events, stadiums, airports",
        ],
      },
      {
        text: "**Geographic strategy:**",
        subPoints: [
          "*EU & Canada* - immediate need (Phase 1)",
          "South Africa - expansion market (Phase 2)",
        ],
      },
    ],
    speakerNotes:
      "Market is large enough to build a unicorn. The CAGR shows strong growth trajectory.",
    script:
      "The counter-drone market is $1.2 to $1.8 billion today and growing to $2.51 billion by 2030 at 23.5% annually. We're targeting military, critical infrastructure, and commercial segments. Our go-to-market strategy prioritizes EU and Canada where the threat is immediate, with South Africa as a Phase 2 expansion market.",
  },
  {
    number: 4,
    title: "Technology: Edge-First AI + Blockchain",
    duration: 50,
    icon: "⚡",
    layout: "two-column",
    leftColumnTitle: "Edge AI",
    leftColumn: [
      "**All processing on-device**",
      "No cloud dependency",
      "Sub-2ms authentication",
      "Explainable AI decisions",
    ],
    rightColumnTitle: "Blockchain",
    rightColumn: [
      "**Solana** (mainnet)",
      "**EtherLink** (private)",
      "Evidence anchoring",
      "$0.0003 per transaction",
    ],
    keyPoints: [
      {
        text: "**x402 Protocol:** Revenue-generating API (*live today*)",
        subPoints: [
          "Blockchain micropayments for verification",
          "Pre-hardware revenue stream",
        ],
      },
      {
        text: "**Modular architecture:**",
        subPoints: ["Rust core for performance", "React UI for dashboards", "WASM for cross-platform"],
      },
    ],
    speakerNotes:
      "Technical differentiation. The x402 revenue before hardware is a de-risking story.",
    script:
      "Our edge-first AI processes everything on-device with sub-2-millisecond authentication. Blockchain provides immutable evidence anchoring using Solana for public verification and EtherLink for private operations. Our x402 protocol is live today, generating revenue through evidence verification APIs. The modular Rust architecture with React UI and WASM ensures cross-platform deployment from embedded systems to web browsers.",
  },
  {
    number: 5,
    title: "Competitive Advantage: 10-150x Faster",
    duration: 50,
    icon: "🏆",
    layout: "two-column",
    leftColumnTitle: "PhoenixRooivalk",
    leftColumn: [
      "**50-195ms** response",
      "✅ True offline capability",
      "✅ Blockchain evidence",
      "✅ Open architecture",
    ],
    rightColumnTitle: "Competitors",
    rightColumn: [
      "**5,000-30,000ms** response",
      "❌ Requires connectivity",
      "❌ No evidence trail",
      "❌ Vendor lock-in",
    ],
    keyPoints: [],
    speakerNotes:
      "Let the comparison speak for itself. This is visual proof of our advantage.",
    script:
      "We're 10 to 150 times faster than any competitor. While others need 5 to 30 seconds to respond, we react in under 200 milliseconds. We're the only solution that works completely offline and generates blockchain-based legal evidence. Unlike proprietary systems, our open architecture prevents vendor lock-in and enables customer customization.",
  },
  {
    number: 6,
    title: "Hardware Progress: Prototype Ready",
    duration: 45,
    icon: "🔧",
    keyPoints: [
      {
        text: "**Net launcher and net designs complete**",
        subPoints: [
          "Ready for prototyping",
          "Ground-based launcher designed",
          "Grover UGV integration planned",
        ],
      },
      {
        text: "**In-house Kevlar manufacturing:**",
        subPoints: [
          "*60% cost reduction*",
          "No import delays",
          "Full IP protection",
        ],
      },
      "Using **Pieter's domestic Kevlar stock** for immediate production",
    ],
    speakerNotes:
      "Hardware progress de-risks the technical execution. In-house manufacturing is a major advantage.",
    script:
      "Hardware development is on track. Net launcher and net designs are complete and ready for prototyping. We're manufacturing Kevlar nets in-house using domestic stock, which cuts costs by 60%, eliminates import delays, and keeps our IP protected. The ground-based launcher is designed for integration with our Grover UGV platform.",
  },
  {
    number: 7,
    title: "Business Model: Pre-Hardware Revenue",
    duration: 50,
    icon: "💰",
    keyPoints: [
      {
        text: "**x402 Protocol** (*live today*)",
        subPoints: [
          "Blockchain micropayments for evidence verification API",
          "Revenue before hardware ships",
        ],
      },
      {
        text: "**SaaS licensing:**",
        subPoints: [
          "Cloud-hosted AI analysis",
          "Monitoring dashboards",
          "$1k-$3k/month per installation",
        ],
      },
      {
        text: "**Hardware sales:**",
        subPoints: ["Net launchers: $25k-$50k", "UGV platforms: $50k-$100k", "Sensor suites: $15k-$30k"],
      },
      {
        text: "**Professional services:**",
        subPoints: ["Integration consulting", "Training programs", "Regulatory compliance support"],
      },
    ],
    speakerNotes:
      "Multiple revenue streams with strong unit economics. The pre-hardware revenue is unique.",
    script:
      "Our business model generates revenue before hardware ships. The x402 protocol is live today, providing blockchain micropayments for evidence verification API access. We offer SaaS licensing for cloud-hosted AI and monitoring. Hardware sales include net launchers, UGV platforms, and sensor suites. Professional services cover integration, training, and regulatory compliance.",
  },
  {
    number: 8,
    title: "Market Validation: EU & Canada Priority",
    duration: 50,
    icon: "🎯",
    layout: "two-column",
    leftColumnTitle: "Research Findings",
    leftColumn: [
      "Interviewed **3 SA airports** + Boeing pilot",
      "SA has *zero* drone incidents",
      "Operators are responsible",
      "Current threats: lasers & kites",
    ],
    rightColumnTitle: "Strategic Decision",
    rightColumn: [
      "**EU & Canada first**",
      "Active drone threat landscape",
      "Regulatory frameworks ready",
      "SA becomes Phase 2 market",
    ],
    keyPoints: [],
    speakerNotes:
      "Market research drove strategic pivot. Shows we listen to data, not assumptions.",
    script:
      "We completed market validation by interviewing three South African airports and a Boeing pilot. Key finding: South Africa has zero drone incidents because operators are responsible. The real threats there are lasers and kites. This validates our international-first strategy. EU and Canada face the drone problem today. South Africa is our Phase 2 market.",
  },
  {
    number: 9,
    title: "Engineering Velocity: Production-Ready",
    duration: 40,
    icon: "🚀",
    keyPoints: [
      {
        text: "**Week 48 metrics:**",
        subPoints: [
          "370+ commits merged",
          "40+ PRs completed",
          "10+ ADRs published",
        ],
      },
      {
        text: "**Full platform deployed:**",
        subPoints: [
          "RAG integration for documentation",
          "Authentication & authorization",
          "Gamification system",
          "Monitoring & observability",
        ],
      },
      "**Azure Functions + Cosmos DB** backend *fully operational*",
      "Static site on Azure SWA with CI/CD pipelines",
    ],
    speakerNotes:
      "Engineering velocity demonstrates execution capability. Each commit is reviewed and tested.",
    script:
      "Our engineering velocity is exceptional. Week 48 alone saw 370+ commits, 40+ pull requests, and 10+ architecture decision records. The full platform is deployed with RAG integration, authentication, gamification, and monitoring. Azure Functions with Cosmos DB backend is operational. Static site runs on Azure SWA with complete CI/CD pipelines.",
  },
  {
    number: 10,
    title: "Traction: x402 Protocol Live",
    duration: 40,
    icon: "✅",
    keyPoints: [
      "**x402 payment protocol** deployed to *production*",
      {
        text: "**Blockchain micropayments operational:**",
        subPoints: ["Solana mainnet integration", "EtherLink private network", "Real-time settlement"],
      },
      "Evidence verification API *available for integration*",
      {
        text: "**Full security audit completed:**",
        subPoints: [
          "Red-team assessment passed",
          "Zero critical vulnerabilities",
          "All findings remediated",
        ],
      },
    ],
    speakerNotes:
      "Real traction with live product. Security audit shows enterprise readiness.",
    script:
      "We have real traction. The x402 payment protocol is deployed to production with blockchain micropayments running on Solana and EtherLink. Our evidence verification API is available for third-party integration. We completed a full security audit with zero critical vulnerabilities found.",
  },
  {
    number: 11,
    title: "Regulatory Compliance: Built-In from Day 1",
    duration: 45,
    icon: "⚖️",
    keyPoints: [
      {
        text: "**Blockchain evidence trail:**",
        subPoints: [
          "Meets legal admissibility requirements",
          "Cryptographic chain of custody",
          "Tamper-evident logging",
        ],
      },
      {
        text: "**Modular weapons adapt to local regulations:**",
        subPoints: ["Nets for civilian areas", "RF jammers where permitted", "Kinetic for military zones"],
      },
      "**140+ pages** of technical/legal specs (*compliance-first documentation*)",
      {
        text: "**Airspace integration:**",
        subPoints: ["ADS-B transponder data", "FlightRadar24 API", "Local ATC coordination"],
      },
    ],
    speakerNotes:
      "Compliance is a feature, not an afterthought. This differentiates from competitors.",
    script:
      "Regulatory compliance is built into our architecture. Blockchain evidence trails meet legal admissibility requirements. Modular weapons adapt to local regulations - nets for civilian areas, kinetic for military zones. We maintain 140+ pages of compliance documentation. The system integrates with existing airspace management including ADS-B and FlightRadar24.",
  },
  {
    number: 12,
    title: "Deployment Models: Flexible & Scalable",
    duration: 45,
    icon: "🌐",
    layout: "two-column",
    leftColumnTitle: "Mobile Solutions",
    leftColumn: [
      "**Mobile Picket**",
      "Portable UGV-based",
      "Temporary perimeters",
      "Rapid deployment",
    ],
    rightColumnTitle: "Fixed Solutions",
    rightColumn: [
      "**Site-Fixed**",
      "Permanent installation",
      "Airports, prisons, power plants",
      "24/7 coverage",
    ],
    keyPoints: [
      {
        text: "**Fiber Engage:** High-density urban deployment",
        subPoints: ["Fiber backbone coordination", "Multi-node mesh network"],
      },
      {
        text: "**Swarm Defense:** Large area coverage",
        subPoints: ["Multi-unit coordination", "Handoff between zones"],
      },
    ],
    speakerNotes:
      "Multiple deployment models means broader market addressability.",
    script:
      "We support four deployment models. Mobile Picket uses portable UGV platforms for temporary perimeters. Site-Fixed provides permanent installations for airports and critical facilities. Fiber Engage handles high-density urban environments with fiber backbones for coordination. Swarm Defense coordinates multiple units for large area coverage.",
  },
  {
    number: 13,
    title: "Founding Team: 60+ Years Combined Expertise",
    duration: 50,
    icon: "👥",
    layout: "team" as const,
    teamMembers: [
      {
        initials: "JS",
        name: "Jurie Smit",
        title: "Co-Founder & CTO",
        highlights: [
          "15+ years fintech & SaaS platforms",
          "Edge AI/ML & system architecture",
          "B.Eng Industrial-Electronic (Stellenbosch)",
        ],
        color: "#1e40af",
      },
      {
        initials: "MR",
        name: "Martyn Redelinghuys",
        title: "Co-Founder & CEO",
        highlights: [
          "20+ years energy, mining, defense",
          "R500M+ portfolio management",
          "MBA (GIBS), B.Eng (Stellenbosch)",
        ],
        color: "#7c3aed",
      },
      {
        initials: "PL",
        name: "Pieter La Grange",
        title: "Co-Founder & Hardware Lead",
        highlights: [
          "15+ years embedded systems",
          "Medical device production (Snuza)",
          "B.Eng Electrical (Stellenbosch)",
        ],
        color: "#059669",
      },
      {
        initials: "EM",
        name: "Eben Maré",
        title: "Co-Founder & CFO",
        highlights: [
          "15+ years investment banking & PE",
          "Former Head Quant at Deloitte",
          "Phoenix VC founder",
        ],
        color: "#dc2626",
      },
    ],
    keyPoints: [
      "**4 co-founders** with complementary expertise across tech, business, hardware, and finance",
      {
        text: "**Core competencies:**",
        subPoints: [
          "Edge AI & embedded systems",
          "Large-scale project management",
          "Blockchain & cryptographic protocols",
          "Hardware design & manufacturing",
        ],
      },
      "All founders **full-time committed** with significant personal investment",
    ],
    speakerNotes:
      "Team credibility is critical. Each founder brings unique expertise. Emphasize the complementary skills and full-time commitment. The combined 60+ years of experience spans all domains needed for success.",
    script:
      "Our founding team brings over 60 years of combined experience. Jurie leads technology with 15+ years in fintech and AI systems. Martyn drives business development with 20+ years managing R500M+ portfolios in energy and defense. Pieter heads hardware with 15 years in embedded systems and medical device production. Eben handles finance with extensive investment banking and private equity experience. All four founders are full-time committed with skin in the game.",
  },
  {
    number: 14,
    title: "Investment Ask: Series Seed",
    duration: 50,
    icon: "💵",
    keyPoints: [
      "**Raising:** $500K-$1M seed round",
      {
        text: "**Use of funds:**",
        subPoints: [
          "Hardware prototyping: **30%**",
          "EU/Canada market entry: **40%**",
          "Team expansion: **30%**",
        ],
      },
      {
        text: "**Milestones:**",
        subPoints: [
          "5 pilot installations",
          "10 x402 enterprise customers",
          "Key regulatory certifications",
        ],
      },
      "**18-month runway** to Series A with *revenue traction*",
    ],
    speakerNotes:
      "Clear use of funds with specific milestones. The runway to Series A is realistic.",
    script:
      "We're raising a $500K to $1M seed round. Funds will go to hardware prototyping, EU and Canada market entry, and team expansion - 30, 40, 30 percent respectively. Target milestones are 5 pilot installations, 10 x402 enterprise customers, and key regulatory certifications. This provides an 18-month runway to Series A with proven revenue traction.",
  },
  {
    number: 15,
    title: "Next 6 Months: Aggressive Milestones",
    duration: 45,
    icon: "📅",
    keyPoints: [
      {
        text: "**Q1 2026:**",
        subPoints: [
          "Complete net launcher prototype",
          "First pilot installation (EU airport)",
        ],
      },
      {
        text: "**Q2 2026:**",
        subPoints: [
          "x402 enterprise contracts",
          "EU regulatory certification",
          "3 operational installations",
        ],
      },
      {
        text: "**Q3 2026:**",
        subPoints: [
          "Series A fundraise",
          "Proven revenue traction",
          "5 operational installations",
        ],
      },
      {
        text: "**Q4 2026:**",
        subPoints: [
          "Expand to Canada",
          "Manufacturing partnerships at scale",
        ],
      },
    ],
    speakerNotes:
      "Aggressive but achievable roadmap. Each quarter has specific deliverables.",
    script:
      "Our roadmap is aggressive. Q1 2026: Complete net launcher prototype and secure our first EU airport pilot. Q2: Sign x402 enterprise contracts, achieve EU regulatory certification, reach 3 installations. Q3: Raise Series A with proven revenue and 5 operational sites. Q4: Expand to Canada and establish manufacturing partnerships for scale.",
  },
  {
    number: 16,
    title: "Vision: The Standard for Autonomous Defense",
    duration: 40,
    icon: "🌟",
    layout: "title-only",
    keyPoints: [
      "Become the **de facto standard** for counter-drone defense globally",
      "**Open platform** enabling ecosystem of third-party integrations",
      "Expand beyond drones: *Autonomous defense for all aerial threats*",
      "",
      "**IPO candidate:** $2.51B market with clear path to *20%+ market share*",
      "",
      "*Let's build the future of autonomous defense together.*",
    ],
    speakerNotes:
      "End with vision and invitation. Leave them excited about the opportunity.",
    script:
      "Our vision is to become the global standard for counter-drone defense. We're building an open platform that enables an ecosystem of third-party integrations. Beyond drones, we see expansion to all autonomous aerial threat defense. This is an IPO-track company in a $2.51 billion market where we have a clear path to 20%+ market share. Let's build the future of autonomous defense together.",
  },
];

export const pitchDeckMeta = {
  title: "Phoenix Rooivalk: Investor Pitch Deck",
  duration: 12,
  audience: "Investors, Strategic Partners, Enterprise Customers",
  date: "December 2025",
  colorTheme: "investor" as const,
};
