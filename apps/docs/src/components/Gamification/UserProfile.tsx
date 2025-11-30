import React, { useState, useEffect, useRef } from "react";
import Link from "@docusaurus/Link";

import { useAuth } from "../../contexts/AuthContext";

interface UserProfileProps {
  compact?: boolean;
}

/**
 * UserProfile Component
 *
 * Displays user authentication status, profile information, and cloud sync controls.
 * Supports multiple display modes: compact (dropdown) and full (card).
 * Handles Firebase configuration states and loading/authenticated/guest states.
 *
 * @param {UserProfileProps} props - Component props
 * @param {boolean} [props.compact=false] - Whether to render in compact dropdown mode
 * @returns {React.ReactElement} User profile UI
 */
export function UserProfile({
  compact = false,
}: UserProfileProps): React.ReactElement {
  const {
    user,
    loading,
    isConfigured,
    progress,
    signInGoogle,
    signInGithub,
    logout,
  } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation for dropdown
  useEffect(() => {
    if (!showDropdown) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // If Firebase isn't configured, show local-only mode
  if (!isConfigured) {
    return (
      <div className="user-profile user-profile--local">
        <div className="user-profile-local-badge">
          <span className="user-profile-icon">💾</span>
          <span className="user-profile-text">Local Mode</span>
        </div>
        <div className="user-profile-local-hint">
          Progress saved to this browser only
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="user-profile user-profile--loading">
        <div className="user-profile-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  // User is logged in
  if (user) {
    const displayName = user.displayName || user.email || "User";
    const photoURL = user.photoURL;
    const level = progress?.stats.level || 1;
    const points = progress?.stats.totalPoints || 0;

    if (compact) {
      return (
        <div className="user-profile user-profile--compact" ref={dropdownRef}>
          <button
            className="user-profile-avatar-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="User menu"
            aria-expanded={showDropdown}
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="user-profile-avatar"
              />
            ) : (
              <div className="user-profile-avatar user-profile-avatar--default">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="user-profile-level-badge">Lv.{level}</span>
          </button>

          {showDropdown && (
            <div className="user-profile-dropdown">
              <div className="user-profile-dropdown-header">
                <strong>{displayName}</strong>
                <span className="user-profile-points">{points} pts</span>
              </div>
              <div className="user-profile-dropdown-sync">
                <span className="user-profile-sync-icon">☁️</span>
                <span>Cloud sync enabled</span>
              </div>
              <Link
                to="/profile-settings"
                className="user-profile-dropdown-btn user-profile-dropdown-link"
                onClick={() => setShowDropdown(false)}
              >
                Profile Settings
              </Link>
              <button
                className="user-profile-dropdown-btn"
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="user-profile user-profile--full">
        <div className="user-profile-header">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="user-profile-avatar user-profile-avatar--large"
            />
          ) : (
            <div className="user-profile-avatar user-profile-avatar--large user-profile-avatar--default">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="user-profile-info">
            <h3 className="user-profile-name">{displayName}</h3>
            <div className="user-profile-stats">
              <span className="user-profile-level">Level {level}</span>
              <span className="user-profile-points">{points} points</span>
            </div>
          </div>
        </div>
        <div className="user-profile-sync-status">
          <span className="user-profile-sync-icon">☁️</span>
          <span>Progress synced to cloud</span>
        </div>
        <div className="user-profile-actions">
          <Link to="/profile-settings" className="user-profile-settings-btn">
            Profile Settings
          </Link>
          <button className="user-profile-logout-btn" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // User is not logged in
  return (
    <div className="user-profile user-profile--guest">
      <div className="user-profile-guest-message">
        <h4>Sync Your Progress</h4>
        <p>
          Sign in to save your achievements and reading progress across devices.
        </p>
      </div>
      <div className="user-profile-auth-buttons">
        <button
          className="user-profile-auth-btn user-profile-auth-btn--google"
          onClick={signInGoogle}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
        <button
          className="user-profile-auth-btn user-profile-auth-btn--github"
          onClick={signInGithub}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
          Sign in with GitHub
        </button>
      </div>
      <p className="user-profile-local-note">
        Or continue without signing in - progress will be saved locally.
      </p>
    </div>
  );
}
