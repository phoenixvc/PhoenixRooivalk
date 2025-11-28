/**
 * News Cloud Functions
 *
 * Provides news retrieval, personalization, and management functions
 * using RAG-based retrieval and user profile matching.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { chatCompletion, generateEmbedding } from "../ai-provider";
import {
  NEWS_PERSONALIZATION_PROMPT,
  NEWS_CATEGORIZATION_PROMPT,
} from "../prompts/templates";

// Types
interface NewsCategory {
  type:
    | "counter-uas"
    | "defense-tech"
    | "drone-industry"
    | "regulatory"
    | "market-analysis"
    | "product-updates"
    | "company-news"
    | "research"
    | "partnerships";
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory["type"];
  type: "general" | "specialized";
  source: string;
  sourceUrl?: string;
  publishedAt: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  targetRoles: string[];
  targetInterests: string[];
  targetFocusAreas: string[];
  viewCount: number;
  keywords: string[];
  sentiment?: "positive" | "neutral" | "negative";
  embedding?: number[];
}

interface UserProfile {
  roles: string[];
  interests: string[];
  focusAreas: string[];
  experienceLevel: "beginner" | "intermediate" | "advanced";
}

interface NewsRelevance {
  score: number;
  matchedRoles: string[];
  matchedInterests: string[];
  matchedFocusAreas: string[];
  reason: string;
}

interface PersonalizedNewsItem extends NewsArticle {
  relevance: NewsRelevance;
  isRead: boolean;
}

const db = admin.firestore();

// Collection names
const COLLECTIONS = {
  NEWS: "news_articles",
  USER_NEWS_PREFS: "user_news_preferences",
  NEWS_ANALYTICS: "news_analytics",
};

/**
 * Calculate relevance score between article and user profile
 */
function calculateRelevanceScore(
  article: NewsArticle,
  userProfile: UserProfile,
): NewsRelevance {
  const matchedRoles = article.targetRoles.filter((role) =>
    userProfile.roles.some(
      (r) =>
        r.toLowerCase().includes(role.toLowerCase()) ||
        role.toLowerCase().includes(r.toLowerCase()),
    ),
  );

  const matchedInterests = article.targetInterests.filter((interest) =>
    userProfile.interests.some(
      (i) =>
        i.toLowerCase() === interest.toLowerCase() ||
        i.toLowerCase().includes(interest.toLowerCase()),
    ),
  );

  const matchedFocusAreas = article.targetFocusAreas.filter((area) =>
    userProfile.focusAreas.some(
      (f) =>
        f.toLowerCase() === area.toLowerCase() ||
        f.toLowerCase().includes(area.toLowerCase()),
    ),
  );

  // Calculate weighted score
  const roleScore = matchedRoles.length > 0 ? 0.4 : 0;
  const interestScore =
    (matchedInterests.length / Math.max(article.targetInterests.length, 1)) *
    0.4;
  const focusScore =
    (matchedFocusAreas.length / Math.max(article.targetFocusAreas.length, 1)) *
    0.2;

  const score = Math.min(roleScore + interestScore + focusScore, 1);

  // Generate reason
  const reasons: string[] = [];
  if (matchedRoles.length > 0) {
    reasons.push(`matches your ${matchedRoles.join(", ")} role`);
  }
  if (matchedInterests.length > 0) {
    reasons.push(`aligns with your interest in ${matchedInterests.join(", ")}`);
  }
  if (matchedFocusAreas.length > 0) {
    reasons.push(`relevant to your ${matchedFocusAreas.join(", ")} focus`);
  }

  return {
    score,
    matchedRoles,
    matchedInterests,
    matchedFocusAreas,
    reason:
      reasons.length > 0
        ? `This article ${reasons.join(" and ")}.`
        : "General industry news.",
  };
}

/**
 * Get user's news preferences
 */
async function getUserNewsPreferences(
  userId: string,
): Promise<{ readArticleIds: string[] }> {
  try {
    const doc = await db.collection(COLLECTIONS.USER_NEWS_PREFS).doc(userId).get();
    if (doc.exists) {
      return doc.data() as { readArticleIds: string[] };
    }
  } catch (error) {
    functions.logger.error("Error getting user news preferences:", error);
  }
  return { readArticleIds: [] };
}

/**
 * Get news feed - combines general and personalized news
 */
export const getNewsFeed = functions.https.onCall(
  async (
    data: {
      userProfile?: UserProfile;
      limit?: number;
      cursor?: string;
      categories?: NewsCategory["type"][];
    },
    context,
  ) => {
    const userId = context.auth?.uid;
    const limit = data.limit || 20;

    // Validate categories - Firestore "in" operator supports max 10 values
    if (data.categories && data.categories.length > 10) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Cannot filter by more than 10 categories at once",
      );
    }

    try {
      // Build base query
      let query = db
        .collection(COLLECTIONS.NEWS)
        .orderBy("publishedAt", "desc")
        .limit(limit * 2); // Fetch more for filtering

      // Apply category filter if specified
      if (data.categories && data.categories.length > 0) {
        query = query.where("category", "in", data.categories);
      }

      // Apply cursor for pagination
      if (data.cursor) {
        const cursorDoc = await db
          .collection(COLLECTIONS.NEWS)
          .doc(data.cursor)
          .get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      const snapshot = await query.get();
      const articles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsArticle[];

      // Get user preferences if authenticated
      let readArticleIds: string[] = [];
      if (userId) {
        const prefs = await getUserNewsPreferences(userId);
        readArticleIds = prefs.readArticleIds || [];
      }

      // Separate general and specialized news
      const generalNews: NewsArticle[] = [];
      const specializedNews: PersonalizedNewsItem[] = [];

      for (const article of articles) {
        if (article.type === "general" || !data.userProfile) {
          generalNews.push(article);
        } else {
          // Calculate personalization
          const relevance = calculateRelevanceScore(article, data.userProfile);

          if (relevance.score >= 0.3) {
            specializedNews.push({
              ...article,
              relevance,
              isRead: readArticleIds.includes(article.id),
            });
          } else {
            generalNews.push(article);
          }
        }
      }

      // Sort specialized news by relevance
      specializedNews.sort((a, b) => b.relevance.score - a.relevance.score);

      // Limit results
      const finalGeneral = generalNews.slice(0, Math.ceil(limit / 2));
      const finalSpecialized = specializedNews.slice(
        0,
        Math.floor(limit / 2),
      );

      return {
        generalNews: finalGeneral,
        specializedNews: finalSpecialized,
        totalCount: articles.length,
        hasMore: articles.length >= limit * 2,
        nextCursor:
          articles.length > 0 ? articles[articles.length - 1].id : undefined,
      };
    } catch (error) {
      functions.logger.error("Error fetching news feed:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to fetch news feed",
      );
    }
  },
);

/**
 * Get personalized news using AI-based matching
 */
export const getPersonalizedNews = functions.https.onCall(
  async (
    data: {
      userProfile: UserProfile;
      limit?: number;
    },
    context,
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in to get personalized news",
      );
    }

    const { limit = 10 } = data;

    // Normalize user profile with defaults for empty/undefined values
    const userProfile: UserProfile = {
      roles: data.userProfile?.roles?.filter(Boolean) || [],
      interests: data.userProfile?.interests?.filter(Boolean) || [],
      focusAreas: data.userProfile?.focusAreas?.filter(Boolean) || [],
      experienceLevel: data.userProfile?.experienceLevel || "intermediate",
    };

    // If user has no profile data, return empty (they'll see general news instead)
    if (
      userProfile.roles.length === 0 &&
      userProfile.interests.length === 0 &&
      userProfile.focusAreas.length === 0
    ) {
      return {
        articles: [],
        totalMatched: 0,
        message: "Complete your profile to see personalized news recommendations.",
      };
    }

    try {
      // Get recent articles
      const snapshot = await db
        .collection(COLLECTIONS.NEWS)
        .where("type", "==", "specialized")
        .orderBy("publishedAt", "desc")
        .limit(50)
        .get();

      const articles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsArticle[];

      // Use AI to match articles to user profile
      const personalizedArticles: PersonalizedNewsItem[] = [];

      for (const article of articles) {
        // First try rule-based matching for efficiency
        const ruleBasedRelevance = calculateRelevanceScore(article, userProfile);

        if (ruleBasedRelevance.score >= 0.5) {
          personalizedArticles.push({
            ...article,
            relevance: ruleBasedRelevance,
            isRead: false,
          });
        } else if (ruleBasedRelevance.score >= 0.2) {
          // Use AI for borderline cases
          try {
            const prompt = NEWS_PERSONALIZATION_PROMPT.user.template
              .replace("{{articleTitle}}", article.title)
              .replace("{{articleSummary}}", article.summary)
              .replace("{{articleCategory}}", article.category)
              .replace("{{articleKeywords}}", article.keywords.join(", "))
              .replace("{{articleTargetRoles}}", article.targetRoles.join(", "))
              .replace(
                "{{articleTargetInterests}}",
                article.targetInterests.join(", "),
              )
              .replace("{{userRoles}}", userProfile.roles.join(", "))
              .replace("{{userInterests}}", userProfile.interests.join(", "))
              .replace("{{userFocusAreas}}", userProfile.focusAreas.join(", "))
              .replace("{{userExperienceLevel}}", userProfile.experienceLevel);

            const { content } = await chatCompletion(
              [
                { role: "system", content: NEWS_PERSONALIZATION_PROMPT.system.base },
                { role: "user", content: prompt },
              ],
              { model: "chatFast", maxTokens: 300, temperature: 0.2 },
            );

            const aiRelevance = JSON.parse(content) as NewsRelevance & {
              isSpecialized: boolean;
            };

            if (aiRelevance.score >= 0.4) {
              personalizedArticles.push({
                ...article,
                relevance: aiRelevance,
                isRead: false,
              });
            }
          } catch {
            // Fallback to rule-based if AI fails
            if (ruleBasedRelevance.score >= 0.3) {
              personalizedArticles.push({
                ...article,
                relevance: ruleBasedRelevance,
                isRead: false,
              });
            }
          }
        }

        // Stop if we have enough articles
        if (personalizedArticles.length >= limit) break;
      }

      // Sort by relevance score
      personalizedArticles.sort((a, b) => b.relevance.score - a.relevance.score);

      return {
        articles: personalizedArticles.slice(0, limit),
        totalMatched: personalizedArticles.length,
      };
    } catch (error) {
      functions.logger.error("Error getting personalized news:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get personalized news",
      );
    }
  },
);

/**
 * Add a new news article (admin only)
 */
export const addNewsArticle = functions.https.onCall(
  async (
    data: {
      title: string;
      content: string;
      source: string;
      sourceUrl?: string;
      category?: NewsCategory["type"];
    },
    context,
  ) => {
    // Check admin status
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can add news articles",
      );
    }

    const { title, content, source, sourceUrl } = data;

    try {
      // Use AI to categorize and extract metadata
      const categorizationPrompt = NEWS_CATEGORIZATION_PROMPT.user.template
        .replace("{{title}}", title)
        .replace("{{content}}", content.substring(0, 2000));

      const { content: categorizationResult } = await chatCompletion(
        [
          { role: "system", content: NEWS_CATEGORIZATION_PROMPT.system.base },
          { role: "user", content: categorizationPrompt },
        ],
        { model: "chatFast", maxTokens: 500, temperature: 0.1 },
      );

      const categorization = JSON.parse(categorizationResult) as {
        category: NewsCategory["type"];
        targetRoles: string[];
        targetInterests: string[];
        keywords: string[];
        isGeneral: boolean;
        sentiment: "positive" | "neutral" | "negative";
      };

      // Generate embedding for semantic search
      const { embeddings } = await generateEmbedding(
        `${title}. ${content.substring(0, 1000)}`,
      );

      // Generate summary
      const { content: summary } = await chatCompletion(
        [
          {
            role: "system",
            content: "Summarize the following news article in 2-3 sentences.",
          },
          { role: "user", content: `${title}\n\n${content}` },
        ],
        { model: "chatFast", maxTokens: 200, temperature: 0.3 },
      );

      const now = admin.firestore.Timestamp.now();

      const article: Omit<NewsArticle, "id"> = {
        title,
        summary,
        content,
        category: data.category || categorization.category,
        type: categorization.isGeneral ? "general" : "specialized",
        source,
        sourceUrl,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        targetRoles: categorization.targetRoles,
        targetInterests: categorization.targetInterests,
        targetFocusAreas: [],
        viewCount: 0,
        keywords: categorization.keywords,
        sentiment: categorization.sentiment,
        embedding: embeddings[0],
      };

      const docRef = await db.collection(COLLECTIONS.NEWS).add(article);

      functions.logger.info(`Added news article: ${docRef.id}`);

      return {
        success: true,
        articleId: docRef.id,
        category: article.category,
        type: article.type,
      };
    } catch (error) {
      functions.logger.error("Error adding news article:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to add news article",
      );
    }
  },
);

/**
 * Mark article as read
 */
export const markArticleRead = functions.https.onCall(
  async (data: { articleId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in",
      );
    }

    const userId = context.auth.uid;
    const { articleId } = data;

    try {
      const prefsRef = db.collection(COLLECTIONS.USER_NEWS_PREFS).doc(userId);

      await db.runTransaction(async (transaction) => {
        const prefsDoc = await transaction.get(prefsRef);

        if (prefsDoc.exists) {
          const prefs = prefsDoc.data()!;
          const readIds = prefs.readArticleIds || [];

          if (!readIds.includes(articleId)) {
            transaction.update(prefsRef, {
              readArticleIds: admin.firestore.FieldValue.arrayUnion(articleId),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        } else {
          transaction.set(prefsRef, {
            userId,
            readArticleIds: [articleId],
            savedArticleIds: [],
            preferredCategories: [],
            hiddenCategories: [],
            followedKeywords: [],
            excludedKeywords: [],
            emailDigest: "none",
            pushNotifications: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Increment view count
        const articleRef = db.collection(COLLECTIONS.NEWS).doc(articleId);
        transaction.update(articleRef, {
          viewCount: admin.firestore.FieldValue.increment(1),
        });
      });

      // Track analytics
      await db.collection(COLLECTIONS.NEWS_ANALYTICS).add({
        articleId,
        userId,
        action: "view",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      functions.logger.error("Error marking article as read:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to mark article as read",
      );
    }
  },
);

/**
 * Save article for later
 */
export const saveArticle = functions.https.onCall(
  async (data: { articleId: string; save: boolean }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in",
      );
    }

    const userId = context.auth.uid;
    const { articleId, save } = data;

    try {
      const prefsRef = db.collection(COLLECTIONS.USER_NEWS_PREFS).doc(userId);

      await prefsRef.set(
        {
          savedArticleIds: save
            ? admin.firestore.FieldValue.arrayUnion(articleId)
            : admin.firestore.FieldValue.arrayRemove(articleId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // Track analytics
      await db.collection(COLLECTIONS.NEWS_ANALYTICS).add({
        articleId,
        userId,
        action: save ? "save" : "unsave",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, saved: save };
    } catch (error) {
      functions.logger.error("Error saving article:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to save article",
      );
    }
  },
);

/**
 * Get saved articles
 */
export const getSavedArticles = functions.https.onCall(
  async (_data: Record<string, never>, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in",
      );
    }

    const userId = context.auth.uid;

    try {
      const prefsDoc = await db
        .collection(COLLECTIONS.USER_NEWS_PREFS)
        .doc(userId)
        .get();

      if (!prefsDoc.exists) {
        return { articles: [] };
      }

      const prefs = prefsDoc.data()!;
      const savedIds = prefs.savedArticleIds || [];

      if (savedIds.length === 0) {
        return { articles: [] };
      }

      // Fetch saved articles
      const articles: NewsArticle[] = [];
      for (const id of savedIds.slice(0, 50)) {
        const doc = await db.collection(COLLECTIONS.NEWS).doc(id).get();
        if (doc.exists) {
          articles.push({ id: doc.id, ...doc.data() } as NewsArticle);
        }
      }

      return { articles };
    } catch (error) {
      functions.logger.error("Error getting saved articles:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get saved articles",
      );
    }
  },
);

/**
 * Search news using semantic search
 */
export const searchNews = functions.https.onCall(
  async (
    data: {
      query: string;
      categories?: NewsCategory["type"][];
      limit?: number;
    },
    _context,
  ) => {
    const { query, categories, limit = 20 } = data;

    try {
      // Generate embedding for query
      const { embeddings } = await generateEmbedding(query);
      const queryEmbedding = embeddings[0];

      // Fetch articles (would use vector search in production)
      let articlesQuery = db
        .collection(COLLECTIONS.NEWS)
        .orderBy("publishedAt", "desc")
        .limit(100);

      if (categories && categories.length > 0) {
        articlesQuery = articlesQuery.where("category", "in", categories);
      }

      const snapshot = await articlesQuery.get();
      const articles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsArticle[];

      // Calculate similarity scores
      const scoredArticles = articles
        .filter((a) => a.embedding)
        .map((article) => {
          const similarity = cosineSimilarity(queryEmbedding, article.embedding!);
          return { ...article, similarity };
        })
        .filter((a) => a.similarity > 0.5)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return {
        results: scoredArticles.map(({ embedding, ...rest }) => rest),
        totalFound: scoredArticles.length,
      };
    } catch (error) {
      functions.logger.error("Error searching news:", error);
      throw new functions.https.HttpsError("internal", "Failed to search news");
    }
  },
);

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// Export ingestion functions
export {
  fetchNewsFromWeb,
  triggerNewsIngestion,
  generateAINewsDigest,
  importNewsArticles,
} from "./ingestion";

// Export analytics functions
export { getNewsAnalytics, getNewsIngestionStats } from "./analytics";

// Export notification functions
export {
  subscribeToBreakingNews,
  unsubscribeFromBreakingNews,
  getNotificationSubscription,
  onBreakingNewsCreated,
  processEmailQueue,
  markAsBreakingNews,
} from "./notifications";

// Export config
export { NEWS_TOPICS, NEWS_SOURCES, ROLE_INTERESTS_MAP } from "./config";
