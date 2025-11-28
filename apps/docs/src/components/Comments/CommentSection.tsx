/**
 * CommentSection Component
 *
 * Main component for displaying comments on a documentation page.
 * Includes:
 * - Comment form for adding new comments
 * - List of existing comments
 * - Login prompt for unauthenticated users
 */

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getPageComments, deleteComment } from "../../services/commentService";
import { isFirebaseConfigured } from "../../services/firebase";
import type { Comment } from "../../types/comments";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
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

  // Check if current user is admin
  const isAdmin =
    user?.email &&
    ADMIN_EMAIL_DOMAINS.some((domain) => user.email?.endsWith(`@${domain}`));

  // Get the current page URL
  const currentUrl = pageUrl || (typeof window !== "undefined" ? window.location.pathname : "");

  // Load comments
  const loadComments = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      const pageComments = await getPageComments(pageId);
      // Filter out drafts from other users
      const visibleComments = pageComments.filter(
        (c) => c.status !== "draft" || c.author.uid === user?.uid
      );
      setComments(visibleComments);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pageId, user?.uid]);

  useEffect(() => {
    if (!authLoading) {
      loadComments();
    }
  }, [authLoading, loadComments]);

  // Handle new comment added
  const handleCommentAdded = useCallback((comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
    setShowForm(false);
  }, []);

  // Handle comment deletion
  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!window.confirm("Are you sure you want to delete this comment?")) {
        return;
      }

      const success = await deleteComment(commentId);
      if (success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    },
    []
  );

  // Don't render if Firebase isn't configured
  if (!isFirebaseConfigured()) {
    return null;
  }

  return (
    <section className={styles.commentSection}>
      <div className={styles.sectionHeader}>
        <h3>Comments & Feedback</h3>
        {comments.length > 0 && (
          <span className={styles.commentCount}>
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
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
      ) : comments.length > 0 ? (
        <div className={styles.commentList}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAdmin={isAdmin}
              onEdit={
                comment.author.uid === user?.uid
                  ? () => {
                      // TODO: Implement edit functionality
                      console.log("Edit comment:", comment.id);
                    }
                  : undefined
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
    </section>
  );
}

export default CommentSection;
