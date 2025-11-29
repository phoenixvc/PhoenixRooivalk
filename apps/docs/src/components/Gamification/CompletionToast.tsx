import Link from "@docusaurus/Link";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";

/**
 * CompletionToast and ChallengeToast components for engagement feedback.
 *
 * CompletionToast: Shows success when document is properly read
 * ChallengeToast: Shows challenge when user scrolled too fast without reading
 */

interface CompletedDoc {
  docId: string;
  title: string;
  completedAt: string;
  message?: string;
}

interface ReadingChallenge {
  docId: string;
  title: string;
  timeSpent: number;
  expectedTime: number;
  message: string;
}

// Event system for document completion
type CompletionListener = (_doc: CompletedDoc) => void;
const completionListeners: Set<CompletionListener> = new Set();

// Event system for reading challenges
type ChallengeListener = (_challenge: ReadingChallenge) => void;
const challengeListeners: Set<ChallengeListener> = new Set();

/**
 * Emit a document completion event.
 * Called by ReadingTracker when a document is properly completed.
 */
export function emitDocumentCompletion(doc: CompletedDoc): void {
  completionListeners.forEach((listener) => listener(doc));
}

/**
 * Emit a reading challenge event.
 * Called by ReadingTracker when user scrolls too fast.
 */
export function emitReadingChallenge(challenge: ReadingChallenge): void {
  challengeListeners.forEach((listener) => listener(challenge));
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
 * Subscribe to reading challenge events.
 */
function useReadingChallenge(onChallenge: ChallengeListener): void {
  useEffect(() => {
    challengeListeners.add(onChallenge);
    return () => {
      challengeListeners.delete(onChallenge);
    };
  }, [onChallenge]);
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
 * Hook to manage challenge toast state
 */
export function useChallengeToast() {
  const [challenge, setChallenge] = useState<ReadingChallenge | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((newChallenge: ReadingChallenge) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setChallenge(newChallenge);
    setIsVisible(true);

    // Auto-dismiss after 10 seconds (longer for challenge to read)
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 10000);
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

  // Subscribe to challenge events
  useReadingChallenge(showToast);

  return {
    challenge,
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

  return (
    <div className="completion-toast" role="alert" aria-live="polite">
      <div className="completion-toast-content">
        <div className="completion-toast-icon completion-toast-icon--success">
          <span role="img" aria-label="Checkmark">
            &#10003;
          </span>
        </div>
        <div className="completion-toast-text">
          <div className="completion-toast-title">Document Completed!</div>
          <div className="completion-toast-doc">
            {formatDocTitle(completedDoc.docId)}
          </div>
          {completedDoc.message && (
            <div className="completion-toast-message">
              {completedDoc.message}
            </div>
          )}
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

/**
 * ChallengeToast displays a challenge when user scrolls too fast.
 * Encourages them to actually read the content.
 */
export function ChallengeToast(): React.ReactElement | null {
  const { challenge, isVisible, dismissToast } = useChallengeToast();

  if (!isVisible || !challenge) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    dismissToast();
  };

  const timeSpentSec = Math.round(challenge.timeSpent / 1000);
  const expectedSec = Math.round(challenge.expectedTime / 1000);

  return (
    <div
      className="completion-toast completion-toast--challenge"
      role="alert"
      aria-live="assertive"
    >
      <div className="completion-toast-content">
        <div className="completion-toast-icon completion-toast-icon--challenge">
          <span role="img" aria-label="Warning">
            &#9888;
          </span>
        </div>
        <div className="completion-toast-text">
          <div className="completion-toast-title completion-toast-title--challenge">
            Hold up - Did you actually read this?
          </div>
          <div className="completion-toast-doc">
            {formatDocTitle(challenge.docId)}
          </div>
          <div className="completion-toast-message completion-toast-message--challenge">
            You spent {timeSpentSec}s on a ~{Math.round(expectedSec / 60)} min
            read. No completion credit for speed-scrolling!
          </div>
          <div className="completion-toast-actions">
            <button
              type="button"
              className="completion-toast-action completion-toast-action--primary"
              onClick={scrollToTop}
            >
              Fine, I&apos;ll read it properly
            </button>
            <button
              type="button"
              className="completion-toast-action completion-toast-action--secondary"
              onClick={dismissToast}
            >
              Whatever, skip it
            </button>
          </div>
        </div>
      </div>
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

/**
 * Combined toast component that renders both completion and challenge toasts
 */
export function EngagementToasts(): React.ReactElement {
  return (
    <>
      <CompletionToast />
      <ChallengeToast />
    </>
  );
}

export default CompletionToast;
