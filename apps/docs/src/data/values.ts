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

  // Segments (by revenue)
  MILITARY_SHARE: "48%",
  MILITARY_VALUE: "$1.2B",
  INFRASTRUCTURE_SHARE: "24%",
  INFRASTRUCTURE_VALUE: "$600M",
  COMMERCIAL_SHARE: "16%",
  COMMERCIAL_VALUE: "$400M",
  BORDER_SHARE: "12%",
  BORDER_VALUE: "$300M",

  // Regional markets
  NORTH_AMERICA_SHARE: "41-42%",
  ASIA_PACIFIC_CAGR: "25.7%",
  EUROPE_2030: "€3.2B",
  EUROPE_CAGR: "24%",
  MIDDLE_EAST_2030: "$1.8B",
  MIDDLE_EAST_CAGR: "28%",
  ASIA_PACIFIC_2030: "$3.5B",
  SOUTH_AFRICA_2030: "$120M",

  // Key events & contracts
  PENTAGON_REPLICATOR: "$500M",
  PENTAGON_TIMELINE: "August 2025",
  RAYTHEON_COYOTE: "$5.04B",
  RAYTHEON_TIMELINE: "Through 2033",
  TOTAL_CONTRACTS: "$6B+",
  EU_DEFENCE_FUND: "€8B (2021-2027)",

  // Ukraine statistics
  UKRAINE_DRONES_2024: "1M+",
  UKRAINE_CASUALTY_RATE: "15%",
  UKRAINE_MONTHLY_LOSSES: "10,000+",
  DRONE_DAMAGE_2023: "$2.3B",

  // Market gaps
  FACILITIES_UNPROTECTED: "64%",
  COMPETITOR_FALSE_POSITIVE: "15-25%",
  COMPETITOR_RESPONSE_TIME: "2-5 seconds",
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
  TPS_REAL_WORLD: "3,000-4,500",
  TPS_MIN: 65000,
  TPS_MAX: 100000,
  FINALITY: "400ms",
  FINALITY_SUB: "sub-2-second",
  COST_PER_TX: "$0.00025",
  ANNUAL_COST: "$7,884",
  ANNUAL_COST_CONTEXT: "for continuous logging (1 TPS)",
  HASH_ALGORITHM: "SHA-256",
  SIGNATURE_ALGORITHM: "Ed25519",
  SECURITY_BITS: "256-bit",
  ETHEREUM_COST: "$5-50+",
  POLYGON_COST: "$0.01",
  HEDERA_COST: "$0.0001",
  X402_STATUS: "Live",
  X402_PRICE: "$0.01-0.05",
};

/** Hardware Values */
export const HARDWARE = {
  COMPUTE_PLATFORM: "NVIDIA Jetson AGX Orin",
  COMPUTE_TOPS: "275 TOPS",
  MEMORY: "64GB",
  MEMORY_BANDWIDTH: "204.8 GB/s",
  CUDA_CORES: "2048",
  TENSOR_CORES: "64",
  MIL_SPEC: "MIL-STD-810H",
  IP_RATING: "IP67",
  TEMP_RANGE: "-40°C to +70°C",
  TEMP_RANGE_INDUSTRIAL: "-40°C to +85°C",
  POWER_TYPICAL: "60W",
  POWER_PEAK: "100W",
  POWER_AVG: "150-250W",

  // Orin NX
  ORIN_NX_TOPS: "100 TOPS",
  ORIN_NX_CUDA: "1024",
  ORIN_NX_MEMORY: "16GB LPDDR5",
  ORIN_NX_POWER: "30W typical, 50W peak",

  // Nano
  NANO_TOPS: "0.5 TOPS",
  NANO_CUDA: "128",
  NANO_MEMORY: "4GB LPDDR4",
  NANO_POWER: "7W typical, 15W peak",

  // Sensors
  CAMERA_COUNT: "Up to 8 (16 via virtual channels)",
  CAMERA_RESOLUTION: "1080p-4K",
  LIDAR_MEASUREMENTS: "1,000,000/second",
  RF_FREQUENCY_RANGE: "100MHz-6GHz",
  ACOUSTIC_RANGE: "200-500m",

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
  // Response times
  DRONESHIELD_RESPONSE: ">5,000ms",
  DEDRONE_RESPONSE: ">10,000ms",
  ANDURIL_RESPONSE: "2-5 seconds",
  RAFAEL_RESPONSE: ">10,000ms",
  FORTEM_RESPONSE: "2-5 seconds",
  AARONIA_RESPONSE: "1-3 seconds",

  // Pricing
  DRONESHIELD_PRICE: "$1.2M+",
  DEDRONE_PRICE: "$1.5M+",
  FORTEM_PRICE: "$800K-1.2M",
  ANDURIL_PRICE: "$100K-$500K",

  // Accuracy
  ANDURIL_ACCURACY: "95%",
  FORTEM_ACCURACY: "90%",
  DRONESHIELD_ACCURACY: "85%",
  AARONIA_ACCURACY: "80%",
  FORTEM_CAPTURE_RATE: "85%",

  // Valuations & funding
  ANDURIL_VALUATION: "$28B",
  ANDURIL_SERIES_G: "$2.5B",
  ANDURIL_EMPLOYEES: "2,500+",
  ANDURIL_REVENUE: "$1B+",
  ANDURIL_MARKET_SHARE: "~15%",

  FORTEM_VALUATION: "$1.2B",
  FORTEM_EMPLOYEES: "500+",
  FORTEM_REVENUE: "$200M+",
  FORTEM_MARKET_SHARE: "~12%",

  DRONESHIELD_EMPLOYEES: "200+",
  DRONESHIELD_REVENUE: "$50M+",
  DRONESHIELD_DEPLOYED: "4,000+",
  DRONESHIELD_MARKET_SHARE: "~8%",

  UNIQUE_FEATURES: [
    "Blockchain evidence (only us)",
    "True offline capability",
    "Pre-hardware revenue (x402)",
    "Non-ITAR jurisdiction",
  ],
};

/** Canada CUAS Sandbox */
export const CUAS_SANDBOX = {
  EVENT_DATES: "September 14 - October 9, 2026",
  APPLICATION_DEADLINE: "December 15, 2025, 2:00 PM ET",
  PRIZE_POOL: "$1.75 million CAD",
  PERIMETER_RADIUS: "2.5 km",
  BORDER_COVERAGE: "10 km",
  MIN_TRL: "TRL 5",
};

/** SkySnare Consumer Product */
export const SKYSNARE = {
  MSRP: "$349",
  TARGET_MARKET: "$3.22B outdoor sports toy market",
  TAM: "$1.68B",
  YEAR_1_UNITS: 5000,
  RETURN_RATE: "<3%",
  COGS: "$135",
  CONTRIBUTION_MARGIN: "59%",
  CAC: "$60",
};

/** AeroNet Enterprise */
export const AERONET = {
  SETUP_FEE: "$75K",
  MONTHLY_FEE: "$45K/month",
  TAM: "$4.2B",
};

/** Technology/Technical Values */
export const TECH = {
  // AI/ML
  AI_MODEL: "YOLOv9",
  MODEL_SIZE: "<50MB",
  TENSORRT_SPEEDUP: "5-10x",
  FRAME_RATE: "30-60 FPS",

  // Network
  MESH_THROUGHPUT: "100+ Mbps",
  MESH_RANGE: "50+ km",
  COORDINATION_LATENCY: "sub-100ms",
  JAMMING_RANGE: "15km",

  // Sensors
  SENSOR_TYPES: "RF, radar, EO/IR, acoustic, LiDAR",
  SENSOR_COUNT: 6,
};

/** Funding Values */
export const FUNDING = {
  SEED_ROUND: "$500K-$1M",
  SERIES_A_TARGET: "$30-50M",
  BURN_RATE: "$200K/month",
  RUNWAY: "18 months",

  // Use of funds
  HARDWARE_PROTOTYPING: "30%",
  MARKET_ENTRY: "40%",
  TEAM_EXPANSION: "30%",

  // Revenue projections (USD)
  REVENUE_2026: "$2M",
  REVENUE_2027: "$15M",
  REVENUE_2028: "$50M",
  REVENUE_2029: "$100M",
  REVENUE_2030: "$150M",

  // Targets
  YEAR_1_SYSTEMS: 25,
  PILOT_INSTALLATIONS: 5,
  X402_CUSTOMERS: 10,
};

/** RKV-M Interceptor Specs */
export const RKV_M = {
  MAX_SPEED: ">150 km/h",
  HOVER_ENDURANCE: "8-12 minutes",
  CRUISE_ENDURANCE: "15-20 minutes",
  OPERATING_ALTITUDE: "0-500m AGL",
  MAX_ALTITUDE: "1,000m AGL",
  TIME_TO_LAUNCH: "<3 seconds",
  INTERCEPT_RANGE: "500m",
  CLOSURE_RATE: ">200 km/h",
  YAW_RATE: "±60°/s",
  DUCT_DIAMETER: "0.60m (600mm)",
  TIP_GAP: "10mm",
  BLADE_COUNT: 3,
  TIP_SPEED: "≤120 m/s",
  ASSEMBLY_TIME: "3.5 hours",
  MOTOR_CONFIG: "16-20S HV outrunner",
  TRL: 7,
};

/** Manufacturing Values */
export const MANUFACTURING = {
  // Investment
  FACILITY_SETUP: "R50M ($3.3M)",
  EQUIPMENT_TOOLING: "R30M ($2M)",
  WORKING_CAPITAL: "R20M ($1.3M)",
  TOTAL_INVESTMENT: "R100M ($6.6M)",

  // Production targets
  YEAR_1_SYSTEMS: 10,
  YEAR_2_SYSTEMS: 50,
  YEAR_3_SYSTEMS: 200,
  YEAR_4_SYSTEMS: "500+",

  // Costs
  INHOUSE_COST: "R850,000",
  OUTSOURCED_COST: "R1,400,000",
  COST_REDUCTION: "40%",
  MARGIN_IMPROVEMENT: "65%",

  // Payback
  PAYBACK_PERIOD: "18 months",
};

/** Net Specifications */
export const NETS = {
  // Air-to-Air Interceptor Net
  AIR_TO_AIR_SIZE: "3m × 3m (9 m²)",
  AIR_TO_AIR_STOWED: "150mm × 80mm cylinder",
  AIR_TO_AIR_MESH: "50mm × 50mm",
  AIR_TO_AIR_STRENGTH: "450 kg per strand",
  AIR_TO_AIR_WEIGHT: "180g",
  AIR_TO_AIR_DEPLOYMENT: "15 m/s expansion",
  AIR_TO_AIR_TEMP_RANGE: "-40°C to +85°C",

  // Large Format Net
  LARGE_FORMAT_SIZE: "6m × 6m (36 m²)",
  LARGE_FORMAT_STRENGTH: "800 kg per strand",
  LARGE_FORMAT_TARGET_SPEED: "Up to 150 km/h",

  // Ground-Launched Net (SkySnare)
  GROUND_SIZE: "2m × 2m (4 m²)",
  GROUND_RANGE: "15-30m effective",
  GROUND_MATERIAL: "HDPE/Nylon blend",
  GROUND_MESH: "40mm × 40mm",
  GROUND_WEIGHT: "85g",
  GROUND_RELOAD_TIME: "30 seconds",

  // Net Launcher Pod
  POD_DIMENSIONS: "180mm × 100mm × 100mm",
  POD_WEIGHT: "350g",
  PODS_PER_RKV_M: 4,
  LAUNCH_VELOCITY: "25 m/s",
  EFFECTIVE_RANGE: "10-30m from target",
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
  CUAS_SANDBOX,
  SKYSNARE,
  AERONET,
  TECH,
  FUNDING,
  RKV_M,
  MANUFACTURING,
  NETS,
};
