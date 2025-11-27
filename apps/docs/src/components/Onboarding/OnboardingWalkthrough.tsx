/**
 * Onboarding Walkthrough Component
 *
 * A step-by-step overlay guide shown on first login.
 * Flow: Profile Completion -> Profile Selection -> AI Fun Facts -> Welcome Tour
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
import { ProfileCompletion, UserProfileDetails } from "./ProfileCompletion";
import { AIFunFacts } from "./AIFunFacts";
import "./OnboardingWalkthrough.css";

const ONBOARDING_COMPLETED_KEY = "phoenix-docs-onboarding-completed";
const ONBOARDING_STEP_KEY = "phoenix-docs-onboarding-step";
const PROFILE_CONFIRMED_KEY = "phoenix-docs-profile-confirmed";
const PROFILE_DATA_KEY = "phoenix-docs-user-profile";
const USER_DETAILS_KEY = "phoenix-docs-user-details";
const USER_FUN_FACTS_KEY = "phoenix-docs-user-fun-facts";

type StepType = "profile-completion" | "profile-selection" | "ai-fun-facts" | "tour";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  stepType: StepType;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  highlight?: string; // CSS selector to highlight
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
 * Check if user has completed profile details
 */
function hasProfileDetails(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const details = localStorage.getItem(USER_DETAILS_KEY);
    if (!details) return false;
    const data = JSON.parse(details);
    return data.userId === userId && data.completed === true;
  } catch {
    return false;
  }
}

/**
 * Get saved user profile details
 */
function getSavedUserDetails(userId: string): UserProfileDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const details = localStorage.getItem(USER_DETAILS_KEY);
    if (!details) return null;
    const data = JSON.parse(details);
    if (data.userId !== userId) return null;
    return data.details || null;
  } catch {
    return null;
  }
}

/**
 * Save user profile details
 */
function saveUserDetails(userId: string, details: UserProfileDetails): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    USER_DETAILS_KEY,
    JSON.stringify({
      userId,
      details,
      completed: true,
      completedAt: new Date().toISOString(),
    }),
  );
}

/**
 * Save user fun facts
 */
function saveUserFunFacts(
  userId: string,
  facts: Array<{ id: string; fact: string; category: string }>,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    USER_FUN_FACTS_KEY,
    JSON.stringify({
      userId,
      facts,
      savedAt: new Date().toISOString(),
    }),
  );
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
    id: "profile-completion",
    title: "Complete Your Profile",
    description:
      "Tell us a bit about yourself so we can personalize your experience.",
    icon: "📝",
    stepType: "profile-completion",
  },
  {
    id: "profile-selection",
    title: "Choose Your Role",
    description:
      "Select the profile that best matches your role. This helps us personalize your documentation experience with relevant recommendations.",
    icon: "👤",
    stepType: "profile-selection",
  },
  {
    id: "ai-fun-facts",
    title: "Fun Facts About You",
    description:
      "We've researched your background to find some interesting facts!",
    icon: "✨",
    stepType: "ai-fun-facts",
  },
  {
    id: "welcome",
    title: "Welcome to Phoenix Rooivalk",
    description:
      "This documentation hub contains everything you need to know about our counter-drone technology. Let's take a quick tour of the key features.",
    icon: "🚀",
    stepType: "tour",
  },
  {
    id: "navigation",
    title: "Navigate with the Sidebar",
    description:
      "Use the sidebar to browse documentation by category: Executive, Technical, Business, Operations, Legal, and Research. Categories are collapsed by default - click to expand.",
    icon: "📚",
    stepType: "tour",
    highlight: ".theme-doc-sidebar-container",
  },
  {
    id: "search",
    title: "Quick Search",
    description:
      "Press Ctrl+K (or Cmd+K on Mac) to open quick search. Find any document instantly by typing keywords or titles.",
    icon: "🔍",
    stepType: "tour",
    highlight: ".DocSearch-Button",
  },
  {
    id: "recommendations",
    title: "Personalized For You",
    description:
      "Based on your profile, we highlight recommended documents with a star. Look for the 'For You' widget in the sidebar for personalized suggestions.",
    icon: "✨",
    stepType: "tour",
    highlight: ".sidebar-rec",
  },
  {
    id: "progress",
    title: "Track Your Progress",
    description:
      "As you read, your progress is automatically tracked. Complete documents to earn achievements and see your overall progress on the Your Progress page.",
    icon: "📊",
    stepType: "tour",
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
    stepType: "tour",
    highlight: ".ai-floating-widget",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description:
      "You've completed the walkthrough. You can revisit this guide anytime from your profile settings. Now go explore the documentation!",
    icon: "🎉",
    stepType: "tour",
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
  const [userDetails, setUserDetails] = useState<UserProfileDetails | null>(
    null,
  );
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Find step index by stepType
  const findStepIndex = useCallback((stepType: StepType): number => {
    return ONBOARDING_STEPS.findIndex((s) => s.stepType === stepType);
  }, []);

  // Determine starting step based on user's progress
  const getStartingStep = useCallback((): number => {
    if (!user) return 0;

    // Check what the user has already completed
    const hasDetails = hasProfileDetails(user.uid);
    const hasProfile = hasProfileSelected(user.uid) || userProfile.knownProfile;

    // If user has details and profile, start at tour (skip ai-fun-facts on subsequent visits)
    if (hasDetails && hasProfile) {
      return findStepIndex("tour");
    }

    // If user has details but not profile selection, start at profile selection
    if (hasDetails) {
      // Also load the saved details for the AI fun facts step
      const savedDetails = getSavedUserDetails(user.uid);
      if (savedDetails) {
        setUserDetails(savedDetails);
      }
      return findStepIndex("profile-selection");
    }

    // Start from the beginning
    return 0;
  }, [user, userProfile.knownProfile, findStepIndex]);

  // Check if we should show onboarding
  useEffect(() => {
    if (loading || !user) return;

    if (forceShow) {
      // When revisiting, skip to the tour steps
      setCurrentStep(findStepIndex("tour"));
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
  }, [user, loading, forceShow, getStartingStep, findStepIndex]);

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

  // Handle profile completion form submission
  const handleProfileComplete = useCallback(
    (details: UserProfileDetails) => {
      if (!user) return;
      saveUserDetails(user.uid, details);
      setUserDetails(details);
      // Move to next step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveStep(nextStep);
    },
    [user, currentStep],
  );

  // Handle AI fun facts completion
  const handleFunFactsComplete = useCallback(
    (facts: Array<{ id: string; fact: string; category: string }>) => {
      if (!user) return;
      saveUserFunFacts(user.uid, facts);
      // Move to next step (tour)
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveStep(nextStep);
    },
    [user, currentStep],
  );

  // Handle skipping fun facts
  const handleFunFactsSkip = useCallback(() => {
    // Move to next step without saving facts
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    saveStep(nextStep);
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (isAnimating) return;

    const step = ONBOARDING_STEPS[currentStep];

    // If on profile selection step, save the selection before proceeding
    if (step.stepType === "profile-selection" && selectedTemplate && user) {
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

    const step = ONBOARDING_STEPS[currentStep];
    // Don't allow going back before the tour starts
    // (can't go back from tour to ai-fun-facts, profile-selection, or profile-completion)
    const tourStartIndex = findStepIndex("tour");
    if (currentStep <= tourStartIndex) return;

    setIsAnimating(true);
    setTimeout(() => {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveStep(prevStep);
      setIsAnimating(false);
    }, 200);
  }, [currentStep, isAnimating, findStepIndex]);

  const handleSkip = useCallback(() => {
    if (!user) return;

    // If skipping from profile selection, save a default/skipped state
    const step = ONBOARDING_STEPS[currentStep];
    if (step.stepType === "profile-selection") {
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
  const isProfileCompletionStep = step.stepType === "profile-completion";
  const isProfileSelectionStep = step.stepType === "profile-selection";
  const isAIFunFactsStep = step.stepType === "ai-fun-facts";
  const isTourStep = step.stepType === "tour";
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const tourStartIndex = findStepIndex("tour");
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  // For profile selection step, require a selection to proceed
  const canProceed = !isProfileSelectionStep || selectedTemplate !== null;

  // Get modal size class based on step type
  const getModalClass = () => {
    if (isProfileCompletionStep) return "onboarding-modal--profile-completion";
    if (isProfileSelectionStep) return "onboarding-modal--profile";
    if (isAIFunFactsStep) return "onboarding-modal--fun-facts";
    return "";
  };

  // Render profile completion step
  if (isProfileCompletionStep) {
    return (
      <>
        <div className="onboarding-backdrop" />
        <div className={`onboarding-modal ${getModalClass()}`}>
          <div className="onboarding-content">
            <div className="onboarding-progress">
              <div
                className="onboarding-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              type="button"
              className="onboarding-skip"
              onClick={handleSkip}
            >
              Skip tour
            </button>
            <ProfileCompletion
              onComplete={handleProfileComplete}
              initialData={
                user
                  ? {
                      firstName: user.displayName?.split(" ")[0] || "",
                      lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
                    }
                  : undefined
              }
            />
            <div className="onboarding-counter">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render AI fun facts step
  if (isAIFunFactsStep && userDetails) {
    return (
      <>
        <div className="onboarding-backdrop" />
        <div className={`onboarding-modal ${getModalClass()}`}>
          <div className="onboarding-content">
            <div className="onboarding-progress">
              <div
                className="onboarding-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <AIFunFacts
              userProfile={userDetails}
              onComplete={handleFunFactsComplete}
              onSkip={handleFunFactsSkip}
            />
            <div className="onboarding-counter">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="onboarding-backdrop" />

      {/* Modal */}
      <div className={`onboarding-modal ${getModalClass()}`}>
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
            {isProfileSelectionStep && (
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

            {step.action && !isProfileSelectionStep && (
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
                  // Only allow clicking completed tour steps
                  if (
                    !isAnimating &&
                    index >= tourStartIndex &&
                    index <= currentStep
                  ) {
                    setCurrentStep(index);
                    saveStep(index);
                  }
                }}
                aria-label={`Go to step ${index + 1}: ${s.title}`}
                disabled={index < tourStartIndex}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="onboarding-nav">
            <button
              type="button"
              className="onboarding-nav-btn onboarding-nav-btn--prev"
              onClick={handlePrevious}
              disabled={currentStep <= tourStartIndex || isAnimating}
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
                {isProfileSelectionStep
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
