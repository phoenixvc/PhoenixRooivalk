/**
 * Weekly Reports Repository
 *
 * Data access layer for AI-generated weekly reports with GitHub integration.
 */

import {
  BaseRepository,
  BaseEntity,
  PaginationOptions,
  PaginatedResult,
} from "./base.repository";

/**
 * Report status
 */
export type ReportStatus = "generating" | "completed" | "failed";

/**
 * GitHub activity summary
 */
export interface GitHubActivitySummary {
  repository: string;
  commits: {
    total: number;
    authors: Array<{ name: string; count: number }>;
    highlights: string[];
  };
  pullRequests: {
    opened: number;
    merged: number;
    closed: number;
    highlights: string[];
  };
  issues: {
    opened: number;
    closed: number;
    highlights: string[];
  };
}

/**
 * Report section
 */
export interface ReportSection {
  title: string;
  content: string;
  highlights?: string[];
}

/**
 * Weekly report entity
 */
export interface WeeklyReport extends BaseEntity {
  reportNumber: string;
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  status: ReportStatus;
  generatedBy: string;

  // Report content
  executiveSummary?: string;
  sections: ReportSection[];

  // GitHub data
  gitHubActivity?: GitHubActivitySummary[];

  // Metadata
  repositories: string[];
  aiModel?: string;
  generationTimeMs?: number;
  errorMessage?: string;
}

/**
 * Weekly report query filters
 */
export interface WeeklyReportFilters {
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
  repository?: string;
}

/**
 * Weekly reports repository
 */
export class WeeklyReportsRepository extends BaseRepository<WeeklyReport> {
  constructor() {
    super("weekly_reports");
  }

  /**
   * Find reports with filters
   */
  async findWithFilters(
    filters: WeeklyReportFilters = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<WeeklyReport>> {
    const { limit = 20, offset = 0 } = options;
    const conditions: string[] = [];
    const parameters: Array<{ name: string; value: string }> = [];

    if (filters.status) {
      conditions.push("c.status = @status");
      parameters.push({ name: "@status", value: filters.status });
    }

    if (filters.startDate) {
      conditions.push("c.weekStartDate >= @startDate");
      parameters.push({ name: "@startDate", value: filters.startDate });
    }

    if (filters.endDate) {
      conditions.push("c.weekEndDate <= @endDate");
      parameters.push({ name: "@endDate", value: filters.endDate });
    }

    if (filters.repository) {
      conditions.push("ARRAY_CONTAINS(c.repositories, @repository)");
      parameters.push({ name: "@repository", value: filters.repository });
    }

    let query = "SELECT * FROM c";
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY c.weekStartDate DESC OFFSET ${offset} LIMIT ${limit + 1}`;

    const items = await this.query(query, parameters);
    const hasMore = items.length > limit;

    return {
      items: hasMore ? items.slice(0, limit) : items,
      hasMore,
    };
  }

  /**
   * Find the most recent report
   */
  async findMostRecent(): Promise<WeeklyReport | null> {
    const query =
      "SELECT * FROM c WHERE c.status = @status ORDER BY c.weekStartDate DESC OFFSET 0 LIMIT 1";
    const items = await this.query(query, [
      { name: "@status", value: "completed" },
    ]);
    return items[0] || null;
  }

  /**
   * Find report by week dates
   */
  async findByWeek(
    weekStartDate: string,
    weekEndDate: string,
  ): Promise<WeeklyReport | null> {
    const query =
      "SELECT * FROM c WHERE c.weekStartDate = @start AND c.weekEndDate = @end";
    const items = await this.query(query, [
      { name: "@start", value: weekStartDate },
      { name: "@end", value: weekEndDate },
    ]);
    return items[0] || null;
  }

  /**
   * Generate unique report number
   */
  generateReportNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `WR-${year}-W${week.toString().padStart(2, "0")}-${random}`;
  }

  /**
   * Get ISO week number
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
   * Update report status
   */
  async updateStatus(
    id: string,
    status: ReportStatus,
    errorMessage?: string,
  ): Promise<WeeklyReport | null> {
    const report = await this.findById(id);
    if (!report) return null;

    const updated: WeeklyReport = {
      ...report,
      status,
      errorMessage: errorMessage || report.errorMessage,
    };

    return this.save(updated);
  }

  /**
   * Get reports count by status
   */
  async getCountByStatus(): Promise<Record<ReportStatus, number>> {
    const query = "SELECT c.status, COUNT(1) as count FROM c GROUP BY c.status";
    const container = this.getContainerRef();
    const { resources } = await container.items
      .query<{ status: ReportStatus; count: number }>({ query })
      .fetchAll();

    const counts: Record<ReportStatus, number> = {
      generating: 0,
      completed: 0,
      failed: 0,
    };

    for (const item of resources) {
      if (item.status in counts) {
        counts[item.status as ReportStatus] = item.count;
      }
    }

    return counts;
  }
}

/**
 * Singleton instance
 */
export const weeklyReportsRepository = new WeeklyReportsRepository();
