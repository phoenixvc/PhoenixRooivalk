/**
 * Root Component Wrapper
 * Provides AuthContext, ReadingTracker, AnalyticsTracker, CookieConsent,
 * and OfflineIndicator to the entire Docusaurus application.
 *
 * Non-critical features are wrapped in SilentErrorBoundary to prevent
 * analytics/tracking errors from crashing the documentation site.
 */

import React, { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ReadingTracker } from "../components/Gamification";
import { AnalyticsTracker } from "../components/Analytics";
import { CookieConsentBanner } from "../components/CookieConsent";
import { SilentErrorBoundary } from "../components/ErrorBoundary";
import { OfflineIndicator } from "../components/Offline";

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps): React.ReactElement {
  return (
    <AuthProvider>
      <SilentErrorBoundary>
        <ReadingTracker />
      </SilentErrorBoundary>
      <SilentErrorBoundary>
        <AnalyticsTracker />
      </SilentErrorBoundary>
      {children}
      <SilentErrorBoundary>
        <CookieConsentBanner />
      </SilentErrorBoundary>
      <SilentErrorBoundary>
        <OfflineIndicator />
      </SilentErrorBoundary>
    </AuthProvider>
  );
}
