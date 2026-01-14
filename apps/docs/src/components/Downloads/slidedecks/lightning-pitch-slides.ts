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
    layout: "default",
    keyPoints: [
      "**[10s VIDEO: FPV drone kills - Ukraine footage]**",
      "",
      {
        text: "**The threat is real and coming home:**",
        subPoints: [
          "FPV drones killed **577 Ukrainian civilians in 2025 alone** - up 120% (UN data)",
          "**77% of Europeans** believe war with Russia is imminent",
          "Brussels Airport closed **twice in one night** (Nov 2025)",
        ],
      },
      "",
      "**64% of facilities have ZERO protection**",
      "Current systems: **$800K+** and **5-30 second** response",
      "",
      "*There's nothing affordable to protect your home.*",
    ],
    speakerNotes:
      "START WITH 10s FPV KILL FOOTAGE - let it sink in. Then hit the stats. End with 'nothing affordable to protect your home' - pause for effect.",
    script:
      "[PLAY 10s FPV VIDEO] This is happening right now. FPV drones killed 577 Ukrainian civilians in 2025 alone - that's up 120% from last year according to the UN. 77% of Europeans believe war with Russia is imminent. Brussels Airport closed twice in one night last November. 64% of critical facilities have zero drone protection. Current military systems cost $800,000 and take 5 to 30 seconds to respond. There's nothing affordable to protect your home. Until now.",
  },

  // ==========================================
  // SLIDE 2: SOLUTION (20s)
  // ==========================================
  {
    number: 2,
    title: "Capture Drones Safely. No Damage.",
    duration: 20,
    icon: "🛡️",
    layout: "title-only",
    keyPoints: [
      "**Phoenix Rooivalk**",
      "",
      "Pneumatic net launchers that **capture drones intact**",
      "",
      "**Safe** - CO2/pneumatic, no permits needed",
      "**Legal** - Non-destructive, civilian-safe",
      "**Affordable** - Starting at **$349**",
      "",
      "**Net capture is proven** - Ukraine, US Army use it daily",
      "*We made it safe and affordable for YOU*",
    ],
    speakerNotes:
      "Quick pivot from fear to hope. Emphasize: safe, legal, affordable. Net capture is PROVEN - we just made it accessible.",
    script:
      "Phoenix Rooivalk. We capture drones safely with no damage. Pneumatic net launchers - safe CO2 propellant, no permits needed. Legal and non-destructive. Starting at just $349. Net capture is already proven - Ukraine and US Army use it daily. We made it safe and affordable for everyone.",
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
    title: "60+ Years Combined Experience",
    duration: 15,
    icon: "👥",
    layout: "team" as const,
    teamMembers: [
      {
        initials: "JS",
        name: "Jurie Smit",
        title: "CTO",
        highlights: ["Edge AI/ML", "15+ yrs fintech"],
        color: "#f97316",
      },
      {
        initials: "MR",
        name: "Martyn Redelinghuys",
        title: "CEO",
        highlights: ["Defense/Energy", "R500M+ portfolio"],
        color: "#ea580c",
      },
      {
        initials: "PL",
        name: "Pieter La Grange",
        title: "Hardware",
        highlights: ["Embedded systems", "Medical devices"],
        color: "#fb923c",
      },
      {
        initials: "EM",
        name: "Eben Maré",
        title: "CFO",
        highlights: ["IB & PE", "Head Quant"],
        color: "#fbbf24",
      },
    ],
    keyPoints: [
      "**All founders full-time** with personal capital committed",
    ],
    speakerNotes:
      "15 seconds max. Just hit the names and key expertise. Emphasize full-time commitment.",
    script:
      "Four co-founders, 60+ years combined. Jurie on AI and tech. Martyn on business with defense relationships. Pieter on hardware with medical device manufacturing. Eben on finance with investment banking. All full-time, personal capital committed.",
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
    layout: "title-only",
    keyPoints: [
      "**Net capture is proven** - Ukraine, US Army",
      "**We made it safe** - CO2/pneumatic, no permits",
      "**We made it affordable** - $349 to $150K",
      "",
      "**$14B+ in government funding** - market is ready",
      "**6 product lines** - consumer to military",
      "**Q3 2026 delivery** - preorders open",
      "",
      "**$960K seed** → Certified product → $500K ARR → Series A",
      "",
      "*Capture drones safely. No damage.*",
      "**Questions?**",
    ],
    speakerNotes:
      "Summarize the 3 key points: proven, safe, affordable. End with the tagline and open for questions.",
    script:
      "Net capture is proven on the frontlines. We made it safe with pneumatic propellant. We made it affordable starting at $349. $14 billion in government funding proves the market is ready. We have 6 product lines covering consumer to military. First deliveries Q3 2026 - preorders are open now. $960K gets us to certified product and $500K ARR, then Series A. Capture drones safely. No damage. Questions?",
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
