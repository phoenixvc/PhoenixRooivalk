/**
 * Analytics Dashboard
 *
 * Admin page for viewing documentation analytics:
 * - Page views and unique visitors
 * - Time spent on pages
 * - Conversion funnel metrics
 * - User engagement stats
 */

import React, { useEffect, useState } from "react";
import Layout from "@theme/Layout";
import { useAuth } from "../../contexts/AuthContext";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
} from "firebase/firestore";
import { isFirebaseConfigured } from "../../services/firebase";
import styles from "./analytics.module.css";

// Admin user IDs - configure via environment variable ADMIN_USER_IDS (comma-separated)
// If not set, falls back to checking user email domain
const ADMIN_USERS: string[] = process.env.ADMIN_USER_IDS
  ? process.env.ADMIN_USER_IDS.split(",").map((id) => id.trim())
  : [];

// Admin email domains that are allowed (fallback if no specific UIDs configured)
const ADMIN_EMAIL_DOMAINS = ["phoenixrooivalk.com", "justaghost.dev"];

interface DailyStats {
  date: string;
  totalPageViews: number;
  authenticatedViews: number;
  anonymousViews: number;
}

interface TopPage {
  url: string;
  views: number;
  avgTimeMs: number;
}

interface ConversionMetrics {
  teaserViews: number;
  signupPrompts: number;
  signupsStarted: number;
  signupsCompleted: number;
  conversionRate: number;
}

export default function AnalyticsDashboard(): React.ReactElement {
  const { user, loading } = useAuth();
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [conversions, setConversions] = useState<ConversionMetrics | null>(
    null,
  );
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(7); // Last 7 days

  // Check if user is admin by UID or email domain
  const isAdmin =
    user &&
    (ADMIN_USERS.includes(user.uid) ||
      (user.email &&
        ADMIN_EMAIL_DOMAINS.some((domain) =>
          user.email?.endsWith(`@${domain}`),
        )));

  useEffect(() => {
    if (!loading && isAdmin && isFirebaseConfigured()) {
      fetchAnalytics();
    }
  }, [loading, isAdmin, dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const db = getFirestore();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      // Fetch daily stats
      const dailyQuery = query(
        collection(db, "analytics_daily"),
        orderBy("date", "desc"),
        limit(dateRange),
      );
      const dailySnapshot = await getDocs(dailyQuery);
      const daily = dailySnapshot.docs.map((doc) => doc.data() as DailyStats);
      setDailyStats(daily);

      // Fetch page views for top pages
      const pageViewsQuery = query(
        collection(db, "analytics_pageviews"),
        orderBy("timestamp", "desc"),
        limit(1000),
      );
      const pageViewsSnapshot = await getDocs(pageViewsQuery);

      // Aggregate page views
      const pageViewCounts: Record<string, number> = {};
      pageViewsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const url = data.pageUrl || "unknown";
        pageViewCounts[url] = (pageViewCounts[url] || 0) + 1;
      });

      // Sort and get top 10
      const sortedPages = Object.entries(pageViewCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([url, views]) => ({ url, views, avgTimeMs: 0 }));
      setTopPages(sortedPages);

      // Fetch conversion events
      const conversionsQuery = query(
        collection(db, "analytics_conversions"),
        orderBy("timestamp", "desc"),
        limit(500),
      );
      const conversionsSnapshot = await getDocs(conversionsQuery);

      // Aggregate conversions
      const conversionCounts = {
        teaser_view: 0,
        signup_prompt_shown: 0,
        signup_started: 0,
        signup_completed: 0,
      };
      conversionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.eventType in conversionCounts) {
          conversionCounts[data.eventType as keyof typeof conversionCounts]++;
        }
      });

      setConversions({
        teaserViews: conversionCounts.teaser_view,
        signupPrompts: conversionCounts.signup_prompt_shown,
        signupsStarted: conversionCounts.signup_started,
        signupsCompleted: conversionCounts.signup_completed,
        conversionRate:
          conversionCounts.teaser_view > 0
            ? Math.round(
                (conversionCounts.signup_completed /
                  conversionCounts.teaser_view) *
                  100,
              )
            : 0,
      });

      // Fetch recent sessions
      const sessionsQuery = query(
        collection(db, "analytics_sessions"),
        orderBy("lastActivity", "desc"),
        limit(20),
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      setRecentSessions(sessionsSnapshot.docs.map((doc) => doc.data()));
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <Layout title="Analytics Dashboard">
        <main className="container margin-vert--xl">
          <div className={styles.errorCard}>
            <h2>Firebase Not Configured</h2>
            <p>Analytics requires Firebase to be configured.</p>
          </div>
        </main>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="Analytics Dashboard">
        <main className="container margin-vert--xl">
          <div className={styles.loading}>Loading...</div>
        </main>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="Analytics Dashboard">
        <main className="container margin-vert--xl">
          <div className={styles.errorCard}>
            <h2>Authentication Required</h2>
            <p>Please sign in to view analytics.</p>
          </div>
        </main>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="Analytics Dashboard">
        <main className="container margin-vert--xl">
          <div className={styles.errorCard}>
            <h2>Access Denied</h2>
            <p>You don't have permission to view this page.</p>
          </div>
        </main>
      </Layout>
    );
  }

  const totalViews = dailyStats.reduce(
    (sum, d) => sum + (d.totalPageViews || 0),
    0,
  );
  const totalAuth = dailyStats.reduce(
    (sum, d) => sum + (d.authenticatedViews || 0),
    0,
  );
  const totalAnon = dailyStats.reduce(
    (sum, d) => sum + (d.anonymousViews || 0),
    0,
  );

  return (
    <Layout
      title="Analytics Dashboard"
      description="View documentation analytics"
    >
      <main className="container margin-vert--xl">
        <header className={styles.header}>
          <h1>Analytics Dashboard</h1>
          <div className={styles.controls}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className={styles.select}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button onClick={fetchAnalytics} className={styles.refreshBtn}>
              Refresh
            </button>
          </div>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {isLoading ? (
          <div className={styles.loading}>Loading analytics...</div>
        ) : (
          <>
            {/* Overview Cards */}
            <section className={styles.overviewSection}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {totalViews.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Total Page Views</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {totalAuth.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Authenticated Views</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {totalAnon.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Anonymous Views</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {conversions?.conversionRate || 0}%
                </div>
                <div className={styles.statLabel}>Conversion Rate</div>
              </div>
            </section>

            {/* Conversion Funnel */}
            {conversions && (
              <section className={styles.section}>
                <h2>Conversion Funnel</h2>
                <div className={styles.funnel}>
                  <div className={styles.funnelStep}>
                    <div className={styles.funnelValue}>
                      {conversions.teaserViews}
                    </div>
                    <div className={styles.funnelLabel}>Teaser Views</div>
                  </div>
                  <div className={styles.funnelArrow}>→</div>
                  <div className={styles.funnelStep}>
                    <div className={styles.funnelValue}>
                      {conversions.signupPrompts}
                    </div>
                    <div className={styles.funnelLabel}>Signup Prompts</div>
                  </div>
                  <div className={styles.funnelArrow}>→</div>
                  <div className={styles.funnelStep}>
                    <div className={styles.funnelValue}>
                      {conversions.signupsStarted}
                    </div>
                    <div className={styles.funnelLabel}>Started Signup</div>
                  </div>
                  <div className={styles.funnelArrow}>→</div>
                  <div className={styles.funnelStep}>
                    <div className={styles.funnelValue}>
                      {conversions.signupsCompleted}
                    </div>
                    <div className={styles.funnelLabel}>Completed</div>
                  </div>
                </div>
              </section>
            )}

            {/* Top Pages */}
            <section className={styles.section}>
              <h2>Top Pages</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((page, i) => (
                    <tr key={i}>
                      <td className={styles.pageUrl}>{page.url}</td>
                      <td>{page.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Recent Sessions */}
            <section className={styles.section}>
              <h2>Recent Sessions</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>User</th>
                    <th>Page Views</th>
                    <th>Time (min)</th>
                    <th>Converted</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session, i) => (
                    <tr key={i}>
                      <td className={styles.sessionId}>
                        {session.sessionId?.substring(0, 12)}...
                      </td>
                      <td>
                        {session.isAuthenticated
                          ? "Authenticated"
                          : "Anonymous"}
                      </td>
                      <td>{session.pageViews || 0}</td>
                      <td>{Math.round((session.totalTimeMs || 0) / 60000)}</td>
                      <td>{session.convertedToSignup ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </Layout>
  );
}
