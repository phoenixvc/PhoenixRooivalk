/**
 * News Notification Bell Component
 *
 * Displays notification bell for breaking news alerts with
 * subscription management and unread count.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { newsService, NewsError } from "../../services/newsService";
import "./NewsNotificationBell.css";

interface NewsNotificationBellProps {
  /** Position of the dropdown */
  position?: "left" | "right";
}

export function NewsNotificationBell({
  position = "right",
}: NewsNotificationBellProps): React.ReactElement | null {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount] = useState(0);

  const categories = [
    { id: "counter-uas", label: "Counter-UAS" },
    { id: "defense-tech", label: "Defense Tech" },
    { id: "drone-industry", label: "Drone Industry" },
    { id: "regulatory", label: "Regulatory" },
    { id: "market-analysis", label: "Market Analysis" },
  ];

  // Fetch subscription status on mount
  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      try {
        // This would be implemented in the service
        // For now, we'll use localStorage as a fallback
        const saved = localStorage.getItem("newsNotifications");
        if (saved) {
          const data = JSON.parse(saved);
          setIsSubscribed(data.isSubscribed);
          setSelectedCategories(data.categories || []);
          setPushEnabled(data.pushEnabled ?? true);
          setEmailEnabled(data.emailEnabled ?? false);
        }
      } catch (err) {
        console.error("Error fetching subscription:", err);
      }
    };

    fetchSubscription();
  }, [user]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setError("Notifications not supported in this browser");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      setError("Notifications blocked. Enable in browser settings.");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }, []);

  // Handle subscription toggle
  const handleSubscribe = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isSubscribed) {
        // Unsubscribe
        await newsService.unsubscribeFromBreakingNews();
        setIsSubscribed(false);
        localStorage.removeItem("newsNotifications");
      } else {
        // Subscribe
        if (pushEnabled) {
          const hasPermission = await requestNotificationPermission();
          if (!hasPermission) {
            setPushEnabled(false);
          }
        }

        await newsService.subscribeToBreakingNews({
          categories:
            selectedCategories.length > 0 ? selectedCategories : undefined,
          pushEnabled,
          emailEnabled,
        });

        setIsSubscribed(true);

        // Save to localStorage as backup
        localStorage.setItem(
          "newsNotifications",
          JSON.stringify({
            isSubscribed: true,
            categories: selectedCategories,
            pushEnabled,
            emailEnabled,
          }),
        );
      }
    } catch (err) {
      if (err instanceof NewsError) {
        setError(err.message);
      } else {
        setError("Failed to update subscription");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId],
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".news-notification-bell")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Only show for authenticated users
  if (!user) {
    return null;
  }

  return (
    <div className="news-notification-bell">
      <button
        className={`news-notification-btn ${isSubscribed ? "subscribed" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="News notifications"
        aria-expanded={isOpen}
      >
        <span className="news-notification-icon">
          {isSubscribed ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
          )}
        </span>
        {unreadCount > 0 && (
          <span className="news-notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`news-notification-dropdown ${position}`}>
          <div className="news-notification-header">
            <h4>Breaking News Alerts</h4>
            <button
              className="news-notification-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              x
            </button>
          </div>

          {error && <div className="news-notification-error">{error}</div>}

          <div className="news-notification-content">
            <p className="news-notification-desc">
              Get notified when breaking news is published in your areas of
              interest.
            </p>

            <div className="news-notification-options">
              <label className="news-notification-option">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Push notifications</span>
              </label>
              <label className="news-notification-option">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Email notifications</span>
              </label>
            </div>

            <div className="news-notification-categories">
              <span className="news-notification-categories-label">
                Categories (leave empty for all):
              </span>
              <div className="news-notification-category-list">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={`news-notification-category ${
                      selectedCategories.includes(category.id) ? "selected" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      disabled={isLoading}
                    />
                    <span>{category.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="news-notification-footer">
            <button
              className={`news-notification-subscribe ${isSubscribed ? "unsubscribe" : ""}`}
              onClick={handleSubscribe}
              disabled={isLoading || (!pushEnabled && !emailEnabled)}
            >
              {isLoading
                ? "Processing..."
                : isSubscribed
                  ? "Unsubscribe"
                  : "Subscribe to Alerts"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsNotificationBell;
