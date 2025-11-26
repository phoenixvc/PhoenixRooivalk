import * as React from "react";
import { useAuth } from "../../contexts/AuthContext";

interface ReadingProgressProps {
  totalDocs: number;
  categoryName: string;
}

/**
 * Hook for accessing reading progress from the AuthContext.
 * Progress is synced to Firebase when user is authenticated.
 *
 * @returns {object} Progress tracking utilities including query methods
 */
export function useReadingProgress() {
  const { progress, markDocAsRead } = useAuth();

  const getCompletedCount = () => {
    if (!progress?.docs) return 0;
    return Object.values(progress.docs).filter((p) => p.completed).length;
  };

  const isCompleted = (docId: string) => {
    return progress?.docs[docId]?.completed || false;
  };

  const getScrollProgress = (docId: string) => {
    return progress?.docs[docId]?.scrollProgress || 0;
  };

  return {
    progress: progress?.docs || {},
    markAsRead: markDocAsRead,
    getCompletedCount,
    isCompleted,
    getScrollProgress,
  };
}

/**
 * ReadingProgress component displays progress for a specific documentation category.
 * Shows completion stats and a progress bar for the specified category.
 *
 * @param {ReadingProgressProps} props - Component props
 * @param {number} props.totalDocs - Total number of documents in the category
 * @param {string} props.categoryName - Name of the documentation category
 * @returns {React.ReactElement} Reading progress display for a category
 */
export function ReadingProgress({
  totalDocs,
  categoryName,
}: ReadingProgressProps): React.ReactElement {
  const { getCompletedCount } = useReadingProgress();
  const completed = getCompletedCount();
  const percentage = Math.round((completed / totalDocs) * 100);

  return (
    <div className="reading-progress-card">
      <div className="reading-progress-header">
        <span className="reading-progress-icon">📚</span>
        <span className="reading-progress-title">{categoryName} Progress</span>
      </div>
      <div className="reading-progress-bar-container">
        <div
          className="reading-progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="reading-progress-stats">
        <span>
          {completed} / {totalDocs} docs read
        </span>
        <span className="reading-progress-percentage">{percentage}%</span>
      </div>
    </div>
  );
}

/**
 * ReadingProgressCard displays an overview card of reading progress across all documentation
 */
export function ReadingProgressCard(): React.ReactElement {
  const { progress, getCompletedCount } = useReadingProgress();

  // Total documentation pages in the site
  const TOTAL_DOCS = 106;

  // Calculate overall statistics
  const totalCompleted = getCompletedCount();
  const allDocs = Object.keys(progress);
  const percentage = Math.round((totalCompleted / TOTAL_DOCS) * 100);

  // Calculate reading streak
  const completedDocs = allDocs
    .filter((docId) => progress[docId]?.completed)
    .sort((a, b) => {
      const dateA = progress[a]?.completedAt || "";
      const dateB = progress[b]?.completedAt || "";
      return dateB.localeCompare(dateA);
    });

  const recentlyCompleted = completedDocs.slice(0, 3);

  return (
    <div className="reading-progress-overview-card">
      <div className="reading-progress-overview-header">
        <div>
          <h2 className="reading-progress-overview-title">
            📚 Reading Progress
          </h2>
          <p className="reading-progress-overview-subtitle">
            Track your journey through Phoenix Rooivalk documentation
          </p>
        </div>
      </div>

      <div className="reading-progress-overview-stats">
        <div className="reading-progress-stat-card">
          <div className="reading-progress-stat-icon">📖</div>
          <div className="reading-progress-stat-content">
            <div className="reading-progress-stat-value">{totalCompleted}</div>
            <div className="reading-progress-stat-label">Docs Completed</div>
          </div>
        </div>

        <div className="reading-progress-stat-card">
          <div className="reading-progress-stat-icon">📊</div>
          <div className="reading-progress-stat-content">
            <div className="reading-progress-stat-value">{percentage}%</div>
            <div className="reading-progress-stat-label">Overall Progress</div>
          </div>
        </div>

        <div className="reading-progress-stat-card">
          <div className="reading-progress-stat-icon">🔥</div>
          <div className="reading-progress-stat-content">
            <div className="reading-progress-stat-value">
              {completedDocs.length}
            </div>
            <div className="reading-progress-stat-label">Total Read</div>
          </div>
        </div>
      </div>

      <div className="reading-progress-bar-container">
        <div
          className="reading-progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {recentlyCompleted.length > 0 && (
        <div className="reading-progress-recent">
          <h3 className="reading-progress-recent-title">Recently Completed</h3>
          <ul className="reading-progress-recent-list">
            {recentlyCompleted.map((docId) => (
              <li key={docId} className="reading-progress-recent-item">
                <span className="reading-progress-recent-icon">✓</span>
                <span className="reading-progress-recent-doc">{docId}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
