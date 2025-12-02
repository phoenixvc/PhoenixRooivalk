/**
 * Phase Filter Context for Phoenix Rooivalk Documentation
 * Provides phase filtering state across the documentation site
 *
 * Phases:
 * - phase-1: Concept (TRL 3-4) - Architecture validation, simulation
 * - phase-2: Prototype (TRL 4-6) - Hardware demo, lab tests
 * - phase-3: Integration (TRL 6-7) - Field trials, certification readiness
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from "react";

// Phase types
export type Phase = "phase-1" | "phase-2" | "phase-3";
export type PhaseFilter = Phase | "all";

// Phase metadata
export const PHASE_INFO: Record<Phase, { label: string; trl: string; description: string }> = {
  "phase-1": {
    label: "Phase 1: Concept",
    trl: "TRL 3-4",
    description: "Architecture validation, simulation",
  },
  "phase-2": {
    label: "Phase 2: Prototype",
    trl: "TRL 4-6",
    description: "Hardware demo, lab tests",
  },
  "phase-3": {
    label: "Phase 3: Integration",
    trl: "TRL 6-7",
    description: "Field trials, certification readiness",
  },
};

// Local storage key
const PHASE_FILTER_KEY = "phoenix-docs-phase-filter";

interface PhaseFilterContextType {
  // Current filter
  currentPhase: PhaseFilter;
  setCurrentPhase: (phase: PhaseFilter) => void;

  // Helper functions
  isPhaseMatch: (docPhases: Phase[] | undefined) => boolean;
  getPhaseLabel: (phase: Phase) => string;

  // All phase options
  phaseOptions: { value: PhaseFilter; label: string }[];
}

const PhaseFilterContext = createContext<PhaseFilterContextType | undefined>(undefined);

interface PhaseFilterProviderProps {
  children: ReactNode;
}

export function PhaseFilterProvider({ children }: PhaseFilterProviderProps): React.ReactElement {
  // Initialize from localStorage if available
  const [currentPhase, setCurrentPhaseState] = useState<PhaseFilter>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PHASE_FILTER_KEY);
      if (stored && (stored === "all" || stored in PHASE_INFO)) {
        return stored as PhaseFilter;
      }
    }
    return "all";
  });

  // Persist to localStorage
  const setCurrentPhase = useCallback((phase: PhaseFilter) => {
    setCurrentPhaseState(phase);
    if (typeof window !== "undefined") {
      localStorage.setItem(PHASE_FILTER_KEY, phase);
    }
  }, []);

  // Check if a document matches the current phase filter
  const isPhaseMatch = useCallback(
    (docPhases: Phase[] | undefined): boolean => {
      // If filter is "all", everything matches
      if (currentPhase === "all") return true;

      // If doc has no phase metadata, show it by default
      if (!docPhases || docPhases.length === 0) return true;

      // Check if the doc's phases include the current filter
      return docPhases.includes(currentPhase);
    },
    [currentPhase]
  );

  // Get label for a phase
  const getPhaseLabel = useCallback((phase: Phase): string => {
    return PHASE_INFO[phase]?.label || phase;
  }, []);

  // Phase options for dropdown
  const phaseOptions = useMemo(
    () => [
      { value: "all" as PhaseFilter, label: "All Phases" },
      { value: "phase-1" as PhaseFilter, label: "Phase 1: Concept (TRL 3-4)" },
      { value: "phase-2" as PhaseFilter, label: "Phase 2: Prototype (TRL 4-6)" },
      { value: "phase-3" as PhaseFilter, label: "Phase 3: Integration (TRL 6-7)" },
    ],
    []
  );

  // Sync with localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PHASE_FILTER_KEY);
      if (stored && (stored === "all" || stored in PHASE_INFO)) {
        setCurrentPhaseState(stored as PhaseFilter);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      currentPhase,
      setCurrentPhase,
      isPhaseMatch,
      getPhaseLabel,
      phaseOptions,
    }),
    [currentPhase, setCurrentPhase, isPhaseMatch, getPhaseLabel, phaseOptions]
  );

  return (
    <PhaseFilterContext.Provider value={value}>
      {children}
    </PhaseFilterContext.Provider>
  );
}

export function usePhaseFilter(): PhaseFilterContextType {
  const context = useContext(PhaseFilterContext);
  if (context === undefined) {
    throw new Error("usePhaseFilter must be used within a PhaseFilterProvider");
  }
  return context;
}

// Export for conditional use (won't throw if not in provider)
export function usePhaseFilterSafe(): PhaseFilterContextType | null {
  return useContext(PhaseFilterContext) ?? null;
}
