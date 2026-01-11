/**
 * Product Catalog Module
 *
 * Centralized exports for all product-related data.
 * This file re-exports from the modular files for clean imports.
 *
 * Usage:
 * ```ts
 * import { skyWatchStandard, computeTiers, getProductBySku } from "@site/src/data/products";
 * ```
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  BOMItem,
  ProductSpecs,
  Product,
  ComputePlatform,
  AIAccelerator,
  FPSBenchmark,
  StorageOption,
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

// =============================================================================
// CATALOG EXPORTS - Products and Collections
// =============================================================================

// Individual products
export {
  // SkyWatch line
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
  // NetSentry line
  netSentryLite,
  netSentryStandard,
  netSentryPro,
  // SkySnare line
  skySnare,
  // NetSnare line
  netSnareLite,
  netSnareStandard,
  netSnarePro,
  // AeroNet line
  aeroNetEnterprise,
  aeroNetCommand,
  // RKV line
  rkvMothership,
  rkvInterceptor,
  rkvGroundStation,
} from "./catalog";

// Product collections
export {
  skyWatchProducts,
  netSentryProducts,
  skySnareProducts,
  netSnareProducts,
  aeroNetProducts,
  rkvProducts,
  allProducts,
  productBySku,
} from "./catalog";

// Catalog helper functions
export {
  getProductBySku,
  getTotalWithAccessories,
  formatProductPriceRange,
  getProductsByLine,
  getProductsByCategory,
  getProductsByPriceRange,
} from "./catalog";

// Catalog summary data
export {
  productCatalogSummary,
  meshSystemPricing,
  enterprisePricing,
} from "./catalog";

// =============================================================================
// PLATFORM EXPORTS - Compute, Accelerators, Benchmarks
// =============================================================================

export {
  // Compute platforms
  raspberryPiPlatforms,
  jetsonPlatforms,
  // AI accelerators
  aiAccelerators,
  // FPS benchmarks
  fpsBenchmarks,
  // Platform recommendations
  platformRecommendations,
} from "./platforms";

// =============================================================================
// STORAGE OPTIONS EXPORTS
// =============================================================================

export {
  localStorageOptions,
  networkStorageOptions,
  storageRecommendations,
} from "./storage-options";

// =============================================================================
// TIER CONFIGURATION EXPORTS
// =============================================================================

// Tier definitions
export {
  computeTiers,
  cameraTiers,
  connectivityTiers,
  storageTiers,
} from "./tiers";

// Product tier configurations
export {
  productComputeConfigs,
  productCameraConfigs,
  productConnectivityConfigs,
  productStorageConfigs,
} from "./tiers";

// Tier helper functions
export {
  getProductComputeConfig,
  getAvailableTiers,
  getTierPriceDelta,
  getProductCameraConfig,
  getAvailableCameras,
  getProductConnectivityConfig,
  getAvailableConnectivity,
  getProductStorageConfig,
  getAvailableStorage,
  generateProductConfiguration,
} from "./tiers";
