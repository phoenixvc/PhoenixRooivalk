"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  TOUR_CONFIG,
  hasTourCompleted,
  markTourCompleted,
  markTourSkipped,
  getCurrentStep,
  setCurrentStep,
} from "../../config/tour";
import styles from "./Tour.module.css";

export function Tour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStepState] = useState(0);

  useEffect(() => {
    // Check if tour should auto-start
    if (
      TOUR_CONFIG.autoStart &&
      !hasTourCompleted() &&
      typeof window !== "undefined"
    ) {
      // Delay to let page load
      const timer = setTimeout(() => {
        setIsOpen(true);
        const savedStep = getCurrentStep();
        setCurrentStepState(savedStep);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_CONFIG.steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStepState(nextStep);
      setCurrentStep(nextStep);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStepState(prevStep);
      setCurrentStep(prevStep);
    }
  };

  const handleComplete = () => {
    markTourCompleted();
    setIsOpen(false);
  };

  const handleSkip = () => {
    markTourSkipped();
    setIsOpen(false);
  };

  if (!isOpen || hasTourCompleted()) {
    return null;
  }

  const step = TOUR_CONFIG.steps[currentStep];
  const progress = ((currentStep + 1) / TOUR_CONFIG.steps.length) * 100;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.stepIndicator}>
              Step {currentStep + 1} of {TOUR_CONFIG.steps.length}
            </div>
            <button
              className={styles.closeButton}
              onClick={handleComplete}
              aria-label="Close tour"
            >
              ×
            </button>
          </div>

          <div className={styles.content}>
            <h2 className={styles.title}>{step.title}</h2>
            <p className={styles.description}>{step.content}</p>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={TOUR_CONFIG.steps.length}
              aria-label={`Tour progress: step ${currentStep + 1} of ${TOUR_CONFIG.steps.length}`}
            />
          </div>

          <div className={styles.footer}>
            <div className={styles.buttonGroup}>
              {currentStep > 0 && (
                <button
                  className={styles.previousButton}
                  onClick={handlePrevious}
                >
                  Previous
                </button>
              )}

              {TOUR_CONFIG.enableSkip && currentStep === 0 && (
                <button className={styles.skipButton} onClick={handleSkip}>
                  Skip Tour
                </button>
              )}
            </div>

            <button className={styles.nextButton} onClick={handleNext}>
              {currentStep === TOUR_CONFIG.steps.length - 1
                ? "Get Started"
                : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
