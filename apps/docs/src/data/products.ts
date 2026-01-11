/**
 * Product Catalog & Bill of Materials Data
 *
 * Single source of truth for all product specifications, BOMs, and pricing.
 * Extracted from the Product Catalog documentation.
 *
 * Usage in MDX:
 * ```mdx
 * import { PRODUCTS, SKYWATCH, NETSENTRY } from "@site/src/data/products";
 *
 * Total BOM: {SKYWATCH.STANDARD.bomTotal}
 * ```
 */

import type { Confidence } from "./types";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** A single BOM line item */
export interface BOMItem {
  item: string;
  specification: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
}

/** Product specifications */
export interface ProductSpecs {
  detectionRange?: string;
  processingSpeed?: string;
  powerConsumption?: string;
  operatingTemp?: string;
  dimensions?: string;
  weight?: string;
  connectivity?: string;
  storage?: string;
  launchRange?: string;
  responseTime?: string;
  reload?: string;
  netSize?: string;
  costPerShot?: string;
  batteryLife?: string;
  ipRating?: string;
  stabilization?: string;
  thermalResolution?: string;
  thermalSensitivity?: string;
}

/** Product definition */
export interface Product {
  sku: string;
  name: string;
  line: "SkyWatch" | "NetSentry";
  category: "detection" | "countermeasure";
  targetMarket: string;
  priceRange: string;
  priceMin: number;
  priceMax: number;
  specs: ProductSpecs;
  bom: BOMItem[];
  bomTotal: number;
  optionalAccessories?: BOMItem[];
  confidence: Confidence;
  lastUpdated: string;
}

// =============================================================================
// SKYWATCH LINE - DETECTION ONLY (8 Products)
// =============================================================================

/** SkyWatch Nano - Entry-level detection */
export const skyWatchNano: Product = {
  sku: "SW-NANO-001",
  name: "SkyWatch Nano",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "Hobbyists, makers, educational",
  priceRange: "$50-100",
  priceMin: 50,
  priceMax: 100,
  specs: {
    detectionRange: "30-50m (daylight)",
    processingSpeed: "5-10 FPS",
    powerConsumption: "2-4W",
    operatingTemp: "0°C to 40°C",
    dimensions: "85 × 56 × 30mm",
    weight: "~150g assembled",
    connectivity: "WiFi 2.4/5GHz",
    storage: "32GB microSD",
  },
  bom: [
    {
      item: "Raspberry Pi Zero 2 W",
      specification: "512MB RAM, WiFi",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Raspberry Pi, Adafruit",
    },
    {
      item: "Pi Camera Module v2",
      specification: "8MP, Sony IMX219",
      quantity: 1,
      unitCost: 25.0,
      totalCost: 25.0,
      supplier: "Raspberry Pi, SparkFun",
    },
    {
      item: "MicroSD Card",
      specification: "32GB, Class 10, A1",
      quantity: 1,
      unitCost: 8.0,
      totalCost: 8.0,
      supplier: "SanDisk, Samsung",
    },
    {
      item: "USB Power Supply",
      specification: "5V 2.5A, micro-USB",
      quantity: 1,
      unitCost: 10.0,
      totalCost: 10.0,
      supplier: "CanaKit, Amazon",
    },
    {
      item: "Pi Zero Camera Cable",
      specification: "15cm ribbon",
      quantity: 1,
      unitCost: 3.0,
      totalCost: 3.0,
      supplier: "Adafruit, Amazon",
    },
    {
      item: "3D Printed Case",
      specification: "PETG/ABS",
      quantity: 1,
      unitCost: 5.0,
      totalCost: 5.0,
      supplier: "DIY/Etsy",
    },
  ],
  bomTotal: 66.0,
  optionalAccessories: [
    {
      item: "Piezo buzzer",
      specification: "Audio alert",
      quantity: 1,
      unitCost: 2.0,
      totalCost: 2.0,
      supplier: "Amazon",
    },
    {
      item: "GPIO LED",
      specification: "Visual alert",
      quantity: 1,
      unitCost: 1.0,
      totalCost: 1.0,
      supplier: "Amazon",
    },
    {
      item: "Heat sinks",
      specification: "Thermal management",
      quantity: 1,
      unitCost: 3.0,
      totalCost: 3.0,
      supplier: "Amazon",
    },
    {
      item: "Outdoor enclosure",
      specification: "Weather protection",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Amazon",
    },
  ],
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** SkyWatch Standard - Residential detection */
export const skyWatchStandard: Product = {
  sku: "SW-STD-001",
  name: "SkyWatch Standard",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "Homeowners, small property",
  priceRange: "$100-250",
  priceMin: 100,
  priceMax: 250,
  specs: {
    detectionRange: "50-150m",
    processingSpeed: "15-30 FPS",
    powerConsumption: "4-10W",
    operatingTemp: "-10°C to 50°C",
    dimensions: "150 × 100 × 80mm",
    weight: "~400g assembled",
    connectivity: "WiFi, Ethernet (PoE optional)",
    storage: "64GB microSD",
  },
  bom: [
    {
      item: "Raspberry Pi 4 Model B",
      specification: "2GB RAM",
      quantity: 1,
      unitCost: 45.0,
      totalCost: 45.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Pi Camera Module v3",
      specification: "12MP, HDR, low-light",
      quantity: 1,
      unitCost: 35.0,
      totalCost: 35.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Coral USB Accelerator",
      specification: "Edge TPU, USB 3.0",
      quantity: 1,
      unitCost: 59.99,
      totalCost: 59.99,
      supplier: "Coral.ai",
    },
    {
      item: "MicroSD Card",
      specification: "64GB, A2, V30",
      quantity: 1,
      unitCost: 12.0,
      totalCost: 12.0,
      supplier: "SanDisk Extreme",
    },
    {
      item: "PoE HAT",
      specification: "802.3af, isolated",
      quantity: 1,
      unitCost: 20.0,
      totalCost: 20.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Weatherproof Enclosure",
      specification: "IP65, ventilated",
      quantity: 1,
      unitCost: 25.0,
      totalCost: 25.0,
      supplier: "Polycase, Amazon",
    },
    {
      item: "Camera Mount",
      specification: "Adjustable angle",
      quantity: 1,
      unitCost: 8.0,
      totalCost: 8.0,
      supplier: "Amazon",
    },
    {
      item: "Silica Gel Packs",
      specification: "10g × 5",
      quantity: 1,
      unitCost: 5.0,
      totalCost: 5.0,
      supplier: "Amazon",
    },
  ],
  bomTotal: 209.99,
  optionalAccessories: [
    {
      item: "12V siren",
      specification: "Outdoor audio alert",
      quantity: 1,
      unitCost: 22.5,
      totalCost: 22.5,
      supplier: "Amazon",
    },
    {
      item: "Strobe light",
      specification: "Visual deterrent",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Amazon",
    },
    {
      item: "External antenna",
      specification: "Extended WiFi range",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Amazon",
    },
    {
      item: "Active cooling fan",
      specification: "High ambient temps",
      quantity: 1,
      unitCost: 10.0,
      totalCost: 10.0,
      supplier: "Amazon",
    },
    {
      item: "IR illuminator",
      specification: "Enhanced night vision",
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Amazon",
    },
  ],
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** SkyWatch Pro - Professional multi-sensor */
export const skyWatchPro: Product = {
  sku: "SW-PRO-001",
  name: "SkyWatch Pro",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "Farms, estates, commercial property",
  priceRange: "$250-600",
  priceMin: 250,
  priceMax: 600,
  specs: {
    detectionRange: "150-500m (visual), 500m-2km (RF)",
    processingSpeed: "30+ FPS",
    powerConsumption: "8-18W",
    operatingTemp: "-20°C to 60°C",
    dimensions: "200 × 150 × 120mm",
    weight: "~1.2kg assembled",
    connectivity: "WiFi, Ethernet, PoE+",
    storage: "128GB+ SSD recommended",
  },
  bom: [
    {
      item: "Raspberry Pi 5",
      specification: "4GB RAM",
      quantity: 1,
      unitCost: 60.0,
      totalCost: 60.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Pi Camera HQ",
      specification: "12.3MP, C/CS mount",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "16mm Telephoto Lens",
      specification: "C-mount, f/1.4",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Arducam",
    },
    {
      item: "Coral M.2 Accelerator",
      specification: "Dual Edge TPU",
      quantity: 1,
      unitCost: 35.0,
      totalCost: 35.0,
      supplier: "Coral.ai",
    },
    {
      item: "M.2 HAT for Pi 5",
      specification: "PCIe to M.2",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "RTL-SDR v3",
      specification: "R820T2 tuner",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "RTL-SDR.com",
    },
    {
      item: "2.4/5.8GHz Antenna",
      specification: "SMA, 5dBi",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Amazon",
    },
    {
      item: "USB Microphone",
      specification: "Omnidirectional",
      quantity: 1,
      unitCost: 20.0,
      totalCost: 20.0,
      supplier: "Amazon",
    },
    {
      item: "PoE+ HAT",
      specification: "802.3at, 30W",
      quantity: 1,
      unitCost: 25.0,
      totalCost: 25.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Pan-Tilt Kit",
      specification: "2× servo, bracket",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "Lynxmotion, ServoCity",
    },
    {
      item: "Industrial Enclosure",
      specification: "IP66, aluminum",
      quantity: 1,
      unitCost: 60.0,
      totalCost: 60.0,
      supplier: "Polycase",
    },
    {
      item: "SSD",
      specification: "128GB NVMe",
      quantity: 1,
      unitCost: 25.0,
      totalCost: 25.0,
      supplier: "Samsung, WD",
    },
    {
      item: "Misc (cables, mounts)",
      specification: "Various",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Various",
    },
  ],
  bomTotal: 495.0,
  optionalAccessories: [
    {
      item: "Second camera (wide)",
      specification: "Dual FOV coverage",
      quantity: 1,
      unitCost: 35.0,
      totalCost: 35.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Radar module",
      specification: "All-weather detection",
      quantity: 1,
      unitCost: 350.0,
      totalCost: 350.0,
      supplier: "Various",
    },
    {
      item: "LTE modem",
      specification: "Remote connectivity",
      quantity: 1,
      unitCost: 75.0,
      totalCost: 75.0,
      supplier: "Various",
    },
    {
      item: "GPS module",
      specification: "Geolocation/timestamps",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Amazon",
    },
    {
      item: "UPS battery",
      specification: "Power backup",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "Amazon",
    },
  ],
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** SkyWatch Mobile - Portable detection */
export const skyWatchMobile: Product = {
  sku: "SW-MOB-001",
  name: "SkyWatch Mobile",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "Security patrols, event staff",
  priceRange: "$200-500",
  priceMin: 200,
  priceMax: 500,
  specs: {
    detectionRange: "100-300m",
    processingSpeed: "15-25 FPS",
    powerConsumption: "6-12W",
    batteryLife: "3-5 hours",
    operatingTemp: "-10°C to 50°C",
    dimensions: "220 × 150 × 40mm",
    weight: "~800g with battery",
    connectivity: "WiFi, Bluetooth, optional LTE",
  },
  bom: [
    {
      item: "Raspberry Pi 4",
      specification: "2GB RAM",
      quantity: 1,
      unitCost: 45.0,
      totalCost: 45.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Pi Camera Module v3",
      specification: "12MP, autofocus",
      quantity: 1,
      unitCost: 35.0,
      totalCost: 35.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Coral USB Accelerator",
      specification: "Edge TPU",
      quantity: 1,
      unitCost: 59.99,
      totalCost: 59.99,
      supplier: "Coral.ai",
    },
    {
      item: 'Official 7" Touchscreen',
      specification: "800×480, capacitive",
      quantity: 1,
      unitCost: 60.0,
      totalCost: 60.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "PiJuice HAT",
      specification: "Battery management",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "PiSupply",
    },
    {
      item: "LiPo Battery",
      specification: "12000mAh, 3.7V",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Various",
    },
    {
      item: "Rugged Case",
      specification: "Pelican 1150 or similar",
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Pelican",
    },
    {
      item: "Foam Insert",
      specification: "Custom cut",
      quantity: 1,
      unitCost: 10.0,
      totalCost: 10.0,
      supplier: "DIY",
    },
    {
      item: "Shoulder Strap",
      specification: "Quick-release",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Amazon",
    },
    {
      item: "USB-C PD Charger",
      specification: "45W",
      quantity: 1,
      unitCost: 25.0,
      totalCost: 25.0,
      supplier: "Anker",
    },
  ],
  bomTotal: 370.99,
  optionalAccessories: [
    {
      item: "GPS module",
      specification: "Location logging",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Amazon",
    },
    {
      item: "LTE USB modem",
      specification: "Remote connectivity",
      quantity: 1,
      unitCost: 75.0,
      totalCost: 75.0,
      supplier: "Various",
    },
    {
      item: "Vibration motor",
      specification: "Haptic alerts",
      quantity: 1,
      unitCost: 5.0,
      totalCost: 5.0,
      supplier: "Amazon",
    },
    {
      item: "External speaker",
      specification: "Audio alerts",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Amazon",
    },
    {
      item: "Vehicle mount",
      specification: "Dashboard/windshield",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Amazon",
    },
    {
      item: "Chest harness",
      specification: "Hands-free carrying",
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Amazon",
    },
  ],
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** SkyWatch Thermal Budget - Budget thermal detection */
export const skyWatchThermalBudget: Product = {
  sku: "SW-THM-001-B",
  name: "SkyWatch Thermal (Budget)",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "24/7 operations, night security",
  priceRange: "$400-800",
  priceMin: 400,
  priceMax: 800,
  specs: {
    detectionRange: "100-500m (thermal), 50-300m (visible)",
    processingSpeed: "15-30 FPS",
    powerConsumption: "8-15W",
    operatingTemp: "-20°C to 60°C",
    thermalResolution: "160×120",
    thermalSensitivity: "<50mK NETD",
  },
  bom: [
    {
      item: "Raspberry Pi 4",
      specification: "4GB RAM",
      quantity: 1,
      unitCost: 55.0,
      totalCost: 55.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "FLIR Lepton 3.5",
      specification: "160×120, 8.7Hz",
      quantity: 1,
      unitCost: 199.0,
      totalCost: 199.0,
      supplier: "GroupGets",
    },
    {
      item: "Lepton Breakout Board",
      specification: "PureThermal 2",
      quantity: 1,
      unitCost: 49.0,
      totalCost: 49.0,
      supplier: "GroupGets",
    },
    {
      item: "Pi Camera v3",
      specification: "Visible, low-light",
      quantity: 1,
      unitCost: 35.0,
      totalCost: 35.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Coral USB Accelerator",
      specification: "Edge TPU",
      quantity: 1,
      unitCost: 59.99,
      totalCost: 59.99,
      supplier: "Coral.ai",
    },
    {
      item: "Weatherproof Enclosure",
      specification: "IP65, ventilated",
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Polycase",
    },
    {
      item: "Germanium Window",
      specification: "25mm, AR coated",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Thorlabs",
    },
  ],
  bomTotal: 467.99,
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** SkyWatch Thermal Pro - Professional thermal detection */
export const skyWatchThermalPro: Product = {
  sku: "SW-THM-001-P",
  name: "SkyWatch Thermal (Pro)",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "24/7 operations, night security",
  priceRange: "$1,000-1,500",
  priceMin: 1000,
  priceMax: 1500,
  specs: {
    detectionRange: "100-500m (thermal), 50-300m (visible)",
    processingSpeed: "15-30 FPS",
    powerConsumption: "8-15W",
    operatingTemp: "-20°C to 60°C",
    thermalResolution: "320×256",
    thermalSensitivity: "<50mK NETD",
  },
  bom: [
    {
      item: "Raspberry Pi 5",
      specification: "8GB RAM",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "FLIR Boson 320",
      specification: "320×256, 60Hz",
      quantity: 1,
      unitCost: 800.0,
      totalCost: 800.0,
      supplier: "FLIR",
    },
    {
      item: "Boson Interface Board",
      specification: "USB-C",
      quantity: 1,
      unitCost: 100.0,
      totalCost: 100.0,
      supplier: "FLIR",
    },
    {
      item: "Pi Camera HQ",
      specification: "12.3MP",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "16mm Lens",
      specification: "C-mount",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Arducam",
    },
    {
      item: "Coral M.2 Accelerator",
      specification: "Dual TPU",
      quantity: 1,
      unitCost: 35.0,
      totalCost: 35.0,
      supplier: "Coral.ai",
    },
    {
      item: "M.2 HAT",
      specification: "PCIe adapter",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Industrial Enclosure",
      specification: "IP66",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "Polycase",
    },
    {
      item: "Germanium Window",
      specification: "50mm, AR coated",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "Thorlabs",
    },
  ],
  bomTotal: 1370.0,
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** SkyWatch Marine - Maritime detection */
export const skyWatchMarine: Product = {
  sku: "SW-MAR-001",
  name: "SkyWatch Marine",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "Vessels, marinas, coastal facilities",
  priceRange: "$600-2,000",
  priceMin: 600,
  priceMax: 2000,
  specs: {
    detectionRange: "200-800m",
    processingSpeed: "20-30 FPS",
    powerConsumption: "8-15W",
    operatingTemp: "-20°C to 60°C",
    ipRating: "IP67",
    stabilization: "2-axis gyro, ±30° roll, ±20° pitch",
  },
  bom: [
    {
      item: "Raspberry Pi 4",
      specification: "4GB RAM",
      quantity: 1,
      unitCost: 55.0,
      totalCost: 55.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Pi Camera HQ",
      specification: "12.3MP, C-mount",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Wide Angle Lens",
      specification: "6mm, f/1.2",
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Arducam",
    },
    {
      item: "Coral USB Accelerator",
      specification: "Edge TPU",
      quantity: 1,
      unitCost: 59.99,
      totalCost: 59.99,
      supplier: "Coral.ai",
    },
    {
      item: "Gyro Stabilizer",
      specification: "2-axis, brushless",
      quantity: 1,
      unitCost: 150.0,
      totalCost: 150.0,
      supplier: "BaseCam, SimpleBGC",
    },
    {
      item: "Marine Enclosure",
      specification: "IP67, aluminum",
      quantity: 1,
      unitCost: 120.0,
      totalCost: 120.0,
      supplier: "Polycase",
    },
    {
      item: "DC-DC Converter",
      specification: "12V→5V, 5A, isolated",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Pololu",
    },
    {
      item: "NMEA Interface",
      specification: "USB-RS422",
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Actisense",
    },
    {
      item: "Marine Antenna",
      specification: "WiFi, N-type",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Ubiquiti",
    },
    {
      item: "Cable Glands",
      specification: "M20, IP68",
      quantity: 5,
      unitCost: 5.0,
      totalCost: 25.0,
      supplier: "Various",
    },
    {
      item: "Conformal Coating",
      specification: "PCB protection",
      quantity: 1,
      unitCost: 20.0,
      totalCost: 20.0,
      supplier: "MG Chemicals",
    },
  ],
  bomTotal: 639.99,
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** SkyWatch Mesh Node - Distributed detection node */
export const skyWatchMeshNode: Product = {
  sku: "SW-MESH-001-N",
  name: "SkyWatch Mesh (Node)",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "Large perimeters, farms, industrial sites",
  priceRange: "$150-200/node",
  priceMin: 150,
  priceMax: 200,
  specs: {
    detectionRange: "100-200m per node",
    processingSpeed: "15-25 FPS",
    powerConsumption: "5-10W",
    connectivity: "Ethernet, WiFi mesh",
  },
  bom: [
    {
      item: "Raspberry Pi 4",
      specification: "2GB RAM",
      quantity: 1,
      unitCost: 45.0,
      totalCost: 45.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Pi Camera v3",
      specification: "12MP",
      quantity: 1,
      unitCost: 35.0,
      totalCost: 35.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "PoE HAT",
      specification: "802.3af",
      quantity: 1,
      unitCost: 20.0,
      totalCost: 20.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Weatherproof Enclosure",
      specification: "IP65",
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Polycase",
    },
    {
      item: "Mounting Bracket",
      specification: "Pole mount",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Amazon",
    },
    {
      item: "Silica Gel",
      specification: "10g × 3",
      quantity: 1,
      unitCost: 3.0,
      totalCost: 3.0,
      supplier: "Amazon",
    },
  ],
  bomTotal: 158.0,
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** SkyWatch Mesh Central - Central aggregation server */
export const skyWatchMeshCentral: Product = {
  sku: "SW-MESH-001-C",
  name: "SkyWatch Mesh (Central)",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "Large perimeters, farms, industrial sites",
  priceRange: "$350-400",
  priceMin: 350,
  priceMax: 400,
  specs: {
    detectionRange: "N/A - aggregation server",
    processingSpeed: "N/A",
    powerConsumption: "15-30W",
    connectivity: "Ethernet, WiFi",
    storage: "256GB NVMe",
  },
  bom: [
    {
      item: "Raspberry Pi 5",
      specification: "8GB RAM",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "NVMe SSD",
      specification: "256GB",
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Samsung",
    },
    {
      item: "PoE Switch",
      specification: "8-port, 802.3af",
      quantity: 1,
      unitCost: 120.0,
      totalCost: 120.0,
      supplier: "Ubiquiti",
    },
    {
      item: "UPS",
      specification: "450VA",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "APC",
    },
    {
      item: "Rack/Enclosure",
      specification: "Wall mount",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Various",
    },
  ],
  bomTotal: 370.0,
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** SkyWatch Enterprise - Full enterprise system */
export const skyWatchEnterprise: Product = {
  sku: "SW-ENT-001",
  name: "SkyWatch Enterprise",
  line: "SkyWatch",
  category: "detection",
  targetMarket: "Corporate campuses, critical infrastructure",
  priceRange: "$5,000-20,000",
  priceMin: 5000,
  priceMax: 20000,
  specs: {
    detectionRange: "1-5km (multi-sensor)",
    processingSpeed: "30+ FPS",
    powerConsumption: "50-100W",
    connectivity: "Ethernet, WiFi, MQTT, API",
  },
  bom: [
    {
      item: "Server",
      specification: "1U rackmount, 32GB",
      quantity: 1,
      unitCost: 800.0,
      totalCost: 800.0,
      supplier: "Dell/HP",
    },
    {
      item: "Detection Nodes",
      specification: "SkyWatch Standard",
      quantity: 10,
      unitCost: 200.0,
      totalCost: 2000.0,
      supplier: "Internal",
    },
    {
      item: "PTZ Cameras",
      specification: "30× zoom, PoE",
      quantity: 4,
      unitCost: 500.0,
      totalCost: 2000.0,
      supplier: "Hikvision/Axis",
    },
    {
      item: "RF Detection Array",
      specification: "RTL-SDR × 4",
      quantity: 1,
      unitCost: 200.0,
      totalCost: 200.0,
      supplier: "RTL-SDR.com",
    },
    {
      item: "Directional Antennas",
      specification: "Yagi, 2.4/5.8GHz",
      quantity: 4,
      unitCost: 100.0,
      totalCost: 400.0,
      supplier: "L-Com",
    },
    {
      item: "PoE Switch",
      specification: "24-port, managed",
      quantity: 1,
      unitCost: 400.0,
      totalCost: 400.0,
      supplier: "Ubiquiti",
    },
    {
      item: "UPS",
      specification: "1500VA, rack",
      quantity: 1,
      unitCost: 500.0,
      totalCost: 500.0,
      supplier: "APC",
    },
    {
      item: "Installation",
      specification: "Professional",
      quantity: 1,
      unitCost: 2000.0,
      totalCost: 2000.0,
      supplier: "Contractor",
    },
  ],
  bomTotal: 8300.0,
  optionalAccessories: [
    {
      item: "Radar Unit",
      specification: "Echodyne EchoGuard",
      quantity: 1,
      unitCost: 5000.0,
      totalCost: 5000.0,
      supplier: "Echodyne",
    },
  ],
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

// =============================================================================
// NETSENTRY LINE - COUNTERMEASURES (3 Products)
// =============================================================================

/** NetSentry Lite - Entry-level countermeasure */
export const netSentryLite: Product = {
  sku: "NS-LITE-001",
  name: "NetSentry Lite",
  line: "NetSentry",
  category: "countermeasure",
  targetMarket: "Makers, hobbyists, testing",
  priceRange: "$150-400",
  priceMin: 150,
  priceMax: 400,
  specs: {
    detectionRange: "50-100m",
    launchRange: "5-15m",
    responseTime: "200-500ms",
    reload: "Manual",
    netSize: "1.5m weighted",
  },
  bom: [
    {
      item: "Raspberry Pi 4",
      specification: "2GB RAM",
      quantity: 1,
      unitCost: 45.0,
      totalCost: 45.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Pi Camera v2",
      specification: "8MP",
      quantity: 1,
      unitCost: 25.0,
      totalCost: 25.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Spring Mechanism",
      specification: "Custom, 50lb",
      quantity: 1,
      unitCost: 35.0,
      totalCost: 35.0,
      supplier: "Hardware store",
    },
    {
      item: "Nichrome Wire",
      specification: "28AWG, 1m",
      quantity: 1,
      unitCost: 5.0,
      totalCost: 5.0,
      supplier: "Amazon",
    },
    {
      item: "MOSFET Module",
      specification: "IRLZ44N",
      quantity: 1,
      unitCost: 5.0,
      totalCost: 5.0,
      supplier: "Amazon",
    },
    {
      item: "Retaining Cord",
      specification: "Nylon, 2mm",
      quantity: 10,
      unitCost: 0.5,
      totalCost: 5.0,
      supplier: "Amazon",
    },
    {
      item: "Net",
      specification: "1.5m, weighted corners",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Fishing supply",
    },
    {
      item: "PVC Barrel",
      specification: '3" × 18"',
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Hardware store",
    },
    {
      item: "12V Relay Module",
      specification: "Opto-isolated",
      quantity: 1,
      unitCost: 5.0,
      totalCost: 5.0,
      supplier: "Amazon",
    },
    {
      item: "12V Power Supply",
      specification: "2A",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Amazon",
    },
    {
      item: "Enclosure",
      specification: "Weatherproof",
      quantity: 1,
      unitCost: 25.0,
      totalCost: 25.0,
      supplier: "Amazon",
    },
  ],
  bomTotal: 210.0,
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** NetSentry Standard - CO2-powered countermeasure */
export const netSentryStandard: Product = {
  sku: "NS-STD-001",
  name: "NetSentry Standard",
  line: "NetSentry",
  category: "countermeasure",
  targetMarket: "Property protection",
  priceRange: "$400-800",
  priceMin: 400,
  priceMax: 800,
  specs: {
    detectionRange: "100-200m",
    launchRange: "15-30m",
    responseTime: "50ms",
    reload: "CO2 cartridge replacement",
    netSize: "2m weighted",
    costPerShot: "$1-2",
  },
  bom: [
    {
      item: "Raspberry Pi 4",
      specification: "4GB RAM",
      quantity: 1,
      unitCost: 55.0,
      totalCost: 55.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Pi Camera HQ",
      specification: "12.3MP",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "8mm Lens",
      specification: "C-mount",
      quantity: 1,
      unitCost: 25.0,
      totalCost: 25.0,
      supplier: "Arducam",
    },
    {
      item: "Coral USB Accelerator",
      specification: "Edge TPU",
      quantity: 1,
      unitCost: 59.99,
      totalCost: 59.99,
      supplier: "Coral.ai",
    },
    {
      item: "CO2 Puncture Assembly",
      specification: "16g cartridge",
      quantity: 1,
      unitCost: 60.0,
      totalCost: 60.0,
      supplier: "Palmer Pursuit",
    },
    {
      item: "Solenoid Valve",
      specification: "12V, NC",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Amazon",
    },
    {
      item: "Expansion Chamber",
      specification: "Aluminum",
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Custom/3D print",
    },
    {
      item: "Net",
      specification: "2m, weighted",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Safety supply",
    },
    {
      item: "Barrel Assembly",
      specification: 'Aluminum, 4"',
      quantity: 1,
      unitCost: 40.0,
      totalCost: 40.0,
      supplier: "Custom",
    },
    {
      item: "Relay Module",
      specification: "Opto-isolated",
      quantity: 1,
      unitCost: 10.0,
      totalCost: 10.0,
      supplier: "Amazon",
    },
    {
      item: "12V Power Supply",
      specification: "5A",
      quantity: 1,
      unitCost: 20.0,
      totalCost: 20.0,
      supplier: "Amazon",
    },
    {
      item: "Weatherproof Enclosure",
      specification: "IP65",
      quantity: 1,
      unitCost: 60.0,
      totalCost: 60.0,
      supplier: "Polycase",
    },
  ],
  bomTotal: 499.99,
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

/** NetSentry Pro - Professional pneumatic countermeasure */
export const netSentryPro: Product = {
  sku: "NS-PRO-001",
  name: "NetSentry Pro",
  line: "NetSentry",
  category: "countermeasure",
  targetMarket: "Security professionals",
  priceRange: "$800-2,000",
  priceMin: 800,
  priceMax: 2000,
  specs: {
    detectionRange: "200-500m",
    launchRange: "25-50m",
    responseTime: "50ms",
    reload: "Air tank refill (free)",
    netSize: "3m auto-deploy",
  },
  bom: [
    {
      item: "Raspberry Pi 5",
      specification: "8GB RAM",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Global Shutter Camera",
      specification: "IMX296",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Telephoto Lens",
      specification: "12mm, CS",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "Arducam",
    },
    {
      item: "Coral M.2 Accelerator",
      specification: "Dual TPU",
      quantity: 1,
      unitCost: 35.0,
      totalCost: 35.0,
      supplier: "Coral.ai",
    },
    {
      item: "M.2 HAT",
      specification: "PCIe",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Raspberry Pi",
    },
    {
      item: "Air Tank",
      specification: "48ci, 3000psi",
      quantity: 1,
      unitCost: 100.0,
      totalCost: 100.0,
      supplier: "Paintball",
    },
    {
      item: "Regulator",
      specification: "Adjustable output",
      quantity: 1,
      unitCost: 80.0,
      totalCost: 80.0,
      supplier: "Ninja",
    },
    {
      item: "Solenoid Valve",
      specification: "MAC 35A",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "MAC Valves",
    },
    {
      item: "Barrel Assembly",
      specification: "Aluminum",
      quantity: 1,
      unitCost: 60.0,
      totalCost: 60.0,
      supplier: "Custom",
    },
    {
      item: "Net System",
      specification: "3m, auto-deploy",
      quantity: 1,
      unitCost: 120.0,
      totalCost: 120.0,
      supplier: "Custom",
    },
    {
      item: "Pan-Tilt Mount",
      specification: "Heavy duty",
      quantity: 1,
      unitCost: 150.0,
      totalCost: 150.0,
      supplier: "ServoCity",
    },
    {
      item: "Relay Module",
      specification: "4-channel",
      quantity: 1,
      unitCost: 15.0,
      totalCost: 15.0,
      supplier: "Amazon",
    },
    {
      item: "Industrial Enclosure",
      specification: "IP66",
      quantity: 1,
      unitCost: 100.0,
      totalCost: 100.0,
      supplier: "Polycase",
    },
    {
      item: "UPS Battery",
      specification: "12V 7Ah",
      quantity: 1,
      unitCost: 30.0,
      totalCost: 30.0,
      supplier: "Amazon",
    },
    {
      item: "Misc (cables, fittings)",
      specification: "Various",
      quantity: 1,
      unitCost: 50.0,
      totalCost: 50.0,
      supplier: "Various",
    },
  ],
  bomTotal: 1015.0,
  confidence: "verified",
  lastUpdated: "2026-01-09",
};

// =============================================================================
// PRODUCT COLLECTIONS
// =============================================================================

/** All SkyWatch products */
export const skyWatchProducts: Product[] = [
  skyWatchNano,
  skyWatchStandard,
  skyWatchPro,
  skyWatchMobile,
  skyWatchThermalBudget,
  skyWatchThermalPro,
  skyWatchMarine,
  skyWatchMeshNode,
  skyWatchMeshCentral,
  skyWatchEnterprise,
];

/** All NetSentry products */
export const netSentryProducts: Product[] = [
  netSentryLite,
  netSentryStandard,
  netSentryPro,
];

/** All products combined */
export const allProducts: Product[] = [
  ...skyWatchProducts,
  ...netSentryProducts,
];

// =============================================================================
// PRODUCT LOOKUP BY SKU
// =============================================================================

/** Map of SKU to product for easy lookup */
export const productBySku: Record<string, Product> = {
  "SW-NANO-001": skyWatchNano,
  "SW-STD-001": skyWatchStandard,
  "SW-PRO-001": skyWatchPro,
  "SW-MOB-001": skyWatchMobile,
  "SW-THM-001-B": skyWatchThermalBudget,
  "SW-THM-001-P": skyWatchThermalPro,
  "SW-MAR-001": skyWatchMarine,
  "SW-MESH-001-N": skyWatchMeshNode,
  "SW-MESH-001-C": skyWatchMeshCentral,
  "SW-ENT-001": skyWatchEnterprise,
  "NS-LITE-001": netSentryLite,
  "NS-STD-001": netSentryStandard,
  "NS-PRO-001": netSentryPro,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get product by SKU */
export function getProductBySku(sku: string): Product | undefined {
  return productBySku[sku];
}

/** Calculate total BOM cost with optional accessories */
export function getTotalWithAccessories(product: Product): number {
  const accessoriesTotal =
    product.optionalAccessories?.reduce(
      (sum, item) => sum + item.totalCost,
      0,
    ) ?? 0;
  return product.bomTotal + accessoriesTotal;
}

/** Format product price range */
export function formatProductPriceRange(product: Product): string {
  return product.priceRange;
}

/** Get products by line */
export function getProductsByLine(line: "SkyWatch" | "NetSentry"): Product[] {
  return allProducts.filter((p) => p.line === line);
}

/** Get products by category */
export function getProductsByCategory(
  category: "detection" | "countermeasure",
): Product[] {
  return allProducts.filter((p) => p.category === category);
}

/** Get products by price range */
export function getProductsByPriceRange(
  minPrice: number,
  maxPrice: number,
): Product[] {
  return allProducts.filter(
    (p) => p.priceMin >= minPrice && p.priceMax <= maxPrice,
  );
}

// =============================================================================
// SUMMARY DATA FOR QUICK REFERENCE
// =============================================================================

/** Product catalog summary */
export const productCatalogSummary = {
  totalProducts: allProducts.length,
  skyWatchCount: skyWatchProducts.length,
  netSentryCount: netSentryProducts.length,
  priceRangeMin: Math.min(...allProducts.map((p) => p.priceMin)),
  priceRangeMax: Math.max(...allProducts.map((p) => p.priceMax)),
  bomRangeMin: Math.min(...allProducts.map((p) => p.bomTotal)),
  bomRangeMax: Math.max(...allProducts.map((p) => p.bomTotal)),
  lastUpdated: "2026-01-09",
};

/** Mesh system pricing by coverage area */
export const meshSystemPricing = {
  "1_acre": {
    nodes: "2-3",
    nodeCost: "$316-474",
    central: "$370",
    total: "$686-844",
  },
  "5_acres": {
    nodes: "4-6",
    nodeCost: "$632-948",
    central: "$370",
    total: "$1,002-1,318",
  },
  "20_acres": {
    nodes: "8-12",
    nodeCost: "$1,264-1,896",
    central: "$370",
    total: "$1,634-2,266",
  },
  "100_acres": {
    nodes: "15-25",
    nodeCost: "$2,370-3,950",
    central: "$370",
    total: "$2,740-4,320",
  },
};

/** Enterprise system pricing options */
export const enterprisePricing = {
  withoutRadar: 8300,
  withRadar: 13300,
  radarCost: 5000,
};
