/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays available keyboard shortcuts grouped by category.
 */

import React, { useEffect, useRef } from "react";
import {
  KEYBOARD_SHORTCUTS,
  formatShortcutKey,
} from "../../hooks/useKeyboardShortcuts";
import styles from "./KeyboardShortcutsModal.module.css";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps): React.ReactElement | null {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = KEYBOARD_SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, typeof KEYBOARD_SHORTCUTS>,
  );

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>Keyboard Shortcuts</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className={styles.category}>
              <h3 className={styles.categoryTitle}>{category}</h3>
              <dl className={styles.shortcutList}>
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className={styles.shortcutItem}>
                    <dt className={styles.shortcutKey}>
                      <kbd>{formatShortcutKey(shortcut)}</kbd>
                    </dt>
                    <dd className={styles.shortcutDesc}>
                      {shortcut.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <span className={styles.hint}>
            Press <kbd>?</kbd> anytime to show this help
          </span>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
