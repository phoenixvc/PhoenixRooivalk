/**
 * Onboarding Walkthrough Component
 *
 * A step-by-step overlay guide shown on first login.
 * For new users, starts with profile template selection.
 * Can be revisited from user profile settings.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { isProfileConfirmationPending } from "../Auth";
import {
  PROFILE_TEMPLATES_ARRAY,
  ProfileTemplate,
} from "../../config/userProfiles";
import Link from "@docusaurus/Link";
import "./OnboardingWalkthrough.css";

const ONBOARDING_COMPLETED_KEY = "phoenix-docs-onboarding-completed";
const ONBOARDING_STEP_KEY = "phoenix-docs-onboarding-step";
const PROFILE_CONFIRMED_KEY = "phoenix-docs-profile-confirmed";
const PROFILE_DATA_KEY = "phoenix-docs-user-profile";

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
  isProfileSelection?: boolean; // Special step for profile selection
}

/**
 * Check if user has already selected a profile
 */
function hasProfileSelected(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const confirmed = localStorage.getItem(PROFILE_CONFIRMED_KEY);
    if (!confirmed) return false;
    const data = JSON.parse(confirmed);
    return data.userId === userId && data.confirmed === true;
  } catch {
    return false;
  }
}

/**
 * Save profile selection from onboarding
 */
function saveProfileSelection(
  userId: string,
  templateKey: string,
  roles: string[],
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PROFILE_CONFIRMED_KEY,
    JSON.stringify({
      userId,
      profileKey: templateKey,
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      fromOnboarding: true,
    }),
  );
  localStorage.setItem(
    PROFILE_DATA_KEY,
    JSON.stringify({
      profileKey: templateKey,
      roles,
    }),
  );
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "profile-selection",
    title: "Choose Your Profile",
    description:
      "Select the profile that best matches your role. This helps us personalize your documentation experience with relevant recommendations.",
    icon: "👤",
    isProfileSelection: true,
  },
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
      "Based on your profile, we highlight recommended documents with a star. Look for the 'For You' widget in the sidebar for personalized suggestions.",
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
      "You've completed the walkthrough. You can revisit this guide anytime from your profile settings. Now go explore the documentation!",
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
  const { user, loading, userProfile, refreshUserProfile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProfileTemplate | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine starting step based on whether profile is already selected
  const getStartingStep = useCallback((): number => {
    if (!user) return 0;

    // If user already has a profile selected, skip the profile selection step
    if (hasProfileSelected(user.uid) || userProfile.knownProfile) {
      return 1; // Start at "welcome" step
    }

    return 0; // Start at profile selection
  }, [user, userProfile.knownProfile]);

  // Check if we should show onboarding
  useEffect(() => {
    if (loading || !user) return;

    if (forceShow) {
      setCurrentStep(1); // Skip profile selection on revisit
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
        const savedStep = getSavedStep();
        const startStep = getStartingStep();
        // Use saved step if it's past the profile selection, otherwise use starting step
        setCurrentStep(savedStep > startStep ? savedStep : startStep);
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
  }, [user, loading, forceShow, getStartingStep]);

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

  const handleTemplateSelect = (template: ProfileTemplate) => {
    setSelectedTemplate(template);
  };

  const handleNext = useCallback(() => {
    if (isAnimating) return;

    const step = ONBOARDING_STEPS[currentStep];

    // If on profile selection step, save the selection before proceeding
    if (step.isProfileSelection && selectedTemplate && user) {
      saveProfileSelection(
        user.uid,
        selectedTemplate.templateKey,
        selectedTemplate.roles,
      );
      // Refresh the user profile in context
      refreshUserProfile?.();
    }

    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < ONBOARDING_STEPS.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        saveStep(nextStep);
      }
      setIsAnimating(false);
    }, 200);
  }, [currentStep, isAnimating, selectedTemplate, user, refreshUserProfile]);

  const handlePrevious = useCallback(() => {
    if (isAnimating) return;

    // Don't allow going back to profile selection step once past it
    if (currentStep <= 1) return;

    setIsAnimating(true);
    setTimeout(() => {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveStep(prevStep);
      setIsAnimating(false);
    }, 200);
  }, [currentStep, isAnimating]);

  const handleSkip = useCallback(() => {
    if (!user) return;

    // If skipping from profile selection, save a default/skipped state
    const step = ONBOARDING_STEPS[currentStep];
    if (step.isProfileSelection) {
      localStorage.setItem(
        PROFILE_CONFIRMED_KEY,
        JSON.stringify({
          userId: user.uid,
          profileKey: null,
          confirmed: true,
          skipped: true,
          confirmedAt: new Date().toISOString(),
        }),
      );
    }

    markOnboardingCompleted(user.uid);
    clearAllHighlights();
    setIsVisible(false);
    onClose?.();
  }, [user, onClose, currentStep]);

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
  const isProfileStep = step.isProfileSelection;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  // For profile selection step, require a selection to proceed
  const canProceed = !isProfileStep || selectedTemplate !== null;

  return (
    <>
      {/* Backdrop */}
      <div className="onboarding-backdrop" />

      {/* Modal */}
      <div
        className={`onboarding-modal ${isProfileStep ? "onboarding-modal--profile" : ""}`}
      >
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

            {/* Profile selection grid */}
            {isProfileStep && (
              <>
                <div className="onboarding-profile-grid">
                  {PROFILE_TEMPLATES_ARRAY.map((template) => (
                    <button
                      key={template.templateKey}
                      type="button"
                      className={`onboarding-profile-card ${
                        selectedTemplate?.templateKey === template.templateKey
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <span className="onboarding-profile-icon">
                        {template.templateIcon}
                      </span>
                      <span className="onboarding-profile-name">
                        {template.templateName}
                      </span>
                      <span className="onboarding-profile-desc">
                        {template.templateDescription}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="onboarding-template-note">
                  <span className="onboarding-template-note-icon">💡</span>
                  <span className="onboarding-template-note-text">
                    <strong>This is a starting template.</strong> Your profile
                    will adapt as you explore the documentation. You can always
                    adjust your roles and interests in your{" "}
                    <Link to="/profile-settings">Profile Settings</Link>.
                  </span>
                </div>
              </>
            )}

            {step.action && !isProfileStep && (
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
                  // Don't allow jumping back to profile selection once past
                  if (!isAnimating && index >= 1 && index <= currentStep) {
                    setCurrentStep(index);
                    saveStep(index);
                  }
                }}
                aria-label={`Go to step ${index + 1}: ${s.title}`}
                disabled={index === 0 && currentStep > 0}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="onboarding-nav">
            <button
              type="button"
              className="onboarding-nav-btn onboarding-nav-btn--prev"
              onClick={handlePrevious}
              disabled={isFirstStep || currentStep <= 1 || isAnimating}
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
                disabled={!canProceed || isAnimating}
              >
                {isProfileStep
                  ? selectedTemplate
                    ? "Continue"
                    : "Select a profile"
                  : "Next"}
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
