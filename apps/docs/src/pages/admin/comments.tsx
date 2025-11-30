/**
 * Comments Admin Dashboard
 *
 * Admin page for managing comments and change requests:
 * - View all comments across the documentation
 * - Review pending change requests
 * - Approve/reject comments
 * - View comment statistics
 */

import React, { useEffect, useState, useCallback } from "react";
import Layout from "@theme/Layout";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllComments,
  getPendingComments,
  getCommentStats,
  reviewComment,
} from "../../services/commentService";
import { isCloudConfigured } from "../../services/cloud";
import type {
  Comment,
  CommentStats,
  CommentStatus,
} from "../../types/comments";
import { COMMENT_CATEGORIES, COMMENT_STATUSES } from "../../types/comments";
import styles from "./comments.module.css";

// Admin email domains (same as in analytics.tsx)
const ADMIN_EMAIL_DOMAINS = ["phoenixrooivalk.com", "justaghost.dev"];

type TabType = "pending" | "all" | "stats";

export default function CommentsAdminDashboard(): React.ReactElement {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Check if user is admin
  const isAdmin =
    user?.email &&
    ADMIN_EMAIL_DOMAINS.some((domain) => user.email?.endsWith(`@${domain}`));

  // Load data based on active tab
  const loadData = useCallback(async () => {
    if (!isCloudConfigured() || !isAdmin) return;

    setIsLoading(true);
    try {
      switch (activeTab) {
        case "pending":
          const pending = await getPendingComments();
          setPendingComments(pending);
          break;
        case "all":
          const { comments } = await getAllComments();
          setAllComments(comments);
          break;
        case "stats":
          const commentStats = await getCommentStats();
          setStats(commentStats);
          break;
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading, isAdmin, loadData]);

  // Handle review action
  const handleReview = useCallback(
    async (status: CommentStatus) => {
      if (!selectedComment || !user) return;

      setIsReviewing(true);
      try {
        const success = await reviewComment(
          selectedComment.id,
          user.uid,
          user.email || "",
          { status, notes: reviewNotes },
        );

        if (success) {
          // Remove from pending list
          setPendingComments((prev) =>
            prev.filter((c) => c.id !== selectedComment.id),
          );
          setSelectedComment(null);
          setReviewNotes("");
        }
      } catch (error) {
        console.error("Failed to review comment:", error);
      } finally {
        setIsReviewing(false);
      }
    },
    [selectedComment, user, reviewNotes],
  );

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render error states
  if (!isCloudConfigured()) {
    return (
      <Layout title="Comments Dashboard">
        <main className="container margin-vert--xl">
          <div className={styles.errorCard}>
            <h2>Azure Not Configured</h2>
            <p>Comments require Azure cloud services to be configured.</p>
          </div>
        </main>
      </Layout>
    );
  }

  if (authLoading) {
    return (
      <Layout title="Comments Dashboard">
        <main className="container margin-vert--xl">
          <div className={styles.loading}>Loading...</div>
        </main>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="Comments Dashboard">
        <main className="container margin-vert--xl">
          <div className={styles.errorCard}>
            <h2>Authentication Required</h2>
            <p>Please sign in to view the comments dashboard.</p>
          </div>
        </main>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="Comments Dashboard">
        <main className="container margin-vert--xl">
          <div className={styles.errorCard}>
            <h2>Access Denied</h2>
            <p>You don&apos;t have permission to view this page.</p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout
      title="Comments Dashboard"
      description="Manage documentation comments and change requests"
    >
      <main className="container margin-vert--xl">
        <header className={styles.header}>
          <h1>Comments Dashboard</h1>
          <button className={styles.refreshBtn} onClick={loadData}>
            Refresh
          </button>
        </header>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "pending" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Review
            {pendingComments.length > 0 && (
              <span className={styles.tabBadge}>{pendingComments.length}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Comments
          </button>
          <button
            className={`${styles.tab} ${activeTab === "stats" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            Statistics
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <>
            {/* Pending Tab */}
            {activeTab === "pending" && (
              <div className={styles.section}>
                {pendingComments.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>{"\u2705"}</div>
                    <p>No comments pending review</p>
                  </div>
                ) : (
                  <div className={styles.commentsList}>
                    {pendingComments.map((comment) => (
                      <div key={comment.id} className={styles.commentCard}>
                        <div className={styles.commentHeader}>
                          <div>
                            <span className={styles.authorName}>
                              {comment.author.displayName || "Anonymous"}
                            </span>
                            <span className={styles.commentMeta}>
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <span
                            className={`${styles.badge} ${styles.badgeCategory}`}
                          >
                            {COMMENT_CATEGORIES[comment.category].label}
                          </span>
                        </div>

                        <div className={styles.commentPage}>
                          <strong>Page:</strong>{" "}
                          <a href={comment.pageUrl}>{comment.pageTitle}</a>
                        </div>

                        <div className={styles.commentContent}>
                          {comment.content}
                        </div>

                        {comment.aiEnhancement && (
                          <div className={styles.aiEnhancementPreview}>
                            <span className={styles.aiLabel}>
                              {"\u2728"} AI-Enhanced:
                            </span>
                            <p>{comment.aiEnhancement.enhancedContent}</p>
                          </div>
                        )}

                        <div className={styles.reviewActions}>
                          <button
                            className={`${styles.btn} ${styles.btnSuccess}`}
                            onClick={() => setSelectedComment(comment)}
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Comments Tab */}
            {activeTab === "all" && (
              <div className={styles.section}>
                {allComments.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No comments yet</p>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Author</th>
                        <th>Page</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allComments.map((comment) => (
                        <tr key={comment.id}>
                          <td>{comment.author.displayName || "Anonymous"}</td>
                          <td className={styles.pageCell}>
                            <a href={comment.pageUrl}>{comment.pageTitle}</a>
                          </td>
                          <td>
                            <span
                              className={`${styles.badge} ${styles.badgeCategory}`}
                            >
                              {COMMENT_CATEGORIES[comment.category].label}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.badge} ${styles.badgeStatus} ${styles[`badge${comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}`]}`}
                            >
                              {COMMENT_STATUSES[comment.status].label}
                            </span>
                          </td>
                          <td>{formatDate(comment.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === "stats" && stats && (
              <div>
                {/* Overview */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>Total Comments</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>
                      {stats.pendingReview}
                    </div>
                    <div className={styles.statLabel}>Pending Review</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.recentCount}</div>
                    <div className={styles.statLabel}>Last 7 Days</div>
                  </div>
                </div>

                {/* By Category */}
                <div className={styles.section}>
                  <h3>By Category</h3>
                  <div className={styles.statsBreakdown}>
                    {Object.entries(stats.byCategory).map(([cat, count]) => (
                      <div key={cat} className={styles.breakdownItem}>
                        <span>
                          {COMMENT_CATEGORIES[
                            cat as keyof typeof COMMENT_CATEGORIES
                          ]?.label || cat}
                        </span>
                        <span className={styles.breakdownValue}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Status */}
                <div className={styles.section}>
                  <h3>By Status</h3>
                  <div className={styles.statsBreakdown}>
                    {Object.entries(stats.byStatus).map(([status, count]) => (
                      <div key={status} className={styles.breakdownItem}>
                        <span>
                          {COMMENT_STATUSES[
                            status as keyof typeof COMMENT_STATUSES
                          ]?.label || status}
                        </span>
                        <span className={styles.breakdownValue}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Review Modal */}
        {selectedComment && (
          <div
            className={styles.modalOverlay}
            onClick={() => setSelectedComment(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSelectedComment(null);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedComment(null);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2>Review Comment</h2>

              <div className={styles.modalContent}>
                <div className={styles.modalMeta}>
                  <strong>Author:</strong> {selectedComment.author.displayName}
                </div>
                <div className={styles.modalMeta}>
                  <strong>Page:</strong> {selectedComment.pageTitle}
                </div>
                <div className={styles.modalMeta}>
                  <strong>Category:</strong>{" "}
                  {COMMENT_CATEGORIES[selectedComment.category].label}
                </div>

                <div className={styles.modalSection}>
                  <strong>Original Comment:</strong>
                  <p>{selectedComment.content}</p>
                </div>

                {selectedComment.aiEnhancement && (
                  <div className={styles.modalSection}>
                    <strong>{"\u2728"} AI-Enhanced Version:</strong>
                    <p>{selectedComment.aiEnhancement.enhancedContent}</p>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="review-notes">Review Notes (optional)</label>
                  <textarea
                    id="review-notes"
                    className={styles.textarea}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setSelectedComment(null)}
                  disabled={isReviewing}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={() => handleReview("rejected")}
                  disabled={isReviewing}
                >
                  Reject
                </button>
                {selectedComment.category === "change_request" && (
                  <button
                    className={`${styles.btn} ${styles.btnInfo}`}
                    onClick={() => handleReview("implemented")}
                    disabled={isReviewing}
                  >
                    Mark Implemented
                  </button>
                )}
                <button
                  className={`${styles.btn} ${styles.btnSuccess}`}
                  onClick={() => handleReview("approved")}
                  disabled={isReviewing}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
