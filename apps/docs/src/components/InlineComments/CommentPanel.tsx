/**
 * CommentPanel Component
 *
 * Sidebar panel that displays all inline comments for the current page.
 * Comments are shown off-page in this panel, not inline.
 */

import React, { useState, useCallback } from "react";
import styles from "./InlineComments.module.css";
import type { InlineComment, TextSelection } from "./types";

interface CommentPanelProps {
  comments: InlineComment[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitComment: (selection: TextSelection, comment: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  pendingSelection: TextSelection | null;
  onCancelPending: () => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function CommentPanel({
  comments,
  isOpen,
  onClose,
  onSubmitComment,
  onDeleteComment,
  onResolveComment,
  pendingSelection,
  onCancelPending,
  currentUserId,
  isAdmin,
}: CommentPanelProps): React.ReactElement | null {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");

  const handleSubmit = useCallback(async () => {
    if (!pendingSelection || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitComment(pendingSelection, newComment.trim());
      setNewComment("");
      onCancelPending();
    } finally {
      setIsSubmitting(false);
    }
  }, [pendingSelection, newComment, onSubmitComment, onCancelPending]);

  const filteredComments = comments.filter((c) => {
    if (filter === "open") return !c.resolved;
    if (filter === "resolved") return c.resolved;
    return true;
  });

  const openCount = comments.filter((c) => !c.resolved).length;
  const resolvedCount = comments.filter((c) => c.resolved).length;

  if (!isOpen) return null;

  return (
    <div className={styles.panelOverlay} onClick={onClose}>
      <div className={styles.commentPanel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <h3>Comments</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
            {"\u2715"}
          </button>
        </div>

        {/* Filter tabs */}
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${filter === "all" ? styles.filterTabActive : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({comments.length})
          </button>
          <button
            className={`${styles.filterTab} ${filter === "open" ? styles.filterTabActive : ""}`}
            onClick={() => setFilter("open")}
          >
            Open ({openCount})
          </button>
          <button
            className={`${styles.filterTab} ${filter === "resolved" ? styles.filterTabActive : ""}`}
            onClick={() => setFilter("resolved")}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        {/* New comment form */}
        {pendingSelection && (
          <div className={styles.newCommentForm}>
            <div className={styles.selectedTextPreview}>
              <span className={styles.previewLabel}>Selected text:</span>
              <blockquote className={styles.previewText}>
                "{pendingSelection.text.slice(0, 100)}
                {pendingSelection.text.length > 100 ? "..." : ""}"
              </blockquote>
            </div>
            <textarea
              className={styles.commentInput}
              placeholder="Add your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className={styles.formActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  onCancelPending();
                  setNewComment("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Comment"}
              </button>
            </div>
          </div>
        )}

        {/* Comments list */}
        <div className={styles.commentsList}>
          {filteredComments.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>{"\uD83D\uDCAC"}</span>
              <p>
                {filter === "all"
                  ? "No comments yet. Select text to add one."
                  : filter === "open"
                  ? "No open comments."
                  : "No resolved comments."}
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={`${styles.commentCard} ${comment.resolved ? styles.commentResolved : ""}`}
              >
                {/* Comment header */}
                <div className={styles.commentHeader}>
                  <div className={styles.authorInfo}>
                    {comment.author.photoURL ? (
                      <img
                        src={comment.author.photoURL}
                        alt=""
                        className={styles.authorAvatar}
                      />
                    ) : (
                      <div className={styles.authorAvatarPlaceholder}>
                        {comment.author.displayName?.charAt(0) || "?"}
                      </div>
                    )}
                    <span className={styles.authorName}>
                      {comment.author.displayName || "Anonymous"}
                    </span>
                  </div>
                  <span className={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Selected text reference */}
                <blockquote className={styles.highlightedText}>
                  "{comment.selectedText.slice(0, 80)}
                  {comment.selectedText.length > 80 ? "..." : ""}"
                </blockquote>

                {/* Comment content */}
                <p className={styles.commentContent}>{comment.comment}</p>

                {/* Comment actions */}
                <div className={styles.commentActions}>
                  {!comment.resolved && (currentUserId === comment.author.uid || isAdmin) && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => onResolveComment(comment.id)}
                      title="Mark as resolved"
                    >
                      {"\u2713"} Resolve
                    </button>
                  )}
                  {(currentUserId === comment.author.uid || isAdmin) && (
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => {
                        if (window.confirm("Delete this comment?")) {
                          onDeleteComment(comment.id);
                        }
                      }}
                      title="Delete comment"
                    >
                      {"\uD83D\uDDD1"} Delete
                    </button>
                  )}
                  {comment.resolved && (
                    <span className={styles.resolvedBadge}>Resolved</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentPanel;
