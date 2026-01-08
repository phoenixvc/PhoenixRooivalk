/**
 * Root Component Wrapper
 * Provides AuthContext, ReadingTracker, AnalyticsTracker, CookieConsent,
 * OfflineIndicator, and AI Assistant to the entire Docusaurus application.
 *
 * Non-critical features are wrapped in SilentErrorBoundary to prevent
 * analytics/tracking errors from crashing the documentation site.
 */

import React, { ReactNode, useEffect, useState } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import { AIFloatingWidget } from "../components/AIChat";
import { AnalyticsTracker } from "../components/Analytics";
import {
  NavbarProgressVisibility,
  ProfileConfirmation,
} from "../components/Auth";
import { CookieConsentBanner } from "../components/CookieConsent";
import { SilentErrorBoundary } from "../components/ErrorBoundary";
import { EngagementToasts, ReadingTracker } from "../components/Gamification";
import { NavbarNotifications } from "../components/NavbarNotifications";
import { OfflineIndicator } from "../components/Offline";
import { OnboardingWalkthrough } from "../components/Onboarding";
import { PDFDownloadButton } from "../components/PDFDownload";
import { SidebarRecommendations, SidebarControls } from "../components/Sidebar";
import { SidebarPhaseFilter } from "../components/PhaseFilter";
import { AuthProvider } from "../contexts/AuthContext";
import { PhaseFilterProvider } from "../contexts/PhaseFilterContext";
import { NotificationBadgeProvider } from "../contexts/NotificationBadgeContext";
import { ToastProvider } from "../contexts/ToastContext";
import { autoFixOnboardingData } from "../utils/localStorage";

// Extend window type for Phoenix config
declare global {
  interface Window {
    __PHOENIX_CONFIG__?: {
      azureConfig?: Record<string, string>;
      cloudProvider?: string;
    };
  }
}

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
  const { siteConfig } = useDocusaurusContext();

  // Inject config into window SYNCHRONOUSLY for service modules to access
  // This must happen before AuthProvider renders (which happens in return statement)
  if (
    typeof window !== "undefined" &&
    siteConfig.customFields &&
    !window.__PHOENIX_CONFIG__
  ) {
    window.__PHOENIX_CONFIG__ = {
      azureConfig: siteConfig.customFields.azureConfig as Record<
        string,
        string
      >,
      cloudProvider: siteConfig.customFields.cloudProvider as string,
    };
  }

  // Auto-fix corrupted onboarding data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        autoFixOnboardingData();
      } catch (error) {
        console.error("Failed to auto-fix onboarding data:", error);
      }
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationBadgeProvider>
          <PhaseFilterProvider>
            <SilentErrorBoundary>
              <NavbarProgressVisibility />
              <NavbarNotifications />
              <ProfileConfirmation>
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
                  <EngagementToasts />
                </SilentErrorBoundary>
                <SilentErrorBoundary>
                  <SidebarRecommendations />
                </SilentErrorBoundary>
                <SilentErrorBoundary>
                  <SidebarPhaseFilter />
                </SilentErrorBoundary>
                <SilentErrorBoundary>
                  <SidebarControls />
                </SilentErrorBoundary>
                <SilentErrorBoundary>
                  <AIFloatingWidget pageContext={pageContext} />
                </SilentErrorBoundary>
                <SilentErrorBoundary>
                  <PDFDownloadButton />
                </SilentErrorBoundary>
                <SilentErrorBoundary>
                  <OnboardingWalkthrough />
                </SilentErrorBoundary>
              </ProfileConfirmation>
            </SilentErrorBoundary>
          </PhaseFilterProvider>
        </NotificationBadgeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
