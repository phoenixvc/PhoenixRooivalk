/**
 * BOM engine unit tests: sumBom, applyBomPatches, bomLineKey, buildConfiguredBom.
 */

import {
  sumBom,
  applyBomPatches,
  bomLineKey,
  buildConfiguredBom,
  type BomPatch,
} from "../bom-engine";
import type { BOMItem } from "../types";
import { productBySku } from "../catalog";
import {
  getProductComputeConfig,
  getProductCameraConfig,
  getProductConnectivityConfig,
  getProductStorageConfig,
  computeTiers,
  cameraTiers,
} from "../tiers";

const sampleBomLine = (
  item: string,
  totalCost: number,
  spec = "Spec",
): BOMItem => ({
  item,
  specification: spec,
  quantity: 1,
  unitCost: totalCost,
  totalCost,
  supplier: "Test",
});

describe("bom-engine", () => {
  describe("sumBom", () => {
    it("returns 0 for empty BOM", () => {
      expect(sumBom([])).toBe(0);
    });

    it("sums totalCost of all lines", () => {
      const bom: BOMItem[] = [
        sampleBomLine("A", 10),
        sampleBomLine("B", 5),
        sampleBomLine("C", 100),
      ];
      expect(sumBom(bom)).toBe(115);
    });

    it("ignores non-finite totalCost", () => {
      const bom: BOMItem[] = [
        sampleBomLine("A", 10),
        { ...sampleBomLine("B", 0), totalCost: NaN },
        sampleBomLine("C", 20),
      ];
      expect(sumBom(bom)).toBe(30);
    });
  });

  describe("bomLineKey", () => {
    it("returns lowercase item :: specification", () => {
      expect(bomLineKey({ item: "Raspberry Pi", specification: "4B" })).toBe(
        "raspberry pi :: 4b",
      );
    });
  });

  describe("applyBomPatches", () => {
    const base: BOMItem[] = [
      sampleBomLine("Line1", 10),
      sampleBomLine("Line2", 20),
      sampleBomLine("Line3", 30),
    ];

    it("adds a line with add op", () => {
      const patches: BomPatch[] = [
        {
          id: "add",
          ops: [{ type: "add", line: sampleBomLine("New", 50) }],
        },
      ];
      const result = applyBomPatches(base, patches);
      expect(result).toHaveLength(4);
      expect(result[3].item).toBe("New");
      expect(sumBom(result)).toBe(110);
    });

    it("removes matching lines with remove op", () => {
      const patches: BomPatch[] = [
        {
          id: "rem",
          ops: [{ type: "remove", match: (l) => l.item === "Line2" }],
        },
      ];
      const result = applyBomPatches(base, patches);
      expect(result).toHaveLength(2);
      expect(result.map((l) => l.item)).toEqual(["Line1", "Line3"]);
      expect(sumBom(result)).toBe(40);
    });

    it("replaces matching line with replace op", () => {
      const patches: BomPatch[] = [
        {
          id: "repl",
          ops: [
            {
              type: "replace",
              match: (l) => l.item === "Line2",
              with: sampleBomLine("Line2-Replaced", 99),
            },
          ],
        },
      ];
      const result = applyBomPatches(base, patches);
      expect(result[1].item).toBe("Line2-Replaced");
      expect(result[1].totalCost).toBe(99);
      expect(sumBom(result)).toBe(139);
    });
  });

  describe("buildConfiguredBom", () => {
    const sku = "SW-STD-001";
    const product = productBySku[sku];
    if (!product) {
      it.skip("SW-STD-001 not in catalog", () => {});
      return;
    }

    it("returns base BOM total when no tier selections", () => {
      const result = buildConfiguredBom({ product });
      expect(result.bom).toEqual(product.bom);
      expect(result.bomTotal).toBe(sumBom(product.bom));
      expect(result.reconciled).toBe(false);
    });

    it("applies compute tier and bomTotal matches newBomTotal when set", () => {
      const computeConfig = getProductComputeConfig(sku);
      const computeTierId = "pi4_coral" as const;
      const computeTier = computeTiers[computeTierId];
      if (!computeConfig || !computeTier) {
        expect(computeConfig).toBeDefined();
        expect(computeTier).toBeDefined();
        return;
      }

      const result = buildConfiguredBom({
        product,
        computeConfig,
        computeTier,
        computeTierId,
      });

      expect(result.bom.length).toBeGreaterThan(0);
      expect(Number.isFinite(result.bomTotal)).toBe(true);
      const pricing = computeConfig.tierPricing[computeTierId];
      if (pricing?.newBomTotal != null) {
        expect(result.bomTotal).toBe(pricing.newBomTotal);
        if (result.reconciled) {
          const reconcileLine = result.bom.find(
            (l) =>
              /reconcil/i.test(l.item) ||
              /adjust to match/i.test(l.specification),
          );
          expect(reconcileLine).toBeDefined();
        }
      }
    });

    it("returns bomTotal equal to sum of bom lines", () => {
      const computeConfig = getProductComputeConfig(sku);
      const computeTierId = "pi5_hailo8l" as const;
      const computeTier = computeTiers[computeTierId];
      const cameraConfig = getProductCameraConfig(sku);
      const cameraTierId = "pi_hq" as const;
      const cameraTier = cameraTiers[cameraTierId];

      const result = buildConfiguredBom({
        product,
        computeConfig: computeConfig ?? undefined,
        cameraConfig: cameraConfig ?? undefined,
        computeTier: computeTier ?? undefined,
        computeTierId,
        cameraTier: cameraTier ?? undefined,
        cameraTierId,
      });

      expect(sumBom(result.bom)).toBeCloseTo(result.bomTotal, 2);
    });

    it("applies connectivity and storage deltas as additive lines", () => {
      const connConfig = getProductConnectivityConfig(sku);
      const storageConfig = getProductStorageConfig(sku);
      const connTierId = "wifi" as const;
      const storageTierId = "sd_32" as const;

      const result = buildConfiguredBom({
        product,
        connectivityConfig: connConfig ?? undefined,
        storageConfig: storageConfig ?? undefined,
        connectivityTierId: connTierId,
        storageTierId: storageTierId,
      });

      expect(result.bom.length).toBeGreaterThan(product.bom.length);
      expect(sumBom(result.bom)).toBeCloseTo(result.bomTotal, 2);
    });
  });
});
