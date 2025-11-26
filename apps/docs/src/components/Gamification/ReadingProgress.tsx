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
