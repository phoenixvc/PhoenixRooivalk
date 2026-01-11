/**
 * Product Catalog & Bill of Materials Data
 *
 * This file re-exports from the modular products/ directory.
 * All product data has been split into smaller, focused modules:
 *
 * - products/types.ts      - Type definitions
 * - products/catalog.ts    - All product definitions and collections
 * - products/platforms.ts  - Compute platforms, accelerators, benchmarks
 * - products/storage-options.ts - Storage options and recommendations
 * - products/tiers.ts      - Tier configurations for product configurator
 * - products/index.ts      - Unified exports
 *
 * Usage:
 * ```ts
 * import { skyWatchStandard, computeTiers } from "@site/src/data/products";
 * ```
 */

// Re-export everything from the products module
export * from "./products/index";
