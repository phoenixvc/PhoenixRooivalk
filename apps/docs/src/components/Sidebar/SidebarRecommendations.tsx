/**
 * Sidebar Recommendations Widget
 *
 * AI-powered personalized recommendations shown in the sidebar.
 * Analyzes logged-in user's reading history and suggests relevant docs.
 * Highlights recommended categories dynamically.
 *
 * For known internal users, uses pre-defined recommendations from userProfiles.
 */

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { aiService, ReadingRecommendation } from "../../services/aiService";
import {
  profileToRecommendations,
  PROFILE_TEMPLATES,
  UserProfile,
  getRecommendationsForRoles,
} from "../../config/userProfiles";
import Link from "@docusaurus/Link";
import "./SidebarRecommendations.css";

interface SidebarRecommendationsProps {
  /** Maximum number of recommendations to show */
  maxItems?: number;
}

/**
 * Extract category from doc path
 * e.g., "/docs/business/market-analysis" -> "business"
 */
function getCategoryFromPath(path: string): string {
  const match = path.match(/\/docs\/([^/]+)/);
  return match ? match[1] : "";
}

/**
 * Format document path to readable title
 */
function formatDocTitle(docPath: string): string {
  const name = docPath.split("/").pop() || docPath;
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get category emoji
 */
function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    executive: "📊",
    technical: "🔧",
    business: "💼",
    operations: "🚀",
    legal: "⚖️",
    research: "🔬",
    resources: "📚",
  };
  return emojis[category.toLowerCase()] || "📄";
}

/**
 * Highlight recommended sidebar items using CSS
 */
function highlightSidebarItems(recommendedPaths: string[]): void {
  if (typeof document === "undefined") return;

  // Remove existing highlights
  document.querySelectorAll(".menu__link--recommended").forEach((el) => {
    el.classList.remove("menu__link--recommended");
  });

  // Add highlights to recommended items
  recommendedPaths.forEach((path) => {
    const normalizedPath = path.replace(/^\/docs/, "").replace(/\/$/, "");
    const links = document.querySelectorAll(
      `.menu__link[href*="${normalizedPath}"]`,
    );
    links.forEach((link) => {
      link.classList.add("menu__link--recommended");
    });
  });
}

export function SidebarRecommendations({
  maxItems = 5,
}: SidebarRecommendationsProps): React.ReactElement | null {
  const { user, progress, userProfile } = useAuth();
  const [recommendations, setRecommendations] = useState<
    ReadingRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const previousUserIdRef = useRef<string | null>(null);

  // Use centralized profile from AuthContext
  const { knownProfile, isProfileLoaded, profileKey, confirmedRoles } = userProfile;

  // Get selected template for unknown users
  const selectedTemplate =
    !knownProfile && profileKey && profileKey in PROFILE_TEMPLATES
      ? PROFILE_TEMPLATES[profileKey]
      : null;

  // Reset state when user changes (fixes loadedRef persistence bug)
  useEffect(() => {
    const currentUserId = user?.uid || null;
    if (previousUserIdRef.current !== currentUserId) {
      // User changed - reset recommendations state
      previousUserIdRef.current = currentUserId;
      setHasLoaded(false);
      setRecommendations([]);
      // Clear sidebar highlights
      highlightSidebarItems([]);
    }
  }, [user?.uid]);

  // Derive user profile description from reading history (for unknown users)
  const deriveProfileDescription = useCallback((): string => {
    // If known user, use their profile description
    if (knownProfile) {
      return knownProfile.profileDescription;
    }

    // If unknown user selected a template, use template description
    if (selectedTemplate?.profileDescription) {
      return selectedTemplate.profileDescription;
    }

    if (!progress?.docs) return "new user";

    const completedDocs = Object.entries(progress.docs)
      .filter(([, data]) => data.completed)
      .map(([docId]) => docId);

    // Count docs by category
    const categoryCounts: Record<string, number> = {};
    completedDocs.forEach((docId) => {
      const category = getCategoryFromPath(docId);
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    // Find most read category
    const topCategory = Object.entries(categoryCounts).sort(
      ([, a], [, b]) => b - a,
    )[0]?.[0];

    if (completedDocs.length === 0) {
      return "new user starting their journey";
    } else if (completedDocs.length < 5) {
      return "beginner exploring the documentation";
    } else if (topCategory === "executive") {
      return "executive interested in business strategy and ROI";
    } else if (topCategory === "technical") {
      return "technical professional focused on architecture and implementation";
    } else if (topCategory === "business") {
      return "business professional focused on market and opportunities";
    } else if (topCategory === "operations") {
      return "operations specialist focused on deployment and maintenance";
    } else {
      return `experienced user with focus on ${topCategory || "general"} content`;
    }
  }, [progress, knownProfile, selectedTemplate]);

  const fetchRecommendations = useCallback(async () => {
    if (!user || hasLoaded) return;

    setIsLoading(true);

    try {
      // For known internal users, use pre-defined recommendations
      if (knownProfile) {
        const profileRecs = profileToRecommendations(knownProfile, maxItems);
        const recs: ReadingRecommendation[] = profileRecs.map((r) => ({
          docId: r.docId,
          relevanceScore: r.relevanceScore,
          reason: r.reason,
        }));
        setRecommendations(recs);
        highlightSidebarItems(recs.map((r) => r.docId));
        setHasLoaded(true);
        setIsLoading(false);
        return;
      }

      // For unknown users who selected a template, use template recommendations
      if (selectedTemplate?.recommendedPaths) {
        const templateAsProfile = {
          ...selectedTemplate,
          name: "Your",
          recommendedPaths: selectedTemplate.recommendedPaths,
        } as UserProfile;
        const templateRecs = profileToRecommendations(
          templateAsProfile,
          maxItems,
        );
        const recs: ReadingRecommendation[] = templateRecs.map((r) => ({
          docId: r.docId,
          relevanceScore: r.relevanceScore,
          reason: r.reason,
        }));
        setRecommendations(recs);
        highlightSidebarItems(recs.map((r) => r.docId));
        setHasLoaded(true);
        setIsLoading(false);
        return;
      }

      // For users with confirmed roles but no template, use role-based recommendations
      if (confirmedRoles && confirmedRoles.length > 0) {
        const roleRecs = getRecommendationsForRoles(confirmedRoles, maxItems);
        if (roleRecs.length > 0) {
          setRecommendations(roleRecs);
          highlightSidebarItems(roleRecs.map((r) => r.docId));
          setHasLoaded(true);
          setIsLoading(false);
          return;
        }
      }

      // For unknown users without template or roles, use AI-generated recommendations
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";
      const result = await aiService.getReadingRecommendations(currentPath);

      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations.slice(0, maxItems));
        // Highlight recommended items in sidebar
        highlightSidebarItems(result.recommendations.map((r) => r.docId));
      }
      setHasLoaded(true);
    } catch {
      // Silently fail - recommendations are supplementary
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [user, maxItems, knownProfile, selectedTemplate, confirmedRoles, hasLoaded]);

  // Load recommendations when user and profile are available
  // Wait for isProfileLoaded to avoid stale closure with knownProfile
  useEffect(() => {
    if (user && isProfileLoaded && !hasLoaded) {
      // Small delay to not block initial render
      const timer = setTimeout(fetchRecommendations, 500);
      return () => clearTimeout(timer);
    }
  }, [user, isProfileLoaded, hasLoaded, fetchRecommendations]);

  // Don't render for unauthenticated users
  if (!user) {
    return null;
  }

  // Show loading skeleton while waiting for profile to load
  if (!isProfileLoaded || (!hasLoaded && !isLoading)) {
    return (
      <div className="sidebar-rec">
        <div className="sidebar-rec-skeleton">
          <span className="sidebar-rec-skeleton-icon" />
          <span className="sidebar-rec-skeleton-text" />
          <span className="sidebar-rec-skeleton-toggle" />
        </div>
      </div>
    );
  }

  const userProfileDescription = deriveProfileDescription();
  const completedCount = progress?.docs
    ? Object.values(progress.docs).filter((d) => d.completed).length
    : 0;

  return (
    <div className="sidebar-rec">
      <button
        className="sidebar-rec-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        type="button"
      >
        <span className="sidebar-rec-icon">✨</span>
        <span className="sidebar-rec-title">For You</span>
        <span className="sidebar-rec-toggle">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div className="sidebar-rec-content">
          {isLoading ? (
            <div className="sidebar-rec-loading">
              <span className="sidebar-rec-spinner" />
              Analyzing your interests...
            </div>
          ) : (
            <>
              <div className="sidebar-rec-profile">
                <span className="sidebar-rec-profile-label">
                  {knownProfile ? `${knownProfile.name}'s Focus:` : "Profile:"}
                </span>
                <span className="sidebar-rec-profile-text">
                  {userProfileDescription}
                </span>
              </div>

              {recommendations.length > 0 ? (
                <>
                  {/* Show completion progress for recommendations (known profiles, templates, or roles) */}
                  {(knownProfile || selectedTemplate || (confirmedRoles && confirmedRoles.length > 0)) && (
                    <div className="sidebar-rec-progress-summary">
                      {
                        recommendations.filter((rec) => {
                          // Normalize doc key - handle both /docs/path and path formats
                          const docKey = rec.docId.replace(/^\/docs\//, "");
                          // Check both normalized and original formats
                          return (
                            progress?.docs?.[docKey]?.completed ||
                            progress?.docs?.[rec.docId]?.completed
                          );
                        }).length
                      }
                      /{recommendations.length} completed
                    </div>
                  )}
                  <ul className="sidebar-rec-list">
                    {recommendations.map((rec) => {
                      const category = getCategoryFromPath(rec.docId);
                      // Normalize doc key - handle both /docs/path and path formats
                      const docKey = rec.docId.replace(/^\/docs\//, "");
                      const isCompleted =
                        progress?.docs?.[docKey]?.completed ||
                        progress?.docs?.[rec.docId]?.completed;
                      return (
                        <li key={rec.docId} className="sidebar-rec-item">
                          <Link
                            to={rec.docId}
                            className={`sidebar-rec-link ${isCompleted ? "sidebar-rec-link--completed" : ""}`}
                          >
                            <span className="sidebar-rec-emoji">
                              {isCompleted ? "✓" : getCategoryEmoji(category)}
                            </span>
                            <span className="sidebar-rec-doc">
                              {formatDocTitle(rec.docId)}
                            </span>
                            <span className="sidebar-rec-score">
                              {Math.round(rec.relevanceScore * 100)}%
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <div className="sidebar-rec-empty">
                  {completedCount === 0
                    ? "Start reading to get personalized recommendations!"
                    : "Keep exploring for more recommendations."}
                </div>
              )}

              <Link to="/your-progress" className="sidebar-rec-progress-link">
                View Full Progress →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SidebarRecommendations;
