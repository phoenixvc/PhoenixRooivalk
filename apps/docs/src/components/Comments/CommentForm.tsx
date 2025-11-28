/**
 * CommentForm Component
 *
 * Form for creating and editing comments with:
 * - Category selection
 * - AI enhancement button
 * - Option to send for admin review
 */

import React, { useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { createComment, saveAIEnhancement } from "../../services/commentService";
import { aiService } from "../../services/aiService";
import type {
  CommentCategory,
  CreateCommentInput,
  Comment,
} from "../../types/comments";
import { COMMENT_CATEGORIES } from "../../types/comments";
import styles from "./Comments.module.css";

interface CommentFormProps {
  pageId: string;
  pageTitle: string;
  pageUrl: string;
  onCommentAdded?: (comment: Comment) => void;
  onCancel?: () => void;
  parentId?: string;
}

// Category icons (using unicode/emoji for simplicity)
const CATEGORY_ICONS: Record<CommentCategory, string> = {
  comment: "\uD83D\uDCAC",
  change_request: "\u270F\uFE0F",
  question: "\u2753",
  suggestion: "\uD83D\uDCA1",
  bug_report: "\uD83D\uDC1B",
};

export function CommentForm({
  pageId,
  pageTitle,
  pageUrl,
  onCommentAdded,
  onCancel,
  parentId,
}: CommentFormProps): React.ReactElement | null {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CommentCategory>("comment");
  const [sendForReview, setSendForReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiEnhancement, setAiEnhancement] = useState<{
    content: string;
    suggestions: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle AI enhancement
  const handleAIEnhance = useCallback(async () => {
    if (!content.trim() || isEnhancing) return;

    setIsEnhancing(true);
    setError(null);

    try {
      // Use the RAG service to enhance the comment
      const response = await aiService.askDocumentation(
        `Please improve the following ${COMMENT_CATEGORIES[category].label.toLowerCase()} for a technical documentation page titled "${pageTitle}".
        Make it clearer, more professional, and more actionable. Also provide 2-3 brief suggestions for what else the author might consider adding.

        Original comment:
        "${content}"

        Please respond with:
        1. An improved version of the comment
        2. A list of suggestions for improvement`,
        { format: "detailed" }
      );

      // Parse the AI response
      const enhancedContent = response.answer;

      // Extract suggestions (simple parsing)
      const suggestionMatch = enhancedContent.match(/suggestions?:?\s*([\s\S]*)/i);
      const suggestions = suggestionMatch
        ? suggestionMatch[1]
            .split(/\n|•|-|\d+\./)
            .map((s) => s.trim())
            .filter((s) => s.length > 10 && s.length < 200)
            .slice(0, 3)
        : [];

      // Get the improved content (before suggestions)
      const improvedContent = enhancedContent
        .split(/suggestions?:?/i)[0]
        .replace(/improved version:?/i, "")
        .trim();

      setAiEnhancement({
        content: improvedContent || enhancedContent,
        suggestions,
      });
    } catch (err) {
      console.error("AI enhancement failed:", err);
      setError("Failed to enhance comment. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  }, [content, category, pageTitle, isEnhancing]);

  // Use AI enhanced version
  const useAIVersion = useCallback(() => {
    if (aiEnhancement) {
      setContent(aiEnhancement.content);
      setAiEnhancement(null);
    }
  }, [aiEnhancement]);

  // Dismiss AI enhancement
  const dismissAIVersion = useCallback(() => {
    setAiEnhancement(null);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!user || !content.trim()) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const input: CreateCommentInput = {
          content: content.trim(),
          pageId,
          pageTitle,
          pageUrl,
          category,
          sendForReview,
          parentId,
        };

        const comment = await createComment(input, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });

        // If there was an AI enhancement, save it
        if (aiEnhancement) {
          await saveAIEnhancement(
            comment.id,
            aiEnhancement.content,
            aiEnhancement.suggestions,
            "medium"
          );
        }

        // Reset form
        setContent("");
        setCategory("comment");
        setSendForReview(false);
        setAiEnhancement(null);

        // Notify parent
        onCommentAdded?.(comment);
      } catch (err) {
        console.error("Failed to submit comment:", err);
        setError("Failed to submit comment. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      user,
      content,
      pageId,
      pageTitle,
      pageUrl,
      category,
      sendForReview,
      parentId,
      aiEnhancement,
      onCommentAdded,
    ]
  );

  if (!user) {
    return null;
  }

  return (
    <form className={styles.commentForm} onSubmit={handleSubmit}>
      {/* Category Selection */}
      <div className={styles.formGroup}>
        <label>Type of feedback</label>
        <div className={styles.categoryGrid}>
          {(Object.keys(COMMENT_CATEGORIES) as CommentCategory[]).map((cat) => (
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
              />
              <span className={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</span>
              <span className={styles.categoryLabel}>
                {COMMENT_CATEGORIES[cat].label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={styles.formGroup}>
        <label htmlFor="comment-content">Your {COMMENT_CATEGORIES[category].label}</label>
        <textarea
          id="comment-content"
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={COMMENT_CATEGORIES[category].description}
          disabled={isSubmitting}
        />
      </div>

      {/* AI Enhance Button */}
      {content.trim().length > 20 && (
        <button
          type="button"
          className={`${styles.aiButton} ${isEnhancing ? styles.loading : ""}`}
          onClick={handleAIEnhance}
          disabled={isEnhancing || isSubmitting}
        >
          <span className={styles.aiIcon}>{"\u2728"}</span>
          {isEnhancing ? "Enhancing..." : "AI Enhance"}
        </button>
      )}

      {/* AI Enhancement Preview */}
      {aiEnhancement && (
        <div className={styles.aiPreview}>
          <div className={styles.aiPreviewHeader}>
            <span className={styles.aiPreviewTitle}>{"\u2728"} AI-Enhanced Version</span>
            <div className={styles.aiPreviewActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={useAIVersion}
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              >
                Use This
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={dismissAIVersion}
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className={styles.aiPreviewContent}>{aiEnhancement.content}</div>
          {aiEnhancement.suggestions.length > 0 && (
            <div className={styles.aiSuggestions}>
              <div className={styles.aiSuggestionsTitle}>Suggestions:</div>
              <ul className={styles.aiSuggestionsList}>
                {aiEnhancement.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {error}
        </div>
      )}

      {/* Form Actions */}
      <div className={styles.formActions}>
        <label className={styles.reviewToggle}>
          <input
            type="checkbox"
            checked={sendForReview}
            onChange={(e) => setSendForReview(e.target.checked)}
            disabled={isSubmitting}
          />
          <span>Send for admin review</span>
        </label>

        <div className={styles.buttons}>
          {onCancel && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CommentForm;
