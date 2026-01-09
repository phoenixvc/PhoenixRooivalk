/**
 * Assembly, Labor & Manufacturing Tariffs
 *
 * Configurable hourly rates, category markups, and manufacturing time estimates.
 * Single source of truth for all cost calculations.
 */

import type { RangeValue } from "./types";

/** Exchange rate for conversions */
export const exchangeRate = {
  usdToZar: 18,
  lastUpdated: "2025-12",
};

// ============================================================================
// LABOR TARIFFS (Hourly Rates)
// ============================================================================

export interface LaborRate {
  hourlyZar: number;
  hourlyUsd: number;
  description: string;
  skillLevel: "entry" | "intermediate" | "senior" | "specialist";
  overhead: number; // Multiplier for benefits, workspace, tools
  effectiveRate: number; // hourlyZar * overhead
}

/** Labor rates by role */
export const laborRates: Record<string, LaborRate> = {
  // Assembly & Manufacturing
  assemblyTechnician: {
    hourlyZar: 120,
    hourlyUsd: 6.67,
    description: "Basic assembly, wiring, soldering",
    skillLevel: "entry",
    overhead: 1.4,
    effectiveRate: 168,
  },
  seniorAssemblyTech: {
    hourlyZar: 200,
    hourlyUsd: 11.11,
    description: "Complex assembly, quality inspection, calibration",
    skillLevel: "intermediate",
    overhead: 1.4,
    effectiveRate: 280,
  },
  electronicsEngineer: {
    hourlyZar: 450,
    hourlyUsd: 25.0,
    description: "PCB work, firmware flashing, diagnostics",
    skillLevel: "senior",
    overhead: 1.5,
    effectiveRate: 675,
  },
  mechanicalEngineer: {
    hourlyZar: 400,
    hourlyUsd: 22.22,
    description: "Mechanical assembly, CNC setup, testing",
    skillLevel: "senior",
    overhead: 1.5,
    effectiveRate: 600,
  },

  // Software & Integration
  softwareEngineer: {
    hourlyZar: 550,
    hourlyUsd: 30.56,
    description: "Software integration, configuration, testing",
    skillLevel: "senior",
    overhead: 1.3,
    effectiveRate: 715,
  },
  systemsIntegrator: {
    hourlyZar: 600,
    hourlyUsd: 33.33,
    description: "Full system integration, commissioning",
    skillLevel: "specialist",
    overhead: 1.5,
    effectiveRate: 900,
  },

  // Field & Support
  fieldTechnician: {
    hourlyZar: 300,
    hourlyUsd: 16.67,
    description: "On-site installation, maintenance",
    skillLevel: "intermediate",
    overhead: 1.6, // Higher due to travel
    effectiveRate: 480,
  },
  trainingInstructor: {
    hourlyZar: 500,
    hourlyUsd: 27.78,
    description: "Customer training, documentation",
    skillLevel: "senior",
    overhead: 1.4,
    effectiveRate: 700,
  },

  // Quality & Testing
  qualityInspector: {
    hourlyZar: 250,
    hourlyUsd: 13.89,
    description: "Quality control, testing, documentation",
    skillLevel: "intermediate",
    overhead: 1.4,
    effectiveRate: 350,
  },
  testEngineer: {
    hourlyZar: 400,
    hourlyUsd: 22.22,
    description: "Performance testing, validation, certification",
    skillLevel: "senior",
    overhead: 1.5,
    effectiveRate: 600,
  },
};

// ============================================================================
// CATEGORY MARKUPS
// ============================================================================

export interface CategoryMarkup {
  category: string;
  bomMarkup: number; // Percentage markup on BOM cost
  laborMarkup: number; // Percentage markup on labor cost
  targetMargin: number; // Target gross margin
  volumeDiscount: { qty: number; discount: number }[];
  notes: string;
}

/** Markup rates by product category */
export const categoryMarkups: Record<string, CategoryMarkup> = {
  // Consumer Products
  consumer: {
    category: "Consumer (D2C)",
    bomMarkup: 1.58, // 158% of BOM = 59% margin
    laborMarkup: 1.3,
    targetMargin: 0.59,
    volumeDiscount: [
      { qty: 100, discount: 0.05 },
      { qty: 500, discount: 0.1 },
      { qty: 1000, discount: 0.15 },
    ],
    notes: "SkySnare consumer product line",
  },

  // DIY/Maker Products
  diyMaker: {
    category: "DIY/Maker",
    bomMarkup: 1.4, // 40% markup
    laborMarkup: 1.2,
    targetMargin: 0.35,
    volumeDiscount: [
      { qty: 50, discount: 0.05 },
      { qty: 200, discount: 0.1 },
    ],
    notes: "SkyWatch Nano, NetSentry Lite - hobbyist market",
  },

  // Prosumer/SMB
  prosumer: {
    category: "Prosumer/SMB",
    bomMarkup: 1.6, // 60% markup
    laborMarkup: 1.4,
    targetMargin: 0.45,
    volumeDiscount: [
      { qty: 20, discount: 0.05 },
      { qty: 50, discount: 0.1 },
    ],
    notes: "SkyWatch Standard/Pro, NetSentry Standard",
  },

  // Commercial
  commercial: {
    category: "Commercial",
    bomMarkup: 1.8, // 80% markup
    laborMarkup: 1.5,
    targetMargin: 0.55,
    volumeDiscount: [
      { qty: 10, discount: 0.05 },
      { qty: 25, discount: 0.1 },
      { qty: 50, discount: 0.15 },
    ],
    notes: "SkyWatch Marine/Thermal/Mesh, NetSentry Pro",
  },

  // Enterprise
  enterprise: {
    category: "Enterprise",
    bomMarkup: 2.0, // 100% markup
    laborMarkup: 1.6,
    targetMargin: 0.6,
    volumeDiscount: [
      { qty: 5, discount: 0.05 },
      { qty: 10, discount: 0.1 },
      { qty: 20, discount: 0.15 },
    ],
    notes: "SkyWatch Enterprise, AeroNet platform",
  },

  // Military/Defense
  military: {
    category: "Military/Defense",
    bomMarkup: 2.2, // 120% markup
    laborMarkup: 1.8,
    targetMargin: 0.65,
    volumeDiscount: [
      { qty: 3, discount: 0.05 },
      { qty: 10, discount: 0.1 },
    ],
    notes: "RKV systems, defense contracts",
  },

  // Services & Software
  services: {
    category: "Services & Software",
    bomMarkup: 1.0, // No BOM
    laborMarkup: 2.5, // High margin on services
    targetMargin: 0.7,
    volumeDiscount: [
      { qty: 10, discount: 0.1 },
      { qty: 50, discount: 0.2 },
    ],
    notes: "Training, custom development, support contracts",
  },
};

// ============================================================================
// MANUFACTURING TIME ESTIMATES
// ============================================================================

export interface ManufacturingTime {
  product: string;
  sku: string;
  category: string;
  assemblyHours: number;
  testingHours: number;
  integrationHours: number;
  totalHours: number;
  batchSize: number; // Optimal batch for efficiency
  setupTimeHours: number; // One-time setup per batch
  amortizedSetupHours: number; // Setup time / batch size
  totalAmortizedHours: number;
  estimatedLaborCostZar: number;
  estimatedLaborCostUsd: number;
  notes: string;
}

/** Manufacturing time by product */
export const manufacturingTimes: ManufacturingTime[] = [
  // SkyWatch Line
  {
    product: "SkyWatch Nano",
    sku: "SW-NANO-001",
    category: "diyMaker",
    assemblyHours: 0.5,
    testingHours: 0.25,
    integrationHours: 0.25,
    totalHours: 1.0,
    batchSize: 50,
    setupTimeHours: 2.0,
    amortizedSetupHours: 0.04,
    totalAmortizedHours: 1.04,
    estimatedLaborCostZar: 175,
    estimatedLaborCostUsd: 9.72,
    notes: "Simple assembly, minimal testing",
  },
  {
    product: "SkyWatch Standard",
    sku: "SW-STD-001",
    category: "prosumer",
    assemblyHours: 1.5,
    testingHours: 0.5,
    integrationHours: 0.5,
    totalHours: 2.5,
    batchSize: 25,
    setupTimeHours: 3.0,
    amortizedSetupHours: 0.12,
    totalAmortizedHours: 2.62,
    estimatedLaborCostZar: 525,
    estimatedLaborCostUsd: 29.17,
    notes: "Coral TPU integration, enclosure assembly",
  },
  {
    product: "SkyWatch Pro",
    sku: "SW-PRO-001",
    category: "commercial",
    assemblyHours: 3.0,
    testingHours: 1.0,
    integrationHours: 1.5,
    totalHours: 5.5,
    batchSize: 10,
    setupTimeHours: 4.0,
    amortizedSetupHours: 0.4,
    totalAmortizedHours: 5.9,
    estimatedLaborCostZar: 1650,
    estimatedLaborCostUsd: 91.67,
    notes: "Multi-sensor, pan-tilt, RF integration",
  },
  {
    product: "SkyWatch Mobile",
    sku: "SW-MOB-001",
    category: "prosumer",
    assemblyHours: 2.0,
    testingHours: 0.75,
    integrationHours: 0.75,
    totalHours: 3.5,
    batchSize: 20,
    setupTimeHours: 3.0,
    amortizedSetupHours: 0.15,
    totalAmortizedHours: 3.65,
    estimatedLaborCostZar: 730,
    estimatedLaborCostUsd: 40.56,
    notes: "Battery system, touchscreen integration",
  },
  {
    product: "SkyWatch Thermal",
    sku: "SW-THM-001",
    category: "commercial",
    assemblyHours: 4.0,
    testingHours: 1.5,
    integrationHours: 2.0,
    totalHours: 7.5,
    batchSize: 10,
    setupTimeHours: 5.0,
    amortizedSetupHours: 0.5,
    totalAmortizedHours: 8.0,
    estimatedLaborCostZar: 2400,
    estimatedLaborCostUsd: 133.33,
    notes: "Thermal sensor calibration, dual-sensor fusion",
  },
  {
    product: "SkyWatch Marine",
    sku: "SW-MAR-001",
    category: "commercial",
    assemblyHours: 5.0,
    testingHours: 2.0,
    integrationHours: 2.0,
    totalHours: 9.0,
    batchSize: 5,
    setupTimeHours: 4.0,
    amortizedSetupHours: 0.8,
    totalAmortizedHours: 9.8,
    estimatedLaborCostZar: 2940,
    estimatedLaborCostUsd: 163.33,
    notes: "Gyro stabilization, NMEA integration, IP67 sealing",
  },
  {
    product: "SkyWatch Mesh (per node)",
    sku: "SW-MESH-001",
    category: "commercial",
    assemblyHours: 1.0,
    testingHours: 0.5,
    integrationHours: 0.5,
    totalHours: 2.0,
    batchSize: 25,
    setupTimeHours: 3.0,
    amortizedSetupHours: 0.12,
    totalAmortizedHours: 2.12,
    estimatedLaborCostZar: 424,
    estimatedLaborCostUsd: 23.56,
    notes: "Per node cost, central server additional",
  },
  {
    product: "SkyWatch Enterprise",
    sku: "SW-ENT-001",
    category: "enterprise",
    assemblyHours: 40.0,
    testingHours: 16.0,
    integrationHours: 24.0,
    totalHours: 80.0,
    batchSize: 1,
    setupTimeHours: 8.0,
    amortizedSetupHours: 8.0,
    totalAmortizedHours: 88.0,
    estimatedLaborCostZar: 52800,
    estimatedLaborCostUsd: 2933.33,
    notes: "Full system integration, on-site commissioning",
  },

  // NetSentry Line
  {
    product: "NetSentry Lite",
    sku: "NS-LITE-001",
    category: "diyMaker",
    assemblyHours: 1.5,
    testingHours: 0.5,
    integrationHours: 0.5,
    totalHours: 2.5,
    batchSize: 25,
    setupTimeHours: 3.0,
    amortizedSetupHours: 0.12,
    totalAmortizedHours: 2.62,
    estimatedLaborCostZar: 440,
    estimatedLaborCostUsd: 24.44,
    notes: "Spring mechanism assembly, basic testing",
  },
  {
    product: "NetSentry Standard",
    sku: "NS-STD-001",
    category: "prosumer",
    assemblyHours: 3.0,
    testingHours: 1.0,
    integrationHours: 1.0,
    totalHours: 5.0,
    batchSize: 15,
    setupTimeHours: 4.0,
    amortizedSetupHours: 0.27,
    totalAmortizedHours: 5.27,
    estimatedLaborCostZar: 1054,
    estimatedLaborCostUsd: 58.56,
    notes: "CO2 system assembly, pressure testing",
  },
  {
    product: "NetSentry Pro",
    sku: "NS-PRO-001",
    category: "commercial",
    assemblyHours: 6.0,
    testingHours: 2.0,
    integrationHours: 2.0,
    totalHours: 10.0,
    batchSize: 5,
    setupTimeHours: 5.0,
    amortizedSetupHours: 1.0,
    totalAmortizedHours: 11.0,
    estimatedLaborCostZar: 3300,
    estimatedLaborCostUsd: 183.33,
    notes: "Pneumatic system, pan-tilt tracking integration",
  },

  // SkySnare Consumer
  {
    product: "SkySnare",
    sku: "SS-001",
    category: "consumer",
    assemblyHours: 0.75,
    testingHours: 0.25,
    integrationHours: 0.0,
    totalHours: 1.0,
    batchSize: 100,
    setupTimeHours: 4.0,
    amortizedSetupHours: 0.04,
    totalAmortizedHours: 1.04,
    estimatedLaborCostZar: 175,
    estimatedLaborCostUsd: 9.72,
    notes: "High-volume consumer product, streamlined assembly",
  },

  // AeroNet Enterprise Platform
  {
    product: "AeroNet Enterprise (per site)",
    sku: "AN-ENT-001",
    category: "enterprise",
    assemblyHours: 80.0,
    testingHours: 40.0,
    integrationHours: 80.0,
    totalHours: 200.0,
    batchSize: 1,
    setupTimeHours: 16.0,
    amortizedSetupHours: 16.0,
    totalAmortizedHours: 216.0,
    estimatedLaborCostZar: 129600,
    estimatedLaborCostUsd: 7200.0,
    notes: "Full enterprise deployment, multi-sensor integration",
  },

  // RKV System Components
  {
    product: "RKV-M Mothership",
    sku: "RKV-M-001",
    category: "military",
    assemblyHours: 40.0,
    testingHours: 20.0,
    integrationHours: 20.0,
    totalHours: 80.0,
    batchSize: 5,
    setupTimeHours: 16.0,
    amortizedSetupHours: 3.2,
    totalAmortizedHours: 83.2,
    estimatedLaborCostZar: 58240,
    estimatedLaborCostUsd: 3235.56,
    notes: "VTOL assembly, ducted fan calibration, avionics",
  },
  {
    product: "RKV-I Interceptor",
    sku: "RKV-I-001",
    category: "military",
    assemblyHours: 8.0,
    testingHours: 4.0,
    integrationHours: 4.0,
    totalHours: 16.0,
    batchSize: 20,
    setupTimeHours: 8.0,
    amortizedSetupHours: 0.4,
    totalAmortizedHours: 16.4,
    estimatedLaborCostZar: 11480,
    estimatedLaborCostUsd: 637.78,
    notes: "Mini interceptor assembly, net pod integration",
  },
  {
    product: "RKV-G Ground Station",
    sku: "RKV-G-001",
    category: "military",
    assemblyHours: 60.0,
    testingHours: 20.0,
    integrationHours: 40.0,
    totalHours: 120.0,
    batchSize: 3,
    setupTimeHours: 24.0,
    amortizedSetupHours: 8.0,
    totalAmortizedHours: 128.0,
    estimatedLaborCostZar: 89600,
    estimatedLaborCostUsd: 4977.78,
    notes: "Rover/GCS assembly, mast systems, comms integration",
  },
];

// ============================================================================
// MACHINE COSTS & AMORTIZATION
// ============================================================================

export interface MachineCost {
  machine: string;
  purchaseCostZar: number;
  purchaseCostUsd: number;
  lifeYears: number;
  annualMaintenanceZar: number;
  operatingHoursPerYear: number;
  hourlyAmortizedCostZar: number;
  hourlyAmortizedCostUsd: number;
  usedByProducts: string[];
  notes: string;
}

/** Machine costs and amortization */
export const machineCosts: MachineCost[] = [
  {
    machine: "Soldering Station (Weller WX2021)",
    purchaseCostZar: 45000,
    purchaseCostUsd: 2500,
    lifeYears: 10,
    annualMaintenanceZar: 2000,
    operatingHoursPerYear: 2000,
    hourlyAmortizedCostZar: 3.25,
    hourlyAmortizedCostUsd: 0.18,
    usedByProducts: ["All products"],
    notes: "Primary soldering station",
  },
  {
    machine: "Pick and Place (Neoden YY1)",
    purchaseCostZar: 180000,
    purchaseCostUsd: 10000,
    lifeYears: 8,
    annualMaintenanceZar: 15000,
    operatingHoursPerYear: 1500,
    hourlyAmortizedCostZar: 25.0,
    hourlyAmortizedCostUsd: 1.39,
    usedByProducts: ["SkyWatch Pro+", "NetSentry Pro", "RKV systems"],
    notes: "SMD component placement",
  },
  {
    machine: "Reflow Oven (T962A)",
    purchaseCostZar: 36000,
    purchaseCostUsd: 2000,
    lifeYears: 7,
    annualMaintenanceZar: 3000,
    operatingHoursPerYear: 1200,
    hourlyAmortizedCostZar: 6.79,
    hourlyAmortizedCostUsd: 0.38,
    usedByProducts: ["All products with PCBs"],
    notes: "PCB reflow soldering",
  },
  {
    machine: "3D Printer (Bambu X1 Carbon)",
    purchaseCostZar: 27000,
    purchaseCostUsd: 1500,
    lifeYears: 5,
    annualMaintenanceZar: 5000,
    operatingHoursPerYear: 2000,
    hourlyAmortizedCostZar: 5.2,
    hourlyAmortizedCostUsd: 0.29,
    usedByProducts: ["Enclosures", "Mounts", "Prototypes"],
    notes: "Rapid prototyping, custom parts",
  },
  {
    machine: "CNC Router (Shapeoko 4 XXL)",
    purchaseCostZar: 72000,
    purchaseCostUsd: 4000,
    lifeYears: 8,
    annualMaintenanceZar: 8000,
    operatingHoursPerYear: 1000,
    hourlyAmortizedCostZar: 17.0,
    hourlyAmortizedCostUsd: 0.94,
    usedByProducts: ["Enclosures", "Mechanical parts", "RKV frames"],
    notes: "Aluminum and plastic milling",
  },
  {
    machine: "Laser Cutter (xTool P2)",
    purchaseCostZar: 90000,
    purchaseCostUsd: 5000,
    lifeYears: 6,
    annualMaintenanceZar: 10000,
    operatingHoursPerYear: 800,
    hourlyAmortizedCostZar: 31.25,
    hourlyAmortizedCostUsd: 1.74,
    usedByProducts: ["Acrylic parts", "Stencils", "Labels"],
    notes: "Precision cutting and engraving",
  },
  {
    machine: "Test Equipment Suite",
    purchaseCostZar: 250000,
    purchaseCostUsd: 13889,
    lifeYears: 10,
    annualMaintenanceZar: 20000,
    operatingHoursPerYear: 2000,
    hourlyAmortizedCostZar: 22.5,
    hourlyAmortizedCostUsd: 1.25,
    usedByProducts: ["All products"],
    notes: "Oscilloscopes, multimeters, spectrum analyzers",
  },
  {
    machine: "Environmental Chamber",
    purchaseCostZar: 180000,
    purchaseCostUsd: 10000,
    lifeYears: 15,
    annualMaintenanceZar: 10000,
    operatingHoursPerYear: 500,
    hourlyAmortizedCostZar: 44.0,
    hourlyAmortizedCostUsd: 2.44,
    usedByProducts: ["SkyWatch Marine/Thermal", "Military products"],
    notes: "Temperature/humidity testing",
  },
  {
    machine: "Fiber Laser Welder",
    purchaseCostZar: 450000,
    purchaseCostUsd: 25000,
    lifeYears: 10,
    annualMaintenanceZar: 25000,
    operatingHoursPerYear: 600,
    hourlyAmortizedCostZar: 116.67,
    hourlyAmortizedCostUsd: 6.48,
    usedByProducts: ["RKV-M frames", "Marine enclosures"],
    notes: "Precision metal joining",
  },
  {
    machine: "Composite Layup Station",
    purchaseCostZar: 150000,
    purchaseCostUsd: 8333,
    lifeYears: 10,
    annualMaintenanceZar: 12000,
    operatingHoursPerYear: 800,
    hourlyAmortizedCostZar: 33.75,
    hourlyAmortizedCostUsd: 1.88,
    usedByProducts: ["RKV-M", "Net launcher pods"],
    notes: "Carbon fiber and Kevlar work",
  },
];

// ============================================================================
// PRODUCT COST SUMMARY (BOM + Labor + Machine)
// ============================================================================

export interface ProductCostSummary {
  product: string;
  sku: string;
  category: string;
  bomCostUsd: number;
  laborCostUsd: number;
  machineCostUsd: number;
  totalCostUsd: number;
  markupMultiplier: number;
  estimatedPriceUsd: number;
  targetMargin: number;
  actualMargin: number;
}

/** Calculate total costs and pricing for all products */
export const productCostSummaries: ProductCostSummary[] = [
  // SkyWatch Line
  {
    product: "SkyWatch Nano",
    sku: "SW-NANO-001",
    category: "diyMaker",
    bomCostUsd: 66.0,
    laborCostUsd: 9.72,
    machineCostUsd: 2.0,
    totalCostUsd: 77.72,
    markupMultiplier: 1.4,
    estimatedPriceUsd: 109.0,
    targetMargin: 0.35,
    actualMargin: 0.29,
  },
  {
    product: "SkyWatch Standard",
    sku: "SW-STD-001",
    category: "prosumer",
    bomCostUsd: 209.99,
    laborCostUsd: 29.17,
    machineCostUsd: 8.0,
    totalCostUsd: 247.16,
    markupMultiplier: 1.6,
    estimatedPriceUsd: 395.0,
    targetMargin: 0.45,
    actualMargin: 0.37,
  },
  {
    product: "SkyWatch Pro",
    sku: "SW-PRO-001",
    category: "commercial",
    bomCostUsd: 495.0,
    laborCostUsd: 91.67,
    machineCostUsd: 25.0,
    totalCostUsd: 611.67,
    markupMultiplier: 1.8,
    estimatedPriceUsd: 1100.0,
    targetMargin: 0.55,
    actualMargin: 0.44,
  },
  {
    product: "SkyWatch Mobile",
    sku: "SW-MOB-001",
    category: "prosumer",
    bomCostUsd: 370.99,
    laborCostUsd: 40.56,
    machineCostUsd: 12.0,
    totalCostUsd: 423.55,
    markupMultiplier: 1.6,
    estimatedPriceUsd: 678.0,
    targetMargin: 0.45,
    actualMargin: 0.38,
  },
  {
    product: "SkyWatch Thermal (Budget)",
    sku: "SW-THM-001-B",
    category: "commercial",
    bomCostUsd: 467.99,
    laborCostUsd: 133.33,
    machineCostUsd: 30.0,
    totalCostUsd: 631.32,
    markupMultiplier: 1.8,
    estimatedPriceUsd: 1136.0,
    targetMargin: 0.55,
    actualMargin: 0.44,
  },
  {
    product: "SkyWatch Thermal (Pro)",
    sku: "SW-THM-001-P",
    category: "commercial",
    bomCostUsd: 1370.0,
    laborCostUsd: 133.33,
    machineCostUsd: 45.0,
    totalCostUsd: 1548.33,
    markupMultiplier: 1.8,
    estimatedPriceUsd: 2787.0,
    targetMargin: 0.55,
    actualMargin: 0.44,
  },
  {
    product: "SkyWatch Marine",
    sku: "SW-MAR-001",
    category: "commercial",
    bomCostUsd: 639.99,
    laborCostUsd: 163.33,
    machineCostUsd: 40.0,
    totalCostUsd: 843.32,
    markupMultiplier: 1.8,
    estimatedPriceUsd: 1518.0,
    targetMargin: 0.55,
    actualMargin: 0.44,
  },
  {
    product: "SkyWatch Mesh (node)",
    sku: "SW-MESH-001-N",
    category: "commercial",
    bomCostUsd: 158.0,
    laborCostUsd: 23.56,
    machineCostUsd: 5.0,
    totalCostUsd: 186.56,
    markupMultiplier: 1.8,
    estimatedPriceUsd: 336.0,
    targetMargin: 0.55,
    actualMargin: 0.44,
  },
  {
    product: "SkyWatch Mesh (central)",
    sku: "SW-MESH-001-C",
    category: "commercial",
    bomCostUsd: 370.0,
    laborCostUsd: 100.0,
    machineCostUsd: 20.0,
    totalCostUsd: 490.0,
    markupMultiplier: 1.8,
    estimatedPriceUsd: 882.0,
    targetMargin: 0.55,
    actualMargin: 0.44,
  },
  {
    product: "SkyWatch Enterprise",
    sku: "SW-ENT-001",
    category: "enterprise",
    bomCostUsd: 8300.0,
    laborCostUsd: 2933.33,
    machineCostUsd: 500.0,
    totalCostUsd: 11733.33,
    markupMultiplier: 2.0,
    estimatedPriceUsd: 23467.0,
    targetMargin: 0.6,
    actualMargin: 0.5,
  },

  // NetSentry Line
  {
    product: "NetSentry Lite",
    sku: "NS-LITE-001",
    category: "diyMaker",
    bomCostUsd: 210.0,
    laborCostUsd: 24.44,
    machineCostUsd: 8.0,
    totalCostUsd: 242.44,
    markupMultiplier: 1.4,
    estimatedPriceUsd: 339.0,
    targetMargin: 0.35,
    actualMargin: 0.29,
  },
  {
    product: "NetSentry Standard",
    sku: "NS-STD-001",
    category: "prosumer",
    bomCostUsd: 500.0,
    laborCostUsd: 58.56,
    machineCostUsd: 20.0,
    totalCostUsd: 578.56,
    markupMultiplier: 1.6,
    estimatedPriceUsd: 926.0,
    targetMargin: 0.45,
    actualMargin: 0.38,
  },
  {
    product: "NetSentry Pro",
    sku: "NS-PRO-001",
    category: "commercial",
    bomCostUsd: 1015.0,
    laborCostUsd: 183.33,
    machineCostUsd: 50.0,
    totalCostUsd: 1248.33,
    markupMultiplier: 1.8,
    estimatedPriceUsd: 2247.0,
    targetMargin: 0.55,
    actualMargin: 0.44,
  },

  // SkySnare Consumer
  {
    product: "SkySnare",
    sku: "SS-001",
    category: "consumer",
    bomCostUsd: 135.0,
    laborCostUsd: 9.72,
    machineCostUsd: 3.0,
    totalCostUsd: 147.72,
    markupMultiplier: 1.58,
    estimatedPriceUsd: 349.0,
    targetMargin: 0.59,
    actualMargin: 0.58,
  },

  // AeroNet
  {
    product: "AeroNet Enterprise (per site)",
    sku: "AN-ENT-001",
    category: "enterprise",
    bomCostUsd: 50000.0,
    laborCostUsd: 7200.0,
    machineCostUsd: 2000.0,
    totalCostUsd: 59200.0,
    markupMultiplier: 2.0,
    estimatedPriceUsd: 150000.0,
    targetMargin: 0.6,
    actualMargin: 0.61,
  },

  // RKV Systems
  {
    product: "RKV-M Mothership",
    sku: "RKV-M-001",
    category: "military",
    bomCostUsd: 25000.0,
    laborCostUsd: 3235.56,
    machineCostUsd: 1500.0,
    totalCostUsd: 29735.56,
    markupMultiplier: 2.2,
    estimatedPriceUsd: 65418.0,
    targetMargin: 0.65,
    actualMargin: 0.55,
  },
  {
    product: "RKV-I Interceptor",
    sku: "RKV-I-001",
    category: "military",
    bomCostUsd: 3500.0,
    laborCostUsd: 637.78,
    machineCostUsd: 200.0,
    totalCostUsd: 4337.78,
    markupMultiplier: 2.2,
    estimatedPriceUsd: 9543.0,
    targetMargin: 0.65,
    actualMargin: 0.55,
  },
  {
    product: "RKV-G Ground Station",
    sku: "RKV-G-001",
    category: "military",
    bomCostUsd: 45000.0,
    laborCostUsd: 4977.78,
    machineCostUsd: 2500.0,
    totalCostUsd: 52477.78,
    markupMultiplier: 2.2,
    estimatedPriceUsd: 115451.0,
    targetMargin: 0.65,
    actualMargin: 0.55,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get labor rate by role */
export function getLaborRate(role: string): LaborRate | undefined {
  return laborRates[role];
}

/** Get markup for category */
export function getCategoryMarkup(category: string): CategoryMarkup | undefined {
  return categoryMarkups[category];
}

/** Get manufacturing time for product */
export function getManufacturingTime(sku: string): ManufacturingTime | undefined {
  return manufacturingTimes.find((m) => m.sku === sku);
}

/** Calculate labor cost for hours and role */
export function calculateLaborCost(hours: number, role: string): number {
  const rate = laborRates[role];
  if (!rate) return 0;
  return hours * rate.effectiveRate;
}

/** Calculate total product cost */
export function calculateProductCost(
  bomCost: number,
  laborHours: number,
  laborRole: string,
  machineHours: number,
  machines: string[],
): number {
  const laborCost = calculateLaborCost(laborHours, laborRole);
  const machineCost = machines.reduce((total, machine) => {
    const m = machineCosts.find((mc) => mc.machine === machine);
    return total + (m ? m.hourlyAmortizedCostZar * machineHours : 0);
  }, 0);
  return bomCost + laborCost + machineCost;
}

/** Apply category markup to get price */
export function applyMarkup(cost: number, category: string): number {
  const markup = categoryMarkups[category];
  if (!markup) return cost * 1.5; // Default 50% markup
  return cost * markup.bomMarkup;
}

/** Get volume discount */
export function getVolumeDiscount(category: string, quantity: number): number {
  const markup = categoryMarkups[category];
  if (!markup) return 0;

  let discount = 0;
  for (const tier of markup.volumeDiscount) {
    if (quantity >= tier.qty) {
      discount = tier.discount;
    }
  }
  return discount;
}

// ============================================================================
// EXPORTS FOR MDX
// ============================================================================

/** Simple values for MDX import */
export const TARIFFS = {
  // Labor rates (ZAR/hour effective)
  ASSEMBLY_TECH_RATE: 168,
  SENIOR_ASSEMBLY_RATE: 280,
  ELECTRONICS_ENG_RATE: 675,
  MECHANICAL_ENG_RATE: 600,
  SOFTWARE_ENG_RATE: 715,
  SYSTEMS_INTEGRATOR_RATE: 900,
  FIELD_TECH_RATE: 480,
  TRAINING_RATE: 700,
  QA_INSPECTOR_RATE: 350,
  TEST_ENG_RATE: 600,

  // Category markups
  CONSUMER_MARKUP: "158%",
  DIY_MARKUP: "140%",
  PROSUMER_MARKUP: "160%",
  COMMERCIAL_MARKUP: "180%",
  ENTERPRISE_MARKUP: "200%",
  MILITARY_MARKUP: "220%",
  SERVICES_MARKUP: "250%",

  // Target margins
  CONSUMER_MARGIN: "59%",
  DIY_MARGIN: "35%",
  PROSUMER_MARGIN: "45%",
  COMMERCIAL_MARGIN: "55%",
  ENTERPRISE_MARGIN: "60%",
  MILITARY_MARGIN: "65%",
  SERVICES_MARGIN: "70%",
};
