/**
 * Admin Weekly Reports Dashboard
 *
 * Admin page for generating and managing AI-powered weekly reports.
 */

import Layout from "@theme/Layout";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getWeeklyReports,
  generateWeeklyReport,
  deleteWeeklyReport,
  regenerateWeeklyReport,
  exportReportAsMarkdown,
  getReportCounts,
  checkGitHubConfig,
  validateGitHubRepository,
  WeeklyReport,
  ReportStatus,
  ReportCounts,
} from "../../services/weekly-reports";

import styles from "./reports.module.css";

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
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gitHubConfigured, setGitHubConfigured] = useState(false);

  // Generate form state
  const [repositories, setRepositories] = useState<string[]>([
    "JustAGhosT/PhoenixRooivalk",
  ]);
  const [newRepo, setNewRepo] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generateError, setGenerateError] = useState("");

  // Check if user is admin
  const isAdmin = userProfile.isInternalDomain;

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
      const result = await generateWeeklyReport({
        repositories,
        includeAISummary: true,
        customPrompt: customPrompt || undefined,
      });

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
    if (!confirm("Regenerate this report? The current version will be replaced."))
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

  // Handle export report
  const handleExportReport = async (id: string) => {
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
              <p>AI-generated weekly development reports with GitHub integration</p>
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
              GitHub token not configured. Set GITHUB_TOKEN environment variable to
              enable report generation.
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
                onKeyDown={(e) => e.key === "Enter" && setSelectedReport(report)}
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
                  <strong>Period:</strong> {formatDate(selectedReport.weekStartDate)}{" "}
                  - {formatDate(selectedReport.weekEndDate)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(selectedReport.status)}`}
                  >
                    {selectedReport.status}
                  </span>
                </p>
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
                    {selectedReport.executiveSummary}
                  </div>
                </div>
              )}

              {selectedReport.sections.length > 0 && (
                <div className={styles.detailSection}>
                  <h4>Report Sections</h4>
                  {selectedReport.sections.map((section, index) => (
                    <div key={index} className={styles.sectionPreview}>
                      <strong>{section.title}</strong>
                      <p>
                        {section.content.substring(0, 200)}
                        {section.content.length > 200 ? "..." : ""}
                      </p>
                    </div>
                  ))}
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
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.exportBtn}`}
                      onClick={() => handleExportReport(selectedReport.id)}
                    >
                      Export Markdown
                    </button>
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
