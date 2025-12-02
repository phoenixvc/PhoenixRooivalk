/**
 * Tour Configuration
 *
 * Configures the product tour experience for new users
 */

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for the element to highlight
  placement?: "top" | "bottom" | "left" | "right";
}

export interface TourConfig {
  enableSkip: boolean;
  autoStart: boolean;
  steps: TourStep[];
}

/**
 * Tour configuration
 * Can be controlled via NEXT_PUBLIC_ENABLE_TOUR_SKIP environment variable
 */
export const TOUR_CONFIG: TourConfig = {
  // Enable skip button (can be overridden by env var)
  enableSkip:
    process.env.NEXT_PUBLIC_ENABLE_TOUR_SKIP === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_TOUR_SKIP === undefined, // Default to true
  // Auto-start tour for first-time visitors
  autoStart: process.env.NEXT_PUBLIC_TOUR_AUTO_START !== "false",
  // Tour steps
  steps: [
    {
      id: "welcome",
      title: "Welcome to Phoenix Rooivalk",
      content:
        "Autonomous counter-UAS defense with sub-200ms response times. Let's take a quick tour of our key capabilities.",
      placement: "bottom",
    },
    {
      id: "capabilities",
      title: "System Capabilities",
      content:
        "Explore our advanced threat detection, autonomous response, and RF-denied operation capabilities.",
      target: "[data-tour='capabilities']",
      placement: "bottom",
    },
    {
      id: "evidence",
      title: "Blockchain Evidence",
      content:
        "All countermeasure deployments are recorded on immutable blockchain ledgers for legal compliance and audit trails.",
      target: "[data-tour='evidence']",
      placement: "top",
    },
    {
      id: "demo",
      title: "Interactive Demo",
      content:
        "Try our interactive threat simulator to see the system in action.",
      target: "[data-tour='demo']",
      placement: "right",
    },
    {
      id: "contact",
      title: "Get In Touch",
      content:
        "Ready to learn more? Contact our team or explore career opportunities.",
      target: "[data-tour='contact']",
      placement: "top",
    },
  ],
};

/**
 * Local storage keys for tour state
 */
export const TOUR_STORAGE_KEYS = {
  COMPLETED: "phoenix_tour_completed",
  SKIPPED: "phoenix_tour_skipped",
  CURRENT_STEP: "phoenix_tour_current_step",
} as const;

/**
 * Check if user has completed or skipped the tour
 */
export function hasTourCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(TOUR_STORAGE_KEYS.COMPLETED) === "true" ||
    localStorage.getItem(TOUR_STORAGE_KEYS.SKIPPED) === "true"
  );
}

/**
 * Mark tour as completed
 */
export function markTourCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOUR_STORAGE_KEYS.COMPLETED, "true");
  localStorage.removeItem(TOUR_STORAGE_KEYS.CURRENT_STEP);
}

/**
 * Mark tour as skipped
 */
export function markTourSkipped(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOUR_STORAGE_KEYS.SKIPPED, "true");
  localStorage.removeItem(TOUR_STORAGE_KEYS.CURRENT_STEP);
}

/**
 * Reset tour state (for testing)
 */
export function resetTourState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOUR_STORAGE_KEYS.COMPLETED);
  localStorage.removeItem(TOUR_STORAGE_KEYS.SKIPPED);
  localStorage.removeItem(TOUR_STORAGE_KEYS.CURRENT_STEP);
}

/**
 * Get current tour step
 */
export function getCurrentStep(): number {
  if (typeof window === "undefined") return 0;
  const step = localStorage.getItem(TOUR_STORAGE_KEYS.CURRENT_STEP);
  return step ? parseInt(step, 10) : 0;
}

/**
 * Set current tour step
 */
export function setCurrentStep(step: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOUR_STORAGE_KEYS.CURRENT_STEP, step.toString());
}
