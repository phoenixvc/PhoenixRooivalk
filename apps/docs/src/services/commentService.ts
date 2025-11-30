/**
 * Comment Service for Phoenix Rooivalk Documentation
 *
 * Uses Azure Cosmos DB via the cloud service abstraction.
 *
 * Handles all database operations for the commenting system:
 * - CRUD operations for comments
 * - Admin review functionality
 * - Comment statistics
 * - Real-time updates (via polling for Cosmos DB)
 * - Input validation and sanitization
 * - Rate limiting
 */

import {
  getDatabaseService,
  isCloudConfigured,
  type IDatabaseService,
} from "./cloud";
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
  return (
    typeof value === "string" &&
    VALID_CATEGORIES.includes(value as CommentCategory)
  );
}

/**
 * Type guard for CommentStatus
 */
export function isValidStatus(value: unknown): value is CommentStatus {
  return (
    typeof value === "string" && VALID_STATUSES.includes(value as CommentStatus)
  );
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
  return (
    content
      // Escape HTML entities
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      // Normalize whitespace (but preserve line breaks)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove null bytes and other non-printable control characters (except newlines and tabs)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .trim()
  );
}

/**
 * Validate comment content
 */
export function validateContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content || typeof content !== "string") {
    return { valid: false, error: "Content is required" };
  }

  const sanitized = sanitizeContent(content);

  if (sanitized.length < MIN_CONTENT_LENGTH) {
    return { valid: false, error: "Comment is too short" };
  }

  if (sanitized.length > MAX_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `Comment exceeds ${MAX_CONTENT_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validate CreateCommentInput
 */
export function validateCreateInput(input: CreateCommentInput): {
  valid: boolean;
  error?: string;
} {
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
 * Get database service with validation
 */
const getDb = (): IDatabaseService => {
  if (!isCloudConfigured()) {
    throw new Error("Cloud services are not configured");
  }
  return getDatabaseService();
};

// ============================================================================
// Comment CRUD Operations
// ============================================================================

/**
 * Create a new comment with validation and rate limiting
 */
export const createComment = async (
  input: CreateCommentInput,
  author: CommentAuthor,
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

  await db.setDocument(COMMENTS_COLLECTION, id, comment);

  return comment;
};

/**
 * Get a comment by ID with type-safe parsing
 */
export const getComment = async (
  commentId: string,
): Promise<Comment | null> => {
  if (!commentId || typeof commentId !== "string") {
    return null;
  }

  const db = getDb();
  const comment = await db.getDocument<Comment>(COMMENTS_COLLECTION, commentId);

  if (comment && isComment(comment)) {
    return comment;
  }
  return null;
};

/**
 * Update a comment with validation
 */
export const updateComment = async (
  commentId: string,
  input: UpdateCommentInput,
  currentContent?: string,
): Promise<boolean> => {
  if (!commentId || typeof commentId !== "string") {
    throw new Error("Invalid comment ID");
  }

  const db = getDb();
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
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

  return db.updateDocument(COMMENTS_COLLECTION, commentId, updates);
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<boolean> => {
  if (!commentId || typeof commentId !== "string") {
    return false;
  }

  const db = getDb();
  return db.deleteDocument(COMMENTS_COLLECTION, commentId);
};

// ============================================================================
// Comment Queries
// ============================================================================

/**
 * Get comments with filters
 */
export const getComments = async (
  filters: CommentFilters = {},
): Promise<{ comments: Comment[]; lastDoc: null }> => {
  const db = getDb();

  const conditions: Array<{
    field: string;
    operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in";
    value: unknown;
  }> = [];

  if (filters.pageId) {
    conditions.push({ field: "pageId", operator: "==", value: filters.pageId });
  }
  if (filters.category && isValidCategory(filters.category)) {
    conditions.push({
      field: "category",
      operator: "==",
      value: filters.category,
    });
  }
  if (filters.status && isValidStatus(filters.status)) {
    conditions.push({ field: "status", operator: "==", value: filters.status });
  }
  if (filters.authorId) {
    conditions.push({
      field: "author.uid",
      operator: "==",
      value: filters.authorId,
    });
  }
  if (filters.sendForReview !== undefined) {
    conditions.push({
      field: "sendForReview",
      operator: "==",
      value: filters.sendForReview,
    });
  }

  const result = await db.queryDocuments<Comment>(COMMENTS_COLLECTION, {
    conditions,
    orderBy: [
      {
        field: filters.orderBy || "createdAt",
        direction: filters.orderDirection || "desc",
      },
    ],
    limit: Math.min(filters.limit || 20, 100),
  });

  const validComments = result.items.filter(isComment);
  return { comments: validComments, lastDoc: null };
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
  limitCount?: number,
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
// Real-Time Updates (Polling-based for Cosmos DB)
// ============================================================================

type Unsubscribe = () => void;

/**
 * Subscribe to real-time updates for comments on a page
 */
export const subscribeToPageComments = (
  pageId: string,
  currentUserId: string | null,
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const db = getDb();

  return db.subscribeToQuery<Comment>(
    COMMENTS_COLLECTION,
    {
      conditions: [{ field: "pageId", operator: "==", value: pageId }],
      orderBy: [{ field: "createdAt", direction: "desc" }],
    },
    (comments) => {
      const filtered = comments.filter(
        (c) =>
          isComment(c) &&
          (c.status !== "draft" || c.author.uid === currentUserId),
      );
      onUpdate(filtered);
    },
    onError,
  );
};

/**
 * Subscribe to pending comments for admin dashboard
 */
export const subscribeToPendingComments = (
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const db = getDb();

  return db.subscribeToQuery<Comment>(
    COMMENTS_COLLECTION,
    {
      conditions: [
        { field: "sendForReview", operator: "==", value: true },
        { field: "status", operator: "==", value: "pending" },
      ],
      orderBy: [{ field: "createdAt", direction: "asc" }],
    },
    (comments) => {
      onUpdate(comments.filter(isComment));
    },
    onError,
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
  input: ReviewCommentInput,
): Promise<boolean> => {
  if (!commentId || !reviewerId || !reviewerEmail) {
    throw new Error("Missing required parameters");
  }

  if (!isValidStatus(input.status)) {
    throw new Error("Invalid status");
  }

  const db = getDb();

  // Get the comment to create notification
  const comment = await getComment(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  // Update the comment
  const success = await db.updateDocument(COMMENTS_COLLECTION, commentId, {
    status: input.status,
    review: {
      reviewedBy: reviewerId,
      reviewerEmail,
      reviewedAt: new Date().toISOString(),
      status: input.status,
      notes: input.notes ? sanitizeContent(input.notes) : undefined,
    },
    updatedAt: new Date().toISOString(),
  });

  if (!success) return false;

  // Create notification for the comment author
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.setDocument(NOTIFICATIONS_COLLECTION, notificationId, {
    id: notificationId,
    authorId: comment.author.uid,
    commentId: comment.id,
    pageTitle: comment.pageTitle,
    pageUrl: comment.pageUrl,
    status: input.status,
    reviewerEmail,
    reviewNotes: input.notes ? sanitizeContent(input.notes) : undefined,
    read: false,
    createdAt: new Date().toISOString(),
  });

  return true;
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (
  userId: string,
): Promise<CommentNotification[]> => {
  const db = getDb();

  const result = await db.queryDocuments<CommentNotification>(
    NOTIFICATIONS_COLLECTION,
    {
      conditions: [{ field: "authorId", operator: "==", value: userId }],
      orderBy: [{ field: "createdAt", direction: "desc" }],
      limit: 50,
    },
  );

  return result.items;
};

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (
  notificationId: string,
): Promise<boolean> => {
  const db = getDb();
  return db.updateDocument(NOTIFICATIONS_COLLECTION, notificationId, {
    read: true,
    readAt: new Date().toISOString(),
  });
};

/**
 * Subscribe to notifications for a user
 */
export const subscribeToNotifications = (
  userId: string,
  onUpdate: (notifications: CommentNotification[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const db = getDb();

  return db.subscribeToQuery<CommentNotification>(
    NOTIFICATIONS_COLLECTION,
    {
      conditions: [
        { field: "authorId", operator: "==", value: userId },
        { field: "read", operator: "==", value: false },
      ],
      orderBy: [{ field: "createdAt", direction: "desc" }],
    },
    onUpdate,
    onError,
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
  confidence: "high" | "medium" | "low",
): Promise<boolean> => {
  if (!commentId) {
    throw new Error("Comment ID is required");
  }

  // Validate and sanitize
  const sanitizedContent = sanitizeContent(enhancedContent);
  const sanitizedSuggestions = suggestions
    .map(sanitizeContent)
    .filter((s) => s.length > 0);

  const db = getDb();
  return db.updateDocument(COMMENTS_COLLECTION, commentId, {
    enhancedContent: sanitizedContent,
    aiEnhancement: {
      enhancedContent: sanitizedContent,
      suggestions: sanitizedSuggestions,
      confidence,
      timestamp: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Toggle using AI-enhanced version
 */
export const toggleAIVersion = async (
  commentId: string,
  useAIVersion: boolean,
): Promise<boolean> => {
  if (!commentId) {
    return false;
  }

  const db = getDb();
  return db.updateDocument(COMMENTS_COLLECTION, commentId, {
    useAIVersion,
    updatedAt: new Date().toISOString(),
  });
};

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get comment statistics for admin dashboard
 */
export const getCommentStats = async (): Promise<CommentStats> => {
  const db = getDb();

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
    // Get total count
    stats.total = await db.countDocuments(COMMENTS_COLLECTION);

    // Get pending review count
    stats.pendingReview = await db.countDocuments(COMMENTS_COLLECTION, {
      conditions: [
        { field: "sendForReview", operator: "==", value: true },
        { field: "status", operator: "==", value: "pending" },
      ],
    });

    // Get category counts
    for (const category of VALID_CATEGORIES) {
      stats.byCategory[category] = await db.countDocuments(COMMENTS_COLLECTION, {
        conditions: [{ field: "category", operator: "==", value: category }],
      });
    }

    // Get status counts
    for (const status of VALID_STATUSES) {
      stats.byStatus[status] = await db.countDocuments(COMMENTS_COLLECTION, {
        conditions: [{ field: "status", operator: "==", value: status }],
      });
    }

    return stats;
  } catch (error) {
    console.error("Error getting comment stats:", error);
    return stats;
  }
};

/**
 * Get all comments for admin
 */
export const getAllComments = async (
  pageSize: number = 20,
): Promise<{
  comments: Comment[];
  lastDoc: null;
  total: number;
}> => {
  const db = getDb();

  try {
    const total = await db.countDocuments(COMMENTS_COLLECTION);

    const result = await db.queryDocuments<Comment>(COMMENTS_COLLECTION, {
      orderBy: [{ field: "createdAt", direction: "desc" }],
      limit: Math.min(pageSize, 100),
    });

    return {
      comments: result.items.filter(isComment),
      lastDoc: null,
      total,
    };
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
    thread.replies.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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

  const result = await db.queryDocuments<Comment>(COMMENTS_COLLECTION, {
    conditions: [{ field: "parentId", operator: "==", value: parentId }],
    orderBy: [{ field: "createdAt", direction: "asc" }],
  });

  return result.items.filter(isComment);
};

/**
 * Get the count of replies for a comment
 */
export const getReplyCount = async (parentId: string): Promise<number> => {
  const db = getDb();
  return db.countDocuments(COMMENTS_COLLECTION, {
    conditions: [{ field: "parentId", operator: "==", value: parentId }],
  });
};

/**
 * Subscribe to replies for a specific comment
 */
export const subscribeToReplies = (
  parentId: string,
  currentUserId: string | null,
  onUpdate: (replies: Comment[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const db = getDb();

  return db.subscribeToQuery<Comment>(
    COMMENTS_COLLECTION,
    {
      conditions: [{ field: "parentId", operator: "==", value: parentId }],
      orderBy: [{ field: "createdAt", direction: "asc" }],
    },
    (replies) => {
      const filtered = replies.filter(
        (c) =>
          isComment(c) &&
          (c.status !== "draft" || c.author.uid === currentUserId),
      );
      onUpdate(filtered);
    },
    onError,
  );
};
