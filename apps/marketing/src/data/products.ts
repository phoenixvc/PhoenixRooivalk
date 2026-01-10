/**
 * Unified Product Catalog Data
 *
 * Single source of truth for all products displayed on the marketing frontend.
 * Aligned with product-catalog.md and tariffs.ts
 */

export type ProductPhase =
  | "seed"
  | "series-a"
  | "series-b"
  | "series-c"
  | "scale";
export type ProductCategory =
  | "consumer"
  | "diy-maker"
  | "prosumer"
  | "commercial"
  | "enterprise"
  | "military";
export type ProductLine =
  | "skysnare"
  | "netsnare"
  | "skywatch"
  | "netsentry"
  | "aeronet"
  | "rkv";

export interface ProductPhaseInfo {
  id: ProductPhase;
  name: string;
  shortName: string;
  timeline: string;
  funding: string;
  color: string;
  description: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  line: ProductLine;
  tagline: string;
  description: string;
  category: ProductCategory;
  phase: ProductPhase;
  phaseTimeline: string;
  available: boolean;
  comingSoon: boolean;

  // Pricing
  priceRange: { min: number; max: number };
  priceFormatted: string;
  msrp?: number;
  monthlyFee?: number;

  // Costs (for internal use)
  cogs: number;
  margin: number;

  // Manufacturing
  assemblyHours: number;
  laborCost: number;

  // Target market
  targetMarket: string[];
  marketSegment: string;

  // Key specs (simplified for marketing)
  specs: {
    range?: string;
    speed?: string;
    power?: string;
    size?: string;
    weight?: string;
    [key: string]: string | undefined;
  };

  // Marketing
  features: string[];
  useCases: string[];
  heroImage?: string;
  gallery?: string[];

  // Links
  catalogUrl: string;
  buyUrl?: string;
  demoUrl?: string;
}

// =============================================================================
// PHASE DEFINITIONS
// =============================================================================

export const phases: Record<ProductPhase, ProductPhaseInfo> = {
  seed: {
    id: "seed",
    name: "Seed: Consumer Launch",
    shortName: "Seed",
    timeline: "Q1 2026 - Q3 2026 • Delivery Jul-Oct 2026",
    funding: "$1.5M",
    color: "#22c55e", // green
    description:
      "Consumer product launch with SkySnare, NetSnare, and NetSentry Lite",
  },
  "series-a": {
    id: "series-a",
    name: "Series A: AeroNet & DoD",
    shortName: "Series A",
    timeline: "Q4 2026 - Q3 2027 • Delivery Apr-Aug 2027",
    funding: "$8-12M",
    color: "#3b82f6", // blue
    description: "Enterprise platform launch and DoD validation",
  },
  "series-b": {
    id: "series-b",
    name: "Series B: Ground Systems",
    shortName: "Series B",
    timeline: "Q1-Q2 2028 • Delivery Aug 2028",
    funding: "$15-20M",
    color: "#8b5cf6", // purple
    description: "Ground control systems and production scaling",
  },
  "series-c": {
    id: "series-c",
    name: "Series C: Aerial Platform",
    shortName: "Series C",
    timeline: "Q1-Q2 2029 • Delivery Aug 2029",
    funding: "$25M+",
    color: "#f59e0b", // amber
    description: "Full aerial platform and interceptor systems",
  },
  scale: {
    id: "scale",
    name: "Scale: Global Deployment",
    shortName: "Scale",
    timeline: "2030+",
    funding: "Revenue-funded",
    color: "#ef4444", // red
    description: "Global deployment, FMS programs, NATO certification",
  },
};

// =============================================================================
// PRODUCT CATALOG
// =============================================================================

export const products: Product[] = [
  // -------------------------------------------------------------------------
  // SKYSNARE - Consumer Line
  // -------------------------------------------------------------------------
  {
    id: "skysnare",
    sku: "SS-001",
    name: "SkySnare",
    line: "skysnare",
    tagline: "Protect Your Airspace",
    description:
      "Direct-to-consumer drone capture device. Simple point-and-shoot operation for personal property protection.",
    category: "consumer",
    phase: "seed",
    phaseTimeline: "Q2 2026 Launch • Delivery Jul 2026",
    available: false,
    comingSoon: true,

    priceRange: { min: 349, max: 349 },
    priceFormatted: "$349",
    msrp: 349,

    cogs: 148,
    margin: 0.58,
    assemblyHours: 1.04,
    laborCost: 10,

    targetMarket: [
      "Property owners",
      "Outdoor enthusiasts",
      "Privacy advocates",
    ],
    marketSegment: "$3.22B outdoor sports market",

    specs: {
      range: "15-30m",
      netSize: "2m × 2m",
      reloadTime: "30 seconds",
      weight: "~1.2kg",
      power: "CO2 cartridge",
    },

    features: [
      "Point-and-shoot operation",
      "No technical knowledge required",
      "Dual safety mechanism",
      "Instant reload system",
      "Weatherproof design",
    ],

    useCases: [
      "Backyard privacy protection",
      "Event security",
      "Property surveillance defense",
      "Recreational drone tag",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#skysnare",
    buyUrl: "/shop/skysnare",
    demoUrl: "/interactive-demo",
  },

  // -------------------------------------------------------------------------
  // NETSNARE - Ground-Mounted Launcher Line (pairs with SkyWatch detection)
  // -------------------------------------------------------------------------
  {
    id: "netsnare-lite",
    sku: "NSN-LITE-001",
    name: "NetSnare Lite",
    line: "netsnare",
    tagline: "Ground-Mounted Net Launcher",
    description:
      "Spring-powered ground-mounted net launcher. Pairs with any SkyWatch detector for automated drone capture.",
    category: "diy-maker",
    phase: "seed",
    phaseTimeline: "Q2 2026 • Delivery Jul 2026",
    available: false,
    comingSoon: true,

    priceRange: { min: 200, max: 400 },
    priceFormatted: "$200-400",

    cogs: 125,
    margin: 0.38,
    assemblyHours: 1.5,
    laborCost: 14,

    targetMarket: ["DIY enthusiasts", "Makers", "Property owners"],
    marketSegment: "Ground-mounted launcher for SkyWatch users",

    specs: {
      range: "10-20m launch",
      trigger: "App/API trigger",
      reload: "Manual, 30 seconds",
      net: "2m weighted",
      mount: "Ground stake or surface mount",
    },

    features: [
      "Spring-powered launcher",
      "SkyWatch API integration",
      "Mobile app trigger",
      "Manual reload",
      "Weather resistant",
    ],

    useCases: [
      "Property protection",
      "Garden/backyard defense",
      "Paired with SkyWatch Standard",
      "Outdoor events",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#netsnare-lite",
  },
  {
    id: "netsnare-standard",
    sku: "NSN-STD-001",
    name: "NetSnare Standard",
    line: "netsnare",
    tagline: "CO2 Ground Launcher",
    description:
      "CO2-powered ground-mounted launcher with faster response and longer range. Integrates with SkyWatch for automated targeting.",
    category: "prosumer",
    phase: "series-a",
    phaseTimeline: "Q4 2026 • Delivery Jan 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 500, max: 800 },
    priceFormatted: "$500-800",

    cogs: 285,
    margin: 0.44,
    assemblyHours: 3.5,
    laborCost: 39,

    targetMarket: ["Property owners", "Small businesses", "Farms"],
    marketSegment: "Automated ground defense for properties",

    specs: {
      range: "20-35m launch",
      trigger: "Auto from SkyWatch",
      response: "100ms",
      reload: "CO2 cartridge swap",
      costPerShot: "$1-2",
    },

    features: [
      "CO2 powered launcher",
      "Auto-trigger from SkyWatch",
      "Multiple mount options",
      "Quick CO2 reload",
      "IP65 weatherproof",
    ],

    useCases: [
      "Farm protection",
      "Vineyard/orchard defense",
      "Small facility perimeter",
      "Event security",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#netsnare-standard",
  },
  {
    id: "netsnare-pro",
    sku: "NSN-PRO-001",
    name: "NetSnare Pro",
    line: "netsnare",
    tagline: "Tracking Ground Platform",
    description:
      "Pneumatic ground launcher with pan-tilt tracking. Full autonomous operation when paired with SkyWatch Pro or Enterprise.",
    category: "commercial",
    phase: "series-a",
    phaseTimeline: "Q2 2027 • Delivery Jul 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 1200, max: 2000 },
    priceFormatted: "$1,200-2,000",

    cogs: 680,
    margin: 0.44,
    assemblyHours: 8,
    laborCost: 133,

    targetMarket: [
      "Commercial facilities",
      "Critical infrastructure",
      "Security firms",
    ],
    marketSegment: "Automated perimeter defense",

    specs: {
      range: "30-50m launch",
      tracking: "Pan-tilt motorized",
      response: "50ms",
      reload: "Air tank refillable",
      coverage: "180° arc",
    },

    features: [
      "Pneumatic launcher",
      "Pan-tilt tracking",
      "Predictive targeting",
      "Multi-shot capability",
      "Remote monitoring",
      "Air tank refillable",
    ],

    useCases: [
      "Perimeter defense",
      "Commercial facilities",
      "Prison security",
      "Airport perimeters",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#netsnare-pro",
  },

  // -------------------------------------------------------------------------
  // SKYWATCH - Detection Line
  // -------------------------------------------------------------------------
  {
    id: "skywatch-nano",
    sku: "SW-NANO-001",
    name: "SkyWatch Nano",
    line: "skywatch",
    tagline: "Entry-Level Detection",
    description:
      "Entry-level drone detection for backyard awareness and learning. Perfect for makers and hobbyists.",
    category: "diy-maker",
    phase: "seed",
    phaseTimeline: "Available Now",
    available: true,
    comingSoon: false,

    priceRange: { min: 50, max: 100 },
    priceFormatted: "$50-100",

    cogs: 78,
    margin: 0.29,
    assemblyHours: 1.04,
    laborCost: 10,

    targetMarket: ["Hobbyists", "Makers", "Educational"],
    marketSegment: "DIY/Maker community (preorder for kits)",

    specs: {
      range: "30-50m",
      speed: "5-10 FPS",
      power: "2-4W",
      weight: "~150g",
    },

    features: [
      "Raspberry Pi based",
      "Open-source software",
      "Easy DIY assembly",
      "WiFi connectivity",
      "Webhook alerts",
    ],

    useCases: [
      "Learning AI/ML detection",
      "Backyard awareness",
      "Maker projects",
      "Educational demos",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#skywatch-nano",
  },
  {
    id: "skywatch-standard",
    sku: "SW-STD-001",
    name: "SkyWatch Standard",
    line: "skywatch",
    tagline: "Reliable Home Protection",
    description:
      "Balanced detection system for residential use with Coral TPU acceleration and low-light capability.",
    category: "prosumer",
    phase: "seed",
    phaseTimeline: "Available Now",
    available: true,
    comingSoon: false,

    priceRange: { min: 100, max: 250 },
    priceFormatted: "$100-250",

    cogs: 247,
    margin: 0.37,
    assemblyHours: 2.62,
    laborCost: 29,

    targetMarket: ["Homeowners", "Small property owners"],
    marketSegment: "Residential security",

    specs: {
      range: "50-150m",
      speed: "15-30 FPS",
      power: "4-10W",
      connectivity: "WiFi, Ethernet, PoE",
    },

    features: [
      "Coral TPU acceleration",
      "Low-light detection",
      "Multi-channel alerts",
      "PoE support",
      "Weatherproof",
    ],

    useCases: [
      "Home security",
      "Small property monitoring",
      "Privacy protection",
      "Pet/wildlife monitoring",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#skywatch-standard",
  },
  {
    id: "skywatch-pro",
    sku: "SW-PRO-001",
    name: "SkyWatch Pro",
    line: "skywatch",
    tagline: "Professional Multi-Sensor",
    description:
      "Multi-sensor detection platform with visual, RF, and audio detection. Pan-tilt tracking for professional use.",
    category: "commercial",
    phase: "seed",
    phaseTimeline: "Available Now",
    available: true,
    comingSoon: false,

    priceRange: { min: 250, max: 600 },
    priceFormatted: "$250-600",

    cogs: 612,
    margin: 0.44,
    assemblyHours: 5.9,
    laborCost: 92,

    targetMarket: ["Farms", "Estates", "Commercial properties"],
    marketSegment: "Commercial security",

    specs: {
      range: "150-500m visual, 500m-2km RF",
      speed: "30+ FPS",
      power: "8-18W",
      sensors: "Visual, RF, Audio",
    },

    features: [
      "Multi-sensor fusion",
      "Pan-tilt tracking",
      "RF signal detection",
      "Audio analysis",
      "SSD storage",
    ],

    useCases: [
      "Farm perimeter security",
      "Estate protection",
      "Event venues",
      "Commercial facilities",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#skywatch-pro",
  },
  {
    id: "skywatch-mobile",
    sku: "SW-MOB-001",
    name: "SkyWatch Mobile",
    line: "skywatch",
    tagline: "Detection On The Go",
    description:
      "Portable detection unit for mobile operations. Battery-powered with touchscreen interface.",
    category: "prosumer",
    phase: "series-a",
    phaseTimeline: "Q4 2026 • Delivery Jan 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 200, max: 500 },
    priceFormatted: "$200-500",

    cogs: 424,
    margin: 0.38,
    assemblyHours: 3.65,
    laborCost: 41,

    targetMarket: ["Security patrols", "Event staff", "Mobile teams"],
    marketSegment: "Mobile security",

    specs: {
      range: "100-300m",
      speed: "15-25 FPS",
      battery: "3-5 hours",
      weight: "~800g",
    },

    features: [
      '7" touchscreen',
      "3-5 hour battery",
      "Haptic alerts",
      "GPS logging",
      "Vehicle mountable",
    ],

    useCases: [
      "Security patrols",
      "Event coverage",
      "VIP protection",
      "Emergency response",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#skywatch-mobile",
  },
  {
    id: "skywatch-thermal",
    sku: "SW-THM-001",
    name: "SkyWatch Thermal",
    line: "skywatch",
    tagline: "24/7 All-Weather Detection",
    description:
      "Thermal imaging drone detector for all-light conditions. Day/night detection with sensor fusion.",
    category: "commercial",
    phase: "series-a",
    phaseTimeline: "Q1 2027 • Delivery Apr 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 400, max: 1500 },
    priceFormatted: "$400-1,500",

    cogs: 631,
    margin: 0.44,
    assemblyHours: 8.0,
    laborCost: 133,

    targetMarket: ["24/7 operations", "Night security", "Critical sites"],
    marketSegment: "Professional security",

    specs: {
      range: "100-500m thermal, 50-300m visible",
      thermalRes: "160×120 to 320×256",
      sensitivity: "<50mK NETD",
    },

    features: [
      "Thermal + visible fusion",
      "True 24/7 operation",
      "Temperature anomaly detection",
      "Auto flat-field correction",
    ],

    useCases: [
      "Night operations",
      "All-weather security",
      "Critical infrastructure",
      "Border monitoring",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#skywatch-thermal",
  },
  {
    id: "skywatch-marine",
    sku: "SW-MAR-001",
    name: "SkyWatch Marine",
    line: "skywatch",
    tagline: "Maritime-Grade Detection",
    description:
      "Ruggedized detection system for maritime environments. Gyro stabilization and NMEA integration.",
    category: "commercial",
    phase: "series-a",
    phaseTimeline: "Q2 2027 • Delivery Jul 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 600, max: 2000 },
    priceFormatted: "$600-2,000",

    cogs: 843,
    margin: 0.44,
    assemblyHours: 9.8,
    laborCost: 163,

    targetMarket: ["Vessels", "Marinas", "Coastal facilities"],
    marketSegment: "Maritime security",

    specs: {
      range: "200-800m",
      rating: "IP67",
      stabilization: "2-axis gyro",
      integration: "NMEA 0183/2000",
    },

    features: [
      "Gyro stabilization",
      "Salt-resistant IP67",
      "Chart plotter integration",
      "12V DC marine power",
    ],

    useCases: [
      "Yacht security",
      "Marina protection",
      "Port facilities",
      "Offshore platforms",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#skywatch-marine",
  },
  {
    id: "skywatch-mesh",
    sku: "SW-MESH-001",
    name: "SkyWatch Mesh",
    line: "skywatch",
    tagline: "Distributed Network Detection",
    description:
      "Distributed detection network with multiple nodes and central aggregation for wide-area coverage.",
    category: "commercial",
    phase: "series-a",
    phaseTimeline: "Q2 2027 • Delivery Jul 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 500, max: 2000 },
    priceFormatted: "$500-2,000/node",

    cogs: 187,
    margin: 0.44,
    assemblyHours: 2.12,
    laborCost: 24,

    targetMarket: ["Large perimeters", "Farms", "Industrial sites"],
    marketSegment: "Wide-area security",

    specs: {
      range: "100-200m per node",
      latency: "<100ms node-to-central",
      coverage: "1-100+ acres",
    },

    features: [
      "Multi-node fusion",
      "Triangulation",
      "Auto node discovery",
      "Centralized dashboard",
      "PoE powered",
    ],

    useCases: [
      "Farm perimeters",
      "Industrial complexes",
      "Campus security",
      "Event grounds",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#skywatch-mesh",
  },
  {
    id: "skywatch-enterprise",
    sku: "SW-ENT-001",
    name: "SkyWatch Enterprise",
    line: "skywatch",
    tagline: "Full-Scale C-UAS",
    description:
      "Full-scale enterprise deployment with multi-sensor integration, SOC connectivity, and compliance logging.",
    category: "enterprise",
    phase: "series-a",
    phaseTimeline: "Q3 2027 • Delivery Aug 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 5000, max: 20000 },
    priceFormatted: "$5,000-20,000",

    cogs: 11733,
    margin: 0.5,
    assemblyHours: 88,
    laborCost: 2933,

    targetMarket: ["Corporate campuses", "Critical infrastructure"],
    marketSegment: "Enterprise security",

    specs: {
      range: "1-5km multi-sensor",
      sensors: "Visual, Thermal, RF, Radar",
      uptime: "99.9% SLA",
      api: "REST, WebSocket, MQTT",
    },

    features: [
      "SIEM integration",
      "VMS integration",
      "Access control integration",
      "Compliance logging",
      "High availability",
    ],

    useCases: [
      "Data centers",
      "Corporate headquarters",
      "Government facilities",
      "Utility infrastructure",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#skywatch-enterprise",
  },

  // -------------------------------------------------------------------------
  // NETSENTRY - Countermeasure Line
  // -------------------------------------------------------------------------
  {
    id: "netsentry-lite",
    sku: "NS-LITE-001",
    name: "NetSentry Lite",
    line: "netsentry",
    tagline: "Entry-Level Countermeasure",
    description:
      "Entry-level countermeasure system with spring-loaded net launcher for testing and proof-of-concept.",
    category: "diy-maker",
    phase: "seed",
    phaseTimeline: "Q3 2026 • Delivery Oct 2026",
    available: false,
    comingSoon: true,

    priceRange: { min: 150, max: 400 },
    priceFormatted: "$150-400",

    cogs: 242,
    margin: 0.29,
    assemblyHours: 2.62,
    laborCost: 24,

    targetMarket: ["Makers", "Hobbyists", "Testers"],
    marketSegment: "DIY/Testing (validates full detect+intercept stack)",

    specs: {
      range: "5-15m launch",
      detection: "50-100m",
      reload: "Manual",
      net: "1.5m weighted",
    },

    features: [
      "Spring-loaded launcher",
      "DIY assembly",
      "Arduino compatible",
      "Open trigger API",
    ],

    useCases: [
      "Proof of concept",
      "Testing environments",
      "Educational demos",
      "Maker projects",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#netsentry-lite",
  },
  {
    id: "netsentry-standard",
    sku: "NS-STD-001",
    name: "NetSentry Standard",
    line: "netsentry",
    tagline: "CO2-Powered Response",
    description:
      "CO2-powered net launcher with faster response and longer range. Includes Coral TPU for detection.",
    category: "prosumer",
    phase: "series-a",
    phaseTimeline: "Q1 2027 • Delivery Apr 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 400, max: 800 },
    priceFormatted: "$400-800",

    cogs: 579,
    margin: 0.38,
    assemblyHours: 5.27,
    laborCost: 59,

    targetMarket: ["Property protection", "Small businesses"],
    marketSegment: "Property security",

    specs: {
      range: "15-30m launch",
      detection: "100-200m",
      response: "50ms",
      costPerShot: "$1-2",
    },

    features: [
      "CO2 powered",
      "Coral TPU detection",
      "Fast 50ms response",
      "Weatherproof",
    ],

    useCases: [
      "Property protection",
      "Small facility security",
      "Outdoor events",
      "Agricultural protection",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#netsentry-standard",
  },
  {
    id: "netsentry-pro",
    sku: "NS-PRO-001",
    name: "NetSentry Pro",
    line: "netsentry",
    tagline: "Professional Intercept",
    description:
      "Professional pneumatic net launcher with pan-tilt tracking and global shutter camera.",
    category: "commercial",
    phase: "series-a",
    phaseTimeline: "Q2 2027 • Delivery Jul 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 800, max: 2000 },
    priceFormatted: "$800-2,000",

    cogs: 1248,
    margin: 0.44,
    assemblyHours: 11,
    laborCost: 183,

    targetMarket: ["Security professionals", "Commercial facilities"],
    marketSegment: "Professional security",

    specs: {
      range: "25-50m launch",
      detection: "200-500m",
      tracking: "Pan-tilt motorized",
      camera: "Global shutter 60fps",
    },

    features: [
      "Pneumatic launcher",
      "Pan-tilt tracking",
      "Global shutter camera",
      "Predictive targeting",
      "Air tank refillable",
    ],

    useCases: [
      "Facility protection",
      "Event security",
      "Critical infrastructure",
      "VIP venues",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#netsentry-pro",
  },

  // -------------------------------------------------------------------------
  // AERONET - Enterprise Platform
  // -------------------------------------------------------------------------
  {
    id: "aeronet-enterprise",
    sku: "AN-ENT-001",
    name: "AeroNet Enterprise",
    line: "aeronet",
    tagline: "Complete C-UAS Platform",
    description:
      "Full-scale enterprise drone detection and response platform with multi-sensor integration and 24/7 operations.",
    category: "enterprise",
    phase: "series-a",
    phaseTimeline: "Q2 2027 • Delivery Jul 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 150000, max: 150000 },
    priceFormatted: "$150K setup",
    msrp: 150000,
    monthlyFee: 25000,

    cogs: 59200,
    margin: 0.61,
    assemblyHours: 216,
    laborCost: 7200,

    targetMarket: [
      "Critical infrastructure",
      "Airports",
      "Prisons",
      "Military bases",
    ],
    marketSegment: "$4.2B enterprise C-UAS market",

    specs: {
      range: "2-5km",
      coverage: "Up to 10 km²",
      accuracy: "99.5%",
      falsePositive: "<0.3%",
      uptime: "99.9% SLA",
    },

    features: [
      "Multi-sensor fusion",
      "SIEM/VMS integration",
      "SOC connectivity",
      "Compliance logging",
      "24/7 support",
      "Custom integrations",
    ],

    useCases: [
      "Airport protection",
      "Prison security",
      "Power plant defense",
      "Data center protection",
      "Government facilities",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#aeronet-enterprise",
    demoUrl: "/schedule",
  },
  {
    id: "aeronet-command",
    sku: "AN-CMD-001",
    name: "AeroNet Command",
    line: "aeronet",
    tagline: "Command & Control Software",
    description:
      "Centralized command and control software for multi-site drone defense coordination. Includes threat simulator for operator training.",
    category: "enterprise",
    phase: "series-a",
    phaseTimeline: "Q1 2027 • Delivery Apr 2027",
    available: false,
    comingSoon: true,

    priceRange: { min: 25000, max: 50000 },
    priceFormatted: "$25K-50K license",
    msrp: 35000,
    monthlyFee: 2500,

    cogs: 8500,
    margin: 0.65,
    assemblyHours: 40, // Software deployment/config
    laborCost: 2400,

    targetMarket: [
      "Enterprise security teams",
      "Multi-site operators",
      "SOC teams",
    ],
    marketSegment: "C2/Software for AeroNet deployments",

    specs: {
      deployment: "Cloud or on-premise",
      sites: "Unlimited sites per license",
      users: "Unlimited operators",
      api: "REST, WebSocket, MQTT",
      uptime: "99.9% SLA",
    },

    features: [
      "Multi-site dashboard",
      "Real-time threat visualization",
      "Operator training simulator",
      "Incident response playbooks",
      "Compliance reporting",
      "SIEM/VMS integration",
      "Mobile command app",
    ],

    useCases: [
      "Multi-site coordination",
      "SOC integration",
      "Operator training",
      "Incident response",
      "Compliance auditing",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#aeronet-command",
    demoUrl: "/interactive-demo",
  },

  // -------------------------------------------------------------------------
  // RKV - Military Systems
  // -------------------------------------------------------------------------
  {
    id: "rkv-m",
    sku: "RKV-M-001",
    name: "RKV-M Mothership",
    line: "rkv",
    tagline: "Aerial Intercept Platform",
    description:
      "Aerial VTOL platform serving as picket, relay, and interceptor launch platform with ducted fan design.",
    category: "military",
    phase: "series-c",
    phaseTimeline: "Q2 2029 • Delivery Aug 2029",
    available: false,
    comingSoon: false,

    priceRange: { min: 65000, max: 85000 },
    priceFormatted: "$65,000-85,000",

    cogs: 29736,
    margin: 0.55,
    assemblyHours: 83.2,
    laborCost: 3236,

    targetMarket: ["Military", "Critical infrastructure"],
    marketSegment: "Defense sector",

    specs: {
      speed: ">150 km/h",
      endurance: "8-12 min hover, 15-20 min cruise",
      altitude: "0-1000m AGL",
      payload: "4× net pods",
      trl: "TRL 7",
    },

    features: [
      "Ducted fan VTOL",
      "4× net launcher pods",
      "Mesh communication",
      "Autonomous intercept",
      "Safe urban operation",
    ],

    useCases: [
      "Forward air defense",
      "VIP protection",
      "Critical event security",
      "Border patrol",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#rkv-m-mothership",
  },
  {
    id: "rkv-i",
    sku: "RKV-I-001",
    name: "RKV-I Interceptor",
    line: "rkv",
    tagline: "Expendable Interceptor",
    description:
      "Expendable/recoverable mini interceptor drone launched from RKV-M or ground station.",
    category: "military",
    phase: "series-c",
    phaseTimeline: "Q2 2029 • Delivery Aug 2029",
    available: false,
    comingSoon: false,

    priceRange: { min: 8000, max: 12000 },
    priceFormatted: "$8,000-12,000",

    cogs: 4338,
    margin: 0.55,
    assemblyHours: 16.4,
    laborCost: 638,

    targetMarket: ["Military", "Paired with RKV-M"],
    marketSegment: "Defense sector",

    specs: {
      speed: ">180 km/h",
      endurance: "3-5 minutes",
      range: "500m from launcher",
      payload: "3m × 3m net",
      reusability: "5-10 missions",
    },

    features: [
      "Visual + RF homing",
      "Parachute recovery",
      "Locator beacon",
      "Quick reload",
    ],

    useCases: [
      "Swarm defense",
      "High-speed intercept",
      "Multi-target engagement",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#rkv-i-interceptor",
  },
  {
    id: "rkv-g",
    sku: "RKV-G-001",
    name: "RKV-G Ground Station",
    line: "rkv",
    tagline: "Mobile Command & Control",
    description:
      "Mobile ground control station and rover platform for RKV-M and RKV-I command and control.",
    category: "military",
    phase: "series-b",
    phaseTimeline: "Q2 2028 • Delivery Aug 2028",
    available: false,
    comingSoon: false,

    priceRange: { min: 100000, max: 150000 },
    priceFormatted: "$100,000-150,000",

    cogs: 52478,
    margin: 0.55,
    assemblyHours: 128,
    laborCost: 4978,

    targetMarket: ["Military", "Mobile operations"],
    marketSegment: "Defense sector",

    specs: {
      platform: "4×4 vehicle/trailer",
      mast: "10-15m telescoping",
      detectionRange: "5-10 km",
      controlRange: "2 km RKV-M, 500m RKV-I",
      crew: "2-3 operators",
    },

    features: [
      "Mast-mounted sensors",
      "Radar + EO/IR + RF",
      "Generator + battery backup",
      "24+ hour operation",
      "<30 min setup",
    ],

    useCases: [
      "Forward operating base",
      "Mobile air defense",
      "Event security command",
      "Disaster response",
    ],

    catalogUrl: "/docs/technical/detector/product-catalog#rkv-g-ground-station",
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get products by line */
export function getProductsByLine(line: ProductLine): Product[] {
  return products.filter((p) => p.line === line);
}

/** Get products by phase */
export function getProductsByPhase(phase: ProductPhase): Product[] {
  return products.filter((p) => p.phase === phase);
}

/** Get products by category */
export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}

/** Get available products */
export function getAvailableProducts(): Product[] {
  return products.filter((p) => p.available);
}

/** Get coming soon products */
export function getComingSoonProducts(): Product[] {
  return products.filter((p) => p.comingSoon);
}

/** Get consumer-friendly products (for main marketing site) */
export function getConsumerProducts(): Product[] {
  return products.filter(
    (p) =>
      p.category === "consumer" ||
      p.category === "diy-maker" ||
      p.category === "prosumer",
  );
}

/** Get enterprise products */
export function getEnterpriseProducts(): Product[] {
  return products.filter(
    (p) =>
      p.category === "commercial" ||
      p.category === "enterprise" ||
      p.category === "military",
  );
}

/** Get product by ID */
export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/** Get product by SKU */
export function getProductBySku(sku: string): Product | undefined {
  return products.find((p) => p.sku === sku);
}

// =============================================================================
// PRODUCT LINE METADATA
// =============================================================================

export const productLines: Record<
  ProductLine,
  { name: string; tagline: string; description: string; icon: string }
> = {
  skysnare: {
    name: "SkySnare",
    tagline: "Consumer Drone Defense",
    description:
      "Direct-to-consumer drone capture for personal property protection",
    icon: "🎯",
  },
  netsnare: {
    name: "NetSnare",
    tagline: "Ground Launchers",
    description:
      "Ground-mounted net launchers that pair with SkyWatch detection systems",
    icon: "🪤",
  },
  skywatch: {
    name: "SkyWatch",
    tagline: "Detection Systems",
    description: "AI-powered drone detection from DIY to enterprise scale",
    icon: "👁️",
  },
  netsentry: {
    name: "NetSentry",
    tagline: "Active Countermeasures",
    description: "Net-based drone capture with integrated detection",
    icon: "🕸️",
  },
  aeronet: {
    name: "AeroNet",
    tagline: "Enterprise Platform",
    description: "Full-scale C-UAS solution for critical infrastructure",
    icon: "🏢",
  },
  rkv: {
    name: "RKV Systems",
    tagline: "Military Interceptors",
    description: "Aerial and ground-based intercept platforms for defense",
    icon: "🚀",
  },
};

// =============================================================================
// EXPORTS FOR MARKETING PAGES
// =============================================================================

export const PRODUCTS = {
  products,
  phases,
  productLines,
  getProductsByLine,
  getProductsByPhase,
  getProductsByCategory,
  getAvailableProducts,
  getComingSoonProducts,
  getConsumerProducts,
  getEnterpriseProducts,
  getProductById,
  getProductBySku,
};

export default PRODUCTS;
