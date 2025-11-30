/**
 * Analytics Service Interface
 *
 * Provides abstraction for analytics operations across different cloud providers.
 * Implementations: Firebase Analytics (GA4), Azure Application Insights
 */

// Import Node.js crypto in non-browser environments for secure random generation
let nodeCrypto: typeof import("crypto") | null = null;
if (typeof window === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nodeCrypto = require("crypto");
  } catch {
    nodeCrypto = null;
  }
}

/**
 * Page view event data
 */
export interface PageViewEvent {
  pageUrl: string;
  pageTitle: string;
  userId?: string | null;
  sessionId: string;
  referrer?: string;
  isAuthenticated: boolean;
  screenWidth?: number;
  screenHeight?: number;
  userAgent?: string;
}

/**
 * Time on page event data
 */
export interface TimeOnPageEvent {
  pageUrl: string;
  timeSpentMs: number;
  maxScrollDepth: number;
  completed: boolean;
  userId?: string | null;
  sessionId: string;
}

/**
 * Conversion event types
 */
export type ConversionEventType =
  | "teaser_view"
  | "signup_prompt_shown"
  | "signup_started"
  | "signup_completed"
  | "first_doc_read"
  | "achievement_unlocked"
  | "path_completed";

/**
 * Conversion event data
 */
export interface ConversionEvent {
  eventType: ConversionEventType;
  userId?: string | null;
  sessionId: string;
  pageUrl: string;
  eventData?: Record<string, unknown>;
}

/**
 * Custom event data
 */
export interface CustomEvent {
  name: string;
  params?: Record<string, unknown>;
}

/**
 * User properties for analytics
 */
export interface UserProperties {
  userId?: string;
  userType?: "anonymous" | "authenticated";
  roles?: string[];
  level?: number;
  [key: string]: unknown;
}

/**
 * Analytics service interface
 */
export interface IAnalyticsService {
  /**
   * Check if analytics is configured and ready
   */
  isConfigured(): boolean;

  /**
   * Check if user has given consent for analytics
   */
  hasConsent(): boolean;

  /**
   * Set consent status for analytics
   * @param granted - Whether consent is granted
   */
  setConsent(granted: boolean): void;

  /**
   * Initialize the analytics service
   */
  init(): Promise<void>;

  /**
   * Get the current session ID
   */
  getSessionId(): string;

  // ============================================================================
  // Page Tracking
  // ============================================================================

  /**
   * Track a page view
   */
  trackPageView(event: PageViewEvent): Promise<void>;

  /**
   * Track time spent on a page
   */
  trackTimeOnPage(event: TimeOnPageEvent): Promise<void>;

  /**
   * Update scroll depth for the current page
   * @param depth - Scroll depth percentage (0-100)
   */
  updateScrollDepth(depth: number): void;

  // ============================================================================
  // Conversion Tracking
  // ============================================================================

  /**
   * Track a conversion event
   */
  trackConversion(event: ConversionEvent): Promise<void>;

  /**
   * Track teaser content view
   */
  trackTeaserView(pageUrl: string): Promise<void>;

  /**
   * Track signup prompt shown
   */
  trackSignupPromptShown(pageUrl: string, trigger: string): Promise<void>;

  /**
   * Track signup started
   */
  trackSignupStarted(method: "google" | "github" | "microsoft"): Promise<void>;

  /**
   * Track signup completed
   */
  trackSignupCompleted(userId: string, method: string): Promise<void>;

  // ============================================================================
  // Custom Events
  // ============================================================================

  /**
   * Track a custom event
   */
  trackEvent(event: CustomEvent): Promise<void>;

  /**
   * Set user properties for analytics
   */
  setUserProperties(properties: UserProperties): Promise<void>;

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Start a new session
   */
  startSession(): Promise<void>;

  /**
   * End the current session
   */
  endSession(): Promise<void>;

  /**
   * Update session with user authentication
   */
  updateSessionAuth(userId: string, isAuthenticated: boolean): Promise<void>;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  // Use cryptographically secure random values for session ID
  let randStr: string;
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    const randomValues = new Uint32Array(2);
    window.crypto.getRandomValues(randomValues);
    // Convert to a base36 string and pad to ensure length >= 9
    randStr = randomValues[0].toString(36) + randomValues[1].toString(36);
    randStr = randStr.substring(0, 9); // match original substring length if desired
  } else if (nodeCrypto && nodeCrypto.randomBytes) {
    // Use Node.js crypto for secure random in server (non-browser) environments
    const buffer = nodeCrypto.randomBytes(8);
    randStr = Array.from(buffer)
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("")
      .substring(0, 9);
  } else {
    // Last resort fallback - should rarely happen in practice
    // Use Date.now() which is deterministic but at least not predictable
    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        "Warning: No secure random generator available for session ID generation.",
      );
    }
    randStr = Date.now().toString(36);
  }
  return `${Date.now()}-${randStr}`;
}

/**
 * Generate an anonymous user ID
 */
export function generateAnonymousId(): string {
  return `anon-${generateSessionId()}`;
}

/**
 * Get or create a session ID from sessionStorage
 */
export function getOrCreateSessionId(
  storageKey: string = "phoenix-analytics-session",
): string {
  if (typeof window === "undefined") return "ssr-session";

  let sessionId = sessionStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
}

/**
 * Get or create an anonymous ID from localStorage
 */
export function getOrCreateAnonymousId(
  storageKey: string = "phoenix-anonymous-id",
): string {
  if (typeof window === "undefined") return "ssr-anonymous";

  let anonId = localStorage.getItem(storageKey);
  if (!anonId) {
    anonId = generateAnonymousId();
    localStorage.setItem(storageKey, anonId);
  }
  return anonId;
}
