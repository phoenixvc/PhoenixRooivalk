/**
 * Comment Service for Phoenix Rooivalk Documentation
 *
 * Handles all Firestore operations for the commenting system:
 * - CRUD operations for comments
 * - Admin review functionality
 * - Comment statistics
 * - Real-time updates
 * - Input validation and sanitization
 * - Rate limiting
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Unsubscribe,
  getCountFromServer,
} from "firebase/firestore";
import { isFirebaseConfigured } from "./firebase";
import type {
  Comment,
  CommentThread,
  CreateCommentInput,
  UpdateCommentInput,
  ReviewCommentInput,
  CommentFilters,
  CommentStats,
  CommentCategory,
  CommentStatus,
  CommentAuthor,
} from "../types/comments";

// ============================================================================
// Constants
// ============================================================================

const COMMENTS_COLLECTION = "comments";
const NOTIFICATIONS_COLLECTION = "comment_notifications";
const MAX_CONTENT_LENGTH = 5000;
const MIN_CONTENT_LENGTH = 1;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 comments per minute

// Valid categories and statuses for validation
const VALID_CATEGORIES: CommentCategory[] = [
  "comment",
  "change_request",
  "question",
  "suggestion",
  "bug_report",
];

const VALID_STATUSES: CommentStatus[] = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "implemented",
  "resolved",
];

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Check if a user is rate limited
 */
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitCache.get(userId);

  if (!entry) {
    rateLimitCache.set(userId, { count: 1, windowStart: now });
    return false;
  }

  // Reset window if expired
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitCache.set(userId, { count: 1, windowStart: now });
    return false;
  }

  // Check if over limit
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Increment count
  entry.count++;
  return false;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for CommentCategory
 */
export function isValidCategory(value: unknown): value is CommentCategory {
  return typeof value === "string" && VALID_CATEGORIES.includes(value as CommentCategory);
}

/**
 * Type guard for CommentStatus
 */
export function isValidStatus(value: unknown): value is CommentStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as CommentStatus);
}

/**
 * Type guard for CommentAuthor
 */
export function isValidAuthor(value: unknown): value is CommentAuthor {
  if (!value || typeof value !== "object") return false;
  const author = value as Record<string, unknown>;
  return (
    typeof author.uid === "string" &&
    author.uid.length > 0 &&
    (author.displayName === null || typeof author.displayName === "string") &&
    (author.email === null || typeof author.email === "string") &&
    (author.photoURL === null || typeof author.photoURL === "string")
  );
}

/**
 * Type guard to check if data is a valid Comment
 */
export function isComment(data: unknown): data is Comment {
  if (!data || typeof data !== "object") return false;
  const comment = data as Record<string, unknown>;

  return (
    typeof comment.id === "string" &&
    typeof comment.content === "string" &&
    typeof comment.pageId === "string" &&
    typeof comment.pageTitle === "string" &&
    typeof comment.pageUrl === "string" &&
    isValidCategory(comment.category) &&
    isValidStatus(comment.status) &&
    isValidAuthor(comment.author) &&
    typeof comment.sendForReview === "boolean" &&
    typeof comment.createdAt === "string" &&
    typeof comment.updatedAt === "string"
  );
}

// ============================================================================
// Input Sanitization & Validation
// ============================================================================

/**
 * Sanitize HTML content to prevent XSS
 * Removes all HTML tags and escapes special characters
 */
export function sanitizeContent(content: string): string {
  // Remove HTML tags (apply repeatedly to handle nested & tricky cases)
  let previous;
  do {
    previous = content;
    content = content.replace(/<[^>]*>/g, "");
  } while (content !== previous);
  return content
    // Escape HTML entities
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    // Normalize whitespace (but preserve line breaks)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove null bytes and other control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Validate comment content
 */
export function validateContent(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== "string") {
    return { valid: false, error: "Content is required" };
  }

  const sanitized = sanitizeContent(content);

  if (sanitized.length < MIN_CONTENT_LENGTH) {
    return { valid: false, error: "Comment is too short" };
  }

  if (sanitized.length > MAX_CONTENT_LENGTH) {
    return { valid: false, error: `Comment exceeds ${MAX_CONTENT_LENGTH} characters` };
  }

  return { valid: true };
}

/**
 * Validate CreateCommentInput
 */
export function validateCreateInput(
  input: CreateCommentInput
): { valid: boolean; error?: string } {
  const contentValidation = validateContent(input.content);
  if (!contentValidation.valid) {
    return contentValidation;
  }

  if (!input.pageId || typeof input.pageId !== "string") {
    return { valid: false, error: "Page ID is required" };
  }

  if (!input.pageTitle || typeof input.pageTitle !== "string") {
    return { valid: false, error: "Page title is required" };
  }

  if (!input.pageUrl || typeof input.pageUrl !== "string") {
    return { valid: false, error: "Page URL is required" };
  }

  if (!isValidCategory(input.category)) {
    return { valid: false, error: "Invalid comment category" };
  }

  return { valid: true };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique comment ID
 */
const generateCommentId = (): string => {
  return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert Firestore timestamp to ISO string safely
 */
const timestampToString = (timestamp: unknown): string => {
  if (typeof timestamp === "string") return timestamp;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  // Fallback for server timestamp that hasn't resolved yet
  return new Date().toISOString();
};

/**
 * Parse Firestore document to Comment with type safety
 */
function parseCommentDoc(doc: DocumentSnapshot | QueryDocumentSnapshot): Comment | null {
  if (!doc.exists()) return null;

  const data = doc.data();
  if (!data) return null;

  const comment = {
    ...data,
    id: doc.id,
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
  };

  // Validate the parsed data
  if (!isComment(comment)) {
    console.warn("Invalid comment data:", doc.id);
    return null;
  }

  return comment;
}

/**
 * Get Firestore instance with validation
 */
const getDb = () => {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }
  return getFirestore();
};

// ============================================================================
// Comment CRUD Operations
// ============================================================================

/**
 * Create a new comment with validation and rate limiting
 */
export const createComment = async (
  input: CreateCommentInput,
  author: CommentAuthor
): Promise<Comment> => {
  // Validate author
  if (!isValidAuthor(author)) {
    throw new Error("Invalid author data");
  }

  // Check rate limit
  if (isRateLimited(author.uid)) {
    throw new Error("Rate limit exceeded. Please wait before posting again.");
  }

  // Validate input
  const validation = validateCreateInput(input);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Sanitize content
  const sanitizedContent = sanitizeContent(input.content);

  const db = getDb();
  const id = generateCommentId();
  const now = new Date().toISOString();

  const comment: Comment = {
    id,
    content: sanitizedContent,
    pageId: input.pageId.trim(),
    pageTitle: sanitizeContent(input.pageTitle),
    pageUrl: input.pageUrl.trim(),
    category: input.category,
    status: input.sendForReview ? "pending" : "draft",
    author,
    useAIVersion: false,
    sendForReview: input.sendForReview,
    createdAt: now,
    updatedAt: now,
    isEdited: false,
    parentId: input.parentId,
  };

  const docRef = doc(db, COMMENTS_COLLECTION, id);
  await setDoc(docRef, {
    ...comment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return comment;
};

/**
 * Get a comment by ID with type-safe parsing
 */
export const getComment = async (commentId: string): Promise<Comment | null> => {
  if (!commentId || typeof commentId !== "string") {
    return null;
  }

  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);
  const docSnap = await getDoc(docRef);

  return parseCommentDoc(docSnap);
};

/**
 * Update a comment with validation
 */
export const updateComment = async (
  commentId: string,
  input: UpdateCommentInput,
  currentContent?: string
): Promise<boolean> => {
  if (!commentId || typeof commentId !== "string") {
    throw new Error("Invalid comment ID");
  }

  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);

  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    isEdited: true,
  };

  // Validate and sanitize content if provided
  if (input.content !== undefined) {
    const validation = validateContent(input.content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    updates.content = sanitizeContent(input.content);
  }

  // Validate category if provided
  if (input.category !== undefined) {
    if (!isValidCategory(input.category)) {
      throw new Error("Invalid category");
    }
    updates.category = input.category;
  }

  // Handle sendForReview
  if (input.sendForReview !== undefined) {
    updates.sendForReview = input.sendForReview;
    if (input.sendForReview) {
      updates.status = "pending";
    }
  }

  // Handle useAIVersion
  if (input.useAIVersion !== undefined) {
    updates.useAIVersion = input.useAIVersion;
  }

  // If content changed, add to edit history
  if (updates.content && currentContent && updates.content !== currentContent) {
    const comment = await getComment(commentId);
    if (comment) {
      const editHistory = comment.editHistory || [];
      editHistory.push({
        content: currentContent,
        editedAt: new Date().toISOString(),
      });
      updates.editHistory = editHistory;
    }
  }

  try {
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating comment:", error);
    return false;
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<boolean> => {
  if (!commentId || typeof commentId !== "string") {
    return false;
  }

  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);

  try {
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    return false;
  }
};

// ============================================================================
// Comment Queries with Cursor-Based Pagination
// ============================================================================

/**
 * Pagination cursor for efficient querying
 */
export interface CommentCursor {
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Get comments with filters and cursor-based pagination
 */
export const getComments = async (
  filters: CommentFilters = {},
  cursor?: DocumentSnapshot | null
): Promise<{ comments: Comment[]; lastDoc: DocumentSnapshot | null }> => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  // Build query constraints
  const constraints: ReturnType<typeof where | typeof orderBy>[] = [];

  if (filters.pageId) {
    constraints.push(where("pageId", "==", filters.pageId));
  }
  if (filters.category && isValidCategory(filters.category)) {
    constraints.push(where("category", "==", filters.category));
  }
  if (filters.status && isValidStatus(filters.status)) {
    constraints.push(where("status", "==", filters.status));
  }
  if (filters.authorId) {
    constraints.push(where("author.uid", "==", filters.authorId));
  }
  if (filters.sendForReview !== undefined) {
    constraints.push(where("sendForReview", "==", filters.sendForReview));
  }

  // Add ordering
  constraints.push(
    orderBy(filters.orderBy || "createdAt", filters.orderDirection || "desc")
  );

  // Add cursor for pagination
  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  // Add limit
  const queryLimit = Math.min(filters.limit || 20, 100);
  constraints.push(limit(queryLimit));

  try {
    const q = query(commentsRef, ...constraints);
    const snapshot = await getDocs(q);

    const comments: Comment[] = [];
    let lastDoc: DocumentSnapshot | null = null;

    snapshot.docs.forEach((doc) => {
      const comment = parseCommentDoc(doc);
      if (comment) {
        comments.push(comment);
        lastDoc = doc;
      }
    });

    return { comments, lastDoc };
  } catch (error) {
    console.error("Error getting comments:", error);
    return { comments: [], lastDoc: null };
  }
};

/**
 * Get comments for a specific page
 */
export const getPageComments = async (pageId: string): Promise<Comment[]> => {
  const { comments } = await getComments({
    pageId,
    orderBy: "createdAt",
    orderDirection: "desc",
  });
  return comments;
};

/**
 * Get comments pending admin review
 */
export const getPendingComments = async (
  limitCount?: number
): Promise<Comment[]> => {
  const { comments } = await getComments({
    sendForReview: true,
    status: "pending",
    orderBy: "createdAt",
    orderDirection: "asc",
    limit: limitCount,
  });
  return comments;
};

/**
 * Get comments by a specific user
 */
export const getUserComments = async (userId: string): Promise<Comment[]> => {
  const { comments } = await getComments({
    authorId: userId,
    orderBy: "createdAt",
    orderDirection: "desc",
  });
  return comments;
};

// ============================================================================
// Real-Time Updates
// ============================================================================

/**
 * Subscribe to real-time updates for comments on a page
 */
export const subscribeToPageComments = (
  pageId: string,
  currentUserId: string | null,
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  const q = query(
    commentsRef,
    where("pageId", "==", pageId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const comments: Comment[] = [];
      snapshot.docs.forEach((doc) => {
        const comment = parseCommentDoc(doc);
        if (comment) {
          // Filter out drafts from other users
          if (comment.status !== "draft" || comment.author.uid === currentUserId) {
            comments.push(comment);
          }
        }
      });
      onUpdate(comments);
    },
    (error) => {
      console.error("Error in comments subscription:", error);
      onError?.(error);
    }
  );
};

/**
 * Subscribe to pending comments for admin dashboard
 */
export const subscribeToPendingComments = (
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  const q = query(
    commentsRef,
    where("sendForReview", "==", true),
    where("status", "==", "pending"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const comments: Comment[] = [];
      snapshot.docs.forEach((doc) => {
        const comment = parseCommentDoc(doc);
        if (comment) {
          comments.push(comment);
        }
      });
      onUpdate(comments);
    },
    (error) => {
      console.error("Error in pending comments subscription:", error);
      onError?.(error);
    }
  );
};

// ============================================================================
// Admin Review & Notifications
// ============================================================================

/**
 * Notification type for comment reviews
 */
export interface CommentNotification {
  id: string;
  authorId: string;
  commentId: string;
  pageTitle: string;
  pageUrl: string;
  status: CommentStatus;
  reviewerEmail: string;
  reviewNotes?: string;
  read: boolean;
  createdAt: string;
}

/**
 * Admin: Review a comment and create notification
 */
export const reviewComment = async (
  commentId: string,
  reviewerId: string,
  reviewerEmail: string,
  input: ReviewCommentInput
): Promise<boolean> => {
  if (!commentId || !reviewerId || !reviewerEmail) {
    throw new Error("Missing required parameters");
  }

  if (!isValidStatus(input.status)) {
    throw new Error("Invalid status");
  }

  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);

  // Get the comment to create notification
  const comment = await getComment(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  try {
    // Update the comment
    await updateDoc(docRef, {
      status: input.status,
      review: {
        reviewedBy: reviewerId,
        reviewerEmail,
        reviewedAt: new Date().toISOString(),
        status: input.status,
        notes: input.notes ? sanitizeContent(input.notes) : undefined,
      },
      updatedAt: serverTimestamp(),
    });

    // Create notification for the comment author
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);

    await setDoc(notificationRef, {
      id: notificationId,
      authorId: comment.author.uid,
      commentId: comment.id,
      pageTitle: comment.pageTitle,
      pageUrl: comment.pageUrl,
      status: input.status,
      reviewerEmail,
      reviewNotes: input.notes ? sanitizeContent(input.notes) : undefined,
      read: false,
      createdAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error reviewing comment:", error);
    return false;
  }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (
  userId: string
): Promise<CommentNotification[]> => {
  const db = getDb();
  const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);

  const q = query(
    notificationsRef,
    where("authorId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToString(data.createdAt),
      } as CommentNotification;
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (
  notificationId: string
): Promise<boolean> => {
  const db = getDb();
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);

  try {
    await updateDoc(docRef, {
      read: true,
      readAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

/**
 * Subscribe to notifications for a user
 */
export const subscribeToNotifications = (
  userId: string,
  onUpdate: (notifications: CommentNotification[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const db = getDb();
  const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);

  const q = query(
    notificationsRef,
    where("authorId", "==", userId),
    where("read", "==", false),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: CommentNotification[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: timestampToString(data.createdAt),
        } as CommentNotification;
      });
      onUpdate(notifications);
    },
    (error) => {
      console.error("Error in notifications subscription:", error);
      onError?.(error);
    }
  );
};

// ============================================================================
// AI Enhancement
// ============================================================================

/**
 * Save AI enhancement to a comment
 */
export const saveAIEnhancement = async (
  commentId: string,
  enhancedContent: string,
  suggestions: string[],
  confidence: "high" | "medium" | "low"
): Promise<boolean> => {
  if (!commentId) {
    throw new Error("Comment ID is required");
  }

  // Validate and sanitize
  const sanitizedContent = sanitizeContent(enhancedContent);
  const sanitizedSuggestions = suggestions.map(sanitizeContent).filter((s) => s.length > 0);

  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);

  try {
    await updateDoc(docRef, {
      enhancedContent: sanitizedContent,
      aiEnhancement: {
        enhancedContent: sanitizedContent,
        suggestions: sanitizedSuggestions,
        confidence,
        timestamp: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error saving AI enhancement:", error);
    return false;
  }
};

/**
 * Toggle using AI-enhanced version
 */
export const toggleAIVersion = async (
  commentId: string,
  useAIVersion: boolean
): Promise<boolean> => {
  if (!commentId) {
    return false;
  }

  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);

  try {
    await updateDoc(docRef, {
      useAIVersion,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error toggling AI version:", error);
    return false;
  }
};

// ============================================================================
// Statistics (Efficient Implementation)
// ============================================================================

/**
 * Get comment statistics for admin dashboard
 * Uses aggregation queries where possible for efficiency
 */
export const getCommentStats = async (): Promise<CommentStats> => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  const stats: CommentStats = {
    total: 0,
    byCategory: {
      comment: 0,
      change_request: 0,
      question: 0,
      suggestion: 0,
      bug_report: 0,
    },
    byStatus: {
      draft: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      implemented: 0,
      resolved: 0,
    },
    pendingReview: 0,
    recentCount: 0,
  };

  try {
    // Get total count efficiently
    const countSnapshot = await getCountFromServer(commentsRef);
    stats.total = countSnapshot.data().count;

    // Get pending review count
    const pendingQuery = query(
      commentsRef,
      where("sendForReview", "==", true),
      where("status", "==", "pending")
    );
    const pendingCount = await getCountFromServer(pendingQuery);
    stats.pendingReview = pendingCount.data().count;

    // Get recent count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentQuery = query(
      commentsRef,
      where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo))
    );
    const recentCount = await getCountFromServer(recentQuery);
    stats.recentCount = recentCount.data().count;

    // Run category and status queries in parallel for better performance
    // This reduces N+1 queries (11 sequential) to 2 parallel batches
    const [categoryResults, statusResults] = await Promise.all([
      // All category counts in parallel
      Promise.all(
        VALID_CATEGORIES.map(async (category) => {
          const categoryQuery = query(commentsRef, where("category", "==", category));
          const count = await getCountFromServer(categoryQuery);
          return { category, count: count.data().count };
        })
      ),
      // All status counts in parallel
      Promise.all(
        VALID_STATUSES.map(async (status) => {
          const statusQuery = query(commentsRef, where("status", "==", status));
          const count = await getCountFromServer(statusQuery);
          return { status, count: count.data().count };
        })
      ),
    ]);

    // Populate stats from parallel results
    for (const { category, count } of categoryResults) {
      stats.byCategory[category] = count;
    }
    for (const { status, count } of statusResults) {
      stats.byStatus[status] = count;
    }

    return stats;
  } catch (error) {
    console.error("Error getting comment stats:", error);
    return stats;
  }
};

/**
 * Get all comments for admin with cursor-based pagination
 */
export const getAllComments = async (
  pageSize: number = 20,
  cursor?: DocumentSnapshot | null
): Promise<{ comments: Comment[]; lastDoc: DocumentSnapshot | null; total: number }> => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  try {
    // Get total count efficiently
    const countSnapshot = await getCountFromServer(commentsRef);
    const total = countSnapshot.data().count;

    // Build query with cursor
    const constraints: Parameters<typeof query>[1][] = [
      orderBy("createdAt", "desc"),
      limit(Math.min(pageSize, 100)),
    ];

    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    const q = query(commentsRef, ...constraints);
    const snapshot = await getDocs(q);

    const comments: Comment[] = [];
    let lastDoc: DocumentSnapshot | null = null;

    snapshot.docs.forEach((doc) => {
      const comment = parseCommentDoc(doc);
      if (comment) {
        comments.push(comment);
        lastDoc = doc;
      }
    });

    return { comments, lastDoc, total };
  } catch (error) {
    console.error("Error getting all comments:", error);
    return { comments: [], lastDoc: null, total: 0 };
  }
};

// ============================================================================
// Threading Support
// ============================================================================

/**
 * Organize a flat list of comments into a threaded structure
 * Top-level comments (no parentId) are at the root, with nested replies
 */
export function organizeIntoThreads(comments: Comment[]): CommentThread[] {
  const commentMap = new Map<string, CommentThread>();
  const threads: CommentThread[] = [];

  // First pass: create CommentThread objects for all comments
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize into threads
  comments.forEach((comment) => {
    const thread = commentMap.get(comment.id);
    if (!thread) return;

    if (comment.parentId) {
      // This is a reply - add to parent's replies
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(thread);
      } else {
        // Parent not found (maybe deleted), treat as top-level
        threads.push(thread);
      }
    } else {
      // This is a top-level comment
      threads.push(thread);
    }
  });

  // Sort replies by createdAt (oldest first for conversation flow)
  const sortReplies = (thread: CommentThread): void => {
    thread.replies.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    thread.replies.forEach(sortReplies);
  };

  threads.forEach(sortReplies);

  return threads;
}

/**
 * Get replies for a specific comment
 */
export const getReplies = async (parentId: string): Promise<Comment[]> => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  const q = query(
    commentsRef,
    where("parentId", "==", parentId),
    orderBy("createdAt", "asc")
  );

  try {
    const snapshot = await getDocs(q);
    const replies: Comment[] = [];

    snapshot.docs.forEach((doc) => {
      const comment = parseCommentDoc(doc);
      if (comment) {
        replies.push(comment);
      }
    });

    return replies;
  } catch (error) {
    console.error("Error getting replies:", error);
    return [];
  }
};

/**
 * Get the count of replies for a comment
 */
export const getReplyCount = async (parentId: string): Promise<number> => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  const q = query(commentsRef, where("parentId", "==", parentId));

  try {
    const countSnapshot = await getCountFromServer(q);
    return countSnapshot.data().count;
  } catch (error) {
    console.error("Error getting reply count:", error);
    return 0;
  }
};

/**
 * Subscribe to replies for a specific comment
 */
export const subscribeToReplies = (
  parentId: string,
  currentUserId: string | null,
  onUpdate: (replies: Comment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  const q = query(
    commentsRef,
    where("parentId", "==", parentId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const replies: Comment[] = [];
      snapshot.docs.forEach((doc) => {
        const comment = parseCommentDoc(doc);
        if (comment) {
          // Filter out drafts from other users
          if (comment.status !== "draft" || comment.author.uid === currentUserId) {
            replies.push(comment);
          }
        }
      });
      onUpdate(replies);
    },
    (error) => {
      console.error("Error in replies subscription:", error);
      onError?.(error);
    }
  );
};
