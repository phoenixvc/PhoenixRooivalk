/**
 * Reading Analytics Hook
 *
 * Provides personal reading analytics:
 * - Reading time by category
 * - Most-read topics
 * - Reading streak tracking
 * - Weekly/monthly summaries
 * - AI-powered insights (Wave 3)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { NewsCategory, NEWS_CATEGORY_CONFIG } from "../types/news";
import { aiService } from "../services/aiService";

interface ReadingSession {
  articleId: string;
  category: NewsCategory;
  startTime: number;
  endTime?: number;
  duration: number;
  completed: boolean;
}

interface DailyReading {
  date: string;
  totalTimeMs: number;
  articlesRead: number;
  articlesCompleted: number;
  categories: Record<string, number>;
}

interface ReadingStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;
  streakDates: string[];
}

interface CategoryStats {
  category: NewsCategory;
  label: string;
  color: string;
  totalTimeMs: number;
  articleCount: number;
  percentage: number;
}

interface TopicStats {
  topic: string;
  count: number;
  lastRead: string;
}

/**
 * AI-generated reading insights
 */
export interface AIReadingInsights {
  summary: string;
  recommendations: string[];
  learningPath: string;
  motivation: string;
  confidence: number;
}

interface ReadingAnalytics {
  // Time-based stats
  totalReadingTimeMs: number;
  totalArticlesRead: number;
  totalArticlesCompleted: number;
  averageReadingTimeMs: number;

  // Category breakdown
  categoryStats: CategoryStats[];

  // Streak tracking
  streak: ReadingStreak;

  // Topic trends
  topTopics: TopicStats[];

  // Daily history (last 30 days)
  dailyHistory: DailyReading[];

  // Weekly summary
  thisWeekTimeMs: number;
  lastWeekTimeMs: number;
  weekOverWeekChange: number;

  // Goal tracking
  dailyGoalMinutes: number;
  todayProgressMs: number;
  goalCompletedToday: boolean;
}

const STORAGE_KEY = "phoenix-reading-analytics";
const DAILY_GOAL_KEY = "phoenix-daily-reading-goal";
const DEFAULT_DAILY_GOAL = 15; // 15 minutes default

/**
 * Get date string in YYYY-MM-DD format
 */
function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/**
 * Check if two dates are consecutive
 */
function areConsecutiveDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Get stored analytics data
 */
function getStoredAnalytics(): {
  sessions: ReadingSession[];
  dailyHistory: DailyReading[];
  streak: ReadingStreak;
  topics: Record<string, TopicStats>;
} {
  if (typeof window === "undefined") {
    return {
      sessions: [],
      dailyHistory: [],
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
        streakDates: [],
      },
      topics: {},
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }

  return {
    sessions: [],
    dailyHistory: [],
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastReadDate: null,
      streakDates: [],
    },
    topics: {},
  };
}

/**
 * Save analytics data
 */
function saveAnalytics(data: {
  sessions: ReadingSession[];
  dailyHistory: DailyReading[];
  streak: ReadingStreak;
  topics: Record<string, TopicStats>;
}): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore errors
  }
}

/**
 * Reading Analytics Hook
 */
export function useReadingAnalytics(): {
  analytics: ReadingAnalytics;
  isLoading: boolean;
  recordReading: (
    articleId: string,
    category: NewsCategory,
    durationMs: number,
    completed: boolean,
    topics?: string[],
  ) => void;
  setDailyGoal: (minutes: number) => void;
  // AI-powered insights (Wave 3)
  generateAIInsights: () => Promise<AIReadingInsights>;
  isGeneratingInsights: boolean;
} {
  const { user } = useAuth();
  const [data, setData] = useState(() => getStoredAnalytics());
  const [dailyGoal, setDailyGoalState] = useState(DEFAULT_DAILY_GOAL);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Load daily goal
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DAILY_GOAL_KEY);
      if (stored) {
        setDailyGoalState(parseInt(stored, 10) || DEFAULT_DAILY_GOAL);
      }
    } catch {
      // Ignore
    }
    setIsLoading(false);
  }, []);

  // Set daily goal
  const setDailyGoal = useCallback((minutes: number) => {
    setDailyGoalState(minutes);
    try {
      localStorage.setItem(DAILY_GOAL_KEY, String(minutes));
    } catch {
      // Ignore
    }
  }, []);

  // Record a reading session
  const recordReading = useCallback(
    (
      articleId: string,
      category: NewsCategory,
      durationMs: number,
      completed: boolean,
      topics?: string[],
    ) => {
      const today = getDateString();
      const now = Date.now();

      setData((prev) => {
        // Add session
        const newSession: ReadingSession = {
          articleId,
          category,
          startTime: now - durationMs,
          endTime: now,
          duration: durationMs,
          completed,
        };

        // Update daily history
        let dailyHistory = [...prev.dailyHistory];
        const todayIndex = dailyHistory.findIndex((d) => d.date === today);

        if (todayIndex >= 0) {
          const todayData = dailyHistory[todayIndex];
          dailyHistory[todayIndex] = {
            ...todayData,
            totalTimeMs: todayData.totalTimeMs + durationMs,
            articlesRead: todayData.articlesRead + 1,
            articlesCompleted: todayData.articlesCompleted + (completed ? 1 : 0),
            categories: {
              ...todayData.categories,
              [category]: (todayData.categories[category] || 0) + durationMs,
            },
          };
        } else {
          dailyHistory.push({
            date: today,
            totalTimeMs: durationMs,
            articlesRead: 1,
            articlesCompleted: completed ? 1 : 0,
            categories: { [category]: durationMs },
          });
        }

        // Keep only last 30 days
        dailyHistory = dailyHistory
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 30);

        // Update streak
        let streak = { ...prev.streak };
        if (prev.streak.lastReadDate !== today) {
          if (
            prev.streak.lastReadDate &&
            areConsecutiveDays(prev.streak.lastReadDate, today)
          ) {
            streak.currentStreak += 1;
            streak.streakDates.push(today);
          } else if (prev.streak.lastReadDate !== today) {
            // Streak broken, start new one
            streak.currentStreak = 1;
            streak.streakDates = [today];
          }
          streak.lastReadDate = today;
          streak.longestStreak = Math.max(
            streak.longestStreak,
            streak.currentStreak,
          );
        }

        // Update topics
        const updatedTopics = { ...prev.topics };
        topics?.forEach((topic) => {
          if (updatedTopics[topic]) {
            updatedTopics[topic] = {
              ...updatedTopics[topic],
              count: updatedTopics[topic].count + 1,
              lastRead: new Date().toISOString(),
            };
          } else {
            updatedTopics[topic] = {
              topic,
              count: 1,
              lastRead: new Date().toISOString(),
            };
          }
        });

        const newData = {
          sessions: [...prev.sessions, newSession].slice(-100), // Keep last 100 sessions
          dailyHistory,
          streak,
          topics: updatedTopics,
        };

        saveAnalytics(newData);
        return newData;
      });
    },
    [],
  );

  // Calculate analytics
  const analytics = useMemo((): ReadingAnalytics => {
    const today = getDateString();
    const todayData = data.dailyHistory.find((d) => d.date === today);

    // Total stats
    const totalReadingTimeMs = data.dailyHistory.reduce(
      (sum, d) => sum + d.totalTimeMs,
      0,
    );
    const totalArticlesRead = data.dailyHistory.reduce(
      (sum, d) => sum + d.articlesRead,
      0,
    );
    const totalArticlesCompleted = data.dailyHistory.reduce(
      (sum, d) => sum + d.articlesCompleted,
      0,
    );

    // Category stats
    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    data.sessions.forEach((session) => {
      categoryTotals[session.category] =
        (categoryTotals[session.category] || 0) + session.duration;
      categoryCounts[session.category] =
        (categoryCounts[session.category] || 0) + 1;
    });

    const totalCategoryTime = Object.values(categoryTotals).reduce(
      (a, b) => a + b,
      0,
    );

    const categoryStats: CategoryStats[] = Object.entries(categoryTotals)
      .map(([category, time]) => {
        const config = NEWS_CATEGORY_CONFIG[category as NewsCategory];
        return {
          category: category as NewsCategory,
          label: config?.label || category,
          color: config?.color || "#6B7280",
          totalTimeMs: time,
          articleCount: categoryCounts[category] || 0,
          percentage: totalCategoryTime > 0 ? (time / totalCategoryTime) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalTimeMs - a.totalTimeMs);

    // Weekly comparison
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeekTimeMs = data.dailyHistory
      .filter((d) => new Date(d.date) >= startOfWeek)
      .reduce((sum, d) => sum + d.totalTimeMs, 0);

    const lastWeekTimeMs = data.dailyHistory
      .filter(
        (d) =>
          new Date(d.date) >= startOfLastWeek && new Date(d.date) < startOfWeek,
      )
      .reduce((sum, d) => sum + d.totalTimeMs, 0);

    const weekOverWeekChange =
      lastWeekTimeMs > 0
        ? ((thisWeekTimeMs - lastWeekTimeMs) / lastWeekTimeMs) * 100
        : 0;

    // Top topics
    const topTopics = Object.values(data.topics)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalReadingTimeMs,
      totalArticlesRead,
      totalArticlesCompleted,
      averageReadingTimeMs:
        totalArticlesRead > 0 ? totalReadingTimeMs / totalArticlesRead : 0,
      categoryStats,
      streak: data.streak,
      topTopics,
      dailyHistory: data.dailyHistory,
      thisWeekTimeMs,
      lastWeekTimeMs,
      weekOverWeekChange,
      dailyGoalMinutes: dailyGoal,
      todayProgressMs: todayData?.totalTimeMs || 0,
      goalCompletedToday: (todayData?.totalTimeMs || 0) >= dailyGoal * 60 * 1000,
    };
  }, [data, dailyGoal]);

  /**
   * AI-powered: Generate personalized insights based on reading analytics
   */
  const generateAIInsights = useCallback(async (): Promise<AIReadingInsights> => {
    setIsGeneratingInsights(true);

    try {
      // Build context from analytics
      const topCategories = analytics.categoryStats
        .slice(0, 3)
        .map((c) => c.label)
        .join(", ");

      const topTopicsStr = analytics.topTopics
        .slice(0, 5)
        .map((t) => t.topic)
        .join(", ");

      const analyticsContext = `
User Reading Profile:
- Total reading time: ${formatReadingTime(analytics.totalReadingTimeMs)}
- Articles read: ${analytics.totalArticlesRead}
- Articles completed: ${analytics.totalArticlesCompleted}
- Current streak: ${analytics.streak.currentStreak} days
- Longest streak: ${analytics.streak.longestStreak} days
- Top categories: ${topCategories || "None yet"}
- Top topics: ${topTopicsStr || "None yet"}
- Weekly progress: ${analytics.weekOverWeekChange > 0 ? "+" : ""}${analytics.weekOverWeekChange.toFixed(0)}% vs last week
- Daily goal: ${analytics.dailyGoalMinutes} minutes
- Today's progress: ${formatReadingTime(analytics.todayProgressMs)}
      `.trim();

      const prompt = `
Based on this reading analytics data, provide personalized insights:

${analyticsContext}

Generate:
1. A brief summary (1-2 sentences) of their reading patterns
2. 2-3 specific recommendations for what to read next
3. A suggested learning path based on their interests
4. A motivational message about their progress

Keep responses concise and actionable.
      `;

      const result = await aiService.askDocumentation(prompt, {
        format: "detailed",
      });

      // Parse the AI response
      const lines = result.answer.split("\n").filter((l) => l.trim());

      // Extract summary (first substantial paragraph)
      const summary =
        lines.find((l) => l.length > 30 && !l.startsWith("-") && !l.startsWith("•")) ||
        "You're making great progress with your reading!";

      // Extract recommendations (bullet points)
      const recommendations: string[] = [];
      lines
        .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))
        .slice(0, 3)
        .forEach((l) => {
          recommendations.push(l.replace(/^[-•]\s*/, "").trim());
        });

      // Extract learning path
      const learningPath =
        lines.find(
          (l) => l.toLowerCase().includes("path") || l.toLowerCase().includes("learn"),
        ) || "Continue exploring topics that interest you!";

      // Extract motivation
      const motivation =
        lines.find(
          (l) =>
            l.toLowerCase().includes("great") ||
            l.toLowerCase().includes("keep") ||
            l.toLowerCase().includes("progress"),
        ) || "Keep up the great work!";

      return {
        summary: summary.substring(0, 300),
        recommendations:
          recommendations.length > 0
            ? recommendations
            : ["Explore technical documentation", "Review API guides"],
        learningPath: learningPath.substring(0, 200),
        motivation: motivation.substring(0, 150),
        confidence:
          result.confidence === "high"
            ? 0.9
            : result.confidence === "medium"
              ? 0.7
              : 0.5,
      };
    } catch (error) {
      console.warn("Failed to generate AI insights:", error);
      return {
        summary: `You've read ${analytics.totalArticlesRead} articles with a ${analytics.streak.currentStreak}-day streak!`,
        recommendations: [
          "Continue with your top categories",
          "Explore related topics",
        ],
        learningPath: "Keep building your knowledge base!",
        motivation: "Great progress! Keep reading to earn more XP.",
        confidence: 0,
      };
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [analytics]);

  return {
    analytics,
    isLoading,
    recordReading,
    setDailyGoal,
    // AI-powered insights
    generateAIInsights,
    isGeneratingInsights,
  };
}

/**
 * Format time duration for display
 */
export function formatReadingTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

export default useReadingAnalytics;
