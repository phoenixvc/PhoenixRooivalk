/**
 * Export Utility
 *
 * Provides functionality to export user data in various formats:
 * - Saved articles as Markdown/JSON
 * - Reading history
 * - Comment history
 * - Personal analytics
 * - AI-generated export summaries (Wave 3)
 */

import { aiService } from "../services/aiService";

export interface ExportArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  url?: string;
  source?: string;
  publishedAt?: string;
  savedAt?: string;
  category?: string;
}

export interface ExportReadingHistory {
  docId: string;
  title?: string;
  scrollProgress: number;
  completed: boolean;
  completedAt?: string;
  lastReadAt?: string;
  timeSpentMs?: number;
}

export interface ExportComment {
  id: string;
  content: string;
  pageUrl: string;
  pageTitle?: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
}

/**
 * AI-generated export summary
 */
export interface AIExportSummary {
  overview: string;
  keyPoints: string[];
  insights: string;
  generatedAt: string;
}

export interface ExportData {
  exportedAt: string;
  userId?: string;
  articles?: ExportArticle[];
  readingHistory?: ExportReadingHistory[];
  comments?: ExportComment[];
  collections?: {
    name: string;
    articleCount: number;
    articles: ExportArticle[];
  }[];
  // AI-generated summary (Wave 3)
  aiSummary?: AIExportSummary;
}

/**
 * Convert articles to Markdown format
 */
export function articlesToMarkdown(articles: ExportArticle[]): string {
  const lines: string[] = [
    "# Saved Articles",
    "",
    `*Exported on ${new Date().toLocaleDateString()}*`,
    "",
    "---",
    "",
  ];

  articles.forEach((article, index) => {
    lines.push(`## ${index + 1}. ${article.title}`);
    lines.push("");

    if (article.source) {
      lines.push(`**Source:** ${article.source}`);
    }
    if (article.publishedAt) {
      lines.push(
        `**Published:** ${new Date(article.publishedAt).toLocaleDateString()}`,
      );
    }
    if (article.savedAt) {
      lines.push(
        `**Saved:** ${new Date(article.savedAt).toLocaleDateString()}`,
      );
    }
    if (article.category) {
      lines.push(`**Category:** ${article.category}`);
    }
    if (article.url) {
      lines.push(`**Link:** [${article.url}](${article.url})`);
    }

    lines.push("");

    if (article.summary) {
      lines.push(`> ${article.summary}`);
      lines.push("");
    }

    if (article.content) {
      lines.push(article.content);
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Convert reading history to Markdown format
 */
export function readingHistoryToMarkdown(
  history: ExportReadingHistory[],
): string {
  const lines: string[] = [
    "# Reading History",
    "",
    `*Exported on ${new Date().toLocaleDateString()}*`,
    "",
    "---",
    "",
    "| Document | Progress | Status | Time Spent | Last Read |",
    "|----------|----------|--------|------------|-----------|",
  ];

  history.forEach((item) => {
    const status = item.completed ? "Completed" : "In Progress";
    const timeSpent = item.timeSpentMs
      ? formatDuration(item.timeSpentMs)
      : "N/A";
    const lastRead = item.lastReadAt
      ? new Date(item.lastReadAt).toLocaleDateString()
      : "N/A";

    lines.push(
      `| ${item.title || item.docId} | ${item.scrollProgress}% | ${status} | ${timeSpent} | ${lastRead} |`,
    );
  });

  lines.push("");

  // Add summary stats
  const totalTime = history.reduce(
    (sum, item) => sum + (item.timeSpentMs || 0),
    0,
  );
  const completedCount = history.filter((item) => item.completed).length;

  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total Documents:** ${history.length}`);
  lines.push(`- **Completed:** ${completedCount}`);
  lines.push(`- **In Progress:** ${history.length - completedCount}`);
  lines.push(`- **Total Reading Time:** ${formatDuration(totalTime)}`);

  return lines.join("\n");
}

/**
 * Convert comments to Markdown format
 */
export function commentsToMarkdown(comments: ExportComment[]): string {
  const lines: string[] = [
    "# Comment History",
    "",
    `*Exported on ${new Date().toLocaleDateString()}*`,
    "",
    "---",
    "",
  ];

  comments.forEach((comment, index) => {
    lines.push(`### Comment ${index + 1}`);
    lines.push("");
    lines.push(`**Page:** ${comment.pageTitle || comment.pageUrl}`);
    lines.push(`**Date:** ${new Date(comment.createdAt).toLocaleDateString()}`);
    lines.push(`**Status:** ${comment.status}`);
    lines.push("");
    lines.push(comment.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Download content as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export articles as Markdown file
 */
export function exportArticlesAsMarkdown(articles: ExportArticle[]): void {
  const markdown = articlesToMarkdown(articles);
  const filename = `saved-articles-${new Date().toISOString().split("T")[0]}.md`;
  downloadFile(markdown, filename, "text/markdown");
}

/**
 * Export articles as JSON file
 */
export function exportArticlesAsJson(articles: ExportArticle[]): void {
  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    articles,
  };
  const json = JSON.stringify(data, null, 2);
  const filename = `saved-articles-${new Date().toISOString().split("T")[0]}.json`;
  downloadFile(json, filename, "application/json");
}

/**
 * Export reading history as Markdown file
 */
export function exportReadingHistoryAsMarkdown(
  history: ExportReadingHistory[],
): void {
  const markdown = readingHistoryToMarkdown(history);
  const filename = `reading-history-${new Date().toISOString().split("T")[0]}.md`;
  downloadFile(markdown, filename, "text/markdown");
}

/**
 * Export reading history as JSON file
 */
export function exportReadingHistoryAsJson(
  history: ExportReadingHistory[],
): void {
  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    readingHistory: history,
  };
  const json = JSON.stringify(data, null, 2);
  const filename = `reading-history-${new Date().toISOString().split("T")[0]}.json`;
  downloadFile(json, filename, "application/json");
}

/**
 * Export comments as Markdown file
 */
export function exportCommentsAsMarkdown(comments: ExportComment[]): void {
  const markdown = commentsToMarkdown(comments);
  const filename = `comments-${new Date().toISOString().split("T")[0]}.md`;
  downloadFile(markdown, filename, "text/markdown");
}

/**
 * Export comments as JSON file
 */
export function exportCommentsAsJson(comments: ExportComment[]): void {
  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    comments,
  };
  const json = JSON.stringify(data, null, 2);
  const filename = `comments-${new Date().toISOString().split("T")[0]}.json`;
  downloadFile(json, filename, "application/json");
}

/**
 * Export all user data
 */
export function exportAllData(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const filename = `phoenix-data-export-${new Date().toISOString().split("T")[0]}.json`;
  downloadFile(json, filename, "application/json");
}

/**
 * Generate and download a complete data export
 */
export function generateFullExport(options: {
  articles?: ExportArticle[];
  readingHistory?: ExportReadingHistory[];
  comments?: ExportComment[];
  userId?: string;
}): void {
  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    userId: options.userId,
    articles: options.articles,
    readingHistory: options.readingHistory,
    comments: options.comments,
  };

  exportAllData(data);
}

/**
 * AI-powered: Generate executive summary for export
 * Uses AI to create a high-level overview of the exported data
 */
export async function generateAIExportSummary(
  data: Partial<ExportData>,
): Promise<AIExportSummary> {
  try {
    // Build context from export data
    const articleCount = data.articles?.length || 0;
    const historyCount = data.readingHistory?.length || 0;
    const commentCount = data.comments?.length || 0;
    const collectionCount = data.collections?.length || 0;

    // Get sample article titles for context
    const sampleTitles =
      data.articles
        ?.slice(0, 5)
        .map((a) => a.title)
        .join(", ") || "None";

    // Calculate reading stats
    const completedCount =
      data.readingHistory?.filter((h) => h.completed).length || 0;
    const totalTimeMs =
      data.readingHistory?.reduce((sum, h) => sum + (h.timeSpentMs || 0), 0) ||
      0;

    const exportContext = `
Export Data Summary:
- Saved articles: ${articleCount}
- Reading history entries: ${historyCount}
- Comments: ${commentCount}
- Collections: ${collectionCount}
- Articles completed: ${completedCount}
- Total reading time: ${formatDuration(totalTimeMs)}
- Sample article titles: ${sampleTitles}
    `.trim();

    const prompt = `
Create an executive summary for this documentation export:

${exportContext}

Provide:
1. A brief overview (2-3 sentences) of the user's documentation journey
2. 3-4 key points or highlights from the data
3. Insights about their documentation usage patterns

Keep it professional and concise.
    `;

    const result = await aiService.askDocumentation(prompt, {
      format: "detailed",
    });

    // Parse AI response
    const lines = result.answer.split("\n").filter((l) => l.trim());

    // Extract overview
    const overview =
      lines.find(
        (l) => l.length > 40 && !l.startsWith("-") && !l.startsWith("•"),
      ) ||
      `This export contains ${articleCount} articles and ${historyCount} reading history entries.`;

    // Extract key points
    const keyPoints: string[] = [];
    lines
      .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))
      .slice(0, 4)
      .forEach((l) => {
        keyPoints.push(l.replace(/^[-•]\s*/, "").trim());
      });

    // Extract insights (look for analysis-like statements)
    const insights =
      lines.find(
        (l) =>
          l.toLowerCase().includes("insight") ||
          l.toLowerCase().includes("pattern") ||
          l.toLowerCase().includes("focus") ||
          l.toLowerCase().includes("interest"),
      ) || "Your documentation activity shows consistent engagement.";

    return {
      overview: overview.substring(0, 300),
      keyPoints:
        keyPoints.length > 0
          ? keyPoints
          : [
              `${articleCount} articles saved`,
              `${completedCount} documents completed`,
              `${formatDuration(totalTimeMs)} total reading time`,
            ],
      insights: insights.substring(0, 200),
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Failed to generate AI export summary:", error);
    return {
      overview: `Export contains ${data.articles?.length || 0} articles and ${data.readingHistory?.length || 0} reading history entries.`,
      keyPoints: ["Saved articles exported", "Reading history included"],
      insights: "Export completed successfully.",
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Generate and download export with AI summary
 */
export async function generateFullExportWithAI(options: {
  articles?: ExportArticle[];
  readingHistory?: ExportReadingHistory[];
  comments?: ExportComment[];
  userId?: string;
  includeAISummary?: boolean;
}): Promise<void> {
  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    userId: options.userId,
    articles: options.articles,
    readingHistory: options.readingHistory,
    comments: options.comments,
  };

  // Generate AI summary if requested
  if (options.includeAISummary !== false) {
    data.aiSummary = await generateAIExportSummary(data);
  }

  exportAllData(data);
}
