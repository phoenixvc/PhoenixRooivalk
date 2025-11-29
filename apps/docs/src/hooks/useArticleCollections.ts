/**
 * Article Collections Hook
 *
 * Manages article collections/folders for organizing saved articles.
 * Features:
 * - Create, rename, delete collections
 * - Add/remove articles from collections
 * - Move articles between collections
 * - Share collections with other users
 * - AI-powered article suggestions for collections (Wave 1)
 * - AI-curated collection name suggestions (Wave 4)
 */

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  ArticleCollection,
  COLLECTION_COLORS,
  COLLECTION_ICONS,
} from "../types/news";
import { aiService, ReadingRecommendation } from "../services/aiService";

const STORAGE_KEY = "phoenix-article-collections";

/**
 * AI-powered article suggestion for collections
 */
export interface ArticleSuggestion {
  docId: string;
  reason: string;
  relevanceScore: number;
}

/**
 * AI-generated collection name suggestion
 */
export interface CollectionNameSuggestion {
  name: string;
  confidence: number;
  alternatives?: string[];
}

interface UseArticleCollectionsReturn {
  collections: ArticleCollection[];
  isLoading: boolean;
  createCollection: (
    name: string,
    options?: Partial<ArticleCollection>,
  ) => ArticleCollection | null;
  renameCollection: (id: string, name: string) => boolean;
  deleteCollection: (id: string) => boolean;
  addArticleToCollection: (collectionId: string, articleId: string) => boolean;
  removeArticleFromCollection: (
    collectionId: string,
    articleId: string,
  ) => boolean;
  moveArticle: (
    articleId: string,
    fromCollectionId: string,
    toCollectionId: string,
  ) => boolean;
  getCollectionForArticle: (articleId: string) => ArticleCollection | undefined;
  getArticleCollections: (articleId: string) => ArticleCollection[];
  updateCollectionColor: (id: string, color: string) => boolean;
  updateCollectionIcon: (id: string, icon: string) => boolean;
  shareCollection: (id: string, userIds: string[]) => boolean;
  unshareCollection: (id: string) => boolean;
  // AI-powered features (Wave 1 & 4)
  suggestArticlesForCollection: (
    collectionId: string,
    limit?: number,
  ) => Promise<ArticleSuggestion[]>;
  suggestCollectionName: (
    articleIds: string[],
  ) => Promise<CollectionNameSuggestion>;
}

/**
 * Generate unique collection ID
 */
function generateId(): string {
  return `col_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get collections from localStorage
 */
function getStoredCollections(): ArticleCollection[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save collections to localStorage
 */
function saveCollections(collections: ArticleCollection[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  } catch (error) {
    console.warn("Failed to save collections:", error);
  }
}

/**
 * Article Collections Hook
 */
export function useArticleCollections(): UseArticleCollectionsReturn {
  const { user } = useAuth();
  const [collections, setCollections] = useState<ArticleCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load collections on mount
  useEffect(() => {
    const stored = getStoredCollections();

    // Create default collection if none exist
    if (stored.length === 0) {
      const defaultCollection: ArticleCollection = {
        id: generateId(),
        name: "My Saved Articles",
        description: "Default collection for saved articles",
        color: COLLECTION_COLORS[0],
        icon: "bookmark",
        articleIds: [],
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCollections([defaultCollection]);
      saveCollections([defaultCollection]);
    } else {
      setCollections(stored);
    }

    setIsLoading(false);
  }, []);

  // Save collections whenever they change
  useEffect(() => {
    if (!isLoading && collections.length > 0) {
      saveCollections(collections);
    }
  }, [collections, isLoading]);

  // Create a new collection
  const createCollection = useCallback(
    (
      name: string,
      options?: Partial<ArticleCollection>,
    ): ArticleCollection | null => {
      if (!name.trim()) return null;

      const newCollection: ArticleCollection = {
        id: generateId(),
        name: name.trim(),
        description: options?.description,
        color: options?.color || COLLECTION_COLORS[collections.length % COLLECTION_COLORS.length],
        icon: options?.icon || "folder",
        articleIds: options?.articleIds || [],
        isDefault: false,
        isShared: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCollections((prev) => [...prev, newCollection]);
      return newCollection;
    },
    [collections.length],
  );

  // Rename a collection
  const renameCollection = useCallback(
    (id: string, name: string): boolean => {
      if (!name.trim()) return false;

      setCollections((prev) =>
        prev.map((col) =>
          col.id === id
            ? { ...col, name: name.trim(), updatedAt: new Date().toISOString() }
            : col,
        ),
      );
      return true;
    },
    [],
  );

  // Delete a collection
  const deleteCollection = useCallback((id: string): boolean => {
    setCollections((prev) => {
      const collection = prev.find((c) => c.id === id);
      // Don't delete default collection
      if (collection?.isDefault) return prev;
      return prev.filter((c) => c.id !== id);
    });
    return true;
  }, []);

  // Add article to collection
  const addArticleToCollection = useCallback(
    (collectionId: string, articleId: string): boolean => {
      setCollections((prev) =>
        prev.map((col) => {
          if (col.id !== collectionId) return col;
          if (col.articleIds.includes(articleId)) return col;
          return {
            ...col,
            articleIds: [...col.articleIds, articleId],
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      return true;
    },
    [],
  );

  // Remove article from collection
  const removeArticleFromCollection = useCallback(
    (collectionId: string, articleId: string): boolean => {
      setCollections((prev) =>
        prev.map((col) => {
          if (col.id !== collectionId) return col;
          return {
            ...col,
            articleIds: col.articleIds.filter((id) => id !== articleId),
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      return true;
    },
    [],
  );

  // Move article between collections
  const moveArticle = useCallback(
    (
      articleId: string,
      fromCollectionId: string,
      toCollectionId: string,
    ): boolean => {
      setCollections((prev) =>
        prev.map((col) => {
          const now = new Date().toISOString();
          if (col.id === fromCollectionId) {
            return {
              ...col,
              articleIds: col.articleIds.filter((id) => id !== articleId),
              updatedAt: now,
            };
          }
          if (col.id === toCollectionId) {
            if (col.articleIds.includes(articleId)) return col;
            return {
              ...col,
              articleIds: [...col.articleIds, articleId],
              updatedAt: now,
            };
          }
          return col;
        }),
      );
      return true;
    },
    [],
  );

  // Get the first collection containing an article
  const getCollectionForArticle = useCallback(
    (articleId: string): ArticleCollection | undefined => {
      return collections.find((col) => col.articleIds.includes(articleId));
    },
    [collections],
  );

  // Get all collections containing an article
  const getArticleCollections = useCallback(
    (articleId: string): ArticleCollection[] => {
      return collections.filter((col) => col.articleIds.includes(articleId));
    },
    [collections],
  );

  // Update collection color
  const updateCollectionColor = useCallback(
    (id: string, color: string): boolean => {
      setCollections((prev) =>
        prev.map((col) =>
          col.id === id
            ? { ...col, color, updatedAt: new Date().toISOString() }
            : col,
        ),
      );
      return true;
    },
    [],
  );

  // Update collection icon
  const updateCollectionIcon = useCallback(
    (id: string, icon: string): boolean => {
      setCollections((prev) =>
        prev.map((col) =>
          col.id === id
            ? { ...col, icon, updatedAt: new Date().toISOString() }
            : col,
        ),
      );
      return true;
    },
    [],
  );

  // Share collection with users
  const shareCollection = useCallback(
    (id: string, userIds: string[]): boolean => {
      setCollections((prev) =>
        prev.map((col) =>
          col.id === id
            ? {
                ...col,
                isShared: true,
                sharedWith: userIds,
                updatedAt: new Date().toISOString(),
              }
            : col,
        ),
      );
      return true;
    },
    [],
  );

  // Unshare collection
  const unshareCollection = useCallback((id: string): boolean => {
    setCollections((prev) =>
      prev.map((col) =>
        col.id === id
          ? {
              ...col,
              isShared: false,
              sharedWith: undefined,
              updatedAt: new Date().toISOString(),
            }
          : col,
      ),
    );
    return true;
  }, []);

  /**
   * AI-powered: Suggest articles for a collection based on its contents
   * Uses semantic search to find related articles
   */
  const suggestArticlesForCollection = useCallback(
    async (
      collectionId: string,
      limit: number = 5,
    ): Promise<ArticleSuggestion[]> => {
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection || collection.articleIds.length === 0) {
        return [];
      }

      try {
        // Get recommendations based on the first article in the collection
        const primaryArticle = collection.articleIds[0];
        const result = await aiService.getReadingRecommendations(primaryArticle);

        if (!result.recommendations) {
          return [];
        }

        // Filter out articles already in any collection and transform to suggestions
        const allCollectionArticles = new Set(
          collections.flatMap((c) => c.articleIds),
        );

        const suggestions: ArticleSuggestion[] = result.recommendations
          .filter((rec) => !allCollectionArticles.has(rec.docId))
          .slice(0, limit)
          .map((rec) => ({
            docId: rec.docId,
            reason: rec.reason || `Related to "${collection.name}"`,
            relevanceScore: rec.relevanceScore,
          }));

        return suggestions;
      } catch (error) {
        console.warn("Failed to get AI suggestions for collection:", error);
        return [];
      }
    },
    [collections],
  );

  /**
   * AI-powered: Suggest a collection name based on its articles
   * Uses AI to analyze article topics and generate a descriptive name
   */
  const suggestCollectionName = useCallback(
    async (articleIds: string[]): Promise<CollectionNameSuggestion> => {
      if (articleIds.length === 0) {
        return { name: "New Collection", confidence: 0 };
      }

      try {
        // Use AI to analyze the articles and suggest a name
        const context = `Articles: ${articleIds.slice(0, 5).join(", ")}`;
        const result = await aiService.askDocumentation(
          `Based on these article IDs, suggest a short (2-4 words) descriptive collection name: ${context}`,
          { format: "concise" },
        );

        // Extract the suggested name from the AI response
        const suggestedName = result.answer
          .replace(/["']/g, "")
          .trim()
          .split("\n")[0]
          .substring(0, 50);

        return {
          name: suggestedName || "My Collection",
          confidence: result.confidence === "high" ? 0.9 : result.confidence === "medium" ? 0.7 : 0.5,
          alternatives: [],
        };
      } catch (error) {
        console.warn("Failed to get AI collection name suggestion:", error);
        return { name: "New Collection", confidence: 0 };
      }
    },
    [],
  );

  return {
    collections,
    isLoading,
    createCollection,
    renameCollection,
    deleteCollection,
    addArticleToCollection,
    removeArticleFromCollection,
    moveArticle,
    getCollectionForArticle,
    getArticleCollections,
    updateCollectionColor,
    updateCollectionIcon,
    shareCollection,
    unshareCollection,
    // AI-powered features
    suggestArticlesForCollection,
    suggestCollectionName,
  };
}

export default useArticleCollections;
