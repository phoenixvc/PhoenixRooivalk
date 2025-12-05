/**
 * Weekly Reports Service
 *
 * Business logic for generating AI-powered weekly reports with GitHub integration.
 */

import { generateCompletion } from "../lib/openai";
import { createLogger } from "../lib/logger";
import {
  weeklyReportsRepository,
  WeeklyReport,
  ReportSection,
  GitHubActivitySummary,
  WeeklyReportFilters,
} from "../repositories/weekly-reports.repository";
import {
  gitHubService,
  RepositoryActivity,
} from "./github.service";
import { PaginatedResult, PaginationOptions } from "../repositories/base.repository";

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
   * Get week date range (Monday to Sunday)
   */
  private getWeekDateRange(referenceDate?: Date): {
    start: string;
    end: string;
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
    };
  }

  /**
   * Generate AI summary from GitHub activity
   */
  private async generateAISummary(
    activities: RepositoryActivity[],
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
          .slice(0, 10)
          .map((pr) => `- [${pr.merged ? "MERGED" : pr.state.toUpperCase()}] #${pr.number}: ${pr.title}`)
          .join("\n");

        const issueSummary = activity.issues
          .slice(0, 10)
          .map((issue) => `- [${issue.state.toUpperCase()}] #${issue.number}: ${issue.title}`)
          .join("\n");

        return `
Repository: ${activity.owner}/${activity.repository}
Commits: ${activity.commits.length}
Top Contributors: ${commitAuthors || "None"}

Recent Commit Messages:
${activity.commits.slice(0, 10).map((c) => `- ${c.message}`).join("\n") || "None"}

Pull Requests (${activity.pullRequests.length} total):
${prSummary || "None"}

Issues (${activity.issues.length} total):
${issueSummary || "None"}
`;
      })
      .join("\n---\n");

    const systemPrompt = `You are a technical writer creating a weekly development report.
Your task is to analyze the GitHub activity data and create a professional, concise report.

Guidelines:
- Be factual and specific about what was accomplished
- Highlight significant changes, features, and fixes
- Group related work together logically
- Use clear, professional language
- Focus on impact and outcomes, not just activity

Output format (use Markdown):
Start with an executive summary (2-3 sentences), then provide sections for:
1. Key Accomplishments
2. Technical Highlights
3. Pull Requests Summary
4. Issues & Bug Fixes
5. Team Activity
6. Next Steps (if apparent from the data)`;

    const userPrompt = customPrompt
      ? `${customPrompt}\n\nGitHub Activity Data:\n${activitySummary}`
      : `Generate a weekly development report from the following GitHub activity data:\n\n${activitySummary}`;

    logger.info("Generating AI summary for weekly report");

    const aiResponse = await generateCompletion(systemPrompt, userPrompt, {
      maxTokens: 3000,
      temperature: 0.5,
    });

    // Parse the AI response into sections
    const sections: ReportSection[] = [];
    const lines = aiResponse.split("\n");
    let currentSection: ReportSection | null = null;
    let executiveSummary = "";
    let inExecutiveSummary = true;

    for (const line of lines) {
      // Check for section headers (## or ###)
      const headerMatch = line.match(/^#{1,3}\s+(.+)$/);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        inExecutiveSummary = false;
        currentSection = {
          title: headerMatch[1].trim(),
          content: "",
          highlights: [],
        };
      } else if (currentSection) {
        currentSection.content += line + "\n";
        // Extract bullet points as highlights
        if (line.match(/^[-*]\s+/)) {
          currentSection.highlights?.push(line.replace(/^[-*]\s+/, "").trim());
        }
      } else if (inExecutiveSummary && line.trim()) {
        executiveSummary += line + " ";
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
        error: "GitHub token not configured. Set GITHUB_TOKEN environment variable.",
      };
    }

    // Get week date range
    const { start, end } = options.weekStartDate && options.weekEndDate
      ? { start: options.weekStartDate, end: options.weekEndDate }
      : this.getWeekDateRange();

    logger.info("Generating weekly report", {
      repositories: options.repositories,
      startDate: start,
      endDate: end,
      generatedBy,
    });

    // Create initial report record
    const reportNumber = weeklyReportsRepository.generateReportNumber();
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const initialReport: WeeklyReport = {
      id: reportId,
      reportNumber,
      title: `Weekly Report ${new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      weekStartDate: start,
      weekEndDate: end,
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
        start,
        end,
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

      // Update report with results
      const completedReport: WeeklyReport = {
        ...initialReport,
        status: "completed",
        executiveSummary,
        sections,
        gitHubActivity,
        aiModel: "gpt-4",
        generationTimeMs,
      };

      const savedReport = await weeklyReportsRepository.save(completedReport);

      logger.info("Weekly report generated successfully", {
        reportNumber,
        generationTimeMs,
        repositoriesCount: repos.length,
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
    let markdown = `# ${report.title}\n\n`;
    markdown += `**Report Number:** ${report.reportNumber}\n`;
    markdown += `**Period:** ${new Date(report.weekStartDate).toLocaleDateString()} - ${new Date(report.weekEndDate).toLocaleDateString()}\n`;
    markdown += `**Generated:** ${new Date(report.createdAt || "").toLocaleString()}\n\n`;

    if (report.executiveSummary) {
      markdown += `## Executive Summary\n\n${report.executiveSummary}\n\n`;
    }

    for (const section of report.sections) {
      markdown += `## ${section.title}\n\n${section.content}\n\n`;
    }

    if (report.gitHubActivity && report.gitHubActivity.length > 0) {
      markdown += `## GitHub Activity Details\n\n`;
      for (const activity of report.gitHubActivity) {
        markdown += `### ${activity.repository}\n\n`;
        markdown += `- **Commits:** ${activity.commits.total}\n`;
        markdown += `- **PRs Merged:** ${activity.pullRequests.merged}\n`;
        markdown += `- **Issues Closed:** ${activity.issues.closed}\n\n`;
      }
    }

    return markdown;
  }
}

/**
 * Singleton instance
 */
export const weeklyReportsService = new WeeklyReportsService();
