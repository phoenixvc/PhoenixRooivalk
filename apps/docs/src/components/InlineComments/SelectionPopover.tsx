/**
 * SelectionPopover Component
 *
 * Shows a popover button when text is selected, allowing users to add inline comments.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "./InlineComments.module.css";
import type { TextSelection } from "./types";

interface SelectionPopoverProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onAddComment: (selection: TextSelection) => void;
  disabled?: boolean;
}

export function SelectionPopover({
  containerRef,
  onAddComment,
  disabled = false,
}: SelectionPopoverProps): React.ReactElement | null {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Get surrounding context for the selected text
  const getTextContext = useCallback((range: Range): string => {
    const container = range.commonAncestorContainer;
    const textContent = container.textContent || "";
    const start = Math.max(0, range.startOffset - 50);
    const end = Math.min(textContent.length, range.endOffset + 50);
    return textContent.slice(start, end);
  }, []);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    if (disabled) return;

    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.isCollapsed) {
      setSelection(null);
      return;
    }

    const selectedText = windowSelection.toString().trim();
    if (!selectedText || selectedText.length < 3) {
      setSelection(null);
      return;
    }

    // Check if selection is within our container
    const range = windowSelection.getRangeAt(0);
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }

    // Get position for popover
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setPosition({
      top: rect.top - containerRect.top - 40,
      left: rect.left - containerRect.left + rect.width / 2,
    });

    setSelection({
      text: selectedText,
      context: getTextContext(range),
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      rect,
    });
  }, [containerRef, disabled, getTextContext]);

  // Handle click outside to close
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
      // Small delay to allow button click to register
      setTimeout(() => setSelection(null), 100);
    }
  }, []);

  // Handle keyboard shortcut (Ctrl/Cmd + Shift + C)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "c") {
        if (selection) {
          e.preventDefault();
          onAddComment(selection);
          setSelection(null);
        }
      }
      // Escape to close
      if (e.key === "Escape") {
        setSelection(null);
      }
    },
    [selection, onAddComment],
  );

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMouseUp, handleClickOutside, handleKeyDown]);

  if (!selection) return null;

  return (
    <div
      ref={popoverRef}
      className={styles.selectionPopover}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <button
        className={styles.addCommentBtn}
        onClick={() => {
          onAddComment(selection);
          setSelection(null);
          window.getSelection()?.removeAllRanges();
        }}
        title="Add comment (Ctrl+Shift+C)"
      >
        <span className={styles.commentIcon}>{"\uD83D\uDCAC"}</span>
        <span>Comment</span>
      </button>
    </div>
  );
}

export default SelectionPopover;
