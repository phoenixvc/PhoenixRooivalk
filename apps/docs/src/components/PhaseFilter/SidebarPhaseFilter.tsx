/**
 * SidebarPhaseFilter Component
 * Adds phase and role filter dropdowns to the docs sidebar
 * Also includes collapse/expand all categories functionality
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  usePhaseFilter,
  PhaseFilter as PhaseFilterType,
} from "../../contexts/PhaseFilterContext";
import { AVAILABLE_ROLES } from "../../config/userProfiles";
import "./PhaseFilter.css";

// Role filter local storage key
const ROLE_FILTER_KEY = "phoenix-docs-role-filter";
const CATEGORIES_COLLAPSED_KEY = "phoenix-docs-categories-collapsed";

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

/**
 * Collapse all sidebar categories
 */
function collapseAllCategories(): void {
  if (typeof document === "undefined") return;

  // Find all expanded category buttons and click them to collapse
  const expandedCategories = document.querySelectorAll(
    ".menu__list-item--collapsed:not(.menu__list-item--collapsed) > .menu__link--sublist-caret," +
    ".menu__caret"
  );

  // Find all category containers that are NOT collapsed
  const categoryItems = document.querySelectorAll(
    ".menu__list-item:has(> .menu__link--sublist-caret):not(.menu__list-item--collapsed)"
  );

  categoryItems.forEach((item) => {
    const button = item.querySelector(".menu__link--sublist-caret, .menu__caret");
    if (button instanceof HTMLElement) {
      button.click();
    }
  });

  // Store state
  localStorage.setItem(CATEGORIES_COLLAPSED_KEY, "true");
}

/**
 * Expand all sidebar categories
 */
function expandAllCategories(): void {
  if (typeof document === "undefined") return;

  // Find all collapsed category items and expand them
  const collapsedItems = document.querySelectorAll(
    ".menu__list-item--collapsed"
  );

  collapsedItems.forEach((item) => {
    const button = item.querySelector(".menu__link--sublist-caret, .menu__caret");
    if (button instanceof HTMLElement) {
      button.click();
    }
  });

  // Store state
  localStorage.setItem(CATEGORIES_COLLAPSED_KEY, "false");
}

/**
 * Check if most categories are collapsed
 */
function areCategoriesCollapsed(): boolean {
  if (typeof document === "undefined") return false;

  const total = document.querySelectorAll(
    ".menu__list-item:has(> .menu__link--sublist-caret)"
  ).length;
  const collapsed = document.querySelectorAll(
    ".menu__list-item--collapsed"
  ).length;

  return collapsed > total / 2;
}

export function SidebarPhaseFilter(): React.ReactElement | null {
  const { currentPhase, setCurrentPhase, phaseOptions } = usePhaseFilter();
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [currentRole, setCurrentRoleState] = useState<string>("all");
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const checkCollapseStateRef = useRef<NodeJS.Timeout | null>(null);

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

      // Check collapse state periodically to stay in sync with manual collapses
      const checkState = () => {
        setCategoriesCollapsed(areCategoriesCollapsed());
      };

      // Initial check after a delay to let sidebar render
      setTimeout(checkState, 500);

      // Check periodically for manual collapse changes
      checkCollapseStateRef.current = setInterval(checkState, 1000);

      return () => {
        if (checkCollapseStateRef.current) {
          clearInterval(checkCollapseStateRef.current);
        }
      };
    }
  }, []);

  // Set role and persist to localStorage
  const setCurrentRole = useCallback((role: string) => {
    setCurrentRoleState(role);
    if (typeof window !== "undefined") {
      localStorage.setItem(ROLE_FILTER_KEY, role);
    }
  }, []);

  // Toggle collapse/expand all categories
  const handleToggleCategories = useCallback(() => {
    if (categoriesCollapsed) {
      expandAllCategories();
      setCategoriesCollapsed(false);
    } else {
      collapseAllCategories();
      setCategoriesCollapsed(true);
    }
  }, [categoriesCollapsed]);

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
    <div className="sidebar-filter-wrapper">
      {/* Top row: Filters */}
      <div className="sidebar-filters">
        {/* Phase Filter - Compact */}
        <select
          id="sidebar-phase-select"
          className="phase-filter__select"
          value={currentPhase}
          onChange={(e) => setCurrentPhase(e.target.value as PhaseFilterType)}
          title="Filter by Phase"
          aria-label="Filter documentation by development phase"
        >
          {phaseOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value === "all" ? "All Phases" : option.shortLabel}
            </option>
          ))}
        </select>

        {/* Role Filter - Compact */}
        <select
          id="sidebar-role-select"
          className="phase-filter__select"
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value)}
          title="Filter by Role"
          aria-label="Filter documentation by role"
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

      {/* Bottom row: Actions */}
      <div className="sidebar-actions">
        {/* Collapse/Expand All Categories */}
        <button
          type="button"
          className="sidebar-action-btn"
          onClick={handleToggleCategories}
          title={categoriesCollapsed ? "Expand all categories" : "Collapse all categories"}
          aria-label={categoriesCollapsed ? "Expand all categories" : "Collapse all categories"}
          aria-expanded={!categoriesCollapsed}
        >
          <span className="sidebar-action-icon" aria-hidden="true">
            {categoriesCollapsed ? "▶" : "▼"}
          </span>
          <span className="sidebar-action-text">
            {categoriesCollapsed ? "Expand All" : "Collapse All"}
          </span>
        </button>

        {/* Clear filters button - only show when filters are active */}
        {hasActiveFilters && (
          <button
            type="button"
            className="sidebar-action-btn sidebar-action-btn--clear"
            onClick={() => {
              setCurrentPhase("all");
              setCurrentRole("all");
            }}
            title="Clear all filters"
            aria-label="Clear all filters"
          >
            <span className="sidebar-action-icon" aria-hidden="true">✕</span>
            <span className="sidebar-action-text">Clear</span>
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(filterContent, container);
}

export default SidebarPhaseFilter;
