/**
 * Pricing & Financial Data
 *
 * Single source of truth for all pricing and financial figures.
 */

import type { CurrencyValue, RangeValue } from "./types";

/** Exchange rate for conversions */
export const exchangeRate = {
  usdToZar: 18, // Update this as needed
  lastUpdated: "2025-12",
};

/** Hardware pricing */
export const hardwarePricing = {
  /** Base system unit pricing by segment */
  baseSystem: {
    military: {
      usd: 75_000,
      zar: 1_350_000,
      range: { min: 75_000, max: 100_000 },
      confidence: "projected",
      notes: "Military/Defense segment pricing",
    } as CurrencyValue & { range: { min: number; max: number } },

    infrastructure: {
      usd: 55_000,
      zar: 990_000,
      range: { min: 45_000, max: 65_000 },
      confidence: "projected",
      notes: "Critical infrastructure segment",
    } as CurrencyValue & { range: { min: number; max: number } },

    commercial: {
      usd: 35_000,
      zar: 630_000,
      range: { min: 25_000, max: 45_000 },
      confidence: "projected",
      notes: "Commercial segment",
    } as CurrencyValue & { range: { min: number; max: number } },

    /** General range used in docs */
    general: {
      min: 25_000,
      max: 100_000,
      unit: "USD",
      confidence: "projected",
      notes: "Full range across all segments",
    } as RangeValue,
    formatted: "$25K-$100K",
  },

  /** Cost of goods (internal) */
  cogs: {
    inHouse: {
      usd: 56_000,
      zar: 850_000,
      confidence: "verified",
      notes: "In-house manufacturing cost per unit",
    } as CurrencyValue,

    outsourced: {
      usd: 93_000,
      zar: 1_400_000,
      confidence: "estimated",
      notes: "Outsourced manufacturing cost",
    } as CurrencyValue,

    savings: "60%",
    savingsNote: "Cost reduction through in-house Kevlar manufacturing",
  },

  /** Add-on pricing */
  addOns: {
    sensorUpgrades: {
      min: 50_000,
      max: 150_000,
      unit: "ZAR",
      confidence: "projected",
    } as RangeValue,

    additionalLauncher: {
      usd: 15_000,
      zar: 270_000,
      confidence: "projected",
    } as CurrencyValue,
  },
};

/** Software & Services pricing */
export const servicesPricing = {
  /** Annual software license */
  softwareLicense: {
    usd: 5_600,
    zar: 85_000,
    unit: "per system/year",
    confidence: "projected",
  } as CurrencyValue,

  /** Maintenance contract */
  maintenance: {
    usd: 2_800,
    zar: 42_500,
    unit: "per system/year",
    confidence: "projected",
  } as CurrencyValue,

  /** Training programs */
  training: {
    min: 1_650,
    max: 3_300,
    zarMin: 25_000,
    zarMax: 50_000,
    unit: "per operator",
    confidence: "projected",
  },

  /** Custom development */
  customDev: {
    min: 33_000,
    max: 130_000,
    zarMin: 500_000,
    zarMax: 2_000_000,
    unit: "per project",
    confidence: "projected",
  },
};

/** x402 Protocol pricing */
export const x402Pricing = {
  /** Per-verification cost */
  verification: {
    min: 0.01,
    max: 0.05,
    unit: "USD",
    confidence: "verified",
    notes: "Per tamper-proof timestamp",
  } as RangeValue,

  /** Solana transaction fee */
  solanaFee: {
    value: 0.00025,
    unit: "USD",
    confidence: "verified",
    notes: "Per transaction, scales to millions",
  },

  /** Use cases */
  useCases: [
    "Insurance: Drone damage claims need tamper-proof incident footage",
    "Legal: Court-admissible evidence chain for prosecution/defense",
    "Regulatory: Aviation authority compliance reports (CAA, EASA, FAA)",
  ],
};

/** Financial projections */
export const financialProjections = {
  /** Revenue projections by year */
  revenue: {
    year1: {
      amount: 25_000_000,
      zar: true,
      systems: 25,
      formatted: "R25M",
    },
    year2: {
      amount: 75_000_000,
      zar: true,
      systems: 75,
      formatted: "R75M",
      notes: "Including services revenue",
    },
    year3: {
      amount: 150_000_000,
      zar: true,
      systems: 150,
      formatted: "R150M",
      notes: "Including recurring revenue",
    },
    year4: {
      amount: 300_000_000,
      zar: true,
      systems: 300,
      formatted: "R300M",
      notes: "International expansion",
    },
    year5: {
      amount: 500_000_000,
      zar: true,
      systems: 500,
      formatted: "R500M",
      notes: "Market leadership",
    },
  },

  /** Margin targets */
  margins: {
    gross: {
      value: 65,
      unit: "%",
      notes: "Hardware + software combined",
    },
    ebitda: {
      value: 25,
      unit: "%",
      timeline: "By Year 3",
    },
  },

  /** Unit economics */
  unitEconomics: {
    cac: {
      value: 50_000,
      unit: "ZAR",
      notes: "Customer Acquisition Cost",
    },
    ltv: {
      value: 1_200_000,
      unit: "ZAR",
      notes: "Customer Lifetime Value",
    },
    payback: {
      value: 12,
      unit: "months",
      notes: "Average payback period",
    },
  },
};

/** Investment rounds */
export const fundingRounds = {
  seed: {
    target: {
      min: 500_000,
      max: 1_000_000,
      unit: "USD",
      confidence: "target",
    } as RangeValue,
    formatted: "$500K-$1M",
    use: {
      hardware: 30,
      market: 40,
      team: 30,
    },
    runway: "18 months",
    milestones: [
      "5 pilot installations",
      "10 x402 enterprise customers",
      "Key regulatory certifications",
    ],
  },

  seriesA: {
    target: {
      value: 120_000_000,
      unit: "ZAR",
      usd: 6_700_000,
      confidence: "projected",
    },
    formatted: "R120M (~$6.7M)",
    timeline: "Q3 2026",
    preConditions: ["Proven revenue", "5 operational installations"],
  },

  exit: {
    valuation: {
      min: 2_000_000_000,
      max: 5_000_000_000,
      unit: "ZAR",
      confidence: "projected",
    } as RangeValue,
    formatted: "R2-5B",
    timeline: "Year 5-7",
    type: "IPO or strategic acquisition",
  },
};

/** Helper for pricing display */
export function formatPriceRange(
  segment: "military" | "infrastructure" | "commercial",
): string {
  const pricing = hardwarePricing.baseSystem[segment];
  return `$${(pricing.range.min / 1000).toFixed(0)}K-$${(pricing.range.max / 1000).toFixed(0)}K`;
}
