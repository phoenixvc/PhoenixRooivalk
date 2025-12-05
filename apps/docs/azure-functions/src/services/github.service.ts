/**
 * GitHub Integration Service
 *
 * Fetches repository activity data from GitHub API for weekly reports.
 */

import { createLogger } from "../lib/logger";

const logger = createLogger({ feature: "github" });

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
}

/**
 * GitHub Service for fetching repository data
 */
class GitHubService {
  private baseUrl = "https://api.github.com";
  private token: string | null = null;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || null;
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
   * Make a GitHub API request
   */
  private async fetchApi<T>(
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });

    logger.debug("GitHub API request", { endpoint, params });

    const response = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("GitHub API error", new Error(error), {
        endpoint,
        status: response.status,
      });
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Fetch commits for a repository
   */
  async getCommits(options: GitHubApiOptions): Promise<GitHubCommit[]> {
    const { owner, repo, since, until, perPage = 100 } = options;

    try {
      const data = await this.fetchApi<
        Array<{
          sha: string;
          commit: {
            message: string;
            author: { name: string; email: string; date: string };
          };
          html_url: string;
        }>
      >(`/repos/${owner}/${repo}/commits`, {
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
  async getPullRequests(options: GitHubApiOptions): Promise<GitHubPullRequest[]> {
    const { owner, repo, since, perPage = 100 } = options;

    try {
      // Fetch both open and closed PRs
      const data = await this.fetchApi<
        Array<{
          number: number;
          title: string;
          state: "open" | "closed";
          merged_at: string | null;
          user: { login: string };
          created_at: string;
          closed_at: string | null;
          html_url: string;
          labels: Array<{ name: string }>;
        }>
      >(`/repos/${owner}/${repo}/pulls`, {
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: perPage.toString(),
      });

      const sinceDate = since ? new Date(since) : null;

      return data
        .filter((pr) => {
          if (!sinceDate) return true;
          const updatedAt = new Date(pr.created_at);
          return updatedAt >= sinceDate;
        })
        .map((pr) => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          merged: !!pr.merged_at,
          author: pr.user.login,
          createdAt: pr.created_at,
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
      const data = await this.fetchApi<
        Array<{
          number: number;
          title: string;
          state: "open" | "closed";
          user: { login: string };
          created_at: string;
          closed_at: string | null;
          html_url: string;
          labels: Array<{ name: string }>;
          pull_request?: object;
        }>
      >(`/repos/${owner}/${repo}/issues`, {
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
    const parts = repoString.split("/");
    if (parts.length !== 2) {
      logger.warn("Invalid repository format", { repoString });
      return null;
    }
    return { owner: parts[0], repo: parts[1] };
  }

  /**
   * Check if GitHub token is configured
   */
  isConfigured(): boolean {
    return !!this.token;
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
