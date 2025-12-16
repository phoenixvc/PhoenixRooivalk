/**
 * InlineComments Component
 *
 * Main wrapper that enables inline commenting on page content.
 * Allows users to select text and add comments that appear in a sidebar panel.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { isCloudConfigured } from "../../services/cloud";
import { SelectionPopover } from "./SelectionPopover";
import { CommentPanel } from "./CommentPanel";
import {
  subscribeToInlineComments,
  addInlineComment,
  deleteInlineComment,
  resolveInlineComment,
} from "./inlineCommentService";
import styles from "./InlineComments.module.css";
import type { InlineComment, TextSelection } from "./types";

interface InlineCommentsProps {
  pageId: string;
  pageTitle: string;
  children: React.ReactNode;
}

const ADMIN_DOMAINS = ["phoenixrooivalk.com", "justaghost.dev"];

export function InlineComments({
  pageId,
  pageTitle,
  children,
}: InlineCommentsProps): React.ReactElement {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<InlineComment[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [pendingSelection, setPendingSelection] =
    useState<TextSelection | null>(null);

  const isAdmin = Boolean(
    user?.email && ADMIN_DOMAINS.some((d) => user.email?.endsWith(`@${d}`)),
  );

  // Subscribe to comments
  useEffect(() => {
    if (!isCloudConfigured()) return;

    const unsubscribe = subscribeToInlineComments(
      pageId,
      (updatedComments) => setComments(updatedComments),
      (error) => console.error("Failed to load inline comments:", error),
    );

    return () => unsubscribe?.();
  }, [pageId]);

  // Handle add comment from selection
  const handleAddComment = useCallback(
    (selection: TextSelection) => {
      if (!user) {
        // Show login prompt
        alert("Please sign in to add comments");
        return;
      }
      setPendingSelection(selection);
      setIsPanelOpen(true);
    },
    [user],
  );

  // Submit comment
  const handleSubmitComment = useCallback(
    async (selection: TextSelection, comment: string) => {
      if (!user) return;

      await addInlineComment({
        pageId,
        selectedText: selection.text,
        textContext: selection.context,
        comment,
      });
    },
    [pageId, user],
  );

  // Delete comment
  const handleDeleteComment = useCallback(async (commentId: string) => {
    await deleteInlineComment(commentId);
  }, []);

  // Resolve comment
  const handleResolveComment = useCallback(async (commentId: string) => {
    await resolveInlineComment(commentId);
  }, []);

  const openCommentCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className={styles.inlineCommentsWrapper}>
      {/* Content container with selection detection */}
      <div ref={containerRef} className={styles.contentContainer}>
        {children}

        {/* Selection popover */}
        {isCloudConfigured() && (
          <SelectionPopover
            containerRef={containerRef}
            onAddComment={handleAddComment}
            disabled={!user}
          />
        )}
      </div>

      {/* Floating comment button */}
      {isCloudConfigured() && (
        <button
          className={styles.floatingCommentBtn}
          onClick={() => setIsPanelOpen(true)}
          title={`View comments (${openCommentCount} open)`}
          aria-label={`Open comments panel. ${openCommentCount} open comments.`}
        >
          <span className={styles.commentBtnIcon}>{"\uD83D\uDCAC"}</span>
          {openCommentCount > 0 && (
            <span className={styles.commentBadge}>{openCommentCount}</span>
          )}
        </button>
      )}

      {/* Comment panel */}
      <CommentPanel
        comments={comments}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setPendingSelection(null);
        }}
        onSubmitComment={handleSubmitComment}
        onDeleteComment={handleDeleteComment}
        onResolveComment={handleResolveComment}
        pendingSelection={pendingSelection}
        onCancelPending={() => setPendingSelection(null)}
        currentUserId={user?.uid}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default InlineComments;
