import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "@docusaurus/router";
import { useAuth } from "../../contexts/AuthContext";
import { useAchievements } from "./Achievements";
import { emitDocumentCompletion } from "./CompletionToast";

/**
 * ReadingTracker component automatically tracks user progress through documentation pages.
 * It monitors scroll position and marks pages as read when users scroll past 90%.
 * It also tracks time spent reading each document (only when page is visible/focused).
 * Progress is synced to Firebase when user is authenticated, otherwise saved locally.
 * Also checks and unlocks achievements when docs are completed.
 *
 * This component should be added to the theme to track all doc pages automatically.
 */

// Time tracking interval in milliseconds
const TIME_UPDATE_INTERVAL = 5000; // Update every 5 seconds
const MIN_TIME_UPDATE = 1000; // Minimum 1 second before recording

export function ReadingTracker(): null {
  const location = useLocation();
  const { progress, updateProgress } = useAuth();
  const { checkAndUnlockAchievements } = useAchievements();
  const lastAchievementCheckRef = useRef<number>(0);

  // Time tracking refs
  const isActiveRef = useRef(true);
  const lastActiveTimeRef = useRef(Date.now());
  const accumulatedTimeRef = useRef(0);
  const currentDocIdRef = useRef<string | null>(null);

  // Update time spent on a document
  const updateTimeSpent = useCallback(
    async (docId: string, additionalMs: number) => {
      if (!progress || additionalMs < MIN_TIME_UPDATE) return;

      const currentDoc = progress.docs[docId] || {
        scrollProgress: 0,
        completed: false,
        timeSpentMs: 0,
      };

      const newTimeSpent = (currentDoc.timeSpentMs || 0) + additionalMs;
      const totalTimeSpent =
        (progress.stats.totalTimeSpentMs || 0) + additionalMs;

      await updateProgress({
        docs: {
          [docId]: {
            ...currentDoc,
            timeSpentMs: newTimeSpent,
            lastReadAt: new Date().toISOString(),
          },
        },
        stats: {
          ...progress.stats,
          totalTimeSpentMs: totalTimeSpent,
        },
      });
    },
    [progress, updateProgress],
  );

  // Update scroll progress for a document
  const updateScrollProgress = useCallback(
    async (docId: string, scrollPercent: number) => {
      if (!progress) return;

      const currentDoc = progress.docs[docId] || {
        scrollProgress: 0,
        completed: false,
      };

      // Only update if scroll progress increased
      if (scrollPercent > currentDoc.scrollProgress) {
        const isCompleted = scrollPercent >= 90;
        const wasAlreadyCompleted = currentDoc.completed;

        await updateProgress({
          docs: {
            [docId]: {
              ...currentDoc,
              scrollProgress: scrollPercent,
              completed: isCompleted || currentDoc.completed,
              completedAt:
                isCompleted && !currentDoc.completed
                  ? new Date().toISOString()
                  : currentDoc.completedAt,
            },
          },
        });

        // Check achievements and show completion toast when a doc is newly completed
        // Throttle to once per second to avoid excessive calls
        if (isCompleted && !wasAlreadyCompleted) {
          const now = Date.now();
          if (now - lastAchievementCheckRef.current > 1000) {
            lastAchievementCheckRef.current = now;
            const completedCount =
              Object.values(progress.docs).filter((d) => d.completed).length +
              1; // +1 for the doc we just completed
            checkAndUnlockAchievements(completedCount);

            // Emit completion event for toast notification
            emitDocumentCompletion({
              docId,
              title: docId,
              completedAt: new Date().toISOString(),
            });
          }
        }
      }
    },
    [progress, updateProgress, checkAndUnlockAchievements],
  );

  // Effect for time tracking
  useEffect(() => {
    // Only track docs pages
    if (!location.pathname.startsWith("/docs/")) {
      return;
    }

    const docId = location.pathname.replace(/^\/docs\//, "").replace(/\/$/, "");

    // Reset time tracking for new doc
    currentDocIdRef.current = docId;
    isActiveRef.current = !document.hidden;
    lastActiveTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;

    // Handle visibility change
    const handleVisibilityChange = () => {
      const now = Date.now();

      if (document.hidden) {
        // Page became hidden - accumulate time if was active
        if (isActiveRef.current) {
          accumulatedTimeRef.current += now - lastActiveTimeRef.current;
        }
        isActiveRef.current = false;
      } else {
        // Page became visible - reset active time
        isActiveRef.current = true;
        lastActiveTimeRef.current = now;
      }
    };

    // Handle window focus/blur
    const handleFocus = () => {
      isActiveRef.current = true;
      lastActiveTimeRef.current = Date.now();
    };

    const handleBlur = () => {
      const now = Date.now();
      if (isActiveRef.current) {
        accumulatedTimeRef.current += now - lastActiveTimeRef.current;
      }
      isActiveRef.current = false;
    };

    // Periodic time update
    const timeInterval = setInterval(() => {
      if (!currentDocIdRef.current) return;

      const now = Date.now();
      let timeToRecord = accumulatedTimeRef.current;

      if (isActiveRef.current) {
        timeToRecord += now - lastActiveTimeRef.current;
        lastActiveTimeRef.current = now;
      }

      // Reset accumulated time
      accumulatedTimeRef.current = 0;

      if (timeToRecord >= MIN_TIME_UPDATE) {
        updateTimeSpent(currentDocIdRef.current, timeToRecord);
      }
    }, TIME_UPDATE_INTERVAL);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Cleanup - save remaining time
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      clearInterval(timeInterval);

      // Save any remaining accumulated time
      const now = Date.now();
      let finalTime = accumulatedTimeRef.current;
      if (isActiveRef.current) {
        finalTime += now - lastActiveTimeRef.current;
      }
      if (finalTime >= MIN_TIME_UPDATE && currentDocIdRef.current) {
        updateTimeSpent(currentDocIdRef.current, finalTime);
      }
    };
  }, [location.pathname, updateTimeSpent]);

  // Effect for scroll tracking
  useEffect(() => {
    // Only track docs pages
    if (!location.pathname.startsWith("/docs/")) {
      return;
    }

    // Extract doc ID from pathname
    const docId = location.pathname.replace(/^\/docs\//, "").replace(/\/$/, "");

    let ticking = false;

    const trackScrollPosition = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackableHeight = documentHeight - windowHeight;

      if (trackableHeight <= 0) {
        // Page is too short to scroll, mark as 100%
        updateScrollProgress(docId, 100);
        return;
      }

      const scrollPercent = Math.min(
        100,
        Math.round((scrollTop / trackableHeight) * 100),
      );

      updateScrollProgress(docId, scrollPercent);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(trackScrollPosition);
        ticking = true;
      }
    };

    // Initial progress update
    trackScrollPosition();

    // Listen for scroll events
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname, updateScrollProgress]);

  return null;
}
