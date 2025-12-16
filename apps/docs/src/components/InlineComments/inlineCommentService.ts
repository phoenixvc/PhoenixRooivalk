/**
 * Inline Comment Service
 *
 * Handles storage and retrieval of inline comments using Azure Cosmos DB.
 * Follows the same pattern as the main comment service.
 */

import {
  getDatabaseService,
  isCloudConfigured,
  getAuthService,
} from "../../services/cloud";
import type { InlineComment, InlineCommentInput } from "./types";

const COLLECTION = "inline_comments";
const POLL_INTERVAL = 5000; // 5 seconds

/**
 * Subscribe to inline comments for a page (via polling)
 */
export function subscribeToInlineComments(
  pageId: string,
  onUpdate: (comments: InlineComment[]) => void,
  onError: (error: Error) => void,
): (() => void) | undefined {
  if (!isCloudConfigured()) {
    onUpdate([]);
    return undefined;
  }

  let isActive = true;

  const fetchComments = async () => {
    if (!isActive) return;

    try {
      const db = getDatabaseService();
      const result = await db.queryDocuments<InlineComment>(COLLECTION, {
        conditions: [{ field: "pageId", operator: "==", value: pageId }],
        orderBy: [{ field: "createdAt", direction: "desc" }],
      });

      if (isActive) {
        onUpdate(result.items);
      }
    } catch (err) {
      if (isActive) {
        onError(
          err instanceof Error ? err : new Error("Failed to fetch comments"),
        );
      }
    }
  };

  // Initial fetch
  fetchComments();

  // Poll for updates
  const intervalId = setInterval(fetchComments, POLL_INTERVAL);

  // Return unsubscribe function
  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
}

/**
 * Add a new inline comment
 */
export async function addInlineComment(
  input: InlineCommentInput,
): Promise<InlineComment | null> {
  if (!isCloudConfigured()) return null;

  try {
    const auth = getAuthService();
    const user = auth.getCurrentUser();

    if (!user) {
      throw new Error("User must be authenticated to add comments");
    }

    const db = getDatabaseService();
    const now = new Date().toISOString();

    const comment: Omit<InlineComment, "id"> = {
      pageId: input.pageId,
      selectedText: input.selectedText,
      textContext: input.textContext,
      comment: input.comment,
      author: {
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        photoURL: user.photoURL || undefined,
        email: user.email || undefined,
      },
      createdAt: now,
      resolved: false,
    };

    const id = await db.addDocument(COLLECTION, comment);
    if (!id) {
      throw new Error("Failed to create comment document");
    }
    return { ...comment, id } as InlineComment;
  } catch (err) {
    console.error("Failed to add inline comment:", err);
    return null;
  }
}

/**
 * Delete an inline comment
 */
export async function deleteInlineComment(commentId: string): Promise<boolean> {
  if (!isCloudConfigured()) return false;

  try {
    const db = getDatabaseService();
    await db.deleteDocument(COLLECTION, commentId);
    return true;
  } catch (err) {
    console.error("Failed to delete inline comment:", err);
    return false;
  }
}

/**
 * Mark an inline comment as resolved
 */
export async function resolveInlineComment(
  commentId: string,
): Promise<boolean> {
  if (!isCloudConfigured()) return false;

  try {
    const db = getDatabaseService();
    await db.updateDocument(COLLECTION, commentId, {
      resolved: true,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Failed to resolve inline comment:", err);
    return false;
  }
}

/**
 * Get all inline comments for a page
 */
export async function getInlineComments(
  pageId: string,
): Promise<InlineComment[]> {
  if (!isCloudConfigured()) return [];

  try {
    const db = getDatabaseService();
    const result = await db.queryDocuments<InlineComment>(COLLECTION, {
      conditions: [{ field: "pageId", operator: "==", value: pageId }],
      orderBy: [{ field: "createdAt", direction: "desc" }],
    });
    return result.items;
  } catch (err) {
    console.error("Failed to get inline comments:", err);
    return [];
  }
}
