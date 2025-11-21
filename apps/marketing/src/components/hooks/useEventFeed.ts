import { useState, useCallback } from "react";

export type FeedSeverity = "info" | "warning" | "error" | "success";
export type FeedCategory = "engagement" | "detection" | "system" | "deployment";

export interface FeedItem {
  id: string;
  timestamp: string;
  timestampMs: number;
  message: string;
  severity: FeedSeverity;
  category: FeedCategory;
  details?: Record<string, unknown>;
}

export const useEventFeed = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  const addFeed = useCallback(
    (
      message: string,
      severity: FeedSeverity = "info",
      category: FeedCategory = "system",
      details?: Record<string, unknown>,
    ) => {
      const now = new Date();
      const timestampMs = now.getTime();
      const timestamp = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const newItem: FeedItem = {
        id: `feed-${timestampMs}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        timestampMs,
        message,
        severity,
        category,
        details,
      };

      setFeedItems((prevItems) => {
        const newItems = [newItem, ...prevItems];
        // Keep the feed to a maximum of 100 items for better history
        return newItems.slice(0, 100);
      });
    },
    [],
  );

  const clearFeed = useCallback(() => {
    setFeedItems([]);
  }, []);

  const filterFeed = useCallback(
    (severity?: FeedSeverity, category?: FeedCategory): FeedItem[] => {
      return feedItems.filter((item) => {
        if (severity && item.severity !== severity) return false;
        if (category && item.category !== category) return false;
        return true;
      });
    },
    [feedItems],
  );

  return { feedItems, addFeed, clearFeed, filterFeed };
};
