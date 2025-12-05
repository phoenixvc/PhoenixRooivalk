/**
 * Type definitions for centralized documentation data
 */

/** Confidence level for data points */
export type Confidence = "verified" | "estimated" | "projected" | "target";

/** Source information for data verification */
export interface DataSource {
  name: string;
  url?: string;
  date?: string;
}

/** A numeric value with metadata */
export interface DataPoint<T = number> {
  value: T;
  unit?: string;
  confidence: Confidence;
  source?: DataSource;
  notes?: string;
  lastUpdated?: string;
}

/** A range of values (min-max) */
export interface RangeValue {
  min: number;
  max: number;
  unit?: string;
  confidence: Confidence;
  source?: DataSource;
  notes?: string;
}

/** Currency amounts with conversion */
export interface CurrencyValue {
  usd: number;
  zar?: number;
  unit?: string;
  confidence: Confidence;
  source?: DataSource;
  notes?: string;
}

/** Date/timeline information */
export interface TimelinePoint {
  quarter?: string;
  month?: string;
  year: number;
  description: string;
  status: "completed" | "in_progress" | "planned" | "target";
}

/** Comparison data for competitive analysis */
export interface CompetitorMetric<T = string> {
  phoenixRooivalk: T;
  competitors: Record<string, T>;
}

/** Format helpers */
export function formatRange(range: RangeValue): string {
  if (range.min === range.max) {
    return `${range.min}${range.unit || ""}`;
  }
  return `${range.min}-${range.max}${range.unit || ""}`;
}

export function formatCurrency(
  value: CurrencyValue,
  currency: "usd" | "zar" = "usd",
): string {
  const amount = currency === "zar" && value.zar ? value.zar : value.usd;
  const symbol = currency === "zar" ? "R" : "$";
  if (amount >= 1_000_000_000) {
    return `${symbol}${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${symbol}${(amount / 1_000).toFixed(0)}K`;
  }
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatDataPoint<T>(point: DataPoint<T>): string {
  return `${point.value}${point.unit || ""}`;
}
