/**
 * Analytics Service for Phoenix Rooivalk Documentation
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
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  setDoc,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { logEvent, Analytics } from "firebase/analytics";
import { isFirebaseConfigured, isGA4Configured, getGA4Analytics } from "./firebase";
import { isAnalyticsAllowed } from "../components/CookieConsent";
import { checkRateLimit, debounce } from "../utils/rateLimiter";

// Types for analytics events
export interface PageViewEvent {
  userId: string | null;
  sessionId: string;
  pageUrl: string;
  pageTitle: string;
  referrer: string;
  timestamp: unknown;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  isAuthenticated: boolean;
}

export interface TimeOnPageEvent {
  userId: string | null;
  sessionId: string;
  pageUrl: string;
  timeSpentMs: number;
  maxScrollDepth: number;
  timestamp: unknown;
  completed: boolean; // Read 90%+ of page
}

export interface ConversionEvent {
  userId: string | null;
  sessionId: string;
  eventType:
    | "teaser_view"
    | "signup_prompt_shown"
    | "signup_started"
    | "signup_completed"
    | "first_doc_read"
    | "achievement_unlocked"
    | "path_completed";
  eventData?: Record<string, unknown>;
  timestamp: unknown;
  pageUrl: string;
}

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

// Generate unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID from sessionStorage
const getSessionId = (): string => {
  if (typeof window === "undefined") return "ssr-session";

  let sessionId = sessionStorage.getItem("phoenix-analytics-session");
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem("phoenix-analytics-session", sessionId);
  }
  return sessionId;
};

// Get anonymous user ID for tracking non-authenticated users
const getAnonymousId = (): string => {
  if (typeof window === "undefined") return "ssr-anonymous";

  let anonId = localStorage.getItem("phoenix-anonymous-id");
  if (!anonId) {
    anonId = `anon-${generateSessionId()}`;
    localStorage.setItem("phoenix-anonymous-id", anonId);
  }
  return anonId;
};

// Rate limit constants
const RATE_LIMITS = {
  pageViews: { max: 30, windowMs: 60000 }, // 30 per minute
  conversions: { max: 20, windowMs: 60000 }, // 20 per minute
  timeOnPage: { max: 60, windowMs: 60000 }, // 60 per minute
  dailyStats: { max: 30, windowMs: 60000 }, // 30 per minute
};

class AnalyticsService {
  private db: ReturnType<typeof getFirestore> | null = null;
  private ga4: Analytics | null = null;
  private sessionId: string = "";
  private currentPageStartTime: number = 0;
  private currentPageUrl: string = "";
  private maxScrollDepth: number = 0;
  private isInitialized: boolean = false;

  // Debounced daily stats update
  private debouncedDailyStats = debounce(
    (pageUrl: string, isAuthenticated: boolean) => {
      this._updateDailyStats(pageUrl, isAuthenticated);
    },
    2000
  );

  constructor() {
    if (typeof window !== "undefined") {
      this.sessionId = getSessionId();
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

    if (isFirebaseConfigured() && typeof window !== "undefined") {
      try {
        this.db = getFirestore();
        this.isInitialized = true;
        await this.initSession();

        // Initialize GA4 if configured
        if (isGA4Configured()) {
          this.ga4 = getGA4Analytics();
        }
      } catch (error) {
        console.warn("Analytics initialization failed:", error);
      }
    }
  }

  /**
   * Track event to GA4 (Google Analytics 4)
   */
  private trackGA4Event(
    eventName: string,
    params?: Record<string, unknown>
  ): void {
    if (this.ga4 && this.hasConsent()) {
      try {
        logEvent(this.ga4, eventName, params);
      } catch (error) {
        // Silently fail - GA4 is supplementary
      }
    }
  }

  /**
   * Initialize or update user session
   */
  private async initSession(): Promise<void> {
    if (!this.db) return;

    try {
      const sessionRef = doc(this.db, "analytics_sessions", this.sessionId);
      await setDoc(
        sessionRef,
        {
          sessionId: this.sessionId,
          userId: null,
          startTime: serverTimestamp(),
          lastActivity: serverTimestamp(),
          pageViews: 0,
          totalTimeMs: 0,
          pagesVisited: [],
          isAuthenticated: false,
          convertedToSignup: false,
          userAgent: navigator.userAgent,
          referrer: document.referrer || "direct",
        },
        { merge: true }
      );
    } catch (error) {
      console.warn("Session init failed:", error);
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(
    pageUrl: string,
    pageTitle: string,
    userId: string | null,
    isAuthenticated: boolean
  ): Promise<void> {
    // Check GDPR consent before tracking
    if (!this.hasConsent()) {
      return;
    }

    // Check rate limit
    if (!checkRateLimit("pageViews", RATE_LIMITS.pageViews.max, RATE_LIMITS.pageViews.windowMs)) {
      return; // Rate limited, skip this tracking
    }

    if (!this.db) {
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

    if (!this.db) return;

    try {
      const event: PageViewEvent = {
        userId: userId || getAnonymousId(),
        sessionId: this.sessionId,
        pageUrl,
        pageTitle,
        referrer: document.referrer || "direct",
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        isAuthenticated,
      };

      await addDoc(collection(this.db, "analytics_pageviews"), event);

      // Update session
      const sessionRef = doc(this.db, "analytics_sessions", this.sessionId);
      await updateDoc(sessionRef, {
        lastActivity: serverTimestamp(),
        pageViews: increment(1),
        userId: userId || getAnonymousId(),
        isAuthenticated,
      });

      // Track daily stats (debounced)
      this.debouncedDailyStats(pageUrl, isAuthenticated);

      // Track to GA4
      this.trackGA4Event("page_view", {
        page_path: pageUrl,
        page_title: pageTitle,
        page_location: typeof window !== "undefined" ? window.location.href : "",
        is_authenticated: isAuthenticated,
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
    }
  }

  /**
   * Track time spent on page (called when leaving page)
   */
  async trackTimeOnPage(): Promise<void> {
    if (!this.db || !this.currentPageUrl) return;

    // Check rate limit
    if (!checkRateLimit("timeOnPage", RATE_LIMITS.timeOnPage.max, RATE_LIMITS.timeOnPage.windowMs)) {
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
        timestamp: serverTimestamp(),
        completed: this.maxScrollDepth >= 90,
      };

      await addDoc(collection(this.db, "analytics_timeonpage"), event);

      // Update session total time
      const sessionRef = doc(this.db, "analytics_sessions", this.sessionId);
      await updateDoc(sessionRef, {
        totalTimeMs: increment(timeSpent),
        lastActivity: serverTimestamp(),
      });

      // Track engagement to GA4
      this.trackGA4Event("user_engagement", {
        engagement_time_msec: timeSpent,
        page_path: this.currentPageUrl,
        scroll_depth: this.maxScrollDepth,
      });
    } catch (error) {
      console.warn("Time tracking failed:", error);
    }
  }

  /**
   * Track conversion funnel event
   */
  async trackConversion(
    eventType: ConversionEvent["eventType"],
    userId: string | null,
    eventData?: Record<string, unknown>
  ): Promise<void> {
    // Check GDPR consent before tracking
    if (!this.hasConsent()) {
      return;
    }

    // Check rate limit (but always allow signup_completed for accuracy)
    if (eventType !== "signup_completed" &&
        !checkRateLimit("conversions", RATE_LIMITS.conversions.max, RATE_LIMITS.conversions.windowMs)) {
      return; // Rate limited, skip this tracking
    }

    if (!this.db) {
      await this.init();
    }

    if (!this.db) return;

    try {
      const event: ConversionEvent = {
        userId: userId || getAnonymousId(),
        sessionId: this.sessionId,
        eventType,
        eventData,
        timestamp: serverTimestamp(),
        pageUrl: this.currentPageUrl || window.location.pathname,
      };

      await addDoc(collection(this.db, "analytics_conversions"), event);

      // Update session if signup conversion
      if (eventType === "signup_completed") {
        const sessionRef = doc(this.db, "analytics_sessions", this.sessionId);
        await updateDoc(sessionRef, {
          convertedToSignup: true,
          userId,
        });
      }

      // Track to GA4 with mapped event names
      const ga4EventName = this.mapConversionToGA4Event(eventType);
      this.trackGA4Event(ga4EventName, {
        event_category: "conversion",
        event_label: eventType,
        ...eventData,
      });
    } catch (error) {
      console.warn("Conversion tracking failed:", error);
    }
  }

  /**
   * Map internal conversion events to GA4 standard events
   */
  private mapConversionToGA4Event(eventType: ConversionEvent["eventType"]): string {
    const mapping: Record<ConversionEvent["eventType"], string> = {
      teaser_view: "view_item",
      signup_prompt_shown: "view_promotion",
      signup_started: "begin_checkout",
      signup_completed: "sign_up",
      first_doc_read: "tutorial_complete",
      achievement_unlocked: "unlock_achievement",
      path_completed: "level_end",
    };
    return mapping[eventType] || eventType;
  }

  /**
   * Update daily aggregated stats (internal, called via debounce)
   */
  private async _updateDailyStats(
    pageUrl: string,
    isAuthenticated: boolean
  ): Promise<void> {
    if (!this.db) return;

    // Check rate limit
    if (!checkRateLimit("dailyStats", RATE_LIMITS.dailyStats.max, RATE_LIMITS.dailyStats.windowMs)) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const statsRef = doc(this.db, "analytics_daily", today);

    try {
      await setDoc(
        statsRef,
        {
          date: today,
          totalPageViews: increment(1),
          uniqueSessions: increment(0), // Would need more complex logic
          authenticatedViews: isAuthenticated ? increment(1) : increment(0),
          anonymousViews: !isAuthenticated ? increment(1) : increment(0),
          [`pages.${pageUrl.replace(/\//g, "_")}`]: increment(1),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn("Daily stats update failed:", error);
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
  async trackSignupPromptShown(pageUrl: string, trigger: string): Promise<void> {
    await this.trackConversion("signup_prompt_shown", null, { pageUrl, trigger });
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
