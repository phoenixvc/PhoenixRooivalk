/**
 * BOM Engine (scaffold)
 *
 * Goal: Support structural BOM mutations in configurators (add/remove/replace)
 * while keeping the export surface stable for docs consumers.
 *
 * Phase-1 usage: `tiers.ts` uses this to compute a materialized configured BOM
 * and an auditable total (with optional reconcile line when legacy newBomTotal
 * targets exist).
 */

import type {
  BOMItem,
  ComputeTier,
  CameraTier,
  ComputeTierKey,
  CameraTierKey,
  ConnectivityTierKey,
  StorageTierKey,
  Product,
  ProductComputeConfig,
  ProductCameraConfig,
  ProductConnectivityConfig,
  ProductStorageConfig,
} from "./types";

export type BomLineKey = string;

export function bomLineKey(
  item: Pick<BOMItem, "item" | "specification">,
): BomLineKey {
  return `${item.item} :: ${item.specification}`.toLowerCase();
}

export type BomOp =
  | { type: "add"; line: BOMItem }
  | { type: "remove"; match: (line: BOMItem) => boolean }
  | {
      type: "replace";
      match: (line: BOMItem) => boolean;
      with: BOMItem | ((old: BOMItem) => BOMItem);
    };

export interface BomPatch {
  id: string;
  ops: BomOp[];
}

export interface BomBuildResult {
  bom: BOMItem[];
  bomTotal: number;
  /** True when an explicit reconcile line was added to hit a target total. */
  reconciled: boolean;
}

export function sumBom(bom: BOMItem[]): number {
  return bom.reduce(
    (sum, line) => sum + (Number.isFinite(line.totalCost) ? line.totalCost : 0),
    0,
  );
}

export function applyBomPatches(
  baseBom: BOMItem[],
  patches: BomPatch[],
): BOMItem[] {
  let bom = [...baseBom];

  for (const patch of patches) {
    for (const op of patch.ops) {
      if (op.type === "add") {
        bom = [...bom, op.line];
      } else if (op.type === "remove") {
        bom = bom.filter((l) => !op.match(l));
      } else if (op.type === "replace") {
        bom = bom.map((l) => {
          if (!op.match(l)) return l;
          return typeof op.with === "function" ? op.with(l) : op.with;
        });
      }
    }
  }

  return bom;
}

function makeDeltaLine(label: string, delta: number): BOMItem {
  const unitCost = delta;
  return {
    item: label,
    specification: "Configurator delta (auditable)",
    quantity: 1,
    unitCost,
    totalCost: unitCost,
    supplier: "Configurator",
  };
}

function reconcileToTarget(
  bom: BOMItem[],
  targetTotal: number,
): BomBuildResult {
  const current = sumBom(bom);
  const diff = Number(targetTotal) - current;
  if (!Number.isFinite(targetTotal) || Math.abs(diff) < 0.01) {
    return { bom, bomTotal: current, reconciled: false };
  }

  const reconcileLine: BOMItem = {
    item: "BOM reconciliation",
    specification: "Adjust to match configured target total",
    quantity: 1,
    unitCost: diff,
    totalCost: diff,
    supplier: "Configurator",
  };

  const next = [...bom, reconcileLine];
  return { bom: next, bomTotal: sumBom(next), reconciled: true };
}

function computeSelectedDelta<K extends string>(
  selectedId: K | undefined,
  pricing:
    | Partial<Record<K, { delta: number; newBomTotal?: number }>>
    | undefined,
): { delta: number; newBomTotal?: number } | null {
  if (!selectedId || !pricing) return null;
  const entry = pricing[selectedId];
  if (!entry) return null;
  return { delta: entry.delta ?? 0, newBomTotal: entry.newBomTotal };
}

function computeSelectedSimpleDelta<K extends string>(
  selectedId: K | undefined,
  pricing: Partial<Record<K, { delta: number }>> | undefined,
): { delta: number } | null {
  if (!selectedId || !pricing) return null;
  const entry = pricing[selectedId];
  if (!entry) return null;
  return { delta: entry.delta ?? 0 };
}

/**
 * Build a configured BOM from a base product + configurator selections.
 *
 * Current behavior:
 * - Compute & camera selections are treated as *structural* and may replace
 *   corresponding base BOM lines by heuristic matching.
 * - Connectivity & storage are applied as auditable delta lines (no structural
 *   mutation yet).
 * - If legacy `newBomTotal` exists for the selected compute tier, we reconcile
 *   to that total via a final adjustment line (explicit, auditable).
 */
export function buildConfiguredBom(args: {
  product: Product;
  computeConfig?: ProductComputeConfig;
  cameraConfig?: ProductCameraConfig;
  connectivityConfig?: ProductConnectivityConfig;
  storageConfig?: ProductStorageConfig;
  computeTier?: ComputeTier;
  computeTierId?: ComputeTierKey;
  cameraTier?: CameraTier;
  cameraTierId?: CameraTierKey;
  connectivityTierId?: ConnectivityTierKey;
  storageTierId?: StorageTierKey;
}): BomBuildResult {
  const {
    product,
    computeConfig,
    cameraConfig,
    connectivityConfig,
    storageConfig,
    computeTier,
    computeTierId,
    cameraTier,
    cameraTierId,
    connectivityTierId,
    storageTierId,
  } = args;

  const patches: BomPatch[] = [];

  // Compute structural swap (heuristic)
  if (computeTier && computeTierId && computeConfig) {
    const computePricing = computeSelectedDelta(
      computeTierId,
      computeConfig.tierPricing,
    );
    patches.push({
      id: `compute:${computeTierId}`,
      ops: [
        {
          type: "remove",
          match: (l) =>
            /raspberry pi|jetson|coral|hailo/i.test(l.item) &&
            // Avoid removing storage related to NVMe (compute swaps shouldn't touch evidence storage)
            !/nvme/i.test(l.item),
        },
        {
          type: "add",
          line: {
            item: "Compute module",
            specification: `${computeTier.platform} + ${computeTier.accelerator}`,
            quantity: 1,
            unitCost: computeTier.price,
            totalCost: computeTier.price,
            supplier: "Various",
          },
        },
        ...(computePricing
          ? [
              {
                type: "add" as const,
                line: makeDeltaLine("Compute tier delta", computePricing.delta),
              },
            ]
          : []),
      ],
    });
  }

  // Camera structural swap (heuristic)
  if (cameraTier && cameraTierId && cameraConfig) {
    const cameraPricing = computeSelectedSimpleDelta(
      cameraTierId,
      cameraConfig.cameraPricing,
    );
    patches.push({
      id: `camera:${cameraTierId}`,
      ops: [
        {
          type: "remove",
          match: (l) => /camera|lens|imx|flir|lepton|boson/i.test(l.item),
        },
        {
          type: "add",
          line: {
            item: "Camera module",
            specification: `${cameraTier.name} (${cameraTier.sensor})`,
            quantity: 1,
            unitCost: cameraTier.price,
            totalCost: cameraTier.price,
            supplier: "Various",
          },
        },
        ...(cameraPricing
          ? [
              {
                type: "add" as const,
                line: makeDeltaLine("Camera tier delta", cameraPricing.delta),
              },
            ]
          : []),
      ],
    });
  }

  // Connectivity delta (non-structural)
  if (connectivityTierId && connectivityConfig) {
    const entry = connectivityConfig.connectivityPricing?.[connectivityTierId];
    if (entry) {
      patches.push({
        id: `connectivity:${connectivityTierId}`,
        ops: [
          {
            type: "add",
            line: makeDeltaLine("Connectivity tier delta", entry.delta),
          },
        ],
      });
    }
  }

  // Storage delta (non-structural)
  if (storageTierId && storageConfig) {
    const entry = storageConfig.storagePricing?.[storageTierId];
    if (entry) {
      patches.push({
        id: `storage:${storageTierId}`,
        ops: [
          {
            type: "add",
            line: makeDeltaLine("Storage tier delta", entry.delta),
          },
        ],
      });
    }
  }

  const bom = applyBomPatches(product.bom, patches);
  const total = sumBom(bom);

  // Legacy: reconcile to compute newBomTotal when present for selected compute tier.
  const computePricing =
    computeConfig && computeTierId
      ? computeSelectedDelta(computeTierId, computeConfig.tierPricing)
      : null;
  if (computePricing?.newBomTotal != null) {
    return reconcileToTarget(bom, computePricing.newBomTotal);
  }

  return { bom, bomTotal: total, reconciled: false };
}
