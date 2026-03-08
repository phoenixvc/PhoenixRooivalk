/**
 * Tests for export-products script
 *
 * Prerequisites: Run `npx tsx scripts/export-products.ts` before running tests
 * to generate the export files, or use the beforeAll hook which does this automatically.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const exportsDir = path.resolve(__dirname, "../exports");
const jsonPath = path.join(exportsDir, "products.json");
const csvPath = path.join(exportsDir, "products.csv");

// Shared data cache to avoid repeated file reads
let productsData: Array<Record<string, unknown>> | null = null;

function getProductsData(): Array<Record<string, unknown>> {
  if (!productsData) {
    const content = fs.readFileSync(jsonPath, "utf-8");
    productsData = JSON.parse(content);
  }
  return productsData!;
}

describe("export-products", () => {
  beforeAll(() => {
    // Generate export files before running tests
    execSync("npx tsx scripts/export-products.ts", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "pipe",
    });
  });

  describe("JSON export", () => {
    it("should create products.json file", () => {
      expect(fs.existsSync(jsonPath)).toBe(true);
    });

    it("should contain valid JSON array", () => {
      const data = getProductsData();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it("should have required fields on each product", () => {
      const data = getProductsData();
      const requiredFields = ["sku", "name", "line", "category"];

      for (const product of data) {
        for (const field of requiredFields) {
          expect(product).toHaveProperty(field);
          expect(product[field]).toBeTruthy();
        }
      }
    });

    it("should have valid SKU format", () => {
      const data = getProductsData();
      const skuPattern = /^[A-Z]{2,4}-[A-Z0-9-]+$/;

      for (const product of data) {
        expect(product.sku).toMatch(skuPattern);
      }
    });
  });

  describe("CSV export", () => {
    it("should create products.csv file", () => {
      expect(fs.existsSync(csvPath)).toBe(true);
    });

    it("should have header row", () => {
      const content = fs.readFileSync(csvPath, "utf-8");
      const lines = content.split("\n");
      expect(lines[0]).toContain("sku");
      expect(lines[0]).toContain("name");
      expect(lines[0]).toContain("category");
    });

    it("should have data rows matching JSON count", () => {
      const jsonData = getProductsData();
      const csvContent = fs.readFileSync(csvPath, "utf-8");
      const csvLines = csvContent.split("\n").filter((line) => line.trim());

      // CSV has header + data rows
      expect(csvLines.length).toBe(jsonData.length + 1);
    });
  });

  describe("data integrity", () => {
    it("should have unique SKUs", () => {
      const data = getProductsData();
      const skus = data.map((p) => p.sku);
      const uniqueSkus = new Set(skus);
      expect(uniqueSkus.size).toBe(skus.length);
    });

    it("should have valid price ranges", () => {
      const data = getProductsData();

      for (const product of data) {
        if (product.priceMin !== undefined && product.priceMax !== undefined) {
          expect(product.priceMin).toBeLessThanOrEqual(product.priceMax as number);
        }
      }
    });

    it("should have valid product lines", () => {
      const data = getProductsData();
      const validLines = ["SkyWatch", "NetSentry", "SkySnare", "NetSnare", "AeroNet", "RKV"];

      for (const product of data) {
        expect(validLines).toContain(product.line);
      }
    });

    it("should have valid categories", () => {
      const data = getProductsData();
      const validCategories = ["detection", "countermeasure"];

      for (const product of data) {
        expect(validCategories).toContain(product.category);
      }
    });
  });
});
