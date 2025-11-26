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
  StandardFigure,
  FIGURES,
  MarketSize2030,
  MarketSize2025,
  TPS,
  Availability,
  DetectionAccuracy,
  ResponseTime,
  CapitalRequirements,
  FiguresCard,
} from "./StandardFigures";
export type { FigureKey } from "./StandardFigures";
