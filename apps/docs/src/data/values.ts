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
  // Current market size (Source: MarketsandMarkets, November 2025)
  CURRENT: "$6.64B",
  CURRENT_YEAR: 2025,

  // Projected market size (Source: MarketsandMarkets, November 2025)
  PROJECTED: "$20.31B",
  PROJECTED_YEAR: 2030,

  // Growth rate (Source: MarketsandMarkets, November 2025)
  CAGR: "25.1%",
  CAGR_MIN: 25,
  CAGR_MAX: 25,

  // Related market CAGRs
  OUTDOOR_TOY_CAGR: "8.2%",
  COUNTER_DRONE_CAGR: "47%",

  // Segments (by revenue)
  MILITARY_SHARE: "48%",
  MILITARY_VALUE: "$1.2B",
  MILITARY_MARKET: "$800M",
  MILITARY_REVENUE_POTENTIAL: "$50M+",
  INFRASTRUCTURE_SHARE: "24%",
  INFRASTRUCTURE_VALUE: "$600M",
  INFRASTRUCTURE_MARKET: "$800M",
  INFRASTRUCTURE_REVENUE_POTENTIAL: "$30M+",
  COMMERCIAL_SHARE: "16%",
  COMMERCIAL_VALUE: "$400M",
  COMMERCIAL_MARKET: "$450M",
  COMMERCIAL_REVENUE_POTENTIAL: "$20M+",
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

  // Recent European incidents (Nov 2025)
  EUROPE_INCIDENTS_2025: "4x increase YoY",
  BRUSSELS_CLOSURE_NOV_2025: "Nov 4-5, 2025",
  BRUSSELS_FLIGHTS_CANCELLED: "dozens",
  DENMARK_ILLEGAL_FLIGHTS_2025: 107,
  POLAND_DRONES_SEP_2025: 23,
  POLAND_AIRPORTS_CLOSED: 4,
  GATWICK_2018_COST: "£60M",
  GATWICK_2018_PASSENGERS: "140,000+",
};

/** Performance Values */
export const PERFORMANCE = {
  // Response time
  RESPONSE_TIME: "120-195ms",
  RESPONSE_TIME_MIN: 120,
  RESPONSE_TIME_MAX: 195,
  VS_COMPETITORS: "10-150x faster",
  COMPETITOR_RANGE: "5,000-30,000ms",
  COMPETITOR_RESPONSE_TIME: "2-5 seconds",

  // Detection
  DETECTION_LATENCY: "50ms",
  AUTH_LATENCY: "2ms",

  // Accuracy
  ACCURACY: "99.5%",
  YOLOV9_MAP: "95.7%",
  YOLOV9_PRECISION: "0.946",
  YOLOV9_RECALL: "0.864",
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
  // Legacy field for backward compatibility
  TPS: "~107,000 (noop peak), ≈1,000 sustained",
  // Peak theoretical performance (noop/test transactions)
  TPS_PEAK: "~107,000 (noop peak)",
  // Sustained real-world throughput
  TPS_SUSTAINED: "≈1,000",
  TPS_MIN: 1000, // Sustained minimum
  TPS_MAX: 107000, // Peak maximum
  // Post-Alpenglow upgrade finality target
  FINALITY: "100–150ms (median, post-Alpenglow target)",
  FINALITY_SUB: "sub-2-second",
  // Transaction cost with priority fee variability
  COST_PER_TX: "~0.000005 SOL (~$0.0005) with variability for priority fees",
  ANNUAL_COST: "$157.68", // Updated for new cost: 0.000005 SOL * 31,536,000 tx/year * $100/SOL
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
  // Core Team
  CTO_NAME: "Jurie Smit",
  CTO_FULL_NAME: "Hans Jurgens (Jurie) Smit",
  CTO_TITLE: "Co-Founder & CTO",
  CTO_LINKEDIN: "https://www.linkedin.com/in/juriesmit/",
  CTO_BACKGROUND: "Systems Engineer & AI Architect, 15+ years fintech, citizen platforms, multi-tenant SaaS",
  CTO_EDUCATION: "B.Eng Industrial-Electronic (Stellenbosch), B.Com Quantitative Management (UNISA)",
  CTO_EXPERTISE: ["Edge AI/ML", "System Architecture", "Full-Stack Development", "Agile Methodologies"],

  CEO_NAME: "Martyn Redelinghuys",
  CEO_FULL_NAME: "Martyn Redelinghuys",
  CEO_TITLE: "Co-Founder & CEO",
  CEO_LINKEDIN: "https://www.linkedin.com/in/martynrede/",
  CEO_BACKGROUND: "20+ years energy, mining, defense. R500M+ portfolio management. Executive Project Manager.",
  CEO_EDUCATION: "MBA (GIBS), B.Eng Electrical & Electronic (Stellenbosch)",
  CEO_EXPERTISE: ["Project Management", "Energy Strategy", "Business Development", "Capital Projects"],
  CEO_CERTIFICATIONS: ["Certified Energy Manager (CEM)", "Certified Measurement & Verification Professional (CMVP)"],

  // Additional Team Members
  MEMBER_3_NAME: "Pieter La Grange",
  MEMBER_3_TITLE: "Co-Founder & Hardware Lead",
  MEMBER_3_LINKEDIN: "https://www.linkedin.com/in/pieterlagrange/",
  MEMBER_3_BACKGROUND: "Electronics Design Engineer at Snuza, 15+ years embedded systems & medical devices",
  MEMBER_3_EDUCATION: "B.Eng Electrical & Electronics (Stellenbosch)",
  MEMBER_3_EXPERTISE: ["Embedded Firmware", "Hardware Design", "Low-Power ARM", "BLE/WiFi", "RTOS"],

  MEMBER_4_NAME: "Eben Maré",
  MEMBER_4_TITLE: "Co-Founder & CFO",
  MEMBER_4_LINKEDIN: "https://www.linkedin.com/in/ebenmare/",
  MEMBER_4_BACKGROUND: "15+ years investment banking, private equity, quantitative finance. Former Head Quant at Deloitte, CIO experience.",
  MEMBER_4_EDUCATION: "BSc (Hons) Operations Research (UNISA), BSc Applied Mathematics (University of Pretoria)",
  MEMBER_4_EXPERTISE: ["Private Equity", "Investment Management", "Quantitative Modeling", "Algorithmic Trading", "Derivatives"],

  // Team Stats
  COMBINED_EXPERIENCE: "60+ years",
  TEAM_SIZE: 4,

  // Company Structure
  COMPANY_STRUCTURE: "Delaware C-Corp (in progress)",
  SECONDARY_ENTITY: "South African Entity (Q2 2026)",

  // Contact (role-based, not personal PII)
  CONTACT_EMAIL: "contact@phoenixrooivalk.com",
  CONTACT_PHONE: "+27 (0) 10 880 0000", // Company switchboard
  INVESTOR_EMAIL: "investors@phoenixrooivalk.com",
  SUPPORT_EMAIL: "support@phoenixrooivalk.com",
  ENTERPRISE_EMAIL: "enterprise@aeronet-security.com",
  CONSUMER_EMAIL: "hello@skysnare.com",
};

/** Roadmap Values */
export const ROADMAP = {
  CURRENT_WEEK: "Week 49",
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
  DRONESHIELD_VALUATION: "$500M+",
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
  RETURN_RATE: "8-10%",
  COGS: "$135",
  CONTRIBUTION_MARGIN: "59%",
  CAC: "$80-100",
};

/** AeroNet Enterprise */
export const AERONET = {
  SETUP_FEE: "$150K",
  MONTHLY_FEE: "$25K/month",
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
  // Investment rounds
  SEED_ROUND: "$500K-$1M",
  SERIES_A_TARGET: "$30-50M",
  BURN_RATE: "$200K/month",
  RUNWAY: "18 months",

  // Phased investment (TRL path)
  PHASE_1_CONCEPT: "$3.5M",
  PHASE_1_DURATION: "9 months",
  PHASE_1_TRL: "TRL 3-4",
  PHASE_2_PROTOTYPE: "$15M",
  PHASE_2_DURATION: "12 months",
  PHASE_2_TRL: "TRL 4-6",
  PHASE_3_INTEGRATION: "$25M",
  PHASE_3_DURATION: "15 months",
  PHASE_3_TRL: "TRL 6-7",
  TOTAL_TO_TRL7: "$43.5M",
  TOTAL_TIMELINE: "~3 years",

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

  // Business model projections
  BM_YEAR_1_REVENUE: "$2.5M",
  BM_YEAR_2_REVENUE: "$15M",
  BM_YEAR_3_REVENUE: "$45M",
  BM_YEAR_4_REVENUE: "$100M",
  BM_YEAR_5_REVENUE: "$160M",

  // Targets
  YEAR_1_SYSTEMS: 25,
  YEAR_2_SYSTEMS: 75,
  YEAR_3_SYSTEMS: 150,
  YEAR_4_SYSTEMS: 300,
  YEAR_5_SYSTEMS: 500,
  PILOT_INSTALLATIONS: 5,
  X402_CUSTOMERS: 10,

  // Funding sources (phased)
  PHASE_1_ANGEL: "$1M-$2M",
  PHASE_1_VC: "$1.5M-$2.5M",
  PHASE_1_SBIR: "$500K",
  PHASE_2_SERIES_A: "$8M-$12M",
  PHASE_2_DOD: "$2M-$3M",
  PHASE_2_STRATEGIC: "$2M-$5M",
  PHASE_3_SERIES_B: "$15M-$20M",
  PHASE_3_PRODUCTION: "$3M-$5M",
  PHASE_3_INTERNATIONAL: "$2M-$5M",

  // IOC per site
  IOC_PER_SITE: "$3M",
  IOC_HARDWARE: "$2M",
  IOC_INSTALLATION: "$500K",
  IOC_TRAINING: "$200K",
  IOC_SUPPORT_YEAR1: "$300K",

  // Implementation costs (specific projects)
  BLOCKCHAIN_IMPLEMENTATION: "$9.95M",
  BLOCKCHAIN_IMPLEMENTATION_DURATION: "15 months",
  BLOCKCHAIN_EXPECTED_ROI: "300%",
  BLOCKCHAIN_ROI_TIMELINE: "24 months",
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
  // Investment - Primary Facility
  FACILITY_SETUP: "R50M ($3.3M)",
  EQUIPMENT_TOOLING: "R30M ($2M)",
  WORKING_CAPITAL: "R20M ($1.3M)",
  TOTAL_INVESTMENT: "R100M ($6.6M)",

  // Investment - Secondary Facilities
  CAPE_TOWN_INVESTMENT: "R20M ($1.3M)",
  JOHANNESBURG_INVESTMENT: "R30M ($2M)",

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

/** Capital Requirements */
export const CAPITAL = {
  // Total funding needed
  TOTAL_FUNDING_ZAR: "R500M",
  TOTAL_FUNDING_USD: "$33M",

  // Allocation breakdown (ZAR)
  PRODUCT_DEVELOPMENT: "R150M",
  MANUFACTURING_SETUP: "R100M",
  CERTIFICATION_TESTING: "R50M",
  SALES_MARKETING: "R50M",
  WORKING_CAPITAL: "R150M",

  // Funding sources
  IDC_MANUFACTURING_LOAN: "R100M",
  DTI_ARMSCOR_GRANTS: "R50M",
  STRATEGIC_INVESTOR: "R200M",
  FOUNDERS_ANGELS: "R50M",
  EXPORT_CREDIT: "R100M",

  // Seed round
  SEED_ROUND: "$1.5M",
  SEED_RUNWAY: "April 30, 2027",

  // Use of seed funds (percentages)
  SEED_PRODUCT_DEV: "40%",
  SEED_INVENTORY: "20%",
  SEED_MARKETING: "20%",
  SEED_INSURANCE: "10%",
  SEED_COMPLIANCE: "5%",
  SEED_OPERATIONS: "5%",

  // Specific amounts
  INVESTMENT_TO_DATE: "6 months founder R&D",
  PO_FACILITY: "$350K",
  LIABILITY_POLICY: "$5M",
  CONVERSION_DAYS: "35-day",
  PRODUCTION_RATE: "750–1,000 units/month",
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

/** Development Phases - Unified timeline aligned with funding rounds */
export const PHASES = {
  // Phase definitions
  SEED: {
    id: "seed",
    name: "Seed: SkySnare Launch",
    shortName: "Seed",
    timeline: "Nov 2025 - Oct 2026",
    products: ["SkySnare D2C", "Core prototype"],
    funding: "$1.5M",
    trl: "TRL 3-5",
    focus: "Consumer product launch, prototype validation",
  },
  SERIES_A: {
    id: "series-a",
    name: "Series A: AeroNet & DoD",
    shortName: "Series A",
    timeline: "Nov 2026 - 2027",
    products: ["AeroNet Enterprise", "SBIR/DoD validation"],
    funding: "$8-12M",
    trl: "TRL 5-6",
    focus: "Enterprise launch, DoD validation, SBIR contracts",
  },
  SERIES_B: {
    id: "series-b",
    name: "Series B: Ground Systems",
    shortName: "Series B",
    timeline: "2028",
    products: ["RKV-G Rover/GCS", "Production scale"],
    funding: "$15-20M",
    trl: "TRL 6-7",
    focus: "Ground control systems, production scaling",
  },
  SERIES_C: {
    id: "series-c",
    name: "Series C: Aerial Platform",
    shortName: "Series C",
    timeline: "2029",
    products: ["RKV-M Mothership", "RKV-I Interceptors"],
    funding: "$25M+",
    trl: "TRL 7+",
    focus: "Full aerial platform, interceptor systems",
  },
  SCALE: {
    id: "scale",
    name: "Scale: Global Deployment",
    shortName: "Scale",
    timeline: "2030+",
    products: ["Full integrated system", "FMS", "NATO"],
    funding: "Revenue-funded",
    trl: "TRL 8-9",
    focus: "Global deployment, FMS programs, NATO certification",
  },
};

/** RKV System Components */
export const RKV_SYSTEM = {
  // RKV-M: Aerial VTOL Mothership
  RKV_M_NAME: "RKV-M",
  RKV_M_FULL_NAME: "Aerial VTOL Mothership",
  RKV_M_FUNCTION: "Picket, relay, and mini launch platform",
  RKV_M_PHASE: "series-c",

  // RKV-I: Interceptor Minis
  RKV_I_NAME: "RKV-I",
  RKV_I_FULL_NAME: "Interceptor Minis",
  RKV_I_FUNCTION: "Interceptor, decoy, and ISR operations",
  RKV_I_PHASE: "series-c",

  // RKV-G: Ground Control Station
  RKV_G_NAME: "RKV-G",
  RKV_G_FULL_NAME: "Ground Control Station (Rover)",
  RKV_G_FUNCTION: "Mobile ground control, mast operations, logistics",
  RKV_G_PHASE: "series-b",

  // RKV-C2: Command and Control
  RKV_C2_NAME: "RKV-C2",
  RKV_C2_FULL_NAME: "Command and Control System",
  RKV_C2_FUNCTION: "C2/data plane with strict QoS",
  RKV_C2_PHASE: "series-a",
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
  CAPITAL,
  PHASES,
  RKV_SYSTEM,
};
