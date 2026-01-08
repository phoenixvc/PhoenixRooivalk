/**
 * Swizzled DocSidebarItem Component
 *
 * Wraps the original DocSidebarItem to add phase-based filtering.
 * Documents with phase frontmatter that doesn't match the current filter
 * will be hidden from the sidebar.
 */

import React, { useMemo } from "react";
import DocSidebarItemOriginal from "@theme-original/DocSidebarItem";
import type { Props } from "@theme/DocSidebarItem";
import { usePluginData } from "@docusaurus/useGlobalData";
import { usePhaseFilterSafe, Phase } from "../../contexts/PhaseFilterContext";

// Type for the plugin's global data
interface PhasePluginData {
  phaseMap: Record<string, Phase[]>;
}

/**
 * Get phase data from plugin global data
 */
function usePhaseMap(): Record<string, Phase[]> {
  try {
    const pluginData = usePluginData(
      "sidebar-phase-enricher"
    ) as PhasePluginData | undefined;
    return pluginData?.phaseMap || {};
  } catch {
    // Plugin not loaded - return empty map
    return {};
  }
}

/**
 * Get the docId from a sidebar item, handling various formats
 */
function getDocId(item: Props["item"]): string | null {
  if (item.type !== "doc") {
    return null;
  }

  // Try different properties that might hold the doc ID
  const docItem = item as {
    docId?: string;
    id?: string;
    href?: string;
  };

  if (docItem.docId) {
    return docItem.docId;
  }

  if (docItem.id) {
    return docItem.id;
  }

  // Extract from href if available
  if (docItem.href) {
    const match = docItem.href.match(/\/docs\/(.+?)(?:\/?$)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if an item should be visible based on the current phase filter
 */
function shouldShowItem(
  item: Props["item"],
  currentPhase: string,
  phaseMap: Record<string, Phase[]>,
  isPhaseMatch: (phases: Phase[] | undefined) => boolean
): boolean {
  // Always show if filter is "all"
  if (currentPhase === "all") {
    return true;
  }

  // For doc items, check their phase metadata
  if (item.type === "doc") {
    const docId = getDocId(item);

    if (docId) {
      // Look up phase data
      const phases = phaseMap[docId];

      if (phases && phases.length > 0) {
        return isPhaseMatch(phases);
      }

      // Also try variations of the docId (with/without leading path)
      const variations = [
        docId,
        docId.replace(/^\//, ""),
        `docs/${docId}`,
      ];

      for (const variant of variations) {
        const variantPhases = phaseMap[variant];
        if (variantPhases && variantPhases.length > 0) {
          return isPhaseMatch(variantPhases);
        }
      }
    }

    // No phase metadata - show by default
    return true;
  }

  // For category items, check if any children would be visible
  if (item.type === "category") {
    const items = item.items;
    if (items && items.length > 0) {
      // Category is visible if at least one child is visible
      return items.some((childItem) =>
        shouldShowItem(childItem, currentPhase, phaseMap, isPhaseMatch)
      );
    }
    return true;
  }

  // For link items and others, always show
  return true;
}

/**
 * Wrapper component that adds phase filtering
 */
export default function DocSidebarItem(props: Props): JSX.Element | null {
  const phaseFilter = usePhaseFilterSafe();
  const phaseMap = usePhaseMap();
  const { item } = props;

  // Memoize visibility calculation
  const isVisible = useMemo(() => {
    if (!phaseFilter) {
      // No filter context available - show everything
      return true;
    }

    return shouldShowItem(
      item,
      phaseFilter.currentPhase,
      phaseMap,
      phaseFilter.isPhaseMatch
    );
  }, [item, phaseFilter, phaseMap]);

  // Hide items that don't match the filter
  if (!isVisible) {
    return null;
  }

  // Render the original component
  return <DocSidebarItemOriginal {...props} />;
}
