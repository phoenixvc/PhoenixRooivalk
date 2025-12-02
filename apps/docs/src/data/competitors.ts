/**
 * Competitor Data
 *
 * Single source of truth for competitive analysis and comparison data.
 */

import { performance } from "./performance";

/** Major Competitors */
export const competitors = {
  droneShield: {
    name: "DroneShield",
    hq: "Australia/USA",
    founded: 2014,
    publiclyTraded: true,
    ticker: "DRO (ASX)",

    products: ["DroneGun", "DroneSentry", "DroneOptID"],

    strengths: [
      "Established market presence",
      "Public company with capital access",
      "Government contracts",
    ],

    weaknesses: [
      "Slow response time (>5 seconds)",
      "Cloud-dependent systems",
      "No blockchain evidence",
      "Higher pricing ($1.2M+)",
    ],

    metrics: {
      responseTime: ">5,000ms",
      offlineCapable: false,
      blockchainEvidence: false,
      pricing: "$1.2M+",
    },
  },

  dedrone: {
    name: "Dedrone",
    hq: "USA/Germany",
    founded: 2014,
    acquisition: "Acquired by Axon (2023)",

    products: ["DedroneTracker", "DedroneSensor"],

    strengths: [
      "Strong detection capabilities",
      "Enterprise customer base",
      "Axon backing",
    ],

    weaknesses: [
      "Detection only - no neutralization",
      "Cloud-dependent",
      "No blockchain",
      "High pricing ($1.5M+)",
    ],

    metrics: {
      responseTime: ">10,000ms",
      offlineCapable: false,
      blockchainEvidence: false,
      pricing: "$1.5M+",
      neutralization: false,
    },
  },

  anduril: {
    name: "Anduril Industries",
    hq: "USA",
    founded: 2017,
    valuation: "$14B (2024)",
    fundingTotal: "$4.5B+",

    products: ["Lattice AI", "Anvil", "Sentry Tower", "Ghost"],

    strengths: [
      "Massive funding and valuation",
      "Advanced AI/ML capabilities",
      "DoD relationships",
      "Full-stack autonomous systems",
    ],

    weaknesses: [
      "US-focused (ITAR restrictions)",
      "Premium pricing",
      "Not focused on commercial market",
    ],

    metrics: {
      responseTime: "~2,000-5,000ms",
      offlineCapable: "Limited",
      blockchainEvidence: false,
      pricing: "Premium (undisclosed)",
    },
  },

  rafaelDroneDome: {
    name: "Rafael Drone Dome",
    hq: "Israel",
    parent: "Rafael Advanced Defense Systems",

    products: ["Drone Dome", "C-Guard RD"],

    strengths: [
      "Combat-proven in Middle East",
      "Integrated with Iron Dome",
      "Strong military credentials",
    ],

    weaknesses: [
      "Military-only focus",
      "High cost",
      "Export restrictions",
      "Slow response for soft-kill",
    ],

    metrics: {
      responseTime: ">10,000ms",
      offlineCapable: "Partial",
      blockchainEvidence: false,
      pricing: "$1.3M+",
    },
  },

  fortem: {
    name: "Fortem Technologies",
    hq: "USA",
    founded: 2016,

    products: ["TrueView Radar", "DroneHunter", "SkyDome"],

    strengths: [
      "AI-powered radar detection",
      "Autonomous interception",
      "FAA partnerships",
    ],

    weaknesses: [
      "Slower response time",
      "Cloud-dependent analytics",
      "No blockchain",
      "US-centric",
    ],

    metrics: {
      responseTime: ">2,000ms",
      offlineCapable: false,
      blockchainEvidence: false,
      pricing: "$800K-1.2M",
    },
  },

  raytheonCoyote: {
    name: "Raytheon Coyote",
    hq: "USA",
    parent: "RTX Corporation",

    products: ["Coyote Block 2", "Coyote Block 3"],

    contract: {
      value: 5_040_000_000,
      formatted: "$5.04B",
      timeline: "Through 2033",
    },

    strengths: [
      "Combat-proven (multiple theaters)",
      "Massive government contract",
      "Kinetic kill capability",
      "Integration with NASAMS",
    ],

    weaknesses: [
      "Consumable (not reusable)",
      "High per-unit cost",
      "Military-only",
      "US government focus",
    ],

    metrics: {
      type: "Kinetic interceptor",
      reusable: false,
      pricing: "Government contract",
    },
  },
};

/** Phoenix Rooivalk Competitive Advantages */
export const phoenixAdvantages = {
  speed: {
    metric: performance.responseTime.formatted,
    comparison: "10-150x faster than competitors",
    competitorRange: "5,000-30,000ms",
  },

  autonomy: {
    capability: "True offline operation",
    environments: "RF-denied, GPS-denied",
    competitors: "Most require cloud connectivity",
  },

  blockchain: {
    capability: "Blockchain-anchored evidence",
    legalBenefit: "Court-admissible audit trail",
    competitors: "No competitor offers this",
  },

  architecture: {
    type: "Open architecture",
    benefit: "No vendor lock-in",
    competitors: "Proprietary systems",
  },

  revenue: {
    status: "Pre-hardware revenue via x402",
    competitors: "Most still in R&D or hardware-only",
  },

  pricing: {
    range: "$25K-$100K per system",
    vsCompetitors: "60% lower cost",
    inHouseAdvantage: "In-house Kevlar manufacturing",
  },

  exportAdvantage: {
    location: "South Africa (non-ITAR)",
    access: "150+ countries",
    competitors: "US companies face ITAR restrictions",
  },
};

/** Comparison Table Data */
export const comparisonTable = {
  headers: [
    "Feature",
    "Phoenix Rooivalk",
    "DroneShield",
    "Dedrone",
    "Anduril",
    "Rafael",
  ],

  rows: [
    {
      feature: "Response Time",
      phoenix: performance.responseTime.formatted,
      droneShield: ">5,000ms",
      dedrone: ">10,000ms",
      anduril: "~2,000ms",
      rafael: ">10,000ms",
    },
    {
      feature: "Offline Capable",
      phoenix: "✅ Full",
      droneShield: "❌ No",
      dedrone: "❌ No",
      anduril: "⚠️ Limited",
      rafael: "⚠️ Partial",
    },
    {
      feature: "Blockchain Evidence",
      phoenix: "✅ Yes",
      droneShield: "❌ No",
      dedrone: "❌ No",
      anduril: "❌ No",
      rafael: "❌ No",
    },
    {
      feature: "Pre-Hardware Revenue",
      phoenix: "✅ x402 Live",
      droneShield: "❌ No",
      dedrone: "❌ No",
      anduril: "❌ No",
      rafael: "❌ No",
    },
    {
      feature: "Open Architecture",
      phoenix: "✅ Yes",
      droneShield: "❌ Proprietary",
      dedrone: "❌ Proprietary",
      anduril: "❌ Proprietary",
      rafael: "❌ Proprietary",
    },
    {
      feature: "Export Flexibility",
      phoenix: "✅ Non-ITAR",
      droneShield: "⚠️ Some restrictions",
      dedrone: "⚠️ US-based",
      anduril: "❌ ITAR restricted",
      rafael: "⚠️ Israel export controls",
    },
  ],
};

/** Market Positioning */
export const marketPositioning = {
  targetNiche: "Fast, autonomous, blockchain-verified counter-drone defense",

  differentiators: [
    "Only system with sub-200ms response AND blockchain evidence",
    "Only solution that works fully offline",
    "Only pre-hardware revenue model (x402)",
    "Lowest cost through in-house manufacturing",
    "Non-ITAR jurisdiction for global exports",
  ],

  avoidCompeting: [
    "Direct military kinetic systems (Raytheon's domain)",
    "Pure detection plays (Dedrone's niche)",
    "US government-only contracts (Anduril's strength)",
  ],

  targetMarkets: [
    "Commercial airports (EU, Canada)",
    "Critical infrastructure (power plants, prisons)",
    "International military (non-US allies)",
    "Private security (events, corporate)",
  ],
};

/** Helper to get competitive summary */
export function getCompetitiveSummary(): string {
  return `${phoenixAdvantages.speed.comparison} with blockchain evidence (unique) and ${phoenixAdvantages.pricing.vsCompetitors} pricing`;
}
