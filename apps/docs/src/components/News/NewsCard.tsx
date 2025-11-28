/**
 * News Card Component
 *
 * Displays a single news article with personalization indicators.
 */

import React, { useState } from "react";
import type { NewsArticle, PersonalizedNewsItem } from "../../types/news";
import { NEWS_CATEGORY_CONFIG } from "../../types/news";
import { newsService } from "../../services/newsService";
import "./NewsCard.css";

interface NewsCardProps {
  article: NewsArticle | PersonalizedNewsItem;
  variant?: "compact" | "full";
  onRead?: (articleId: string) => void;
  onSave?: (articleId: string, saved: boolean) => void;
}

function isPersonalized(
  article: NewsArticle | PersonalizedNewsItem,
): article is PersonalizedNewsItem {
  return "relevance" in article;
}

export function NewsCard({
  article,
  variant = "compact",
  onRead,
  onSave,
}: NewsCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const categoryConfig = NEWS_CATEGORY_CONFIG[article.category];
  const personalized = isPersonalized(article);

  const handleClick = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      try {
        await newsService.markArticleRead(article.id);
        onRead?.(article.id);
      } catch (err) {
        console.error("Failed to mark article as read:", err);
      }
    } else {
      setIsExpanded(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      const result = await newsService.saveArticle(article.id, !isSaved);
      setIsSaved(result.saved);
      onSave?.(article.id, result.saved);
    } catch (err) {
      console.error("Failed to save article:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (variant === "compact") {
    return (
      <div
        className={`news-card-compact ${personalized && article.isRead ? "news-card-read" : ""}`}
        onClick={handleClick}
      >
        <div className="news-card-header">
          <span
            className="news-card-category"
            style={{ backgroundColor: categoryConfig?.color || "#6B7280" }}
          >
            {categoryConfig?.icon} {categoryConfig?.label || article.category}
          </span>
          <span className="news-card-type-badge">
            {article.type === "specialized" ? "For You" : "General"}
          </span>
        </div>

        <h4 className="news-card-title">{article.title}</h4>

        <p className="news-card-summary">
          {article.summary || article.content.substring(0, 150) + "..."}
        </p>

        {personalized && article.relevance && (
          <div className="news-card-relevance">
            <span className="news-card-score">
              {Math.round(article.relevance.score * 100)}% match
            </span>
            <span className="news-card-reason">{article.relevance.reason}</span>
          </div>
        )}

        <div className="news-card-footer">
          <span className="news-card-source">{article.source}</span>
          <span className="news-card-date">{formatDate(article.publishedAt)}</span>
          <button
            className={`news-card-save-btn ${isSaved ? "saved" : ""}`}
            onClick={handleSave}
            disabled={isSaving}
            title={isSaved ? "Remove from saved" : "Save for later"}
          >
            {isSaved ? "★" : "☆"}
          </button>
        </div>

        {isExpanded && (
          <div className="news-card-expanded">
            <div className="news-card-content">{article.content}</div>
            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="news-card-source-link"
                onClick={(e) => e.stopPropagation()}
              >
                Read original article →
              </a>
            )}
            <div className="news-card-keywords">
              {article.keywords?.map((keyword) => (
                <span key={keyword} className="news-card-keyword">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <article
      className={`news-card-full ${personalized && article.isRead ? "news-card-read" : ""}`}
    >
      <header className="news-card-full-header">
        <div className="news-card-meta">
          <span
            className="news-card-category"
            style={{ backgroundColor: categoryConfig?.color || "#6B7280" }}
          >
            {categoryConfig?.icon} {categoryConfig?.label || article.category}
          </span>
          <span className={`news-card-type-badge ${article.type}`}>
            {article.type === "specialized" ? "Personalized" : "General News"}
          </span>
          {article.sentiment && (
            <span className={`news-card-sentiment ${article.sentiment}`}>
              {article.sentiment === "positive" && "📈"}
              {article.sentiment === "neutral" && "➡️"}
              {article.sentiment === "negative" && "📉"}
            </span>
          )}
        </div>
        <button
          className={`news-card-save-btn-full ${isSaved ? "saved" : ""}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaved ? "★ Saved" : "☆ Save"}
        </button>
      </header>

      <h2 className="news-card-full-title">{article.title}</h2>

      <div className="news-card-full-meta">
        <span className="news-card-source">{article.source}</span>
        <span className="news-card-separator">•</span>
        <span className="news-card-date">{formatDate(article.publishedAt)}</span>
        <span className="news-card-separator">•</span>
        <span className="news-card-views">{article.viewCount} views</span>
      </div>

      {personalized && article.relevance && (
        <div className="news-card-relevance-full">
          <div className="news-card-relevance-score">
            <span className="score-value">
              {Math.round(article.relevance.score * 100)}%
            </span>
            <span className="score-label">relevance</span>
          </div>
          <p className="news-card-relevance-reason">{article.relevance.reason}</p>
          {article.relevance.matchedInterests.length > 0 && (
            <div className="news-card-matched">
              <strong>Matched interests:</strong>{" "}
              {article.relevance.matchedInterests.join(", ")}
            </div>
          )}
        </div>
      )}

      <div className="news-card-full-content">
        {article.summary && (
          <p className="news-card-summary-full">{article.summary}</p>
        )}
        <div className="news-card-body">{article.content}</div>
      </div>

      <footer className="news-card-full-footer">
        <div className="news-card-keywords">
          {article.keywords?.map((keyword) => (
            <span key={keyword} className="news-card-keyword">
              {keyword}
            </span>
          ))}
        </div>
        {article.sourceUrl && (
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card-source-link-full"
          >
            Read original article →
          </a>
        )}
      </footer>
    </article>
  );
}

export default NewsCard;
