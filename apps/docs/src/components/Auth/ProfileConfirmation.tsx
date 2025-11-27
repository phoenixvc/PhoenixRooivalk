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
} from "../../config/userProfiles";
import "./ProfileConfirmation.css";

const PROFILE_CONFIRMED_KEY = "phoenix-docs-profile-confirmed";
const PROFILE_DATA_KEY = "phoenix-docs-user-profile";

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

  // Check for known profile on user change
  useEffect(() => {
    if (!user || loading) return;

    // Check if already confirmed
    if (isProfileConfirmed(user.uid)) {
      setShowConfirmation(false);
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
    } else {
      // Unknown user - no confirmation needed
      setShowConfirmation(false);
    }
  }, [user, loading]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleConfirm = () => {
    if (!user || !detectedProfile) return;

    setIsConfirming(true);

    // Save confirmation
    saveProfileConfirmation(user.uid, detectedProfileKey, selectedRoles);

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
  if (showConfirmation && detectedProfile && user) {
    return (
      <>
        {/* Backdrop */}
        <div className="profile-confirm-backdrop" />

        {/* Modal */}
        <div className="profile-confirm-modal">
          <div className="profile-confirm-content">
            <div className="profile-confirm-header">
              <div className="profile-confirm-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} />
                ) : (
                  <span className="profile-confirm-avatar-fallback">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <h2>Welcome, {detectedProfile.name}!</h2>
              <p className="profile-confirm-subtitle">
                We detected your profile. Please confirm your roles to get
                personalized recommendations.
              </p>
            </div>

            <div className="profile-confirm-body">
              <div className="profile-confirm-profile">
                <span className="profile-confirm-label">Your Profile:</span>
                <span className="profile-confirm-description">
                  {detectedProfile.profileDescription}
                </span>
              </div>

              <div className="profile-confirm-roles">
                <span className="profile-confirm-label">Your Roles:</span>
                <div className="profile-confirm-role-list">
                  {detectedProfile.roles.map((role) => (
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

  return <>{children}</>;
}

export default ProfileConfirmation;
