/**
 * Keyboard Shortcuts Hook
 *
 * Provides global keyboard navigation for the application.
 * Shortcuts:
 * - j/k: Navigate to next/previous article
 * - s: Save/unsave current article
 * - Shift+S: Open share menu
 * - Escape: Close modals/menus
 * - ?: Show keyboard shortcuts help
 * - /: Focus search
 * - Ctrl/Cmd+K: Toggle AI assistant
 */

import { useEffect, useCallback, useState } from "react";

export interface KeyboardShortcutHandlers {
  onNextArticle?: () => void;
  onPrevArticle?: () => void;
  onSaveArticle?: () => void;
  onShareArticle?: () => void;
  onCloseModal?: () => void;
  onShowHelp?: () => void;
  onFocusSearch?: () => void;
  onToggleAI?: () => void;
}

interface ShortcutDefinition {
  key: string;
  description: string;
  category: string;
  modifiers?: {
    shift?: boolean;
    ctrl?: boolean;
    meta?: boolean;
    alt?: boolean;
  };
}

export const KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  { key: "j", description: "Next article", category: "Navigation" },
  { key: "k", description: "Previous article", category: "Navigation" },
  { key: "/", description: "Focus search", category: "Navigation" },
  { key: "s", description: "Save/unsave article", category: "Actions" },
  {
    key: "S",
    description: "Open share menu",
    category: "Actions",
    modifiers: { shift: true },
  },
  { key: "Escape", description: "Close modal/menu", category: "General" },
  { key: "?", description: "Show keyboard shortcuts", category: "General" },
  {
    key: "k",
    description: "Toggle AI assistant",
    category: "General",
    modifiers: { ctrl: true },
  },
];

/**
 * Check if an element is an input-like element
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.getAttribute("contenteditable") === "true"
  );
}

/**
 * Global keyboard shortcuts hook
 */
export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  enabled = true,
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      if (isInputElement(document.activeElement)) {
        // Allow Escape in input fields
        if (event.key === "Escape" && handlers.onCloseModal) {
          handlers.onCloseModal();
          return;
        }
        return;
      }

      const { key, shiftKey, ctrlKey, metaKey } = event;

      // Ctrl/Cmd + K: Toggle AI assistant
      if ((ctrlKey || metaKey) && key.toLowerCase() === "k") {
        event.preventDefault();
        handlers.onToggleAI?.();
        return;
      }

      // Handle single key shortcuts
      switch (key) {
        case "j":
          if (!shiftKey && !ctrlKey && !metaKey) {
            event.preventDefault();
            handlers.onNextArticle?.();
          }
          break;

        case "k":
          if (!shiftKey && !ctrlKey && !metaKey) {
            event.preventDefault();
            handlers.onPrevArticle?.();
          }
          break;

        case "s":
          if (!ctrlKey && !metaKey) {
            event.preventDefault();
            if (shiftKey) {
              handlers.onShareArticle?.();
            } else {
              handlers.onSaveArticle?.();
            }
          }
          break;

        case "S":
          if (shiftKey && !ctrlKey && !metaKey) {
            event.preventDefault();
            handlers.onShareArticle?.();
          }
          break;

        case "/":
          event.preventDefault();
          handlers.onFocusSearch?.();
          break;

        case "?":
          event.preventDefault();
          handlers.onShowHelp?.();
          break;

        case "Escape":
          handlers.onCloseModal?.();
          break;
      }
    },
    [enabled, handlers],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Hook for keyboard shortcuts help modal state
 */
export function useShortcutsHelp(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  shortcuts: ShortcutDefinition[];
} {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    shortcuts: KEYBOARD_SHORTCUTS,
  };
}

/**
 * Format shortcut key for display
 */
export function formatShortcutKey(shortcut: ShortcutDefinition): string {
  const parts: string[] = [];

  if (shortcut.modifiers?.ctrl) {
    parts.push(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
  }
  if (shortcut.modifiers?.alt) {
    parts.push(navigator.platform.includes("Mac") ? "⌥" : "Alt");
  }
  if (shortcut.modifiers?.shift) {
    parts.push("⇧");
  }

  // Format special keys
  let keyDisplay = shortcut.key;
  switch (shortcut.key) {
    case "Escape":
      keyDisplay = "Esc";
      break;
    case " ":
      keyDisplay = "Space";
      break;
  }
  parts.push(keyDisplay);

  return parts.join(" + ");
}

export default useKeyboardShortcuts;
