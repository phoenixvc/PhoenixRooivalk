/**
 * Navbar Notifications Component
 *
 * Manages notification badge state and injects CSS for badge visibility.
 * Uses a context-based approach instead of direct DOM manipulation.
 */

import { useEffect } from "react";
import { useNotificationBadges } from "../../contexts/NotificationBadgeContext";

/**
 * This component injects CSS custom properties to control badge visibility.
 * The actual badges are rendered via CSS pseudo-elements on navbar links.
 */
export function NavbarNotifications(): null {
  const { hasNewNews, hasNewSupport, markNewsSeen, markSupportSeen } =
    useNotificationBadges();

  // Update CSS custom properties for badge visibility
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    root.style.setProperty(
      "--navbar-news-badge-display",
      hasNewNews ? "block" : "none",
    );
    root.style.setProperty(
      "--navbar-support-badge-display",
      hasNewSupport ? "block" : "none",
    );
  }, [hasNewNews, hasNewSupport]);

  // Track page visits to mark notifications as seen
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAndMarkSeen = () => {
      const path = window.location.pathname;
      if (path === "/news" || path === "/news/") {
        markNewsSeen();
      } else if (path === "/support" || path === "/support/") {
        markSupportSeen();
      }
    };

    // Check on initial load
    checkAndMarkSeen();

    // Listen for navigation changes via popstate
    const handlePopState = () => {
      checkAndMarkSeen();
    };

    window.addEventListener("popstate", handlePopState);

    // Use a simpler approach: check periodically for URL changes
    // This avoids the expensive MutationObserver on the entire page
    let lastPath = window.location.pathname;
    const checkInterval = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        lastPath = currentPath;
        checkAndMarkSeen();
      }
    }, 500);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      clearInterval(checkInterval);
    };
  }, [markNewsSeen, markSupportSeen]);

  // This component doesn't render anything visible
  return null;
}

export default NavbarNotifications;
