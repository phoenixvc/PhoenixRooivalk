/**
 * Phase-1 product set: six demo products (detection, mesh, turret, response relay).
 * Single source of truth for Phase-1 catalog scope.
 */

import type { Product } from "../products/types";
import { productBySku } from "../products/catalog";

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

/** Returns Phase-1 products in order; skips any SKU not in catalog. */
export function getPhase1Products(): Product[] {
  return PHASE1_SKUS.map((sku) => productBySku[sku]).filter(
    (p): p is Product => p != null,
  );
}
