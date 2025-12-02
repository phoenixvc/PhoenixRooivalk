/**
 * Market Data - Counter-UAS Market Statistics
 *
 * Single source of truth for all market-related figures.
 * When updating, change values here and all docs will reflect the change.
 */

import type { RangeValue, CurrencyValue, DataPoint, DataSource } from "./types";

/** Market research sources */
export const marketSources: Record<string, DataSource> = {
  marketsAndMarkets: {
    name: "MarketsandMarkets",
    url: "https://www.marketsandmarkets.com/",
    date: "2024",
  },
  droneIndustryInsights: {
    name: "Drone Industry Insights",
    url: "https://droneii.com/",
    date: "2024",
  },
  pentagonBudget: {
    name: "Pentagon FY2025 Budget",
    date: "2024",
  },
};

/** Global Counter-UAS Market Size */
export const market = {
  /** Current market size (2025) */
  current: {
    year: 2025,
    size: {
      min: 2.45,
      max: 3.0,
      unit: "B",
      confidence: "verified",
      source: marketSources.marketsAndMarkets,
      notes: "Counter-UAS market including detection and neutralization",
    } as RangeValue,
    formatted: "$2.45-3.0B",
  },

  /** Projected market size (2030) */
  projected: {
    year: 2030,
    size: {
      min: 9,
      max: 15,
      unit: "B",
      confidence: "projected",
      source: marketSources.marketsAndMarkets,
      notes: "Projected based on 23-27% CAGR",
    } as RangeValue,
    formatted: "$9-15B",
  },

  /** Compound Annual Growth Rate */
  cagr: {
    min: 23,
    max: 27,
    unit: "%",
    confidence: "projected",
    source: marketSources.marketsAndMarkets,
  } as RangeValue,

  /** Market segments breakdown */
  segments: {
    military: {
      share: 50,
      value: 1.2,
      unit: "B",
      description: "Defense and security forces",
    },
    infrastructure: {
      share: 25,
      value: 0.8,
      unit: "B",
      description: "Critical facilities protection (airports, power plants)",
    },
    commercial: {
      share: 15,
      value: 0.5,
      unit: "B",
      description: "Private sector applications",
    },
    international: {
      share: 10,
      value: 0.3,
      unit: "B",
      description: "Export and partnerships",
    },
  },

  /** Geographic focus */
  geography: {
    phase1: {
      regions: ["EU", "Canada"],
      rationale: "Immediate drone threat, favorable regulations",
      timeline: "2025-2026",
    },
    phase2: {
      regions: ["South Africa"],
      rationale: "Market development needed, 2-3 years out",
      timeline: "2027-2028",
    },
    phase3: {
      regions: ["Middle East", "Asia-Pacific"],
      rationale: "Growing concerns, expansion opportunity",
      timeline: "2028+",
    },
  },
};

/** Key market events and contracts */
export const marketEvents = {
  pentagonReplicator: {
    name: "Pentagon Replicator Program",
    value: {
      usd: 500_000_000,
      confidence: "verified",
      source: marketSources.pentagonBudget,
    } as CurrencyValue,
    timeline: "August 2025",
    description: "Deploy thousands of autonomous drones",
  },

  raytheonCoyote: {
    name: "Raytheon Coyote Interceptor Contract",
    value: {
      usd: 5_040_000_000,
      confidence: "verified",
      notes: "Through 2033",
    } as CurrencyValue,
    timeline: "Through 2033",
    description: "Coyote Block 2 interceptor program",
  },

  ukraineDroneProduction: {
    year: 2024,
    quantity: 1_000_000,
    description: "Drones produced in Ukraine",
    casualtyRate: "15% of all casualties",
  },

  ukraineDroneLosses: {
    monthly: 10_000,
    description: "Drones lost monthly to jamming",
  },
};

/** Target Addressable Market (TAM) calculations */
export const tam = {
  total: {
    year: 2030,
    value: 15_000_000_000,
    formatted: "$15B",
  },
  serviceable: {
    // SAM - markets we can realistically serve
    value: 5_000_000_000,
    formatted: "$5B",
    regions: ["EU", "Canada", "South Africa", "Middle East"],
  },
  obtainable: {
    // SOM - realistic market share target
    targetShare: 20,
    value: 1_000_000_000,
    formatted: "$1B",
    timeline: "By 2032",
  },
};

/** Helper function to format market data for display */
export function getMarketSummary(): string {
  return `Counter-UAS market: ${market.current.formatted} (2025) → ${market.projected.formatted} (2030) at ${market.cagr.min}-${market.cagr.max}% CAGR`;
}
