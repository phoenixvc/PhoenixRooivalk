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
      "*Seed Round 2025*",
      "",
      "**10-150x faster** than any competitor",
      "Protecting **$20B+** in critical infrastructure",
      "",
      "**When seconds matter, we respond in milliseconds**",
    ],
    speakerNotes:
      "Open with confidence. Lead with '10-150x faster' - it's concrete and memorable. Pause on the tagline. The $20B figure anchors the opportunity.",
    script:
      "Welcome to Phoenix Rooivalk. We're building autonomous counter-drone defense that's 10 to 150 times faster than anything else on the market. Sub-200 millisecond response time. True offline capability for denied environments. Blockchain-anchored evidence for legal accountability. We're protecting over $20 billion in critical infrastructure globally. When seconds matter, we respond in milliseconds.",
  },

  // ==========================================
  // SLIDE 2: THE PROBLEM - THREAT LANDSCAPE
  // ==========================================
  {
    number: 2,
    title: "The Problem: 64% of Facilities Are Unprotected",
    duration: 60,
    icon: "🚨",
    layout: "default",
    keyPoints: [
      {
        text: "**November 2025: Brussels Airport closed twice in one night**",
        subPoints: [
          "54 flights cancelled, RAF specialists deployed",
          "European drone incidents up **4x year-over-year**",
          "Perpetrators: *still at large*",
        ],
      },
      {
        text: "**The Gatwick precedent** (Dec 2018):",
        subPoints: [
          "**£60M+ in damages**, 140,000 passengers stranded",
          "Investigation cost: millions more",
          "Perpetrators: **never caught** - *no evidence chain*",
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
      "Lead with Brussels - it's recent, relatable, and proves this isn't hypothetical. Gatwick shows the cost and the evidence problem. Keep it punchy - 60 seconds max.",
    script:
      "Last month, Brussels Airport was closed twice in one night. 54 flights cancelled. The Royal Air Force deployed specialists. European drone incidents are up 4x year over year. And the perpetrators? Still at large. Remember Gatwick in 2018? £60 million in damages, 140,000 passengers stranded. And the perpetrators were never caught. Why? No evidence chain. Current solutions take 5 to 30 seconds to respond - a drone travels 500 meters in that time. They're cloud-dependent and fail in denied environments. And without admissible evidence, there's no prosecution and no deterrent. 64% of critical facilities have zero protection today.",
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
  // SLIDE 5: COMPETITIVE ADVANTAGE
  // ==========================================
  {
    number: 5,
    title: "Why We Win: The Comparison",
    duration: 45,
    icon: "⚡",
    layout: "two-column",
    leftColumnTitle: "Phoenix Rooivalk",
    leftColumn: [
      "**50-195ms** response",
      "✅ True offline capability",
      "✅ Blockchain evidence chain",
      "✅ Open architecture",
      "✅ **$25K-$100K** systems",
      "✅ Deploy in **days**",
    ],
    rightColumnTitle: "Competitors",
    rightColumn: [
      "**5,000-30,000ms** response",
      "❌ Requires cloud connectivity",
      "❌ No evidence trail",
      "❌ Vendor lock-in",
      "❌ **$800K-$1.5M+** systems",
      "❌ Deploy in **months**",
    ],
    keyPoints: [],
    speakerNotes:
      "Let the comparison speak for itself. Point to each row. The deployment time is new - emphasize we can protect a facility in days, not months of integration work.",
    script:
      "Let's compare directly. Response time: we're at 50 to 195 milliseconds, competitors take 5 to 30 seconds. Offline: we work completely offline, they require cloud. Evidence: we generate blockchain evidence for prosecution, they have nothing. Architecture: we're open, they lock you in. Cost: $25K to $100K versus $800K to over $1.5 million. And deployment: we protect a facility in days, not months of integration work. Six advantages, all decisive.",
  },

  // ==========================================
  // SLIDE 6: MARKET & BUSINESS MODEL
  // ==========================================
  {
    number: 6,
    title: "Market Opportunity: Why Now",
    duration: 60,
    icon: "📊",
    layout: "image-right",
    image: "/img/tam-sam-som.svg",
    imageCaption: "Drone Defense Market TAM/SAM/SOM",
    keyPoints: [
      {
        text: "**Why NOW is the moment:**",
        subPoints: [
          "Brussels, Gatwick incidents driving **regulatory urgency**",
          "EU mandating airport protection by **2027**",
          "US FAA BVLOS rules enabling **new drone threats**",
        ],
      },
      {
        text: "**Market:** $6.64B → **$20.3B** (2030) at **25% CAGR**",
        subPoints: [
          "Counter-drone segment: **47% CAGR** - fastest growing",
          "64% of facilities unprotected = **massive whitespace**",
        ],
      },
      {
        text: "**Revenue model:** Hardware + Recurring",
        subPoints: [
          "Hardware: **60%** ($25K-$100K systems)",
          "SaaS + Services: **40%** (80%+ gross margin)",
          "Target: **6:1 CLV:CAC**",
        ],
      },
    ],
    speakerNotes:
      "Lead with WHY NOW - regulatory tailwinds are real. Brussels and Gatwick created political will. EU mandates are coming. Then show the market size and our model.",
    script:
      "Why is now the moment? Brussels and Gatwick created regulatory urgency. The EU is mandating airport counter-drone protection by 2027. In the US, new FAA BVLOS rules are enabling more drones in the sky - which means more threats. The market is $6.64 billion today, growing to over $20 billion by 2030. The counter-drone segment is the fastest growing at 47% CAGR. And 64% of facilities are still unprotected - massive whitespace for us. Our model: 60% hardware revenue from $25K to $100K systems, 40% recurring from SaaS and services with 80%+ gross margins. Target CLV to CAC of 6 to 1.",
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
        text: "**Already completed** (6 months, $0 raised):",
        subPoints: [
          "Full system CAD designs **complete**",
          "Prototype **in assembly** - Q1 2026 completion",
          "Kevlar net tested successfully",
          "**2 LOIs** from EU facilities (pending seed close)",
        ],
      },
      {
        text: "**Go-to-market strategy:**",
        subPoints: [
          "**Consumer first** (SkySnare) - proves tech, builds brand",
          "**Enterprise second** (AeroNet) - higher margins, longer sales",
          "Consumer revenue funds enterprise sales cycle",
        ],
      },
      {
        text: "**Key milestones:**",
        subPoints: [
          "**Q2 2026**: CPSC/ASTM cert, D2C launch, first EU pilot",
          "**Q4 2026**: 5K consumer, 3-5 enterprise, **$500K+ ARR**",
          "**Hiring**: VP Sales (Q1), Head of Ops (Q2)",
        ],
      },
    ],
    speakerNotes:
      "Lead with traction - we're not starting from zero. LOIs show enterprise interest. Explain the consumer-first strategy before investors ask. Hiring shows we're thinking about scale.",
    script:
      "We're not starting from zero. Six months of founder R&D with zero capital raised. Full CAD designs complete. Prototype in final assembly for Q1 completion. Kevlar nets tested and validated. And we have 2 LOIs from EU facilities pending our seed close. Our strategy: consumer first with SkySnare, then enterprise with AeroNet. Why? Consumer proves the technology, builds the brand, and generates revenue to fund the longer enterprise sales cycle. Higher enterprise margins follow. Key milestones: Q2 we get certifications, launch D2C, deploy our first EU pilot. Q4 we hit 5,000 consumer units, 3 to 5 enterprise installations, and over $500K in ARR. We're also hiring: VP Sales in Q1, Head of Ops in Q2.",
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
        title: "Co-Founder & CTO",
        highlights: [
          "15+ years fintech & SaaS",
          "Edge AI/ML systems",
          "Previously: enterprise SaaS exits",
        ],
        color: "#f97316", // Phoenix Orange
      },
      {
        initials: "MR",
        name: "Martyn Redelinghuys",
        title: "Co-Founder & CEO",
        highlights: [
          "20+ years energy/defense",
          "R500M+ portfolio mgmt",
          "Defense contractor relationships",
        ],
        color: "#ea580c", // Dark Orange
      },
      {
        initials: "PL",
        name: "Pieter La Grange",
        title: "Hardware Lead",
        highlights: [
          "15+ years embedded systems",
          "Medical device production (Snuza)",
          "Mass manufacturing experience",
        ],
        color: "#fb923c", // Light Orange
      },
      {
        initials: "EM",
        name: "Eben Maré",
        title: "Co-Founder & CFO",
        highlights: [
          "15+ years IB & PE",
          "Head Quant (Deloitte)",
          "Phoenix VC founding partner",
        ],
        color: "#fbbf24", // Amber
      },
    ],
    keyPoints: [
      "**Advisors:** Defense procurement (TBA), Counter-drone specialist (TBA)",
      "**All founders full-time** with personal capital committed",
      "**Hiring Q1:** VP Sales (defense background), Head of Ops",
    ],
    speakerNotes:
      "30 seconds max. Hit the highlights, mention advisors are being finalized, show hiring plans. Investors want to know you can execute, then move to the ask.",
    script:
      "Our team: Jurie on tech with edge AI and SaaS exits. Martyn on business with 20 years in energy and defense, including contractor relationships. Pieter on hardware with medical device mass manufacturing. Eben on finance with investment banking and VC experience. We're finalizing two advisors: one in defense procurement, one counter-drone specialist. All founders full-time with personal capital committed. Hiring VP Sales with defense background in Q1.",
  },

  // ==========================================
  // SLIDE 9: THE ASK - $960K SEED
  // ==========================================
  {
    number: 9,
    title: "The Ask: $960K at $3.5M Pre-Money",
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
          "**15%** Sales ($144K) - D2C launch, trade shows",
          "**20%** Ops + Cert ($192K) - legal, IP, CPSC/ASTM/CE",
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
        text: "**Round status:** $350K committed (36%)",
        subPoints: [
          "Lead investor confirmed",
          "Closing by **end of Q4 2025**",
        ],
      },
    ],
    speakerNotes:
      "State terms upfront - no ambiguity. Show round momentum with committed capital. The 36% creates urgency. End with demo CTA verbally.",
    script:
      "We're raising $960K on a SAFE at $3.5 million pre-money cap. Use of funds: 40% to engineering for AI and edge processing. 25% to hardware for prototypes and tooling. 15% to sales for D2C launch. 20% to operations and certification including CPSC, ASTM, and CE marking. What do you get? Certified product in market by Q2 2026. Over $500K ARR by Q4. Series A ready with proven traction. Round status: we have $350K committed - 36% of the round - with our lead investor confirmed. We're closing by end of Q4 2025. Let's schedule a live demo so you can see sub-200 millisecond response for yourself.",
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
  date: "December 2025",
  colorTheme: "investor" as const,
};
