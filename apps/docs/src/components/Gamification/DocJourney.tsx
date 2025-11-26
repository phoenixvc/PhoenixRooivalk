import * as React from "react";
import Link from "@docusaurus/Link";
import { useAuth } from "../../contexts/AuthContext";

interface JourneyPath {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  docs: { id: string; title: string; path: string }[];
}

export const LEARNING_PATHS: JourneyPath[] = [
  {
    id: "executive-overview",
    name: "Executive Overview",
    description: "Get the high-level picture of Phoenix Rooivalk",
    icon: "📊",
    color: "#f97316",
    docs: [
      {
        id: "exec-summary",
        title: "Executive Summary",
        path: "/docs/executive/executive-summary",
      },
      {
        id: "system-overview",
        title: "System Overview",
        path: "/docs/executive/system-overview",
      },
      {
        id: "global-strategy",
        title: "Global Strategy",
        path: "/docs/executive/global-strategy",
      },
      {
        id: "market-analysis",
        title: "Market Analysis",
        path: "/docs/business/market-analysis",
      },
    ],
  },
  {
    id: "technical-deep-dive",
    name: "Technical Deep Dive",
    description: "Understand the technical architecture and capabilities",
    icon: "💻",
    color: "#3b82f6",
    docs: [
      {
        id: "tech-arch",
        title: "Technical Architecture",
        path: "/docs/technical/technical-architecture",
      },
      {
        id: "system-arch",
        title: "System Architecture",
        path: "/docs/technical/system-architecture",
      },
      {
        id: "ai-benefits",
        title: "AI Benefits",
        path: "/docs/technical/ai-benefits",
      },
      {
        id: "blockchain",
        title: "Blockchain Integration",
        path: "/docs/technical/blockchain-integration",
      },
      {
        id: "hardware",
        title: "Hardware Foundation",
        path: "/docs/technical/hardware-foundation",
      },
    ],
  },
  {
    id: "business-case",
    name: "Business Case",
    description: "Explore the business model and market opportunity",
    icon: "💼",
    color: "#8b5cf6",
    docs: [
      {
        id: "market",
        title: "Market Analysis",
        path: "/docs/business/market-analysis",
      },
      {
        id: "business-model",
        title: "Business Model",
        path: "/docs/business/business-model",
      },
      {
        id: "competitive",
        title: "Competitive Analysis",
        path: "/docs/business/competitive-analysis",
      },
      { id: "roi", title: "ROI Analysis", path: "/docs/business/roi-analysis" },
      {
        id: "use-cases",
        title: "Use Cases",
        path: "/docs/business/use-cases",
      },
    ],
  },
  {
    id: "compliance-legal",
    name: "Compliance & Legal",
    description: "Understand regulatory requirements and compliance",
    icon: "⚖️",
    color: "#ef4444",
    docs: [
      {
        id: "compliance",
        title: "Compliance Framework",
        path: "/docs/legal/compliance-framework",
      },
      {
        id: "legal",
        title: "Legal Framework",
        path: "/docs/legal/legal-framework",
      },
    ],
  },
  {
    id: "operations-mastery",
    name: "Operations Mastery",
    description: "Learn deployment and operational procedures",
    icon: "🚀",
    color: "#22c55e",
    docs: [
      {
        id: "ops-manual",
        title: "Operations Manual",
        path: "/docs/operations/operations-manual",
      },
      {
        id: "deployment",
        title: "Deployment Guide",
        path: "/docs/operations/deployment/deployment-guide",
      },
      {
        id: "maintenance",
        title: "Maintenance Procedures",
        path: "/docs/operations/maintenance/maintenance-procedures",
      },
      {
        id: "training",
        title: "Training Materials",
        path: "/docs/operations/training/training-materials",
      },
    ],
  },
  {
    id: "research-explorer",
    name: "Research Explorer",
    description: "Dive into technical research and analysis",
    icon: "🔬",
    color: "#06b6d4",
    docs: [
      {
        id: "counter-drone",
        title: "Counter-Drone Effectors",
        path: "/docs/research/experimental-counter-drone-effectors-transform-warfare",
      },
      {
        id: "sensors",
        title: "Sensor Technologies",
        path: "/docs/research/sensor-technologies-comprehensive-analysis",
      },
      {
        id: "market-intel",
        title: "Market Intelligence",
        path: "/docs/research/market-intelligence-notes",
      },
    ],
  },
];

/**
 * Hook for tracking learning path progress using AuthContext.
 * Progress is automatically derived from document reading progress,
 * which syncs to Firebase when user is authenticated.
 */
export function useDocJourney() {
  const { progress } = useAuth();

  // Helper to convert doc path to doc ID used in progress tracking
  const pathToDocId = (docPath: string): string => {
    return docPath.replace(/^\/docs\//, "").replace(/\/$/, "");
  };

  // Check if a specific doc in a path is completed
  const isDocComplete = React.useCallback(
    (_pathId: string, docId: string) => {
      // Find the path and doc to get the actual doc path
      for (const path of LEARNING_PATHS) {
        const doc = path.docs.find((d) => d.id === docId);
        if (doc) {
          const progressDocId = pathToDocId(doc.path);
          return progress?.docs[progressDocId]?.completed || false;
        }
      }
      return false;
    },
    [progress],
  );

  // Get progress percentage for a learning path
  const getPathProgress = React.useCallback(
    (pathId: string) => {
      const path = LEARNING_PATHS.find((p) => p.id === pathId);
      if (!path || !progress?.docs) return 0;

      const completedCount = path.docs.filter((doc) => {
        const progressDocId = pathToDocId(doc.path);
        return progress.docs[progressDocId]?.completed || false;
      }).length;

      return Math.round((completedCount / path.docs.length) * 100);
    },
    [progress],
  );

  // Check if entire path is complete
  const isPathComplete = React.useCallback(
    (pathId: string) => {
      return getPathProgress(pathId) === 100;
    },
    [getPathProgress],
  );

  // markDocComplete is no longer needed as progress is tracked automatically
  // by the ReadingTracker when users scroll through documents
  const markDocComplete = React.useCallback(
    (_pathId: string, _docId: string) => {
      // No-op: Progress is now tracked automatically by ReadingTracker
    },
    [],
  );

  return {
    journeyProgress: progress,
    markDocComplete,
    getPathProgress,
    isDocComplete,
    isPathComplete,
  };
}

// Journey path card
function JourneyPathCard({
  path,
  progress,
  isComplete,
}: {
  path: JourneyPath;
  progress: number;
  isComplete: boolean;
}): React.ReactElement {
  return (
    <div
      className={`journey-path-card ${isComplete ? "journey-path-card--complete" : ""}`}
      style={{ "--path-color": path.color } as React.CSSProperties}
    >
      <div className="journey-path-header">
        <span className="journey-path-icon">{path.icon}</span>
        <div className="journey-path-info">
          <h3 className="journey-path-name">{path.name}</h3>
          <p className="journey-path-desc">{path.description}</p>
        </div>
        {isComplete && <span className="journey-path-complete-badge">✓</span>}
      </div>

      <div className="journey-path-progress">
        <div className="journey-path-progress-bar">
          <div
            className="journey-path-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="journey-path-progress-text">{progress}%</span>
      </div>

      <div className="journey-path-docs">
        {path.docs.map((doc, index) => (
          <Link key={doc.id} to={doc.path} className="journey-path-doc">
            <span className="journey-path-doc-number">{index + 1}</span>
            <span className="journey-path-doc-title">{doc.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Main journey dashboard
export default function DocJourney(): React.ReactElement {
  const { getPathProgress, isPathComplete } = useDocJourney();

  const completedPaths = LEARNING_PATHS.filter((p) =>
    isPathComplete(p.id),
  ).length;
  const totalProgress = Math.round(
    LEARNING_PATHS.reduce((sum, p) => sum + getPathProgress(p.id), 0) /
      LEARNING_PATHS.length,
  );

  return (
    <div className="doc-journey">
      <div className="doc-journey-header">
        <h2 className="doc-journey-title">Documentation Journey</h2>
        <p className="doc-journey-subtitle">
          Follow these learning paths to master Phoenix Rooivalk
        </p>
        <div className="doc-journey-stats">
          <div className="doc-journey-stat">
            <span className="doc-journey-stat-value">{totalProgress}%</span>
            <span className="doc-journey-stat-label">Overall Progress</span>
          </div>
          <div className="doc-journey-stat">
            <span className="doc-journey-stat-value">{completedPaths}</span>
            <span className="doc-journey-stat-label">
              / {LEARNING_PATHS.length} Paths Complete
            </span>
          </div>
        </div>
      </div>

      <div className="doc-journey-paths">
        {LEARNING_PATHS.map((path) => (
          <JourneyPathCard
            key={path.id}
            path={path}
            progress={getPathProgress(path.id)}
            isComplete={isPathComplete(path.id)}
          />
        ))}
      </div>
    </div>
  );
}
