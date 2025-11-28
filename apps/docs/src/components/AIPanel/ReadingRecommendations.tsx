/**
 * Reading Recommendations Widget
 *
 * Shows AI-powered reading recommendations based on user's reading history.
 * Can be embedded in sidebar, footer, or as standalone component.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  aiService,
  ReadingRecommendation,
  AIError,
} from "../../services/aiService";
import "./ReadingRecommendations.css";

interface ReadingRecommendationsProps {
  /** Maximum number of recommendations to show */
  maxItems?: number;
  /** Show as compact widget or full panel */
  variant?: "compact" | "full";
  /** Current document ID for context */
  currentDocId?: string;
  /** Show heading */
  showHeading?: boolean;
  /** Auto-refresh interval in ms (0 = disabled) */
  autoRefresh?: number;
}

export function ReadingRecommendations({
  maxItems = 3,
  variant = "compact",
  currentDocId,
  showHeading = true,
  autoRefresh = 0,
}: ReadingRecommendationsProps): React.ReactElement | null {
  const { user, userProgress } = useAuth();
  const [recommendations, setRecommendations] = useState<
    ReadingRecommendation[]
  >([]);
  const [learningPath, setLearningPath] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const docId =
        currentDocId ||
        (typeof window !== "undefined" ? window.location.pathname : "");
      const result = await aiService.getReadingRecommendations(docId);

      if (result.message) {
        setMessage(result.message);
        setRecommendations([]);
      } else {
        setRecommendations(result.recommendations.slice(0, maxItems));
        setLearningPath(result.learningPath || "");
        setMessage("");
      }
      setHasLoaded(true);
    } catch (err) {
      if (err instanceof AIError) {
        setError(err.message);
      } else {
        setError("Failed to load recommendations");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, currentDocId, maxItems]);

  // Initial load
  useEffect(() => {
    if (user && !hasLoaded) {
      fetchRecommendations();
    }
  }, [user, hasLoaded, fetchRecommendations]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh > 0 && user) {
      const interval = setInterval(fetchRecommendations, autoRefresh);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, user, fetchRecommendations]);

  // Don't render for unauthenticated users
  if (!user) {
    return null;
  }

  // Calculate reading progress stats
  const totalDocs = Object.keys(userProgress?.docs || {}).length;
  const completedDocs = Object.values(userProgress?.docs || {}).filter(
    (doc: any) => doc.completed,
  ).length;

  if (variant === "compact") {
    return (
      <div className="reading-rec-compact">
        {showHeading && (
          <div className="reading-rec-header">
            <span className="reading-rec-icon">📚</span>
            <span className="reading-rec-title">Recommended Reading</span>
            <button
              className="reading-rec-refresh"
              onClick={fetchRecommendations}
              disabled={isLoading}
              title="Refresh recommendations"
            >
              🔄
            </button>
          </div>
        )}

        {isLoading && !hasLoaded && (
          <div className="reading-rec-loading">Loading...</div>
        )}

        {error && <div className="reading-rec-error">{error}</div>}

        {message && <div className="reading-rec-message">{message}</div>}

        {recommendations.length > 0 && (
          <ul className="reading-rec-list">
            {recommendations.map((rec, index) => (
              <li key={rec.docId} className="reading-rec-item">
                <a href={rec.docId} className="reading-rec-link">
                  <span className="reading-rec-number">{index + 1}</span>
                  <span className="reading-rec-doc">
                    {formatDocId(rec.docId)}
                  </span>
                  <span className="reading-rec-score">
                    {Math.round(rec.relevanceScore * 100)}%
                  </span>
                </a>
                <p className="reading-rec-reason">{rec.reason}</p>
              </li>
            ))}
          </ul>
        )}

        {completedDocs > 0 && (
          <div className="reading-rec-progress">
            <div className="reading-rec-progress-bar">
              <div
                className="reading-rec-progress-fill"
                style={{
                  width: `${(completedDocs / Math.max(totalDocs, 1)) * 100}%`,
                }}
              />
            </div>
            <span className="reading-rec-progress-text">
              {completedDocs} of {totalDocs} read
            </span>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className="reading-rec-full">
      {showHeading && (
        <div className="reading-rec-header-full">
          <h3>
            <span className="reading-rec-icon">📚</span>
            AI Reading Recommendations
          </h3>
          <button
            className="reading-rec-refresh-btn"
            onClick={fetchRecommendations}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Refresh"}
          </button>
        </div>
      )}

      {error && <div className="reading-rec-error">{error}</div>}

      {message && (
        <div className="reading-rec-message-full">
          <p>{message}</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <>
          <div className="reading-rec-cards">
            {recommendations.map((rec, index) => (
              <a key={rec.docId} href={rec.docId} className="reading-rec-card">
                <div className="reading-rec-card-header">
                  <span className="reading-rec-card-number">#{index + 1}</span>
                  <span className="reading-rec-card-score">
                    {Math.round(rec.relevanceScore * 100)}% match
                  </span>
                </div>
                <h4 className="reading-rec-card-title">
                  {formatDocId(rec.docId)}
                </h4>
                <p className="reading-rec-card-reason">{rec.reason}</p>
              </a>
            ))}
          </div>

          {learningPath && (
            <div className="reading-rec-path">
              <strong>Suggested Learning Path:</strong> {learningPath}
            </div>
          )}
        </>
      )}

      <div className="reading-rec-stats">
        <div className="reading-rec-stat">
          <span className="reading-rec-stat-value">{completedDocs}</span>
          <span className="reading-rec-stat-label">Docs Read</span>
        </div>
        <div className="reading-rec-stat">
          <span className="reading-rec-stat-value">
            {totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0}%
          </span>
          <span className="reading-rec-stat-label">Progress</span>
        </div>
        <div className="reading-rec-stat">
          <span className="reading-rec-stat-value">
            {recommendations.length}
          </span>
          <span className="reading-rec-stat-label">Suggested</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Format document ID to readable title
 */
function formatDocId(docId: string): string {
  // Remove leading slashes and docs/ prefix
  let formatted = docId.replace(/^\/?(docs\/)?/, "");

  // Remove file extensions
  formatted = formatted.replace(/\.(md|mdx)$/, "");

  // Replace hyphens and underscores with spaces
  formatted = formatted.replace(/[-_]/g, " ");

  // Capitalize words
  formatted = formatted.split("/").pop() || formatted;

  formatted = formatted
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return formatted || docId;
}

export default ReadingRecommendations;
