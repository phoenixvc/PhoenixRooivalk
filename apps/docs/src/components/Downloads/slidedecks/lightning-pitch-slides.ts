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
        delivery: "Jul 2026",
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
        delivery: "Jul 2026",
        badges: ["SEED", "PREORDER OPEN"],
        color: "#f97316",
        specs: [
          { label: "Range", value: "10-20m" },
          { label: "Trigger", value: "App/Auto" },
        ],
      },
    ],
    speakerNotes:
      "PIETER DELIVERS THIS SLIDE. Show the 3 consumer products. SkySnare handheld, SkyWatch Nano camera, NetSnare auto-launcher. Emphasize simplicity and price points.",
    script:
      "Three products to protect your home. SkySnare - point and shoot, $349. SkyWatch Nano - AI detection camera, just $99. NetSnare Lite - automated ground launcher, from $200. All shipping July 2026. Preorders open now.",
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
        image: "/img/team/jurie.jpeg",
      },
      {
        initials: "PL",
        name: "Pieter La Grange",
        title: "Co-Founder",
        highlights: ["Electronic Eng", "🚀 Flight Club 637km/h WR"],
        color: "#ea580c",
        image: "/img/team/pieter.jpeg",
      },
      {
        initials: "MR",
        name: "Martyn Redelinghuys",
        title: "Supplier/Advisor",
        highlights: ["Electrical Eng", "🚀 Plastics mfg"],
        color: "#fb923c",
        image: "/img/team/martyn.png",
      },
      {
        initials: "EM",
        name: "Eben Maré",
        title: "Advisor",
        highlights: ["Head Quant", "Previous exit"],
        color: "#fbbf24",
        image: "/img/team/eben.jpeg",
      },
      {
        initials: "CF",
        name: "Chanelle Fellinger",
        title: "Advisor",
        highlights: ["EU expansion", "UK exit (family)"],
        color: "#a855f7",
        image: "/img/team/chanelle.png",
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
      "**Q2 2026** — Certified product in market",
      "**Q4 2026** — $500K+ ARR",
      "**Q2 2027** — Series A ready",
      "**18-month runway** to profitability",
    ],
    keyPoints: [
      "**$960K Seed** on SAFE | **$3.5M pre-money cap**",
    ],
    speakerNotes:
      "EBEN DELIVERS THIS SLIDE. Clear terms, clear use of funds, clear milestones. No ambiguity.",
    script:
      "We're raising $960K on a SAFE at $3.5 million pre-money cap. 40% to engineering, 25% to hardware, 15% to D2C sales launch, 20% to ops and certifications. Milestones: certified product Q2 2026, $500K ARR by Q4, Series A ready in 18 months.",
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
];

export const lightningPitchMeta = {
  title: "Phoenix Rooivalk: Lightning Pitch",
  duration: 2.6,
  audience: "Investors",
  date: "January 14, 2026",
  colorTheme: "investor" as const,
};

/**
 * Timing breakdown:
 * Slide 1: Problem + FPV clip - 40s
 * Slide 2: Solution + Demo video - 20s
 * Slide 3: Proof (drone-caught) - 5s
 * Slide 4: Consumer Products (Pieter) - 25s
 * Slide 5: Team - 15s
 * Slide 6: Financials (Eben) - 30s
 * Slide 7: Market/Why Now - 20s
 * TOTAL: 155s (~2.6 minutes)
 */
