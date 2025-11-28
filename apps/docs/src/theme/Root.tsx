/**
 * Root Component Wrapper
 * Provides AuthContext, ReadingTracker, AnalyticsTracker, CookieConsent,
 * OfflineIndicator, and AI Assistant to the entire Docusaurus application.
 *
 * Non-critical features are wrapped in SilentErrorBoundary to prevent
 * analytics/tracking errors from crashing the documentation site.
 */

import React, { ReactNode, useEffect, useState } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ReadingTracker } from "../components/Gamification";
import { AnalyticsTracker } from "../components/Analytics";
import { CookieConsentBanner } from "../components/CookieConsent";
import { SilentErrorBoundary } from "../components/ErrorBoundary";
import { OfflineIndicator } from "../components/Offline";
import { AIFloatingWidget } from "../components/AIChat";

interface RootProps {
  children: ReactNode;
}

/**
 * Get current page context for AI assistant
 */
function usePageContext() {
  const [pageContext, setPageContext] = useState<
    | {
        title: string;
        path: string;
        section?: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateContext = () => {
        const title = document.title.split(" | ")[0] || "Documentation";
        const path = window.location.pathname;
        setPageContext({ title, path });
      };

      updateContext();

      // Update on navigation - observe the title element specifically
      const titleElement = document.querySelector("title");
      if (titleElement) {
        const observer = new MutationObserver(updateContext);
        observer.observe(titleElement, {
          subtree: true,
          characterData: true,
          childList: true,
        });

        return () => observer.disconnect();
      }
    }
  }, []);

  return pageContext;
}

export default function Root({ children }: RootProps): React.ReactElement {
  const pageContext = usePageContext();

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
      <SilentErrorBoundary>
        <AIFloatingWidget pageContext={pageContext} />
      </SilentErrorBoundary>
    </AuthProvider>
  );
}
