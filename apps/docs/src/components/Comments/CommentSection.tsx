/**
 * CommentSection Component
 *
 * Main component for displaying comments on a documentation page.
 * Includes:
 * - Comment form for adding new comments
 * - List of existing comments with real-time updates
 * - Login prompt for unauthenticated users
 * - Optimistic updates for better UX
 * - Edit functionality
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  subscribeToPageComments,
  deleteComment,
  updateComment,
} from "../../services/commentService";
import { isFirebaseConfigured } from "../../services/firebase";
import type { Comment, UpdateCommentInput } from "../../types/comments";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { EditCommentModal } from "./EditCommentModal";
import styles from "./Comments.module.css";

interface CommentSectionProps {
  pageId: string;
  pageTitle: string;
  pageUrl?: string;
}

// Admin email domains (same as in analytics.tsx)
const ADMIN_EMAIL_DOMAINS = ["phoenixrooivalk.com", "justaghost.dev"];

export function CommentSection({
  pageId,
  pageTitle,
  pageUrl,
}: CommentSectionProps): React.ReactElement | null {
  const { user, loading: authLoading, signInGoogle, signInGithub } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [optimisticComment, setOptimisticComment] = useState<Comment | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Check if current user is admin
  const isAdmin =
    user?.email &&
    ADMIN_EMAIL_DOMAINS.some((domain) => user.email?.endsWith(`@${domain}`));

  // Get the current page URL
  const currentUrl =
    pageUrl || (typeof window !== "undefined" ? window.location.pathname : "");

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isFirebaseConfigured() || authLoading) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to real-time updates
    unsubscribeRef.current = subscribeToPageComments(
      pageId,
      user?.uid || null,
      (updatedComments) => {
        setComments(updatedComments);
        setIsLoading(false);
        // Clear optimistic comment if it's now in the real data
        if (optimisticComment) {
          const found = updatedComments.find((c) => c.id === optimisticComment.id);
          if (found) {
            setOptimisticComment(null);
          }
        }
      },
      (error) => {
        console.error("Failed to subscribe to comments:", error);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [pageId, user?.uid, authLoading, optimisticComment]);

  // Handle new comment added (optimistic update)
  const handleCommentAdded = useCallback((comment: Comment) => {
    // Add optimistic comment immediately
    setOptimisticComment(comment);
    setShowForm(false);
  }, []);

  // Handle comment deletion with optimistic update
  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!window.confirm("Are you sure you want to delete this comment?")) {
        return;
      }

      // Optimistic update - remove immediately
      const deletedComment = comments.find((c) => c.id === commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));

      const success = await deleteComment(commentId);
      if (!success && deletedComment) {
        // Revert on failure
        setComments((prev) => [...prev, deletedComment]);
      }
    },
    [comments]
  );

  // Handle edit click
  const handleEdit = useCallback((comment: Comment) => {
    setEditingComment(comment);
  }, []);

  // Handle edit save
  const handleEditSave = useCallback(
    async (commentId: string, updates: UpdateCommentInput) => {
      const originalComment = comments.find((c) => c.id === commentId);
      if (!originalComment) return;

      // Optimistic update
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                ...updates,
                content: updates.content || c.content,
                isEdited: true,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );

      setEditingComment(null);

      const success = await updateComment(
        commentId,
        updates,
        originalComment.content
      );

      if (!success) {
        // Revert on failure
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? originalComment : c))
        );
      }
    },
    [comments]
  );

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setEditingComment(null);
  }, []);

  // Don't render if Firebase isn't configured
  if (!isFirebaseConfigured()) {
    return null;
  }

  // Combine real comments with optimistic comment
  const displayComments = optimisticComment
    ? [optimisticComment, ...comments.filter((c) => c.id !== optimisticComment.id)]
    : comments;

  return (
    <section className={styles.commentSection}>
      <div className={styles.sectionHeader}>
        <h3>Comments & Feedback</h3>
        {displayComments.length > 0 && (
          <span className={styles.commentCount}>
            {displayComments.length} comment{displayComments.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Login prompt for unauthenticated users */}
      {!authLoading && !user && (
        <div className={styles.loginPrompt}>
          <p>Sign in to leave a comment or provide feedback</p>
          <div className={styles.buttons}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={signInGoogle}
            >
              Sign in with Google
            </button>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={signInGithub}
            >
              Sign in with GitHub
            </button>
          </div>
        </div>
      )}

      {/* Comment form */}
      {user && (
        <>
          {showForm ? (
            <CommentForm
              pageId={pageId}
              pageTitle={pageTitle}
              pageUrl={currentUrl}
              onCommentAdded={handleCommentAdded}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => setShowForm(true)}
              style={{ marginBottom: "1.5rem" }}
            >
              Add Comment
            </button>
          )}
        </>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className={styles.emptyState}>
          <div>Loading comments...</div>
        </div>
      ) : displayComments.length > 0 ? (
        <div className={styles.commentList}>
          {displayComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAdmin={isAdmin}
              isOptimistic={comment.id === optimisticComment?.id}
              onEdit={
                comment.author.uid === user?.uid ? () => handleEdit(comment) : undefined
              }
              onDelete={
                comment.author.uid === user?.uid || isAdmin
                  ? handleDelete
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>{"\uD83D\uDCAC"}</div>
          <div className={styles.emptyText}>
            No comments yet. Be the first to share your thoughts!
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingComment && (
        <EditCommentModal
          comment={editingComment}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}
    </section>
  );
}

export default CommentSection;
