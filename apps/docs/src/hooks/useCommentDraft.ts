/**
 * Comment Draft Hook
 *
 * Auto-saves comment drafts to localStorage and recovers them on page reload.
 * Features:
 * - Debounced auto-save (500ms delay)
 * - Draft recovery on mount
 * - Draft indicator UI state
 * - Clear draft on successful submit
 * - Per-page draft storage
 */

import { useState, useEffect, useCallback, useRef } from "react";

const DRAFTS_STORAGE_KEY = "phoenix-comment-drafts";
const DEBOUNCE_DELAY = 500;

interface CommentDraft {
  content: string;
  pageUrl: string;
  savedAt: number;
  parentId?: string; // For replies
}

interface DraftsStore {
  [pageUrl: string]: CommentDraft;
}

/**
 * Get all drafts from localStorage
 */
function getDraftsStore(): DraftsStore {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save drafts store to localStorage
 */
function saveDraftsStore(store: DraftsStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn("Failed to save comment draft:", error);
  }
}

/**
 * Clean up old drafts (older than 7 days)
 */
function cleanupOldDrafts(): void {
  const store = getDraftsStore();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const cleaned: DraftsStore = {};
  for (const [key, draft] of Object.entries(store)) {
    if (draft.savedAt > sevenDaysAgo) {
      cleaned[key] = draft;
    }
  }

  saveDraftsStore(cleaned);
}

interface UseCommentDraftOptions {
  pageUrl: string;
  parentId?: string;
  onRecover?: (content: string) => void;
}

interface UseCommentDraftReturn {
  draft: string;
  setDraft: (content: string) => void;
  hasDraft: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  clearDraft: () => void;
  recoverDraft: () => string | null;
}

/**
 * Comment Draft Hook
 */
export function useCommentDraft({
  pageUrl,
  parentId,
  onRecover,
}: UseCommentDraftOptions): UseCommentDraftReturn {
  const [draft, setDraftState] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate unique key for this draft location
  const draftKey = parentId ? `${pageUrl}#reply-${parentId}` : pageUrl;

  // Check for existing draft on mount
  useEffect(() => {
    cleanupOldDrafts();

    const store = getDraftsStore();
    const existingDraft = store[draftKey];

    if (existingDraft && existingDraft.content.trim()) {
      setHasDraft(true);
      setDraftState(existingDraft.content);
      setLastSaved(new Date(existingDraft.savedAt));

      if (onRecover) {
        onRecover(existingDraft.content);
      }
    }
  }, [draftKey, onRecover]);

  // Debounced save function
  const saveDraft = useCallback(
    (content: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      if (!content.trim()) {
        // Clear draft if empty
        const store = getDraftsStore();
        delete store[draftKey];
        saveDraftsStore(store);
        setHasDraft(false);
        setLastSaved(null);
        return;
      }

      setIsSaving(true);

      saveTimeoutRef.current = setTimeout(() => {
        const store = getDraftsStore();
        const now = Date.now();

        store[draftKey] = {
          content,
          pageUrl,
          savedAt: now,
          parentId,
        };

        saveDraftsStore(store);
        setHasDraft(true);
        setIsSaving(false);
        setLastSaved(new Date(now));
      }, DEBOUNCE_DELAY);
    },
    [draftKey, pageUrl, parentId],
  );

  // Update draft
  const setDraft = useCallback(
    (content: string) => {
      setDraftState(content);
      saveDraft(content);
    },
    [saveDraft],
  );

  // Clear draft
  const clearDraft = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const store = getDraftsStore();
    delete store[draftKey];
    saveDraftsStore(store);

    setDraftState("");
    setHasDraft(false);
    setLastSaved(null);
    setIsSaving(false);
  }, [draftKey]);

  // Recover draft content
  const recoverDraft = useCallback((): string | null => {
    const store = getDraftsStore();
    const existingDraft = store[draftKey];
    return existingDraft?.content || null;
  }, [draftKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    setDraft,
    hasDraft,
    isSaving,
    lastSaved,
    clearDraft,
    recoverDraft,
  };
}

/**
 * Get all drafts for display in a drafts list
 */
export function getAllDrafts(): CommentDraft[] {
  const store = getDraftsStore();
  return Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
}

/**
 * Get draft count
 */
export function getDraftCount(): number {
  const store = getDraftsStore();
  return Object.keys(store).length;
}

/**
 * Clear all drafts
 */
export function clearAllDrafts(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

export default useCommentDraft;
