/**
 * Offline Indicator Component
 *
 * Shows a banner when the user is offline and displays
 * the number of pending updates that will sync when back online.
 */

import React, { useEffect, useState } from "react";
import { isOnline, getPendingCount } from "./OfflineSync";
import "./OfflineIndicator.css";

export function OfflineIndicator(): React.ReactElement | null {
  const [offline, setOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check initial state
    setOffline(!isOnline());
    setPendingCount(getPendingCount());

    const handleOnline = () => {
      setOffline(false);
      setDismissed(false);
      // Refresh pending count
      setPendingCount(getPendingCount());
    };

    const handleOffline = () => {
      setOffline(true);
      setDismissed(false);
    };

    // Check pending count periodically
    const interval = setInterval(() => {
      setPendingCount(getPendingCount());
    }, 5000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Show nothing if online and no pending updates
  if (!offline && pendingCount === 0) {
    return null;
  }

  // Show nothing if dismissed (only for offline state)
  if (offline && dismissed) {
    return null;
  }

  // Show syncing message when back online with pending updates
  if (!offline && pendingCount > 0) {
    return (
      <div className="offline-indicator offline-indicator--syncing">
        <span className="offline-indicator-icon">
          <svg
            className="offline-indicator-spinner"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </span>
        <span className="offline-indicator-text">
          Syncing {pendingCount} pending update{pendingCount !== 1 ? "s" : ""}...
        </span>
      </div>
    );
  }

  // Show offline indicator
  return (
    <div className="offline-indicator offline-indicator--offline">
      <span className="offline-indicator-icon">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </span>
      <span className="offline-indicator-text">
        You're offline
        {pendingCount > 0 && (
          <span className="offline-indicator-pending">
            {" "}
            ({pendingCount} update{pendingCount !== 1 ? "s" : ""} pending)
          </span>
        )}
      </span>
      <button
        className="offline-indicator-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offline notification"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default OfflineIndicator;
