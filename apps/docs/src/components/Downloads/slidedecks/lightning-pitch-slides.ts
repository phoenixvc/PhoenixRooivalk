import type { Slide } from "../SlideDeckDownload";

/**
 * Phoenix Rooivalk Lightning Pitch (150 seconds / 2.5 minutes)
 * Optimized for quick investor meetings and pitch competitions
 *
 * Structure:
 * - Problem + FPV video clip (40s)
 * - Solution (20s)
 * - Consumer Products - Pieter (25s)
 * - Team (15s)
 * - Financials - Eben (30s)
 * - Market/Why Now (20s)
 */
export const lightningPitchSlides: Slide[] = [
  // ==========================================
  // SLIDE 1: PROBLEM + FPV CLIP (40s)
  // ==========================================
  {
    number: 1,
    title: "This Is Happening Right Now",
    duration: 40,
    icon: "🚨",
    layout: "video",
    video: "/videos/fpv-kills-short.mp4",
    videoCaption: "FPV drone combat footage (Ukraine)",
    keyPoints: [
      {
        text: "**The threat is proven and coming home:**",
        subPoints: [
          "FPV drones causing **mass casualties** in Ukraine daily",
          "**FCC bans DJI drones Dec 2025** (national security) [WaPo]",
          "Brussels Airport closed **twice in one night** (Nov 2025)",
        ],
      },
      "**64% of facilities have ZERO protection**",
      "Current systems: **$800K+** and **5-30 second** response",
      "*There's nothing affordable to protect your home.*",
    ],
    speakerNotes:
      "Play video first - let it sink in. Then hit DJI ban (verified), Brussels incident. End with 'nothing affordable' - pause for effect.",
    script:
      "[PLAY VIDEO] This is happening right now. FPV drones are causing mass casualties in Ukraine daily. The FCC just banned DJI drones in December citing national security. Brussels Airport closed twice in one night last November. 64% of critical facilities have zero drone protection. Current military systems cost $800,000 and take 5 to 30 seconds to respond. There's nothing affordable to protect your home. Until now.",
  },

  // ==========================================
  // SLIDE 2: SOLUTION + DEMO VIDEO (20s)
  // ==========================================
  {
    number: 2,
    title: "Capture Drones Safely. No Damage.",
    duration: 20,
    icon: "🛡️",
    layout: "video",
    video: "/videos/netlauncher-poc-short.mp4",
    videoCaption: "SkySnare prototype - CO₂ pneumatic net launcher",
    keyPoints: [
      "**Sub-second response** vs 5-30s military systems",
      "**No training required** - point and shoot",
      "**Works day or night** - no radar, no jamming",
      "**Portable** - single operator, reusable nets",
      "**Affordable** - Starting at **$349**",
    ],
    speakerNotes:
      "Play demo video while talking. Quick pivot from fear to hope. Emphasize: safe, legal, affordable.",
    script:
      "[PLAY DEMO] Phoenix Rooivalk. We capture drones safely with no damage. CO₂ net launchers - safe propellant, no permits needed. Legal and non-destructive. Starting at just $349.",
  },

  // ==========================================
  // SLIDE 2b: PROOF - CAUGHT DRONE (5s)
  // ==========================================
  {
    number: 3,
    title: "It Works.",
    duration: 5,
    icon: "✅",
    layout: "image",
    image: "/img/drone-caught.jpeg",
    imageCaption: "Drone captured safely - no damage, ready for evidence",
    keyPoints: [],
    speakerNotes:
      "Let the image speak. 5 seconds of silence while they process. This is the proof.",
    script:
      "[PAUSE - let image sink in] This is what success looks like. Captured safely. Evidence preserved.",
  },

  // ==========================================
  // SLIDE 4: CONSUMER PRODUCTS - PIETER (25s)
  // ==========================================
  {
    number: 4,
    title: "Protect Your Home",
    duration: 25,
    icon: "🏠",
    layout: "products",
    presenter: "Pieter",
    keyPoints: [],
    productCards: [
      {
        name: "SkySnare",
        tagline: "Point & Shoot Protection",
        description:
          "Handheld drone capture. Aim, fire, catch. No training required.",
        price: "$349",
        delivery: "Jul 2026",
        badges: ["SEED", "PREORDER OPEN"],
        color: "#f97316",
        specs: [
          { label: "Range", value: "15-30m" },
          { label: "Net", value: "2m × 2m" },
        ],
      },
      {
        name: "SkyWatch Nano",
        tagline: "See Threats Coming",
        description:
          "AI camera that spots drones and alerts your phone. Easy setup.",
        price: "$99",
        delivery: "Sep 2026",
        badges: ["SEED", "PREORDER OPEN"],
        color: "#f97316",
        specs: [
          { label: "Range", value: "30-50m" },
          { label: "Alerts", value: "App + Audio" },
        ],
      },
      {
        name: "NetSnare Lite",
        tagline: "Automated Defense",
        description:
          "Ground-mounted launcher. Pairs with SkyWatch for auto-capture.",
        price: "$200-400",
        delivery: "Jan 2027",
        badges: ["SEED", "PREORDER OPEN"],
        color: "#f97316",
        specs: [
          { label: "Range", value: "10-20m" },
          { label: "Trigger", value: "App/Auto" },
        ],
      },
    ],
    speakerNotes:
      "PIETER DELIVERS THIS SLIDE. Show the 3 consumer products. SkySnare handheld, SkyWatch Nano camera, NetSnare auto-launcher. Emphasize staggered release - first product July.",
    script:
      "Three products to protect your home. SkySnare - point and shoot, $349, shipping July. SkyWatch Nano - AI detection camera, $99, September. NetSnare Lite - automated ground launcher, from $200, January 2027. Preorders open now.",
  },

  // ==========================================
  // SLIDE 5: TEAM (15s)
  // ==========================================
  {
    number: 5,
    title: "The Team",
    duration: 15,
    icon: "👥",
    layout: "team" as const,
    teamMembers: [
      {
        initials: "JS",
        name: "Jurie Smit",
        title: "Founder",
        highlights: ["Industrial-Electronic Eng", "18 yrs software"],
        color: "#f97316",
        image: "/team/jurie.jpeg",
      },
      {
        initials: "PL",
        name: "Pieter La Grange",
        title: "Co-Founder",
        highlights: ["Electronic Eng", "🚀 Flight Club 637km/h WR"],
        color: "#ea580c",
        image: "/team/pieter.jpeg",
      },
      {
        initials: "MR",
        name: "Martyn Redelinghuys",
        title: "Supplier/Advisor",
        highlights: ["Electrical Eng", "🚀 Plastics mfg"],
        color: "#fb923c",
        image: "/team/martyn.png",
      },
      {
        initials: "EM",
        name: "Eben Maré",
        title: "Advisor",
        highlights: ["Head Quant", "Previous exit"],
        color: "#fbbf24",
        image: "/team/eben.jpeg",
      },
      {
        initials: "CF",
        name: "Chanelle Fellinger",
        title: "Advisor",
        highlights: ["EU expansion", "UK exit (family)"],
        color: "#a855f7",
        image: "/team/chanelle.png",
      },
      {
        initials: "AK",
        name: "Alistair Kim",
        title: "Advisor",
        highlights: ["Drone exit", "Defense"],
        color: "#06b6d4",
      },
    ],
    keyPoints: [],
    speakerNotes:
      "15 seconds max. Hit the founders first, then advisors briefly. Emphasize Pieter's 20+ years in drones and connection to world record holders.",
    script:
      "Two founders full-time. Jurie - 18 years software, AI/ML. Pieter - building drones since the early 2000s, personal friends with the world record holders. Advisors with exits in drones, finance, and our EU expansion lead.",
  },

  // ==========================================
  // SLIDE 6: FINANCIALS - EBEN (30s)
  // ==========================================
  {
    number: 6,
    title: "The Ask: $960K Seed",
    duration: 30,
    icon: "💰",
    layout: "two-column",
    presenter: "Eben",
    leftColumnTitle: "Use of Funds",
    leftColumn: [
      "**40%** Engineering — AI/ML, edge processing",
      "**25%** Hardware — prototypes, tooling",
      "**15%** Sales — D2C launch",
      "**20%** Ops — patents, certifications",
    ],
    rightColumnTitle: "Milestones",
    rightColumn: [
      "**Q3'26–Q1'27** — Staggered certified product releases",
      "**Q3 2027** — $500K+ ARR",
      "**Q4 2027** — Series A ready",
      "**18-month runway** to profitability",
    ],
    keyPoints: [
      "**$960K Seed** on SAFE | **$3.5M pre-money cap**",
    ],
    speakerNotes:
      "EBEN DELIVERS THIS SLIDE. Clear terms, clear use of funds, clear milestones. No ambiguity.",
    script:
      "We're raising $960K on a SAFE at $3.5 million pre-money cap. 40% to engineering, 25% to hardware, 15% to D2C sales launch, 20% to ops. Milestones: staggered product releases Q3 2026 through Q1 2027, $500K ARR by Q3 2027, Series A ready Q4 2027. 18-month runway to profitability.",
  },

  // ==========================================
  // SLIDE 7: MARKET / WHY NOW (20s)
  // ==========================================
  {
    number: 7,
    title: "Why Now: $14B+ in 2025",
    duration: 20,
    icon: "📈",
    layout: "two-column",
    leftColumnTitle: "Government C-UAS Funding",
    leftColumn: [
      "**US:** **$7.5B** DoD + $500M FEMA",
      "**UK:** **$600M+** DragonFire + MOD",
      "**EU:** **€500M** France + NATO initiatives",
      "*Governments finally got serious*",
    ],
    rightColumnTitle: "Market Opportunity",
    rightColumn: [
      "**$6.64B → $20.31B** by 2030",
      "**25% CAGR** growth rate",
      "**Target:** Germany, Poland, Baltics",
      "*Where 77% believe war is imminent*",
    ],
    keyPoints: [],
    speakerNotes:
      "Quick market validation. $14B proves governments are serious. Eastern Europe is the beachhead - fear is real there.",
    script:
      "Governments got serious in 2025. Over $14 billion in C-UAS funding. US committed $8 billion, UK $600 million, France and NATO another half billion. Market tripling to $20 billion by 2030. Our beachhead: Eastern Europe, where 77% believe war is coming.",
  },

  // ==========================================
  // BACKUP SLIDES - After Questions
  // ==========================================

  // ==========================================
  // BACKUP 1: BLOCKCHAIN EVIDENCE
  // ==========================================
  {
    number: 8,
    title: "Blockchain Evidence Chain",
    duration: 60,
    icon: "🔗",
    layout: "two-column",
    leftColumnTitle: "Why It Matters",
    leftColumn: [
      "**Gatwick 2018:** 1,000 flights cancelled",
      "**Zero prosecutions** - no evidence chain",
      "Drone recovered but **inadmissible**",
      "*Without evidence, there's no justice*",
    ],
    rightColumnTitle: "Our Solution",
    rightColumn: [
      "**Solana + EtherLink** anchoring",
      "Immutable timestamp + hash",
      "Court-admissible chain of custody",
      "Evidence preserved **on capture**",
    ],
    keyPoints: [
      "**Unique differentiator:** We're the only C-UAS with built-in legal accountability",
    ],
    speakerNotes:
      "BACKUP SLIDE. Use if asked about evidence or legal admissibility. Gatwick case is powerful - everyone remembers it.",
    script:
      "Remember Gatwick 2018? 1,000 flights cancelled, chaos for days. They found the drone. Zero prosecutions. Why? No admissible evidence chain. We solve this. Every capture is anchored to Solana and EtherLink - immutable timestamp, cryptographic hash, court-admissible chain of custody. We're the only C-UAS with built-in legal accountability.",
  },

  // ==========================================
  // BACKUP 2: TECHNICAL ARCHITECTURE
  // ==========================================
  {
    number: 9,
    title: "Technical Architecture",
    duration: 60,
    icon: "🏗️",
    layout: "two-column",
    leftColumnTitle: "Edge AI Processing",
    leftColumn: [
      "**On-device inference** - no cloud dependency",
      "**<100ms** detection to decision",
      "Works **offline** in contested environments",
      "**Privacy-first:** footage stays local",
    ],
    rightColumnTitle: "Sensor Fusion",
    rightColumn: [
      "**Visual** — 4K camera, thermal option",
      "**Acoustic** — audio signature detection",
      "**RF** — frequency scanning",
      "**Multi-modal** confirmation reduces false positives",
    ],
    keyPoints: [
      "**Edge-first architecture** — faster, private, resilient",
    ],
    speakerNotes:
      "BACKUP SLIDE. Use for technical investors. Emphasize edge processing and offline capability.",
    script:
      "Our architecture is edge-first. All AI inference happens on-device - no cloud dependency, sub-100ms response, works completely offline. Privacy-first: footage never leaves the device. Sensor fusion combines visual, acoustic, and RF data for multi-modal confirmation. This dramatically reduces false positives while maintaining speed.",
  },

  // ==========================================
  // BACKUP 3: COMPETITIVE LANDSCAPE
  // ==========================================
  {
    number: 10,
    title: "Competitive Landscape",
    duration: 60,
    icon: "⚔️",
    layout: "two-column",
    leftColumnTitle: "Enterprise ($100K+)",
    leftColumn: [
      "**DroneShield** — $800K+ systems",
      "**Dedrone** — enterprise SaaS only",
      "**Fortem** — military focus, $500K+",
      "*All targeting government/enterprise*",
    ],
    rightColumnTitle: "Our Gap",
    rightColumn: [
      "**Consumer:** $99-$599 range",
      "**Prosumer:** $599-$3K range",
      "**SMB:** $3K-$50K range",
      "*Nobody serving this $6B segment*",
    ],
    keyPoints: [
      "**Blue ocean:** Consumer/prosumer C-UAS is uncontested",
    ],
    speakerNotes:
      "BACKUP SLIDE. Use if asked about competition. Key point: we're not competing with DroneShield - different market entirely.",
    script:
      "DroneShield, Dedrone, Fortem - they're all fighting over the enterprise and military market with $500K+ systems. We're not competing with them. We're going after the uncontested consumer and prosumer market. $99 to $3,000 price points. Nobody is serving this $6 billion segment. It's blue ocean.",
  },

  // ==========================================
  // BACKUP 4: IP/PATENTS STRATEGY
  // ==========================================
  {
    number: 11,
    title: "IP & Defensibility",
    duration: 45,
    icon: "🛡️",
    layout: "two-column",
    leftColumnTitle: "Patent Strategy",
    leftColumn: [
      "**Provisional filed** — net deployment mechanism",
      "**In progress** — AI detection algorithms",
      "**Trade secrets** — training data, models",
      "**12-month** patent roadmap",
    ],
    rightColumnTitle: "Moats",
    rightColumn: [
      "**Data moat** — proprietary drone signatures",
      "**Integration** — blockchain + detection + capture",
      "**First mover** — consumer C-UAS category",
      "**Brand** — Phoenix Rooivalk recognition",
    ],
    keyPoints: [
      "**Multiple moats:** patents, data, integration, and first-mover advantage",
    ],
    speakerNotes:
      "BACKUP SLIDE. Use if asked about defensibility. Emphasize the combination of moats, not just patents.",
    script:
      "We have multiple moats. Provisional patent filed on our net deployment mechanism, AI detection patents in progress. Our training data and models are trade secrets. But patents alone don't win - we're building a data moat with proprietary drone signatures, deep integration across blockchain, detection, and capture, plus first-mover advantage in consumer C-UAS.",
  },

  // ==========================================
  // BACKUP 5: REGULATORY PATH
  // ==========================================
  {
    number: 12,
    title: "Regulatory Compliance",
    duration: 45,
    icon: "📋",
    layout: "two-column",
    leftColumnTitle: "Certifications",
    leftColumn: [
      "**FCC Part 15** — RF emissions (US)",
      "**CE Marking** — EU conformity",
      "**UKCA** — UK market access",
      "**No firearms permits** — CO₂ pneumatic",
    ],
    rightColumnTitle: "Timeline",
    rightColumn: [
      "**Q2 2026** — FCC certification",
      "**Q3 2026** — CE marking complete",
      "**Q4 2026** — UKCA for UK launch",
      "*Parallel paths, not sequential*",
    ],
    keyPoints: [
      "**Key advantage:** CO₂ pneumatic = no weapons permits required",
    ],
    speakerNotes:
      "BACKUP SLIDE. Use if asked about regulations. CO₂ pneumatic is the key - avoids all firearms regulations.",
    script:
      "Regulatory is straightforward. CO₂ pneumatic systems don't require firearms permits - that's our key advantage. We need FCC Part 15 for US, CE marking for EU, UKCA for UK. All running in parallel. First certifications expected Q2 2026, with EU and UK following. No sequential blockers.",
  },

  // ==========================================
  // BACKUP 6: OMNIPOST
  // ==========================================
  {
    number: 13,
    title: "OmniPost: Content Distribution",
    duration: 45,
    icon: "📢",
    layout: "two-column",
    leftColumnTitle: "What It Does",
    leftColumn: [
      "**Single post** → all platforms",
      "**AI-optimized** per platform",
      "**Scheduled** distribution",
      "**Analytics** across channels",
    ],
    rightColumnTitle: "Why We Built It",
    rightColumn: [
      "**Internal tool** — our own marketing",
      "**Productizable** — SaaS potential",
      "**Proves AI capability** — same team",
      "**Revenue diversification** option",
    ],
    keyPoints: [
      "**Dogfooding:** We use our own AI tools to grow Phoenix Rooivalk",
    ],
    speakerNotes:
      "BACKUP SLIDE. Use if asked about team capabilities or revenue diversification. Shows AI/ML chops beyond C-UAS.",
    script:
      "OmniPost is our internal content distribution tool. Write once, publish everywhere - AI optimizes for each platform. We built it to market Phoenix Rooivalk. It proves our AI capability and could become a SaaS product for revenue diversification. We dogfood our own tools.",
  },

  // ==========================================
  // BACKUP 7: COGNITIVE MESH
  // ==========================================
  {
    number: 14,
    title: "Cognitive Mesh: Distributed AI",
    duration: 45,
    icon: "🧠",
    layout: "two-column",
    leftColumnTitle: "Architecture",
    leftColumn: [
      "**Mesh network** of detection nodes",
      "**Shared intelligence** across devices",
      "**Collaborative tracking** — handoff between zones",
      "**Resilient** — no single point of failure",
    ],
    rightColumnTitle: "Applications",
    rightColumn: [
      "**Estate coverage** — multiple SkyWatch units",
      "**Event security** — temporary mesh deployment",
      "**Enterprise** — facility-wide protection",
      "**Future:** municipal-scale networks",
    ],
    keyPoints: [
      "**Network effect:** Each device makes the mesh smarter",
    ],
    speakerNotes:
      "BACKUP SLIDE. Use for technical investors or enterprise questions. This is our path to large-scale deployments.",
    script:
      "Cognitive Mesh is our distributed AI architecture. Multiple detection nodes share intelligence, hand off tracking between zones, and learn collectively. No single point of failure. This enables estate-wide coverage, event security, and eventually municipal-scale networks. Each device added makes the entire mesh smarter.",
  },

  // ==========================================
  // BACKUP 8: TECH STACK - C2 SOFTWARE
  // ==========================================
  {
    number: 15,
    title: "Tech Stack: Modern Rust Architecture",
    duration: 60,
    icon: "⚙️",
    layout: "two-column",
    leftColumnTitle: "C2 Software",
    leftColumn: [
      "**Tauri** — lightweight desktop app (vs Electron)",
      "**Leptos** — reactive Rust frontend",
      "**Zero JS** — 100% Rust, type-safe",
      "**10x smaller** than Electron alternatives",
    ],
    rightColumnTitle: "Full Stack",
    rightColumn: [
      "**Edge:** Rust + TensorRT inference",
      "**Backend:** Rust + PostgreSQL",
      "**Blockchain:** Solana SDK + EtherLink",
      "**Infra:** NixOS, reproducible builds",
    ],
    keyPoints: [
      "**Rust-first:** Memory safety, performance, and reliability across the entire stack",
    ],
    speakerNotes:
      "BACKUP SLIDE. Use for technical investors. Rust shows engineering excellence and long-term thinking.",
    script:
      "Our C2 software is built on Tauri and Leptos - 100% Rust, no JavaScript. 10x smaller than Electron alternatives. The entire stack is Rust-first: edge inference, backend APIs, blockchain integration. NixOS for reproducible builds. This gives us memory safety, performance, and reliability that Python/JavaScript stacks can't match.",
  },

  // ==========================================
  // BACKUP 9: X402 PROTOCOL (LAST)
  // ==========================================
  {
    number: 16,
    title: "x402: AI Payment Protocol",
    duration: 60,
    icon: "💳",
    layout: "two-column",
    leftColumnTitle: "What It Is",
    leftColumn: [
      "**HTTP 402** — Payment Required",
      "**AI-native** micropayments",
      "**Live today** — generating revenue",
      "**Stablecoin** settlements (USDC)",
    ],
    rightColumnTitle: "Strategic Value",
    rightColumn: [
      "**Revenue now** — before hardware ships",
      "**Technical proof** — blockchain integration works",
      "**AI infrastructure** — own our payment rails",
      "**Optionality** — separate business potential",
    ],
    keyPoints: [
      "**Pre-revenue traction:** x402 proves we can ship and monetize AI services",
    ],
    speakerNotes:
      "BACKUP SLIDE. Use if asked about revenue or blockchain credibility. x402 is live and generating revenue today.",
    script:
      "x402 is our AI payment protocol - it implements HTTP 402 Payment Required for AI-native micropayments. It's live today, settling in USDC. This gives us revenue before hardware ships, proves our blockchain integration works, and gives us optionality - x402 could be its own business. Pre-hardware revenue is rare for hardware startups.",
  },
];

export const lightningPitchMeta = {
  title: "Phoenix Rooivalk: Lightning Pitch",
  duration: 2.6,
  audience: "Investors",
  date: "January 14, 2026",
  colorTheme: "investor" as const,
};

/**
 * Timing breakdown (Main Pitch):
 * Slide 1: Problem + FPV clip - 40s
 * Slide 2: Solution + Demo video - 20s
 * Slide 3: Proof (drone-caught) - 5s
 * Slide 4: Consumer Products (Pieter) - 25s
 * Slide 5: Team - 15s
 * Slide 6: Financials (Eben) - 30s
 * Slide 7: Market/Why Now - 20s
 * TOTAL: 155s (~2.6 minutes)
 *
 * Backup Slides (After Questions):
 * Slide 8: Blockchain Evidence - 60s
 * Slide 9: Technical Architecture - 60s
 * Slide 10: Competitive Landscape - 60s
 * Slide 11: IP & Defensibility - 45s
 * Slide 12: Regulatory Compliance - 45s
 * Slide 13: OmniPost - 45s
 * Slide 14: Cognitive Mesh - 45s
 * Slide 15: Tech Stack (Rust/Tauri) - 60s
 * Slide 16: x402 Protocol - 60s
 */
