/**
 * Comment Types for Phoenix Rooivalk Documentation
 *
 * Types for the commenting system that allows users to:
 * - Leave comments on documentation pages
 * - Submit change requests
 * - Get AI-powered comment improvements
 */

/**
 * Comment categories - determines how a comment is handled
 */
export type CommentCategory =
  | "comment" // General comment or feedback
  | "change_request" // Request to change/update documentation
  | "question" // Question about the content
  | "suggestion" // Improvement suggestion
  | "bug_report"; // Report an error or bug in the documentation

/**
 * Comment status - tracks the lifecycle of a comment
 */
export type CommentStatus =
  | "draft" // Saved but not submitted
  | "pending" // Submitted, awaiting review
  | "approved" // Approved by admin
  | "rejected" // Rejected by admin
  | "implemented" // Change request has been implemented
  | "resolved"; // Question answered or issue resolved

/**
 * User reference for comments (minimal user info)
 */
export interface CommentAuthor {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * AI enhancement result for comments
 */
export interface AIEnhancement {
  enhancedContent: string;
  suggestions: string[];
  confidence: "high" | "medium" | "low";
  timestamp: string;
}

/**
 * Admin review information
 */
export interface AdminReview {
  reviewedBy: string;
  reviewerEmail: string;
  reviewedAt: string;
  status: CommentStatus;
  notes?: string;
}

/**
 * Main comment document structure
 */
export interface Comment {
  id: string;
  // Content
  content: string;
  enhancedContent?: string; // AI-enhanced version
  // Context
  pageId: string; // Document/page ID this comment is on
  pageTitle: string;
  pageUrl: string;
  // Categorization
  category: CommentCategory;
  status: CommentStatus;
  // Author info
  author: CommentAuthor;
  // AI enhancement
  aiEnhancement?: AIEnhancement;
  useAIVersion: boolean; // Whether to show AI-enhanced version
  // Admin review
  review?: AdminReview;
  sendForReview: boolean; // Whether user wants admin to review
  // Metadata
  createdAt: string;
  updatedAt: string;
  // Optional fields
  parentId?: string; // For threaded replies
  isEdited: boolean;
  editHistory?: Array<{
    content: string;
    editedAt: string;
  }>;
}

/**
 * Input for creating a new comment
 */
export interface CreateCommentInput {
  content: string;
  pageId: string;
  pageTitle: string;
  pageUrl: string;
  category: CommentCategory;
  sendForReview: boolean;
  parentId?: string;
}

/**
 * Input for updating a comment
 */
export interface UpdateCommentInput {
  content?: string;
  category?: CommentCategory;
  sendForReview?: boolean;
  useAIVersion?: boolean;
}

/**
 * Input for admin review
 */
export interface ReviewCommentInput {
  status: CommentStatus;
  notes?: string;
}

/**
 * Comment filter options
 */
export interface CommentFilters {
  pageId?: string;
  category?: CommentCategory;
  status?: CommentStatus;
  authorId?: string;
  sendForReview?: boolean;
  limit?: number;
  orderBy?: "createdAt" | "updatedAt";
  orderDirection?: "asc" | "desc";
}

/**
 * Comment statistics for admin dashboard
 */
export interface CommentStats {
  total: number;
  byCategory: Record<CommentCategory, number>;
  byStatus: Record<CommentStatus, number>;
  pendingReview: number;
  recentCount: number; // Last 7 days
}

/**
 * Category display information
 */
export const COMMENT_CATEGORIES: Record<
  CommentCategory,
  { label: string; description: string; icon: string }
> = {
  comment: {
    label: "Comment",
    description: "General feedback or thoughts",
    icon: "chat",
  },
  change_request: {
    label: "Change Request",
    description: "Request to modify or update content",
    icon: "edit",
  },
  question: {
    label: "Question",
    description: "Ask about the content",
    icon: "help",
  },
  suggestion: {
    label: "Suggestion",
    description: "Propose an improvement",
    icon: "lightbulb",
  },
  bug_report: {
    label: "Bug Report",
    description: "Report an error or issue",
    icon: "bug",
  },
};

/**
 * Status display information
 */
export const COMMENT_STATUSES: Record<
  CommentStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "gray" },
  pending: { label: "Pending Review", color: "yellow" },
  approved: { label: "Approved", color: "green" },
  rejected: { label: "Rejected", color: "red" },
  implemented: { label: "Implemented", color: "blue" },
  resolved: { label: "Resolved", color: "purple" },
};
