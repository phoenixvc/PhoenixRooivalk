/**
 * LocalStorage Utilities
 *
 * Utilities for managing localStorage with a focus on onboarding and profile data.
 */

// All known localStorage keys used by the application
const ONBOARDING_KEYS = [
  "phoenix-docs-onboarding-completed",
  "phoenix-docs-onboarding-step",
  "phoenix-docs-profile-confirmed",
  "phoenix-docs-user-profile",
  "phoenix-docs-profile-pending",
  "phoenix-docs-user-details",
  "phoenix-docs-user-fun-facts",
];

/**
 * Clear all onboarding-related localStorage data.
 * Use this to reset a user's onboarding state and force them through the flow again.
 * This is useful when debugging or when there's corrupted state.
 */
export function clearOnboardingData(): void {
  if (typeof window === "undefined") return;

  ONBOARDING_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage key: ${key}`, error);
    }
  });

  console.log(
    "Onboarding localStorage data cleared. User will see onboarding flow on next page load.",
  );
}

/**
 * Clear ALL localStorage data for the application.
 * WARNING: This will reset all user preferences, progress, and cached data.
 * Use with caution - typically only for debugging or at user request.
 */
export function clearAllLocalStorage(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.clear();
    console.log(
      "All localStorage data cleared. Page will reload to reset state.",
    );
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
}

/**
 * Get diagnostic information about current localStorage state.
 * Useful for debugging onboarding issues.
 */
export function getOnboardingDiagnostics(): {
  keys: Array<{ key: string; value: string | null; parsed?: unknown }>;
  totalSize: number;
} {
  if (typeof window === "undefined") {
    return { keys: [], totalSize: 0 };
  }

  let totalSize = 0;
  const keys = ONBOARDING_KEYS.map((key) => {
    const value = localStorage.getItem(key);
    const size = value ? new Blob([value]).size : 0;
    totalSize += size;

    let parsed: unknown = undefined;
    if (value) {
      try {
        parsed = JSON.parse(value);
      } catch {
        // Not JSON, leave as undefined
      }
    }

    return { key, value, parsed };
  });

  return { keys, totalSize };
}

/**
 * Check if onboarding data appears to be corrupted or in an invalid state.
 * Returns true if there are signs of corruption.
 */
export function isOnboardingDataCorrupted(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // Check if profile confirmed but no profile data
    const confirmed = localStorage.getItem("phoenix-docs-profile-confirmed");
    const profileData = localStorage.getItem("phoenix-docs-user-profile");

    if (confirmed) {
      const confirmedData = JSON.parse(confirmed);
      if (confirmedData.confirmed && !confirmedData.skipped && !profileData) {
        return true; // Profile confirmed but no profile data exists
      }
    }

    // Check if onboarding completed but no profile
    const completed = localStorage.getItem("phoenix-docs-onboarding-completed");
    if (completed) {
      const completedData = JSON.parse(completed);
      if (completedData.completed && !confirmed) {
        return true; // Onboarding completed but no profile confirmation
      }
    }

    return false;
  } catch {
    // If we can't parse, consider it potentially corrupted
    return true;
  }
}

/**
 * Attempt to auto-fix corrupted onboarding data.
 * Returns true if a fix was attempted.
 */
export function autoFixOnboardingData(): boolean {
  if (!isOnboardingDataCorrupted()) {
    return false;
  }

  console.warn(
    "Detected corrupted onboarding data. Clearing to force fresh start.",
  );
  clearOnboardingData();
  return true;
}
