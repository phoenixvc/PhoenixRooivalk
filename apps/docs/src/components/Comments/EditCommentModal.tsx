/**
 * EditCommentModal Component
 *
 * Modal for editing an existing comment.
 * Allows changing content, category, and review settings.
 */

import React, { useState, useCallback } from "react";
import type {
  Comment,
  CommentCategory,
  UpdateCommentInput,
} from "../../types/comments";
import { COMMENT_CATEGORIES } from "../../types/comments";
import {
  validateContent,
  sanitizeContent,
} from "../../services/commentService";
import styles from "./Comments.module.css";

interface EditCommentModalProps {
  comment: Comment;
  onSave: (commentId: string, updates: UpdateCommentInput) => void;
  onCancel: () => void;
}

// Category icons
const CATEGORY_ICONS: Record<CommentCategory, string> = {
  comment: "\uD83D\uDCAC",
  change_request: "\u270F\uFE0F",
  question: "\u2753",
  suggestion: "\uD83D\uDCA1",
  bug_report: "\uD83D\uDC1B",
};

export function EditCommentModal({
  comment,
  onSave,
  onCancel,
}: EditCommentModalProps): React.ReactElement {
  const [content, setContent] = useState(comment.content);
  const [category, setCategory] = useState<CommentCategory>(comment.category);
  const [sendForReview, setSendForReview] = useState(comment.sendForReview);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(() => {
    // Validate content
    const validation = validateContent(content);
    if (!validation.valid) {
      setError(validation.error || "Invalid content");
      return;
    }

    setIsSaving(true);
    setError(null);

    const updates: UpdateCommentInput = {};

    // Only include changed fields
    const sanitizedContent = sanitizeContent(content);
    if (sanitizedContent !== comment.content) {
      updates.content = sanitizedContent;
    }
    if (category !== comment.category) {
      updates.category = category;
    }
    if (sendForReview !== comment.sendForReview) {
      updates.sendForReview = sendForReview;
    }

    // Only save if there are changes
    if (Object.keys(updates).length === 0) {
      onCancel();
      return;
    }

    onSave(comment.id, updates);
  }, [content, category, sendForReview, comment, onSave, onCancel]);

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Edit Comment</h2>

        {/* Category Selection */}
        <div className={styles.formGroup}>
          <label>Type of feedback</label>
          <div className={styles.categoryGrid}>
            {(Object.keys(COMMENT_CATEGORIES) as CommentCategory[]).map(
              (cat) => (
                <label
                  key={cat}
                  className={`${styles.categoryOption} ${
                    category === cat ? styles.selected : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={category === cat}
                    onChange={() => setCategory(cat)}
                    disabled={isSaving}
                  />
                  <span className={styles.categoryIcon}>
                    {CATEGORY_ICONS[cat]}
                  </span>
                  <span className={styles.categoryLabel}>
                    {COMMENT_CATEGORIES[cat].label}
                  </span>
                </label>
              ),
            )}
          </div>
        </div>

        {/* Content */}
        <div className={styles.formGroup}>
          <label htmlFor="edit-content">
            Your {COMMENT_CATEGORIES[category].label}
          </label>
          <textarea
            id="edit-content"
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={COMMENT_CATEGORIES[category].description}
            disabled={isSaving}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              color: "#ef4444",
              fontSize: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Review Toggle */}
        <label className={styles.reviewToggle} style={{ marginBottom: "1rem" }}>
          <input
            type="checkbox"
            checked={sendForReview}
            onChange={(e) => setSendForReview(e.target.checked)}
            disabled={isSaving}
          />
          <span>Send for admin review</span>
        </label>

        {/* Actions */}
        <div className={styles.modalActions}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditCommentModal;
