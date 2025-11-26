/**
 * Root Component Wrapper
 * Provides AuthContext and ReadingTracker to the entire Docusaurus application
 */

import React, { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ReadingTracker } from "../components/Gamification";

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps): React.ReactElement {
  return (
    <AuthProvider>
      <ReadingTracker />
      {children}
    </AuthProvider>
  );
}
