/**
 * Comment Service for Phoenix Rooivalk Documentation
 *
 * Handles all Firestore operations for the commenting system:
 * - CRUD operations for comments
 * - Admin review functionality
 * - Comment statistics
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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { isFirebaseConfigured } from "./firebase";
import type {
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
  ReviewCommentInput,
  CommentFilters,
  CommentStats,
  CommentCategory,
  CommentStatus,
  CommentAuthor,
} from "../types/comments";

const COMMENTS_COLLECTION = "comments";

/**
 * Generate a unique comment ID
 */
const generateCommentId = (): string => {
  return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert Firestore timestamp to ISO string
 */
const timestampToString = (timestamp: Timestamp | string): string => {
  if (typeof timestamp === "string") return timestamp;
  return timestamp.toDate().toISOString();
};

/**
 * Get Firestore instance
 */
const getDb = () => {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }
  return getFirestore();
};

/**
 * Create a new comment
 */
export const createComment = async (
  input: CreateCommentInput,
  author: CommentAuthor
): Promise<Comment> => {
  const db = getDb();
  const id = generateCommentId();
  const now = new Date().toISOString();

  const comment: Comment = {
    id,
    content: input.content,
    pageId: input.pageId,
    pageTitle: input.pageTitle,
    pageUrl: input.pageUrl,
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
 * Get a comment by ID
 */
export const getComment = async (commentId: string): Promise<Comment | null> => {
  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
  } as Comment;
};

/**
 * Update a comment
 */
export const updateComment = async (
  commentId: string,
  input: UpdateCommentInput,
  currentContent?: string
): Promise<boolean> => {
  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);

  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
    isEdited: true,
  };

  // If content changed, add to edit history
  if (input.content && currentContent && input.content !== currentContent) {
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

  // If sendForReview is true, set status to pending
  if (input.sendForReview) {
    updates.status = "pending";
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

/**
 * Get comments with filters
 */
export const getComments = async (
  filters: CommentFilters = {}
): Promise<Comment[]> => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  // Build query constraints
  const constraints: ReturnType<typeof where>[] = [];

  if (filters.pageId) {
    constraints.push(where("pageId", "==", filters.pageId));
  }
  if (filters.category) {
    constraints.push(where("category", "==", filters.category));
  }
  if (filters.status) {
    constraints.push(where("status", "==", filters.status));
  }
  if (filters.authorId) {
    constraints.push(where("author.uid", "==", filters.authorId));
  }
  if (filters.sendForReview !== undefined) {
    constraints.push(where("sendForReview", "==", filters.sendForReview));
  }

  // Build the query
  let q = query(
    commentsRef,
    ...constraints,
    orderBy(filters.orderBy || "createdAt", filters.orderDirection || "desc")
  );

  if (filters.limit) {
    q = query(q, limit(filters.limit));
  }

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToString(data.createdAt),
        updatedAt: timestampToString(data.updatedAt),
      } as Comment;
    });
  } catch (error) {
    console.error("Error getting comments:", error);
    return [];
  }
};

/**
 * Get comments for a specific page
 */
export const getPageComments = async (pageId: string): Promise<Comment[]> => {
  return getComments({
    pageId,
    orderBy: "createdAt",
    orderDirection: "desc",
  });
};

/**
 * Get comments pending admin review
 */
export const getPendingComments = async (
  limitCount?: number
): Promise<Comment[]> => {
  return getComments({
    sendForReview: true,
    status: "pending",
    orderBy: "createdAt",
    orderDirection: "asc",
    limit: limitCount,
  });
};

/**
 * Get comments by a specific user
 */
export const getUserComments = async (userId: string): Promise<Comment[]> => {
  return getComments({
    authorId: userId,
    orderBy: "createdAt",
    orderDirection: "desc",
  });
};

/**
 * Admin: Review a comment
 */
export const reviewComment = async (
  commentId: string,
  reviewerId: string,
  reviewerEmail: string,
  input: ReviewCommentInput
): Promise<boolean> => {
  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);

  try {
    await updateDoc(docRef, {
      status: input.status,
      review: {
        reviewedBy: reviewerId,
        reviewerEmail,
        reviewedAt: new Date().toISOString(),
        status: input.status,
        notes: input.notes,
      },
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error reviewing comment:", error);
    return false;
  }
};

/**
 * Save AI enhancement to a comment
 */
export const saveAIEnhancement = async (
  commentId: string,
  enhancedContent: string,
  suggestions: string[],
  confidence: "high" | "medium" | "low"
): Promise<boolean> => {
  const db = getDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);

  try {
    await updateDoc(docRef, {
      enhancedContent,
      aiEnhancement: {
        enhancedContent,
        suggestions,
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

/**
 * Get comment statistics for admin dashboard
 */
export const getCommentStats = async (): Promise<CommentStats> => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  try {
    const snapshot = await getDocs(commentsRef);
    const comments = snapshot.docs.map((doc) => doc.data() as Comment);

    const stats: CommentStats = {
      total: comments.length,
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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    comments.forEach((comment) => {
      // Count by category
      if (comment.category in stats.byCategory) {
        stats.byCategory[comment.category as CommentCategory]++;
      }

      // Count by status
      if (comment.status in stats.byStatus) {
        stats.byStatus[comment.status as CommentStatus]++;
      }

      // Count pending review
      if (comment.sendForReview && comment.status === "pending") {
        stats.pendingReview++;
      }

      // Count recent comments
      const createdAt = new Date(comment.createdAt);
      if (createdAt > sevenDaysAgo) {
        stats.recentCount++;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error getting comment stats:", error);
    return {
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
  }
};

/**
 * Get all comments for admin (with pagination support)
 */
export const getAllComments = async (
  page: number = 1,
  pageSize: number = 20
): Promise<{ comments: Comment[]; total: number }> => {
  const db = getDb();
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  try {
    // Get total count
    const allDocs = await getDocs(commentsRef);
    const total = allDocs.size;

    // Get paginated comments
    const q = query(
      commentsRef,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToString(data.createdAt),
        updatedAt: timestampToString(data.updatedAt),
      } as Comment;
    });

    return { comments, total };
  } catch (error) {
    console.error("Error getting all comments:", error);
    return { comments: [], total: 0 };
  }
};
