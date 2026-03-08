/**
 * Validate product catalog and configurator data.
 * Exits 0 if valid, 1 if invalid (and prints errors).
 * Run from apps/docs: npx tsx scripts/validate-catalog.ts
 * Used in CI to catch catalog/tier regressions.
 */
import { validateConfiguratorData } from "../src/data/products/index";

const result = validateConfiguratorData();
if (result.valid) {
  console.log("Catalog validation passed.");
  process.exit(0);
}
console.error("Catalog validation failed:");
result.errors.forEach((e) => console.error("  -", e));
process.exit(1);
