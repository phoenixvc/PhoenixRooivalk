import { useEffect } from "react";
import { useLocation } from "@docusaurus/router";
import { useReadingProgress } from "./ReadingProgress";

/**
 * ReadingTracker component automatically tracks user progress through documentation pages.
 * It monitors scroll position and marks pages as read when users scroll past 90%.
 * 
 * This component should be added to the theme to track all doc pages automatically.
 */
export function ReadingTracker(): null {
  const location = useLocation();
  const { updateScrollProgress } = useReadingProgress();

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

    const updateProgress = () => {
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
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    // Initial progress update
    updateProgress();

    // Listen for scroll events
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname, updateScrollProgress]);

  return null;
}
