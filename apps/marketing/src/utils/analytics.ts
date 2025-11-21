/**
 * Analytics tracking utilities for Phoenix Rooivalk marketing site
 * Privacy-focused event tracking for conversion optimization
 */

// Type declarations for analytics libraries
declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
    gtag?: (
      command: string,
      targetOrAction: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

export interface AnalyticsEvent {
  name: string;
  category: "lead" | "engagement" | "download" | "navigation";
  props?: Record<string, string | number | boolean>;
}

/**
 * Track an analytics event
 * Supports Plausible, Google Analytics, and other providers
 */
export const trackEvent = (
  eventName: string,
  props?: Record<string, string | number | boolean>,
): void => {
  // Plausible Analytics (privacy-focused)
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(eventName, { props });
  }

  // Google Analytics 4 (if implemented)
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, props);
  }

  // Console log in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", eventName, props);
  }
};

/**
 * Predefined analytics events for consistent tracking
 */
export const analyticsEvents = {
  // Lead generation events
  DEMO_REQUESTED: "Demo Requested",
  WHITEPAPER_DOWNLOAD: "Whitepaper Downloaded",
  CONTACT_CLICKED: "Contact Clicked",
  EMAIL_CLICKED: "Email Clicked",
  PARTNERSHIP_INQUIRY: "Partnership Inquiry",
  SBIR_INTEREST: "SBIR Interest Expressed",
  NEWSLETTER_SIGNUP: "Newsletter Signup",

  // Engagement events
  DEMO_STARTED: "Demo Started",
  DEMO_COMPLETED: "Demo Completed",
  DEMO_INTERACTION: "Demo Interaction",
  VIDEO_PLAY: "Video Played",
  VIDEO_COMPLETE: "Video Completed",
  ROI_CALCULATOR_USED: "ROI Calculator Used",
  ROI_CALCULATOR_COMPLETED: "ROI Calculator Completed",

  // Navigation events
  TECHNICAL_SPECS_VIEW: "Technical Specs Viewed",
  CAPABILITIES_VIEW: "Capabilities Viewed",
  COMPLIANCE_VIEW: "Compliance Page Viewed",
  PRICING_VIEW: "Pricing Viewed",

  // Download events
  TECHNICAL_PDF_DOWNLOAD: "Technical PDF Downloaded",
  CASE_STUDY_DOWNLOAD: "Case Study Downloaded",
  COMPLIANCE_DOC_DOWNLOAD: "Compliance Document Downloaded",
} as const;

/**
 * Track conversion with monetary value
 */
export const trackConversion = (
  goalName: string,
  value?: number,
  props?: Record<string, string | number | boolean>,
): void => {
  trackEvent(goalName, {
    ...props,
    value: value || 0,
    conversion: true,
  });
};

/**
 * Track page view (for SPAs)
 */
export const trackPageView = (url: string, title?: string): void => {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible("pageview", {
      props: { url, title: title || document.title },
    });
  }

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", "GA_MEASUREMENT_ID", {
      page_path: url,
      page_title: title,
    });
  }
};

/**
 * Track outbound link clicks
 */
export const trackOutboundLink = (url: string, label?: string): void => {
  trackEvent("Outbound Link", {
    url,
    label: label || url,
  });
};

/**
 * Track form submissions
 */
export const trackFormSubmission = (
  formName: string,
  success: boolean,
  errorMessage?: string,
): void => {
  trackEvent("Form Submission", {
    form: formName,
    success,
    error: errorMessage || "",
  });
};

/**
 * Track scroll depth for engagement measurement
 */
export const trackScrollDepth = (depth: number): void => {
  trackEvent("Scroll Depth", {
    depth,
    category: "engagement",
  });
};

/**
 * Track time on page
 */
export const trackTimeOnPage = (seconds: number): void => {
  trackEvent("Time on Page", {
    seconds,
    minutes: Math.round(seconds / 60),
  });
};

/**
 * Conversion goals with monetary values for ROI tracking
 */
export const conversionGoals = {
  DEMO_REQUEST: { value: 100, category: "lead" },
  WHITEPAPER_DOWNLOAD: { value: 50, category: "download" },
  SBIR_INQUIRY: { value: 200, category: "lead" },
  PARTNERSHIP_INQUIRY: { value: 150, category: "lead" },
  DEMO_ENGAGEMENT: { value: 25, category: "engagement" },
  EMAIL_SIGNUP: { value: 30, category: "lead" },
  ROI_CALCULATOR_COMPLETE: { value: 75, category: "engagement" },
  TECHNICAL_DOWNLOAD: { value: 60, category: "download" },
} as const;

/**
 * Track a conversion goal with automatic value assignment
 */
export const trackGoal = (
  goalKey: keyof typeof conversionGoals,
  additionalProps?: Record<string, string | number | boolean>,
): void => {
  const goal = conversionGoals[goalKey];
  trackConversion(goalKey, goal.value, {
    category: goal.category,
    ...additionalProps,
  });
};
