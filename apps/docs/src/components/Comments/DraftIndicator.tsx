/**
 * Draft Indicator Component
 *
 * Shows the current draft status (saving, saved, recovered).
 */

import React from "react";
import styles from "./DraftIndicator.module.css";

interface DraftIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
  isRecovered?: boolean;
}

export function DraftIndicator({
  isSaving,
  lastSaved,
  hasDraft,
  isRecovered,
}: DraftIndicatorProps): React.ReactElement | null {
  if (!hasDraft && !isSaving) return null;

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      return "just now";
    } else if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} min${mins > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <div className={styles.indicator}>
      {isSaving ? (
        <>
          <span className={styles.savingIcon}>
            <svg
              className={styles.spinner}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
          <span className={styles.text}>Saving draft...</span>
        </>
      ) : isRecovered ? (
        <>
          <span className={styles.recoveredIcon}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </span>
          <span className={styles.text}>Draft recovered</span>
        </>
      ) : lastSaved ? (
        <>
          <span className={styles.savedIcon}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <span className={styles.text}>
            Draft saved {formatTime(lastSaved)}
          </span>
        </>
      ) : null}
    </div>
  );
}

export default DraftIndicator;
