import type { Slide, KeyPoint } from "../SlideDeckDownload";

/**
 * Phoenix Rooivalk Demo Pitch Deck
 * First demo presentation - focused on problem, solution, and immediate value
 *
 * Enhanced with:
 * - Rich text formatting (**bold**, *italic*)
 * - Image layouts for visual impact
 * - Data-driven problem statements
 * - Clear call to action
 */
export const demoPitchSlides: Slide[] = [
  // ==========================================
  // SLIDE 1: TITLE / LANDING
  // ==========================================
  {
    number: 1,
    title: "Phoenix Rooivalk",
    duration: 30,
    icon: "🛡️",
    layout: "title-only",
    keyPoints: [
      "**Autonomous Counter-Drone Defense**",
      "",
      "*Sub-200ms response | True offline | Blockchain evidence*",
      "",
      "**When seconds matter, we respond in milliseconds**",
    ],
    speakerNotes:
      "Open with confidence. Pause on the tagline. Let 'milliseconds' land - it's our core differentiator.",
    script:
      "Welcome to Phoenix Rooivalk. We're building autonomous counter-drone defense that responds in under 200 milliseconds - that's 10 to 150 times faster than anything else on the market. True offline capability for denied environments. Blockchain-anchored evidence for legal accountability. When seconds matter, we respond in milliseconds.",
  },

  // ==========================================
  // SLIDE 2: THE PROBLEM - THREAT LANDSCAPE
  // ==========================================
  {
    number: 2,
    title: "The Problem: Drone Threats Are Escalating",
    duration: 90,
    icon: "🚨",
    layout: "image",
    image: "/img/drone_over_treetops.png",
    imageCaption: "Drone incursions at critical infrastructure are increasing exponentially",
    keyPoints: [
      {
        text: "**Drone attacks are ever increasing** in Military and Civilian environments:",
        subPoints: [
          "**300% increase** in drone swarms globally",
          "**64%** of facilities have *no counter-drone protection*",
          "Ukraine: **1M+ drones** produced in 2024, causing **15%** of casualties",
        ],
      },
      {
        text: "**Current defenses are failing:**",
        subPoints: [
          "**2-5 second response time** - *far too slow*",
          "Cloud-dependent - *fails in denied environments*",
          "No legal evidence chain - *no accountability*",
        ],
      },
      {
        text: "**Recent incidents prove the urgency:**",
        subPoints: [
          "**Nov 2025**: Brussels Airport closed *twice in one night*",
          "European incidents up **4x YoY**",
          "Gatwick 2018: **£60M cost**, perpetrators *never caught*",
        ],
      },
    ],
    speakerNotes:
      "This slide is critical. Let the statistics land. Pause after each major point. The Brussels incident is recent and relatable. Gatwick shows the cost of inaction.",
    script:
      "Drone attacks are escalating rapidly in both military and civilian environments. We've seen a 300% increase in drone swarm attacks globally. 64% of critical facilities have zero counter-drone protection. In Ukraine alone, over 1 million drones were produced in 2024, accounting for 15% of all casualties. Current defense systems are failing us - they take 2 to 5 seconds to respond, which is far too slow. They're cloud-dependent and fail in denied environments. And critically, they provide no legal evidence chain for accountability. Just last month, Brussels Airport was closed twice in one night due to drone incursions. European incidents are up 4x year over year. Remember Gatwick in 2018? £60 million in damages, and the perpetrators were never caught. The threat is real, it's growing, and current solutions aren't working.",
  },

  // ==========================================
  // SLIDE 3: WHY CURRENT SOLUTIONS FALL SHORT
  // ==========================================
  {
    number: 3,
    title: "Why Current Solutions Fall Short",
    duration: 60,
    icon: "❌",
    layout: "two-column",
    leftColumnTitle: "The Gap in Protection",
    leftColumn: [
      "**Airports** - daily incursions worldwide",
      "**Power Plants** - critical infrastructure at risk",
      "**Prisons** - contraband delivery via drone",
      "**Military Bases** - reconnaissance & attack vectors",
      "**Events** - stadiums, concerts, VIP gatherings",
    ],
    rightColumnTitle: "Why Competitors Fail",
    rightColumn: [
      "**5,000-30,000ms** response times",
      "**Require cloud connectivity** to operate",
      "**No offline capability** in RF/GPS denied areas",
      "**Vendor lock-in** with proprietary systems",
      "**No evidence trail** for legal prosecution",
    ],
    keyPoints: [],
    speakerNotes:
      "Walk through the left column first to establish the scope of the threat. Then pivot to why existing solutions don't work. This sets up our differentiation.",
    script:
      "Let me paint the picture of what's at risk. Airports face daily drone incursions worldwide. Power plants and critical infrastructure are vulnerable. Prisons deal with contraband delivery via drone. Military bases face reconnaissance and attack vectors. Major events like stadiums and concerts are exposed. Now, why do current solutions fail? Competitor systems take 5 to 30 seconds to respond - that's an eternity when a drone is traveling at speed. They require cloud connectivity, which means they fail in denied environments. They have no offline capability. They lock you into proprietary systems. And critically, they provide no evidence trail for legal prosecution. When the perpetrators at Gatwick were never caught, it's because there was no admissible evidence chain.",
  },

  // ==========================================
  // SLIDE 4: OUR SOLUTION
  // ==========================================
  {
    number: 4,
    title: "Our Solution: SAE Level 4 Autonomous Defense",
    duration: 60,
    icon: "🛡️",
    keyPoints: [
      "**Sub-200ms** end-to-end response time (*10-150x faster* than competitors)",
      {
        text: "**True autonomy:** Operates where others can't",
        subPoints: [
          "RF-denied operation",
          "GPS-denied operation",
          "Fully offline edge processing",
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
        text: "**Modular weapons:** Adapt to any scenario",
        subPoints: [
          "Nets for soft capture",
          "RF jammers for disruption",
          "Kinetic options for military zones",
        ],
      },
    ],
    speakerNotes:
      "This is our value proposition. Emphasize the 10-150x speed advantage first - it's our strongest differentiator. The blockchain evidence is unique in the market.",
    script:
      "Phoenix Rooivalk delivers SAE Level 4 autonomous counter-drone defense. Sub-200 millisecond response times - that's 10 to 150 times faster than any competitor. We operate with true autonomy in environments where others fail: RF-denied, GPS-denied, fully offline with edge processing. Every engagement generates blockchain-anchored evidence that's legally defensible and court-admissible. Our modular weapon system adapts to any regulatory environment - nets for civilian areas, RF jammers where permitted, kinetic options for military zones.",
  },

  // ==========================================
  // SLIDE 5: COMPETITIVE ADVANTAGE
  // ==========================================
  {
    number: 5,
    title: "Why We Win: 10-150x Speed Advantage",
    duration: 45,
    icon: "⚡",
    layout: "two-column",
    leftColumnTitle: "Phoenix Rooivalk",
    leftColumn: [
      "**50-195ms** response",
      "✅ True offline capability",
      "✅ Blockchain evidence",
      "✅ Open architecture",
      "✅ $25K-$100K systems",
    ],
    rightColumnTitle: "Competitors",
    rightColumn: [
      "**5,000-30,000ms** response",
      "❌ Requires connectivity",
      "❌ No evidence trail",
      "❌ Vendor lock-in",
      "❌ $800K-$1.5M+ systems",
    ],
    keyPoints: [],
    speakerNotes:
      "Let the comparison speak for itself. The visual contrast is powerful. Point to each row as you speak.",
    script:
      "Let's compare directly. Phoenix Rooivalk responds in 50 to 195 milliseconds. Competitors take 5 to 30 seconds. We operate completely offline. They require connectivity. We generate blockchain evidence. They have no evidence trail. Our open architecture prevents lock-in. Their proprietary systems trap you. And we deliver at a fraction of the cost - $25K to $100K versus $800K to over $1.5 million.",
  },

  // ==========================================
  // SLIDE 6: MARKET & BUSINESS MODEL
  // ==========================================
  {
    number: 6,
    title: "Market & Business Model",
    duration: 60,
    icon: "📊",
    layout: "image-right",
    image: "/img/tam-sam-som.svg",
    imageCaption: "Drone Defense Market TAM/SAM/SOM",
    keyPoints: [
      {
        text: "**Market:** $6.64B (2025) → **$20.3B** (2030) at **25.1% CAGR**",
        subPoints: [
          "Counter-drone segment growing at **47%** CAGR",
          "64% of facilities currently *unprotected*",
        ],
      },
      {
        text: "**Revenue model:** Hardware + SaaS + Services",
        subPoints: [
          "Hardware: **60%** (systems $25K-$100K)",
          "SaaS: **25%** (monitoring, updates)",
          "Services: **15%** (training, support)",
        ],
      },
      {
        text: "**Unit economics:**",
        subPoints: [
          "Gross margins: **65-70%** hardware, **80%+** software",
          "CLV:CAC ratio: **6:1 to 10:1**",
        ],
      },
    ],
    speakerNotes:
      "Show the market opportunity is massive and growing. The TAM/SAM/SOM diagram makes the opportunity tangible. Emphasize the recurring revenue model.",
    script:
      "The counter-drone defense market is $6.64 billion today and growing to over $20 billion by 2030 at 25% CAGR. The counter-drone segment specifically is growing at 47% annually. Our serviceable market is $4.2 billion - regional airports and critical infrastructure that can't afford million-dollar systems. Our revenue model combines hardware sales at 60%, SaaS subscriptions at 25% for monitoring and updates, and professional services at 15%. This gives us strong unit economics with 65-70% gross margins on hardware and over 80% on software, with CLV to CAC ratios of 6 to 10 to 1.",
  },

  // ==========================================
  // SLIDE 7: ROADMAP & PROGRESS
  // ==========================================
  {
    number: 7,
    title: "Roadmap & Current Progress",
    duration: 60,
    icon: "🗺️",
    layout: "image",
    image: "/img/roadmap-timeline.svg",
    imageCaption: "18-month runway to Series A with proven traction",
    keyPoints: [
      {
        text: "**Completed** (6 months founder R&D):",
        subPoints: [
          "CAD designs *complete*",
          "Prototype **40% assembled**",
          "Net designs tested with Kevlar stock",
        ],
      },
      {
        text: "**Q1-Q2 2026:** Consumer launch",
        subPoints: [
          "CPSC/ASTM certification (Mar 2026)",
          "SkySnare D2C launch (Apr 2026)",
          "First EU pilot signed",
        ],
      },
      {
        text: "**Q3-Q4 2026:** Scale & Series A",
        subPoints: [
          "5,000 consumer units shipped",
          "3-5 enterprise installations",
          "Series A with proven revenue",
        ],
      },
    ],
    speakerNotes:
      "Show concrete progress and clear milestones. The roadmap demonstrates execution capability. Emphasize that we're not starting from zero.",
    script:
      "Let me show you where we are and where we're going. We've already invested 6 months of founder R&D. CAD designs are complete, the mechanical prototype is 40% assembled, and we've tested net designs with Kevlar fiber stock we already have. Q1 and Q2 2026: We complete CPSC and ASTM certification by March, launch SkySnare direct-to-consumer in April, and sign our first EU pilot. By Q3 and Q4: We ship 5,000 consumer units, deploy 3 to 5 enterprise installations, and close Series A with proven revenue traction. This seed round gives us 18 months of runway with clear path to the next stage.",
  },

  // ==========================================
  // SLIDE 8: TEAM
  // ==========================================
  {
    number: 8,
    title: "Founding Team: 60+ Years Combined Expertise",
    duration: 45,
    icon: "👥",
    layout: "team" as const,
    teamMembers: [
      {
        initials: "JS",
        name: "Jurie Smit",
        title: "Co-Founder & CTO",
        highlights: [
          "15+ years fintech & SaaS",
          "Edge AI/ML architecture",
          "B.Eng (Stellenbosch)",
        ],
        color: "#1e40af",
      },
      {
        initials: "MR",
        name: "Martyn Redelinghuys",
        title: "Co-Founder & CEO",
        highlights: [
          "20+ years energy/defense",
          "R500M+ portfolio mgmt",
          "MBA (GIBS)",
        ],
        color: "#7c3aed",
      },
      {
        initials: "PL",
        name: "Pieter La Grange",
        title: "Hardware Lead",
        highlights: [
          "15+ years embedded",
          "Medical devices (Snuza)",
          "B.Eng (Stellenbosch)",
        ],
        color: "#059669",
      },
      {
        initials: "EM",
        name: "Eben Maré",
        title: "Co-Founder & CFO",
        highlights: [
          "15+ years IB & PE",
          "Head Quant (Deloitte)",
          "Phoenix VC founder",
        ],
        color: "#dc2626",
      },
    ],
    keyPoints: [
      "**Complementary expertise** across tech, business, hardware, and finance",
      "All founders **full-time committed** with significant personal investment",
    ],
    speakerNotes:
      "Quick team overview. Emphasize complementary skills and commitment. Don't linger - investors want to know the team is capable, then move on.",
    script:
      "Our founding team brings over 60 years of combined experience. Jurie leads technology with deep AI and systems architecture expertise. Martyn drives business with 20+ years managing major portfolios in energy and defense. Pieter heads hardware with medical device production experience. Eben handles finance with investment banking and private equity background. All four founders are full-time committed with skin in the game.",
  },

  // ==========================================
  // SLIDE 9: THE ASK - $860K SEED
  // ==========================================
  {
    number: 9,
    title: "The Ask: $860K Seed Round",
    duration: 60,
    icon: "💰",
    layout: "image-right",
    image: "/img/investment-breakdown.svg",
    imageCaption: "18-month runway to Series A",
    keyPoints: [
      {
        text: "**$860K Seed** | 18-month runway",
        subPoints: [
          "**40%** R&D ($344K) - AI/ML, edge processing",
          "**25%** Hardware ($215K) - prototypes, tooling",
          "**15%** Sales ($129K) - D2C launch, pilots",
          "**20%** Ops & Cert ($172K) - legal, IP, compliance",
        ],
      },
      {
        text: "**Milestones to Series A:**",
        subPoints: [
          "**Q2 2026**: CPSC/ASTM cert, D2C launch, first EU pilot",
          "**Q4 2026**: 5K consumer units, 3-5 enterprise installs",
          "**Series A**: $500K+ ARR, proven market traction",
        ],
      },
      {
        text: "**Your Next Step:**",
        subPoints: [
          "**Schedule a live demo** - see sub-200ms in action",
          "*contact@phoenixrooivalk.com*",
        ],
      },
    ],
    speakerNotes:
      "Be specific about the ask and allocation. End with clear next step: schedule the demo.",
    script:
      "We're raising $860K in seed funding. Here's exactly how we'll use it: $344K to R&D for AI and edge processing. $215K to hardware for prototypes and tooling. $129K to sales for our D2C launch and pilot programs. $172K to operations and certifications. This gives us 18 months of runway with clear milestones: certifications and product launch by Q2, 5,000 consumer units and enterprise deployments by Q4, and Series A ready with over $500K in ARR. Your next step? Schedule a live demo and see sub-200 millisecond response time for yourself.",
  },

  // ==========================================
  // SLIDE 10: ROI & EXIT EXPECTATIONS
  // ==========================================
  {
    number: 10,
    title: "Your Return: When & How Much",
    duration: 45,
    icon: "📈",
    layout: "two-column",
    leftColumnTitle: "Exit Timeline",
    leftColumn: [
      "**Series A (Q4 2026):** $5-8M valuation",
      "→ Seed investors: **10-15x paper return**",
      "",
      "**Series B (2028):** $25-40M valuation",
      "→ Early liquidity options available",
      "",
      "**Exit (2029-2030):** Strategic M&A or IPO",
      "→ **25-50x total return potential**",
    ],
    rightColumnTitle: "Why Defense Exits Big",
    rightColumn: [
      "**$4.2B** in defense M&A (2024)",
      "**Anduril:** $14B valuation, 5 years",
      "**Shield AI:** $2.7B valuation, 6 years",
      "**Dedrone:** Acquired by Axon",
      "",
      "**Strategic acquirers actively looking:**",
      "Lockheed, Northrop, L3Harris, Raytheon",
    ],
    keyPoints: [],
    speakerNotes:
      "Investors want to know when they get paid. Be specific about timeline and comparable exits. Defense sector is hot for M&A.",
    script:
      "Let's talk returns. At our target Series A valuation of $5 to $8 million in Q4 2026, seed investors see 10 to 15x paper returns. By Series B in 2028, early liquidity options become available. At exit in 2029 to 2030, we're targeting 25 to 50x total returns. Why are we confident? Defense tech M&A hit $4.2 billion in 2024. Anduril reached $14 billion in 5 years. Shield AI hit $2.7 billion in 6. Dedrone was acquired by Axon. The strategic acquirers - Lockheed, Northrop, L3Harris, Raytheon - they're all actively looking for counter-drone solutions. This is a sector where exits happen and they happen big.",
  },
];

export const demoPitchMeta = {
  title: "Phoenix Rooivalk: Demo Pitch",
  duration: 10,
  audience: "Investors, Strategic Partners, Demo Attendees",
  date: "December 2025",
  colorTheme: "investor" as const,
};
