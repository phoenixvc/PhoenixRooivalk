import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Link from "@docusaurus/Link";

/**
 * CompletionToast component displays a toast notification when a document is completed.
 * Shows document title, completion message, and a link to the progress page.
 *
 * @component
 */

interface CompletedDoc {
  docId: string;
  title: string;
  completedAt: string;
}

// Simple event system for document completion
type CompletionListener = (doc: CompletedDoc) => void;
const completionListeners: Set<CompletionListener> = new Set();

/**
 * Emit a document completion event.
 * Called by ReadingTracker when a document is newly completed.
 */
export function emitDocumentCompletion(doc: CompletedDoc): void {
  completionListeners.forEach((listener) => listener(doc));
}

/**
 * Subscribe to document completion events.
 */
function useDocumentCompletion(onComplete: CompletionListener): void {
  useEffect(() => {
    completionListeners.add(onComplete);
    return () => {
      completionListeners.delete(onComplete);
    };
  }, [onComplete]);
}

/**
 * Hook to manage completion toast state
 */
export function useCompletionToast() {
  const [completedDoc, setCompletedDoc] = useState<CompletedDoc | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((doc: CompletedDoc) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setCompletedDoc(doc);
    setIsVisible(true);

    // Auto-dismiss after 6 seconds
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 6000);
  }, []);

  const dismissToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Subscribe to completion events
  useDocumentCompletion(showToast);

  return {
    completedDoc,
    isVisible,
    dismissToast,
  };
}

/**
 * Format document ID to a readable title
 */
function formatDocTitle(docId: string): string {
  // Remove path prefix and convert to title case
  const name = docId.split("/").pop() || docId;
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * CompletionToast displays a celebratory toast when a document is completed.
 * Includes a link to the progress tracking page.
 */
export function CompletionToast(): React.ReactElement | null {
  const { completedDoc, isVisible, dismissToast } = useCompletionToast();
  const { progress } = useAuth();

  if (!isVisible || !completedDoc) {
    return null;
  }

  // Calculate total completed docs
  const totalCompleted = progress?.docs
    ? Object.values(progress.docs).filter((d) => d.completed).length
    : 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
      e.preventDefault();
      dismissToast();
    }
  };

  return (
    <div
      className="completion-toast"
      role="alert"
      aria-live="polite"
      onClick={dismissToast}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="completion-toast-content">
        <div className="completion-toast-icon">
          <span role="img" aria-label="Checkmark">
            &#10003;
          </span>
        </div>
        <div className="completion-toast-text">
          <div className="completion-toast-title">Document Completed!</div>
          <div className="completion-toast-doc">
            {formatDocTitle(completedDoc.docId)}
          </div>
          <div className="completion-toast-stats">
            {totalCompleted} document{totalCompleted !== 1 ? "s" : ""} read
          </div>
        </div>
      </div>
      <Link
        to="/your-progress"
        className="completion-toast-link"
        onClick={(e) => e.stopPropagation()}
      >
        View Progress
        <span className="completion-toast-link-arrow" aria-hidden="true">
          &#8594;
        </span>
      </Link>
      <button
        className="completion-toast-dismiss"
        onClick={dismissToast}
        aria-label="Dismiss notification"
        type="button"
      >
        &#10005;
      </button>
    </div>
  );
}

export default CompletionToast;
