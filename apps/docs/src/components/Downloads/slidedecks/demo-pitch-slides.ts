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
  // TITLE / LANDING SLIDE
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
      "*Sub-200ms response. True offline capability. Blockchain evidence.*",
      "",
      "**Protecting Critical Infrastructure from Aerial Threats**",
    ],
    speakerNotes:
      "Open with confidence. Pause on the tagline. Let the title sink in before moving to the problem.",
    script:
      "Welcome to Phoenix Rooivalk. We're building the next generation of autonomous counter-drone defense systems. Sub-200 millisecond response times. True offline capability. And blockchain-anchored evidence for legal accountability. We protect critical infrastructure from aerial threats.",
  },

  // ==========================================
  // THE PROBLEM - THREAT LANDSCAPE
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
  // EXPANDING THE THREAT - WHY NOW
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
  // THE SOLUTION
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
  // COMPETITIVE ADVANTAGE
  // ==========================================
  {
    number: 5,
    title: "10-150x Faster Than Competitors",
    duration: 45,
    icon: "🏆",
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
  // TEAM
  // ==========================================
  {
    number: 6,
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
  // CALL TO ACTION
  // ==========================================
  {
    number: 7,
    title: "Let's Defend Critical Infrastructure Together",
    duration: 30,
    icon: "🎯",
    layout: "title-only",
    keyPoints: [
      "**Raising:** $500K-$1M Seed Round",
      "",
      "**Next Steps:**",
      "• Technical deep-dive demo",
      "• Pilot program discussion",
      "• Partnership opportunities",
      "",
      "*contact@phoenixrooivalk.com*",
    ],
    speakerNotes:
      "End with clear call to action. Be specific about what you're asking for and what comes next.",
    script:
      "We're raising a $500K to $1M seed round to accelerate our go-to-market. If you're interested, let's schedule a technical deep-dive where we can demonstrate the system in action. We're also exploring pilot programs and strategic partnerships. Let's build the future of autonomous defense together.",
  },
];

export const demoPitchMeta = {
  title: "Phoenix Rooivalk: Demo Pitch",
  duration: 7,
  audience: "Investors, Strategic Partners, Demo Attendees",
  date: "December 2025",
  colorTheme: "investor" as const,
};
