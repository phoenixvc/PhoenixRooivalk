/**
 * SidebarPhaseFilter Component
 * Adds phase filter dropdown to the docs sidebar
 */

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePhaseFilter, PhaseFilter as PhaseFilterType } from "../../contexts/PhaseFilterContext";
import "./PhaseFilter.css";

export function SidebarPhaseFilter(): React.ReactElement | null {
  const { currentPhase, setCurrentPhase, phaseOptions } = usePhaseFilter();
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

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

  const filterContent = (
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
      {currentPhase !== "all" && (
        <button
          className="phase-filter__clear"
          onClick={() => setCurrentPhase("all")}
          title="Clear filter"
        >
          Clear
        </button>
      )}
    </div>
  );

  return createPortal(filterContent, container);
}

export default SidebarPhaseFilter;
