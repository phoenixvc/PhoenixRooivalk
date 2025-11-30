/**
 * Analytics Service for Phoenix Rooivalk Documentation
 *
 * Uses Azure Application Insights via the cloud service abstraction.
 *
 * Tracks:
 * - Page views with user identification
 * - Time spent on each page
 * - Scroll depth
 * - Conversion funnel events
 * - User sessions
 *
 * Features rate limiting to prevent excessive API calls.
 */

import {
  getAnalyticsService,
  isCloudConfigured,
  type IAnalyticsService,
} from "./cloud";
import { isAnalyticsAllowed } from "../components/CookieConsent";
import { checkRateLimit, debounce } from "../utils/rateLimiter";
import {
  getOrCreateSessionId,
  getOrCreateAnonymousId,
  type PageViewEvent,
  type TimeOnPageEvent,
  type ConversionEvent,
  type ConversionEventType,
} from "./cloud/interfaces/analytics";

// Re-export types for backward compatibility
export type { PageViewEvent, TimeOnPageEvent, ConversionEvent };

// Additional types for backward compatibility
export interface UserSession {
  sessionId: string;
  userId: string | null;
  startTime: unknown;
  lastActivity: unknown;
  pageViews: number;
  totalTimeMs: number;
  pagesVisited: string[];
  isAuthenticated: boolean;
  convertedToSignup: boolean;
  userAgent: string;
  referrer: string;
}

// Rate limit constants
const RATE_LIMITS = {
  pageViews: { max: 30, windowMs: 60000 }, // 30 per minute
  conversions: { max: 20, windowMs: 60000 }, // 20 per minute
  timeOnPage: { max: 60, windowMs: 60000 }, // 60 per minute
  dailyStats: { max: 30, windowMs: 60000 }, // 30 per minute
};

/**
 * Analytics Service Wrapper
 *
 * Provides a simplified interface to the cloud analytics service
 * with rate limiting and consent checking.
 */
class AnalyticsService {
  private analyticsService: IAnalyticsService | null = null;
  private sessionId: string = "";
  private currentPageStartTime: number = 0;
  private currentPageUrl: string = "";
  private maxScrollDepth: number = 0;
  private isInitialized: boolean = false;

  // Debounced tracking for daily stats
  private debouncedTrackEvent = debounce(
    (eventName: string, params: Record<string, unknown>) => {
      this._trackCustomEvent(eventName, params);
    },
    2000,
  );

  constructor() {
    if (typeof window !== "undefined") {
      this.sessionId = getOrCreateSessionId("phoenix-analytics-session");
    }
  }

  /**
   * Check if analytics tracking is allowed (GDPR consent)
   */
  private hasConsent(): boolean {
    return isAnalyticsAllowed();
  }

  /**
   * Initialize the analytics service
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Don't initialize if user hasn't consented
    if (!this.hasConsent()) {
      return;
    }

    if (isCloudConfigured() && typeof window !== "undefined") {
      try {
        this.analyticsService = getAnalyticsService();
        await this.analyticsService.init();
        this.isInitialized = true;
      } catch (error) {
        console.warn("Analytics initialization failed:", error);
      }
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(
    pageUrl: string,
    pageTitle: string,
    userId: string | null,
    isAuthenticated: boolean,
  ): Promise<void> {
    // Check GDPR consent before tracking
    if (!this.hasConsent()) {
      return;
    }

    // Check rate limit
    if (
      !checkRateLimit(
        "pageViews",
        RATE_LIMITS.pageViews.max,
        RATE_LIMITS.pageViews.windowMs,
      )
    ) {
      return; // Rate limited, skip this tracking
    }

    if (!this.analyticsService) {
      await this.init();
    }

    // End previous page tracking
    if (this.currentPageUrl) {
      await this.trackTimeOnPage();
    }

    // Start new page tracking
    this.currentPageUrl = pageUrl;
    this.currentPageStartTime = Date.now();
    this.maxScrollDepth = 0;

    if (!this.analyticsService) return;

    try {
      const event: PageViewEvent = {
        userId: userId || getOrCreateAnonymousId("phoenix-anonymous-id"),
        sessionId: this.sessionId,
        pageUrl,
        pageTitle,
        referrer:
          typeof document !== "undefined"
            ? document.referrer || "direct"
            : "direct",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "",
        screenWidth: typeof window !== "undefined" ? window.innerWidth : 0,
        screenHeight: typeof window !== "undefined" ? window.innerHeight : 0,
        isAuthenticated,
      };

      await this.analyticsService.trackPageView(event);

      // Track daily stats (debounced)
      this.debouncedTrackEvent("daily_pageview", {
        pageUrl,
        isAuthenticated,
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.warn("Page view tracking failed:", error);
    }
  }

  /**
   * Update scroll depth
   */
  updateScrollDepth(depth: number): void {
    if (depth > this.maxScrollDepth) {
      this.maxScrollDepth = depth;
      this.analyticsService?.updateScrollDepth(depth);
    }
  }

  /**
   * Track time spent on page (called when leaving page)
   */
  async trackTimeOnPage(): Promise<void> {
    if (!this.analyticsService || !this.currentPageUrl) return;

    // Check rate limit
    if (
      !checkRateLimit(
        "timeOnPage",
        RATE_LIMITS.timeOnPage.max,
        RATE_LIMITS.timeOnPage.windowMs,
      )
    ) {
      return; // Rate limited, skip this tracking
    }

    const timeSpent = Date.now() - this.currentPageStartTime;

    try {
      const event: TimeOnPageEvent = {
        userId: null, // Will be updated if authenticated
        sessionId: this.sessionId,
        pageUrl: this.currentPageUrl,
        timeSpentMs: timeSpent,
        maxScrollDepth: this.maxScrollDepth,
        completed: this.maxScrollDepth >= 90,
      };

      await this.analyticsService.trackTimeOnPage(event);
    } catch (error) {
      console.warn("Time tracking failed:", error);
    }
  }

  /**
   * Track conversion funnel event
   */
  async trackConversion(
    eventType: ConversionEventType,
    userId: string | null,
    eventData?: Record<string, unknown>,
  ): Promise<void> {
    // Check GDPR consent before tracking
    if (!this.hasConsent()) {
      return;
    }

    // Check rate limit (but always allow signup_completed for accuracy)
    if (
      eventType !== "signup_completed" &&
      !checkRateLimit(
        "conversions",
        RATE_LIMITS.conversions.max,
        RATE_LIMITS.conversions.windowMs,
      )
    ) {
      return; // Rate limited, skip this tracking
    }

    if (!this.analyticsService) {
      await this.init();
    }

    if (!this.analyticsService) return;

    try {
      const event: ConversionEvent = {
        userId: userId || getOrCreateAnonymousId("phoenix-anonymous-id"),
        sessionId: this.sessionId,
        eventType,
        eventData,
        pageUrl:
          this.currentPageUrl ||
          (typeof window !== "undefined" ? window.location.pathname : ""),
      };

      await this.analyticsService.trackConversion(event);
    } catch (error) {
      console.warn("Conversion tracking failed:", error);
    }
  }

  /**
   * Track custom event (internal)
   */
  private async _trackCustomEvent(
    eventName: string,
    params: Record<string, unknown>,
  ): Promise<void> {
    if (!this.analyticsService) return;

    try {
      await this.analyticsService.trackEvent({
        name: eventName,
        params,
      });
    } catch (error) {
      console.warn("Custom event tracking failed:", error);
    }
  }

  /**
   * Track teaser content view
   */
  async trackTeaserView(pageUrl: string): Promise<void> {
    await this.trackConversion("teaser_view", null, { pageUrl });
  }

  /**
   * Track signup prompt shown
   */
  async trackSignupPromptShown(
    pageUrl: string,
    trigger: string,
  ): Promise<void> {
    await this.trackConversion("signup_prompt_shown", null, {
      pageUrl,
      trigger,
    });
  }

  /**
   * Track signup started
   */
  async trackSignupStarted(method: "google" | "github"): Promise<void> {
    await this.trackConversion("signup_started", null, { method });
  }

  /**
   * Track signup completed
   */
  async trackSignupCompleted(userId: string, method: string): Promise<void> {
    await this.trackConversion("signup_completed", userId, { method });
  }

  /**
   * Get session ID for reference
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// React hook for analytics
export function useAnalytics() {
  return analytics;
}
