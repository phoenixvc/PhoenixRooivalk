/**
 * Export product catalog to JSON and CSV.
 * Run from apps/docs: npx tsx scripts/export-products.ts
 * Writes: apps/docs/exports/products.json, products.csv
 *
 * Optional:
 * - Set EXPORT_SAMPLE_CONFIGURATION=1 to also write exports/sample-configuration.json
 */
import fs from "node:fs";
import path from "node:path";

import {
  allProducts,
  generateProductConfiguration,
} from "../src/data/products/index";

const outDir = path.resolve(process.cwd(), "exports");
fs.mkdirSync(outDir, { recursive: true });

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function flattenSpecs(specs: Record<string, unknown> | undefined): string {
  if (!specs) return "";
  return Object.entries(specs)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

// JSON
fs.writeFileSync(
  path.join(outDir, "products.json"),
  JSON.stringify(allProducts, null, 2),
  "utf-8",
);

// CSV (summary)
const headers = [
  "sku",
  "name",
  "line",
  "category",
  "targetMarket",
  "priceRange",
  "priceMin",
  "priceMax",
  "bomTotal",
  "confidence",
  "lastUpdated",
  "specs",
];
const rows = [
  headers.join(","),
  ...allProducts.map((p) =>
    [
      p.sku,
      p.name,
      p.line,
      p.category,
      p.targetMarket,
      p.priceRange,
      p.priceMin,
      p.priceMax,
      p.bomTotal,
      p.confidence,
      p.lastUpdated,
      flattenSpecs(p.specs as Record<string, unknown>),
    ]
      .map(csvEscape)
      .join(","),
  ),
];
fs.writeFileSync(path.join(outDir, "products.csv"), rows.join("\n"), "utf-8");

const shouldWriteSample = process.env.EXPORT_SAMPLE_CONFIGURATION === "1";
const sampleConfig = shouldWriteSample
  ? generateProductConfiguration("SW-STD-001", "pi4_coral")
  : null;
if (shouldWriteSample && sampleConfig) {
  fs.writeFileSync(
    path.join(outDir, "sample-configuration.json"),
    JSON.stringify(
      {
        sku: sampleConfig.sku,
        configuredBomCost: sampleConfig.configuredBomCost,
        configuredBomCostModel: sampleConfig.configuredBomCostModel,
        configuredBomLineCount: sampleConfig.configuredBom?.length ?? 0,
        configuredBom: sampleConfig.configuredBom,
      },
      null,
      2,
    ),
    "utf-8",
  );
}

console.log(
  `Wrote:\n  ${path.join(outDir, "products.json")}\n  ${path.join(outDir, "products.csv")}`,
);
if (shouldWriteSample && sampleConfig) {
  console.log(`  ${path.join(outDir, "sample-configuration.json")}`);
}
console.log(`Total products: ${allProducts.length}`);
