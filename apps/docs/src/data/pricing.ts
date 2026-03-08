/**
 * Pricing & Financial Data
 *
 * Segment-level and financial pricing for documentation pages.
 *
 * IMPORTANT — SOURCE OF TRUTH HIERARCHY:
 *   Per-SKU prices (individual product prices, COGS, margins, assembly hours):
 *     → apps/marketing/src/data/products.ts  (canonical per-SKU source)
 *
 *   Segment / deployment-package pricing and financial projections:
 *     → this file  (pricing.ts)
 *
 * The `hardwarePricing.baseSystem` ranges below represent DEPLOYMENT SOLUTION
 * PACKAGES — the cost of a complete site deployment that typically bundles
 * multiple SKUs together with installation, cabling, and initial configuration.
 * They are NOT the price of any single SKU.  For individual SKU prices, always
 * reference products.ts.
 *
 * Last reconciled against products.ts: 2026-02-22 (PRD-004)
 */

import type { CurrencyValue, RangeValue } from "./types";

/** Exchange rate for conversions */
export const exchangeRate = {
  usdToZar: 18, // Update this as needed
  lastUpdated: "2025-12",
};

/** Hardware pricing */
export const hardwarePricing = {
  /**
   * Deployment package pricing by market segment.
   *
   * Each entry represents the total hardware cost for a complete site
   * deployment (multiple SKUs + installation), NOT the price of a single
   * product.  The table below maps segments to the representative SKU bundles
   * that drive these ranges (all individual prices from products.ts):
   *
   *  commercial    — SkyWatch Pro ($250-$600) + NetSnare Pro ($1,200-$2,000)
   *                  per detection/intercept node.  A single-site commercial
   *                  install of one detector + one launcher runs $1,450-$2,600;
   *                  a two-node site with redundancy runs $2,900-$5,200.
   *                  Representative range: $2K-$5K.
   *
   *  infrastructure — SkyWatch Enterprise ($5,000-$20,000) per sensor tower
   *                   + AeroNet Command software license ($25,000-$50,000)
   *                   covering unlimited sites.  A single-facility deployment
   *                   combining one Enterprise sensor cluster with Command
   *                   runs $30,000-$70,000.
   *                   Representative range: $30K-$70K.
   *
   *  military      — RKV-G Ground Station ($100,000-$150,000) as the mobile
   *                  C2 hub + at least one RKV-M Mothership ($65,000-$85,000)
   *                  per forward element.  A minimum deployable unit (one GCS
   *                  + one RKV-M) runs $165,000-$235,000.
   *                  Representative range: $165K-$235K.
   *
   * Per-SKU canonical prices (individual units, no installation):
   *   products.ts → SkyWatch Pro:        $250-$600
   *   products.ts → NetSnare Pro:        $1,200-$2,000
   *   products.ts → SkyWatch Enterprise: $5,000-$20,000
   *   products.ts → AeroNet Enterprise:  $150,000 setup + $25K/month
   *   products.ts → AeroNet Command:     $25,000-$50,000 license
   *   products.ts → RKV-M Mothership:    $65,000-$85,000
   *   products.ts → RKV-G Ground Station:$100,000-$150,000
   */
  baseSystem: {
    /**
     * Military deployment package: RKV-G Ground Station + RKV-M Mothership.
     * Minimum deployable unit for a mobile forward air-defense position.
     * Individual SKU prices in products.ts: RKV-M $65K-$85K, RKV-G $100K-$150K.
     */
    military: {
      usd: 200_000,
      zar: 3_600_000,
      range: { min: 165_000, max: 235_000 },
      confidence: "projected",
      notes:
        "Military deployment package: RKV-G Ground Station + RKV-M Mothership (1 GCS + 1 aerial platform). See products.ts for individual SKU prices.",
    } as CurrencyValue & { range: { min: number; max: number } },

    /**
     * Infrastructure deployment package: SkyWatch Enterprise sensor cluster
     * + AeroNet Command software license (unlimited sites).
     * Individual SKU prices in products.ts: SW-ENT-001 $5K-$20K, AN-CMD-001 $25K-$50K.
     */
    infrastructure: {
      usd: 50_000,
      zar: 900_000,
      range: { min: 30_000, max: 70_000 },
      confidence: "projected",
      notes:
        "Infrastructure deployment package: SkyWatch Enterprise + AeroNet Command license per facility. See products.ts for individual SKU prices.",
    } as CurrencyValue & { range: { min: number; max: number } },

    /**
     * Commercial deployment package: SkyWatch Pro + NetSnare Pro per site node.
     * A two-node redundant commercial site runs ~$2,900-$5,200 hardware-only.
     * Individual SKU prices in products.ts: SW-PRO-001 $250-$600, NSN-PRO-001 $1,200-$2,000.
     */
    commercial: {
      usd: 3_500,
      zar: 63_000,
      range: { min: 2_000, max: 5_000 },
      confidence: "projected",
      notes:
        "Commercial deployment package: SkyWatch Pro + NetSnare Pro per site node (hardware only, no AeroNet Command license). See products.ts for individual SKU prices.",
    } as CurrencyValue & { range: { min: number; max: number } },

    /**
     * General range spanning all deployment package tiers.
     * Commercial node ($2K) through military system ($235K).
     */
    general: {
      min: 2_000,
      max: 235_000,
      unit: "USD",
      confidence: "projected",
      notes:
        "Full deployment-package range across all segments: commercial node ($2K-$5K) through military system ($165K-$235K). See products.ts for individual SKU prices.",
    } as RangeValue,
    formatted: "$2K-$235K",
  },

  /**
   * Cost of goods — aggregate BOM figures (no component-level breakdown yet).
   *
   * The inHouse figure ($56K) is the nearest published COGS proxy for a
   * high-end enterprise-tier unit.  The closest matching SKU in products.ts
   * is AeroNet Enterprise (AN-ENT-001) with COGS $59,200 — a 5.7% variance
   * likely reflecting assembly-hour cost assumptions used at different points
   * in time.  Use products.ts as the authoritative per-SKU COGS source.
   */
  cogs: {
    inHouse: {
      usd: 56_000,
      zar: 850_000,
      confidence: "verified",
      notes:
        "In-house manufacturing cost per enterprise-tier unit (proxy; nearest SKU match: AeroNet Enterprise at $59,200 COGS per products.ts — 5.7% variance).",
    } as CurrencyValue,

    outsourced: {
      usd: 93_000,
      zar: 1_400_000,
      confidence: "estimated",
      notes: "Outsourced manufacturing cost per enterprise-tier unit.",
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

/**
 * Helper for pricing display.
 * Returns the deployment-package range string for a given segment.
 * For individual SKU price strings, use products.ts → product.priceFormatted.
 */
export function formatPriceRange(
  segment: "military" | "infrastructure" | "commercial",
): string {
  const pricing = hardwarePricing.baseSystem[segment];
  const minK = pricing.range.min / 1000;
  const maxK = pricing.range.max / 1000;
  // Use integer formatting for values >= 10K, one decimal for sub-10K values
  const fmt = (k: number) =>
    k >= 10 ? `$${k.toFixed(0)}K` : `$${k.toFixed(0)}K`;
  return `${fmt(minK)}-${fmt(maxK)}`;
}
