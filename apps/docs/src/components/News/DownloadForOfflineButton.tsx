/**
 * Download for Offline Button Component
 *
 * Button to cache a news article for offline reading.
 */

import React, { useState } from "react";
import {
  useOfflineArticles,
  CachedArticle,
} from "../../hooks/useOfflineArticles";
import styles from "./DownloadForOfflineButton.module.css";

interface DownloadForOfflineButtonProps {
  article: {
    id: string;
    title: string;
    url?: string;
    imageUrl?: string;
  };
  variant?: "icon" | "button";
  className?: string;
}

export function DownloadForOfflineButton({
  article,
  variant = "icon",
  className,
}: DownloadForOfflineButtonProps): React.ReactElement | null {
  const { isSupported, isCaching, isArticleCached, cacheArticle, uncacheArticle } =
    useOfflineArticles();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isSupported) return null;

  const isCached = isArticleCached(article.id);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isCached) {
      await uncacheArticle(article.id);
    } else {
      const cachedArticle: CachedArticle = {
        id: article.id,
        title: article.title,
        url: article.url,
        imageUrl: article.imageUrl,
        cachedAt: Date.now(),
      };
      await cacheArticle(cachedArticle);
    }
  };

  if (variant === "icon") {
    return (
      <button
        className={`${styles.iconButton} ${isCached ? styles.cached : ""} ${className || ""}`}
        onClick={handleClick}
        disabled={isCaching}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={isCached ? "Remove from offline" : "Save for offline"}
        title={isCached ? "Available offline" : "Download for offline"}
      >
        {isCaching ? (
          <svg
            className={styles.spinner}
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
        ) : isCached ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <path d="M20 6L9 17l-5-5" stroke="currentColor" fill="none" strokeWidth="2" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
        {showTooltip && (
          <span className={styles.tooltip}>
            {isCached ? "Available offline" : "Save for offline"}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      className={`${styles.button} ${isCached ? styles.cached : ""} ${className || ""}`}
      onClick={handleClick}
      disabled={isCaching}
    >
      {isCaching ? (
        <>
          <svg
            className={styles.spinner}
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
          <span>Downloading...</span>
        </>
      ) : isCached ? (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>Available Offline</span>
        </>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download for Offline</span>
        </>
      )}
    </button>
  );
}

export default DownloadForOfflineButton;
