/**
 * AnalyticsTracker Component
 *
 * Automatically tracks:
 * - Page views
 * - Time on page
 * - Scroll depth
 *
 * Mount this at the root level to track all pages.
 */

import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "@docusaurus/router";
import { useAuth } from "../../contexts/AuthContext";
import { analytics } from "../../services/analytics";

export function AnalyticsTracker(): null {
  const location = useLocation();
  const { user } = useAuth();
  const lastPathRef = useRef<string>("");
  const scrollDepthRef = useRef<number>(0);

  // Track scroll depth
  const updateScrollDepth = useCallback(() => {
    if (typeof window === "undefined") return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const trackableHeight = documentHeight - windowHeight;

    if (trackableHeight <= 0) {
      scrollDepthRef.current = 100;
    } else {
      const depth = Math.min(
        100,
        Math.round((scrollTop / trackableHeight) * 100),
      );
      if (depth > scrollDepthRef.current) {
        scrollDepthRef.current = depth;
        analytics.updateScrollDepth(depth);
      }
    }
  }, []);

  // Track page view on route change
  useEffect(() => {
    const currentPath = location.pathname;

    // Skip if same path (might be hash change)
    if (currentPath === lastPathRef.current) return;

    lastPathRef.current = currentPath;
    scrollDepthRef.current = 0;

    // Get page title
    const pageTitle = document.title || currentPath;

    // Track page view
    analytics.trackPageView(currentPath, pageTitle, user?.uid || null, !!user);
  }, [location.pathname, user]);

  // Set up scroll tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollDepth();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Initial scroll depth
    updateScrollDepth();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [updateScrollDepth]);

  // Track time on page when leaving
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = () => {
      analytics.trackTimeOnPage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        analytics.trackTimeOnPage();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

export default AnalyticsTracker;
