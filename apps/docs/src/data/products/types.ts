/**
 * Type definitions for the Product Catalog
 */

import type { Confidence } from "../types";

// =============================================================================
// CORE PRODUCT TYPES
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
  line: "SkyWatch" | "NetSentry" | "SkySnare" | "NetSnare" | "AeroNet" | "RKV";
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
// COMPUTE PLATFORM TYPES
// =============================================================================

/** Stable ID for a compute platform (used in benchmarks and recommendations) */
export type PlatformId = string;

/** Stable ID for an AI accelerator (used in benchmarks and recommendations) */
export type AcceleratorId = string;

/** Compute platform specifications and pricing */
export interface ComputePlatform {
  id: PlatformId;
  name: string;
  variant?: string;
  price: number;
  ram: string;
  cpu: string;
  power: string;
  formFactor: string;
  notes?: string;
}

/** AI accelerator specifications */
export interface AIAccelerator {
  id: AcceleratorId;
  name: string;
  price: number;
  tops: number;
  interface: string;
  power: string;
  compatibility: string[];
  notes?: string;
}

/** Detection FPS benchmark by platform + accelerator (by stable ID) */
export interface FPSBenchmark {
  platformId: PlatformId;
  acceleratorId: AcceleratorId;
  platform: string;
  accelerator: string;
  modelSize: "nano" | "small" | "medium" | "large";
  resolution: string;
  fps: number;
  latency: string;
  notes?: string;
}

// =============================================================================
// STORAGE TYPES
// =============================================================================

/** Storage configuration for video recording and evidence */
export interface StorageOption {
  type: string;
  capacity: string;
  interface: string;
  speed: string;
  price: string;
  useCase: string;
  notes?: string;
}

// =============================================================================
// TIER ID UNIONS (single source of truth for configurator keys)
// =============================================================================

/** Compute tier IDs: sentinels (none, server) + tier keys from computeTiers */
export type ComputeTierId =
  | "none"
  | "server"
  | "pi4_coral"
  | "pi5_hailo8l"
  | "pi5_hailo8"
  | "jetson_nano"
  | "jetson_nx"
  | "jetson_agx";

/** Camera tier IDs: sentinels (none, mixed, enterprise, fixed) + keys from cameraTiers */
export type CameraTierId =
  | "none"
  | "mixed"
  | "enterprise"
  | "fixed"
  | "pi_v2"
  | "pi_v3"
  | "pi_v3_wide"
  | "pi_hq"
  | "pi_gs"
  | "lepton_3_5"
  | "boson_320";

/** Connectivity tier IDs: sentinels + keys from connectivityTiers */
export type ConnectivityTierId =
  | "none"
  | "wifi"
  | "ethernet"
  | "poe"
  | "poe_plus"
  | "lte"
  | "lte_poe"
  | "enterprise"
  | "cloud"
  | "mesh_radio";

/** Storage tier IDs: sentinels + keys from storageTiers */
export type StorageTierId =
  | "none"
  | "sd_32"
  | "sd_64_he"
  | "sd_128_he"
  | "nvme_128"
  | "nvme_256"
  | "nvme_512"
  | "nvme_1tb"
  | "fixed"
  | "enterprise"
  | "cloud";

// =============================================================================
// TIER CONFIGURATION TYPES
// =============================================================================

/** Compute tier definition */
export interface ComputeTier {
  id: ComputeTierId;
  name: string;
  platform: string;
  accelerator: string;
  price: number;
  fps: string;
  power: string;
  notes?: string;
}

/** Camera tier definition */
export interface CameraTier {
  id: CameraTierId;
  name: string;
  resolution: string;
  sensor: string;
  price: number;
  features: string[];
  notes?: string;
}

/** Connectivity tier definition */
export interface ConnectivityTier {
  id: ConnectivityTierId;
  name: string;
  type: string;
  speed: string;
  price: number;
  power?: string;
  notes?: string;
}

/** Storage tier definition */
export interface StorageTier {
  id: StorageTierId;
  name: string;
  type: string;
  capacity: string;
  speed: string;
  price: number;
  endurance?: string;
  notes?: string;
}

/** Tier pricing delta for compute (optional newBomTotal). */
export interface TierPriceDelta {
  delta: number;
  newBomTotal?: number;
}

/** Product compute configuration. Callers derive display name via productBySku[sku].name. */
export interface ProductComputeConfig {
  sku: string;
  baseTier: ComputeTierId;
  baseComputeCost: number;
  availableTiers: ComputeTierId[];
  tierPricing: Partial<Record<ComputeTierId, TierPriceDelta>>;
  notes?: string;
}

/** Product camera configuration. Callers derive display name via productBySku[sku].name. */
export interface ProductCameraConfig {
  sku: string;
  baseCameraId: CameraTierId;
  baseCameraPrice: number;
  availableCameras: CameraTierId[];
  cameraPricing: Partial<Record<CameraTierId, { delta: number }>>;
  lensRequired?: boolean;
  notes?: string;
}

/** Product connectivity configuration. Callers derive display name via productBySku[sku].name. */
export interface ProductConnectivityConfig {
  sku: string;
  baseConnectivityId: ConnectivityTierId;
  baseConnectivityPrice: number;
  availableConnectivity: ConnectivityTierId[];
  connectivityPricing: Partial<Record<ConnectivityTierId, { delta: number }>>;
  notes?: string;
}

/** Product storage configuration. Callers derive display name via productBySku[sku].name. */
export interface ProductStorageConfig {
  sku: string;
  baseStorageId: StorageTierId;
  baseStoragePrice: number;
  availableStorage: StorageTierId[];
  storagePricing: Partial<Record<StorageTierId, { delta: number }>>;
  nvmeSupported: boolean;
  notes?: string;
}

/** Full product configuration for pre-order. Callers derive display name via productBySku[sku].name. */
export interface ProductConfiguration {
  sku: string;
  compute?: { tier: ComputeTier; delta: number };
  camera?: { tier: CameraTier; delta: number };
  connectivity?: { tier: ConnectivityTier; delta: number };
  storage?: { tier: StorageTier; delta: number };
  totalDelta: number;
  baseBomCost: number;
  configuredBomCost: number;
}
