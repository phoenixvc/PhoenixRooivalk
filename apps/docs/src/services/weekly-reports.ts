/**
 * Weekly Reports Service
 *
 * Frontend service for generating and managing AI-powered weekly reports.
 */

import { getAuthService } from "./cloud";

const API_BASE = process.env.AZURE_FUNCTIONS_BASE_URL || "/api";

/**
 * Report status types
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
 * Weekly report data
 */
export interface WeeklyReport {
  id: string;
  reportNumber: string;
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  status: ReportStatus;
  generatedBy: string;
  executiveSummary?: string;
  sections: ReportSection[];
  gitHubActivity?: GitHubActivitySummary[];
  repositories: string[];
  aiModel?: string;
  generationTimeMs?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

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
 * Report counts
 */
export interface ReportCounts {
  generating: number;
  completed: number;
  failed: number;
}

/**
 * Get authorization header with current user's token
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  const auth = getAuthService();
  const token = await auth.getIdToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

/**
 * Generate a new weekly report
 */
export async function generateWeeklyReport(
  options: GenerateReportOptions,
): Promise<{ success: boolean; report?: WeeklyReport; error?: string }> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/reports/weekly`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(options),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to generate report",
      };
    }

    return {
      success: true,
      report: result.report,
    };
  } catch (error) {
    console.error("Error generating weekly report:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

/**
 * Get all weekly reports
 */
export async function getWeeklyReports(filters?: {
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
  repository?: string;
  limit?: number;
}): Promise<{ reports: WeeklyReport[]; hasMore: boolean }> {
  try {
    const headers = await getAuthHeader();
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.repository) params.set("repository", filters.repository);
    if (filters?.limit) params.set("limit", filters.limit.toString());

    const url = `${API_BASE}/reports/weekly${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      return { reports: [], hasMore: false };
    }

    const result = await response.json();
    return {
      reports: result.reports || [],
      hasMore: result.hasMore || false,
    };
  } catch (error) {
    console.error("Error fetching weekly reports:", error);
    return { reports: [], hasMore: false };
  }
}

/**
 * Get a single weekly report
 */
export async function getWeeklyReport(id: string): Promise<WeeklyReport | null> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/reports/weekly/${id}`, {
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.report || null;
  } catch (error) {
    console.error("Error fetching weekly report:", error);
    return null;
  }
}

/**
 * Get most recent weekly report
 */
export async function getMostRecentReport(): Promise<WeeklyReport | null> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/reports/weekly/recent`, {
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.report || null;
  } catch (error) {
    console.error("Error fetching most recent report:", error);
    return null;
  }
}

/**
 * Delete a weekly report
 */
export async function deleteWeeklyReport(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/reports/weekly/${id}`, {
      method: "DELETE",
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to delete report",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting weekly report:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

/**
 * Regenerate a weekly report
 */
export async function regenerateWeeklyReport(
  id: string,
): Promise<{ success: boolean; report?: WeeklyReport; error?: string }> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/reports/weekly/${id}/regenerate`, {
      method: "POST",
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to regenerate report",
      };
    }

    return {
      success: true,
      report: result.report,
    };
  } catch (error) {
    console.error("Error regenerating weekly report:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

/**
 * Export report as markdown
 */
export async function exportReportAsMarkdown(id: string): Promise<string | null> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/reports/weekly/${id}/export`, {
      headers,
    });

    if (!response.ok) {
      return null;
    }

    return response.text();
  } catch (error) {
    console.error("Error exporting report:", error);
    return null;
  }
}

/**
 * Export report as MDX for docs/progress folder
 */
export async function exportReportAsMDX(
  id: string,
): Promise<{ content: string; filePath: string } | null> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/reports/weekly/${id}/export-mdx`, {
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const content = await response.text();
    const filePath = response.headers.get("X-MDX-Path") || "report.mdx";

    return { content, filePath };
  } catch (error) {
    console.error("Error exporting report as MDX:", error);
    return null;
  }
}

/**
 * Get report counts
 */
export async function getReportCounts(): Promise<ReportCounts> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/reports/weekly/counts`, {
      headers,
    });

    if (!response.ok) {
      return { generating: 0, completed: 0, failed: 0 };
    }

    const result = await response.json();
    return result.counts || { generating: 0, completed: 0, failed: 0 };
  } catch (error) {
    console.error("Error fetching report counts:", error);
    return { generating: 0, completed: 0, failed: 0 };
  }
}

/**
 * Validate a GitHub repository
 */
export async function validateGitHubRepository(
  repository: string,
): Promise<{ valid: boolean; configured: boolean }> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(
      `${API_BASE}/reports/github/validate?repository=${encodeURIComponent(repository)}`,
      { headers },
    );

    if (!response.ok) {
      return { valid: false, configured: false };
    }

    const result = await response.json();
    return {
      valid: result.valid || false,
      configured: result.configured || false,
    };
  } catch (error) {
    console.error("Error validating repository:", error);
    return { valid: false, configured: false };
  }
}

/**
 * Check GitHub configuration status
 */
export async function checkGitHubConfig(): Promise<{ configured: boolean }> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/reports/github/config`, {
      headers,
    });

    if (!response.ok) {
      return { configured: false };
    }

    const result = await response.json();
    return { configured: result.configured || false };
  } catch (error) {
    console.error("Error checking GitHub config:", error);
    return { configured: false };
  }
}
