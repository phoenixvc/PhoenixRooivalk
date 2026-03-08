/**
 * Phase-1 product set: six demo products (detection, mesh, turret, response relay).
 * Single source of truth for Phase-1 catalog scope.
 */

import { productBySku } from "../products/catalog";
import type { Product } from "../products/types";

/** Phase-1 SKUs in display order: SkyWatch Nano, Standard, Mesh Node, NetSnare Lite, Turret, Response Relay. */
export const PHASE1_SKUS = [
  "SW-NANO-001",
  "SW-STD-001",
  "SW-MESH-001-N",
  "NSN-LITE-001",
  "NSN-LITE-001-TURRET",
  "RR-DEMO-001",
] as const;

export type Phase1Sku = (typeof PHASE1_SKUS)[number];

/** Returns Phase-1 products in order; throws if any SKU is missing from catalog. */
export function getPhase1Products(): Product[] {
  const missing = PHASE1_SKUS.filter((sku) => productBySku[sku] == null);
  if (missing.length > 0) {
    throw new Error(`Phase-1 SKUs missing from catalog: ${missing.join(", ")}`);
  }
  return PHASE1_SKUS.map((sku) => productBySku[sku]);
}
