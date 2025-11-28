/**
 * Profile Settings Page
 *
 * Allows users to view and manage their profile settings,
 * including roles, preferences, and onboarding walkthrough.
 */

import Layout from "@theme/Layout";
import { useColorMode } from "@docusaurus/theme-common";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  AVAILABLE_ROLES,
  PROFILE_TEMPLATES,
  profileToRecommendations,
} from "../config/userProfiles";
import { resetOnboarding } from "../components/Onboarding/OnboardingWalkthrough";
import Link from "@docusaurus/Link";
import { newsService } from "../services/newsService";
import {
  NEWS_CATEGORY_CONFIG,
  DEFAULT_NEWS_PREFERENCES,
  type NewsCategory,
  type UserNewsPreferences,
} from "../types/news";
import { useToast } from "../contexts/ToastContext";
import {
  enablePushNotifications,
  isPushSupported,
  getNotificationPermission,
} from "../utils/pushNotifications";
import styles from "./profile-settings.module.css";

// localStorage key for profile confirmation
const PROFILE_CONFIRMED_KEY = "phoenix-docs-profile-confirmed";
const PROFILE_DATA_KEY = "phoenix-docs-user-profile";

// All available news categories
const ALL_CATEGORIES = Object.keys(NEWS_CATEGORY_CONFIG) as NewsCategory[];

export default function ProfileSettings(): React.ReactElement {
  const { user, loading, userProfile, updateUserRoles, logout, progress } =
    useAuth();
  const { colorMode, setColorMode } = useColorMode();
  const toast = useToast();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    userProfile.confirmedRoles,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showOnboardingReset, setShowOnboardingReset] = useState(false);
  const [showProfileReset, setShowProfileReset] = useState(false);

  // News preferences state
  const [newsPreferences, setNewsPreferences] = useState<
    Omit<UserNewsPreferences, "userId" | "createdAt" | "updatedAt">
  >(DEFAULT_NEWS_PREFERENCES);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  // Sync selected roles with userProfile when it loads
  React.useEffect(() => {
    if (userProfile.isProfileLoaded) {
      setSelectedRoles(userProfile.confirmedRoles);
    }
  }, [userProfile.isProfileLoaded, userProfile.confirmedRoles]);

  // Load news preferences when user is authenticated
  useEffect(() => {
    if (user) {
      setIsLoadingPreferences(true);
      newsService
        .getUserPreferences()
        .then((prefs) => {
          if (prefs) {
            setNewsPreferences({
              preferredCategories: prefs.preferredCategories || [],
              hiddenCategories: prefs.hiddenCategories || [],
              followedKeywords: prefs.followedKeywords || [],
              excludedKeywords: prefs.excludedKeywords || [],
              emailDigest: prefs.emailDigest || "none",
              pushNotifications: prefs.pushNotifications || false,
              readArticleIds: prefs.readArticleIds || [],
              savedArticleIds: prefs.savedArticleIds || [],
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load news preferences:", err);
        })
        .finally(() => {
          setIsLoadingPreferences(false);
        });
    }
  }, [user]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSaveRoles = async () => {
    setIsSaving(true);
    updateUserRoles(selectedRoles);

    // Show success message briefly
    setTimeout(() => {
      setIsSaving(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }, 500);
  };

  const handleRestartOnboarding = () => {
    resetOnboarding();
    setShowOnboardingReset(true);
    // Reload the page to trigger onboarding
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleResetProfile = () => {
    // Clear profile confirmation data from localStorage
    localStorage.removeItem(PROFILE_CONFIRMED_KEY);
    localStorage.removeItem(PROFILE_DATA_KEY);
    setShowProfileReset(true);
    // Reload to trigger profile confirmation modal
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSignOut = async () => {
    await logout();
    // Redirect to home after logout
    window.location.href = "/";
  };

  // News preferences handlers
  const handleCategoryToggle = (category: NewsCategory) => {
    setNewsPreferences((prev) => {
      const isPreferred = prev.preferredCategories.includes(category);
      const isHidden = prev.hiddenCategories.includes(category);

      if (isPreferred) {
        // Move from preferred to hidden
        return {
          ...prev,
          preferredCategories: prev.preferredCategories.filter((c) => c !== category),
          hiddenCategories: [...prev.hiddenCategories, category],
        };
      } else if (isHidden) {
        // Remove from hidden (neutral)
        return {
          ...prev,
          hiddenCategories: prev.hiddenCategories.filter((c) => c !== category),
        };
      } else {
        // Add to preferred
        return {
          ...prev,
          preferredCategories: [...prev.preferredCategories, category],
        };
      }
    });
  };

  const handleAddKeyword = () => {
    const keyword = newKeyword.trim().toLowerCase();
    if (keyword && !newsPreferences.followedKeywords.includes(keyword)) {
      setNewsPreferences((prev) => ({
        ...prev,
        followedKeywords: [...prev.followedKeywords, keyword],
      }));
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setNewsPreferences((prev) => ({
      ...prev,
      followedKeywords: prev.followedKeywords.filter((k) => k !== keyword),
    }));
  };

  const handleEmailDigestChange = (value: "none" | "daily" | "weekly") => {
    setNewsPreferences((prev) => ({
      ...prev,
      emailDigest: value,
    }));
  };

  const handlePushNotificationsToggle = async () => {
    // If trying to enable, request permission and get token
    if (!newsPreferences.pushNotifications) {
      if (!isPushSupported()) {
        toast.error("Push notifications are not supported in this browser.");
        return;
      }

      const currentPermission = getNotificationPermission();
      if (currentPermission === "denied") {
        toast.error("Notifications are blocked. Please enable them in your browser settings.");
        return;
      }

      toast.info("Requesting notification permission...");

      const result = await enablePushNotifications();

      if (!result.success) {
        toast.error(result.error || "Failed to enable push notifications.");
        return;
      }

      // Subscribe to breaking news with the FCM token
      try {
        await newsService.subscribeToBreakingNews({
          categories: newsPreferences.preferredCategories,
          pushEnabled: true,
          emailEnabled: newsPreferences.emailDigest !== "none",
        });

        setNewsPreferences((prev) => ({
          ...prev,
          pushNotifications: true,
        }));

        toast.success("Push notifications enabled!");
      } catch (err) {
        console.error("Failed to subscribe:", err);
        toast.error("Failed to enable push notifications. Please try again.");
      }
    } else {
      // Disable push notifications
      try {
        await newsService.unsubscribeFromBreakingNews();
        setNewsPreferences((prev) => ({
          ...prev,
          pushNotifications: false,
        }));
        toast.success("Push notifications disabled.");
      } catch (err) {
        console.error("Failed to unsubscribe:", err);
        toast.error("Failed to disable push notifications.");
      }
    }
  };

  const handleSaveNewsPreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await newsService.saveUserPreferences({
        preferredCategories: newsPreferences.preferredCategories,
        hiddenCategories: newsPreferences.hiddenCategories,
        followedKeywords: newsPreferences.followedKeywords,
        excludedKeywords: newsPreferences.excludedKeywords,
        emailDigest: newsPreferences.emailDigest,
        pushNotifications: newsPreferences.pushNotifications,
      });
      toast.success("News preferences saved!");
    } catch (err) {
      console.error("Failed to save news preferences:", err);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (loading) {
    return (
      <Layout
        title="Profile Settings"
        description="Manage your profile settings"
      >
        <main className="container margin-vert--xl">
          <div className={styles.loading}>Loading...</div>
        </main>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout
        title="Profile Settings"
        description="Manage your profile settings"
      >
        <main className="container margin-vert--xl">
          <div className={styles.signInPrompt}>
            <h1 className={styles.heroTitle}>Profile Settings</h1>
            <p className={styles.heroDescription}>
              Sign in to manage your profile settings and personalize your
              documentation experience.
            </p>
            <Link
              to="/your-progress"
              className="button button--primary button--lg"
            >
              Sign In
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  const { knownProfile, profileKey } = userProfile;
  const hasChanges =
    JSON.stringify(selectedRoles.sort()) !==
    JSON.stringify(userProfile.confirmedRoles.sort());

  // Calculate recommendation completion stats
  const getRecommendationStats = () => {
    // Get recommended docs based on profile or template
    let recommendedDocs: string[] = [];

    if (knownProfile) {
      const recs = profileToRecommendations(knownProfile, 10);
      recommendedDocs = recs.map((r) => r.docId);
    } else if (profileKey && profileKey in PROFILE_TEMPLATES) {
      const template = PROFILE_TEMPLATES[profileKey];
      if (template.recommendedPaths) {
        recommendedDocs = template.recommendedPaths.map((p) => p.docId);
      }
    }

    if (recommendedDocs.length === 0) {
      return null;
    }

    // Count completed docs
    const completedCount = recommendedDocs.filter((docId) => {
      const docKey = docId.replace(/^\/docs\//, "");
      return (
        progress?.docs?.[docKey]?.completed ||
        progress?.docs?.[docId]?.completed
      );
    }).length;

    return {
      completed: completedCount,
      total: recommendedDocs.length,
      percentage: Math.round((completedCount / recommendedDocs.length) * 100),
    };
  };

  const recommendationStats = getRecommendationStats();

  return (
    <Layout title="Profile Settings" description="Manage your profile settings">
      <main className="container margin-vert--xl">
        <div className="row">
          <div className="col col--12">
            <header className={styles.hero}>
              <h1 className={styles.heroTitle}>Profile Settings</h1>
              <p className={styles.heroDescription}>
                Customize your documentation experience
              </p>
            </header>
          </div>
        </div>

        {/* Profile Overview */}
        <section className="row margin-bottom--lg">
          <div className="col col--8 col--offset-2">
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "User"} />
                  ) : (
                    <span className={styles.avatarFallback}>
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <h2 className={styles.userName}>
                    {user.displayName || "User"}
                  </h2>
                  <p className={styles.userEmail}>{user.email}</p>
                  {knownProfile && (
                    <span className={styles.profileBadge}>
                      Internal Team Member
                    </span>
                  )}
                </div>
              </div>

              {knownProfile && (
                <div className={styles.profileDescription}>
                  <strong>Profile:</strong> {knownProfile.profileDescription}
                </div>
              )}

              {/* Recommendation completion stats */}
              {recommendationStats && (
                <div className={styles.recommendationStats}>
                  <div className={styles.statsHeader}>
                    <span className={styles.statsLabel}>
                      Recommended Reading Progress
                    </span>
                    <span className={styles.statsValue}>
                      {recommendationStats.completed}/
                      {recommendationStats.total} docs
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${recommendationStats.percentage}%` }}
                    />
                  </div>
                  <span className={styles.statsPercentage}>
                    {recommendationStats.percentage}% complete
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Role Selection */}
        <section className="row margin-bottom--lg">
          <div className="col col--8 col--offset-2">
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Your Roles</h3>
              <p className={styles.sectionDescription}>
                Select the roles that best describe your focus areas. This helps
                us personalize your documentation recommendations.
              </p>

              <div className={styles.roleGrid}>
                {AVAILABLE_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`${styles.roleChip} ${
                      selectedRoles.includes(role)
                        ? styles.roleChipSelected
                        : ""
                    }`}
                    onClick={() => handleRoleToggle(role)}
                  >
                    <span className={styles.roleCheck}>
                      {selectedRoles.includes(role) ? "✓" : ""}
                    </span>
                    {role}
                  </button>
                ))}
              </div>

              <div className={styles.saveSection}>
                {showSaveSuccess && (
                  <span className={styles.saveSuccess}>
                    Roles saved successfully!
                  </span>
                )}
                <button
                  type="button"
                  className={`button button--primary ${styles.saveButton}`}
                  onClick={handleSaveRoles}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? "Saving..." : "Save Roles"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Onboarding Section */}
        <section className="row margin-bottom--lg">
          <div className="col col--8 col--offset-2">
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Onboarding Walkthrough</h3>
              <p className={styles.sectionDescription}>
                The onboarding walkthrough helps you understand the key features
                of the documentation site.
              </p>

              {showOnboardingReset ? (
                <div className={styles.onboardingReset}>
                  <span className={styles.resetIcon}>✓</span>
                  Restarting walkthrough...
                </div>
              ) : (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={handleRestartOnboarding}
                >
                  Restart Walkthrough
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="row margin-bottom--lg">
          <div className="col col--8 col--offset-2">
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Preferences</h3>
              <p className={styles.sectionDescription}>
                Customize your viewing experience.
              </p>

              <div className={styles.accountActions}>
                <div className={styles.accountAction}>
                  <div>
                    <h4 className={styles.accountActionTitle}>
                      Dark Mode
                    </h4>
                    <p className={styles.accountActionDesc}>
                      Switch between light and dark themes for better readability.
                    </p>
                  </div>
                  <div className={styles.toggleContainer}>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${colorMode === "light" ? styles.toggleActive : ""}`}
                      onClick={() => setColorMode("light")}
                      aria-pressed={colorMode === "light"}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${colorMode === "dark" ? styles.toggleActive : ""}`}
                      onClick={() => setColorMode("dark")}
                      aria-pressed={colorMode === "dark"}
                    >
                      Dark
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* News Personalization Section */}
        <section className="row margin-bottom--lg">
          <div className="col col--8 col--offset-2">
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>News Personalization</h3>
              <p className={styles.sectionDescription}>
                Customize your news feed by selecting preferred categories and keywords.
              </p>

              {isLoadingPreferences ? (
                <div className={styles.loading}>Loading preferences...</div>
              ) : (
                <>
                  {/* Category Selection */}
                  <div className={styles.preferencesSection}>
                    <h4 className={styles.preferencesSubtitle}>News Categories</h4>
                    <p className={styles.preferencesHint}>
                      Click to cycle: Preferred → Hidden → Neutral
                    </p>
                    <div className={styles.categoryGrid}>
                      {ALL_CATEGORIES.map((category) => {
                        const config = NEWS_CATEGORY_CONFIG[category];
                        const isPreferred = newsPreferences.preferredCategories.includes(category);
                        const isHidden = newsPreferences.hiddenCategories.includes(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            className={`${styles.categoryChip} ${
                              isPreferred ? styles.categoryPreferred : ""
                            } ${isHidden ? styles.categoryHidden : ""}`}
                            onClick={() => handleCategoryToggle(category)}
                            title={
                              isPreferred
                                ? "Preferred - Click to hide"
                                : isHidden
                                ? "Hidden - Click to reset"
                                : "Neutral - Click to prefer"
                            }
                          >
                            <span className={styles.categoryIcon}>{config.icon}</span>
                            <span className={styles.categoryLabel}>{config.label}</span>
                            {isPreferred && <span className={styles.categoryStatus}>★</span>}
                            {isHidden && <span className={styles.categoryStatus}>✕</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className={styles.preferencesSection}>
                    <h4 className={styles.preferencesSubtitle}>Followed Keywords</h4>
                    <p className={styles.preferencesHint}>
                      Add keywords to prioritize related news articles.
                    </p>
                    <div className={styles.keywordInput}>
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                        placeholder="Add keyword..."
                        className={styles.keywordField}
                      />
                      <button
                        type="button"
                        className="button button--sm button--secondary"
                        onClick={handleAddKeyword}
                        disabled={!newKeyword.trim()}
                      >
                        Add
                      </button>
                    </div>
                    {newsPreferences.followedKeywords.length > 0 && (
                      <div className={styles.keywordList}>
                        {newsPreferences.followedKeywords.map((keyword) => (
                          <span key={keyword} className={styles.keywordTag}>
                            {keyword}
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(keyword)}
                              className={styles.keywordRemove}
                              aria-label={`Remove ${keyword}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Email Digest */}
                  <div className={styles.preferencesSection}>
                    <h4 className={styles.preferencesSubtitle}>Email Digest</h4>
                    <p className={styles.preferencesHint}>
                      Receive a summary of news relevant to your interests.
                    </p>
                    <div className={styles.digestOptions}>
                      {(["none", "daily", "weekly"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`${styles.digestOption} ${
                            newsPreferences.emailDigest === option ? styles.digestActive : ""
                          }`}
                          onClick={() => handleEmailDigestChange(option)}
                        >
                          {option === "none" ? "Off" : option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className={styles.preferencesSection}>
                    <div className={styles.accountAction}>
                      <div>
                        <h4 className={styles.preferencesSubtitle}>Push Notifications</h4>
                        <p className={styles.preferencesHint}>
                          Get notified about breaking news and important updates.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${
                          newsPreferences.pushNotifications ? styles.toggleActive : ""
                        }`}
                        onClick={handlePushNotificationsToggle}
                        aria-pressed={newsPreferences.pushNotifications}
                      >
                        {newsPreferences.pushNotifications ? "On" : "Off"}
                      </button>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className={styles.saveSection}>
                    <button
                      type="button"
                      className={`button button--primary ${styles.saveButton}`}
                      onClick={handleSaveNewsPreferences}
                      disabled={isSavingPreferences}
                    >
                      {isSavingPreferences ? "Saving..." : "Save News Preferences"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="row margin-bottom--lg">
          <div className="col col--8 col--offset-2">
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Account</h3>

              <div className={styles.accountActions}>
                <div className={styles.accountAction}>
                  <div>
                    <h4 className={styles.accountActionTitle}>
                      Reset Profile Selection
                    </h4>
                    <p className={styles.accountActionDesc}>
                      Clear your profile data and select a new profile template
                      on next visit.
                    </p>
                  </div>
                  {showProfileReset ? (
                    <div className={styles.onboardingReset}>
                      <span className={styles.resetIcon}>✓</span>
                      Resetting...
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={handleResetProfile}
                    >
                      Reset Profile
                    </button>
                  )}
                </div>

                <div className={styles.accountAction}>
                  <div>
                    <h4 className={styles.accountActionTitle}>Sign Out</h4>
                    <p className={styles.accountActionDesc}>
                      Sign out of your account. Your progress will be saved.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`button button--secondary ${styles.signOutBtn}`}
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="row">
          <div className="col col--8 col--offset-2">
            <div className={styles.quickLinks}>
              <Link to="/your-progress" className={styles.quickLink}>
                <span className={styles.quickLinkIcon}>📊</span>
                <span>View Progress</span>
              </Link>
              <Link to="/docs" className={styles.quickLink}>
                <span className={styles.quickLinkIcon}>📚</span>
                <span>Browse Docs</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
