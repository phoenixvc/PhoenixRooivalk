/**
 * News Admin Panel
 *
 * Admin interface for managing news ingestion, viewing analytics,
 * and configuring news settings.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { newsService, NewsError } from "../../services/newsService";
import "./NewsAdminPanel.css";

// Admin email domains (same as in analytics.tsx and CommentSection.tsx)
const ADMIN_EMAIL_DOMAINS = ["phoenixrooivalk.com", "justaghost.dev"];

interface IngestionStats {
  totalArticles: number;
  lastIngestionTime: Date | null;
  articlesByCategory: Record<string, number>;
  articlesLast24h: number;
  articlesLast7d: number;
}

interface IngestionResult {
  success: boolean;
  articlesAdded: number;
  errors: string[];
}

export function NewsAdminPanel(): React.ReactElement | null {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "ingestion" | "analytics" | "settings"
  >("ingestion");
  const [stats, setStats] = useState<IngestionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Check admin status by email domain
  const isAdmin = Boolean(
    user?.email &&
    ADMIN_EMAIL_DOMAINS.some((domain) => user.email?.endsWith(`@${domain}`)),
  );

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await newsService.getIngestionStats();
      setStats(result);
    } catch (err) {
      if (err instanceof NewsError) {
        if (err.code === "permission-denied") {
          setError("You don't have permission to access admin features.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load ingestion stats");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin, fetchStats]);

  const handleTriggerIngestion = async () => {
    setIsIngesting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result: IngestionResult = await newsService.triggerIngestion({
        topics: selectedTopics.length > 0 ? selectedTopics : undefined,
        force: true,
      });

      if (result.success) {
        setSuccessMessage(
          `Successfully ingested ${result.articlesAdded} articles!`,
        );
        fetchStats(); // Refresh stats
      } else {
        setError(
          `Ingestion completed with errors: ${result.errors.join(", ")}`,
        );
      }
    } catch (err) {
      if (err instanceof NewsError) {
        setError(err.message);
      } else {
        setError("Failed to trigger news ingestion");
      }
    } finally {
      setIsIngesting(false);
    }
  };

  const handleGenerateDigest = async () => {
    setIsIngesting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await newsService.generateDigest();
      setSuccessMessage(
        `Generated AI digest with ${result.articleCount} articles!`,
      );
    } catch (err) {
      if (err instanceof NewsError) {
        setError(err.message);
      } else {
        setError("Failed to generate news digest");
      }
    } finally {
      setIsIngesting(false);
    }
  };

  // Only show for admins
  if (!user || !isAdmin) {
    return (
      <div className="news-admin-unauthorized">
        <h2>Admin Access Required</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  const topics = [
    "counter-uas",
    "defense-tech",
    "drone-industry",
    "regulatory",
    "market-analysis",
    "ai-autonomy",
  ];

  return (
    <div className="news-admin-panel">
      <div className="news-admin-header">
        <h2>News Administration</h2>
        <div className="news-admin-tabs">
          <button
            className={`news-admin-tab ${activeTab === "ingestion" ? "active" : ""}`}
            onClick={() => setActiveTab("ingestion")}
          >
            Ingestion
          </button>
          <button
            className={`news-admin-tab ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
          <button
            className={`news-admin-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>
      </div>

      {error && (
        <div className="news-admin-error">
          <span className="news-admin-error-icon">!</span>
          {error}
          <button
            onClick={() => setError(null)}
            className="news-admin-error-close"
          >
            x
          </button>
        </div>
      )}

      {successMessage && (
        <div className="news-admin-success">
          <span className="news-admin-success-icon">OK</span>
          {successMessage}
          <button
            onClick={() => setSuccessMessage(null)}
            className="news-admin-success-close"
          >
            x
          </button>
        </div>
      )}

      {activeTab === "ingestion" && (
        <div className="news-admin-ingestion">
          <div className="news-admin-section">
            <h3>Manual Ingestion</h3>
            <p className="news-admin-section-desc">
              Trigger news ingestion manually. The system also runs
              automatically every 6 hours.
            </p>

            <div className="news-admin-topics">
              <label>Select topics to fetch (leave empty for all):</label>
              <div className="news-admin-topic-list">
                {topics.map((topic) => (
                  <label key={topic} className="news-admin-topic-item">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTopics([...selectedTopics, topic]);
                        } else {
                          setSelectedTopics(
                            selectedTopics.filter((t) => t !== topic),
                          );
                        }
                      }}
                    />
                    <span>{topic.replace("-", " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="news-admin-actions">
              <button
                className="news-admin-btn primary"
                onClick={handleTriggerIngestion}
                disabled={isIngesting}
              >
                {isIngesting ? (
                  <>
                    <span className="news-admin-spinner" /> Ingesting...
                  </>
                ) : (
                  "Trigger Ingestion"
                )}
              </button>
              <button
                className="news-admin-btn secondary"
                onClick={handleGenerateDigest}
                disabled={isIngesting}
              >
                {isIngesting ? "Processing..." : "Generate AI Digest"}
              </button>
              <button
                className="news-admin-btn tertiary"
                onClick={fetchStats}
                disabled={isLoading}
              >
                Refresh Stats
              </button>
            </div>
          </div>

          <div className="news-admin-section">
            <h3>Ingestion Statistics</h3>
            {isLoading && !stats ? (
              <div className="news-admin-loading">Loading stats...</div>
            ) : stats ? (
              <div className="news-admin-stats">
                <div className="news-admin-stat-card">
                  <span className="news-admin-stat-value">
                    {stats.totalArticles}
                  </span>
                  <span className="news-admin-stat-label">Total Articles</span>
                </div>
                <div className="news-admin-stat-card">
                  <span className="news-admin-stat-value">
                    {stats.articlesLast24h}
                  </span>
                  <span className="news-admin-stat-label">Last 24 Hours</span>
                </div>
                <div className="news-admin-stat-card">
                  <span className="news-admin-stat-value">
                    {stats.articlesLast7d}
                  </span>
                  <span className="news-admin-stat-label">Last 7 Days</span>
                </div>
                <div className="news-admin-stat-card">
                  <span className="news-admin-stat-value">
                    {stats.lastIngestionTime
                      ? formatTimeAgo(stats.lastIngestionTime)
                      : "Never"}
                  </span>
                  <span className="news-admin-stat-label">Last Ingestion</span>
                </div>
              </div>
            ) : (
              <div className="news-admin-no-stats">No stats available</div>
            )}

            {stats && Object.keys(stats.articlesByCategory).length > 0 && (
              <div className="news-admin-category-breakdown">
                <h4>Articles by Category</h4>
                <div className="news-admin-category-bars">
                  {Object.entries(stats.articlesByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, count]) => (
                      <div key={category} className="news-admin-category-bar">
                        <span className="news-admin-category-name">
                          {category.replace("-", " ")}
                        </span>
                        <div className="news-admin-category-bar-track">
                          <div
                            className="news-admin-category-bar-fill"
                            style={{
                              width: `${Math.min(100, (count / Math.max(1, stats.totalArticles)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="news-admin-category-count">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && <NewsAnalyticsDashboard />}

      {activeTab === "settings" && (
        <div className="news-admin-settings">
          <div className="news-admin-section">
            <h3>Ingestion Settings</h3>
            <p className="news-admin-section-desc">
              Configure automatic news ingestion settings.
            </p>

            <div className="news-admin-setting-item">
              <label>Ingestion Frequency</label>
              <select defaultValue="6h">
                <option value="1h">Every hour</option>
                <option value="3h">Every 3 hours</option>
                <option value="6h">Every 6 hours</option>
                <option value="12h">Every 12 hours</option>
                <option value="24h">Daily</option>
              </select>
            </div>

            <div className="news-admin-setting-item">
              <label>Max Articles Per Ingestion</label>
              <input type="number" defaultValue={50} min={10} max={200} />
            </div>

            <div className="news-admin-setting-item">
              <label>
                <input type="checkbox" defaultChecked />
                Enable AI categorization
              </label>
            </div>

            <div className="news-admin-setting-item">
              <label>
                <input type="checkbox" defaultChecked />
                Enable personalization scoring
              </label>
            </div>

            <button className="news-admin-btn primary" disabled>
              Save Settings (Coming Soon)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * News Analytics Dashboard Component
 */
function NewsAnalyticsDashboard(): React.ReactElement {
  const [analytics, setAnalytics] = useState<{
    totalViews: number;
    totalSaves: number;
    uniqueReaders: number;
    avgReadTime: number;
    topArticles: Array<{
      id: string;
      title: string;
      views: number;
      saves: number;
    }>;
    engagementByCategory: Record<string, { views: number; saves: number }>;
    dailyViews: Array<{ date: string; views: number }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("7d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await newsService.getAnalytics({ dateRange });
        setAnalytics(result);
      } catch (err) {
        if (err instanceof NewsError) {
          setError(err.message);
        } else {
          setError("Failed to load analytics");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  if (isLoading) {
    return <div className="news-admin-loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="news-admin-error">{error}</div>;
  }

  if (!analytics) {
    return (
      <div className="news-admin-no-stats">No analytics data available</div>
    );
  }

  return (
    <div className="news-analytics-dashboard">
      <div className="news-analytics-header">
        <h3>Engagement Analytics</h3>
        <div className="news-analytics-date-range">
          <button
            className={dateRange === "7d" ? "active" : ""}
            onClick={() => setDateRange("7d")}
          >
            7 Days
          </button>
          <button
            className={dateRange === "30d" ? "active" : ""}
            onClick={() => setDateRange("30d")}
          >
            30 Days
          </button>
          <button
            className={dateRange === "90d" ? "active" : ""}
            onClick={() => setDateRange("90d")}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="news-analytics-overview">
        <div className="news-analytics-card">
          <span className="news-analytics-value">
            {analytics.totalViews.toLocaleString()}
          </span>
          <span className="news-analytics-label">Total Views</span>
        </div>
        <div className="news-analytics-card">
          <span className="news-analytics-value">
            {analytics.totalSaves.toLocaleString()}
          </span>
          <span className="news-analytics-label">Saved Articles</span>
        </div>
        <div className="news-analytics-card">
          <span className="news-analytics-value">
            {analytics.uniqueReaders.toLocaleString()}
          </span>
          <span className="news-analytics-label">Unique Readers</span>
        </div>
        <div className="news-analytics-card">
          <span className="news-analytics-value">
            {Math.round(analytics.avgReadTime)}s
          </span>
          <span className="news-analytics-label">Avg Read Time</span>
        </div>
      </div>

      <div className="news-analytics-section">
        <h4>Daily Views Trend</h4>
        <div className="news-analytics-chart">
          {analytics.dailyViews.map((day, index) => {
            const maxViews = Math.max(
              ...analytics.dailyViews.map((d) => d.views),
            );
            const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
            return (
              <div key={day.date} className="news-analytics-bar-wrapper">
                <div
                  className="news-analytics-bar"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.views} views`}
                />
                {index % 3 === 0 && (
                  <span className="news-analytics-bar-label">
                    {new Date(day.date).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="news-analytics-section">
        <h4>Top Performing Articles</h4>
        <div className="news-analytics-top-articles">
          {analytics.topArticles.slice(0, 5).map((article, index) => (
            <div key={article.id} className="news-analytics-article-row">
              <span className="news-analytics-article-rank">#{index + 1}</span>
              <span className="news-analytics-article-title">
                {article.title}
              </span>
              <span className="news-analytics-article-stats">
                {article.views} views | {article.saves} saves
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="news-analytics-section">
        <h4>Engagement by Category</h4>
        <div className="news-analytics-category-table">
          <div className="news-analytics-table-header">
            <span>Category</span>
            <span>Views</span>
            <span>Saves</span>
            <span>Save Rate</span>
          </div>
          {Object.entries(analytics.engagementByCategory)
            .sort((a, b) => b[1].views - a[1].views)
            .map(([category, data]) => (
              <div key={category} className="news-analytics-table-row">
                <span>{category.replace("-", " ")}</span>
                <span>{data.views.toLocaleString()}</span>
                <span>{data.saves.toLocaleString()}</span>
                <span>
                  {data.views > 0
                    ? `${((data.saves / data.views) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Format time ago
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default NewsAdminPanel;
