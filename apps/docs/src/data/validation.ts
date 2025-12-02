/**
 * Data Validation & Comparison Utilities
 *
 * Helps identify discrepancies and validate data consistency.
 * Run these checks when updating data to ensure consistency.
 */

import { market, marketEvents, tam } from "./market";
import { performance, autonomyLevel, environmentalSpecs } from "./performance";
import { hardwarePricing, financialProjections, fundingRounds } from "./pricing";
import { jetsonOrin, sensorSuite, netLauncher } from "./hardware";
import { solana, x402Protocol, blockchainStrategy } from "./blockchain";
import { founders, companyStructure, contact } from "./team";
import { currentStatus, milestones, quarterlyRoadmap } from "./roadmap";
import { competitors, phoenixAdvantages, comparisonTable } from "./competitors";

/** Validation result */
export interface ValidationResult {
  category: string;
  field: string;
  status: "ok" | "warning" | "error";
  message: string;
  currentValue?: unknown;
  expectedValue?: unknown;
}

/** Run all validation checks */
export function validateAllData(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Market data validation
  results.push(...validateMarketData());

  // Performance validation
  results.push(...validatePerformanceData());

  // Pricing validation
  results.push(...validatePricingData());

  // Blockchain validation
  results.push(...validateBlockchainData());

  // Cross-reference validation
  results.push(...validateCrossReferences());

  return results;
}

/** Validate market data consistency */
function validateMarketData(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check market size progression
  if (market.current.size.min >= market.projected.size.min) {
    results.push({
      category: "Market",
      field: "size progression",
      status: "error",
      message: "Projected market should be larger than current",
      currentValue: market.projected.size.min,
      expectedValue: `> ${market.current.size.min}`,
    });
  } else {
    results.push({
      category: "Market",
      field: "size progression",
      status: "ok",
      message: "Market size projection is valid",
    });
  }

  // Check CAGR reasonableness (5-50% is typical for growth markets)
  if (market.cagr.min < 5 || market.cagr.max > 50) {
    results.push({
      category: "Market",
      field: "CAGR",
      status: "warning",
      message: "CAGR outside typical range (5-50%)",
      currentValue: `${market.cagr.min}-${market.cagr.max}%`,
    });
  } else {
    results.push({
      category: "Market",
      field: "CAGR",
      status: "ok",
      message: "CAGR is within reasonable range",
    });
  }

  // Validate TAM > SAM > SOM
  if (tam.serviceable.value >= tam.total.value) {
    results.push({
      category: "Market",
      field: "TAM/SAM hierarchy",
      status: "error",
      message: "SAM should be less than TAM",
    });
  }

  return results;
}

/** Validate performance data consistency */
function validatePerformanceData(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Response time should be less than 1 second for competitive advantage
  if (performance.responseTime.range.max > 1000) {
    results.push({
      category: "Performance",
      field: "responseTime",
      status: "warning",
      message: "Response time above 1 second reduces competitive advantage",
      currentValue: performance.responseTime.range.max,
    });
  } else {
    results.push({
      category: "Performance",
      field: "responseTime",
      status: "ok",
      message: "Response time is competitive",
    });
  }

  // Detection accuracy should be above 95%
  if (performance.accuracy.detection.value < 95) {
    results.push({
      category: "Performance",
      field: "detectionAccuracy",
      status: "warning",
      message: "Detection accuracy below 95% may be concerning",
      currentValue: performance.accuracy.detection.value,
    });
  } else {
    results.push({
      category: "Performance",
      field: "detectionAccuracy",
      status: "ok",
      message: "Detection accuracy is excellent",
    });
  }

  // Detection range validation
  if (performance.detectionRange.standard.max < 1) {
    results.push({
      category: "Performance",
      field: "detectionRange",
      status: "warning",
      message: "Standard detection range below 1km may limit use cases",
      currentValue: performance.detectionRange.standard.max,
    });
  }

  return results;
}

/** Validate pricing data consistency */
function validatePricingData(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check that margins are positive and reasonable
  if (
    financialProjections.margins.gross.value < 0 ||
    financialProjections.margins.gross.value > 90
  ) {
    results.push({
      category: "Pricing",
      field: "grossMargin",
      status: "warning",
      message: "Gross margin outside typical range (0-90%)",
      currentValue: financialProjections.margins.gross.value,
    });
  }

  // Check that in-house cost is less than outsourced
  if (hardwarePricing.cogs.inHouse.usd >= hardwarePricing.cogs.outsourced.usd) {
    results.push({
      category: "Pricing",
      field: "cogsSavings",
      status: "error",
      message: "In-house cost should be less than outsourced",
      currentValue: hardwarePricing.cogs.inHouse.usd,
      expectedValue: `< ${hardwarePricing.cogs.outsourced.usd}`,
    });
  } else {
    results.push({
      category: "Pricing",
      field: "cogsSavings",
      status: "ok",
      message: "In-house manufacturing provides cost savings",
    });
  }

  // Funding round progression
  if (fundingRounds.seed.target.max >= fundingRounds.seriesA.target.value) {
    results.push({
      category: "Pricing",
      field: "fundingProgression",
      status: "warning",
      message: "Series A should be larger than Seed",
    });
  }

  return results;
}

/** Validate blockchain data consistency */
function validateBlockchainData(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check Solana TPS is reasonable (actual is 65K+)
  if (solana.performance.tps.min < 10000) {
    results.push({
      category: "Blockchain",
      field: "solanaTPS",
      status: "warning",
      message: "Solana TPS seems low, verify current network capacity",
      currentValue: solana.performance.tps.min,
    });
  } else {
    results.push({
      category: "Blockchain",
      field: "solanaTPS",
      status: "ok",
      message: "Solana TPS specification is accurate",
    });
  }

  // x402 should be live
  if (x402Protocol.status !== "Production (Live)") {
    results.push({
      category: "Blockchain",
      field: "x402Status",
      status: "warning",
      message: "x402 status should reflect current state",
      currentValue: x402Protocol.status,
    });
  }

  return results;
}

/** Cross-reference validation between categories */
function validateCrossReferences(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check that competitive claims match actual performance
  const phoenixResponseTime = performance.responseTime.range.max;
  const claimedAdvantage = 10; // Claim is 10-150x faster

  // Competitors are typically 5000-30000ms
  const competitorMin = 5000;
  const actualMultiplier = competitorMin / phoenixResponseTime;

  if (actualMultiplier < claimedAdvantage) {
    results.push({
      category: "CrossReference",
      field: "speedAdvantage",
      status: "warning",
      message: `Claimed ${claimedAdvantage}x advantage, actual is ${actualMultiplier.toFixed(1)}x`,
      currentValue: actualMultiplier.toFixed(1),
      expectedValue: claimedAdvantage,
    });
  } else {
    results.push({
      category: "CrossReference",
      field: "speedAdvantage",
      status: "ok",
      message: `Speed advantage claim is valid (${actualMultiplier.toFixed(1)}x)`,
    });
  }

  // Revenue projections should align with system sales
  const year1Systems = financialProjections.revenue.year1.systems;
  const year1Revenue = financialProjections.revenue.year1.amount;
  const avgSystemPrice = year1Revenue / year1Systems;

  // Check if implied price is in our pricing range (in ZAR)
  const minPriceZar = hardwarePricing.baseSystem.general.min * 18; // Convert USD to ZAR
  const maxPriceZar = hardwarePricing.baseSystem.general.max * 18;

  if (avgSystemPrice < minPriceZar * 0.5 || avgSystemPrice > maxPriceZar * 2) {
    results.push({
      category: "CrossReference",
      field: "revenuePerSystem",
      status: "warning",
      message: `Implied revenue per system (R${avgSystemPrice.toLocaleString()}) may not align with pricing (R${minPriceZar.toLocaleString()}-R${maxPriceZar.toLocaleString()})`,
    });
  }

  return results;
}

/** Generate a summary report */
export function generateValidationReport(): string {
  const results = validateAllData();

  const errors = results.filter((r) => r.status === "error");
  const warnings = results.filter((r) => r.status === "warning");
  const ok = results.filter((r) => r.status === "ok");

  let report = "# Data Validation Report\n\n";
  report += `- ✅ Passed: ${ok.length}\n`;
  report += `- ⚠️ Warnings: ${warnings.length}\n`;
  report += `- ❌ Errors: ${errors.length}\n\n`;

  if (errors.length > 0) {
    report += "## Errors\n\n";
    errors.forEach((e) => {
      report += `- **${e.category}/${e.field}**: ${e.message}\n`;
      if (e.currentValue) report += `  - Current: ${e.currentValue}\n`;
      if (e.expectedValue) report += `  - Expected: ${e.expectedValue}\n`;
    });
    report += "\n";
  }

  if (warnings.length > 0) {
    report += "## Warnings\n\n";
    warnings.forEach((w) => {
      report += `- **${w.category}/${w.field}**: ${w.message}\n`;
      if (w.currentValue) report += `  - Current: ${w.currentValue}\n`;
    });
  }

  return report;
}

/** Quick summary of all key figures for comparison */
export function getKeyFiguresSummary(): Record<string, unknown> {
  return {
    market: {
      current: market.current.formatted,
      projected: market.projected.formatted,
      cagr: `${market.cagr.min}-${market.cagr.max}%`,
    },
    performance: {
      responseTime: performance.responseTime.formatted,
      accuracy: `${performance.accuracy.detection.value}%`,
      detectionRange: performance.detectionRange.formatted,
    },
    pricing: {
      hardware: hardwarePricing.baseSystem.formatted,
      seedRound: fundingRounds.seed.formatted,
      seriesA: fundingRounds.seriesA.formatted,
    },
    blockchain: {
      chain: blockchainStrategy.primary.chain,
      tps: solana.performance.formatted,
      costPerTx: solana.costs.formatted,
    },
    company: {
      structure: companyStructure.primary.type,
      status: companyStructure.primary.status,
    },
  };
}
