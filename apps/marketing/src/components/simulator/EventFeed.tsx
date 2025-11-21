import React from "react";
import styles from "./EventFeed.module.css";

type EventSeverity = "info" | "warning" | "success" | "critical" | "error";

interface FeedItem {
  timestamp: string;
  message: string;
  severity?: EventSeverity;
  details?: Record<string, unknown>;
}

interface EventFeedProps {
  feedItems: FeedItem[];
}

const EventFeed: React.FC<EventFeedProps> = ({ feedItems }) => {
  const getSeverityIcon = (severity?: EventSeverity) => {
    switch (severity) {
      case "critical":
        return "🔴";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  return (
    <aside
      className={styles.feed}
      aria-live="polite"
      aria-atomic="false"
      aria-label="Event feed"
    >
      {feedItems.length === 0 && (
        <div className={`${styles.feedItem} ${styles.feedItemInfo}`}>
          <span className={styles.severityIcon}>ℹ️</span>
          <div className={styles.feedContent}>
            <span className={styles.timestamp}>--:--:--</span>
            <span className={styles.message}>
              System initialized. Awaiting events.
            </span>
          </div>
        </div>
      )}
      {feedItems
        .slice()
        .reverse()
        .map((item, index) => (
          <div
            key={index}
            className={`${styles.feedItem} ${styles[`feedItem${item.severity ? item.severity.charAt(0).toUpperCase() + item.severity.slice(1) : "Info"}`]}`}
          >
            <span
              className={styles.severityIcon}
              aria-label={item.severity || "info"}
            >
              {getSeverityIcon(item.severity)}
            </span>
            <div className={styles.feedContent}>
              <span className={styles.timestamp} aria-label="Event time">
                {item.timestamp}
              </span>
              <span className={styles.message}>{item.message}</span>
              {item.details && (
                <span className={styles.details}>
                  {JSON.stringify(item.details)}
                </span>
              )}
            </div>
          </div>
        ))}
    </aside>
  );
};

export default EventFeed;
