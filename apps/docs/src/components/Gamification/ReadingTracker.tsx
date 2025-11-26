import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "@docusaurus/router";
import { useAuth } from "../../contexts/AuthContext";
import { useAchievements } from "./Achievements";

/**
 * ReadingTracker component automatically tracks user progress through documentation pages.
 * It monitors scroll position and marks pages as read when users scroll past 90%.
 * Progress is synced to Firebase when user is authenticated, otherwise saved locally.
 * Also checks and unlocks achievements when docs are completed.
 *
 * This component should be added to the theme to track all doc pages automatically.
 */
export function ReadingTracker(): null {
  const location = useLocation();
  const { progress, updateProgress } = useAuth();
  const { checkAndUnlockAchievements } = useAchievements();
  const lastAchievementCheckRef = useRef<number>(0);

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

        // Check achievements when a doc is newly completed
        // Throttle to once per second to avoid excessive calls
        if (isCompleted && !wasAlreadyCompleted) {
          const now = Date.now();
          if (now - lastAchievementCheckRef.current > 1000) {
            lastAchievementCheckRef.current = now;
            const completedCount = Object.values(progress.docs).filter(
              (d) => d.completed
            ).length + 1; // +1 for the doc we just completed
            checkAndUnlockAchievements(completedCount);
          }
        }
      }
    },
    [progress, updateProgress, checkAndUnlockAchievements],
  );

  useEffect(() => {
    // Only track docs pages
    if (!location.pathname.startsWith("/docs/")) {
      return;
    }

    // Extract doc ID from pathname
    const docId = location.pathname
      .replace(/^\/docs\//, "")
      .replace(/\/$/, "");

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
