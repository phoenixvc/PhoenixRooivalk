/**
 * CommentItem Component
 *
 * Displays a single comment with:
 * - Author information
 * - Category and status badges
 * - Content (with AI-enhanced version toggle)
 * - Admin review information
 * - Reply button and nested replies (threading support)
 */

import React from "react";
import type { Comment, CommentThread } from "../../types/comments";
import { COMMENT_CATEGORIES, COMMENT_STATUSES } from "../../types/comments";
import styles from "./Comments.module.css";

// Maximum nesting depth for replies
const MAX_REPLY_DEPTH = 3;

interface CommentItemProps {
  comment: Comment | CommentThread;
  isAdmin?: boolean;
  isOptimistic?: boolean;
  depth?: number;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  onReview?: (comment: Comment) => void;
  onReply?: (parentId: string) => void;
  currentUserId?: string;
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// Get status badge class
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
      return styles.badgePending;
    case "approved":
      return styles.badgeApproved;
    case "rejected":
      return styles.badgeRejected;
    case "implemented":
      return styles.badgeImplemented;
    default:
      return "";
  }
}

// Get initials from name
function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// Type guard to check if a comment is a CommentThread (has replies)
function isCommentThread(comment: Comment | CommentThread): comment is CommentThread {
  return "replies" in comment && Array.isArray((comment as CommentThread).replies);
}

export function CommentItem({
  comment,
  isAdmin = false,
  isOptimistic = false,
  depth = 0,
  onEdit,
  onDelete,
  onReview,
  onReply,
  currentUserId,
}: CommentItemProps): React.ReactElement {
  const displayContent = comment.useAIVersion && comment.enhancedContent
    ? comment.enhancedContent
    : comment.content;

  const canReply = depth < MAX_REPLY_DEPTH && onReply && !isOptimistic;
  const replies = isCommentThread(comment) ? comment.replies : [];
  const isReply = depth > 0;

  return (
    <div
      className={`${styles.commentItem} ${isReply ? styles.replyItem : ""}`}
      style={{
        ...(isOptimistic ? { opacity: 0.7, pointerEvents: "none" } : {}),
        marginLeft: isReply ? `${Math.min(depth, MAX_REPLY_DEPTH) * 1.5}rem` : 0,
      }}
    >
      {/* Header */}
      <div className={styles.commentHeader}>
        <div className={styles.authorInfo}>
          <div className={styles.authorAvatar}>
            {comment.author.photoURL ? (
              <img src={comment.author.photoURL} alt="" />
            ) : (
              getInitials(comment.author.displayName)
            )}
          </div>
          <div className={styles.authorDetails}>
            <span className={styles.authorName}>
              {comment.author.displayName || "Anonymous"}
            </span>
            <span className={styles.commentMeta}>
              {formatRelativeTime(comment.createdAt)}
              {comment.isEdited && " (edited)"}
            </span>
          </div>
        </div>

        <div className={styles.commentBadges}>
          <span className={`${styles.badge} ${styles.badgeCategory}`}>
            {COMMENT_CATEGORIES[comment.category].label}
          </span>
          {comment.sendForReview && (
            <span
              className={`${styles.badge} ${styles.badgeStatus} ${getStatusBadgeClass(comment.status)}`}
            >
              {COMMENT_STATUSES[comment.status].label}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.commentContent}>
        {displayContent}
        {comment.useAIVersion && comment.enhancedContent && (
          <span
            style={{
              display: "inline-block",
              marginLeft: "0.5rem",
              fontSize: "0.75rem",
              color: "#667eea",
            }}
          >
            {"\u2728"} AI-enhanced
          </span>
        )}
      </div>

      {/* AI Suggestions (if applicable) */}
      {comment.aiEnhancement?.suggestions && comment.aiEnhancement.suggestions.length > 0 && (
        <div className={styles.aiSuggestions} style={{ marginTop: "0.75rem" }}>
          <div className={styles.aiSuggestionsTitle}>AI Suggestions:</div>
          <ul className={styles.aiSuggestionsList}>
            {comment.aiEnhancement.suggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Review Info (if reviewed) */}
      {comment.review && (
        <div className={styles.reviewSection}>
          <div className={styles.reviewInfo}>
            Reviewed by <strong>{comment.review.reviewerEmail}</strong> on{" "}
            {new Date(comment.review.reviewedAt).toLocaleDateString()}
          </div>
          {comment.review.notes && (
            <div className={styles.reviewNotes}>
              <strong>Notes:</strong> {comment.review.notes}
            </div>
          )}
        </div>
      )}

      {/* Footer with actions */}
      <div className={styles.commentFooter}>
        <div className={styles.commentActions}>
          {canReply && (
            <button
              className={styles.actionBtn}
              onClick={() => onReply(comment.id)}
            >
              Reply
            </button>
          )}
          {onEdit && (
            <button
              className={styles.actionBtn}
              onClick={() => onEdit(comment)}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              className={styles.actionBtn}
              onClick={() => onDelete(comment.id)}
            >
              Delete
            </button>
          )}
        </div>

        {isAdmin && comment.sendForReview && comment.status === "pending" && onReview && (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => onReview(comment)}
            style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
          >
            Review
          </button>
        )}
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className={styles.repliesContainer}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isAdmin={isAdmin}
              depth={depth + 1}
              onEdit={reply.author.uid === currentUserId ? onEdit : undefined}
              onDelete={
                reply.author.uid === currentUserId || isAdmin
                  ? onDelete
                  : undefined
              }
              onReview={onReview}
              onReply={onReply}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem;
