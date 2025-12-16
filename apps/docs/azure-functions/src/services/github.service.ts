/**
 * GitHub Integration Service
 *
 * Fetches repository activity data from GitHub API for weekly reports.
 * Includes rate limit handling, retry logic, and pagination support.
 */

import { createLogger } from "../lib/logger";

const logger = createLogger({ feature: "github" });

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Sanitize error message to remove any potential token exposure
 */
function sanitizeErrorMessage(message: string): string {
  // Remove any Bearer tokens that might appear in error messages
  return message
    .replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, "Bearer [REDACTED]")
    .replace(/token[=:]\s*[a-zA-Z0-9_-]+/gi, "token=[REDACTED]")
    .replace(/ghp_[a-zA-Z0-9]+/g, "[REDACTED_TOKEN]")
    .replace(/gho_[a-zA-Z0-9]+/g, "[REDACTED_TOKEN]")
    .replace(/github_pat_[a-zA-Z0-9_]+/g, "[REDACTED_TOKEN]");
}

/**
 * GitHub commit data
 */
export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

/**
 * GitHub pull request data
 */
export interface GitHubPullRequest {
  number: number;
  title: string;
  state: "open" | "closed";
  merged: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  mergedAt?: string;
  url: string;
  labels: string[];
}

/**
 * GitHub issue data
 */
export interface GitHubIssue {
  number: number;
  title: string;
  state: "open" | "closed";
  author: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  url: string;
  labels: string[];
}

/**
 * Repository activity data
 */
export interface RepositoryActivity {
  repository: string;
  owner: string;
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
  issues: GitHubIssue[];
  contributors: Map<string, number>;
}

/**
 * GitHub API options
 */
interface GitHubApiOptions {
  owner: string;
  repo: string;
  since?: string;
  until?: string;
  perPage?: number;
  page?: number;
}

/**
 * Rate limit info from GitHub headers
 */
interface RateLimitInfo {
  remaining: number;
  reset: Date;
  limit: number;
}

/**
 * GitHub Service for fetching repository data
 */
class GitHubService {
  private baseUrl = "https://api.github.com";
  private rateLimitInfo: RateLimitInfo | null = null;

  /**
   * Get GitHub token lazily from environment
   * This allows token changes without service restart
   */
  private get token(): string | null {
    return process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || null;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Phoenix-Rooivalk-Reports",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Parse rate limit headers from response
   */
  private parseRateLimitHeaders(response: Response): RateLimitInfo {
    const remaining = parseInt(
      response.headers.get("x-ratelimit-remaining") || "0",
      10,
    );
    const reset = new Date(
      parseInt(response.headers.get("x-ratelimit-reset") || "0", 10) * 1000,
    );
    const limit = parseInt(
      response.headers.get("x-ratelimit-limit") || "0",
      10,
    );

    return { remaining, reset, limit };
  }

  /**
   * Wait for rate limit reset if needed
   */
  private async waitForRateLimitReset(): Promise<void> {
    if (!this.rateLimitInfo || this.rateLimitInfo.remaining > 0) {
      return;
    }

    const now = new Date();
    const waitMs = this.rateLimitInfo.reset.getTime() - now.getTime();

    if (waitMs > 0) {
      logger.warn("Rate limit hit, waiting for reset", {
        resetAt: this.rateLimitInfo.reset.toISOString(),
        waitMs,
      });
      await sleep(Math.min(waitMs + 1000, 60000)); // Max 60s wait
    }
  }

  /**
   * Make a GitHub API request with retry logic
   */
  private async fetchApi<T>(
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        // Check rate limit before request
        await this.waitForRateLimitReset();

        logger.debug("GitHub API request", { endpoint, params, attempt });

        const response = await fetch(url.toString(), {
          headers: this.getHeaders(),
        });

        // Update rate limit info
        this.rateLimitInfo = this.parseRateLimitHeaders(response);

        // Handle rate limit exceeded (403 with specific header)
        if (response.status === 403 && this.rateLimitInfo.remaining === 0) {
          logger.warn("Rate limit exceeded", {
            endpoint,
            reset: this.rateLimitInfo.reset.toISOString(),
          });
          await this.waitForRateLimitReset();
          continue; // Retry after waiting
        }

        // Handle other errors
        if (!response.ok) {
          const errorText = await response.text();
          const sanitizedError = sanitizeErrorMessage(errorText);

          // Don't retry on 4xx errors (except 403 rate limit)
          if (response.status >= 400 && response.status < 500) {
            logger.error("GitHub API client error", new Error(sanitizedError), {
              endpoint,
              status: response.status,
            });
            throw new Error(
              `GitHub API error: ${response.status} - ${sanitizedError}`,
            );
          }

          // Retry on 5xx errors
          throw new Error(
            `GitHub API error: ${response.status} - ${sanitizedError}`,
          );
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;

        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = getRetryDelay(attempt);
          logger.warn("GitHub API request failed, retrying", {
            endpoint,
            attempt: attempt + 1,
            maxRetries: RETRY_CONFIG.maxRetries,
            delayMs: delay,
            error: lastError.message,
          });
          await sleep(delay);
        }
      }
    }

    logger.error("GitHub API request failed after retries", lastError!, {
      endpoint,
    });
    throw lastError;
  }

  /**
   * Fetch all pages for a paginated endpoint
   */
  private async fetchAllPages<T>(
    endpoint: string,
    params: Record<string, string> = {},
    maxPages = 5,
  ): Promise<T[]> {
    const allItems: T[] = [];
    let page = 1;
    const perPage = parseInt(params.per_page || "100", 10);

    while (page <= maxPages) {
      const pageParams = { ...params, page: page.toString() };
      const items = await this.fetchApi<T[]>(endpoint, pageParams);

      allItems.push(...items);

      // If we got fewer items than per_page, we've reached the end
      if (items.length < perPage) {
        break;
      }

      page++;
    }

    return allItems;
  }

  /**
   * Fetch commits for a repository
   */
  async getCommits(options: GitHubApiOptions): Promise<GitHubCommit[]> {
    const { owner, repo, since, until, perPage = 100 } = options;

    try {
      const data = await this.fetchAllPages<{
        sha: string;
        commit: {
          message: string;
          author: { name: string; email: string; date: string };
        };
        html_url: string;
      }>(`/repos/${owner}/${repo}/commits`, {
        since: since || "",
        until: until || "",
        per_page: perPage.toString(),
      });

      return data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message.split("\n")[0], // First line only
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
        },
        url: commit.html_url,
      }));
    } catch (error) {
      logger.error("Failed to fetch commits", error as Error, { owner, repo });
      return [];
    }
  }

  /**
   * Fetch pull requests for a repository
   */
  async getPullRequests(
    options: GitHubApiOptions,
  ): Promise<GitHubPullRequest[]> {
    const { owner, repo, since, perPage = 100 } = options;

    try {
      // Fetch both open and closed PRs
      const data = await this.fetchAllPages<{
        number: number;
        title: string;
        state: "open" | "closed";
        merged_at: string | null;
        user: { login: string };
        created_at: string;
        updated_at: string;
        closed_at: string | null;
        html_url: string;
        labels: Array<{ name: string }>;
      }>(`/repos/${owner}/${repo}/pulls`, {
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: perPage.toString(),
      });

      const sinceDate = since ? new Date(since) : null;

      return data
        .filter((pr) => {
          if (!sinceDate) return true;
          // Filter by updated_at since we're sorting by updated
          const updatedAt = new Date(pr.updated_at);
          return updatedAt >= sinceDate;
        })
        .map((pr) => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          merged: !!pr.merged_at,
          author: pr.user.login,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          closedAt: pr.closed_at || undefined,
          mergedAt: pr.merged_at || undefined,
          url: pr.html_url,
          labels: pr.labels.map((l) => l.name),
        }));
    } catch (error) {
      logger.error("Failed to fetch pull requests", error as Error, {
        owner,
        repo,
      });
      return [];
    }
  }

  /**
   * Fetch issues for a repository
   */
  async getIssues(options: GitHubApiOptions): Promise<GitHubIssue[]> {
    const { owner, repo, since, perPage = 100 } = options;

    try {
      const data = await this.fetchAllPages<{
        number: number;
        title: string;
        state: "open" | "closed";
        user: { login: string };
        created_at: string;
        updated_at: string;
        closed_at: string | null;
        html_url: string;
        labels: Array<{ name: string }>;
        pull_request?: object;
      }>(`/repos/${owner}/${repo}/issues`, {
        state: "all",
        sort: "updated",
        direction: "desc",
        since: since || "",
        per_page: perPage.toString(),
      });

      // Filter out pull requests (they appear in issues API too)
      return data
        .filter((issue) => !issue.pull_request)
        .map((issue) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          author: issue.user.login,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          closedAt: issue.closed_at || undefined,
          url: issue.html_url,
          labels: issue.labels.map((l) => l.name),
        }));
    } catch (error) {
      logger.error("Failed to fetch issues", error as Error, { owner, repo });
      return [];
    }
  }

  /**
   * Get full repository activity
   */
  async getRepositoryActivity(
    owner: string,
    repo: string,
    startDate: string,
    endDate: string,
  ): Promise<RepositoryActivity> {
    logger.info("Fetching repository activity", {
      owner,
      repo,
      startDate,
      endDate,
    });

    const [commits, pullRequests, issues] = await Promise.all([
      this.getCommits({ owner, repo, since: startDate, until: endDate }),
      this.getPullRequests({ owner, repo, since: startDate }),
      this.getIssues({ owner, repo, since: startDate }),
    ]);

    // Count contributions by author
    const contributors = new Map<string, number>();
    for (const commit of commits) {
      const name = commit.author.name;
      contributors.set(name, (contributors.get(name) || 0) + 1);
    }

    return {
      repository: repo,
      owner,
      commits,
      pullRequests,
      issues,
      contributors,
    };
  }

  /**
   * Get activity for multiple repositories
   */
  async getMultiRepoActivity(
    repositories: Array<{ owner: string; repo: string }>,
    startDate: string,
    endDate: string,
  ): Promise<RepositoryActivity[]> {
    const activities = await Promise.all(
      repositories.map((r) =>
        this.getRepositoryActivity(r.owner, r.repo, startDate, endDate),
      ),
    );
    return activities;
  }

  /**
   * Parse repository string (owner/repo format)
   */
  parseRepository(repoString: string): { owner: string; repo: string } | null {
    // Basic input validation
    if (!repoString || typeof repoString !== "string") {
      logger.warn("Invalid repository input", { repoString });
      return null;
    }

    // Trim and check format
    const trimmed = repoString.trim();
    const parts = trimmed.split("/");

    if (parts.length !== 2) {
      logger.warn("Invalid repository format", { repoString: trimmed });
      return null;
    }

    const [owner, repo] = parts;

    // Validate owner and repo names (GitHub naming rules)
    const validNamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
    if (!validNamePattern.test(owner) || !validNamePattern.test(repo)) {
      logger.warn("Invalid repository name characters", { owner, repo });
      return null;
    }

    return { owner, repo };
  }

  /**
   * Check if GitHub token is configured
   */
  isConfigured(): boolean {
    return !!this.token;
  }

  /**
   * Get configuration error message if not configured
   * Returns null if properly configured
   */
  getConfigurationError(): string | null {
    if (!this.token) {
      return "GitHub integration not configured. Set GITHUB_TOKEN or GITHUB_PAT environment variable to enable repository activity fetching.";
    }
    return null;
  }

  /**
   * Require GitHub configuration or throw descriptive error
   */
  requireConfiguration(): void {
    const error = this.getConfigurationError();
    if (error) {
      throw new Error(error);
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Validate repository access
   */
  async validateRepository(owner: string, repo: string): Promise<boolean> {
    try {
      await this.fetchApi<object>(`/repos/${owner}/${repo}`);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const gitHubService = new GitHubService();
