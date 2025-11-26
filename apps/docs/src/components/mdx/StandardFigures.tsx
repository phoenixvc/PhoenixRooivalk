import * as React from "react";

/**
 * Standard figures for Phoenix Rooivalk documentation.
 * These values should be used consistently across all documents.
 * Update these central values when figures need to change.
 *
 * IMPORTANT: Different document contexts may use different figures.
 * See the context-specific sections below for guidance.
 */
export const FIGURES = {
  // ==========================================================================
  // MARKET SIZE FIGURES
  // ==========================================================================

  // Counter-Drone Market (Primary metrics used across business/executive docs)
  marketSize2025: "$2.45-3.0B",
  marketSize2030: "$9-15B",
  marketSize2032Enterprise: "$12.24B", // Enterprise Counter-Drone specific
  cagr: "23-27%",
  cagrAsiaPacific: "25.7%",
  cagrMiddleEast: "28%",
  cagrEurope: "24%",

  // Market Segments (2025)
  marketMilitaryDefense: "$1.2B (48%)",
  marketCriticalInfra: "$600M (24%)",
  marketCommercial: "$400M (16%)",
  marketBorderSecurity: "$300M (12%)",

  // TAM Projections (ROI Analysis)
  tam2025: "$8.2B",
  tam2026: "$9.8B",
  tam2027: "$11.7B",
  tam2028: "$13.9B",
  tam2029: "$16.5B",
  tam5Year: "$60.1B",

  // Regional Markets (2030)
  marketEurope2030: "€3.2B",
  marketMiddleEast2030: "$1.8B",
  marketAsiaPacific2030: "$3.5B",

  // ==========================================================================
  // GOVERNMENT & CONTRACT FIGURES
  // ==========================================================================
  pentagonReplicator: "$500M",
  recentContracts: "$6B+",
  raytheonCoyote: "$5.04B", // Through 2033
  natoInvestment: "$1.2B",

  // ==========================================================================
  // PERFORMANCE METRICS
  // ==========================================================================

  // Response Time
  responseTime: "120-195ms",
  responseTimeTarget: "50-195ms",
  responseTimeAdvantage: "10-40x faster",
  competitorResponseTime: "3-10 seconds",

  // Detection Accuracy (Progressive targets)
  detectionAccuracyBaseline: "85-90%",
  detectionAccuracyTarget: "95%+",
  detectionAccuracyFinal: "99.5%",
  falsePositiveRate: "<1-2%",

  // AI Performance
  aiPerformance: "275 TOPS", // Jetson AGX Orin
  aiPerformanceNX: "100 TOPS", // Jetson Orin NX
  sensorToDecision: "<50ms",

  // System Availability
  availability: "99.9%",
  dataIntegrity: "99.9%",

  // Detection Range
  detectionRange: "500m-2km",
  concurrentTargets: "10+",

  // ==========================================================================
  // BLOCKCHAIN PERFORMANCE
  // ==========================================================================

  // High Performance Mode
  tpsHighPerf: "65,000+ TPS",
  tpsSustained: "65,000-100,000 TPS",

  // Compliance Mode
  tpsCompliance: "3,000-4,500 TPS",

  // Finality
  finality: "<1 second",
  finalityPoH: "~400ms", // Proof of History

  // Authentication
  authLatency: "Sub-2ms",

  // ==========================================================================
  // INVESTMENT FIGURES
  // ==========================================================================

  // Development Phases (TRL path)
  investmentPhase1: "$3.5M", // 9 months - Concept
  investmentPhase2: "$15M", // 12 months - Prototype
  investmentPhase3: "$25M", // 15 months - Integration
  investmentToTRL7: "$43.5M", // ~3 years total

  // Full 5-Year Program (Commercialization)
  investment2025: "$25M",
  investment2026: "$35M",
  investment2027: "$40M",
  investment2028: "$30M",
  investment2029: "$15M",
  investment5Year: "$145M",

  // Funding Requirements
  seedFunding: "$1.5M",
  seriesATarget: "$30-50M",
  capitalRequirements: "$30-50M",

  // South Africa Operations
  saWorkingCapital: "R20M ($1.3M)",
  saArmscorTarget: "R50M",

  // Blockchain Implementation
  blockchainImplFull: "$9.95M", // 15 months, comprehensive
  blockchainImplSimple: "$1.80M", // 12 months, simplified

  // ==========================================================================
  // REVENUE PROJECTIONS
  // ==========================================================================
  revenue2025: "$0M", // Development year
  revenue2026: "$45M",
  revenue2027: "$180M",
  revenue2028: "$320M",
  revenue2029: "$297M",
  revenue5Year: "$842M",
  cumulativeRevenue: "$1.99B", // 2025-2029

  // Market Share Targets
  marketShare2025: "0.5%",
  marketShare2026: "1.8%",
  marketShare2027: "3.1%",
  marketShare2028: "4.2%",
  marketShare2029: "5.0%",

  // ==========================================================================
  // ROI METRICS
  // ==========================================================================

  // Main Program ROI
  roi5Year: "580%",
  roiAnnualized: "47%",
  irr: "89%",
  npv: "$456M",
  paybackPeriod: "18 months",
  netProfit5Year: "$697M",

  // Blockchain ROI
  blockchainRoi24Month: "300%",
  blockchainRoiSimple: "45%", // 18 months
  blockchainBreakeven: "6 months",

  // Industrial ROI
  industrialRoiFirstYear: "300-500%",

  // Exit Potential
  exitAcquisition: "$2B-$5B",
  exitIPO: "$5B-$10B",

  // ==========================================================================
  // COMPETITOR FIGURES
  // ==========================================================================
  andurilValuation: "$28B",
  andurilRevenue: "$1B+",
  fortemValuation: "$1.2B",
  competitorAccuracy: "70-85%",

  // ==========================================================================
  // PRODUCT FIGURES (SkySnare/AeroNet)
  // ==========================================================================
  skySnareTAM: "$1.68B",
  aeroNetTAM: "$4.2B",
  combinedTAM: "~$5.88B",
  investedToDate: "$150K",
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

// ==========================================================================
// CONVENIENCE COMPONENTS - Market
// ==========================================================================
export function MarketSize2025(): React.ReactElement {
  return <StandardFigure figureKey="marketSize2025" />;
}

export function MarketSize2030(): React.ReactElement {
  return <StandardFigure figureKey="marketSize2030" />;
}

export function CAGR(): React.ReactElement {
  return <StandardFigure figureKey="cagr" />;
}

// ==========================================================================
// CONVENIENCE COMPONENTS - Performance
// ==========================================================================
export function ResponseTime(): React.ReactElement {
  return <StandardFigure figureKey="responseTime" />;
}

export function DetectionAccuracy(): React.ReactElement {
  return <StandardFigure figureKey="detectionAccuracyTarget" />;
}

export function Availability(): React.ReactElement {
  return <StandardFigure figureKey="availability" />;
}

export function AIPerformance(): React.ReactElement {
  return <StandardFigure figureKey="aiPerformance" />;
}

// ==========================================================================
// CONVENIENCE COMPONENTS - Blockchain
// ==========================================================================
export function TPS(): React.ReactElement {
  return <StandardFigure figureKey="tpsHighPerf" />;
}

export function TPSCompliance(): React.ReactElement {
  return <StandardFigure figureKey="tpsCompliance" />;
}

export function Finality(): React.ReactElement {
  return <StandardFigure figureKey="finality" />;
}

// ==========================================================================
// CONVENIENCE COMPONENTS - Investment & ROI
// ==========================================================================
export function CapitalRequirements(): React.ReactElement {
  return <StandardFigure figureKey="capitalRequirements" />;
}

export function ROI5Year(): React.ReactElement {
  return <StandardFigure figureKey="roi5Year" />;
}

export function PaybackPeriod(): React.ReactElement {
  return <StandardFigure figureKey="paybackPeriod" />;
}

export function Investment5Year(): React.ReactElement {
  return <StandardFigure figureKey="investment5Year" />;
}

export function Revenue5Year(): React.ReactElement {
  return <StandardFigure figureKey="revenue5Year" />;
}

// ==========================================================================
// CONVENIENCE COMPONENTS - Government
// ==========================================================================
export function PentagonReplicator(): React.ReactElement {
  return <StandardFigure figureKey="pentagonReplicator" />;
}

export function RecentContracts(): React.ReactElement {
  return <StandardFigure figureKey="recentContracts" />;
}

// ==========================================================================
// FIGURES CARD COMPONENT
// ==========================================================================
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
 *     { label: "Detection Accuracy", figureKey: "detectionAccuracyTarget" },
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

// ==========================================================================
// PRESET CARD COMPONENTS
// ==========================================================================

/**
 * Pre-configured market overview card
 */
export function MarketOverviewCard(): React.ReactElement {
  return (
    <FiguresCard
      title="Market Overview"
      figures={[
        { label: "Market Size (2025)", figureKey: "marketSize2025" },
        { label: "Market Size (2030)", figureKey: "marketSize2030" },
        { label: "CAGR", figureKey: "cagr" },
        { label: "Pentagon Replicator", figureKey: "pentagonReplicator" },
        { label: "Recent Contracts", figureKey: "recentContracts" },
      ]}
    />
  );
}

/**
 * Pre-configured performance card
 */
export function PerformanceCard(): React.ReactElement {
  return (
    <FiguresCard
      title="Performance Metrics"
      figures={[
        { label: "Response Time", figureKey: "responseTime" },
        { label: "Detection Accuracy", figureKey: "detectionAccuracyTarget" },
        { label: "AI Performance", figureKey: "aiPerformance" },
        { label: "System Availability", figureKey: "availability" },
        { label: "TPS (Blockchain)", figureKey: "tpsHighPerf" },
        { label: "Block Finality", figureKey: "finality" },
      ]}
    />
  );
}

/**
 * Pre-configured investment card
 */
export function InvestmentCard(): React.ReactElement {
  return (
    <FiguresCard
      title="Investment Overview"
      figures={[
        { label: "5-Year Investment", figureKey: "investment5Year" },
        { label: "5-Year Revenue", figureKey: "revenue5Year" },
        { label: "5-Year ROI", figureKey: "roi5Year" },
        { label: "IRR", figureKey: "irr" },
        { label: "Payback Period", figureKey: "paybackPeriod" },
        { label: "NPV", figureKey: "npv" },
      ]}
    />
  );
}

export default StandardFigure;
