/**
 * Tests for export-products script
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";

const exportsDir = path.resolve(__dirname, "../exports");
const jsonPath = path.join(exportsDir, "products.json");
const csvPath = path.join(exportsDir, "products.csv");

describe("export-products", () => {
  describe("JSON export", () => {
    it("should create products.json file", () => {
      expect(fs.existsSync(jsonPath)).toBe(true);
    });

    it("should contain valid JSON array", () => {
      const content = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(content);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it("should have required fields on each product", () => {
      const content = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(content);
      const requiredFields = ["sku", "name", "line", "category"];

      for (const product of data) {
        for (const field of requiredFields) {
          expect(product).toHaveProperty(field);
          expect(product[field]).toBeTruthy();
        }
      }
    });

    it("should have valid SKU format", () => {
      const content = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(content);
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
      const jsonContent = fs.readFileSync(jsonPath, "utf-8");
      const jsonData = JSON.parse(jsonContent);

      const csvContent = fs.readFileSync(csvPath, "utf-8");
      const csvLines = csvContent.split("\n").filter((line) => line.trim());

      // CSV has header + data rows
      expect(csvLines.length).toBe(jsonData.length + 1);
    });
  });

  describe("data integrity", () => {
    it("should have unique SKUs", () => {
      const content = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(content);
      const skus = data.map((p: { sku: string }) => p.sku);
      const uniqueSkus = new Set(skus);
      expect(uniqueSkus.size).toBe(skus.length);
    });

    it("should have valid price ranges", () => {
      const content = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(content);

      for (const product of data) {
        if (product.priceMin !== undefined && product.priceMax !== undefined) {
          expect(product.priceMin).toBeLessThanOrEqual(product.priceMax);
        }
      }
    });
  });
});
