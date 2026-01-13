import * as React from "react";
import styles from "./ThreatSimulatorOverlays.module.css";

interface ThreatSimulatorOverlaysProps {
  showSimulationWarning: boolean;
  setShowSimulationWarning: (show: boolean) => void;
  showFullscreenPrompt: boolean;
  setShowFullscreenPrompt?: (show: boolean) => void;
  isTeaser: boolean;
  isFullscreen: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  showFullscreenIndicator?: boolean;
}

export const ThreatSimulatorOverlays: React.FC<
  ThreatSimulatorOverlaysProps
> = ({
  showSimulationWarning,
  setShowSimulationWarning,
  showFullscreenPrompt,
  setShowFullscreenPrompt,
  isTeaser: _isTeaser,
  isFullscreen,
  enterFullscreen,
  exitFullscreen: _exitFullscreen,
  showFullscreenIndicator: _showFullscreenIndicator = false,
}) => {
  return (
    <>
      {/* Simulation Warning */}
      {showSimulationWarning && (
        <div className={styles.warningBanner}>
          <div className={styles.warningContent}>
            <div className={styles.warningLeft}>
              <div className={styles.warningIcon}>
                <span className={styles.warningIconEmoji}>⚠️</span>
              </div>
              <div>
                <div className={styles.warningTitle}>
                  SIMULATION MODULE
                </div>
                <div className={styles.warningDescription}>
                  This interactive module is designed to visualize concepts. It
                  does not represent real-world sensor performance, detection
                  ranges, or decision latency.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSimulationWarning(false)}
              className={styles.warningClose}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Enhanced Fullscreen Prompt */}
      {showFullscreenPrompt && !isFullscreen && (
        <div className={styles.fullscreenOverlay}>
          <div className={styles.fullscreenPrompt}>
            <div className={styles.fullscreenIconContainer}>
              <svg
                className={styles.fullscreenIconSvg}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </div>
            <h3 className={styles.fullscreenTitle}>
              Fullscreen Mode
            </h3>
            <p className={styles.fullscreenDescription}>
              Experience the threat simulation in fullscreen for optimal
              tactical visualization and precise control.
            </p>
            <div className={styles.fullscreenButtons}>
              <button
                className={styles.fullscreenEnterBtn}
                onClick={enterFullscreen}
                aria-label="Enter fullscreen mode"
              >
                <svg
                  className={styles.fullscreenBtnIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                Enter Fullscreen
              </button>
              <button
                className={styles.fullscreenWindowBtn}
                onClick={() => setShowFullscreenPrompt?.(false)}
                aria-label="Continue in windowed mode"
              >
                Continue in Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
