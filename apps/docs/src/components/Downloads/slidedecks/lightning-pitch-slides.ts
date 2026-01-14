import type { Slide } from "../SlideDeckDownload";

/**
 * Phoenix Rooivalk Lightning Pitch (180 seconds / 3 minutes)
 * Optimized for quick investor meetings and pitch competitions
 *
 * Structure:
 * - Problem + FPV video clip (40s)
 * - Solution (20s)
 * - Product - Pieter (30s)
 * - Team (15s)
 * - Financials - Eben (30s)
 * - Market/Why Now (20s)
 * - Close/Ask (25s)
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
    videoCaption: "SkySnare prototype - CO2 pneumatic net launcher",
    keyPoints: [
      "**Phoenix Rooivalk**",
      "CO₂ net launchers that **capture drones intact**",
      "**Safe** - No permits needed",
      "**Legal** - Non-destructive, civilian-safe",
      "**Affordable** - Starting at **$349**",
    ],
    speakerNotes:
      "Play demo video while talking. Quick pivot from fear to hope. Emphasize: safe, legal, affordable.",
    script:
      "[PLAY DEMO] Phoenix Rooivalk. We capture drones safely with no damage. Pneumatic net launchers - safe CO2 propellant, no permits needed. Legal and non-destructive. Starting at just $349.",
  },

  // ==========================================
  // SLIDE 3: PRODUCT - PIETER (30s)
  // ==========================================
  {
    number: 3,
    title: "6 Product Lines: $349 to $150K",
    duration: 30,
    icon: "🔧",
    layout: "default",
    presenter: "Pieter",
    keyPoints: [
      {
        text: "**Consumer (Seed Phase - Q3 2026):**",
        subPoints: [
          "**SkySnare** - Handheld launcher ($349)",
          "**SkyWatch** - Detection systems ($50-$20K)",
        ],
      },
      {
        text: "**Commercial (Series A):**",
        subPoints: [
          "**NetSnare/NetSentry** - Ground launchers ($150-$2K)",
          "**AeroNet** - Enterprise platform ($150K + $25K/mo)",
        ],
      },
      {
        text: "**Military (Series B+):**",
        subPoints: ["**RKV Systems** - Interceptor drones ($8K-$150K)"],
      },
      "",
      "**Highly configurable** - different specs, different price points",
      "**Hardware status:** CAD complete, prototype 40% assembled",
    ],
    speakerNotes:
      "PIETER DELIVERS THIS SLIDE. Hit the product breadth - we cover consumer to military. Emphasize configurability and hardware progress.",
    script:
      "Six product lines covering consumer to military. For consumers launching Q3 2026: SkySnare handheld at $349, SkyWatch detection from $50 to $20K. For commercial: NetSnare ground launchers, AeroNet enterprise platform at $150K plus monthly service. For military later: RKV interceptor drones up to $150K. Highly configurable - different specs and price points for every need. Hardware status: CAD designs complete, prototype 40% assembled.",
  },

  // ==========================================
  // SLIDE 4: TEAM (15s)
  // ==========================================
  {
    number: 4,
    title: "The Team",
    duration: 15,
    icon: "👥",
    layout: "team" as const,
    teamMembers: [
      {
        initials: "JS",
        name: "Jurie Smit",
        title: "Founder",
        highlights: ["Edge AI/ML", "15+ yrs fintech"],
        color: "#f97316",
      },
      {
        initials: "PL",
        name: "Pieter La Grange",
        title: "Co-Founder",
        highlights: ["Embedded systems", "Medical devices"],
        color: "#ea580c",
      },
      {
        initials: "MR",
        name: "Martyn Redelinghuys",
        title: "Supplier/Advisor",
        highlights: ["Operations", "Defense/Energy"],
        color: "#fb923c",
      },
      {
        initials: "EM",
        name: "Eben Maré",
        title: "Advisor",
        highlights: ["IB & PE", "Head Quant"],
        color: "#fbbf24",
      },
      {
        initials: "CF",
        name: "Chanelle Fellinger",
        title: "Advisor",
        highlights: ["Marketing", "Sales"],
        color: "#a855f7",
      },
      {
        initials: "AK",
        name: "Alistair Kim",
        title: "Advisor",
        highlights: ["Defense", "Government Relations"],
        color: "#06b6d4",
      },
    ],
    keyPoints: [
      "**Founders full-time** with personal capital committed",
      "**Strategic advisors** with defense and finance expertise",
    ],
    speakerNotes:
      "15 seconds max. Hit the founders first, then advisors briefly.",
    script:
      "Two founders, supported by experienced advisors. Jurie on AI and tech, Pieter on hardware with medical device manufacturing. Our advisors bring investment banking, strategy, and defense expertise. All committed, personal capital invested.",
  },

  // ==========================================
  // SLIDE 5: FINANCIALS - EBEN (30s)
  // ==========================================
  {
    number: 5,
    title: "The Ask: $960K Seed",
    duration: 30,
    icon: "💰",
    layout: "default",
    presenter: "Eben",
    keyPoints: [
      "**$960K Seed** on SAFE | **$3.5M pre-money cap**",
      "",
      {
        text: "**Use of funds:**",
        subPoints: [
          "40% Engineering - AI/ML, edge processing",
          "25% Hardware - prototypes, tooling",
          "15% Sales - D2C launch",
          "20% Ops - patent, certifications",
        ],
      },
      "",
      {
        text: "**Milestones:**",
        subPoints: [
          "Certified product in market **Q2 2026**",
          "**$500K+ ARR** by Q4 2026",
          "Series A ready with proven traction",
        ],
      },
      "",
      "**18-month runway** to Series A",
    ],
    speakerNotes:
      "EBEN DELIVERS THIS SLIDE. Clear terms, clear use of funds, clear milestones. No ambiguity.",
    script:
      "We're raising $960K on a SAFE at $3.5 million pre-money cap. 40% to engineering, 25% to hardware prototypes, 15% to D2C sales launch, 20% to operations and certifications. Milestones: certified product in market Q2 2026, over $500K ARR by Q4, Series A ready with proven traction. 18-month runway.",
  },

  // ==========================================
  // SLIDE 6: MARKET / WHY NOW (20s)
  // ==========================================
  {
    number: 6,
    title: "$14B+ Funding Announced in 2025",
    duration: 20,
    icon: "📈",
    layout: "default",
    keyPoints: [
      {
        text: "**Governments got serious in 2025:**",
        subPoints: [
          "🇺🇸 $7.5B US DoD + $500M FEMA (FIFA World Cup)",
          "🇬🇧 $600M+ UK DragonFire + MOD",
          "🇪🇺 €500M France + NATO",
        ],
      },
      "",
      "**Market:** $6.64B → **$20.31B** (2030) at **25% CAGR**",
      "",
      "**Target markets:** Germany, Poland, Baltics, Balkans",
      "*Where 77% believe war is imminent*",
    ],
    speakerNotes:
      "Quick market validation. $14B proves governments are serious. Eastern Europe is the beachhead - fear is real there.",
    script:
      "Governments got serious in 2025. Over $14 billion in C-UAS funding announced. US committed $7.5 billion in DoD plus $500 million for FIFA World Cup security. UK invested $600 million. France and NATO added half a billion euros. Market growing from $6.6 billion to $20 billion by 2030. Our focus: Germany, Poland, Baltics - where 77% believe war is coming.",
  },

  // ==========================================
  // SLIDE 7: CLOSE (25s)
  // ==========================================
  {
    number: 7,
    title: "Protect Your Home",
    duration: 25,
    icon: "🎯",
    layout: "products",
    keyPoints: [],
    productCards: [
      {
        name: "SkySnare",
        tagline: "Point & Shoot Protection",
        description:
          "Handheld drone capture device. Aim, fire, catch. No training required.",
        price: "$349",
        delivery: "Delivery Jul 2026",
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
          "AI camera that spots drones and alerts your phone. Easy backyard setup.",
        price: "$99",
        delivery: "Delivery Jul 2026",
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
          "Ground-mounted launcher. Pairs with SkyWatch for hands-free capture.",
        price: "$200-400",
        delivery: "Delivery Jul 2026",
        badges: ["SEED", "PREORDER OPEN"],
        color: "#f97316",
        specs: [
          { label: "Range", value: "10-20m" },
          { label: "Trigger", value: "App/Auto" },
        ],
      },
    ],
    speakerNotes:
      "Show the 3 entry-level products. SkySnare handheld, SkyWatch Nano camera, NetSnare auto-launcher. Emphasize simplicity and price points.",
    script:
      "Three products to protect your home. SkySnare - point and shoot, $349. SkyWatch Nano - AI detection camera, $99. NetSnare Lite - automated ground launcher, from $200. All shipping July 2026. Preorders open now. Questions?",
  },
];

export const lightningPitchMeta = {
  title: "Phoenix Rooivalk: Lightning Pitch (3 min)",
  duration: 3,
  audience: "Investors, Pitch Competitions",
  date: "January 2026",
  colorTheme: "investor" as const,
};

/**
 * Timing breakdown:
 * Slide 1: Problem + FPV clip - 40s
 * Slide 2: Solution - 20s
 * Slide 3: Product (Pieter) - 30s
 * Slide 4: Team - 15s
 * Slide 5: Financials (Eben) - 30s
 * Slide 6: Market/Why Now - 20s
 * Slide 7: Close - 25s
 * TOTAL: 180s (3 minutes)
 */
