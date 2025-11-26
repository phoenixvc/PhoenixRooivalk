import * as React from "react";

/**
 * Standard figures for Phoenix Rooivalk documentation.
 * These values should be used consistently across all documents.
 * Update these central values when figures need to change.
 */
export const FIGURES = {
  // Market Figures
  marketSize2025: "$2.45-3.0B",
  marketSize2030: "$9-15B",
  cagr: "23-27%",

  // Performance Metrics
  tps: "3,500+ TPS",
  availability: "99.9%",
  finality: "<1 second",
  detectionAccuracy: "99.7%",
  responseTime: "120-195ms",
  aiPerformance: "275 TOPS",

  // Investment & ROI
  capitalRequirements: "$30-50M",
  roiTimeline: "36 months",

  // Government Commitments
  pentagonReplicator: "$500M",
  recentContracts: "$6B+",
} as const;

export type FigureKey = keyof typeof FIGURES;

interface StandardFigureProps {
  figureKey: FigureKey;
  className?: string;
}

/**
 * Component to display a standard figure value.
 * Usage in MDX: <StandardFigure figureKey="marketSize2030" />
 */
export function StandardFigure({
  figureKey,
  className = "",
}: StandardFigureProps): React.ReactElement {
  return (
    <strong className={`text-blue-600 dark:text-blue-400 ${className}`}>
      {FIGURES[figureKey]}
    </strong>
  );
}

/**
 * Convenience components for commonly used figures.
 * Usage in MDX: <MarketSize2030 /> or <TPS />
 */
export function MarketSize2030(): React.ReactElement {
  return <StandardFigure figureKey="marketSize2030" />;
}

export function MarketSize2025(): React.ReactElement {
  return <StandardFigure figureKey="marketSize2025" />;
}

export function TPS(): React.ReactElement {
  return <StandardFigure figureKey="tps" />;
}

export function Availability(): React.ReactElement {
  return <StandardFigure figureKey="availability" />;
}

export function DetectionAccuracy(): React.ReactElement {
  return <StandardFigure figureKey="detectionAccuracy" />;
}

export function ResponseTime(): React.ReactElement {
  return <StandardFigure figureKey="responseTime" />;
}

export function CapitalRequirements(): React.ReactElement {
  return <StandardFigure figureKey="capitalRequirements" />;
}

interface FiguresCardProps {
  title: string;
  figures: Array<{
    label: string;
    figureKey: FigureKey;
  }>;
}

/**
 * Card component to display multiple standard figures.
 * Usage in MDX:
 * <FiguresCard
 *   title="Key Metrics"
 *   figures={[
 *     { label: "Market Size (2030)", figureKey: "marketSize2030" },
 *     { label: "Detection Accuracy", figureKey: "detectionAccuracy" },
 *   ]}
 * />
 */
export function FiguresCard({
  title,
  figures,
}: FiguresCardProps): React.ReactElement {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 my-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {figures.map(({ label, figureKey }, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {FIGURES[figureKey]}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StandardFigure;
