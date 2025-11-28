/**
 * Navbar Notifications Component
 *
 * Adds notification badges to News and Support navbar links
 * when there's new content the user hasn't seen.
 */

import { useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";

const NEWS_LAST_SEEN_KEY = "phoenix-news-last-seen";
const SUPPORT_LAST_SEEN_KEY = "phoenix-support-last-seen";

// Simulated timestamps for new content - in a real app, these would come from the backend
const LATEST_NEWS_TIMESTAMP = new Date("2025-11-28").getTime();
const LATEST_SUPPORT_TIMESTAMP = new Date("2025-11-25").getTime();

export function NavbarNotifications(): null {
  const { user } = useAuth();

  const updateNotificationBadges = useCallback(() => {
    if (typeof window === "undefined") return;

    // Get last seen timestamps from localStorage
    const newsLastSeen = parseInt(
      localStorage.getItem(NEWS_LAST_SEEN_KEY) || "0",
      10
    );
    const supportLastSeen = parseInt(
      localStorage.getItem(SUPPORT_LAST_SEEN_KEY) || "0",
      10
    );

    // Find navbar links
    const newsLink = document.querySelector(".navbar__link--news");
    const supportLink = document.querySelector(".navbar__link--support");

    // Update news badge
    if (newsLink) {
      const hasNewNews = LATEST_NEWS_TIMESTAMP > newsLastSeen;
      if (hasNewNews) {
        newsLink.setAttribute("data-has-new", "true");
      } else {
        newsLink.removeAttribute("data-has-new");
      }
    }

    // Update support badge (only for logged-in users)
    if (supportLink) {
      const hasNewSupport = user && LATEST_SUPPORT_TIMESTAMP > supportLastSeen;
      if (hasNewSupport) {
        supportLink.setAttribute("data-has-new", "true");
      } else {
        supportLink.removeAttribute("data-has-new");
      }
    }
  }, [user]);

  // Mark news as seen when visiting the news page
  const handleNewsSeen = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(NEWS_LAST_SEEN_KEY, Date.now().toString());
    updateNotificationBadges();
  }, [updateNotificationBadges]);

  // Mark support as seen when visiting the support page
  const handleSupportSeen = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SUPPORT_LAST_SEEN_KEY, Date.now().toString());
    updateNotificationBadges();
  }, [updateNotificationBadges]);

  useEffect(() => {
    // Initial update
    updateNotificationBadges();

    // Check if we're on the news or support page and mark as seen
    const path = window.location.pathname;
    if (path === "/news" || path === "/news/") {
      handleNewsSeen();
    } else if (path === "/support" || path === "/support/") {
      handleSupportSeen();
    }

    // Listen for navigation changes
    const handleNavigation = () => {
      const currentPath = window.location.pathname;
      if (currentPath === "/news" || currentPath === "/news/") {
        handleNewsSeen();
      } else if (currentPath === "/support" || currentPath === "/support/") {
        handleSupportSeen();
      }
      updateNotificationBadges();
    };

    // Use MutationObserver to detect Docusaurus navigation
    const observer = new MutationObserver(() => {
      handleNavigation();
    });

    const mainWrapper = document.querySelector(".main-wrapper");
    if (mainWrapper) {
      observer.observe(mainWrapper, { childList: true, subtree: true });
    }

    // Also update on popstate for browser back/forward
    window.addEventListener("popstate", handleNavigation);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", handleNavigation);
    };
  }, [updateNotificationBadges, handleNewsSeen, handleSupportSeen]);

  // This component doesn't render anything
  return null;
}

export default NavbarNotifications;
