/**
 * Weekly Reports Service
 *
 * Business logic for generating AI-powered weekly reports with GitHub integration.
 * Generates reports in a format compatible with the docs progress section.
 */

import { generateCompletion, getChatDeployment } from "../lib/openai";
import { createLogger } from "../lib/logger";
import {
  weeklyReportsRepository,
  WeeklyReport,
  ReportSection,
  GitHubActivitySummary,
  WeeklyReportFilters,
} from "../repositories/weekly-reports.repository";
import { gitHubService, RepositoryActivity } from "./github.service";
import {
  PaginatedResult,
  PaginationOptions,
} from "../repositories/base.repository";

const logger = createLogger({ feature: "weekly-reports" });

/**
 * Report generation options
 */
export interface GenerateReportOptions {
  repositories: string[];
  weekStartDate?: string;
  weekEndDate?: string;
  includeAISummary?: boolean;
  customPrompt?: string;
}

/**
 * Report generation result
 */
export interface GenerateReportResult {
  success: boolean;
  report?: WeeklyReport;
  error?: string;
}

/**
 * Weekly Reports Service
 */
class WeeklyReportsService {
  /**
   * Get week number from date
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Get week date range (Monday to Sunday)
   */
  private getWeekDateRange(referenceDate?: Date): {
    start: string;
    end: string;
    weekNumber: number;
  } {
    const date = referenceDate || new Date();
    const dayOfWeek = date.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      start: monday.toISOString(),
      end: sunday.toISOString(),
      weekNumber: this.getWeekNumber(monday),
    };
  }

  /**
   * Format date for display
   */
  private formatDate(
    dateString: string,
    format: "short" | "long" = "short",
  ): string {
    const date = new Date(dateString);
    if (format === "long") {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Generate AI summary from GitHub activity
   */
  private async generateAISummary(
    activities: RepositoryActivity[],
    weekInfo: { start: string; end: string; weekNumber: number },
    customPrompt?: string,
  ): Promise<{
    executiveSummary: string;
    sections: ReportSection[];
  }> {
    // Prepare activity data for AI
    const activitySummary = activities
      .map((activity) => {
        const commitAuthors = Array.from(activity.contributors.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => `${name}: ${count} commits`)
          .join(", ");

        const prSummary = activity.pullRequests
          .slice(0, 15)
          .map(
            (pr) =>
              `- [${pr.merged ? "MERGED" : pr.state.toUpperCase()}] #${pr.number}: ${pr.title}`,
          )
          .join("\n");

        const issueSummary = activity.issues
          .slice(0, 10)
          .map(
            (issue) =>
              `- [${issue.state.toUpperCase()}] #${issue.number}: ${issue.title}`,
          )
          .join("\n");

        return `
Repository: ${activity.owner}/${activity.repository}
Commits: ${activity.commits.length}
Top Contributors: ${commitAuthors || "None"}

Recent Commit Messages:
${activity.commits.slice(0, 15).map((c) => `- ${c.message}`).join("\n") || "None"}

Pull Requests (${activity.pullRequests.length} total):
${prSummary || "None"}

Issues (${activity.issues.length} total):
${issueSummary || "None"}
`;
      })
      .join("\n---\n");

    const systemPrompt = `You are a technical writer creating a weekly development progress report for Phoenix Rooivalk, a defense technology startup.

Your task is to analyze the GitHub activity data and create a professional, comprehensive report matching the style of existing progress reports.

The report should follow this structure:

## TL;DR (2-Minute Summary)
Provide 3-5 numbered sections with key highlights, each with:
- A bold headline describing the category
- 2-4 bullet points with specific accomplishments
- Use **bold** for emphasis on important items

## Full Weekly Report

### 1. Software & AI Development
Detail software changes, features, bug fixes, and technical improvements.
Include tables where appropriate:
| Feature | Status | Details |
| ------- | ------ | ------- |
| Example | ✅ Complete | Description |

### 2. Code Quality & DevOps
Document CI/CD improvements, testing, linting, infrastructure changes.

### 3. Key Decisions Made
Create a table of decisions with rationale and impact.

### 4. Next Week Priorities
Numbered list of priorities for the following week.

### 5. Metrics & KPIs
Table showing key metrics with trends (↑↑, ↑, →, ↓).

### 6. Risks & Blockers
Table with risk, severity (High/Medium/Low), and mitigation.

Guidelines:
- Be factual and specific about what was accomplished
- Highlight significant changes, features, and fixes
- Group related work together logically
- Use clear, professional language
- Include specific PR numbers when available
- Focus on impact and outcomes, not just activity
- Use markdown tables for structured data
- Use ✅ for complete items, 🔄 for in progress
- End with "_Report compiled: [date]_"`;

    const userPrompt = customPrompt
      ? `${customPrompt}\n\nWeek ${weekInfo.weekNumber} (${this.formatDate(weekInfo.start)} - ${this.formatDate(weekInfo.end)})\n\nGitHub Activity Data:\n${activitySummary}`
      : `Generate a weekly development progress report for Week ${weekInfo.weekNumber} (${this.formatDate(weekInfo.start)} - ${this.formatDate(weekInfo.end)}) from the following GitHub activity data:\n\n${activitySummary}`;

    logger.info("Generating AI summary for weekly report", {
      weekNumber: weekInfo.weekNumber,
    });

    const aiResponse = await generateCompletion(systemPrompt, userPrompt, {
      maxTokens: 4000,
      temperature: 0.5,
    });

    // Parse the AI response into sections
    const sections: ReportSection[] = [];
    const lines = aiResponse.split("\n");
    let currentSection: ReportSection | null = null;
    let executiveSummary = "";
    let inTLDR = false;

    for (const line of lines) {
      // Check for TL;DR section
      if (line.match(/^##\s+TL;DR/i)) {
        inTLDR = true;
        continue;
      }

      // Check for section headers (## or ###)
      const headerMatch = line.match(/^#{2,3}\s+(.+)$/);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }

        // End of TL;DR when we hit Full Weekly Report
        if (line.match(/Full Weekly Report/i)) {
          inTLDR = false;
        }

        currentSection = {
          title: headerMatch[1].trim(),
          content: "",
          highlights: [],
        };
      } else if (inTLDR && line.trim()) {
        // Capture TL;DR content as executive summary
        executiveSummary += line + "\n";
      } else if (currentSection) {
        currentSection.content += line + "\n";
        // Extract bullet points as highlights
        if (line.match(/^[-*]\s+/)) {
          currentSection.highlights?.push(line.replace(/^[-*]\s+/, "").trim());
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    // Clean up section content
    sections.forEach((section) => {
      section.content = section.content.trim();
    });

    return {
      executiveSummary: executiveSummary.trim(),
      sections,
    };
  }

  /**
   * Convert repository activity to summary format
   */
  private convertToActivitySummary(
    activity: RepositoryActivity,
  ): GitHubActivitySummary {
    const commitAuthors = Array.from(activity.contributors.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const openedPRs = activity.pullRequests.filter(
      (pr) => pr.state === "open",
    ).length;
    const mergedPRs = activity.pullRequests.filter((pr) => pr.merged).length;
    const closedPRs = activity.pullRequests.filter(
      (pr) => pr.state === "closed" && !pr.merged,
    ).length;

    const openedIssues = activity.issues.filter(
      (issue) => issue.state === "open",
    ).length;
    const closedIssues = activity.issues.filter(
      (issue) => issue.state === "closed",
    ).length;

    return {
      repository: `${activity.owner}/${activity.repository}`,
      commits: {
        total: activity.commits.length,
        authors: commitAuthors,
        highlights: activity.commits.slice(0, 5).map((c) => c.message),
      },
      pullRequests: {
        opened: openedPRs,
        merged: mergedPRs,
        closed: closedPRs,
        highlights: activity.pullRequests.slice(0, 5).map((pr) => pr.title),
      },
      issues: {
        opened: openedIssues,
        closed: closedIssues,
        highlights: activity.issues.slice(0, 5).map((issue) => issue.title),
      },
    };
  }

  /**
   * Generate a new weekly report
   */
  async generateReport(
    options: GenerateReportOptions,
    generatedBy: string,
  ): Promise<GenerateReportResult> {
    const startTime = Date.now();

    // Validate options
    if (!options.repositories || options.repositories.length === 0) {
      return { success: false, error: "At least one repository is required" };
    }

    // Check GitHub configuration
    if (!gitHubService.isConfigured()) {
      return {
        success: false,
        error:
          "GitHub token not configured. Set GITHUB_TOKEN environment variable.",
      };
    }

    // Get week date range
    const weekInfo =
      options.weekStartDate && options.weekEndDate
        ? {
            start: options.weekStartDate,
            end: options.weekEndDate,
            weekNumber: this.getWeekNumber(new Date(options.weekStartDate)),
          }
        : this.getWeekDateRange();

    logger.info("Generating weekly report", {
      repositories: options.repositories,
      weekNumber: weekInfo.weekNumber,
      startDate: weekInfo.start,
      endDate: weekInfo.end,
      generatedBy,
    });

    // Create initial report record
    const reportNumber = weeklyReportsRepository.generateReportNumber();
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const startDate = new Date(weekInfo.start);
    const endDate = new Date(weekInfo.end);

    const initialReport: WeeklyReport = {
      id: reportId,
      reportNumber,
      title: `Week ${weekInfo.weekNumber}: ${this.formatDate(weekInfo.start)} - ${this.formatDate(weekInfo.end)}, ${startDate.getFullYear()}`,
      weekStartDate: weekInfo.start,
      weekEndDate: weekInfo.end,
      status: "generating",
      generatedBy,
      sections: [],
      repositories: options.repositories,
    };

    // Save initial report
    await weeklyReportsRepository.save(initialReport);

    try {
      // Parse repositories
      const repos = options.repositories
        .map((r) => gitHubService.parseRepository(r))
        .filter((r): r is { owner: string; repo: string } => r !== null);

      if (repos.length === 0) {
        throw new Error("No valid repositories provided");
      }

      // Fetch GitHub activity
      const activities = await gitHubService.getMultiRepoActivity(
        repos,
        weekInfo.start,
        weekInfo.end,
      );

      // Convert to summary format
      const gitHubActivity = activities.map((a) =>
        this.convertToActivitySummary(a),
      );

      // Generate AI summary if requested
      let executiveSummary = "";
      let sections: ReportSection[] = [];

      if (options.includeAISummary !== false) {
        const aiResult = await this.generateAISummary(
          activities,
          weekInfo,
          options.customPrompt,
        );
        executiveSummary = aiResult.executiveSummary;
        sections = aiResult.sections;
      } else {
        // Create basic sections without AI
        sections = [
          {
            title: "Repository Activity",
            content: gitHubActivity
              .map(
                (a) =>
                  `**${a.repository}**: ${a.commits.total} commits, ${a.pullRequests.merged} PRs merged, ${a.issues.closed} issues closed`,
              )
              .join("\n"),
          },
        ];
      }

      const generationTimeMs = Date.now() - startTime;

      // Get actual AI model used
      const aiModel = getChatDeployment();

      // Update report with results
      const completedReport: WeeklyReport = {
        ...initialReport,
        status: "completed",
        executiveSummary,
        sections,
        gitHubActivity,
        aiModel,
        generationTimeMs,
      };

      const savedReport = await weeklyReportsRepository.save(completedReport);

      logger.info("Weekly report generated successfully", {
        reportNumber,
        generationTimeMs,
        repositoriesCount: repos.length,
        aiModel,
      });

      return { success: true, report: savedReport };
    } catch (error) {
      logger.error("Failed to generate weekly report", error as Error, {
        reportNumber,
      });

      // Update report with error status
      await weeklyReportsRepository.updateStatus(
        reportId,
        "failed",
        (error as Error).message,
      );

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get a report by ID
   */
  async getReport(id: string): Promise<WeeklyReport | null> {
    return weeklyReportsRepository.findById(id);
  }

  /**
   * Get reports with filters
   */
  async getReports(
    filters?: WeeklyReportFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<WeeklyReport>> {
    return weeklyReportsRepository.findWithFilters(filters, options);
  }

  /**
   * Get the most recent report
   */
  async getMostRecentReport(): Promise<WeeklyReport | null> {
    return weeklyReportsRepository.findMostRecent();
  }

  /**
   * Get report counts by status
   */
  async getReportCounts(): Promise<Record<string, number>> {
    return weeklyReportsRepository.getCountByStatus();
  }

  /**
   * Delete a report
   */
  async deleteReport(id: string): Promise<boolean> {
    try {
      await weeklyReportsRepository.delete(id);
      return true;
    } catch (error) {
      logger.error("Failed to delete report", error as Error, { id });
      return false;
    }
  }

  /**
   * Regenerate an existing report
   */
  async regenerateReport(
    id: string,
    generatedBy: string,
  ): Promise<GenerateReportResult> {
    const existingReport = await weeklyReportsRepository.findById(id);
    if (!existingReport) {
      return { success: false, error: "Report not found" };
    }

    // Delete the old report
    await weeklyReportsRepository.delete(id);

    // Generate a new one with the same parameters
    return this.generateReport(
      {
        repositories: existingReport.repositories,
        weekStartDate: existingReport.weekStartDate,
        weekEndDate: existingReport.weekEndDate,
        includeAISummary: true,
      },
      generatedBy,
    );
  }

  /**
   * Export report as markdown
   */
  exportAsMarkdown(report: WeeklyReport): string {
    const startDate = new Date(report.weekStartDate);
    const endDate = new Date(report.weekEndDate);
    const weekNumber = this.getWeekNumber(startDate);

    let markdown = `# Week ${weekNumber}: ${this.formatDate(report.weekStartDate, "long")} - ${this.formatDate(report.weekEndDate, "long")}\n\n`;

    if (report.executiveSummary) {
      markdown += `## TL;DR (2-Minute Summary)\n\n${report.executiveSummary}\n\n---\n\n`;
    }

    markdown += `## Full Weekly Report\n\n`;

    for (const section of report.sections) {
      // Skip the TL;DR section in the full report as it's already included
      if (section.title.toLowerCase().includes("tl;dr")) continue;
      if (section.title.toLowerCase().includes("full weekly report")) continue;

      markdown += `### ${section.title}\n\n${section.content}\n\n`;
    }

    if (report.gitHubActivity && report.gitHubActivity.length > 0) {
      markdown += `### GitHub Activity Details\n\n`;
      for (const activity of report.gitHubActivity) {
        markdown += `#### ${activity.repository}\n\n`;
        markdown += `| Metric | Value |\n`;
        markdown += `| ------ | ----- |\n`;
        markdown += `| Commits | ${activity.commits.total} |\n`;
        markdown += `| PRs Opened | ${activity.pullRequests.opened} |\n`;
        markdown += `| PRs Merged | ${activity.pullRequests.merged} |\n`;
        markdown += `| Issues Opened | ${activity.issues.opened} |\n`;
        markdown += `| Issues Closed | ${activity.issues.closed} |\n\n`;

        if (activity.commits.authors.length > 0) {
          markdown += `**Top Contributors:**\n`;
          for (const author of activity.commits.authors.slice(0, 5)) {
            markdown += `- ${author.name}: ${author.count} commits\n`;
          }
          markdown += `\n`;
        }
      }
    }

    markdown += `---\n\n`;
    markdown += `_Report compiled: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}_\n`;

    return markdown;
  }

  /**
   * Export report as MDX for docs/progress folder
   */
  exportAsMDX(report: WeeklyReport): string {
    const startDate = new Date(report.weekStartDate);
    const endDate = new Date(report.weekEndDate);
    const weekNumber = this.getWeekNumber(startDate);
    const year = startDate.getFullYear();

    const startFormatted = this.formatDate(report.weekStartDate);
    const endFormatted = `${this.formatDate(report.weekEndDate)}, ${year}`;

    // Generate frontmatter
    let mdx = `---
title: "Week ${weekNumber}: ${startFormatted} - ${endFormatted}"
sidebar_label: "Week ${weekNumber} (${startFormatted.replace(",", "")}-${endFormatted.replace(`, ${year}`, "")})"
description: Weekly progress report generated from GitHub activity
keywords: [progress, weekly, development, github]
difficulty: beginner
timeEstimate: 5
xpReward: 75
phase: ["seed"]
---

import {
  SlideDeck,
  SlideSection,
  DocumentDownload,
} from "@site/src/components/Downloads";

# Week ${weekNumber}: ${this.formatDate(report.weekStartDate, "long")} - ${this.formatDate(report.weekEndDate, "long")}

<DocumentDownload title="Week ${weekNumber} Progress Report - Phoenix Rooivalk" />

`;

    // Add TL;DR section
    if (report.executiveSummary) {
      mdx += `## TL;DR (2-Minute Summary)\n\n${report.executiveSummary}\n\n---\n\n`;
    }

    // Add full report sections
    mdx += `## Full Weekly Report\n\n`;

    for (const section of report.sections) {
      // Skip sections already handled
      if (section.title.toLowerCase().includes("tl;dr")) continue;
      if (section.title.toLowerCase().includes("full weekly report")) continue;

      mdx += `### ${section.title}\n\n${section.content}\n\n`;
    }

    // Add GitHub activity
    if (report.gitHubActivity && report.gitHubActivity.length > 0) {
      mdx += `### GitHub Activity Summary\n\n`;
      mdx += `| Repository | Commits | PRs Merged | Issues Closed |\n`;
      mdx += `| ---------- | ------- | ---------- | ------------- |\n`;

      for (const activity of report.gitHubActivity) {
        mdx += `| ${activity.repository} | ${activity.commits.total} | ${activity.pullRequests.merged} | ${activity.issues.closed} |\n`;
      }

      mdx += `\n`;
    }

    mdx += `---\n\n`;
    mdx += `_Report compiled: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}_\n`;

    return mdx;
  }

  /**
   * Get the file path for saving an MDX report
   */
  getMDXFilePath(report: WeeklyReport): string {
    const startDate = new Date(report.weekStartDate);
    const weekNumber = this.getWeekNumber(startDate);
    const year = startDate.getFullYear();

    return `docs/progress/${year}/week-${weekNumber}.mdx`;
  }
}

/**
 * Singleton instance
 */
export const weeklyReportsService = new WeeklyReportsService();
