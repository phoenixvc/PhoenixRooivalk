/**
 * Dark Mode Schedule Hook
 *
 * Provides automatic dark mode switching based on:
 * - Time of day schedule (e.g., 6 PM - 6 AM)
 * - System preference (prefers-color-scheme)
 * - Manual override
 */

import { useEffect, useState, useCallback } from "react";
import { useColorMode } from "@docusaurus/theme-common";

export type DarkModePreference = "system" | "light" | "dark" | "schedule";

export interface DarkModeSchedule {
  startHour: number; // 0-23, when dark mode starts
  endHour: number; // 0-23, when dark mode ends
}

const STORAGE_KEY = "phoenix-dark-mode-preference";
const SCHEDULE_KEY = "phoenix-dark-mode-schedule";

const DEFAULT_SCHEDULE: DarkModeSchedule = {
  startHour: 18, // 6 PM
  endHour: 6, // 6 AM
};

/**
 * Get stored preference from localStorage
 */
function getStoredPreference(): DarkModePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ["system", "light", "dark", "schedule"].includes(stored)) {
      return stored as DarkModePreference;
    }
  } catch {
    // Ignore localStorage errors
  }
  return "system";
}

/**
 * Get stored schedule from localStorage
 */
function getStoredSchedule(): DarkModeSchedule {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE;
  try {
    const stored = localStorage.getItem(SCHEDULE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        typeof parsed.startHour === "number" &&
        typeof parsed.endHour === "number"
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_SCHEDULE;
}

/**
 * Check if current time is within dark mode schedule
 */
function isWithinSchedule(schedule: DarkModeSchedule): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  // Handle schedule that spans midnight (e.g., 18:00 - 06:00)
  if (schedule.startHour > schedule.endHour) {
    return currentHour >= schedule.startHour || currentHour < schedule.endHour;
  }

  // Handle schedule within same day (e.g., 22:00 - 23:00)
  return currentHour >= schedule.startHour && currentHour < schedule.endHour;
}

/**
 * Get system dark mode preference
 */
function getSystemPreference(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Dark Mode Schedule Hook
 */
export function useDarkModeSchedule() {
  const { colorMode, setColorMode } = useColorMode();
  const [preference, setPreferenceState] = useState<DarkModePreference>(() =>
    getStoredPreference(),
  );
  const [schedule, setScheduleState] = useState<DarkModeSchedule>(() =>
    getStoredSchedule(),
  );
  const [systemPreference, setSystemPreference] = useState<"dark" | "light">(
    () => getSystemPreference(),
  );

  // Store preference
  const setPreference = useCallback((pref: DarkModePreference) => {
    setPreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Store schedule
  const setSchedule = useCallback((newSchedule: DarkModeSchedule) => {
    setScheduleState(newSchedule);
    try {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(newSchedule));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply color mode based on preference
  useEffect(() => {
    let targetMode: "dark" | "light";

    switch (preference) {
      case "light":
        targetMode = "light";
        break;
      case "dark":
        targetMode = "dark";
        break;
      case "schedule":
        targetMode = isWithinSchedule(schedule) ? "dark" : "light";
        break;
      case "system":
      default:
        targetMode = systemPreference;
        break;
    }

    if (colorMode !== targetMode) {
      setColorMode(targetMode);
    }
  }, [preference, schedule, systemPreference, colorMode, setColorMode]);

  // Check schedule periodically
  useEffect(() => {
    if (preference !== "schedule") return;

    const checkSchedule = () => {
      const shouldBeDark = isWithinSchedule(schedule);
      const targetMode = shouldBeDark ? "dark" : "light";
      if (colorMode !== targetMode) {
        setColorMode(targetMode);
      }
    };

    // Check every minute
    const interval = setInterval(checkSchedule, 60000);

    return () => clearInterval(interval);
  }, [preference, schedule, colorMode, setColorMode]);

  return {
    preference,
    setPreference,
    schedule,
    setSchedule,
    systemPreference,
    currentMode: colorMode as "dark" | "light",
    isScheduleActive: preference === "schedule" && isWithinSchedule(schedule),
  };
}

/**
 * Format hour for display (12-hour format with AM/PM)
 */
export function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

export default useDarkModeSchedule;
