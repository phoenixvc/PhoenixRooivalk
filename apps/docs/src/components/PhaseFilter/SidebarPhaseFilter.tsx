/**
 * SidebarPhaseFilter Component
 * Adds phase and role filter dropdowns to the docs sidebar
 */

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  usePhaseFilter,
  PhaseFilter as PhaseFilterType,
} from "../../contexts/PhaseFilterContext";
import { AVAILABLE_ROLES } from "../../config/userProfiles";
import "./PhaseFilter.css";

// Role filter local storage key
const ROLE_FILTER_KEY = "phoenix-docs-role-filter";

// Role groups for easier selection
const ROLE_GROUPS = {
  "Executive & Business": [
    "Executive",
    "Business",
    "Financial",
    "Sales",
    "Marketing",
  ],
  Technical: ["Technical - Software/AI", "Technical - Mechanical", "Research"],
  "Operations & Support": ["Operations", "Legal", "Product", "Advisory"],
  Leadership: ["Founder", "Lead"],
};

export function SidebarPhaseFilter(): React.ReactElement | null {
  const { currentPhase, setCurrentPhase, phaseOptions } = usePhaseFilter();
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [currentRole, setCurrentRoleState] = useState<string>("all");

  // Load role from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ROLE_FILTER_KEY);
      if (
        stored &&
        (stored === "all" ||
          AVAILABLE_ROLES.includes(stored as (typeof AVAILABLE_ROLES)[number]))
      ) {
        setCurrentRoleState(stored);
      }
    }
  }, []);

  // Set role and persist to localStorage
  const setCurrentRole = useCallback((role: string) => {
    setCurrentRoleState(role);
    if (typeof window !== "undefined") {
      localStorage.setItem(ROLE_FILTER_KEY, role);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // Find or create container in sidebar
    const findSidebarContainer = () => {
      // Look for the sidebar menu
      const sidebar = document.querySelector(".theme-doc-sidebar-menu");
      if (!sidebar) return null;

      // Check if we already added our container
      let filterContainer = document.getElementById("phase-filter-container");
      if (filterContainer) return filterContainer;

      // Create and insert container at the top of the sidebar
      filterContainer = document.createElement("div");
      filterContainer.id = "phase-filter-container";
      filterContainer.className = "sidebar-phase-filter";

      // Insert at the beginning of the sidebar
      sidebar.parentElement?.insertBefore(filterContainer, sidebar);

      return filterContainer;
    };

    // Retry finding the sidebar (it may not be rendered immediately)
    const attemptMount = (attempts = 0) => {
      const sidebarContainer = findSidebarContainer();
      if (sidebarContainer) {
        setContainer(sidebarContainer);
      } else if (attempts < 10) {
        setTimeout(() => attemptMount(attempts + 1), 200);
      }
    };

    attemptMount();

    // Re-attempt on route changes
    const observer = new MutationObserver(() => {
      attemptMount();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      // Clean up container
      const containerEl = document.getElementById("phase-filter-container");
      if (containerEl) {
        containerEl.remove();
      }
    };
  }, []);

  if (!mounted || !container) {
    return null;
  }

  const hasActiveFilters = currentPhase !== "all" || currentRole !== "all";

  const filterContent = (
    <div className="sidebar-filters">
      {/* Phase Filter */}
      <div className="phase-filter phase-filter--sidebar">
        <label className="phase-filter__label" htmlFor="sidebar-phase-select">
          Filter by Phase
        </label>
        <select
          id="sidebar-phase-select"
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

      {/* Role Filter */}
      <div className="phase-filter phase-filter--sidebar">
        <label className="phase-filter__label" htmlFor="sidebar-role-select">
          Filter by Role
        </label>
        <select
          id="sidebar-role-select"
          className="phase-filter__select"
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          {Object.entries(ROLE_GROUPS).map(([groupName, roles]) => (
            <optgroup key={groupName} label={groupName}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <button
          className="phase-filter__clear"
          onClick={() => {
            setCurrentPhase("all");
            setCurrentRole("all");
          }}
          title="Clear all filters"
        >
          Clear
        </button>
      )}
    </div>
  );

  return createPortal(filterContent, container);
}

export default SidebarPhaseFilter;
