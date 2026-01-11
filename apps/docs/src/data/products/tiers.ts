/**
 * Tier Configurations for Product Configurator
 *
 * Contains all tier definitions and product-specific configurations
 * for compute, camera, connectivity, and storage options.
 */

import type {
  ComputeTier,
  CameraTier,
  ConnectivityTier,
  StorageTier,
  ProductComputeConfig,
  ProductCameraConfig,
  ProductConnectivityConfig,
  ProductStorageConfig,
  ProductConfiguration,
} from "./types";
import { productBySku } from "./catalog";

// =============================================================================
// COMPUTE TIER CONFIGURATOR
// =============================================================================

/** Available compute tiers */
export const computeTiers: Record<string, ComputeTier> = {
  // Pi-based tiers
  pi4_coral: {
    id: "pi4_coral",
    name: "Standard (Pi 4 + Coral)",
    platform: "Raspberry Pi 4 (2GB)",
    accelerator: "Coral USB Accelerator",
    price: 105,
    fps: "25",
    power: "6-10W",
    notes: "Reliable baseline for residential use",
  },
  pi5_hailo8l: {
    id: "pi5_hailo8l",
    name: "Enhanced (Pi 5 + Hailo-8L)",
    platform: "Raspberry Pi 5 (4GB)",
    accelerator: "Raspberry Pi AI Kit (Hailo-8L)",
    price: 130,
    fps: "45",
    power: "7-14W",
    notes: "Recommended for commercial properties",
  },
  pi5_hailo8: {
    id: "pi5_hailo8",
    name: "Pro (Pi 5 + Hailo-8)",
    platform: "Raspberry Pi 5 (8GB)",
    accelerator: "Hailo-8 M.2",
    price: 229,
    fps: "55",
    power: "10-20W",
    notes: "Maximum performance on Pi platform",
  },
  // Jetson-based tiers
  jetson_nano: {
    id: "jetson_nano",
    name: "Multi-Stream (Jetson Orin Nano)",
    platform: "Jetson Orin Nano (8GB)",
    accelerator: "Integrated GPU (40 TOPS)",
    price: 499,
    fps: "60",
    power: "7-15W",
    notes: "Multiple cameras, CUDA support",
  },
  jetson_nx: {
    id: "jetson_nx",
    name: "Enterprise (Jetson Orin NX)",
    platform: "Jetson Orin NX (16GB)",
    accelerator: "Integrated GPU (100 TOPS)",
    price: 599,
    fps: "120",
    power: "10-25W",
    notes: "Multi-sensor fusion, 3+ camera streams",
  },
  jetson_agx: {
    id: "jetson_agx",
    name: "Military/Defense (Jetson AGX Orin)",
    platform: "Jetson AGX Orin (64GB)",
    accelerator: "Integrated GPU (275 TOPS)",
    price: 1999,
    fps: "275",
    power: "15-60W",
    notes: "Ruggedized, 6+ streams, 4K capable",
  },
};

/** Compute tier availability and pricing by product */
export const productComputeConfigs: ProductComputeConfig[] = [
  // SkyWatch Nano - No upgrades (fixed Pi Zero config)
  {
    sku: "SW-NANO-001",
    productName: "SkyWatch Nano",
    baseTier: "none",
    baseComputeCost: 15,
    availableTiers: [], // Fixed config, no upgrades
    tierPricing: {},
    notes: "Entry-level fixed configuration",
  },
  // SkyWatch Standard
  {
    sku: "SW-STD-001",
    productName: "SkyWatch Standard",
    baseTier: "pi4_coral",
    baseComputeCost: 105, // Pi 4 2GB ($45) + Coral USB ($60)
    availableTiers: ["pi4_coral", "pi5_hailo8l", "pi5_hailo8", "jetson_nano"],
    tierPricing: {
      pi4_coral: { delta: 0, newBomTotal: 210 },
      pi5_hailo8l: { delta: 25, newBomTotal: 235 },
      pi5_hailo8: { delta: 124, newBomTotal: 334 },
      jetson_nano: { delta: 394, newBomTotal: 604 },
    },
  },
  // SkyWatch Pro
  {
    sku: "SW-PRO-001",
    productName: "SkyWatch Pro",
    baseTier: "pi5_hailo8l",
    baseComputeCost: 130, // Pi 5 4GB ($60) + Hailo-8L ($70)
    availableTiers: ["pi5_hailo8l", "pi5_hailo8", "jetson_nano", "jetson_nx"],
    tierPricing: {
      pi5_hailo8l: { delta: 0, newBomTotal: 495 },
      pi5_hailo8: { delta: 99, newBomTotal: 594 },
      jetson_nano: { delta: 369, newBomTotal: 864 },
      jetson_nx: { delta: 469, newBomTotal: 964 },
    },
  },
  // SkyWatch Mobile
  {
    sku: "SW-MOB-001",
    productName: "SkyWatch Mobile",
    baseTier: "pi4_coral",
    baseComputeCost: 105,
    availableTiers: ["pi4_coral", "pi5_hailo8l", "pi5_hailo8"],
    tierPricing: {
      pi4_coral: { delta: 0, newBomTotal: 371 },
      pi5_hailo8l: { delta: 25, newBomTotal: 396 },
      pi5_hailo8: { delta: 124, newBomTotal: 495 },
    },
    notes: "Jetson not available due to form factor/power constraints",
  },
  // SkyWatch Thermal Budget
  {
    sku: "SW-THM-001-B",
    productName: "SkyWatch Thermal (Budget)",
    baseTier: "pi4_coral",
    baseComputeCost: 115, // Pi 4 4GB ($55) + Coral USB ($60)
    availableTiers: ["pi4_coral", "pi5_hailo8l", "pi5_hailo8"],
    tierPricing: {
      pi4_coral: { delta: 0, newBomTotal: 468 },
      pi5_hailo8l: { delta: 15, newBomTotal: 483 },
      pi5_hailo8: { delta: 114, newBomTotal: 582 },
    },
  },
  // SkyWatch Thermal Pro
  {
    sku: "SW-THM-001-P",
    productName: "SkyWatch Thermal (Pro)",
    baseTier: "pi5_hailo8l",
    baseComputeCost: 150, // Pi 5 8GB ($80) + Hailo-8L ($70)
    availableTiers: ["pi5_hailo8l", "pi5_hailo8", "jetson_nano", "jetson_nx"],
    tierPricing: {
      pi5_hailo8l: { delta: 0, newBomTotal: 1370 },
      pi5_hailo8: { delta: 79, newBomTotal: 1449 },
      jetson_nano: { delta: 349, newBomTotal: 1719 },
      jetson_nx: { delta: 449, newBomTotal: 1819 },
    },
  },
  // SkyWatch Marine
  {
    sku: "SW-MAR-001",
    productName: "SkyWatch Marine",
    baseTier: "pi4_coral",
    baseComputeCost: 115, // Pi 4 4GB ($55) + Coral USB ($60)
    availableTiers: ["pi4_coral", "pi5_hailo8l", "pi5_hailo8", "jetson_nano"],
    tierPricing: {
      pi4_coral: { delta: 0, newBomTotal: 640 },
      pi5_hailo8l: { delta: 15, newBomTotal: 655 },
      pi5_hailo8: { delta: 114, newBomTotal: 754 },
      jetson_nano: { delta: 384, newBomTotal: 1024 },
    },
  },
  // SkyWatch Mesh Node
  {
    sku: "SW-MESH-001-N",
    productName: "SkyWatch Mesh (Node)",
    baseTier: "pi4_coral",
    baseComputeCost: 45, // Pi 4 2GB only (no accelerator on nodes)
    availableTiers: ["pi4_coral", "pi5_hailo8l"],
    tierPricing: {
      pi4_coral: { delta: 0, newBomTotal: 158 },
      pi5_hailo8l: { delta: 85, newBomTotal: 243 },
    },
    notes: "Nodes typically don't need Jetson (processing at Central)",
  },
  // SkyWatch Mesh Central
  {
    sku: "SW-MESH-001-C",
    productName: "SkyWatch Mesh (Central)",
    baseTier: "pi5_hailo8l",
    baseComputeCost: 150, // Pi 5 8GB ($80) + Hailo-8L ($70)
    availableTiers: ["pi5_hailo8l", "pi5_hailo8", "jetson_nano", "jetson_nx", "jetson_agx"],
    tierPricing: {
      pi5_hailo8l: { delta: 0, newBomTotal: 370 },
      pi5_hailo8: { delta: 79, newBomTotal: 449 },
      jetson_nano: { delta: 349, newBomTotal: 719 },
      jetson_nx: { delta: 449, newBomTotal: 819 },
      jetson_agx: { delta: 1849, newBomTotal: 2219 },
    },
  },
  // SkyWatch Enterprise
  {
    sku: "SW-ENT-001",
    productName: "SkyWatch Enterprise",
    baseTier: "jetson_nx",
    baseComputeCost: 599,
    availableTiers: ["jetson_nx", "jetson_agx"],
    tierPricing: {
      jetson_nx: { delta: 0, newBomTotal: 8300 },
      jetson_agx: { delta: 1400, newBomTotal: 9700 },
    },
    notes: "Enterprise requires Jetson minimum",
  },
  // NetSentry Lite
  {
    sku: "NS-LITE-001",
    productName: "NetSentry Lite",
    baseTier: "pi4_coral",
    baseComputeCost: 45, // Pi 4 2GB only (no accelerator)
    availableTiers: ["pi4_coral", "pi5_hailo8l"],
    tierPricing: {
      pi4_coral: { delta: 0, newBomTotal: 210 },
      pi5_hailo8l: { delta: 85, newBomTotal: 295 },
    },
  },
  // NetSentry Standard
  {
    sku: "NS-STD-001",
    productName: "NetSentry Standard",
    baseTier: "pi4_coral",
    baseComputeCost: 115, // Pi 4 4GB ($55) + Coral USB ($60)
    availableTiers: ["pi4_coral", "pi5_hailo8l", "pi5_hailo8"],
    tierPricing: {
      pi4_coral: { delta: 0, newBomTotal: 500 },
      pi5_hailo8l: { delta: 15, newBomTotal: 515 },
      pi5_hailo8: { delta: 114, newBomTotal: 614 },
    },
  },
  // NetSentry Pro
  {
    sku: "NS-PRO-001",
    productName: "NetSentry Pro",
    baseTier: "pi5_hailo8l",
    baseComputeCost: 150, // Pi 5 8GB ($80) + Hailo-8L ($70)
    availableTiers: ["pi5_hailo8l", "pi5_hailo8", "jetson_nano", "jetson_nx"],
    tierPricing: {
      pi5_hailo8l: { delta: 0, newBomTotal: 1015 },
      pi5_hailo8: { delta: 79, newBomTotal: 1094 },
      jetson_nano: { delta: 349, newBomTotal: 1364 },
      jetson_nx: { delta: 449, newBomTotal: 1464 },
    },
  },
  // SkySnare - Consumer Line (Handheld, no compute - manual trigger)
  {
    sku: "SS-001",
    productName: "SkySnare",
    baseTier: "none",
    baseComputeCost: 0,
    availableTiers: [], // Handheld, manual trigger - no compute
    tierPricing: {},
    notes: "Consumer handheld launcher - manual point-and-shoot, no compute",
  },
  // NetSnare - Ground Launcher Line (pairs with SkyWatch detection)
  {
    sku: "NSN-LITE-001",
    productName: "NetSnare Lite",
    baseTier: "none",
    baseComputeCost: 0,
    availableTiers: [], // Spring-powered, triggered via SkyWatch API
    tierPricing: {},
    notes: "Ground launcher only - uses paired SkyWatch for detection",
  },
  {
    sku: "NSN-STD-001",
    productName: "NetSnare Standard",
    baseTier: "none",
    baseComputeCost: 0,
    availableTiers: [], // CO2-powered, triggered via SkyWatch API
    tierPricing: {},
    notes: "Ground launcher only - uses paired SkyWatch for detection",
  },
  {
    sku: "NSN-PRO-001",
    productName: "NetSnare Pro",
    baseTier: "none",
    baseComputeCost: 0,
    availableTiers: [], // Pneumatic with pan-tilt, triggered via SkyWatch API
    tierPricing: {},
    notes: "Ground launcher with tracking - uses paired SkyWatch for detection",
  },
  // AeroNet - Enterprise Platform
  {
    sku: "AN-ENT-001",
    productName: "AeroNet Enterprise",
    baseTier: "jetson_agx",
    baseComputeCost: 1999,
    availableTiers: ["jetson_agx"], // Enterprise requires AGX minimum
    tierPricing: {
      jetson_agx: { delta: 0, newBomTotal: 59200 },
    },
    notes: "Full C-UAS platform - Jetson AGX Orin required for multi-sensor fusion",
  },
  {
    sku: "AN-CMD-001",
    productName: "AeroNet Command",
    baseTier: "server",
    baseComputeCost: 0, // Software license
    availableTiers: [], // Software-only, runs on customer infrastructure
    tierPricing: {},
    notes: "C2 software license - cloud or on-premise deployment",
  },
  // RKV - Military Systems
  {
    sku: "RKV-M-001",
    productName: "RKV-M Mothership",
    baseTier: "jetson_agx",
    baseComputeCost: 1999,
    availableTiers: ["jetson_agx"], // Aerial platform requires AGX
    tierPricing: {
      jetson_agx: { delta: 0, newBomTotal: 29736 },
    },
    notes: "VTOL aerial platform - Jetson AGX Orin for autonomous flight + intercept",
  },
  {
    sku: "RKV-I-001",
    productName: "RKV-I Interceptor",
    baseTier: "jetson_nano",
    baseComputeCost: 499,
    availableTiers: ["jetson_nano"], // Expendable - cost-optimized
    tierPricing: {
      jetson_nano: { delta: 0, newBomTotal: 4338 },
    },
    notes: "Expendable interceptor - Jetson Orin Nano for visual+RF homing",
  },
  {
    sku: "RKV-G-001",
    productName: "RKV-G Ground Station",
    baseTier: "jetson_agx",
    baseComputeCost: 1999,
    availableTiers: ["jetson_agx"], // Mobile C2 requires full compute
    tierPricing: {
      jetson_agx: { delta: 0, newBomTotal: 52478 },
    },
    notes: "Mobile command - Jetson AGX Orin for multi-target coordination",
  },
];

// =============================================================================
// CAMERA TIER CONFIGURATOR
// =============================================================================

/** Available camera tiers */
export const cameraTiers: Record<string, CameraTier> = {
  // Standard cameras
  pi_v2: {
    id: "pi_v2",
    name: "Basic (Pi Camera v2)",
    resolution: "8MP",
    sensor: "Sony IMX219",
    price: 25,
    features: ["Fixed focus", "1080p30 video", "Low-light limited"],
    notes: "Entry-level, daylight detection",
  },
  pi_v3: {
    id: "pi_v3",
    name: "Standard (Pi Camera v3)",
    resolution: "12MP",
    sensor: "Sony IMX708",
    price: 35,
    features: ["Autofocus", "HDR", "Low-light enhanced", "1080p50 video"],
    notes: "Best all-around for most deployments",
  },
  pi_v3_wide: {
    id: "pi_v3_wide",
    name: "Wide Angle (Pi Camera v3 Wide)",
    resolution: "12MP",
    sensor: "Sony IMX708",
    price: 35,
    features: ["120° FOV", "Autofocus", "HDR", "Area coverage"],
    notes: "Wide area monitoring, reduced range",
  },
  pi_hq: {
    id: "pi_hq",
    name: "High Quality (Pi Camera HQ)",
    resolution: "12.3MP",
    sensor: "Sony IMX477",
    price: 50,
    features: ["C/CS mount", "Interchangeable lens", "Large sensor"],
    notes: "Professional, requires separate lens",
  },
  pi_gs: {
    id: "pi_gs",
    name: "Global Shutter (Pi GS Camera)",
    resolution: "1.6MP",
    sensor: "Sony IMX296",
    price: 50,
    features: ["No rolling shutter", "High-speed capture", "Motion tracking"],
    notes: "Best for fast-moving drone tracking",
  },
  // Thermal cameras
  lepton_3_5: {
    id: "lepton_3_5",
    name: "Thermal (FLIR Lepton 3.5)",
    resolution: "160×120",
    sensor: "FLIR Lepton 3.5",
    price: 250, // Includes breakout board
    features: ["Thermal imaging", "8.7Hz", "<50mK sensitivity"],
    notes: "Budget thermal, 24/7 detection",
  },
  boson_320: {
    id: "boson_320",
    name: "Thermal Pro (FLIR Boson 320)",
    resolution: "320×256",
    sensor: "FLIR Boson 320",
    price: 900, // Includes interface board
    features: ["60Hz thermal", "Professional grade", "Long range"],
    notes: "Professional thermal detection",
  },
};

/** Camera tier availability by product */
export const productCameraConfigs: ProductCameraConfig[] = [
  // SkyWatch Nano
  {
    sku: "SW-NANO-001",
    productName: "SkyWatch Nano",
    baseCameraId: "pi_v2",
    baseCameraPrice: 25,
    availableCameras: ["pi_v2", "pi_v3"],
    cameraPricing: {
      pi_v2: { delta: 0 },
      pi_v3: { delta: 10 },
    },
    notes: "Limited by Pi Zero compute",
  },
  // SkyWatch Standard
  {
    sku: "SW-STD-001",
    productName: "SkyWatch Standard",
    baseCameraId: "pi_v3",
    baseCameraPrice: 35,
    availableCameras: ["pi_v2", "pi_v3", "pi_v3_wide", "pi_hq"],
    cameraPricing: {
      pi_v2: { delta: -10 },
      pi_v3: { delta: 0 },
      pi_v3_wide: { delta: 0 },
      pi_hq: { delta: 15 },
    },
  },
  // SkyWatch Pro
  {
    sku: "SW-PRO-001",
    productName: "SkyWatch Pro",
    baseCameraId: "pi_hq",
    baseCameraPrice: 50,
    availableCameras: ["pi_v3", "pi_hq", "pi_gs"],
    cameraPricing: {
      pi_v3: { delta: -15 },
      pi_hq: { delta: 0 },
      pi_gs: { delta: 0 },
    },
    lensRequired: true,
    notes: "Lens sold separately for HQ/GS",
  },
  // SkyWatch Mobile
  {
    sku: "SW-MOB-001",
    productName: "SkyWatch Mobile",
    baseCameraId: "pi_v3",
    baseCameraPrice: 35,
    availableCameras: ["pi_v3", "pi_v3_wide"],
    cameraPricing: {
      pi_v3: { delta: 0 },
      pi_v3_wide: { delta: 0 },
    },
    notes: "Compact form factor limits options",
  },
  // SkyWatch Thermal Budget
  {
    sku: "SW-THM-001-B",
    productName: "SkyWatch Thermal (Budget)",
    baseCameraId: "lepton_3_5",
    baseCameraPrice: 250,
    availableCameras: ["lepton_3_5"],
    cameraPricing: {
      lepton_3_5: { delta: 0 },
    },
    notes: "Thermal sensor fixed, visible camera configurable separately",
  },
  // SkyWatch Thermal Pro
  {
    sku: "SW-THM-001-P",
    productName: "SkyWatch Thermal (Pro)",
    baseCameraId: "boson_320",
    baseCameraPrice: 900,
    availableCameras: ["lepton_3_5", "boson_320"],
    cameraPricing: {
      lepton_3_5: { delta: -650 },
      boson_320: { delta: 0 },
    },
    notes: "Includes visible camera (Pi HQ)",
  },
  // SkyWatch Marine
  {
    sku: "SW-MAR-001",
    productName: "SkyWatch Marine",
    baseCameraId: "pi_hq",
    baseCameraPrice: 50,
    availableCameras: ["pi_v3", "pi_hq", "pi_gs"],
    cameraPricing: {
      pi_v3: { delta: -15 },
      pi_hq: { delta: 0 },
      pi_gs: { delta: 0 },
    },
    lensRequired: true,
  },
  // SkyWatch Mesh Node
  {
    sku: "SW-MESH-001-N",
    productName: "SkyWatch Mesh (Node)",
    baseCameraId: "pi_v3",
    baseCameraPrice: 35,
    availableCameras: ["pi_v2", "pi_v3", "pi_v3_wide"],
    cameraPricing: {
      pi_v2: { delta: -10 },
      pi_v3: { delta: 0 },
      pi_v3_wide: { delta: 0 },
    },
  },
  // SkyWatch Mesh Central - no camera
  {
    sku: "SW-MESH-001-C",
    productName: "SkyWatch Mesh (Central)",
    baseCameraId: "none",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Aggregation server, no camera",
  },
  // SkyWatch Enterprise - multiple cameras included
  {
    sku: "SW-ENT-001",
    productName: "SkyWatch Enterprise",
    baseCameraId: "mixed",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Includes 10 nodes + 4 PTZ cameras, configured separately",
  },
  // NetSentry Lite
  {
    sku: "NS-LITE-001",
    productName: "NetSentry Lite",
    baseCameraId: "pi_v2",
    baseCameraPrice: 25,
    availableCameras: ["pi_v2", "pi_v3"],
    cameraPricing: {
      pi_v2: { delta: 0 },
      pi_v3: { delta: 10 },
    },
  },
  // NetSentry Standard
  {
    sku: "NS-STD-001",
    productName: "NetSentry Standard",
    baseCameraId: "pi_hq",
    baseCameraPrice: 50,
    availableCameras: ["pi_v3", "pi_hq", "pi_gs"],
    cameraPricing: {
      pi_v3: { delta: -15 },
      pi_hq: { delta: 0 },
      pi_gs: { delta: 0 },
    },
    lensRequired: true,
  },
  // NetSentry Pro
  {
    sku: "NS-PRO-001",
    productName: "NetSentry Pro",
    baseCameraId: "pi_gs",
    baseCameraPrice: 50,
    availableCameras: ["pi_hq", "pi_gs"],
    cameraPricing: {
      pi_hq: { delta: 0 },
      pi_gs: { delta: 0 },
    },
    lensRequired: true,
    notes: "Global shutter recommended for intercept timing",
  },
  // SkySnare - no camera
  {
    sku: "SS-001",
    productName: "SkySnare",
    baseCameraId: "none",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Handheld launcher, no camera",
  },
  // NetSnare - no cameras (use paired SkyWatch)
  {
    sku: "NSN-LITE-001",
    productName: "NetSnare Lite",
    baseCameraId: "none",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Ground launcher, uses paired SkyWatch",
  },
  {
    sku: "NSN-STD-001",
    productName: "NetSnare Standard",
    baseCameraId: "none",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Ground launcher, uses paired SkyWatch",
  },
  {
    sku: "NSN-PRO-001",
    productName: "NetSnare Pro",
    baseCameraId: "none",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Ground launcher, uses paired SkyWatch",
  },
  // AeroNet - enterprise config
  {
    sku: "AN-ENT-001",
    productName: "AeroNet Enterprise",
    baseCameraId: "enterprise",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Multi-sensor suite configured per-site",
  },
  {
    sku: "AN-CMD-001",
    productName: "AeroNet Command",
    baseCameraId: "none",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Software only",
  },
  // RKV - fixed camera configs
  {
    sku: "RKV-M-001",
    productName: "RKV-M Mothership",
    baseCameraId: "fixed",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Integrated EO/IR gimbal, not configurable",
  },
  {
    sku: "RKV-I-001",
    productName: "RKV-I Interceptor",
    baseCameraId: "fixed",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Fixed forward camera for homing",
  },
  {
    sku: "RKV-G-001",
    productName: "RKV-G Ground Station",
    baseCameraId: "fixed",
    baseCameraPrice: 0,
    availableCameras: [],
    cameraPricing: {},
    notes: "Mast-mounted sensor suite, configured per-order",
  },
];

// =============================================================================
// CONNECTIVITY TIER CONFIGURATOR
// =============================================================================

/** Available connectivity tiers */
export const connectivityTiers: Record<string, ConnectivityTier> = {
  wifi: {
    id: "wifi",
    name: "WiFi Only",
    type: "Wireless",
    speed: "Up to 150Mbps",
    price: 0, // Included
    power: "Included",
    notes: "Basic wireless, requires WiFi coverage",
  },
  ethernet: {
    id: "ethernet",
    name: "Ethernet",
    type: "Wired",
    speed: "1Gbps",
    price: 0, // Included on Pi 4/5
    power: "Separate power needed",
    notes: "Reliable wired connection",
  },
  poe: {
    id: "poe",
    name: "PoE (802.3af)",
    type: "Wired + Power",
    speed: "1Gbps",
    price: 20,
    power: "15W via PoE",
    notes: "Power + data over single cable",
  },
  poe_plus: {
    id: "poe_plus",
    name: "PoE+ (802.3at)",
    type: "Wired + Power",
    speed: "1Gbps",
    price: 25,
    power: "30W via PoE+",
    notes: "Higher power for Jetson/accessories",
  },
  lte: {
    id: "lte",
    name: "LTE Cellular",
    type: "Cellular",
    speed: "Up to 100Mbps",
    price: 75,
    power: "+2W",
    notes: "Cellular for remote deployments",
  },
  lte_poe: {
    id: "lte_poe",
    name: "LTE + PoE Dual",
    type: "Hybrid",
    speed: "1Gbps + LTE failover",
    price: 95,
    power: "PoE + 2W LTE",
    notes: "PoE primary with LTE failover",
  },
};

/** Connectivity tier availability by product */
export const productConnectivityConfigs: ProductConnectivityConfig[] = [
  // SkyWatch Nano
  {
    sku: "SW-NANO-001",
    productName: "SkyWatch Nano",
    baseConnectivityId: "wifi",
    baseConnectivityPrice: 0,
    availableConnectivity: ["wifi"], // Pi Zero WiFi only
    connectivityPricing: {
      wifi: { delta: 0 },
    },
    notes: "Pi Zero 2W - WiFi only",
  },
  // SkyWatch Standard
  {
    sku: "SW-STD-001",
    productName: "SkyWatch Standard",
    baseConnectivityId: "poe",
    baseConnectivityPrice: 20,
    availableConnectivity: ["wifi", "ethernet", "poe", "lte"],
    connectivityPricing: {
      wifi: { delta: -20 },
      ethernet: { delta: -20 },
      poe: { delta: 0 },
      lte: { delta: 55 },
    },
  },
  // SkyWatch Pro
  {
    sku: "SW-PRO-001",
    productName: "SkyWatch Pro",
    baseConnectivityId: "poe_plus",
    baseConnectivityPrice: 25,
    availableConnectivity: ["poe", "poe_plus", "lte", "lte_poe"],
    connectivityPricing: {
      poe: { delta: -5 },
      poe_plus: { delta: 0 },
      lte: { delta: 50 },
      lte_poe: { delta: 70 },
    },
  },
  // SkyWatch Mobile
  {
    sku: "SW-MOB-001",
    productName: "SkyWatch Mobile",
    baseConnectivityId: "wifi",
    baseConnectivityPrice: 0,
    availableConnectivity: ["wifi", "lte"],
    connectivityPricing: {
      wifi: { delta: 0 },
      lte: { delta: 75 },
    },
    notes: "Battery powered - no PoE",
  },
  // SkyWatch Thermal Budget
  {
    sku: "SW-THM-001-B",
    productName: "SkyWatch Thermal (Budget)",
    baseConnectivityId: "poe",
    baseConnectivityPrice: 20,
    availableConnectivity: ["wifi", "ethernet", "poe", "lte"],
    connectivityPricing: {
      wifi: { delta: -20 },
      ethernet: { delta: -20 },
      poe: { delta: 0 },
      lte: { delta: 55 },
    },
  },
  // SkyWatch Thermal Pro
  {
    sku: "SW-THM-001-P",
    productName: "SkyWatch Thermal (Pro)",
    baseConnectivityId: "poe_plus",
    baseConnectivityPrice: 25,
    availableConnectivity: ["poe", "poe_plus", "lte_poe"],
    connectivityPricing: {
      poe: { delta: -5 },
      poe_plus: { delta: 0 },
      lte_poe: { delta: 70 },
    },
  },
  // SkyWatch Marine
  {
    sku: "SW-MAR-001",
    productName: "SkyWatch Marine",
    baseConnectivityId: "wifi",
    baseConnectivityPrice: 0,
    availableConnectivity: ["wifi", "ethernet", "lte"],
    connectivityPricing: {
      wifi: { delta: 0 },
      ethernet: { delta: 0 },
      lte: { delta: 75 },
    },
    notes: "12V DC marine power, no PoE",
  },
  // SkyWatch Mesh Node
  {
    sku: "SW-MESH-001-N",
    productName: "SkyWatch Mesh (Node)",
    baseConnectivityId: "poe",
    baseConnectivityPrice: 20,
    availableConnectivity: ["poe"], // Mesh nodes require PoE
    connectivityPricing: {
      poe: { delta: 0 },
    },
    notes: "PoE required for mesh deployment",
  },
  // SkyWatch Mesh Central
  {
    sku: "SW-MESH-001-C",
    productName: "SkyWatch Mesh (Central)",
    baseConnectivityId: "ethernet",
    baseConnectivityPrice: 0,
    availableConnectivity: ["ethernet", "lte_poe"],
    connectivityPricing: {
      ethernet: { delta: 0 },
      lte_poe: { delta: 95 },
    },
    notes: "PoE switch included, uplink configurable",
  },
  // SkyWatch Enterprise
  {
    sku: "SW-ENT-001",
    productName: "SkyWatch Enterprise",
    baseConnectivityId: "enterprise",
    baseConnectivityPrice: 0,
    availableConnectivity: [],
    connectivityPricing: {},
    notes: "Managed switch included, configured per-site",
  },
  // NetSentry Lite
  {
    sku: "NS-LITE-001",
    productName: "NetSentry Lite",
    baseConnectivityId: "wifi",
    baseConnectivityPrice: 0,
    availableConnectivity: ["wifi", "ethernet"],
    connectivityPricing: {
      wifi: { delta: 0 },
      ethernet: { delta: 0 },
    },
  },
  // NetSentry Standard
  {
    sku: "NS-STD-001",
    productName: "NetSentry Standard",
    baseConnectivityId: "poe",
    baseConnectivityPrice: 20,
    availableConnectivity: ["wifi", "ethernet", "poe"],
    connectivityPricing: {
      wifi: { delta: -20 },
      ethernet: { delta: -20 },
      poe: { delta: 0 },
    },
  },
  // NetSentry Pro
  {
    sku: "NS-PRO-001",
    productName: "NetSentry Pro",
    baseConnectivityId: "poe_plus",
    baseConnectivityPrice: 25,
    availableConnectivity: ["poe", "poe_plus", "lte_poe"],
    connectivityPricing: {
      poe: { delta: -5 },
      poe_plus: { delta: 0 },
      lte_poe: { delta: 70 },
    },
  },
  // SkySnare
  {
    sku: "SS-001",
    productName: "SkySnare",
    baseConnectivityId: "none",
    baseConnectivityPrice: 0,
    availableConnectivity: [],
    connectivityPricing: {},
    notes: "Handheld, no connectivity",
  },
  // NetSnare - triggered via SkyWatch
  {
    sku: "NSN-LITE-001",
    productName: "NetSnare Lite",
    baseConnectivityId: "wifi",
    baseConnectivityPrice: 0,
    availableConnectivity: ["wifi"],
    connectivityPricing: {
      wifi: { delta: 0 },
    },
    notes: "WiFi for trigger from SkyWatch",
  },
  {
    sku: "NSN-STD-001",
    productName: "NetSnare Standard",
    baseConnectivityId: "wifi",
    baseConnectivityPrice: 0,
    availableConnectivity: ["wifi", "ethernet"],
    connectivityPricing: {
      wifi: { delta: 0 },
      ethernet: { delta: 0 },
    },
  },
  {
    sku: "NSN-PRO-001",
    productName: "NetSnare Pro",
    baseConnectivityId: "ethernet",
    baseConnectivityPrice: 0,
    availableConnectivity: ["wifi", "ethernet", "poe"],
    connectivityPricing: {
      wifi: { delta: 0 },
      ethernet: { delta: 0 },
      poe: { delta: 20 },
    },
  },
  // AeroNet
  {
    sku: "AN-ENT-001",
    productName: "AeroNet Enterprise",
    baseConnectivityId: "enterprise",
    baseConnectivityPrice: 0,
    availableConnectivity: [],
    connectivityPricing: {},
    notes: "10GbE backbone, configured per-site",
  },
  {
    sku: "AN-CMD-001",
    productName: "AeroNet Command",
    baseConnectivityId: "cloud",
    baseConnectivityPrice: 0,
    availableConnectivity: [],
    connectivityPricing: {},
    notes: "Cloud or on-premise, network provided",
  },
  // RKV
  {
    sku: "RKV-M-001",
    productName: "RKV-M Mothership",
    baseConnectivityId: "mesh_radio",
    baseConnectivityPrice: 0,
    availableConnectivity: [],
    connectivityPricing: {},
    notes: "Integrated mesh radio, not configurable",
  },
  {
    sku: "RKV-I-001",
    productName: "RKV-I Interceptor",
    baseConnectivityId: "mesh_radio",
    baseConnectivityPrice: 0,
    availableConnectivity: [],
    connectivityPricing: {},
    notes: "Short-range datalink to mothership",
  },
  {
    sku: "RKV-G-001",
    productName: "RKV-G Ground Station",
    baseConnectivityId: "enterprise",
    baseConnectivityPrice: 0,
    availableConnectivity: [],
    connectivityPricing: {},
    notes: "Satellite + mesh radio, configured per-order",
  },
];

// =============================================================================
// STORAGE TIER CONFIGURATOR
// =============================================================================

/** Available storage tiers */
export const storageTiers: Record<string, StorageTier> = {
  sd_32: {
    id: "sd_32",
    name: "Basic (32GB microSD)",
    type: "microSD",
    capacity: "32GB",
    speed: "100MB/s",
    price: 8,
    endurance: "Standard",
    notes: "Minimum viable, alerts only",
  },
  sd_64_he: {
    id: "sd_64_he",
    name: "Standard (64GB High Endurance)",
    type: "microSD",
    capacity: "64GB",
    speed: "100MB/s",
    price: 15,
    endurance: "High Endurance",
    notes: "Best for continuous event recording",
  },
  sd_128_he: {
    id: "sd_128_he",
    name: "Extended (128GB High Endurance)",
    type: "microSD",
    capacity: "128GB",
    speed: "160MB/s",
    price: 25,
    endurance: "High Endurance",
    notes: "Extended local storage",
  },
  nvme_128: {
    id: "nvme_128",
    name: "Fast (128GB NVMe SSD)",
    type: "NVMe M.2",
    capacity: "128GB",
    speed: "2000MB/s",
    price: 25,
    endurance: "High",
    notes: "Fast storage for continuous recording",
  },
  nvme_256: {
    id: "nvme_256",
    name: "Pro (256GB NVMe SSD)",
    type: "NVMe M.2",
    capacity: "256GB",
    speed: "2500MB/s",
    price: 40,
    endurance: "Professional",
    notes: "Professional continuous recording",
  },
  nvme_512: {
    id: "nvme_512",
    name: "Enterprise (512GB NVMe SSD)",
    type: "NVMe M.2",
    capacity: "512GB",
    speed: "3500MB/s",
    price: 60,
    endurance: "Enterprise",
    notes: "Extended retention for compliance",
  },
  nvme_1tb: {
    id: "nvme_1tb",
    name: "Archive (1TB NVMe SSD)",
    type: "NVMe M.2",
    capacity: "1TB",
    speed: "3500MB/s",
    price: 100,
    endurance: "Maximum",
    notes: "Maximum local evidence buffer",
  },
};

/** Storage tier availability by product */
export const productStorageConfigs: ProductStorageConfig[] = [
  // SkyWatch Nano
  {
    sku: "SW-NANO-001",
    productName: "SkyWatch Nano",
    baseStorageId: "sd_32",
    baseStoragePrice: 8,
    availableStorage: ["sd_32", "sd_64_he"],
    storagePricing: {
      sd_32: { delta: 0 },
      sd_64_he: { delta: 7 },
    },
    nvmeSupported: false,
    notes: "Pi Zero - SD only",
  },
  // SkyWatch Standard
  {
    sku: "SW-STD-001",
    productName: "SkyWatch Standard",
    baseStorageId: "sd_64_he",
    baseStoragePrice: 15,
    availableStorage: ["sd_32", "sd_64_he", "sd_128_he"],
    storagePricing: {
      sd_32: { delta: -7 },
      sd_64_he: { delta: 0 },
      sd_128_he: { delta: 10 },
    },
    nvmeSupported: false,
    notes: "Pi 4 - SD only (upgrade to Pro for NVMe)",
  },
  // SkyWatch Pro
  {
    sku: "SW-PRO-001",
    productName: "SkyWatch Pro",
    baseStorageId: "nvme_128",
    baseStoragePrice: 25,
    availableStorage: ["sd_128_he", "nvme_128", "nvme_256", "nvme_512"],
    storagePricing: {
      sd_128_he: { delta: 0 },
      nvme_128: { delta: 0 },
      nvme_256: { delta: 15 },
      nvme_512: { delta: 35 },
    },
    nvmeSupported: true,
  },
  // SkyWatch Mobile
  {
    sku: "SW-MOB-001",
    productName: "SkyWatch Mobile",
    baseStorageId: "sd_64_he",
    baseStoragePrice: 15,
    availableStorage: ["sd_64_he", "sd_128_he"],
    storagePricing: {
      sd_64_he: { delta: 0 },
      sd_128_he: { delta: 10 },
    },
    nvmeSupported: false,
    notes: "Portable form factor",
  },
  // SkyWatch Thermal Budget
  {
    sku: "SW-THM-001-B",
    productName: "SkyWatch Thermal (Budget)",
    baseStorageId: "sd_64_he",
    baseStoragePrice: 15,
    availableStorage: ["sd_64_he", "sd_128_he"],
    storagePricing: {
      sd_64_he: { delta: 0 },
      sd_128_he: { delta: 10 },
    },
    nvmeSupported: false,
  },
  // SkyWatch Thermal Pro
  {
    sku: "SW-THM-001-P",
    productName: "SkyWatch Thermal (Pro)",
    baseStorageId: "nvme_256",
    baseStoragePrice: 40,
    availableStorage: ["nvme_128", "nvme_256", "nvme_512", "nvme_1tb"],
    storagePricing: {
      nvme_128: { delta: -15 },
      nvme_256: { delta: 0 },
      nvme_512: { delta: 20 },
      nvme_1tb: { delta: 60 },
    },
    nvmeSupported: true,
  },
  // SkyWatch Marine
  {
    sku: "SW-MAR-001",
    productName: "SkyWatch Marine",
    baseStorageId: "sd_128_he",
    baseStoragePrice: 25,
    availableStorage: ["sd_64_he", "sd_128_he"],
    storagePricing: {
      sd_64_he: { delta: -10 },
      sd_128_he: { delta: 0 },
    },
    nvmeSupported: false,
    notes: "SD for marine environment reliability",
  },
  // SkyWatch Mesh Node
  {
    sku: "SW-MESH-001-N",
    productName: "SkyWatch Mesh (Node)",
    baseStorageId: "sd_64_he",
    baseStoragePrice: 15,
    availableStorage: ["sd_32", "sd_64_he"],
    storagePricing: {
      sd_32: { delta: -7 },
      sd_64_he: { delta: 0 },
    },
    nvmeSupported: false,
    notes: "Nodes sync to Central",
  },
  // SkyWatch Mesh Central
  {
    sku: "SW-MESH-001-C",
    productName: "SkyWatch Mesh (Central)",
    baseStorageId: "nvme_256",
    baseStoragePrice: 40,
    availableStorage: ["nvme_256", "nvme_512", "nvme_1tb"],
    storagePricing: {
      nvme_256: { delta: 0 },
      nvme_512: { delta: 20 },
      nvme_1tb: { delta: 60 },
    },
    nvmeSupported: true,
    notes: "Central aggregation storage",
  },
  // SkyWatch Enterprise
  {
    sku: "SW-ENT-001",
    productName: "SkyWatch Enterprise",
    baseStorageId: "enterprise",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: true,
    notes: "NAS/SAN configured per-site",
  },
  // NetSentry Lite
  {
    sku: "NS-LITE-001",
    productName: "NetSentry Lite",
    baseStorageId: "sd_32",
    baseStoragePrice: 8,
    availableStorage: ["sd_32", "sd_64_he"],
    storagePricing: {
      sd_32: { delta: 0 },
      sd_64_he: { delta: 7 },
    },
    nvmeSupported: false,
  },
  // NetSentry Standard
  {
    sku: "NS-STD-001",
    productName: "NetSentry Standard",
    baseStorageId: "sd_64_he",
    baseStoragePrice: 15,
    availableStorage: ["sd_64_he", "sd_128_he"],
    storagePricing: {
      sd_64_he: { delta: 0 },
      sd_128_he: { delta: 10 },
    },
    nvmeSupported: false,
  },
  // NetSentry Pro
  {
    sku: "NS-PRO-001",
    productName: "NetSentry Pro",
    baseStorageId: "nvme_128",
    baseStoragePrice: 25,
    availableStorage: ["sd_128_he", "nvme_128", "nvme_256"],
    storagePricing: {
      sd_128_he: { delta: 0 },
      nvme_128: { delta: 0 },
      nvme_256: { delta: 15 },
    },
    nvmeSupported: true,
  },
  // SkySnare
  {
    sku: "SS-001",
    productName: "SkySnare",
    baseStorageId: "none",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: false,
    notes: "Handheld, no storage",
  },
  // NetSnare - minimal storage
  {
    sku: "NSN-LITE-001",
    productName: "NetSnare Lite",
    baseStorageId: "none",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: false,
    notes: "Trigger only, no local storage",
  },
  {
    sku: "NSN-STD-001",
    productName: "NetSnare Standard",
    baseStorageId: "none",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: false,
    notes: "Trigger only, no local storage",
  },
  {
    sku: "NSN-PRO-001",
    productName: "NetSnare Pro",
    baseStorageId: "none",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: false,
    notes: "Trigger only, no local storage",
  },
  // AeroNet
  {
    sku: "AN-ENT-001",
    productName: "AeroNet Enterprise",
    baseStorageId: "enterprise",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: true,
    notes: "SAN/NAS per-site, compliance storage",
  },
  {
    sku: "AN-CMD-001",
    productName: "AeroNet Command",
    baseStorageId: "cloud",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: false,
    notes: "Cloud or on-premise database",
  },
  // RKV
  {
    sku: "RKV-M-001",
    productName: "RKV-M Mothership",
    baseStorageId: "fixed",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: true,
    notes: "Integrated mission storage",
  },
  {
    sku: "RKV-I-001",
    productName: "RKV-I Interceptor",
    baseStorageId: "fixed",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: false,
    notes: "Minimal flight recorder",
  },
  {
    sku: "RKV-G-001",
    productName: "RKV-G Ground Station",
    baseStorageId: "enterprise",
    baseStoragePrice: 0,
    availableStorage: [],
    storagePricing: {},
    nvmeSupported: true,
    notes: "Raid array, configured per-order",
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get compute config for a product by SKU */
export function getProductComputeConfig(sku: string): ProductComputeConfig | undefined {
  return productComputeConfigs.find((c) => c.sku === sku);
}

/** Get available compute tiers for a product */
export function getAvailableTiers(sku: string): ComputeTier[] {
  const config = getProductComputeConfig(sku);
  if (!config) return [];
  return config.availableTiers.map((tierId) => computeTiers[tierId]).filter(Boolean);
}

/** Calculate price delta for a tier upgrade */
export function getTierPriceDelta(sku: string, tierId: string): number {
  const config = getProductComputeConfig(sku);
  if (!config || !config.tierPricing[tierId]) return 0;
  return config.tierPricing[tierId].delta;
}

/** Get camera config for a product */
export function getProductCameraConfig(sku: string): ProductCameraConfig | undefined {
  return productCameraConfigs.find((c) => c.sku === sku);
}

/** Get available cameras for a product */
export function getAvailableCameras(sku: string): CameraTier[] {
  const config = getProductCameraConfig(sku);
  if (!config) return [];
  return config.availableCameras.map((camId) => cameraTiers[camId]).filter(Boolean);
}

/** Get connectivity config for a product */
export function getProductConnectivityConfig(sku: string): ProductConnectivityConfig | undefined {
  return productConnectivityConfigs.find((c) => c.sku === sku);
}

/** Get available connectivity options for a product */
export function getAvailableConnectivity(sku: string): ConnectivityTier[] {
  const config = getProductConnectivityConfig(sku);
  if (!config) return [];
  return config.availableConnectivity.map((connId) => connectivityTiers[connId]).filter(Boolean);
}

/** Get storage config for a product */
export function getProductStorageConfig(sku: string): ProductStorageConfig | undefined {
  return productStorageConfigs.find((c) => c.sku === sku);
}

/** Get available storage options for a product */
export function getAvailableStorage(sku: string): StorageTier[] {
  const config = getProductStorageConfig(sku);
  if (!config) return [];
  return config.availableStorage.map((storageId) => storageTiers[storageId]).filter(Boolean);
}

// =============================================================================
// UNIFIED PRE-ORDER CONFIGURATION
// =============================================================================

/** Generate full product configuration summary */
export function generateProductConfiguration(
  sku: string,
  computeTierId?: string,
  cameraTierId?: string,
  connectivityTierId?: string,
  storageTierId?: string
): ProductConfiguration | null {
  const product = productBySku[sku];
  if (!product) return null;

  let totalDelta = 0;
  const config: ProductConfiguration = {
    sku,
    productName: product.name,
    totalDelta: 0,
    baseBomCost: product.bomTotal,
    configuredBomCost: product.bomTotal,
  };

  // Compute tier
  if (computeTierId) {
    const computeConfig = getProductComputeConfig(sku);
    if (computeConfig?.tierPricing[computeTierId]) {
      const delta = computeConfig.tierPricing[computeTierId].delta;
      config.compute = { tier: computeTiers[computeTierId], delta };
      totalDelta += delta;
    }
  }

  // Camera tier
  if (cameraTierId) {
    const cameraConfig = getProductCameraConfig(sku);
    if (cameraConfig?.cameraPricing[cameraTierId]) {
      const delta = cameraConfig.cameraPricing[cameraTierId].delta;
      config.camera = { tier: cameraTiers[cameraTierId], delta };
      totalDelta += delta;
    }
  }

  // Connectivity tier
  if (connectivityTierId) {
    const connConfig = getProductConnectivityConfig(sku);
    if (connConfig?.connectivityPricing[connectivityTierId]) {
      const delta = connConfig.connectivityPricing[connectivityTierId].delta;
      config.connectivity = { tier: connectivityTiers[connectivityTierId], delta };
      totalDelta += delta;
    }
  }

  // Storage tier
  if (storageTierId) {
    const storageConfig = getProductStorageConfig(sku);
    if (storageConfig?.storagePricing[storageTierId]) {
      const delta = storageConfig.storagePricing[storageTierId].delta;
      config.storage = { tier: storageTiers[storageTierId], delta };
      totalDelta += delta;
    }
  }

  config.totalDelta = totalDelta;
  config.configuredBomCost = product.bomTotal + totalDelta;

  return config;
}
