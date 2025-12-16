/**
 * Admin Improvement Review Panel
 *
 * Allows admins to review, approve, or reject document improvement suggestions
 * submitted by users through the AI panel.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  aiService,
  PendingImprovement,
  AIError,
} from "../../services/aiService";
import { sanitizeMarkdown } from "../../utils/sanitize";
import "./AdminImprovementReview.css";

interface AdminImprovementReviewProps {
  /** Maximum items per page */
  pageSize?: number;
}

export function AdminImprovementReview({
  pageSize = 10,
}: AdminImprovementReviewProps): React.ReactElement | null {
  const { user } = useAuth();
  const [improvements, setImprovements] = useState<PendingImprovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchImprovements = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.getPendingImprovements(pageSize);
      setImprovements(result.suggestions);
    } catch (err) {
      if (err instanceof AIError) {
        if (err.code === "permission-denied") {
          setError("You don't have permission to view this page.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load improvement suggestions");
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    if (user) {
      fetchImprovements();
    }
  }, [user, fetchImprovements]);

  const handleReview = async (
    suggestionId: string,
    status: "approved" | "rejected" | "implemented",
  ) => {
    setActionLoading(suggestionId);
    setError(null);

    try {
      await aiService.reviewImprovement(suggestionId, status, reviewNotes);

      // Remove from list
      setImprovements((prev) => prev.filter((imp) => imp.id !== suggestionId));
      setSelectedId(null);
      setReviewNotes("");
    } catch (err) {
      if (err instanceof AIError) {
        setError(err.message);
      } else {
        setError("Failed to submit review");
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Only render for authenticated users (permission check happens on API)
  if (!user) {
    return null;
  }

  return (
    <div className="admin-review-panel">
      <div className="admin-review-header">
        <h2>Document Improvement Suggestions</h2>
        <button
          className="admin-refresh-btn"
          onClick={fetchImprovements}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="admin-review-error">{error}</div>}

      {isLoading && improvements.length === 0 && (
        <div className="admin-review-loading">Loading suggestions...</div>
      )}

      {!isLoading && improvements.length === 0 && !error && (
        <div className="admin-review-empty">
          <p>No pending improvement suggestions.</p>
          <p className="admin-review-empty-sub">
            Suggestions submitted by users will appear here for review.
          </p>
        </div>
      )}

      <div className="admin-review-list">
        {improvements.map((improvement) => (
          <div
            key={improvement.id}
            className={`admin-review-item ${selectedId === improvement.id ? "expanded" : ""}`}
          >
            <div
              className="admin-review-item-header"
              onClick={() =>
                setSelectedId(
                  selectedId === improvement.id ? null : improvement.id,
                )
              }
            >
              <div className="admin-review-item-info">
                <h3>{improvement.docTitle}</h3>
                <span className="admin-review-item-meta">
                  Submitted by {improvement.userEmail || "Anonymous"} •{" "}
                  {formatDate(improvement.createdAt)}
                </span>
              </div>
              <span className="admin-review-item-expand">
                {selectedId === improvement.id ? "▼" : "▶"}
              </span>
            </div>

            {selectedId === improvement.id && (
              <div className="admin-review-item-content">
                <div className="admin-review-item-doc">
                  <strong>Document:</strong>{" "}
                  <a
                    href={improvement.docId}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {improvement.docId}
                  </a>
                </div>

                <div className="admin-review-suggestions">
                  <h4>AI Suggestions:</h4>
                  <div
                    className="admin-review-suggestions-content"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeMarkdown(improvement.suggestions),
                    }}
                  />
                </div>

                <div className="admin-review-notes">
                  <label htmlFor={`notes-${improvement.id}`}>
                    Review Notes (optional):
                  </label>
                  <textarea
                    id={`notes-${improvement.id}`}
                    placeholder="Add notes about your decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="admin-review-actions">
                  <button
                    className="admin-review-btn approve"
                    onClick={() => handleReview(improvement.id, "approved")}
                    disabled={actionLoading === improvement.id}
                  >
                    {actionLoading === improvement.id ? "..." : "✓ Approve"}
                  </button>
                  <button
                    className="admin-review-btn implement"
                    onClick={() => handleReview(improvement.id, "implemented")}
                    disabled={actionLoading === improvement.id}
                  >
                    {actionLoading === improvement.id ? "..." : "✓ Implemented"}
                  </button>
                  <button
                    className="admin-review-btn reject"
                    onClick={() => handleReview(improvement.id, "rejected")}
                    disabled={actionLoading === improvement.id}
                  >
                    {actionLoading === improvement.id ? "..." : "✗ Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="admin-review-footer">
        <span>Showing {improvements.length} pending suggestions</span>
      </div>
    </div>
  );
}

/**
 * Format Firestore timestamp to readable date
 */
function formatDate(timestamp: { toDate?: () => Date } | Date | string | number | null | undefined): string {
  if (!timestamp) return "Unknown";

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
}

export default AdminImprovementReview;
