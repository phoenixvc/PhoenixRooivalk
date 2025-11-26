/**
 * Cookie Consent Banner
 *
 * GDPR-compliant cookie consent for analytics tracking.
 * Users must opt-in before any tracking occurs.
 */

import React, { useState, useEffect, useCallback } from "react";
import "./CookieConsent.css";

// Consent storage key
const CONSENT_KEY = "phoenix-analytics-consent";
const CONSENT_VERSION = "1"; // Increment when consent requirements change

export type ConsentStatus = "pending" | "accepted" | "declined";

export interface ConsentData {
  status: ConsentStatus;
  version: string;
  timestamp: string;
  analytics: boolean;
  functional: boolean;
}

/**
 * Get current consent status from localStorage
 */
export function getConsentStatus(): ConsentData | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as ConsentData;

    // Check if consent version is current
    if (data.version !== CONSENT_VERSION) {
      // Consent version changed, need to re-consent
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Check if analytics tracking is allowed
 */
export function isAnalyticsAllowed(): boolean {
  const consent = getConsentStatus();
  return consent?.status === "accepted" && consent?.analytics === true;
}

/**
 * Save consent decision
 */
function saveConsent(data: ConsentData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
}

/**
 * Hook for managing consent state
 */
export function useConsent() {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = getConsentStatus();
    setConsent(stored);
    setIsLoaded(true);
  }, []);

  const acceptAll = useCallback(() => {
    const data: ConsentData = {
      status: "accepted",
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      analytics: true,
      functional: true,
    };
    saveConsent(data);
    setConsent(data);
  }, []);

  const acceptFunctionalOnly = useCallback(() => {
    const data: ConsentData = {
      status: "accepted",
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      analytics: false,
      functional: true,
    };
    saveConsent(data);
    setConsent(data);
  }, []);

  const declineAll = useCallback(() => {
    const data: ConsentData = {
      status: "declined",
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      analytics: false,
      functional: false,
    };
    saveConsent(data);
    setConsent(data);
  }, []);

  const resetConsent = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CONSENT_KEY);
    }
    setConsent(null);
  }, []);

  return {
    consent,
    isLoaded,
    isPending: isLoaded && consent === null,
    isAnalyticsAllowed: consent?.analytics === true,
    acceptAll,
    acceptFunctionalOnly,
    declineAll,
    resetConsent,
  };
}

/**
 * Cookie Consent Banner Component
 */
export function CookieConsentBanner(): React.ReactElement | null {
  const { consent, isLoaded, isPending, acceptAll, acceptFunctionalOnly } =
    useConsent();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render until we've checked localStorage
  if (!isLoaded) return null;

  // Don't show if user has already made a choice
  if (!isPending) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent">
      <div className="cookie-consent-container">
        <div className="cookie-consent-content">
          <div className="cookie-consent-icon">🍪</div>
          <div className="cookie-consent-text">
            <h3 className="cookie-consent-title">We value your privacy</h3>
            <p className="cookie-consent-description">
              We use cookies to track your reading progress and improve your
              experience. Analytics help us understand how you use our
              documentation.
            </p>

            {isExpanded && (
              <div className="cookie-consent-details">
                <div className="cookie-consent-category">
                  <strong>Functional cookies</strong>
                  <p>
                    Required for basic features like saving your reading
                    progress and preferences. Always enabled.
                  </p>
                </div>
                <div className="cookie-consent-category">
                  <strong>Analytics cookies</strong>
                  <p>
                    Help us understand how you use the documentation, which
                    pages are most helpful, and where we can improve. This data
                    is anonymized and never sold.
                  </p>
                </div>
              </div>
            )}

            <button
              className="cookie-consent-toggle"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? "Show less" : "Learn more"}
            </button>
          </div>
        </div>

        <div className="cookie-consent-actions">
          <button
            className="cookie-consent-btn cookie-consent-btn--secondary"
            onClick={acceptFunctionalOnly}
          >
            Functional only
          </button>
          <button
            className="cookie-consent-btn cookie-consent-btn--primary"
            onClick={acceptAll}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
