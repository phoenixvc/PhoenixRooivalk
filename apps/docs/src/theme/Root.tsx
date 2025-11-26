/**
 * Root Component Wrapper
 * Provides AuthContext, ReadingTracker, and AnalyticsTracker to the entire Docusaurus application
 */

import React, { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ReadingTracker } from "../components/Gamification";
import { AnalyticsTracker } from "../components/Analytics";

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps): React.ReactElement {
  return (
    <AuthProvider>
      <ReadingTracker />
      <AnalyticsTracker />
      {children}
    </AuthProvider>
  );
}
