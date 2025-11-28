/**
 * News Types and Interfaces
 *
 * Defines types for the news system with RAG-based retrieval
 * and user profile-based personalization.
 */

/**
 * News category based on content type
 */
export type NewsCategory =
  | "counter-uas"
  | "defense-tech"
  | "drone-industry"
  | "regulatory"
  | "market-analysis"
  | "product-updates"
  | "company-news"
  | "research"
  | "partnerships";

/**
 * News classification - general vs specialized
 */
export type NewsType = "general" | "specialized";

/**
 * News relevance based on user profile matching
 */
export interface NewsRelevance {
  score: number; // 0-1 relevance score
  matchedRoles: string[];
  matchedInterests: string[];
  matchedFocusAreas: string[];
  reason: string;
}

/**
 * News article from RAG retrieval
 */
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  type: NewsType;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  // Targeting metadata
  targetRoles: string[];
  targetInterests: string[];
  targetFocusAreas: string[];
  // Engagement
  viewCount: number;
  // AI-generated metadata
  aiSummary?: string;
  keywords: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

/**
 * Personalized news item with relevance scoring
 */
export interface PersonalizedNewsItem extends NewsArticle {
  relevance: NewsRelevance;
  isRead: boolean;
  savedAt?: string;
}

/**
 * User news preferences stored in Firestore
 */
export interface UserNewsPreferences {
  userId: string;
  // Categories the user wants to see
  preferredCategories: NewsCategory[];
  // Categories the user wants to hide
  hiddenCategories: NewsCategory[];
  // Specific keywords to follow
  followedKeywords: string[];
  // Keywords to exclude
  excludedKeywords: string[];
  // Notification settings
  emailDigest: "none" | "daily" | "weekly";
  pushNotifications: boolean;
  // Reading history
  readArticleIds: string[];
  savedArticleIds: string[];
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * News feed response from Cloud Function
 */
export interface NewsFeedResponse {
  generalNews: NewsArticle[];
  specializedNews: PersonalizedNewsItem[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * News search parameters
 */
export interface NewsSearchParams {
  query?: string;
  categories?: NewsCategory[];
  type?: NewsType;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  cursor?: string;
}

/**
 * News retrieval options for RAG
 */
export interface NewsRetrievalOptions {
  // User context for personalization
  userRoles?: string[];
  userInterests?: string[];
  userFocusAreas?: string[];
  userExperienceLevel?: "beginner" | "intermediate" | "advanced";
  // Retrieval parameters
  topK?: number;
  minRelevanceScore?: number;
  includeGeneral?: boolean;
  includeSpecialized?: boolean;
}

/**
 * RAG news source for indexing
 */
export interface NewsSource {
  id: string;
  name: string;
  url: string;
  feedUrl?: string;
  category: NewsCategory;
  trustScore: number; // 0-1 reliability score
  isActive: boolean;
  lastFetchedAt?: string;
}

/**
 * News analytics for tracking engagement
 */
export interface NewsAnalytics {
  articleId: string;
  userId?: string;
  action: "view" | "click" | "save" | "share" | "dismiss";
  timestamp: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Default news preferences
 */
export const DEFAULT_NEWS_PREFERENCES: Omit<
  UserNewsPreferences,
  "userId" | "createdAt" | "updatedAt"
> = {
  preferredCategories: [],
  hiddenCategories: [],
  followedKeywords: [],
  excludedKeywords: [],
  emailDigest: "none",
  pushNotifications: false,
  readArticleIds: [],
  savedArticleIds: [],
};

/**
 * News category display configuration
 */
export const NEWS_CATEGORY_CONFIG: Record<
  NewsCategory,
  { label: string; icon: string; color: string }
> = {
  "counter-uas": {
    label: "Counter-UAS",
    icon: "🛡️",
    color: "#4A90D9",
  },
  "defense-tech": {
    label: "Defense Technology",
    icon: "🔧",
    color: "#6B7280",
  },
  "drone-industry": {
    label: "Drone Industry",
    icon: "🚁",
    color: "#10B981",
  },
  regulatory: {
    label: "Regulatory",
    icon: "📋",
    color: "#F59E0B",
  },
  "market-analysis": {
    label: "Market Analysis",
    icon: "📊",
    color: "#8B5CF6",
  },
  "product-updates": {
    label: "Product Updates",
    icon: "🚀",
    color: "#EC4899",
  },
  "company-news": {
    label: "Company News",
    icon: "🏢",
    color: "#14B8A6",
  },
  research: {
    label: "Research",
    icon: "🔬",
    color: "#6366F1",
  },
  partnerships: {
    label: "Partnerships",
    icon: "🤝",
    color: "#F97316",
  },
};
