/**
 * Profile Confirmation Component
 *
 * Shows after login if the user matches a known internal profile.
 * Allows them to confirm their roles and continue to the documentation.
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getUserProfile as getKnownUserProfile,
  UserProfile,
  INTERNAL_USER_PROFILES,
  PROFILE_TEMPLATES,
  AVAILABLE_ROLES,
} from "../../config/userProfiles";
import "./ProfileConfirmation.css";

const PROFILE_CONFIRMED_KEY = "phoenix-docs-profile-confirmed";
const PROFILE_DATA_KEY = "phoenix-docs-user-profile";
const PROFILE_CONFIRMATION_PENDING_KEY = "phoenix-docs-profile-pending";

interface ProfileConfirmationProps {
  children: React.ReactNode;
}

/**
 * Check if profile has been confirmed for this user
 */
function isProfileConfirmed(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const confirmed = localStorage.getItem(PROFILE_CONFIRMED_KEY);
    if (!confirmed) return false;
    const data = JSON.parse(confirmed);
    return data.userId === userId && data.confirmed === true;
  } catch {
    return false;
  }
}

/**
 * Save profile confirmation
 */
function saveProfileConfirmation(
  userId: string,
  profileKey: string,
  roles: string[],
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PROFILE_CONFIRMED_KEY,
    JSON.stringify({
      userId,
      profileKey,
      confirmed: true,
      confirmedAt: new Date().toISOString(),
    }),
  );
  localStorage.setItem(
    PROFILE_DATA_KEY,
    JSON.stringify({
      profileKey,
      roles,
    }),
  );
}

/**
 * Get saved profile data
 */
export function getSavedProfile(): {
  profileKey: string;
  roles: string[];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(PROFILE_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Check if profile confirmation modal is currently pending
 * Used by OnboardingWalkthrough to avoid showing both modals at once
 */
export function isProfileConfirmationPending(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PROFILE_CONFIRMATION_PENDING_KEY) === "true";
}

/**
 * Set profile confirmation pending state
 */
function setProfileConfirmationPending(pending: boolean): void {
  if (typeof window === "undefined") return;
  if (pending) {
    localStorage.setItem(PROFILE_CONFIRMATION_PENDING_KEY, "true");
  } else {
    localStorage.removeItem(PROFILE_CONFIRMATION_PENDING_KEY);
  }
}

export function ProfileConfirmation({
  children,
}: ProfileConfirmationProps): React.ReactElement {
  const { user, loading } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [detectedProfile, setDetectedProfile] = useState<UserProfile | null>(
    null,
  );
  const [detectedProfileKey, setDetectedProfileKey] = useState<string>("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUnknownUser, setIsUnknownUser] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Check for known profile on user change
  useEffect(() => {
    if (!user || loading) return;

    // Check if already confirmed
    if (isProfileConfirmed(user.uid)) {
      setShowConfirmation(false);
      setIsUnknownUser(false);
      return;
    }

    // Try to detect known profile
    const profile = getKnownUserProfile(user.email, user.displayName);
    if (profile) {
      // Find the profile key
      for (const [key, p] of Object.entries(INTERNAL_USER_PROFILES)) {
        if (p.name === profile.name) {
          setDetectedProfileKey(key);
          break;
        }
      }
      setDetectedProfile(profile);
      setSelectedRoles(profile.roles);
      setShowConfirmation(true);
      setIsUnknownUser(false);
    } else {
      // Unknown user - show profile selection
      setIsUnknownUser(true);
      setDetectedProfile(null);
      setSelectedRoles([]);
      setSelectedTemplate(null);
      setShowConfirmation(true);
    }
  }, [user, loading]);

  // Update pending state when showConfirmation changes
  useEffect(() => {
    setProfileConfirmationPending(showConfirmation);
  }, [showConfirmation]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = PROFILE_TEMPLATES[templateKey];
    if (template?.roles) {
      setSelectedRoles(template.roles);
    }
  };

  const handleConfirm = () => {
    if (!user) return;

    // For known users, need detected profile; for unknown users, allow any roles
    if (!isUnknownUser && !detectedProfile) return;

    setIsConfirming(true);

    // Save confirmation
    const profileKey = isUnknownUser
      ? selectedTemplate || "custom"
      : detectedProfileKey;
    saveProfileConfirmation(user.uid, profileKey, selectedRoles);

    // Close modal after brief delay
    setTimeout(() => {
      setShowConfirmation(false);
      setIsConfirming(false);
    }, 500);
  };

  const handleSkip = () => {
    if (!user) return;

    // Save as confirmed but with no specific profile
    localStorage.setItem(
      PROFILE_CONFIRMED_KEY,
      JSON.stringify({
        userId: user.uid,
        profileKey: null,
        confirmed: true,
        skipped: true,
        confirmedAt: new Date().toISOString(),
      }),
    );

    setShowConfirmation(false);
  };

  // Show loading while checking
  if (loading) {
    return <>{children}</>;
  }

  // Show confirmation modal if needed
  if (showConfirmation && user) {
    // For known users, show role confirmation
    // For unknown users, show profile template selection
    const showKnownUserModal = !isUnknownUser && detectedProfile;
    const showUnknownUserModal = isUnknownUser;

    if (showKnownUserModal || showUnknownUserModal) {
      return (
        <>
          {/* Always render children underneath the modal */}
          {children}

          {/* Backdrop */}
          <div className="profile-confirm-backdrop" />

          {/* Modal */}
          <div className="profile-confirm-modal">
            <div className="profile-confirm-content">
              <div className="profile-confirm-header">
                <div className="profile-confirm-avatar">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                    />
                  ) : (
                    <span className="profile-confirm-avatar-fallback">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <h2>
                  {isUnknownUser
                    ? `Welcome, ${user.displayName || "there"}!`
                    : `Welcome, ${detectedProfile?.name}!`}
                </h2>
                <p className="profile-confirm-subtitle">
                  {isUnknownUser
                    ? "Tell us about yourself to get personalized documentation recommendations."
                    : "We detected your profile. Please confirm your roles to get personalized recommendations."}
                </p>
              </div>

              <div className="profile-confirm-body">
                {/* Known user profile display */}
                {!isUnknownUser && detectedProfile && (
                  <div className="profile-confirm-profile">
                    <span className="profile-confirm-label">Your Profile:</span>
                    <span className="profile-confirm-description">
                      {detectedProfile.profileDescription}
                    </span>
                  </div>
                )}

                {/* Unknown user template selection */}
                {isUnknownUser && (
                  <div className="profile-confirm-templates">
                    <span className="profile-confirm-label">
                      I&apos;m primarily interested in:
                    </span>
                    <div className="profile-confirm-template-grid">
                      {Object.entries(PROFILE_TEMPLATES).map(
                        ([key, template]) => (
                          <button
                            key={key}
                            type="button"
                            className={`profile-confirm-template ${
                              selectedTemplate === key ? "selected" : ""
                            }`}
                            onClick={() => handleTemplateSelect(key)}
                          >
                            <span className="profile-confirm-template-name">
                              {template.roles?.[0] || key}
                            </span>
                            <span className="profile-confirm-template-desc">
                              {template.profileDescription}
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Role selection */}
                <div className="profile-confirm-roles">
                  <span className="profile-confirm-label">
                    {isUnknownUser ? "Or select specific roles:" : "Your Roles:"}
                  </span>
                  <div className="profile-confirm-role-list">
                    {(isUnknownUser
                      ? AVAILABLE_ROLES
                      : detectedProfile?.roles || []
                    ).map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`profile-confirm-role ${
                          selectedRoles.includes(role) ? "selected" : ""
                        }`}
                        onClick={() => handleRoleToggle(role)}
                      >
                        <span className="profile-confirm-role-check">
                          {selectedRoles.includes(role) ? "✓" : ""}
                        </span>
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile-confirm-note">
                  <span className="profile-confirm-note-icon">ℹ️</span>
                  <span>
                    This helps us show you the most relevant documentation and
                    track your progress across your areas of focus.
                  </span>
                </div>
              </div>

              <div className="profile-confirm-footer">
                <button
                  type="button"
                  className="profile-confirm-btn profile-confirm-btn--secondary"
                  onClick={handleSkip}
                  disabled={isConfirming}
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  className="profile-confirm-btn profile-confirm-btn--primary"
                  onClick={handleConfirm}
                  disabled={isConfirming || selectedRoles.length === 0}
                >
                  {isConfirming ? "Confirming..." : "Confirm & Continue"}
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }
  }

  return <>{children}</>;
}

export default ProfileConfirmation;
