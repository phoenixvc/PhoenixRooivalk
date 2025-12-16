"use client";

import { useCallback, useEffect, useRef } from "react";

export interface KeyboardNavigationOptions {
  /** Enable arrow key navigation */
  enableArrowKeys?: boolean;
  /** Enable Home/End key navigation */
  enableHomeEnd?: boolean;
  /** Enable type-ahead search */
  enableTypeAhead?: boolean;
  /** Wrap navigation at ends */
  loop?: boolean;
  /** Orientation for arrow keys */
  orientation?: "horizontal" | "vertical" | "both";
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Callback when enter is pressed on an item */
  onSelect?: (index: number) => void;
  /** Selector for focusable items */
  itemSelector?: string;
}

/**
 * Hook for keyboard navigation in lists, menus, and other navigable containers.
 * Implements WAI-ARIA patterns for keyboard accessibility.
 *
 * Usage:
 * ```tsx
 * const { containerRef, activeIndex } = useKeyboardNavigation({
 *   orientation: 'vertical',
 *   loop: true,
 *   onSelect: (index) => handleItemSelect(index),
 *   onEscape: () => closeMenu(),
 * });
 * ```
 */
export function useKeyboardNavigation<T extends HTMLElement = HTMLElement>(
  options: KeyboardNavigationOptions = {},
) {
  const {
    enableArrowKeys = true,
    enableHomeEnd = true,
    enableTypeAhead = false,
    loop = true,
    orientation = "vertical",
    onEscape,
    onSelect,
    itemSelector = '[role="menuitem"], [role="option"], [role="tab"], a, button',
  } = options;

  const containerRef = useRef<T>(null);
  const activeIndexRef = useRef<number>(-1);
  const typeAheadBufferRef = useRef<string>("");
  const typeAheadTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const getFocusableItems = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(itemSelector),
    ).filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.getAttribute("aria-disabled") !== "true" &&
        el.tabIndex !== -1,
    );
  }, [itemSelector]);

  const focusItem = useCallback(
    (index: number) => {
      const items = getFocusableItems();
      if (items.length === 0) return;

      // Handle bounds
      let targetIndex = index;
      if (loop) {
        targetIndex = ((index % items.length) + items.length) % items.length;
      } else {
        targetIndex = Math.max(0, Math.min(index, items.length - 1));
      }

      const item = items[targetIndex];
      if (item) {
        item.focus();
        activeIndexRef.current = targetIndex;
      }
    },
    [getFocusableItems, loop],
  );

  const handleTypeAhead = useCallback(
    (char: string) => {
      if (!enableTypeAhead) return;

      // Clear previous timeout
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current);
      }

      // Add character to buffer
      typeAheadBufferRef.current += char.toLowerCase();

      // Find matching item
      const items = getFocusableItems();
      const matchIndex = items.findIndex((item) => {
        const text = item.textContent?.toLowerCase() || "";
        return text.startsWith(typeAheadBufferRef.current);
      });

      if (matchIndex !== -1) {
        focusItem(matchIndex);
      }

      // Clear buffer after delay
      typeAheadTimeoutRef.current = setTimeout(() => {
        typeAheadBufferRef.current = "";
      }, 500);
    },
    [enableTypeAhead, getFocusableItems, focusItem],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const items = getFocusableItems();
      if (items.length === 0) return;

      const currentIndex = items.findIndex(
        (item) => item === document.activeElement,
      );

      switch (event.key) {
        case "ArrowDown":
          if (
            enableArrowKeys &&
            (orientation === "vertical" || orientation === "both")
          ) {
            event.preventDefault();
            focusItem(currentIndex + 1);
          }
          break;

        case "ArrowUp":
          if (
            enableArrowKeys &&
            (orientation === "vertical" || orientation === "both")
          ) {
            event.preventDefault();
            focusItem(currentIndex - 1);
          }
          break;

        case "ArrowRight":
          if (
            enableArrowKeys &&
            (orientation === "horizontal" || orientation === "both")
          ) {
            event.preventDefault();
            focusItem(currentIndex + 1);
          }
          break;

        case "ArrowLeft":
          if (
            enableArrowKeys &&
            (orientation === "horizontal" || orientation === "both")
          ) {
            event.preventDefault();
            focusItem(currentIndex - 1);
          }
          break;

        case "Home":
          if (enableHomeEnd) {
            event.preventDefault();
            focusItem(0);
          }
          break;

        case "End":
          if (enableHomeEnd) {
            event.preventDefault();
            focusItem(items.length - 1);
          }
          break;

        case "Escape":
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case "Enter":
        case " ":
          if (onSelect && currentIndex !== -1) {
            event.preventDefault();
            onSelect(currentIndex);
          }
          break;

        default:
          // Handle type-ahead for single printable characters
          if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            handleTypeAhead(event.key);
          }
          break;
      }
    },
    [
      enableArrowKeys,
      enableHomeEnd,
      orientation,
      onEscape,
      onSelect,
      getFocusableItems,
      focusItem,
      handleTypeAhead,
    ],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  return {
    containerRef,
    activeIndex: activeIndexRef.current,
    focusItem,
    focusFirst: () => focusItem(0),
    focusLast: () => focusItem(getFocusableItems().length - 1),
  };
}

export default useKeyboardNavigation;
