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
      "**Capture Drones Safely. No Damage.**",
      "*Seed Round 2026*",
      "",
      "Pneumatic net launchers for training, events, and facility security",
      "**Legal. Non-destructive. Deployable today.**",
      "",
      "**6 product lines** | **$349 - $150K** | **Q3 2026 delivery**",
    ],
    speakerNotes:
      "Open with the new value prop - safe capture, no damage. Emphasize legal and non-destructive. The 6 product lines shows breadth.",
    script:
      "Welcome to Phoenix Rooivalk. We capture drones safely with no damage. Pneumatic net launchers for training, events, and facility security. Legal, non-destructive, and deployable today. We offer 6 product lines from $349 consumer devices to $150K enterprise platforms. First deliveries Q3 2026. Preorders are open now.",
  },

  // ==========================================
  // SLIDE 2: THE PROBLEM - THREAT LANDSCAPE
  // ==========================================
  {
    number: 2,
    title: "The Problem: 64% of Facilities Are Unprotected",
    duration: 70,
    icon: "🚨",
    layout: "video",
    video: "/videos/fpv-kills-short.mp4",
    videoCaption:
      "FPV drone attacks demonstrate the threat (source: combat footage)",
    keyPoints: [
      {
        text: "**The threat is proven in combat:**",
        subPoints: [
          "FPV drones causing **mass casualties** in Ukraine daily",
          "Civilian infrastructure increasingly targeted",
        ],
      },
      {
        text: "**FCC bans DJI drones (Dec 2025)** - [washingtonpost.com]",
        subPoints: [
          "Chinese drones added to FCC 'Covered List' Dec 23, 2025",
          "New models **banned from US import/sale** (national security)",
          "Creates **massive market gap** for domestic alternatives",
        ],
      },
      {
        text: "**November 2025: Brussels Airport closed twice in one night**",
        subPoints: [
          "54 flights cancelled, RAF specialists deployed",
          "European drone incidents up **4x year-over-year**",
        ],
      },
      {
        text: "**Why current solutions fail:**",
        subPoints: [
          "**5-30 second** response time - drones travel 500m in that time",
          "Cloud-dependent systems fail in denied environments",
          "No admissible evidence = no prosecution = no deterrent",
        ],
      },
    ],
    speakerNotes:
      "Play video first - let it sink in. Then hit the DJI ban (verified: FCC Dec 2025). Brussels Airport incident is verified. Keep it punchy - 70 seconds max.",
    script:
      "[PLAY VIDEO] This is happening right now. FPV drones are causing mass casualties in Ukraine daily. And the threat is coming home. The FCC just banned DJI drones in December 2025 citing national security - that's the Washington Post, you can verify it. This creates a massive market gap. Brussels Airport was closed twice in one night last November. 54 flights cancelled. European drone incidents are up 4x year over year. Current solutions take 5 to 30 seconds to respond - a drone travels 500 meters in that time. 64% of critical facilities have zero protection today.",
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
    leftColumnTitle: "The Cost of Inaction",
    leftColumn: [
      "**Airports** - $100K-$60M per incident",
      "**Power Plants** - $500K+ downtime per hour",
      "**Prisons** - $2M+ contraband annually per facility",
      "**Military** - classified losses, lives at stake",
      "**Events** - $10M+ liability exposure",
    ],
    rightColumnTitle: "Why Competitors Fail",
    rightColumn: [
      "**5,000-30,000ms** response - drone travels 500m",
      "**Cloud-dependent** - fails when you need it most",
      "**No offline mode** - useless in RF/GPS-denied areas",
      "**$800K-$1.5M+** - priced out of reach",
      "**No evidence** - perpetrators walk free",
    ],
    keyPoints: [],
    speakerNotes:
      "The left column now quantifies the pain. Every vertical has a dollar figure. Right column shows why competitors can't solve it. This sets up our value prop perfectly.",
    script:
      "Let's quantify what's at stake. Airports face $100K to $60 million per incident - we saw that at Gatwick. Power plants lose $500K or more per hour of downtime. Prisons see over $2 million in contraband delivered by drone annually per facility. Military losses are classified, but we're talking about lives. Major events carry $10 million plus in liability exposure. Now, why don't current solutions work? They take 5 to 30 seconds to respond - a drone travels 500 meters in that time. They're cloud-dependent and fail exactly when you need them most. No offline capability for denied environments. They cost $800K to over $1.5 million - priced out of reach for most facilities. And without evidence, perpetrators walk free. No prosecution, no deterrent.",
  },

  // ==========================================
  // SLIDE 4: OUR SOLUTION
  // ==========================================
  {
    number: 4,
    title: "Our Solution: 3 Unfair Advantages",
    duration: 75,
    icon: "🛡️",
    keyPoints: [
      {
        text: "**1. SPEED:** Sub-200ms response (10-150x faster)",
        subPoints: [
          "Detect → Track → Neutralize in **under 200 milliseconds**",
          "Competitors: 5,000-30,000ms - *we're 2 orders of magnitude faster*",
          "Edge AI processing - no cloud latency",
        ],
      },
      {
        text: "**2. AUTONOMY:** Works where others fail",
        subPoints: [
          "**True offline** - no internet required",
          "RF-denied & GPS-denied operation",
          "SAE Level 4 autonomous decision-making",
        ],
      },
      {
        text: "**3. EVIDENCE:** Catch the perpetrators",
        subPoints: [
          "**Blockchain-anchored** chain of custody",
          "Court-admissible documentation",
          "Finally: prosecution becomes possible",
        ],
      },
    ],
    speakerNotes:
      "Three clear differentiators, numbered for memory. Speed is #1 because it's the most dramatic. Evidence is #3 because it's unique and memorable. Don't mention weapons here - save for Q&A.",
    script:
      "Phoenix Rooivalk has three unfair advantages. Number one: Speed. We respond in under 200 milliseconds - that's 10 to 150 times faster than any competitor. While they're still processing in the cloud, we've already neutralized the threat with edge AI. Number two: Autonomy. We work where others fail. True offline operation, no internet required. RF-denied, GPS-denied environments - exactly where you need counter-drone most. SAE Level 4 autonomous decision-making. Number three: Evidence. For the first time, you can actually catch the perpetrators. Blockchain-anchored chain of custody. Court-admissible documentation. No more 'never caught' headlines.",
  },

  // ==========================================
  // SLIDE 5: COMPETITIVE ADVANTAGE - NET LAUNCHERS
  // ==========================================
  {
    number: 5,
    title: "Net Capture: Frontline-Proven, Civilian-Safe",
    duration: 60,
    icon: "⚡",
    keyPoints: [
      {
        text: "**Net capture proven in combat** (Ukraine, US Army):",
        subPoints: [
          "MITLA (Ukraine) - deployed on frontlines against FPV drones",
          "SkyWall (UK) - adopted by US Army, 100m range",
          "Fortem DroneHunter - used successfully in Ukraine",
        ],
      },
      {
        text: "**Our differentiation:** Safe propellant for civilian markets",
        subPoints: [
          "**MITLA**: Pyrotechnic (7.62mm) - *may detonate drone warhead*",
          "**SkyWall**: Compressed air - $30-50K+, 10kg weight",
          "**Phoenix Rooivalk**: CO2/Pneumatic - $349-$2K, safe, reusable",
        ],
      },
      {
        text: "**Why we win:**",
        subPoints: [
          "✅ No permits required (vs pyrotechnic)",
          "✅ 10x cheaper than SkyWall ($349 vs $30K+)",
          "✅ Reusable ($1-2/shot vs $90 disposable)",
          "✅ Integrated AI detection (competitors: detection separate)",
          "✅ Blockchain evidence chain (no one else has this)",
        ],
      },
    ],
    speakerNotes:
      "Key message: same proven technology (nets), safer propellant for civilian use, 10x cheaper. MITLA warns nets can detonate drone warheads - our pneumatic is safer.",
    script:
      "Net capture isn't theoretical - it's proven in combat. Ukraine's MITLA is deployed on frontlines. The US Army adopted SkyWall. Fortem DroneHunter was used successfully in Ukraine. Our differentiation: safe propellant for civilian markets. MITLA uses pyrotechnic cartridges that can detonate drone warheads. SkyWall costs $30,000+ and weighs 10 kilograms. We use CO2 and pneumatic - safe, no permits, starting at $349. We're 10x cheaper than SkyWall, reusable at $1-2 per shot versus $90 disposable, and we integrate AI detection where competitors sell detection separately. Plus blockchain evidence chain - no one else has that.",
  },

  // ==========================================
  // SLIDE 6: MARKET & BUSINESS MODEL
  // ==========================================
  {
    number: 6,
    title: "2025: The Year Governments Got Serious",
    duration: 60,
    icon: "📊",
    layout: "image-right",
    image: "/img/tam-sam-som.svg",
    imageCaption: "Drone Defense Market TAM/SAM/SOM",
    keyPoints: [
      {
        text: "**$14+ BILLION** in C-UAS funding announced in 2025:",
        subPoints: [
          "🇺🇸 **$7.5B** US DoD FY2026 C-UAS budget",
          "🇺🇸 **$640M** Marine Corps contract (Anduril, Mar 2025)",
          "🇺🇸 **$500M** FEMA grants for FIFA World Cup 2026",
          "🇬🇧 **$600M+** UK DragonFire laser + MOD investment",
          "🇪🇺 **€500M** France drone budget + NATO contracts",
        ],
      },
      {
        text: "**Market:** $6.64B → **$20.31B** (2030) at **25.1% CAGR**",
        subPoints: [
          "Net capture **proven on frontlines** (Ukraine, US Army)",
          "64% of facilities unprotected = **massive whitespace**",
        ],
      },
      {
        text: "**6 Product Lines:** Consumer to Military",
        subPoints: [
          "**SkySnare** ($349) → **RKV Systems** ($150K)",
          "Hardware + SaaS recurring revenue model",
        ],
      },
    ],
    speakerNotes:
      "Lead with the $14B+ in announced funding - this is new data from 2025. Shows governments are serious. Market is massive and we cover the full spectrum.",
    script:
      "2025 was the year governments got serious about counter-drone. Over $14 billion in funding announced globally. The US alone committed $7.5 billion in the DoD budget, $640 million to Anduril for Marine Corps, and $500 million in FEMA grants for FIFA World Cup 2026 security. The UK invested over $600 million in DragonFire laser and MOD programs. France and NATO added €500 million more. The market is $6.64 billion today growing to $20.31 billion by 2030 at 25% CAGR. Net capture is proven on the frontlines in Ukraine. 64% of facilities are still unprotected. We offer 6 product lines from $349 consumer to $150K military.",
  },

  // ==========================================
  // SLIDE 7: ROADMAP & PROGRESS
  // ==========================================
  {
    number: 7,
    title: "Traction & Roadmap",
    duration: 60,
    icon: "🗺️",
    layout: "image",
    image: "/img/roadmap-timeline.svg",
    imageCaption: "18-month runway to Series A",
    keyPoints: [
      {
        text: "**Platform maturity** (built with $0 raised):",
        subPoints: [
          "**215 documentation pages** with RAG AI search",
          "**51 Architecture Decision Records** published",
          "**WASM threat simulator** live in browser",
          "**x402 payment protocol** in production",
        ],
      },
      {
        text: "**Hardware status:**",
        subPoints: [
          "Full system CAD designs **complete**",
          "Prototype **40% assembled** - Q1 2026 completion",
          "Kevlar nets tested, **patent filing Q1 2026**",
        ],
      },
      {
        text: "**Phased product delivery:**",
        subPoints: [
          "**Seed (Q1-Q3 2026)**: SkySnare, SkyWatch, NetSnare, NetSentry",
          "**Series A (Q4 2026-Q3 2027)**: AeroNet Enterprise platform",
          "**Series B+ (2028+)**: RKV military interceptors",
        ],
      },
    ],
    speakerNotes:
      "Lead with platform maturity - 51 ADRs is exceptional for seed stage. Hardware status shows execution. Phased delivery shows we understand sequencing.",
    script:
      "We've built significant platform infrastructure with zero capital raised. 215 documentation pages with AI-powered search. 51 architecture decision records published - that's enterprise-grade documentation. A working WASM threat simulator you can try in the browser. And our x402 blockchain payment protocol is live in production. On hardware: CAD designs complete, prototype 40% assembled for Q1 completion, Kevlar nets tested, patent filing in Q1. Our product delivery is phased: SkySnare and detection products in the seed phase, AeroNet enterprise platform in Series A, and RKV military interceptors in Series B and beyond.",
  },

  // ==========================================
  // SLIDE 8: TEAM
  // ==========================================
  {
    number: 8,
    title: "Team: 60+ Years Defense & Tech Expertise",
    duration: 30,
    icon: "👥",
    layout: "team" as const,
    teamMembers: [
      {
        initials: "JS",
        name: "Jurie Smit",
        title: "Founder",
        highlights: [
          "15+ years fintech & SaaS",
          "Edge AI/ML systems",
          "Previously: enterprise SaaS exits",
        ],
        color: "#f97316", // Phoenix Orange
        image: "/team/jurie.jpeg",
      },
      {
        initials: "PL",
        name: "Pieter La Grange",
        title: "Co-Founder",
        highlights: [
          "15+ years embedded systems",
          "Medical device production (Snuza)",
          "Mass manufacturing experience",
        ],
        color: "#ea580c", // Dark Orange
        image: "/team/pieter.jpeg",
      },
      {
        initials: "MR",
        name: "Martyn Redelinghuys",
        title: "Supplier/Advisor",
        highlights: [
          "Operations & Supply Chain",
          "20+ years defense/energy",
          "R500M+ portfolio management",
        ],
        color: "#fb923c", // Light Orange
        image: "/team/martyn.png",
      },
      {
        initials: "EM",
        name: "Eben Maré",
        title: "Advisor",
        highlights: [
          "15+ years IB & PE",
          "Head Quant (Deloitte)",
          "Phoenix VC founding partner",
        ],
        color: "#fbbf24", // Amber
        image: "/team/eben.jpeg",
      },
      {
        initials: "CF",
        name: "Chanelle Fellinger",
        title: "Advisor",
        highlights: [
          "Marketing & Sales",
          "Go-to-market strategy",
          "B2B growth expert",
        ],
        color: "#a855f7", // Purple
        image: "/team/chanelle.png",
      },
      {
        initials: "AK",
        name: "Alistair Kim",
        title: "Advisor",
        highlights: [
          "Defense sector expertise",
          "Government relations",
          "International markets",
        ],
        color: "#06b6d4", // Cyan
      },
    ],
    keyPoints: [
      "**Founders full-time** with personal capital committed",
      "**Strategic advisors** with operations, finance, marketing, and defense expertise",
    ],
    speakerNotes:
      "30 seconds max. Hit the founders first, mention advisors briefly. Investors want to know you can execute.",
    script:
      "Our team: Jurie on tech with edge AI and SaaS exits. Pieter on hardware with medical device mass manufacturing. Strategic advisors include Martyn on operations, Eben on finance, Chanelle on marketing and sales, and Alistair with defense sector expertise. Founders full-time with personal capital committed.",
  },

  // ==========================================
  // SLIDE 9: THE ASK - $960K SEED
  // ==========================================
  {
    number: 9,
    title: "The Ask: $960K Seed Round",
    duration: 75,
    icon: "💰",
    layout: "image-right",
    image: "/img/investment-breakdown.svg",
    imageCaption: "18-month runway to Series A",
    keyPoints: [
      {
        text: "**$960K Seed** on SAFE | **$3.5M pre-money cap**",
        subPoints: [
          "**40%** Engineering ($384K) - AI/ML, edge processing",
          "**25%** Hardware ($240K) - prototypes, tooling",
          "**15%** Sales ($144K) - D2C launch, OmniPost marketing",
          "**20%** Ops + Cert ($192K) - legal, patent, CPSC/ASTM/CE",
        ],
      },
      {
        text: "**What you get for $960K:**",
        subPoints: [
          "Certified product in market (Q2 2026)",
          "**$500K+ ARR** by Q4 2026",
          "Series A ready with proven traction",
        ],
      },
      {
        text: "**Internal tools already built:**",
        subPoints: [
          "**OmniPost** - AI multi-platform publishing (D2C ready)",
          "**Cognitive Mesh** - Enterprise AI architecture (in dev)",
        ],
      },
    ],
    speakerNotes:
      "State terms upfront - no ambiguity. Mention internal tools to show platform maturity. End with demo CTA verbally.",
    script:
      "We're raising $960K on a SAFE at $3.5 million pre-money cap. Use of funds: 40% to engineering for AI and edge processing. 25% to hardware for prototypes and tooling. 15% to sales including D2C launch powered by our OmniPost AI publishing platform. 20% to operations including patent filing and certifications. What do you get? Certified product in market by Q2 2026. Over $500K ARR by Q4. Series A ready with proven traction. We've also built internal tools: OmniPost for AI-powered multi-platform marketing, and Cognitive Mesh enterprise AI architecture in development. Let's schedule a live demo so you can see sub-200 millisecond response for yourself.",
  },

  // ==========================================
  // SLIDE 10: ROI & EXIT EXPECTATIONS
  // ==========================================
  {
    number: 10,
    title: "Your Return: Three Scenarios",
    duration: 45,
    icon: "📈",
    layout: "two-column",
    leftColumnTitle: "Return Scenarios",
    leftColumn: [
      "**Conservative** (base case):",
      "Series A at $5M → **5-8x** seed return",
      "Acqui-hire or small exit → **8-12x**",
      "",
      "**Base** (expected):",
      "Series B at $25M → **10-15x** paper",
      "M&A 2028-2029 → **15-25x** realized",
      "",
      "**Upside** (sector tailwinds):",
      "Strategic acquisition → **25-50x**",
    ],
    rightColumnTitle: "Why Defense Exits Work",
    rightColumn: [
      "**Relevant comps:**",
      "**Dedrone** → Acquired by Axon (2024)",
      "**DroneShield** → ASX: $400M+ market cap",
      "**Fortem** → $100M+ raised, acquisition target",
      "",
      "**Strategic buyers actively looking:**",
      "Lockheed, Northrop, L3Harris, Raytheon",
      "All have counter-drone gaps to fill",
    ],
    keyPoints: [],
    speakerNotes:
      "Three scenarios shows you've thought through downside. Use relevant comps - not Anduril ($14B) which is unrealistic. Emphasize defense M&A is active and we fit the profile.",
    script:
      "Three return scenarios. Conservative: even if we only hit Series A at $5 million, you're looking at 5 to 8x. If we get acqui-hired, 8 to 12x. That's your downside protection. Base case: Series B at $25 million gives you 10 to 15x on paper. M&A in 2028 or 2029 realizes 15 to 25x. Upside: strategic acquisition in a hot market, 25 to 50x. Why do we believe defense exits work? Look at relevant comps. Dedrone was acquired by Axon in 2024. DroneShield on the ASX is at $400 million plus market cap. Fortem has raised over $100 million and is an acquisition target. The strategics - Lockheed, Northrop, L3Harris, Raytheon - they all have counter-drone gaps to fill. We fit the profile.",
  },
];

export const demoPitchMeta = {
  title: "Phoenix Rooivalk: Demo Pitch Deck",
  duration: 10,
  audience: "Investors, Strategic Partners, Demo Attendees",
  date: "January 2026",
  colorTheme: "investor" as const,
};
