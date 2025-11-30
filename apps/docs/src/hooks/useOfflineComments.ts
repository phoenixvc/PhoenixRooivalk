/**
 * Offline Comments Hook
 *
 * Manages comment queuing when offline and syncs when online.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  queueOperation,
  getPendingByType,
  processQueue,
  removeOperation,
  isOnline,
  registerNetworkListeners,
} from "../utils/offlineQueue";

const COMMENT_OPERATION_TYPE = "comment";

export interface PendingComment {
  docPath: string;
  content: string;
  category?: string;
  parentId?: string;
  timestamp: number;
}

interface OfflineCommentsState {
  /** Pending comments waiting to be synced */
  pendingComments: Array<{ id: string; comment: PendingComment }>;
  /** Whether the browser is online */
  isNetworkOnline: boolean;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last sync result */
  lastSyncResult: { processed: number; failed: number } | null;
}

interface UseOfflineCommentsReturn extends OfflineCommentsState {
  /** Queue a comment for later submission */
  queueComment: (comment: PendingComment) => Promise<string>;
  /** Manually trigger sync */
  syncComments: (
    submitHandler: (comment: PendingComment) => Promise<void>,
  ) => Promise<{ processed: number; failed: number }>;
  /** Remove a pending comment */
  removePendingComment: (id: string) => Promise<void>;
  /** Refresh pending comments list */
  refreshPending: () => Promise<void>;
}

/**
 * Hook for managing offline comment queue
 */
export function useOfflineComments(): UseOfflineCommentsReturn {
  const [state, setState] = useState<OfflineCommentsState>({
    pendingComments: [],
    isNetworkOnline: true,
    isSyncing: false,
    lastSyncResult: null,
  });

  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);

  // Safe setState that checks if component is still mounted
  const safeSetState = useCallback(
    (updater: (prev: OfflineCommentsState) => OfflineCommentsState) => {
      if (isMountedRef.current) {
        setState(updater);
      }
    },
    [],
  );

  // Load pending comments on mount
  const refreshPending = useCallback(async () => {
    try {
      const operations = await getPendingByType<PendingComment>(
        COMMENT_OPERATION_TYPE,
      );
      safeSetState((prev) => ({
        ...prev,
        pendingComments: operations.map((op) => ({
          id: op.id,
          comment: op.data,
        })),
      }));
    } catch (error) {
      console.error("Failed to load pending comments:", error);
    }
  }, [safeSetState]);

  // Check online status on mount and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    safeSetState((prev) => ({ ...prev, isNetworkOnline: isOnline() }));
    refreshPending();

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshPending, safeSetState]);

  // Register network listeners with proper cleanup
  useEffect(() => {
    const handleOnline = () => {
      safeSetState((prev) => ({ ...prev, isNetworkOnline: true }));
    };

    const handleOffline = () => {
      safeSetState((prev) => ({ ...prev, isNetworkOnline: false }));
    };

    const cleanup = registerNetworkListeners(handleOnline, handleOffline);

    return () => {
      // Ensure cleanup is called
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [safeSetState]);

  // Queue a comment
  const queueComment = useCallback(
    async (comment: PendingComment) => {
      const id = await queueOperation(COMMENT_OPERATION_TYPE, comment);
      safeSetState((prev) => ({
        ...prev,
        pendingComments: [...prev.pendingComments, { id, comment }],
      }));
      return id;
    },
    [safeSetState],
  );

  // Sync comments
  const syncComments = useCallback(
    async (submitHandler: (comment: PendingComment) => Promise<void>) => {
      if (!isOnline()) {
        return { processed: 0, failed: 0 };
      }

      safeSetState((prev) => ({ ...prev, isSyncing: true }));

      try {
        const result = await processQueue<PendingComment>(
          COMMENT_OPERATION_TYPE,
          submitHandler,
          3,
        );

        safeSetState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncResult: result,
        }));

        // Refresh pending list after sync
        await refreshPending();

        return result;
      } catch (error) {
        console.error("Sync failed:", error);
        safeSetState((prev) => ({ ...prev, isSyncing: false }));
        return { processed: 0, failed: 0 };
      }
    },
    [refreshPending, safeSetState],
  );

  // Remove a pending comment
  const removePendingComment = useCallback(
    async (id: string) => {
      await removeOperation(id);
      await refreshPending();
    },
    [refreshPending],
  );

  return {
    ...state,
    queueComment,
    syncComments,
    removePendingComment,
    refreshPending,
  };
}

/**
 * Get count of pending comments (for badge display)
 */
export async function getPendingCommentCount(): Promise<number> {
  try {
    const operations = await getPendingByType(COMMENT_OPERATION_TYPE);
    return operations.length;
  } catch {
    return 0;
  }
}
