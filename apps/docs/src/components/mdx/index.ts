/**
 * MDX Components Index
 *
 * Export all MDX components for easy importing in documentation.
 * Usage in MDX files:
 *   import { MarketSize2030, TPS, FiguresCard } from '@site/src/components/mdx';
 */

export { default as MarketStats } from "./MarketStats";
export { default as PitchDeck } from "./PitchDeck";
export { default as TechnicalHighlight } from "./TechnicalHighlight";
export { default as TechnicalSpecs } from "./TechnicalSpecs";
export { default as TechnologyComparison } from "./TechnologyComparison";
export { default as Whitepaper } from "./Whitepaper";

// Standard Figures exports
export {
  // Core component
  StandardFigure,
  FIGURES,

  // Market components
  MarketSize2025,
  MarketSize2030,
  CAGR,

  // Performance components
  ResponseTime,
  DetectionAccuracy,
  Availability,
  AIPerformance,

  // Blockchain components
  TPS,
  TPSCompliance,
  Finality,

  // Investment & ROI components
  CapitalRequirements,
  ROI5Year,
  PaybackPeriod,
  Investment5Year,
  Revenue5Year,

  // Government components
  PentagonReplicator,
  RecentContracts,

  // Card components
  FiguresCard,
  MarketOverviewCard,
  PerformanceCard,
  InvestmentCard,
} from "./StandardFigures";

export type { FigureKey } from "./StandardFigures";
