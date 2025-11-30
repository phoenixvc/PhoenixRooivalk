/**
 * Azure Analytics Service Implementation
 *
 * Implements IAnalyticsService using Azure Application Insights.
 *
 * Note: This requires the @microsoft/applicationinsights-web package.
 * npm install @microsoft/applicationinsights-web
 */

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
 * Azure Application Insights Configuration
 */
export interface AzureAnalyticsConfig {
  connectionString: string;
  instrumentationKey?: string;
}

/**
 * Azure Application Insights Service
 */
export class AzureAnalyticsService implements IAnalyticsService {
  private appInsights: any = null; // ApplicationInsights
  private sessionId = '';
  private currentPageStartTime = 0;
  private currentPageUrl = '';
  private maxScrollDepth = 0;
  private initialized = false;
  private consentGranted = false;
  private config: AzureAnalyticsConfig | null = null;

  constructor(config?: AzureAnalyticsConfig) {
    this.config = config || null;
    if (typeof window !== 'undefined') {
      this.sessionId = getOrCreateSessionId('azure-analytics-session');
    }
  }

  isConfigured(): boolean {
    return this.config !== null && Boolean(this.config.connectionString);
  }

  hasConsent(): boolean {
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
    if (this.initialized || !this.config || !this.hasConsent()) return;

    try {
      // Dynamically import Application Insights
      const { ApplicationInsights } = await import('@microsoft/applicationinsights-web');

      this.appInsights = new ApplicationInsights({
        config: {
          connectionString: this.config.connectionString,
          instrumentationKey: this.config.instrumentationKey,
          enableAutoRouteTracking: true,
          enableCorsCorrelation: true,
          enableRequestHeaderTracking: true,
          enableResponseHeaderTracking: true,
          disableFetchTracking: false,
          disableAjaxTracking: false,
        },
      });

      this.appInsights.loadAppInsights();
      this.initialized = true;

      await this.startSession();
    } catch (error) {
      console.warn('Azure Analytics initialization failed:', error);
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
    if (!this.initialized) await this.init();

    // Track time on previous page
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

    if (!this.appInsights) return;

    try {
      this.appInsights.trackPageView({
        name: event.pageTitle,
        uri: event.pageUrl,
        refUri: event.referrer,
        properties: {
          userId: event.userId || getOrCreateAnonymousId('azure-anonymous-id'),
          sessionId: this.sessionId,
          isAuthenticated: event.isAuthenticated,
          screenWidth: event.screenWidth,
          screenHeight: event.screenHeight,
        },
      });
    } catch (error) {
      console.warn('Page view tracking failed:', error);
    }
  }

  async trackTimeOnPage(event: TimeOnPageEvent): Promise<void> {
    if (!this.hasConsent() || !this.appInsights) return;

    try {
      this.appInsights.trackEvent({
        name: 'TimeOnPage',
        properties: {
          pageUrl: event.pageUrl,
          timeSpentMs: event.timeSpentMs,
          maxScrollDepth: event.maxScrollDepth,
          completed: event.completed,
          userId: event.userId || getOrCreateAnonymousId('azure-anonymous-id'),
          sessionId: event.sessionId,
        },
        measurements: {
          timeSpentMs: event.timeSpentMs,
          scrollDepth: event.maxScrollDepth,
        },
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
    if (!this.initialized) await this.init();
    if (!this.appInsights) return;

    try {
      this.appInsights.trackEvent({
        name: `Conversion_${event.eventType}`,
        properties: {
          eventType: event.eventType,
          userId: event.userId || getOrCreateAnonymousId('azure-anonymous-id'),
          sessionId: event.sessionId,
          pageUrl: event.pageUrl,
          ...event.eventData,
        },
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
      pageUrl: this.currentPageUrl || (typeof window !== 'undefined' ? window.location.pathname : ''),
      eventData: { method },
    });
  }

  async trackSignupCompleted(userId: string, method: string): Promise<void> {
    await this.trackConversion({
      eventType: 'signup_completed',
      userId,
      sessionId: this.sessionId,
      pageUrl: this.currentPageUrl || (typeof window !== 'undefined' ? window.location.pathname : ''),
      eventData: { method },
    });
  }

  // ============================================================================
  // Custom Events
  // ============================================================================

  async trackEvent(event: CustomEvent): Promise<void> {
    if (!this.hasConsent() || !this.appInsights) return;

    try {
      this.appInsights.trackEvent({
        name: event.name,
        properties: {
          sessionId: this.sessionId,
          ...event.params,
        },
      });
    } catch (error) {
      console.warn('Custom event tracking failed:', error);
    }
  }

  async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.hasConsent() || !this.appInsights) return;

    try {
      if (properties.userId) {
        this.appInsights.setAuthenticatedUserContext(properties.userId);
      }

      // Set custom properties for all subsequent events
      this.appInsights.addTelemetryInitializer((envelope: any) => {
        envelope.data = envelope.data || {};
        Object.assign(envelope.data, properties);
      });
    } catch (error) {
      console.warn('Setting user properties failed:', error);
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  async startSession(): Promise<void> {
    if (!this.appInsights) return;

    try {
      this.appInsights.trackEvent({
        name: 'SessionStart',
        properties: {
          sessionId: this.sessionId,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
        },
      });
    } catch (error) {
      console.warn('Session start tracking failed:', error);
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

    if (!this.appInsights) return;

    try {
      this.appInsights.trackEvent({
        name: 'SessionEnd',
        properties: {
          sessionId: this.sessionId,
        },
      });
      this.appInsights.flush();
    } catch (error) {
      console.warn('Session end tracking failed:', error);
    }
  }

  async updateSessionAuth(userId: string, isAuthenticated: boolean): Promise<void> {
    if (!this.appInsights) return;

    try {
      if (isAuthenticated && userId) {
        this.appInsights.setAuthenticatedUserContext(userId);
      } else {
        this.appInsights.clearAuthenticatedUserContext();
      }

      this.appInsights.trackEvent({
        name: 'SessionAuthUpdate',
        properties: {
          sessionId: this.sessionId,
          userId,
          isAuthenticated,
        },
      });
    } catch (error) {
      console.warn('Session auth update failed:', error);
    }
  }
}
