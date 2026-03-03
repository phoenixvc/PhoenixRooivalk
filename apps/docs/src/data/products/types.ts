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

/** Compute platform specifications and pricing */
export interface ComputePlatform {
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
  name: string;
  price: number;
  tops: number;
  interface: string;
  power: string;
  compatibility: string[];
  notes?: string;
}

/** Detection FPS benchmark by platform + accelerator */
export interface FPSBenchmark {
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
// TIER ID TYPES
// =============================================================================

/** IDs for concrete compute tiers */
export type ComputeTierId =
  | "pi4_coral"
  | "pi5_hailo8l"
  | "pi5_hailo8"
  | "jetson_nano"
  | "jetson_nx"
  | "jetson_agx";

/** Sentinel/base IDs used when no selectable compute tier applies */
export type ComputeBaseTierId = "none" | "server";

/** IDs for concrete camera tiers */
export type CameraTierId =
  | "pi_v2"
  | "pi_v3"
  | "pi_v3_wide"
  | "pi_hq"
  | "pi_gs"
  | "lepton_3_5"
  | "boson_320";

/** Sentinel/base IDs used when no selectable camera tier applies */
export type CameraBaseId = "none" | "mixed" | "enterprise" | "fixed";

/** IDs for concrete connectivity tiers */
export type ConnectivityTierId =
  | "wifi"
  | "ethernet"
  | "poe"
  | "poe_plus"
  | "lte"
  | "lte_poe";

/** Sentinel/base IDs used when no selectable connectivity tier applies */
export type ConnectivityBaseId = "none" | "enterprise" | "cloud" | "mesh_radio";

/** IDs for concrete storage tiers */
export type StorageTierId =
  | "sd_32"
  | "sd_64_he"
  | "sd_128_he"
  | "nvme_128"
  | "nvme_256"
  | "nvme_512"
  | "nvme_1tb";

/** Sentinel/base IDs used when no selectable storage tier applies */
export type StorageBaseId = "none" | "enterprise" | "cloud" | "fixed";

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

/** Product compute configuration */
export interface ProductComputeConfig {
  sku: string;
  productName: string;
  baseTier: ComputeTierId | ComputeBaseTierId;
  baseComputeCost: number;
  availableTiers: ComputeTierId[];
  tierPricing: Partial<
    Record<ComputeTierId, { delta: number; newBomTotal?: number }>
  >;
  notes?: string;
}

/** Product camera configuration */
export interface ProductCameraConfig {
  sku: string;
  productName: string;
  baseCameraId: CameraTierId | CameraBaseId;
  baseCameraPrice: number;
  availableCameras: CameraTierId[];
  cameraPricing: Partial<Record<CameraTierId, { delta: number }>>;
  lensRequired?: boolean;
  notes?: string;
}

/** Product connectivity configuration */
export interface ProductConnectivityConfig {
  sku: string;
  productName: string;
  baseConnectivityId: ConnectivityTierId | ConnectivityBaseId;
  baseConnectivityPrice: number;
  availableConnectivity: ConnectivityTierId[];
  connectivityPricing: Partial<Record<ConnectivityTierId, { delta: number }>>;
  notes?: string;
}

/** Product storage configuration */
export interface ProductStorageConfig {
  sku: string;
  productName: string;
  baseStorageId: StorageTierId | StorageBaseId;
  baseStoragePrice: number;
  availableStorage: StorageTierId[];
  storagePricing: Partial<Record<StorageTierId, { delta: number }>>;
  nvmeSupported: boolean;
  notes?: string;
}

/** Full product configuration for pre-order */
export interface ProductConfiguration {
  sku: string;
  productName: string;
  compute?: { tier: ComputeTier; delta: number };
  camera?: { tier: CameraTier; delta: number };
  connectivity?: { tier: ConnectivityTier; delta: number };
  storage?: { tier: StorageTier; delta: number };
  totalDelta: number;
  baseBomCost: number;
  configuredBomCost: number;
}
