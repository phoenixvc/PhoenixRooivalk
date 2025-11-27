/**
 * ProtectedContent Component
 *
 * Wraps documentation content to enforce authentication.
 * Shows teaser content for non-authenticated users with CTA to sign in.
 */

import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { analytics } from "../../services/analytics";
import "./ProtectedContent.css";

interface ProtectedContentProps {
  children: React.ReactNode;
  /** Page URL for analytics tracking */
  pageUrl?: string;
  /** Whether this specific page is free (no auth required) */
  isFreeContent?: boolean;
}

// Pages that are always free (no auth required)
const FREE_PAGES = [
  "/docs/phoenix-rooivalk-documentation",
  "/docs/executive/executive-summary",
  "/docs/resources/documentation-status",
  "/docs/technical/glossary",
];

export function ProtectedContent({
  children,
  pageUrl,
  isFreeContent = false,
}: ProtectedContentProps): React.ReactElement {
  const { user, loading, isConfigured, signInGoogle, signInGithub } = useAuth();

  const currentUrl = pageUrl || (typeof window !== "undefined" ? window.location.pathname : "");
  const isFreePage = isFreeContent || FREE_PAGES.some((p) => currentUrl.startsWith(p));

  // Track teaser view for non-authenticated users
  useEffect(() => {
    if (!loading && !user && !isFreePage) {
      analytics.trackTeaserView(currentUrl);
    }
  }, [loading, user, isFreePage, currentUrl]);

  // If Firebase not configured, show everything (local mode)
  if (!isConfigured) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="protected-content protected-content--loading">
        <div className="protected-content-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Authenticated or free content - show everything
  if (user || isFreePage) {
    return <>{children}</>;
  }

  // Non-authenticated - show teaser with sign-in CTA
  // CSS handles the height limiting and fade effect
  return (
    <div className="protected-content protected-content--teaser">
      {/* Teaser content - CSS limits visible height */}
      <div className="protected-content-teaser">
        {children}
      </div>

      {/* Fade overlay */}
      <div className="protected-content-fade" />

      {/* Sign-in CTA */}
      <div className="protected-content-cta">
        <div className="protected-content-cta-card">
          <div className="protected-content-cta-icon">🔒</div>
          <h3 className="protected-content-cta-title">
            Sign in to continue reading
          </h3>
          <p className="protected-content-cta-description">
            Get full access to Phoenix Rooivalk documentation, track your progress,
            and earn achievements as you learn.
          </p>

          <div className="protected-content-cta-benefits">
            <div className="protected-content-benefit">
              <span className="protected-content-benefit-icon">📚</span>
              <span>Access all 100+ documents</span>
            </div>
            <div className="protected-content-benefit">
              <span className="protected-content-benefit-icon">📊</span>
              <span>Track your reading progress</span>
            </div>
            <div className="protected-content-benefit">
              <span className="protected-content-benefit-icon">🏆</span>
              <span>Earn achievements & badges</span>
            </div>
            <div className="protected-content-benefit">
              <span className="protected-content-benefit-icon">☁️</span>
              <span>Sync across all devices</span>
            </div>
          </div>

          <div className="protected-content-cta-buttons">
            <button
              className="protected-content-btn protected-content-btn--google"
              onClick={async () => {
                analytics.trackSignupStarted("google");
                await signInGoogle();
              }}
            >
              <GoogleIcon />
              Sign in with Google
            </button>
            <button
              className="protected-content-btn protected-content-btn--github"
              onClick={async () => {
                analytics.trackSignupStarted("github");
                await signInGithub();
              }}
            >
              <GithubIcon />
              Sign in with GitHub
            </button>
          </div>

          <p className="protected-content-cta-note">
            Free forever. No credit card required.
          </p>
        </div>
      </div>
    </div>
  );
}

// Icon components
function GoogleIcon() {
  return (
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
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="currentColor"
        d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
      />
    </svg>
  );
}

export default ProtectedContent;
