/**
 * Onboarding Walkthrough Component
 *
 * A step-by-step overlay guide shown on first login.
 * Can be revisited from user profile settings.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { isProfileConfirmationPending } from "../Auth";
import Link from "@docusaurus/Link";
import "./OnboardingWalkthrough.css";

const ONBOARDING_COMPLETED_KEY = "phoenix-docs-onboarding-completed";
const ONBOARDING_STEP_KEY = "phoenix-docs-onboarding-step";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  highlight?: string; // CSS selector to highlight
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Phoenix Rooivalk",
    description:
      "This documentation hub contains everything you need to know about our counter-drone technology. Let's take a quick tour of the key features.",
    icon: "🚀",
  },
  {
    id: "navigation",
    title: "Navigate with the Sidebar",
    description:
      "Use the sidebar to browse documentation by category: Executive, Technical, Business, Operations, Legal, and Research. Categories are collapsed by default - click to expand.",
    icon: "📚",
    highlight: ".theme-doc-sidebar-container",
  },
  {
    id: "search",
    title: "Quick Search",
    description:
      "Press Ctrl+K (or Cmd+K on Mac) to open quick search. Find any document instantly by typing keywords or titles.",
    icon: "🔍",
    highlight: ".DocSearch-Button",
  },
  {
    id: "recommendations",
    title: "Personalized For You",
    description:
      "Based on your role and interests, we highlight recommended documents with a star. Look for the 'For You' widget in the sidebar for personalized suggestions.",
    icon: "✨",
    highlight: ".sidebar-rec",
  },
  {
    id: "progress",
    title: "Track Your Progress",
    description:
      "As you read, your progress is automatically tracked. Complete documents to earn achievements and see your overall progress on the Your Progress page.",
    icon: "📊",
    action: {
      label: "View Progress",
      href: "/your-progress",
    },
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    description:
      "Need help? Click the AI assistant button in the bottom-right corner. Ask questions about any topic and get instant answers with source citations.",
    icon: "🤖",
    highlight: ".ai-floating-widget",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description:
      "You've completed the walkthrough. You can revisit this guide anytime from your profile. Now go explore the documentation!",
    icon: "🎉",
    action: {
      label: "Start Exploring",
      href: "/docs",
    },
  },
];

/**
 * Check if onboarding has been completed
 */
function isOnboardingCompleted(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const data = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data);
    return parsed.userId === userId && parsed.completed === true;
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as completed
 */
function markOnboardingCompleted(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ONBOARDING_COMPLETED_KEY,
    JSON.stringify({
      userId,
      completed: true,
      completedAt: new Date().toISOString(),
    }),
  );
}

/**
 * Get saved step progress
 */
function getSavedStep(): number {
  if (typeof window === "undefined") return 0;
  try {
    const step = localStorage.getItem(ONBOARDING_STEP_KEY);
    return step ? parseInt(step, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Save step progress
 */
function saveStep(step: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_STEP_KEY, String(step));
}

/**
 * Reset onboarding for user (for revisiting)
 */
export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  localStorage.removeItem(ONBOARDING_STEP_KEY);
}

/**
 * Clear all onboarding highlight classes from DOM
 */
function clearAllHighlights(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll(".onboarding-highlight").forEach((el) => {
    el.classList.remove("onboarding-highlight");
  });
}

/**
 * Check if onboarding is available (user has completed it)
 */
export function canRevisitOnboarding(userId: string): boolean {
  return isOnboardingCompleted(userId);
}

interface OnboardingWalkthroughProps {
  /** Force show the walkthrough (for revisiting) */
  forceShow?: boolean;
  /** Callback when walkthrough is closed */
  onClose?: () => void;
}

export function OnboardingWalkthrough({
  forceShow = false,
  onClose,
}: OnboardingWalkthroughProps): React.ReactElement | null {
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if we should show onboarding
  useEffect(() => {
    if (loading || !user) return;

    if (forceShow) {
      setCurrentStep(0);
      setIsVisible(true);
      return;
    }

    // Check if already completed
    if (isOnboardingCompleted(user.uid)) {
      setIsVisible(false);
      return;
    }

    // Wait for profile confirmation to complete before showing onboarding
    // This prevents both modals from appearing at the same time
    const checkAndShow = () => {
      if (!isProfileConfirmationPending()) {
        setCurrentStep(getSavedStep());
        setIsVisible(true);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      }
    };

    // Initial delay, then check periodically if profile confirmation is still pending
    const timer = setTimeout(() => {
      if (isProfileConfirmationPending()) {
        // Profile confirmation is showing, poll until it's done
        checkIntervalRef.current = setInterval(checkAndShow, 500);
      } else {
        checkAndShow();
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, loading, forceShow]);

  // Highlight target element
  useEffect(() => {
    if (!isVisible) return;

    const step = ONBOARDING_STEPS[currentStep];
    if (!step?.highlight) return;

    const element = document.querySelector(step.highlight);
    if (element) {
      element.classList.add("onboarding-highlight");
      return () => element.classList.remove("onboarding-highlight");
    }
  }, [currentStep, isVisible]);

  const handleNext = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < ONBOARDING_STEPS.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        saveStep(nextStep);
      }
      setIsAnimating(false);
    }, 200);
  }, [currentStep, isAnimating]);

  const handlePrevious = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep > 0) {
        const prevStep = currentStep - 1;
        setCurrentStep(prevStep);
        saveStep(prevStep);
      }
      setIsAnimating(false);
    }, 200);
  }, [currentStep, isAnimating]);

  const handleSkip = useCallback(() => {
    if (!user) return;
    markOnboardingCompleted(user.uid);
    clearAllHighlights();
    setIsVisible(false);
    onClose?.();
  }, [user, onClose]);

  const handleComplete = useCallback(() => {
    if (!user) return;
    markOnboardingCompleted(user.uid);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    clearAllHighlights();
    setIsVisible(false);
    onClose?.();
  }, [user, onClose]);

  // Don't render if not visible
  if (!isVisible || loading) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div className="onboarding-backdrop" />

      {/* Modal */}
      <div className="onboarding-modal">
        <div className={`onboarding-content ${isAnimating ? "animating" : ""}`}>
          {/* Progress bar */}
          <div className="onboarding-progress">
            <div
              className="onboarding-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Skip button */}
          {!isLastStep && (
            <button
              type="button"
              className="onboarding-skip"
              onClick={handleSkip}
            >
              Skip tour
            </button>
          )}

          {/* Step content */}
          <div className="onboarding-step">
            <div className="onboarding-icon">{step.icon}</div>
            <h2 className="onboarding-title">{step.title}</h2>
            <p className="onboarding-description">{step.description}</p>

            {step.action && (
              <div className="onboarding-action">
                {step.action.href ? (
                  <Link
                    to={step.action.href}
                    className="onboarding-action-btn"
                    onClick={isLastStep ? handleComplete : undefined}
                  >
                    {step.action.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="onboarding-action-btn"
                    onClick={step.action.onClick}
                  >
                    {step.action.label}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Step indicators */}
          <div className="onboarding-indicators">
            {ONBOARDING_STEPS.map((s, index) => (
              <button
                key={s.id}
                type="button"
                className={`onboarding-indicator ${index === currentStep ? "active" : ""} ${index < currentStep ? "completed" : ""}`}
                onClick={() => {
                  if (!isAnimating) {
                    setCurrentStep(index);
                    saveStep(index);
                  }
                }}
                aria-label={`Go to step ${index + 1}: ${s.title}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="onboarding-nav">
            <button
              type="button"
              className="onboarding-nav-btn onboarding-nav-btn--prev"
              onClick={handlePrevious}
              disabled={isFirstStep || isAnimating}
            >
              Previous
            </button>

            {isLastStep ? (
              <button
                type="button"
                className="onboarding-nav-btn onboarding-nav-btn--complete"
                onClick={handleComplete}
                disabled={isAnimating}
              >
                Get Started
              </button>
            ) : (
              <button
                type="button"
                className="onboarding-nav-btn onboarding-nav-btn--next"
                onClick={handleNext}
                disabled={isAnimating}
              >
                Next
              </button>
            )}
          </div>

          {/* Step counter */}
          <div className="onboarding-counter">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </div>
        </div>
      </div>
    </>
  );
}

export default OnboardingWalkthrough;
