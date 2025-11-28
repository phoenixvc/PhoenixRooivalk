/**
 * Profile Settings Page
 *
 * Allows users to view and manage their profile settings,
 * including roles, preferences, and onboarding walkthrough.
 */

import Layout from "@theme/Layout";
import { useColorMode } from "@docusaurus/theme-common";
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  AVAILABLE_ROLES,
  PROFILE_TEMPLATES,
  profileToRecommendations,
} from "../config/userProfiles";
import { resetOnboarding } from "../components/Onboarding/OnboardingWalkthrough";
import Link from "@docusaurus/Link";
import styles from "./profile-settings.module.css";

// localStorage key for profile confirmation
const PROFILE_CONFIRMED_KEY = "phoenix-docs-profile-confirmed";
const PROFILE_DATA_KEY = "phoenix-docs-user-profile";

export default function ProfileSettings(): React.ReactElement {
  const { user, loading, userProfile, updateUserRoles, logout, progress } =
    useAuth();
  const { colorMode, setColorMode } = useColorMode();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    userProfile.confirmedRoles,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showOnboardingReset, setShowOnboardingReset] = useState(false);
  const [showProfileReset, setShowProfileReset] = useState(false);

  // Sync selected roles with userProfile when it loads
  React.useEffect(() => {
    if (userProfile.isProfileLoaded) {
      setSelectedRoles(userProfile.confirmedRoles);
    }
  }, [userProfile.isProfileLoaded, userProfile.confirmedRoles]);

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
