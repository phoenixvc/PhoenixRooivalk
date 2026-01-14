import type { Slide } from "../SlideDeckDownload";

/**
 * Phoenix Rooivalk Q&A Appendix Slides
 * Backup slides for common investor questions
 *
 * Use after the main pitch to address specific questions
 * Pull up the relevant slide when asked
 */
export const qaAppendixSlides: Slide[] = [
  // ==========================================
  // DEMO VIDEO
  // ==========================================
  {
    number: 1,
    title: "Live Demo: Net Launcher in Action",
    duration: 15,
    icon: "🎬",
    layout: "video",
    video: "/videos/netlauncher-demo-10s.mp4",
    videoCaption: "SkySnare prototype - CO2 pneumatic net launcher",
    keyPoints: [
      "**CO2 pneumatic propulsion** - completely safe",
      "**Net deploys in <200ms** - watch the speed",
      "**Captures target intact** - no damage",
      "**Reusable** - just reload the net",
    ],
    speakerNotes:
      "Play the 10s demo. Let it speak for itself. Point out the speed and clean capture.",
    script:
      "Here's our net launcher in action. Watch the deployment speed - under 200 milliseconds. CO2 pneumatic propulsion, completely safe. The net captures the target intact. And it's reusable - just reload. This is our SkySnare consumer prototype.",
  },

  // ==========================================
  // Q: IS THIS LEGAL?
  // ==========================================
  {
    number: 2,
    title: "Q: Is this legal?",
    duration: 30,
    icon: "⚖️",
    layout: "default",
    keyPoints: [
      {
        text: "**Yes - pneumatic/CO2 requires NO permits**",
        subPoints: [
          "Not classified as a firearm (no propellant explosion)",
          "Same category as paintball/airsoft",
          "No federal licensing required in US/EU",
        ],
      },
      {
        text: "**Certifications we're pursuing:**",
        subPoints: [
          "CPSC/ASTM (US consumer safety) - Q2 2026",
          "CE marking (EU) - Q2 2026",
          "EN-71 (toy safety standards)",
        ],
      },
      {
        text: "**What IS regulated:**",
        subPoints: [
          "RF jamming - we DON'T do this",
          "Pyrotechnic propellants - we DON'T use these",
          "Kinetic interceptors - only in RKV (military) line",
        ],
      },
    ],
    speakerNotes:
      "Key point: pneumatic = paintball category. We avoid regulated tech (RF jamming, pyro).",
    script:
      "Yes, completely legal. Pneumatic and CO2 propulsion isn't classified as a firearm - it's the same category as paintball guns. No federal permits required in US or EU. We're pursuing CPSC and CE certification for consumer safety by Q2. What IS regulated: RF jamming - we don't do that. Pyrotechnic propellants - we don't use those. We specifically designed to stay in the legal sweet spot.",
  },

  // ==========================================
  // Q: COMPETITION
  // ==========================================
  {
    number: 3,
    title: "Q: What about SkyWall / Dedrone / DroneShield?",
    duration: 45,
    icon: "🏆",
    layout: "default",
    keyPoints: [
      {
        text: "**Net launchers (direct competitors):**",
        subPoints: [
          "**SkyWall** (OpenWorks UK) - $30-50K+, 10kg, military/LE only",
          "**MITLA** (Ukraine) - $90 disposable, pyrotechnic, may detonate warhead",
          "**Fortem DroneHunter** - $100K+ drone interceptor system",
        ],
      },
      {
        text: "**Detection-only (indirect):**",
        subPoints: [
          "**Dedrone** - Detection only, no capture, acquired by Axon 2024",
          "**DroneShield** - Detection + RF jamming, $800K+ systems",
        ],
      },
      {
        text: "**Our advantage:**",
        subPoints: [
          "✅ 10-100x cheaper ($349 vs $30K+)",
          "✅ Consumer-accessible (no permits)",
          "✅ Integrated detection + capture",
          "✅ Blockchain evidence (unique)",
          "✅ 6 product lines vs single-product competitors",
        ],
      },
    ],
    speakerNotes:
      "Know competitors cold. We're cheaper, safer, and broader product range.",
    script:
      "Let's compare. SkyWall is $30,000+ and military only. MITLA is disposable, uses pyrotechnic that can detonate drone warheads. Fortem DroneHunter is a $100K drone interceptor system. Dedrone was acquired by Axon - they're detection only, no capture. DroneShield does RF jamming which is illegal in most civilian contexts. We're 10 to 100 times cheaper, require no permits, integrate detection with capture, and we're the only ones with blockchain evidence. Plus we have 6 product lines versus their single products.",
  },

  // ==========================================
  // Q: TECHNICAL / AI
  // ==========================================
  {
    number: 4,
    title: "Q: How does the AI detection work?",
    duration: 30,
    icon: "🤖",
    layout: "two-column",
    leftColumnTitle: "Detection",
    leftColumn: [
      "**YOLOv9** object detection",
      "Trained on 50K+ drone images",
      "**99.5% accuracy**",
      "**<0.3% false positive**",
    ],
    rightColumnTitle: "Hardware",
    rightColumn: [
      "**NVIDIA Jetson** edge compute",
      "100 TOPS on-device",
      "**Sub-200ms** total response",
      "Works completely **offline**",
    ],
    keyPoints: [
      "",
      {
        text: "**Why edge AI matters:**",
        subPoints: [
          "No internet required - works in RF-denied environments",
          "No cloud latency - 10-150x faster than competitors",
          "Privacy - data never leaves the device",
        ],
      },
    ],
    speakerNotes:
      "Technical depth for engineer investors. Hit the numbers: 99.5% accuracy, <0.3% false positive, sub-200ms.",
    script:
      "We use YOLOv9 for object detection, trained on over 50,000 drone images. 99.5% accuracy with less than 0.3% false positive rate. Running on NVIDIA Jetson with 100 TOPS of compute. Sub-200 millisecond total response time. The key: it's edge AI, completely on-device. No internet required - works in RF-denied environments. No cloud latency - that's why we're 10 to 150 times faster. And data never leaves the device for privacy.",
  },

  // ==========================================
  // Q: BLOCKCHAIN / EVIDENCE
  // ==========================================
  {
    number: 5,
    title: "Q: Why blockchain? Isn't that overkill?",
    duration: 30,
    icon: "🔗",
    layout: "default",
    keyPoints: [
      {
        text: "**The Gatwick problem:**",
        subPoints: [
          "Dec 2018 - 140,000 passengers stranded",
          "£60M+ in damages",
          "Perpetrators: **never caught**",
          "Why? No admissible evidence chain",
        ],
      },
      {
        text: "**Our solution:**",
        subPoints: [
          "Every detection → hashed → anchored to Solana",
          "**$0.0003/transaction** - ~$150/year continuous logging",
          "Tamper-proof chain of custody",
          "Court-admissible documentation",
        ],
      },
      "**Prosecution enables deterrence** - this is how you stop incidents",
    ],
    speakerNotes:
      "Gatwick story sells this. Without evidence, no prosecution. Without prosecution, no deterrence.",
    script:
      "Remember Gatwick 2018? 140,000 passengers stranded, £60 million in damages. The perpetrators were never caught. Why? No admissible evidence chain. Our solution: every detection gets hashed and anchored to Solana blockchain. Costs us about $150 a year for continuous logging. Creates a tamper-proof chain of custody that's court-admissible. Prosecution enables deterrence - that's how you actually stop these incidents.",
  },

  // ==========================================
  // Q: UNIT ECONOMICS
  // ==========================================
  {
    number: 6,
    title: "Q: What are your margins?",
    duration: 30,
    icon: "💰",
    layout: "two-column",
    leftColumnTitle: "Consumer (SkySnare)",
    leftColumn: [
      "MSRP: **$349**",
      "COGS: **$145**",
      "Gross margin: **58%**",
      "CAC: **$45** (D2C/influencer)",
      "Return rate: **<3%**",
    ],
    rightColumnTitle: "Enterprise (AeroNet)",
    rightColumn: [
      "Setup: **$150K**",
      "Monthly: **$25K**",
      "Gross margin: **44%**",
      "Sales cycle: 6-9 months",
      "LTV: **$450K+**",
    ],
    keyPoints: [
      "",
      {
        text: "**Cost advantage: In-house Kevlar net manufacturing**",
        subPoints: [
          "60% cost reduction vs imports",
          "No lead time delays",
          "Full IP protection",
        ],
      },
    ],
    speakerNotes:
      "Strong margins on both sides. In-house manufacturing is the key advantage.",
    script:
      "Consumer: SkySnare at $349, COGS of $145, gives us 58% gross margin. CAC is $45 through D2C and influencer channels. Return rate under 3%. Enterprise: AeroNet at $150K setup plus $25K monthly, 44% gross margin, LTV over $450K. Our key cost advantage: in-house Kevlar net manufacturing from domestic stock. 60% cost reduction versus imports, no lead time delays, and we keep full IP protection.",
  },

  // ==========================================
  // Q: GO-TO-MARKET
  // ==========================================
  {
    number: 7,
    title: "Q: Who's your first customer?",
    duration: 30,
    icon: "🎯",
    layout: "default",
    keyPoints: [
      {
        text: "**Consumer first (SkySnare) - Q2/Q3 2026:**",
        subPoints: [
          "D2C website + Amazon",
          "Influencer marketing (outdoor sports)",
          "Target: Active families, HHI $75K+",
          "Geography: US first, then EU (CE marking)",
        ],
      },
      {
        text: "**Enterprise second (AeroNet) - Q4 2026:**",
        subPoints: [
          "Regional airports (not hubs - faster sales)",
          "Event venues, stadiums",
          "Critical infrastructure",
        ],
      },
      {
        text: "**Target markets (from team chat):**",
        subPoints: [
          "Germany, Poland, Baltics, Balkans",
          "Where 77% believe war with Russia is imminent",
          "Fear = urgency = faster sales cycle",
        ],
      },
    ],
    speakerNotes:
      "Consumer funds enterprise. Eastern Europe is hot market due to war fears.",
    script:
      "Consumer first with SkySnare, Q2/Q3 2026. D2C and Amazon, influencer marketing. Target is active families with higher income. US first, then EU. Enterprise follows Q4 2026 - regional airports, event venues. Our hot markets: Germany, Poland, Baltics where 77% believe war is imminent. Fear creates urgency and faster sales cycles.",
  },

  // ==========================================
  // Q: INTELLECTUAL PROPERTY
  // ==========================================
  {
    number: 8,
    title: "Q: Do you have patents?",
    duration: 20,
    icon: "📜",
    layout: "default",
    keyPoints: [
      {
        text: "**Patent status:**",
        subPoints: [
          "Provisional patent filing: **Q1 2026**",
          "Focus: Integrated detection + capture system",
          "Focus: Blockchain evidence anchoring method",
        ],
      },
      {
        text: "**Trade secrets (harder to copy):**",
        subPoints: [
          "AI model training data (50K+ images)",
          "Net deployment mechanism optimization",
          "In-house Kevlar manufacturing process",
        ],
      },
      {
        text: "**Moats beyond IP:**",
        subPoints: [
          "Speed moat: Edge AI architecture not easily retrofitted",
          "Cost moat: Vertical integration on nets",
          "Evidence moat: Blockchain from day 1, not bolted on",
        ],
      },
    ],
    speakerNotes:
      "Patent filing Q1. But real moat is trade secrets + architectural choices.",
    script:
      "Provisional patent filing Q1 2026, covering integrated detection plus capture and our blockchain evidence method. But our real protection is trade secrets: 50,000+ training images, net deployment optimization, in-house manufacturing. And architectural moats - our edge AI isn't easily retrofitted onto cloud systems. Vertical integration on nets gives us cost advantage. Blockchain from day 1 is hard to bolt on later.",
  },

  // ==========================================
  // Q: FUNDING STATUS
  // ==========================================
  {
    number: 9,
    title: "Q: Who else is in the round?",
    duration: 20,
    icon: "🤝",
    layout: "default",
    keyPoints: [
      {
        text: "**Round structure:**",
        subPoints: [
          "**$960K** on SAFE",
          "**$3.5M pre-money** cap",
          "18-month runway to Series A",
        ],
      },
      {
        text: "**Current status:**",
        subPoints: [
          "Founder capital committed",
          "Actively speaking with angels and micro-VCs",
          "Defense-focused investors prioritized",
        ],
      },
      {
        text: "**Use of funds:**",
        subPoints: [
          "40% Engineering ($384K)",
          "25% Hardware ($240K)",
          "15% Sales ($144K)",
          "20% Ops + Cert ($192K)",
        ],
      },
    ],
    speakerNotes:
      "Transparent about round status. Focus on milestone-based execution.",
    script:
      "We're raising $960K on a SAFE at $3.5 million pre-money cap. Currently have founder capital committed, actively speaking with angels and micro-VCs, prioritizing defense-focused investors. Use of funds: 40% to engineering, 25% to hardware prototypes, 15% to sales and D2C launch, 20% to operations and certifications. This gives us 18 months runway to Series A.",
  },

  // ==========================================
  // Q: EXIT / ACQUIRERS
  // ==========================================
  {
    number: 10,
    title: "Q: Who would acquire you?",
    duration: 30,
    icon: "🚀",
    layout: "default",
    keyPoints: [
      {
        text: "**Recent C-UAS M&A:**",
        subPoints: [
          "**Dedrone** → Axon (2024) - detection company",
          "**DroneShield** - ASX $400M+ market cap",
          "**Fortem** - $100M+ raised, acquisition target",
        ],
      },
      {
        text: "**Strategic buyers with C-UAS gaps:**",
        subPoints: [
          "**Lockheed Martin** - defense prime",
          "**Northrop Grumman** - defense prime",
          "**L3Harris** - defense electronics",
          "**Raytheon** - missiles, expanding to C-UAS",
          "**Axon** - already acquired Dedrone, wants capture",
        ],
      },
      {
        text: "**Why we're attractive:**",
        subPoints: [
          "Consumer revenue = de-risked technology",
          "Blockchain evidence = unique differentiation",
          "6 product lines = platform, not single product",
        ],
      },
    ],
    speakerNotes:
      "Know the acquirers. Axon already bought Dedrone - they want capture next.",
    script:
      "Recent M&A: Dedrone was acquired by Axon in 2024 - they're in this space. DroneShield is at $400 million market cap on ASX. Fortem has raised over $100 million and is an acquisition target. Strategic buyers: Lockheed, Northrop, L3Harris, Raytheon - all defense primes with C-UAS gaps. Axon already bought Dedrone for detection, they'll want capture next. Why we're attractive: consumer revenue de-risks the tech, blockchain evidence is unique, and we're a platform with 6 product lines, not a single product.",
  },

  // ==========================================
  // Q: TIMELINE / WHEN SHIP
  // ==========================================
  {
    number: 11,
    title: "Q: When do you actually ship?",
    duration: 20,
    icon: "📅",
    layout: "default",
    keyPoints: [
      {
        text: "**Q1 2026:**",
        subPoints: [
          "Prototype complete",
          "Patent filing",
          "Begin certification testing",
        ],
      },
      {
        text: "**Q2 2026:**",
        subPoints: [
          "CPSC/ASTM/CE certification",
          "D2C website launch",
          "First consumer sales",
        ],
      },
      {
        text: "**Q3 2026:**",
        subPoints: [
          "**First deliveries** (preorders)",
          "Scale to 5K units",
          "Enterprise pilot deployment",
        ],
      },
      {
        text: "**Q4 2026:**",
        subPoints: [
          "10K consumer units",
          "3-5 enterprise installations",
          "Series A preparation",
        ],
      },
    ],
    speakerNotes:
      "Concrete timeline. First deliveries Q3 2026. Series A prep Q4.",
    script:
      "Concrete timeline. Q1: prototype complete, patent filing, certification testing. Q2: certifications done, D2C website live, first consumer sales. Q3: first preorder deliveries, scale to 5,000 units, enterprise pilot. Q4: 10,000 consumer units, 3 to 5 enterprise installations, Series A preparation.",
  },

  // ==========================================
  // Q: RISK FACTORS
  // ==========================================
  {
    number: 12,
    title: "Q: What could go wrong?",
    duration: 30,
    icon: "⚠️",
    layout: "default",
    keyPoints: [
      {
        text: "**Regulatory risk:**",
        subPoints: [
          "Mitigation: Designed to stay in legal sweet spot",
          "No RF jamming, no pyrotechnic, pneumatic only",
        ],
      },
      {
        text: "**Certification delays:**",
        subPoints: [
          "Mitigation: CPSC/ASTM process well understood",
          "Buffer built into timeline",
        ],
      },
      {
        text: "**Competition from big defense:**",
        subPoints: [
          "Mitigation: They focus on military ($1M+ systems)",
          "Consumer market is our beachhead",
        ],
      },
      {
        text: "**Supply chain (Jetson, components):**",
        subPoints: [
          "Mitigation: Alternative suppliers identified",
          "In-house net manufacturing reduces dependency",
        ],
      },
    ],
    speakerNotes:
      "Acknowledge risks but show mitigation. Investors appreciate honesty.",
    script:
      "Let me be honest about risks. Regulatory: we've designed to stay legal - no RF jamming, no pyro. Certification delays: CPSC process is well understood, we have buffer. Big defense competition: they focus on million-dollar military systems, consumer is our beachhead. Supply chain: we have alternative suppliers and in-house net manufacturing reduces dependency.",
  },

  // ==========================================
  // PRODUCT SPECS (DETAILED)
  // ==========================================
  {
    number: 13,
    title: "Product Specs: Highly Configurable",
    duration: 30,
    icon: "📋",
    layout: "default",
    keyPoints: [
      {
        text: "**SkySnare (Consumer) - $349**",
        subPoints: [
          "Range: 15-30m",
          "Weight: ~1.2kg",
          "Propellant: CO2 cartridge",
          "Reusable: Yes ($1-2/shot)",
        ],
      },
      {
        text: "**NetSnare (Commercial) - $200-$2,000**",
        subPoints: [
          "Range: 25-50m",
          "Ground-mounted launcher",
          "Pneumatic propulsion",
          "Pairs with SkyWatch detection",
        ],
      },
      {
        text: "**NetSentry Pro (Facility) - $150-$2,000**",
        subPoints: [
          "Range: 25-75m",
          "Hybrid spring + CO2",
          "Multiple net sizes",
          "Integrated with AeroNet platform",
        ],
      },
      "",
      "**All specs configurable** - different nets, ranges, mounting options",
    ],
    speakerNotes:
      "For technical investors who want specs. Emphasize configurability.",
    script:
      "Detailed specs. SkySnare consumer at $349: 15 to 30 meter range, 1.2 kilos, CO2 cartridge, fully reusable at $1-2 per shot. NetSnare commercial: 25 to 50 meter range, ground-mounted, pneumatic. NetSentry Pro for facilities: up to 75 meter range, hybrid propulsion, integrates with our AeroNet platform. All specs are configurable - different nets, ranges, mounting options based on customer needs.",
  },
];

export const qaAppendixMeta = {
  title: "Phoenix Rooivalk: Q&A Appendix",
  duration: 0, // Not a timed presentation
  audience: "Investors (Q&A backup)",
  date: "January 2026",
  colorTheme: "investor" as const,
};

/**
 * Quick reference for which slide to pull:
 *
 * Q: "Can I see a demo?"           → Slide 1 (Demo Video)
 * Q: "Is this legal?"              → Slide 2 (Legal)
 * Q: "What about competitors?"     → Slide 3 (Competition)
 * Q: "How does the AI work?"       → Slide 4 (Technical)
 * Q: "Why blockchain?"             → Slide 5 (Evidence)
 * Q: "What are your margins?"      → Slide 6 (Unit Economics)
 * Q: "Who's your first customer?"  → Slide 7 (GTM)
 * Q: "Do you have patents?"        → Slide 8 (IP)
 * Q: "Who else is investing?"      → Slide 9 (Funding)
 * Q: "Who would acquire you?"      → Slide 10 (Exit)
 * Q: "When do you ship?"           → Slide 11 (Timeline)
 * Q: "What could go wrong?"        → Slide 12 (Risks)
 * Q: "What are the specs?"         → Slide 13 (Product Specs)
 */
