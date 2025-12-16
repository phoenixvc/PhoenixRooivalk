/**
 * Admin Weekly Reports Dashboard
 *
 * Admin page for generating and managing AI-powered weekly reports.
 * Includes polling for generating reports, date picker, and full report view.
 */

import Layout from "@theme/Layout";
import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getWeeklyReports,
  getWeeklyReport,
  generateWeeklyReport,
  deleteWeeklyReport,
  regenerateWeeklyReport,
  exportReportAsMarkdown,
  exportReportAsMDX,
  getReportCounts,
  checkGitHubConfig,
  validateGitHubRepository,
  WeeklyReport,
  ReportStatus,
  ReportCounts,
} from "../../services/weekly-reports";

import styles from "./reports.module.css";

// Polling interval for generating reports (5 seconds)
const POLL_INTERVAL = 5000;

export default function ReportsAdminPage(): React.ReactElement {
  const { user, loading, userProfile } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [counts, setCounts] = useState<ReportCounts>({
    generating: 0,
    completed: 0,
    failed: 0,
  });
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(
    null,
  );
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showFullReportModal, setShowFullReportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gitHubConfigured, setGitHubConfigured] = useState(false);

  // Generate form state
  const [repositories, setRepositories] = useState<string[]>([
    "JustAGhosT/PhoenixRooivalk",
  ]);
  const [newRepo, setNewRepo] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generateError, setGenerateError] = useState("");

  // Date range state
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState("");
  const [weekEndDate, setWeekEndDate] = useState("");

  // Polling ref
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is admin
  const isAdmin = userProfile.isInternalDomain;

  // Get default week dates (current week, Monday to Sunday)
  const getDefaultWeekDates = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  }, []);

  // Initialize default dates
  useEffect(() => {
    const { start, end } = getDefaultWeekDates();
    setWeekStartDate(start);
    setWeekEndDate(end);
  }, [getDefaultWeekDates]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reportsResult, countsResult, configResult] = await Promise.all([
        getWeeklyReports({
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        getReportCounts(),
        checkGitHubConfig(),
      ]);
      setReports(reportsResult.reports);
      setCounts(countsResult);
      setGitHubConfigured(configResult.configured);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  // Poll for generating reports
  const pollGeneratingReports = useCallback(async () => {
    const generatingReports = reports.filter((r) => r.status === "generating");

    if (generatingReports.length === 0) {
      return;
    }

    // Check each generating report
    for (const report of generatingReports) {
      try {
        const updated = await getWeeklyReport(report.id);
        if (updated && updated.status !== "generating") {
          // Report finished, refresh the list
          await fetchReports();
          // Update selected report if it was being watched
          if (selectedReport?.id === report.id) {
            setSelectedReport(updated);
          }
          break;
        }
      } catch (error) {
        console.error("Error polling report:", error);
      }
    }
  }, [reports, selectedReport, fetchReports]);

  // Set up polling for generating reports
  useEffect(() => {
    const hasGenerating = reports.some((r) => r.status === "generating");

    if (hasGenerating) {
      pollIntervalRef.current = setInterval(
        pollGeneratingReports,
        POLL_INTERVAL,
      );
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [reports, pollGeneratingReports]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchReports();
    }
  }, [user, isAdmin, fetchReports]);

  // Handle add repository
  const handleAddRepo = async () => {
    if (!newRepo.trim()) return;

    const result = await validateGitHubRepository(newRepo.trim());
    if (!result.valid) {
      setGenerateError(
        `Invalid repository: ${newRepo}. Make sure it exists and is accessible.`,
      );
      return;
    }

    if (!repositories.includes(newRepo.trim())) {
      setRepositories([...repositories, newRepo.trim()]);
    }
    setNewRepo("");
    setGenerateError("");
  };

  // Handle remove repository
  const handleRemoveRepo = (repo: string) => {
    setRepositories(repositories.filter((r) => r !== repo));
  };

  // Handle generate report
  const handleGenerateReport = async () => {
    if (repositories.length === 0) {
      setGenerateError("At least one repository is required");
      return;
    }

    setIsGenerating(true);
    setGenerateError("");

    try {
      const options: {
        repositories: string[];
        includeAISummary: boolean;
        customPrompt?: string;
        weekStartDate?: string;
        weekEndDate?: string;
      } = {
        repositories,
        includeAISummary: true,
        customPrompt: customPrompt || undefined,
      };

      if (useCustomDates && weekStartDate && weekEndDate) {
        options.weekStartDate = new Date(weekStartDate).toISOString();
        options.weekEndDate = new Date(weekEndDate).toISOString();
      }

      const result = await generateWeeklyReport(options);

      if (result.success) {
        setShowGenerateModal(false);
        setCustomPrompt("");
        await fetchReports();
        if (result.report) {
          setSelectedReport(result.report);
        }
      } else {
        setGenerateError(result.error || "Failed to generate report");
      }
    } catch (error) {
      setGenerateError("An error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle delete report
  const handleDeleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    const result = await deleteWeeklyReport(id);
    if (result.success) {
      await fetchReports();
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } else {
      alert(result.error || "Failed to delete report");
    }
  };

  // Handle regenerate report
  const handleRegenerateReport = async (id: string) => {
    if (
      !confirm("Regenerate this report? The current version will be replaced.")
    )
      return;

    const result = await regenerateWeeklyReport(id);
    if (result.success) {
      await fetchReports();
      if (result.report) {
        setSelectedReport(result.report);
      }
    } else {
      alert(result.error || "Failed to regenerate report");
    }
  };

  // Handle export report as markdown
  const handleExportMarkdown = async (id: string) => {
    const markdown = await exportReportAsMarkdown(id);
    if (markdown) {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedReport?.reportNumber || "report"}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle export report as MDX
  const handleExportMDX = async (id: string) => {
    const result = await exportReportAsMDX(id);
    if (result) {
      const blob = new Blob([result.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filePath.split("/").pop() || "report.mdx";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusClass = (status: ReportStatus) => {
    switch (status) {
      case "completed":
        return styles.statusCompleted;
      case "generating":
        return styles.statusGenerating;
      case "failed":
        return styles.statusFailed;
      default:
        return "";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Layout title="Weekly Reports">
        <main className={styles.main}>
          <div className={styles.loading}>Loading...</div>
        </main>
      </Layout>
    );
  }

  // Show unauthorized message for non-admins
  if (!user || !isAdmin) {
    return (
      <Layout title="Weekly Reports">
        <main className={styles.main}>
          <div className={styles.unauthorized}>
            <h1>Access Denied</h1>
            <p>
              You don't have permission to view this page. Only internal team
              members can access the reports dashboard.
            </p>
            <a href="/login" className="button button--primary">
              Sign In
            </a>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout
      title="Weekly Reports"
      description="Generate and manage AI-powered weekly reports"
    >
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>Weekly Reports</h1>
              <p>
                AI-generated weekly development reports with GitHub integration
              </p>
            </div>
            <button
              type="button"
              className={`button button--primary ${styles.generateBtn}`}
              onClick={() => setShowGenerateModal(true)}
              disabled={!gitHubConfigured}
            >
              + Generate Report
            </button>
          </div>
          {!gitHubConfigured && (
            <div className={styles.warning}>
              GitHub token not configured. Set GITHUB_TOKEN environment variable
              to enable report generation.
            </div>
          )}
        </header>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={`${styles.statCard} ${styles.statCompleted}`}>
            <span className={styles.statValue}>{counts.completed}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={`${styles.statCard} ${styles.statGenerating}`}>
            <span className={styles.statValue}>{counts.generating}</span>
            <span className={styles.statLabel}>Generating</span>
          </div>
          <div className={`${styles.statCard} ${styles.statFailed}`}>
            <span className={styles.statValue}>{counts.failed}</span>
            <span className={styles.statLabel}>Failed</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "all" ? styles.active : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "completed" ? styles.active : ""}`}
            onClick={() => setStatusFilter("completed")}
          >
            Completed
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "generating" ? styles.active : ""}`}
            onClick={() => setStatusFilter("generating")}
          >
            Generating
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "failed" ? styles.active : ""}`}
            onClick={() => setStatusFilter("failed")}
          >
            Failed
          </button>
        </div>

        {/* Generate Modal */}
        {showGenerateModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowGenerateModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Generate Weekly Report</h2>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setShowGenerateModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className={styles.modalContent}>
                {generateError && (
                  <div className={styles.error}>{generateError}</div>
                )}

                <div className={styles.formGroup}>
                  <label>GitHub Repositories</label>
                  <div className={styles.repoList}>
                    {repositories.map((repo) => (
                      <div key={repo} className={styles.repoTag}>
                        <span>{repo}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRepo(repo)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className={styles.addRepo}>
                    <input
                      type="text"
                      placeholder="owner/repository"
                      value={newRepo}
                      onChange={(e) => setNewRepo(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddRepo()}
                    />
                    <button type="button" onClick={handleAddRepo}>
                      Add
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={useCustomDates}
                      onChange={(e) => setUseCustomDates(e.target.checked)}
                    />
                    <span>Use custom date range</span>
                  </label>
                  {useCustomDates && (
                    <div className={styles.dateRange}>
                      <div>
                        <label>Start Date</label>
                        <input
                          type="date"
                          value={weekStartDate}
                          onChange={(e) => setWeekStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>End Date</label>
                        <input
                          type="date"
                          value={weekEndDate}
                          onChange={(e) => setWeekEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Custom Instructions (optional)</label>
                  <textarea
                    placeholder="Add any specific focus areas or instructions for the AI..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setShowGenerateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleGenerateReport}
                    disabled={isGenerating || repositories.length === 0}
                  >
                    {isGenerating ? "Generating..." : "Generate Report"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Report Modal */}
        {showFullReportModal && selectedReport && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowFullReportModal(false)}
          >
            <div
              className={`${styles.modal} ${styles.fullReportModal}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{selectedReport.title}</h2>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setShowFullReportModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className={styles.fullReportContent}>
                {selectedReport.executiveSummary && (
                  <div className={styles.fullReportSection}>
                    <h3>TL;DR Summary</h3>
                    <div className={styles.markdownContent}>
                      {selectedReport.executiveSummary}
                    </div>
                  </div>
                )}

                {selectedReport.sections.map((section, index) => (
                  <div key={index} className={styles.fullReportSection}>
                    <h3>{section.title}</h3>
                    <div className={styles.markdownContent}>
                      {section.content}
                    </div>
                  </div>
                ))}

                {selectedReport.gitHubActivity &&
                  selectedReport.gitHubActivity.length > 0 && (
                    <div className={styles.fullReportSection}>
                      <h3>GitHub Activity</h3>
                      <table className={styles.activityTable}>
                        <thead>
                          <tr>
                            <th>Repository</th>
                            <th>Commits</th>
                            <th>PRs Merged</th>
                            <th>Issues Closed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.gitHubActivity.map(
                            (activity, idx) => (
                              <tr key={idx}>
                                <td>{activity.repository}</td>
                                <td>{activity.commits.total}</td>
                                <td>{activity.pullRequests.merged}</td>
                                <td>{activity.issues.closed}</td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowFullReportModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => handleExportMDX(selectedReport.id)}
                >
                  Export as MDX
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reports list */}
        <div className={styles.reportsList}>
          {isLoading ? (
            <div className={styles.loadingList}>Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className={styles.emptyList}>
              <p>
                {statusFilter !== "all"
                  ? `No ${statusFilter} reports found.`
                  : "No reports generated yet."}
              </p>
              {statusFilter === "all" && gitHubConfigured && (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => setShowGenerateModal(true)}
                >
                  Generate Your First Report
                </button>
              )}
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className={`${styles.reportCard} ${selectedReport?.id === report.id ? styles.selected : ""}`}
                onClick={() => setSelectedReport(report)}
                onKeyDown={(e) =>
                  e.key === "Enter" && setSelectedReport(report)
                }
                role="button"
                tabIndex={0}
              >
                <div className={styles.reportHeader}>
                  <span className={styles.reportNumber}>
                    {report.reportNumber}
                  </span>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(report.status)}`}
                  >
                    {report.status}
                    {report.status === "generating" && (
                      <span className={styles.pollingIndicator}></span>
                    )}
                  </span>
                </div>
                <div className={styles.reportBody}>
                  <h3>{report.title}</h3>
                  <p className={styles.reportPeriod}>
                    {formatDate(report.weekStartDate)} -{" "}
                    {formatDate(report.weekEndDate)}
                  </p>
                  <p className={styles.reportRepos}>
                    {report.repositories.length} repositor
                    {report.repositories.length === 1 ? "y" : "ies"}
                  </p>
                </div>
                <div className={styles.reportFooter}>
                  <span className={styles.reportDate}>
                    Generated {formatDate(report.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selectedReport && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <h2>Report Details</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedReport(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailSection}>
                <h4>Report Information</h4>
                <p>
                  <strong>Number:</strong> {selectedReport.reportNumber}
                </p>
                <p>
                  <strong>Title:</strong> {selectedReport.title}
                </p>
                <p>
                  <strong>Period:</strong>{" "}
                  {formatDate(selectedReport.weekStartDate)} -{" "}
                  {formatDate(selectedReport.weekEndDate)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(selectedReport.status)}`}
                  >
                    {selectedReport.status}
                  </span>
                </p>
                {selectedReport.aiModel && (
                  <p>
                    <strong>AI Model:</strong> {selectedReport.aiModel}
                  </p>
                )}
                {selectedReport.generationTimeMs && (
                  <p>
                    <strong>Generation Time:</strong>{" "}
                    {(selectedReport.generationTimeMs / 1000).toFixed(1)}s
                  </p>
                )}
              </div>

              <div className={styles.detailSection}>
                <h4>Repositories</h4>
                <div className={styles.repoList}>
                  {selectedReport.repositories.map((repo) => (
                    <span key={repo} className={styles.repoTag}>
                      {repo}
                    </span>
                  ))}
                </div>
              </div>

              {selectedReport.executiveSummary && (
                <div className={styles.detailSection}>
                  <h4>Executive Summary</h4>
                  <div className={styles.summaryText}>
                    {selectedReport.executiveSummary.substring(0, 500)}
                    {selectedReport.executiveSummary.length > 500 && "..."}
                  </div>
                </div>
              )}

              {selectedReport.sections.length > 0 && (
                <div className={styles.detailSection}>
                  <h4>Report Sections ({selectedReport.sections.length})</h4>
                  {selectedReport.sections.slice(0, 3).map((section, index) => (
                    <div key={index} className={styles.sectionPreview}>
                      <strong>{section.title}</strong>
                      <p>
                        {section.content.substring(0, 150)}
                        {section.content.length > 150 ? "..." : ""}
                      </p>
                    </div>
                  ))}
                  {selectedReport.sections.length > 3 && (
                    <p className={styles.moreIndicator}>
                      +{selectedReport.sections.length - 3} more sections
                    </p>
                  )}
                </div>
              )}

              {selectedReport.errorMessage && (
                <div className={styles.detailSection}>
                  <h4>Error</h4>
                  <div className={styles.errorText}>
                    {selectedReport.errorMessage}
                  </div>
                </div>
              )}

              <div className={styles.detailActions}>
                <h4>Actions</h4>
                <div className={styles.actionButtons}>
                  {selectedReport.status === "completed" && (
                    <>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                        onClick={() => setShowFullReportModal(true)}
                      >
                        View Full Report
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.exportBtn}`}
                        onClick={() => handleExportMarkdown(selectedReport.id)}
                      >
                        Export Markdown
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.mdxBtn}`}
                        onClick={() => handleExportMDX(selectedReport.id)}
                      >
                        Export MDX
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.regenerateBtn}`}
                    onClick={() => handleRegenerateReport(selectedReport.id)}
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => handleDeleteReport(selectedReport.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navigation}>
          <a href="/admin/applications" className="button button--secondary">
            &larr; Back to Applications
          </a>
        </div>
      </main>
    </Layout>
  );
}
