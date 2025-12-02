/**
 * Simple Value Exports for MDX
 *
 * These are the canonical values that can be easily imported in MDX files.
 * For the full data structures with metadata, use the other data files.
 *
 * Usage in MDX:
 * ```mdx
 * import { MARKET, PERFORMANCE, PRICING } from "@site/src/data/values";
 *
 * Market size: {MARKET.CURRENT}
 * ```
 */

/** Market Values */
export const MARKET = {
  // Current market size
  CURRENT: "$2.45-3.0B",
  CURRENT_YEAR: 2025,

  // Projected market size
  PROJECTED: "$9-15B",
  PROJECTED_YEAR: 2030,

  // Growth rate
  CAGR: "23-27%",
  CAGR_MIN: 23,
  CAGR_MAX: 27,

  // Segments
  MILITARY_SHARE: "50%",
  INFRASTRUCTURE_SHARE: "25%",
  COMMERCIAL_SHARE: "15%",
  INTERNATIONAL_SHARE: "10%",

  // Key events
  PENTAGON_REPLICATOR: "$500M",
  RAYTHEON_COYOTE: "$5.04B",
  RAYTHEON_TIMELINE: "Through 2033",
};

/** Performance Values */
export const PERFORMANCE = {
  // Response time
  RESPONSE_TIME: "120-195ms",
  RESPONSE_TIME_MIN: 120,
  RESPONSE_TIME_MAX: 195,
  VS_COMPETITORS: "10-150x faster",
  COMPETITOR_RANGE: "5,000-30,000ms",

  // Detection
  DETECTION_LATENCY: "50ms",
  AUTH_LATENCY: "2ms",

  // Accuracy
  ACCURACY: "99.5%",
  YOLOV9_MAP: "99.7%",
  FALSE_POSITIVE: "<0.3%",

  // Range
  DETECTION_RANGE: "0.5-2 km",
  DETECTION_RANGE_EXTENDED: "2-5 km",

  // Other
  CONCURRENT_TARGETS: "10+",
  AVAILABILITY: "99.9%",
  AUTONOMY_LEVEL: "SAE Level 4",
};

/** Pricing Values */
export const PRICING = {
  // Hardware
  SYSTEM_RANGE: "$25K-$100K",
  MILITARY_RANGE: "$75K-$100K",
  INFRASTRUCTURE_RANGE: "$45K-$65K",
  COMMERCIAL_RANGE: "$25K-$45K",

  // Cost savings
  COST_SAVINGS: "60%",
  INHOUSE_COST_ZAR: "R850,000",
  INHOUSE_COST_USD: "$56,000",

  // Margins
  GROSS_MARGIN: "65%",
  EBITDA_TARGET: "25%",

  // Funding
  SEED_ROUND: "$500K-$1M",
  SERIES_A: "R120M (~$6.7M)",
  EXIT_VALUATION: "R2-5B",
};

/** Revenue Projections */
export const REVENUE = {
  YEAR_1: "R25M",
  YEAR_1_SYSTEMS: 25,
  YEAR_2: "R75M",
  YEAR_2_SYSTEMS: 75,
  YEAR_3: "R150M",
  YEAR_3_SYSTEMS: 150,
  YEAR_5: "R500M",
  YEAR_5_SYSTEMS: 500,
};

/** Blockchain Values */
export const BLOCKCHAIN = {
  PRIMARY_CHAIN: "Solana",
  TPS: "65,000-100,000",
  TPS_MIN: 65000,
  TPS_MAX: 100000,
  FINALITY: "400ms",
  COST_PER_TX: "$0.00025",
  X402_STATUS: "Live",
  X402_PRICE: "$0.01-0.05",
};

/** Hardware Values */
export const HARDWARE = {
  COMPUTE_PLATFORM: "NVIDIA Jetson AGX Orin",
  COMPUTE_TOPS: "275 TOPS",
  MEMORY: "64GB",
  MIL_SPEC: "MIL-STD-810H",
  IP_RATING: "IP67",
  TEMP_RANGE: "-40°C to +70°C",
  POWER_AVG: "150-250W",

  // Net launcher
  NET_MATERIAL: "Kevlar",
  NET_STATUS: "Design complete",
};

/** Team Values */
export const TEAM = {
  CTO_NAME: "Jurie (Hans Jurgens) Smit",
  CEO_NAME: "Martyn Redelinghuys",
  COMBINED_EXPERIENCE: "35+ years",
  COMPANY_STRUCTURE: "Delaware C-Corp (in progress)",
  SECONDARY_ENTITY: "South African Entity (Q2 2026)",
  CONTACT_EMAIL: "jurie@phoenixvc.tech",
  CONTACT_PHONE: "+27 (069) 140-6835",
};

/** Roadmap Values */
export const ROADMAP = {
  CURRENT_WEEK: "Week 48",
  CURRENT_YEAR: 2025,

  // Q1 2026
  Q1_2026: "Net launcher prototype, first EU pilot",

  // Q2 2026
  Q2_2026: "EU certification, 3 installations, x402 contracts",

  // Q3 2026
  Q3_2026: "Series A with proven revenue, 5 installations",

  // Q4 2026
  Q4_2026: "Canada expansion, manufacturing partnerships",

  // Milestones
  SEED_RUNWAY: "18 months",
  PILOT_TARGET: 5,
  ENTERPRISE_TARGET: 10,
};

/** Competitor Values */
export const COMPETITORS = {
  DRONESHIELD_RESPONSE: ">5,000ms",
  DEDRONE_RESPONSE: ">10,000ms",
  ANDURIL_RESPONSE: "~2,000ms",
  RAFAEL_RESPONSE: ">10,000ms",

  DRONESHIELD_PRICE: "$1.2M+",
  DEDRONE_PRICE: "$1.5M+",
  FORTEM_PRICE: "$800K-1.2M",

  UNIQUE_FEATURES: [
    "Blockchain evidence (only us)",
    "True offline capability",
    "Pre-hardware revenue (x402)",
    "Non-ITAR jurisdiction",
  ],
};

/** All values combined for easy import */
export const ALL_VALUES = {
  MARKET,
  PERFORMANCE,
  PRICING,
  REVENUE,
  BLOCKCHAIN,
  HARDWARE,
  TEAM,
  ROADMAP,
  COMPETITORS,
};
