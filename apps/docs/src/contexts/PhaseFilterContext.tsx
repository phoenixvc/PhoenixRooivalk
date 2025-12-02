/**
 * Phase Filter Context for Phoenix Rooivalk Documentation
 * Provides phase filtering state across the documentation site
 *
 * Phases aligned with funding rounds and product evolution:
 * - seed: SkySnare Launch (Nov 2025 - Oct 2026) - Consumer product, prototype
 * - series-a: AeroNet & DoD (Nov 2026 - 2027) - Enterprise, SBIR validation
 * - series-b: Ground Systems (2028) - RKV-G Rover/GCS, production scale
 * - series-c: Aerial Platform (2029) - RKV-M Mothership, RKV-I Interceptors
 * - scale: Global Deployment (2030+) - Full system, FMS, NATO
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

// Phase types - aligned with funding rounds
export type Phase = "seed" | "series-a" | "series-b" | "series-c" | "scale";
export type PhaseFilter = Phase | "all";

// Phase metadata with full details
export const PHASE_INFO: Record<
  Phase,
  {
    label: string;
    shortLabel: string;
    timeline: string;
    trl: string;
    products: string[];
    funding: string;
    description: string;
  }
> = {
  seed: {
    label: "Seed: SkySnare Launch",
    shortLabel: "Seed",
    timeline: "Nov 2025 - Oct 2026",
    trl: "TRL 3-5",
    products: ["SkySnare D2C", "Core prototype"],
    funding: "$1.5M",
    description: "Consumer product launch, prototype validation",
  },
  "series-a": {
    label: "Series A: AeroNet & DoD",
    shortLabel: "Series A",
    timeline: "Nov 2026 - 2027",
    trl: "TRL 5-6",
    products: ["AeroNet Enterprise", "SBIR/DoD validation"],
    funding: "$8-12M",
    description: "Enterprise launch, DoD validation, SBIR contracts",
  },
  "series-b": {
    label: "Series B: Ground Systems",
    shortLabel: "Series B",
    timeline: "2028",
    trl: "TRL 6-7",
    products: ["RKV-G Rover/GCS", "Production scale"],
    funding: "$15-20M",
    description: "Ground control systems, production scaling",
  },
  "series-c": {
    label: "Series C: Aerial Platform",
    shortLabel: "Series C",
    timeline: "2029",
    trl: "TRL 7+",
    products: ["RKV-M Mothership", "RKV-I Interceptors"],
    funding: "$25M+",
    description: "Full aerial platform, interceptor systems",
  },
  scale: {
    label: "Scale: Global Deployment",
    shortLabel: "Scale",
    timeline: "2030+",
    trl: "TRL 8-9",
    products: ["Full integrated system", "FMS", "NATO"],
    funding: "Revenue-funded",
    description: "Global deployment, FMS programs, NATO certification",
  },
};

// Local storage key
const PHASE_FILTER_KEY = "phoenix-docs-phase-filter";

// Valid phase values for validation
const VALID_PHASES: Phase[] = ["seed", "series-a", "series-b", "series-c", "scale"];

interface PhaseFilterContextType {
  // Current filter
  currentPhase: PhaseFilter;
  setCurrentPhase: (phase: PhaseFilter) => void;

  // Helper functions
  isPhaseMatch: (docPhases: Phase[] | undefined) => boolean;
  getPhaseLabel: (phase: Phase) => string;
  getPhaseInfo: (phase: Phase) => (typeof PHASE_INFO)[Phase] | undefined;

  // All phase options
  phaseOptions: { value: PhaseFilter; label: string; shortLabel: string }[];

  // Phase list for iteration
  phases: Phase[];
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
      if (stored === "all" || VALID_PHASES.includes(stored as Phase)) {
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

  // Get full info for a phase
  const getPhaseInfo = useCallback((phase: Phase) => {
    return PHASE_INFO[phase];
  }, []);

  // Phase options for dropdown
  const phaseOptions = useMemo(
    () => [
      { value: "all" as PhaseFilter, label: "All Phases", shortLabel: "All" },
      { value: "seed" as PhaseFilter, label: "Seed: SkySnare Launch", shortLabel: "Seed" },
      { value: "series-a" as PhaseFilter, label: "Series A: AeroNet & DoD", shortLabel: "Series A" },
      { value: "series-b" as PhaseFilter, label: "Series B: Ground Systems", shortLabel: "Series B" },
      { value: "series-c" as PhaseFilter, label: "Series C: Aerial Platform", shortLabel: "Series C" },
      { value: "scale" as PhaseFilter, label: "Scale: Global Deployment", shortLabel: "Scale" },
    ],
    []
  );

  // Sync with localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PHASE_FILTER_KEY);
      if (stored === "all" || VALID_PHASES.includes(stored as Phase)) {
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
      getPhaseInfo,
      phaseOptions,
      phases: VALID_PHASES,
    }),
    [currentPhase, setCurrentPhase, isPhaseMatch, getPhaseLabel, getPhaseInfo, phaseOptions]
  );

  return <PhaseFilterContext.Provider value={value}>{children}</PhaseFilterContext.Provider>;
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
