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
import {
  createComment,
  saveAIEnhancement,
} from "../../services/commentService";
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

  // Parse AI response with structured format
  const parseAIResponse = useCallback(
    (response: string): { content: string; suggestions: string[] } => {
      // Try to find JSON block first (most reliable)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return {
            content: parsed.improved || parsed.content || response,
            suggestions: Array.isArray(parsed.suggestions)
              ? parsed.suggestions
              : [],
          };
        } catch {
          // Fall through to other parsing methods
        }
      }

      // Try to parse structured sections with clear markers
      const sections = {
        content: "",
        suggestions: [] as string[],
      };

      // Look for "IMPROVED:" or "ENHANCED:" section
      const improvedMatch = response.match(
        /(?:IMPROVED|ENHANCED|REVISED)[:\s]*\n?([\s\S]*?)(?=(?:SUGGESTIONS?|TIPS|$))/i,
      );
      if (improvedMatch) {
        sections.content = improvedMatch[1].trim();
      }

      // Look for "SUGGESTIONS:" section
      const suggestionsMatch = response.match(
        /(?:SUGGESTIONS?|TIPS)[:\s]*\n?([\s\S]*?)$/i,
      );
      if (suggestionsMatch) {
        const suggestionsText = suggestionsMatch[1];
        // Parse bullet points or numbered items
        sections.suggestions = suggestionsText
          .split(/\n/)
          .map((line) => line.replace(/^[\s\-\*\d+\.]+/, "").trim())
          .filter((s) => s.length >= 10 && s.length <= 200)
          .slice(0, 3);
      }

      // Fallback: if no structured sections found, use the whole response as content
      if (!sections.content) {
        // Try to split on common patterns
        const parts = response.split(/\n\n+/);
        if (parts.length > 1) {
          // Use first part as content, try to extract suggestions from the rest
          sections.content = parts[0].trim();
          const restText = parts.slice(1).join("\n");
          sections.suggestions = restText
            .split(/\n/)
            .map((line) => line.replace(/^[\s\-\*\d+\.]+/, "").trim())
            .filter((s) => s.length >= 10 && s.length <= 200)
            .slice(0, 3);
        } else {
          sections.content = response.trim();
        }
      }

      return sections;
    },
    [],
  );

  // Handle AI enhancement
  const handleAIEnhance = useCallback(async () => {
    if (!content.trim() || isEnhancing) return;

    setIsEnhancing(true);
    setError(null);

    try {
      // Use a structured prompt for more reliable parsing
      const structuredPrompt = `You are helping improve a ${COMMENT_CATEGORIES[category].label.toLowerCase()} on technical documentation.

Page: "${pageTitle}"

Original comment:
"${content}"

Please provide:
1. An improved, clearer, and more professional version of this comment
2. 2-3 brief suggestions for additional points the author might consider

Format your response EXACTLY like this:
IMPROVED:
[Your improved version here - keep it concise and actionable]

SUGGESTIONS:
- [First suggestion]
- [Second suggestion]
- [Third suggestion if applicable]`;

      const response = await aiService.askDocumentation(structuredPrompt, {
        format: "detailed",
      });

      // Parse the structured response
      const parsed = parseAIResponse(response.answer);

      // Validate we got meaningful content
      if (!parsed.content || parsed.content.length < 10) {
        throw new Error("Could not parse AI response");
      }

      setAiEnhancement({
        content: parsed.content,
        suggestions: parsed.suggestions,
      });
    } catch (err) {
      console.error("AI enhancement failed:", err);
      setError("Failed to enhance comment. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  }, [content, category, pageTitle, isEnhancing, parseAIResponse]);

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
            "medium",
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
    ],
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
        <label htmlFor="comment-content">
          Your {COMMENT_CATEGORIES[category].label}
        </label>
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
            <span className={styles.aiPreviewTitle}>
              {"\u2728"} AI-Enhanced Version
            </span>
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
        <div
          style={{
            color: "#ef4444",
            fontSize: "0.875rem",
            marginTop: "0.5rem",
          }}
        >
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
