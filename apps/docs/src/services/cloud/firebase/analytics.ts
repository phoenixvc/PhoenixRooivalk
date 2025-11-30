/**
 * Firebase Analytics Service Implementation
 *
 * Implements IAnalyticsService using Firebase Analytics (GA4) and Firestore.
 */

import {
  getAnalytics,
  logEvent,
  Analytics,
  isSupported as isAnalyticsSupported,
  setUserId,
  setUserProperties as setGA4UserProperties,
} from 'firebase/analytics';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  setDoc,
  increment,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import {
  IAnalyticsService,
  PageViewEvent,
  TimeOnPageEvent,
  ConversionEvent,
  CustomEvent,
  UserProperties,
  getOrCreateSessionId,
  getOrCreateAnonymousId,
} from '../interfaces/analytics';

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  pageViews: { max: 30, windowMs: 60000 },
  conversions: { max: 20, windowMs: 60000 },
  timeOnPage: { max: 60, windowMs: 60000 },
  dailyStats: { max: 30, windowMs: 60000 },
};

/**
 * Simple rate limiter
 */
class RateLimiter {
  private counts = new Map<string, { count: number; windowStart: number }>();

  check(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.counts.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      this.counts.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= max) {
      return false;
    }

    entry.count++;
    return true;
  }
}

/**
 * Firebase Analytics Service
 */
export class FirebaseAnalyticsService implements IAnalyticsService {
  private db: Firestore | null = null;
  private ga4: Analytics | null = null;
  private sessionId = '';
  private currentPageStartTime = 0;
  private currentPageUrl = '';
  private maxScrollDepth = 0;
  private initialized = false;
  private consentGranted = false;
  private rateLimiter = new RateLimiter();

  constructor(private app: FirebaseApp | null) {
    if (typeof window !== 'undefined') {
      this.sessionId = getOrCreateSessionId();
    }
  }

  isConfigured(): boolean {
    return this.app !== null;
  }

  hasConsent(): boolean {
    // Check for cookie consent
    if (typeof window === 'undefined') return false;
    try {
      const consent = localStorage.getItem('phoenix-cookie-consent');
      return consent === 'accepted' || consent === 'analytics';
    } catch {
      return false;
    }
  }

  setConsent(granted: boolean): void {
    this.consentGranted = granted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('phoenix-cookie-consent', granted ? 'accepted' : 'declined');
    }
  }

  async init(): Promise<void> {
    if (this.initialized || !this.app || !this.hasConsent()) return;

    try {
      this.db = getFirestore(this.app);

      // Initialize GA4 if supported
      const supported = await isAnalyticsSupported();
      if (supported) {
        this.ga4 = getAnalytics(this.app);
      }

      this.initialized = true;
      await this.startSession();
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // ============================================================================
  // Page Tracking
  // ============================================================================

  async trackPageView(event: PageViewEvent): Promise<void> {
    if (!this.hasConsent()) return;
    if (!this.rateLimiter.check('pageViews', RATE_LIMITS.pageViews.max, RATE_LIMITS.pageViews.windowMs)) {
      return;
    }

    if (!this.initialized) await this.init();
    if (!this.db) return;

    // End previous page tracking
    if (this.currentPageUrl) {
      await this.trackTimeOnPage({
        pageUrl: this.currentPageUrl,
        timeSpentMs: Date.now() - this.currentPageStartTime,
        maxScrollDepth: this.maxScrollDepth,
        completed: this.maxScrollDepth >= 90,
        userId: event.userId,
        sessionId: this.sessionId,
      });
    }

    // Start new page tracking
    this.currentPageUrl = event.pageUrl;
    this.currentPageStartTime = Date.now();
    this.maxScrollDepth = 0;

    try {
      await addDoc(collection(this.db, 'analytics_pageviews'), {
        ...event,
        userId: event.userId || getOrCreateAnonymousId(),
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
      });

      // Update session
      const sessionRef = doc(this.db, 'analytics_sessions', this.sessionId);
      await updateDoc(sessionRef, {
        lastActivity: serverTimestamp(),
        pageViews: increment(1),
        userId: event.userId || getOrCreateAnonymousId(),
        isAuthenticated: event.isAuthenticated,
      });

      // Track to GA4
      this.trackGA4Event('page_view', {
        page_path: event.pageUrl,
        page_title: event.pageTitle,
        is_authenticated: event.isAuthenticated,
      });
    } catch (error) {
      console.warn('Page view tracking failed:', error);
    }
  }

  async trackTimeOnPage(event: TimeOnPageEvent): Promise<void> {
    if (!this.db || !this.hasConsent()) return;
    if (!this.rateLimiter.check('timeOnPage', RATE_LIMITS.timeOnPage.max, RATE_LIMITS.timeOnPage.windowMs)) {
      return;
    }

    try {
      await addDoc(collection(this.db, 'analytics_timeonpage'), {
        ...event,
        timestamp: serverTimestamp(),
      });

      // Update session total time
      const sessionRef = doc(this.db, 'analytics_sessions', this.sessionId);
      await updateDoc(sessionRef, {
        totalTimeMs: increment(event.timeSpentMs),
        lastActivity: serverTimestamp(),
      });

      // Track to GA4
      this.trackGA4Event('user_engagement', {
        engagement_time_msec: event.timeSpentMs,
        page_path: event.pageUrl,
        scroll_depth: event.maxScrollDepth,
      });
    } catch (error) {
      console.warn('Time tracking failed:', error);
    }
  }

  updateScrollDepth(depth: number): void {
    if (depth > this.maxScrollDepth) {
      this.maxScrollDepth = depth;
    }
  }

  // ============================================================================
  // Conversion Tracking
  // ============================================================================

  async trackConversion(event: ConversionEvent): Promise<void> {
    if (!this.hasConsent()) return;

    // Always allow signup_completed for accuracy
    if (event.eventType !== 'signup_completed') {
      if (!this.rateLimiter.check('conversions', RATE_LIMITS.conversions.max, RATE_LIMITS.conversions.windowMs)) {
        return;
      }
    }

    if (!this.initialized) await this.init();
    if (!this.db) return;

    try {
      await addDoc(collection(this.db, 'analytics_conversions'), {
        ...event,
        userId: event.userId || getOrCreateAnonymousId(),
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
      });

      // Update session if signup conversion
      if (event.eventType === 'signup_completed') {
        const sessionRef = doc(this.db, 'analytics_sessions', this.sessionId);
        await updateDoc(sessionRef, {
          convertedToSignup: true,
          userId: event.userId,
        });
      }

      // Track to GA4
      const ga4EventName = this.mapConversionToGA4(event.eventType);
      this.trackGA4Event(ga4EventName, {
        event_category: 'conversion',
        event_label: event.eventType,
        ...event.eventData,
      });
    } catch (error) {
      console.warn('Conversion tracking failed:', error);
    }
  }

  async trackTeaserView(pageUrl: string): Promise<void> {
    await this.trackConversion({
      eventType: 'teaser_view',
      sessionId: this.sessionId,
      pageUrl,
      eventData: { pageUrl },
    });
  }

  async trackSignupPromptShown(pageUrl: string, trigger: string): Promise<void> {
    await this.trackConversion({
      eventType: 'signup_prompt_shown',
      sessionId: this.sessionId,
      pageUrl,
      eventData: { pageUrl, trigger },
    });
  }

  async trackSignupStarted(method: 'google' | 'github' | 'microsoft'): Promise<void> {
    await this.trackConversion({
      eventType: 'signup_started',
      sessionId: this.sessionId,
      pageUrl: this.currentPageUrl || window.location.pathname,
      eventData: { method },
    });
  }

  async trackSignupCompleted(userId: string, method: string): Promise<void> {
    await this.trackConversion({
      eventType: 'signup_completed',
      userId,
      sessionId: this.sessionId,
      pageUrl: this.currentPageUrl || window.location.pathname,
      eventData: { method },
    });
  }

  // ============================================================================
  // Custom Events
  // ============================================================================

  async trackEvent(event: CustomEvent): Promise<void> {
    if (!this.hasConsent()) return;

    this.trackGA4Event(event.name, event.params);

    if (this.db) {
      try {
        await addDoc(collection(this.db, 'analytics_events'), {
          ...event,
          sessionId: this.sessionId,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.warn('Custom event tracking failed:', error);
      }
    }
  }

  async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.hasConsent() || !this.ga4) return;

    try {
      if (properties.userId) {
        setUserId(this.ga4, properties.userId);
      }
      setGA4UserProperties(this.ga4, properties);
    } catch (error) {
      console.warn('Setting user properties failed:', error);
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  async startSession(): Promise<void> {
    if (!this.db) return;

    try {
      const sessionRef = doc(this.db, 'analytics_sessions', this.sessionId);
      await setDoc(sessionRef, {
        sessionId: this.sessionId,
        userId: null,
        startTime: serverTimestamp(),
        lastActivity: serverTimestamp(),
        pageViews: 0,
        totalTimeMs: 0,
        pagesVisited: [],
        isAuthenticated: false,
        convertedToSignup: false,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
      }, { merge: true });
    } catch (error) {
      console.warn('Session init failed:', error);
    }
  }

  async endSession(): Promise<void> {
    // Track final time on page
    if (this.currentPageUrl) {
      await this.trackTimeOnPage({
        pageUrl: this.currentPageUrl,
        timeSpentMs: Date.now() - this.currentPageStartTime,
        maxScrollDepth: this.maxScrollDepth,
        completed: this.maxScrollDepth >= 90,
        sessionId: this.sessionId,
      });
    }
  }

  async updateSessionAuth(userId: string, isAuthenticated: boolean): Promise<void> {
    if (!this.db) return;

    try {
      const sessionRef = doc(this.db, 'analytics_sessions', this.sessionId);
      await updateDoc(sessionRef, {
        userId,
        isAuthenticated,
        lastActivity: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Session auth update failed:', error);
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private trackGA4Event(name: string, params?: Record<string, unknown>): void {
    if (this.ga4 && this.hasConsent()) {
      try {
        logEvent(this.ga4, name, params);
      } catch {
        // Silently fail - GA4 is supplementary
      }
    }
  }

  private mapConversionToGA4(eventType: ConversionEvent['eventType']): string {
    const mapping: Record<ConversionEvent['eventType'], string> = {
      teaser_view: 'view_item',
      signup_prompt_shown: 'view_promotion',
      signup_started: 'begin_checkout',
      signup_completed: 'sign_up',
      first_doc_read: 'tutorial_complete',
      achievement_unlocked: 'unlock_achievement',
      path_completed: 'level_end',
    };
    return mapping[eventType] || eventType;
  }
}
