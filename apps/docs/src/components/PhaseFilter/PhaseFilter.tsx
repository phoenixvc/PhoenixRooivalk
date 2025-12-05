/**
 * PhaseFilter Component
 * Provides a dropdown/button group to filter documentation by development phase
 */

import React from "react";
import {
  usePhaseFilter,
  PhaseFilter as PhaseFilterType,
  PHASE_INFO,
  Phase,
} from "../../contexts/PhaseFilterContext";
import "./PhaseFilter.css";

interface PhaseFilterProps {
  /** Display mode: dropdown or buttons */
  mode?: "dropdown" | "buttons";
  /** Show compact version */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Format phase name for display
 */
function formatPhaseName(phase: string): string {
  const info = PHASE_INFO[phase as Phase];
  if (info) {
    return info.shortLabel;
  }
  // Fallback: capitalize and format
  return phase
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function PhaseFilter({
  mode = "dropdown",
  compact = false,
  className = "",
}: PhaseFilterProps): React.ReactElement {
  const { currentPhase, setCurrentPhase, phaseOptions } = usePhaseFilter();

  if (mode === "buttons") {
    return (
      <div
        className={`phase-filter phase-filter--buttons ${compact ? "phase-filter--compact" : ""} ${className}`}
      >
        {!compact && (
          <span className="phase-filter__label">Filter by Phase:</span>
        )}
        <div className="phase-filter__button-group">
          {phaseOptions.map((option) => (
            <button
              key={option.value}
              className={`phase-filter__button ${currentPhase === option.value ? "phase-filter__button--active" : ""}`}
              onClick={() => setCurrentPhase(option.value)}
              title={
                option.value !== "all"
                  ? PHASE_INFO[option.value as Phase]?.description
                  : "Show all documents"
              }
            >
              {compact ? option.shortLabel : option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`phase-filter phase-filter--dropdown ${compact ? "phase-filter--compact" : ""} ${className}`}
    >
      {!compact && (
        <label className="phase-filter__label" htmlFor="phase-filter-select">
          Filter by Phase:
        </label>
      )}
      <select
        id="phase-filter-select"
        className="phase-filter__select"
        value={currentPhase}
        onChange={(e) => setCurrentPhase(e.target.value as PhaseFilterType)}
      >
        {phaseOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * PhaseIndicator Component
 * Shows the phases a document applies to
 */
interface PhaseIndicatorProps {
  phases: string[] | undefined;
  showMismatch?: boolean;
}

export function PhaseIndicator({
  phases,
  showMismatch = false,
}: PhaseIndicatorProps): React.ReactElement | null {
  const phaseFilter = usePhaseFilter();

  if (!phases || phases.length === 0) {
    return null;
  }

  const isMatch = phaseFilter.isPhaseMatch(phases as Phase[]);

  return (
    <div
      className={`phase-indicator ${!isMatch && showMismatch ? "phase-indicator--mismatch" : ""}`}
    >
      <span className="phase-indicator__label">Applies to:</span>
      <div className="phase-indicator__badges">
        {phases.map((phase) => (
          <span
            key={phase}
            className={`phase-indicator__badge phase-indicator__badge--${phase} ${
              phaseFilter.currentPhase === phase
                ? "phase-indicator__badge--active"
                : ""
            }`}
          >
            {formatPhaseName(phase)}
          </span>
        ))}
      </div>
      {!isMatch && showMismatch && (
        <div className="phase-indicator__mismatch-warning">
          This document does not apply to the currently selected phase filter.
        </div>
      )}
    </div>
  );
}

/**
 * PhaseBanner Component
 * Shows a banner at the top of a doc if it doesn't match the current filter
 */
interface PhaseBannerProps {
  phases: string[] | undefined;
}

export function PhaseBanner({
  phases,
}: PhaseBannerProps): React.ReactElement | null {
  const { currentPhase, isPhaseMatch, setCurrentPhase, getPhaseInfo } =
    usePhaseFilter();

  // Don't show if filter is "all" or phases match
  if (currentPhase === "all" || !phases || isPhaseMatch(phases as Phase[])) {
    return null;
  }

  const currentPhaseInfo = getPhaseInfo(currentPhase as Phase);
  const currentPhaseLabel = currentPhaseInfo?.shortLabel || currentPhase;

  return (
    <div className="phase-banner phase-banner--mismatch">
      <div className="phase-banner__content">
        <span className="phase-banner__icon">&#9432;</span>
        <span className="phase-banner__text">
          This document applies to{" "}
          <strong>{phases.map(formatPhaseName).join(", ")}</strong>, not the
          currently selected <strong>{currentPhaseLabel}</strong>.
        </span>
        <button
          className="phase-banner__action"
          onClick={() => setCurrentPhase("all")}
        >
          Show All Phases
        </button>
      </div>
    </div>
  );
}

export default PhaseFilter;
