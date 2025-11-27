/**
 * Profile Settings Page
 *
 * Allows users to view and manage their profile settings,
 * including roles, preferences, and onboarding walkthrough.
 */

import Layout from "@theme/Layout";
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AVAILABLE_ROLES } from "../config/userProfiles";
import { resetOnboarding } from "../components/Onboarding/OnboardingWalkthrough";
import Link from "@docusaurus/Link";
import styles from "./profile-settings.module.css";

export default function ProfileSettings(): React.ReactElement {
  const { user, loading, userProfile, updateUserRoles } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    userProfile.confirmedRoles,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showOnboardingReset, setShowOnboardingReset] = useState(false);

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

  const { knownProfile } = userProfile;
  const hasChanges =
    JSON.stringify(selectedRoles.sort()) !==
    JSON.stringify(userProfile.confirmedRoles.sort());

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
                      selectedRoles.includes(role) ? styles.roleChipSelected : ""
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
