"use client";

import { FC, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";

interface ExitIntentModalProps {
  docsUrl: string;
}

export const ExitIntentModal: FC<ExitIntentModalProps> = ({ docsUrl }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle modal visibility and focus management
  useEffect(() => {
    if (!isVisible) return undefined;

    // Save current focus to return to when modal closes
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Save current body overflow and lock body scroll when modal is open
    previousBodyOverflowRef.current = document.body.style.overflow || null;
    document.body.style.overflow = "hidden";

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    const handleClose = () => {
      setIsVisible(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    // Focus trap - keep focus within modal
    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleFocusTrap);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleFocusTrap);

      if (previousBodyOverflowRef.current !== null) {
        document.body.style.overflow = previousBodyOverflowRef.current;
      } else {
        document.body.style.overflow = "";
      }
      previousBodyOverflowRef.current = null;

      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [isVisible]);

  // Handle mouse leave to show modal (only once per session)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
      }
    };

    // Listen on document.body so test fireEvent.mouseLeave(document.body) is picked up
    document.body.addEventListener("mouseleave", handleMouseLeave);
    return () =>
      document.body.removeEventListener("mouseleave", handleMouseLeave);
  }, [hasShown]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      handleClose();
    }
  };

  if (!mounted || !isVisible) return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        aria-describedby="exit-intent-description"
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <h2
          id="exit-intent-title"
          className="text-xl font-bold text-gray-900 dark:text-white mb-2"
        >
          Wait! Get Our Technical Whitepaper
        </h2>
        <p
          id="exit-intent-description"
          className="text-gray-600 dark:text-gray-300 mb-6"
        >
          Download our comprehensive technical documentation before you leave.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Maybe later
          </button>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download technical whitepaper (opens in new tab)"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
          >
            Download now
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
};
