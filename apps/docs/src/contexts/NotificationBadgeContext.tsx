/**
 * Notification Badge Context
 *
 * Manages notification badge state without relying on DOM selectors.
 * Components can subscribe to notification state changes.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { supportService, ContentTimestamps } from "../services/supportService";
import { useAuth } from "./AuthContext";

const NEWS_LAST_SEEN_KEY = "phoenix-news-last-seen";
const SUPPORT_LAST_SEEN_KEY = "phoenix-support-last-seen";
const TIMESTAMPS_CACHE_KEY = "phoenix-content-timestamps";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface NotificationBadgeState {
  /** Whether there are unread news items */
  hasNewNews: boolean;
  /** Whether there are unread support items */
  hasNewSupport: boolean;
  /** Mark news as seen */
  markNewsSeen: () => void;
  /** Mark support as seen */
  markSupportSeen: () => void;
  /** Refresh notification state */
  refresh: () => void;
  /** Loading state */
  isLoading: boolean;
}

const NotificationBadgeContext = createContext<NotificationBadgeState | undefined>(
  undefined
);

interface NotificationBadgeProviderProps {
  children: React.ReactNode;
}

export function NotificationBadgeProvider({
  children,
}: NotificationBadgeProviderProps): React.ReactElement {
  const { user } = useAuth();
  const [timestamps, setTimestamps] = useState<ContentTimestamps | null>(null);
  const [lastSeen, setLastSeen] = useState({
    news: 0,
    support: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load last seen timestamps from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const newsLastSeen = parseInt(
      localStorage.getItem(NEWS_LAST_SEEN_KEY) || "0",
      10
    );
    const supportLastSeen = parseInt(
      localStorage.getItem(SUPPORT_LAST_SEEN_KEY) || "0",
      10
    );
    setLastSeen({ news: newsLastSeen, support: supportLastSeen });
  }, []);

  // Fetch content timestamps
  const fetchTimestamps = useCallback(async () => {
    if (typeof window === "undefined") return;

    setIsLoading(true);
    try {
      // Check cache first
      const cached = localStorage.getItem(TIMESTAMPS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setTimestamps(data);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from backend
      const data = await supportService.getLatestContentTimestamps();
      setTimestamps(data);

      // Cache the result
      localStorage.setItem(
        TIMESTAMPS_CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error("Failed to fetch content timestamps:", error);
      // Use cached data as fallback even if stale
      const cached = localStorage.getItem(TIMESTAMPS_CACHE_KEY);
      if (cached) {
        const { data } = JSON.parse(cached);
        setTimestamps(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimestamps();
  }, [fetchTimestamps]);

  const markNewsSeen = useCallback(() => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    localStorage.setItem(NEWS_LAST_SEEN_KEY, now.toString());
    setLastSeen((prev) => ({ ...prev, news: now }));
  }, []);

  const markSupportSeen = useCallback(() => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    localStorage.setItem(SUPPORT_LAST_SEEN_KEY, now.toString());
    setLastSeen((prev) => ({ ...prev, support: now }));
  }, []);

  const hasNewNews = useMemo(() => {
    if (!timestamps) return false;
    return timestamps.newsUpdatedAt > lastSeen.news;
  }, [timestamps, lastSeen.news]);

  const hasNewSupport = useMemo(() => {
    if (!timestamps || !user) return false;
    return timestamps.supportUpdatedAt > lastSeen.support;
  }, [timestamps, lastSeen.support, user]);

  const value = useMemo<NotificationBadgeState>(
    () => ({
      hasNewNews,
      hasNewSupport,
      markNewsSeen,
      markSupportSeen,
      refresh: fetchTimestamps,
      isLoading,
    }),
    [hasNewNews, hasNewSupport, markNewsSeen, markSupportSeen, fetchTimestamps, isLoading]
  );

  return (
    <NotificationBadgeContext.Provider value={value}>
      {children}
    </NotificationBadgeContext.Provider>
  );
}

/**
 * Hook to access notification badge state
 */
export function useNotificationBadges(): NotificationBadgeState {
  const context = useContext(NotificationBadgeContext);

  if (context === undefined) {
    throw new Error(
      "useNotificationBadges must be used within a NotificationBadgeProvider"
    );
  }

  return context;
}
