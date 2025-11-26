/**
 * Root Component Wrapper
 * Provides AuthContext, ReadingTracker, AnalyticsTracker, and CookieConsent
 * to the entire Docusaurus application
 */

import React, { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ReadingTracker } from "../components/Gamification";
import { AnalyticsTracker } from "../components/Analytics";
import { CookieConsentBanner } from "../components/CookieConsent";

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps): React.ReactElement {
  return (
    <AuthProvider>
      <ReadingTracker />
      <AnalyticsTracker />
      {children}
      <CookieConsentBanner />
    </AuthProvider>
  );
}
