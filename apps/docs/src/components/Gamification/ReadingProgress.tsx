import * as React from "react";
import { useEffect, useState } from "react";

interface ReadingProgressProps {
  totalDocs: number;
  categoryName: string;
}

const STORAGE_KEY = "phoenix-docs-progress";

interface ProgressData {
  [docId: string]: {
    completed: boolean;
    completedAt?: string;
    scrollProgress: number;
  };
}

export function useReadingProgress() {
  const [progress, setProgress] = useState<ProgressData>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setProgress(JSON.parse(stored));
    }
  }, []);

  const markAsRead = (docId: string) => {
    const newProgress = {
      ...progress,
      [docId]: {
        completed: true,
        completedAt: new Date().toISOString(),
        scrollProgress: 100,
      },
    };
    setProgress(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  };

  const updateScrollProgress = (docId: string, scrollPercent: number) => {
    const existing = progress[docId] || { completed: false, scrollProgress: 0 };
    if (scrollPercent > existing.scrollProgress) {
      const newProgress = {
        ...progress,
        [docId]: {
          ...existing,
          scrollProgress: scrollPercent,
          completed: scrollPercent >= 90 ? true : existing.completed,
          completedAt:
            scrollPercent >= 90 && !existing.completed
              ? new Date().toISOString()
              : existing.completedAt,
        },
      };
      setProgress(newProgress);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    }
  };

  const getCompletedCount = () => {
    return Object.values(progress).filter((p) => p.completed).length;
  };

  const isCompleted = (docId: string) => {
    return progress[docId]?.completed || false;
  };

  const getScrollProgress = (docId: string) => {
    return progress[docId]?.scrollProgress || 0;
  };

  const resetProgress = () => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    progress,
    markAsRead,
    updateScrollProgress,
    getCompletedCount,
    isCompleted,
    getScrollProgress,
    resetProgress,
  };
}

export default function ReadingProgress({
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
  
  // Calculate overall statistics
  const totalCompleted = getCompletedCount();
  const allDocs = Object.keys(progress);
  const totalDocs = allDocs.length || 1; // Avoid division by zero
  const percentage = Math.round((totalCompleted / totalDocs) * 100);
  
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
          <h2 className="reading-progress-overview-title">📚 Reading Progress</h2>
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
            <div className="reading-progress-stat-value">{completedDocs.length}</div>
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
