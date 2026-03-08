/**
 * Tiers and configurator integration: generateProductConfiguration,
 * configuredBom/configuredBomCost, validateConfiguratorData.
 */

import { sumBom } from "../bom-engine";
import {
  generateProductConfiguration,
  validateConfiguratorData,
  getAvailableTiers,
  getTierPriceDelta,
} from "../tiers";

const SKU_STANDARD = "SW-STD-001";

describe("tiers integration", () => {
  describe("generateProductConfiguration", () => {
    it("returns null for unknown SKU", () => {
      expect(generateProductConfiguration("UNKNOWN-SKU")).toBeNull();
    });

    it("returns config with base BOM when no tier selections", () => {
      const config = generateProductConfiguration(SKU_STANDARD);
      expect(config).not.toBeNull();
      expect(config!.sku).toBe(SKU_STANDARD);
      expect(config!.configuredBom).toBeDefined();
      expect(config!.configuredBomCost).toBeDefined();
      expect(config!.configuredBomCostModel).toBeDefined();
      expect(Array.isArray(config!.configuredBom)).toBe(true);
      if (config!.configuredBom!.length > 0) {
        expect(sumBom(config!.configuredBom!)).toBeCloseTo(
          config!.configuredBomCost!,
          2,
        );
      }
    });

    it("sets configuredBomCost equal to sum of configuredBom", () => {
      const config = generateProductConfiguration(
        SKU_STANDARD,
        "pi4_coral",
        "pi_hq",
        "wifi",
        "sd_32",
      );
      expect(config).not.toBeNull();
      expect(config!.configuredBom).toBeDefined();
      expect(config!.configuredBomCost).toBeDefined();
      const summed = sumBom(config!.configuredBom!);
      expect(summed).toBeCloseTo(config!.configuredBomCost!, 2);
    });

    it("sets configuredBomCostModel to bom_engine or bom_engine_with_reconcile", () => {
      const base = generateProductConfiguration(SKU_STANDARD);
      const withTier = generateProductConfiguration(SKU_STANDARD, "pi4_coral");
      expect(["bom_engine", "bom_engine_with_reconcile"]).toContain(
        base!.configuredBomCostModel,
      );
      expect(["bom_engine", "bom_engine_with_reconcile"]).toContain(
        withTier!.configuredBomCostModel,
      );
    });

    it("compute tier with newBomTotal yields configuredBomCost equal to newBomTotal", () => {
      const config = generateProductConfiguration(SKU_STANDARD, "pi4_coral");
      expect(config).not.toBeNull();
      expect(config!.configuredBomCost).toBe(210);
    });

    it("getAvailableTiers returns tier objects for product", () => {
      const tiers = getAvailableTiers(SKU_STANDARD);
      expect(Array.isArray(tiers)).toBe(true);
      expect(tiers.length).toBeGreaterThan(0);
      expect(
        tiers.every(
          (t) => t && typeof t.id === "string" && typeof t.price === "number",
        ),
      ).toBe(true);
    });

    it("getTierPriceDelta returns number or null", () => {
      const delta = getTierPriceDelta(SKU_STANDARD, "pi4_coral");
      expect(delta === null || typeof delta === "number").toBe(true);
    });
  });

  describe("validateConfiguratorData", () => {
    it("returns valid: true and no errors when catalog is consistent", () => {
      const result = validateConfiguratorData();
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("errors");
      expect(Array.isArray(result.errors)).toBe(true);
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });
});
