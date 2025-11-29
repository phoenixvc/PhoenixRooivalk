/**
 * News Panel Component
 *
 * Main news interface showing general and personalized news.
 * Supports filtering, search, and saved articles.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { newsService, NewsError } from "../../services/newsService";
import { NewsCard } from "./NewsCard";
import { useDebounce } from "../../hooks/useDebounce";
import type {
  NewsArticle,
  PersonalizedNewsItem,
  NewsCategory,
} from "../../types/news";
import { NEWS_CATEGORY_CONFIG } from "../../types/news";
import "./NewsPanel.css";

type TabType = "feed" | "personalized" | "saved";

interface NewsPanelProps {
  showTabs?: boolean;
  defaultTab?: TabType;
  maxItems?: number;
}

export function NewsPanel({
  showTabs = true,
  defaultTab = "feed",
  maxItems = 20,
}: NewsPanelProps): React.ReactElement {
  const { user, userProfile: authUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [generalNews, setGeneralNews] = useState<NewsArticle[]>([]);
  const [specializedNews, setSpecializedNews] = useState<
    PersonalizedNewsItem[]
  >([]);
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>(
    [],
  );
  const debouncedSelectedCategories = useDebounce(selectedCategories, 300);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();

  // Get user profile for personalization
  // Use knownProfile from AuthContext which contains roles, interests, focusAreas
  const knownProfile = authUserProfile?.knownProfile;
  const userProfile = knownProfile
    ? {
        roles: authUserProfile.confirmedRoles || knownProfile.roles || [],
        interests: knownProfile.interests || [],
        focusAreas: knownProfile.focusAreas || [],
        experienceLevel: knownProfile.experienceLevel || "intermediate",
      }
    : undefined;

  // Fetch news feed
  const fetchNewsFeed = useCallback(
    async (loadMore = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await newsService.getNewsFeed({
          userProfile,
          limit: maxItems,
          cursor: loadMore ? cursor : undefined,
          categories:
            debouncedSelectedCategories.length > 0
              ? debouncedSelectedCategories
              : undefined,
        });

        if (loadMore) {
          setGeneralNews((prev) => [...prev, ...result.generalNews]);
          setSpecializedNews((prev) => [...prev, ...result.specializedNews]);
        } else {
          setGeneralNews(result.generalNews);
          setSpecializedNews(result.specializedNews);
        }

        setHasMore(result.hasMore);
        setCursor(result.nextCursor);
      } catch (err) {
        if (err instanceof NewsError) {
          setError(err.message);
        } else {
          setError("Failed to load news");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [userProfile, maxItems, cursor, debouncedSelectedCategories],
  );

  // Fetch saved articles
  const fetchSavedArticles = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await newsService.getSavedArticles();
      setSavedArticles(result.articles);
    } catch (err) {
      if (err instanceof NewsError) {
        setError(err.message);
      } else {
        setError("Failed to load saved articles");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Search news
  const handleSearch = useCallback(async () => {
    if (!debouncedSearchQuery.trim()) {
      fetchNewsFeed();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await newsService.searchNews({
        query: debouncedSearchQuery,
        categories:
          debouncedSelectedCategories.length > 0
            ? debouncedSelectedCategories
            : undefined,
        limit: maxItems,
      });

      setGeneralNews(result.results);
      setSpecializedNews([]);
      setHasMore(false);
    } catch (err) {
      if (err instanceof NewsError) {
        setError(err.message);
      } else {
        setError("Search failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearchQuery,
    debouncedSelectedCategories,
    maxItems,
    fetchNewsFeed,
  ]);

  // Initial load
  useEffect(() => {
    if (activeTab === "saved") {
      fetchSavedArticles();
    } else {
      fetchNewsFeed();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-search when debounced query or categories change
  useEffect(() => {
    if (activeTab !== "saved") {
      handleSearch();
    }
  }, [debouncedSearchQuery, debouncedSelectedCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle category filter change
  const toggleCategory = (category: NewsCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  // Handle article read
  const handleArticleRead = (articleId: string) => {
    setSpecializedNews((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isRead: true } : a)),
    );
  };

  // Handle article save/unsave
  const handleArticleSave = (articleId: string, saved: boolean) => {
    if (saved) {
      // Find the article and add to saved
      const article =
        generalNews.find((a) => a.id === articleId) ||
        specializedNews.find((a) => a.id === articleId);
      if (article) {
        setSavedArticles((prev) => [article, ...prev]);
      }
    } else {
      // Remove from saved
      setSavedArticles((prev) => prev.filter((a) => a.id !== articleId));
    }
  };

  const categories = Object.keys(NEWS_CATEGORY_CONFIG) as NewsCategory[];

  // Create a Set of saved article IDs for efficient lookup
  const savedArticleIds = useMemo(
    () => new Set(savedArticles.map((a) => a.id)),
    [savedArticles],
  );

  // Load saved articles on mount for logged-in users (for bookmark state)
  useEffect(() => {
    if (user && activeTab !== "saved") {
      // Silently fetch saved articles in background for bookmark state
      newsService
        .getSavedArticles()
        .then((result) => setSavedArticles(result.articles))
        .catch(() => {
          /* Silent fail - not critical */
        });
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="news-panel">
      <div className="news-panel-header">
        <h2 className="news-panel-title">
          <span className="news-panel-icon">📰</span>
          Industry News
        </h2>

        {showTabs && (
          <div className="news-panel-tabs">
            <button
              className={`news-tab ${activeTab === "feed" ? "active" : ""}`}
              onClick={() => setActiveTab("feed")}
            >
              All News
            </button>
            {user && (
              <>
                <button
                  className={`news-tab ${activeTab === "personalized" ? "active" : ""}`}
                  onClick={() => setActiveTab("personalized")}
                >
                  For You
                </button>
                <button
                  className={`news-tab ${activeTab === "saved" ? "active" : ""}`}
                  onClick={() => setActiveTab("saved")}
                >
                  Saved ({savedArticles.length})
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="news-panel-controls">
        <div className="news-search">
          <input
            type="text"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="news-search-input"
          />
          <button
            className="news-search-btn"
            onClick={handleSearch}
            disabled={isLoading}
          >
            🔍
          </button>
        </div>

        <div className="news-categories">
          {categories.map((category) => {
            const config = NEWS_CATEGORY_CONFIG[category];
            return (
              <button
                key={category}
                className={`news-category-btn ${selectedCategories.includes(category) ? "active" : ""}`}
                onClick={() => toggleCategory(category)}
                style={
                  selectedCategories.includes(category)
                    ? { backgroundColor: config.color, color: "white" }
                    : {}
                }
              >
                {config.icon} {config.label}
              </button>
            );
          })}
          {selectedCategories.length > 0 && (
            <button
              className="news-category-clear"
              onClick={() => setSelectedCategories([])}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && <div className="news-panel-error">{error}</div>}

      {isLoading &&
        generalNews.length === 0 &&
        specializedNews.length === 0 && (
          <div
            className="news-skeleton-grid"
            aria-label="Loading news..."
            role="status"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="news-skeleton-card">
                <div className="news-skeleton-image" />
                <div className="news-skeleton-title" />
                <div className="news-skeleton-summary">
                  <div className="news-skeleton-line" />
                  <div className="news-skeleton-line" />
                  <div className="news-skeleton-line" />
                </div>
                <div className="news-skeleton-meta">
                  <div className="news-skeleton-badge" />
                  <div className="news-skeleton-date" />
                </div>
              </div>
            ))}
          </div>
        )}

      <div className="news-panel-content">
        {activeTab === "feed" && (
          <>
            {/* Specialized news section */}
            {specializedNews.length > 0 && (
              <section className="news-section">
                <h3 className="news-section-title">
                  <span className="news-section-icon">✨</span>
                  Personalized for You
                </h3>
                <div className="news-grid">
                  {specializedNews.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      variant="compact"
                      initialSaved={savedArticleIds.has(article.id)}
                      onRead={handleArticleRead}
                      onSave={handleArticleSave}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* General news section */}
            {generalNews.length > 0 && (
              <section className="news-section">
                <h3 className="news-section-title">
                  <span className="news-section-icon">🌐</span>
                  General News
                </h3>
                <div className="news-grid">
                  {generalNews.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      variant="compact"
                      initialSaved={savedArticleIds.has(article.id)}
                      onSave={handleArticleSave}
                    />
                  ))}
                </div>
              </section>
            )}

            {generalNews.length === 0 &&
              specializedNews.length === 0 &&
              !isLoading && (
                <div className="news-empty">
                  <p>No news articles found.</p>
                  {selectedCategories.length > 0 && (
                    <button
                      className="news-empty-action"
                      onClick={() => setSelectedCategories([])}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
          </>
        )}

        {activeTab === "personalized" && (
          <section className="news-section">
            <h3 className="news-section-title">
              <span className="news-section-icon">✨</span>
              Curated for Your Role & Interests
            </h3>
            {!user ? (
              <div className="news-auth-prompt">
                <p>Sign in to see personalized news based on your profile.</p>
              </div>
            ) : specializedNews.length > 0 ? (
              <div className="news-list">
                {specializedNews.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    variant="full"
                    initialSaved={savedArticleIds.has(article.id)}
                    onRead={handleArticleRead}
                    onSave={handleArticleSave}
                  />
                ))}
              </div>
            ) : (
              <div className="news-empty">
                <p>No personalized news yet. Check back later!</p>
              </div>
            )}
          </section>
        )}

        {activeTab === "saved" && (
          <section className="news-section">
            <h3 className="news-section-title">
              <span className="news-section-icon">★</span>
              Saved Articles
            </h3>
            {!user ? (
              <div className="news-auth-prompt">
                <p>Sign in to save articles for later.</p>
              </div>
            ) : savedArticles.length > 0 ? (
              <div className="news-list">
                {savedArticles.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    variant="full"
                    initialSaved={true}
                    onSave={handleArticleSave}
                  />
                ))}
              </div>
            ) : (
              <div className="news-empty">
                <p>
                  No saved articles yet. Click the star on any article to save
                  it.
                </p>
              </div>
            )}
          </section>
        )}

        {hasMore && activeTab === "feed" && (
          <button
            className="news-load-more"
            onClick={() => fetchNewsFeed(true)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}

export default NewsPanel;
