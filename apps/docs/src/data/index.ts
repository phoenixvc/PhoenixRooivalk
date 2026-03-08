/**
 * Centralized Data Store for Phoenix Rooivalk Documentation
 *
 * All key figures, metrics, and data points used across documentation.
 * Edit values here to update them across all docs that import this data.
 *
 * Usage in MDX (simple values):
 * ```mdx
 * import { MARKET, PERFORMANCE, PRICING } from "@site/src/data/values";
 *
 * Market size: {MARKET.CURRENT}
 * Response time: {PERFORMANCE.RESPONSE_TIME}
 * ```
 *
 * Usage in TypeScript (full data with metadata):
 * ```ts
 * import { market, performance } from "@site/src/data";
 *
 * console.log(market.current.size.confidence);
 * ```
 */

// Full data exports with metadata
export * from "./market";
export * from "./performance";
export * from "./pricing";
export * from "./hardware";
export * from "./blockchain";
export * from "./team";
export * from "./roadmap";
export * from "./competitors";
export * from "./products";

// Simple value exports for MDX
export * from "./values";

// Validation utilities
export * from "./validation";

// Re-export types
export type * from "./types";
