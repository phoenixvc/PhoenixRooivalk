import * as React from "react";
import styles from "./ApplicationDocument.module.css";
import { CalendarExport } from "@site/src/components/Calendar";
import type { CalendarEvent } from "@site/src/components/Calendar";

interface VersionHistoryItem {
  version: string;
  date: string;
  changes?: string;
}

interface ChecklistItem {
  label: string;
  completed: boolean;
}

interface ApplicationDocumentProps {
  /** Document title */
  title: string;
  /** Subtitle or program name */
  subtitle?: string;
  /** Applicant/company name */
  applicant?: string;
  /** Application deadline (ISO date string or readable format) */
  deadline?: string;
  /** Document status (e.g., "DRAFT", "FINAL") */
  status?: "draft" | "final" | "submitted";
  /** Document version */
  version?: string;
  /** Date of document */
  date?: string;
  /** Logo URL (optional) */
  logoUrl?: string;
  /** Show download as PDF button */
  showPdf?: boolean;
  /** Custom label for PDF button */
  pdfLabel?: string;
  /** Description for primary PDF */
  pdfDescription?: string;
  /** URL to auxiliary/supporting document PDF */
  auxiliaryPdfUrl?: string;
  /** Label for auxiliary PDF download button */
  auxiliaryPdfLabel?: string;
  /** Description for auxiliary PDF */
  auxiliaryPdfDescription?: string;
  /** File size of auxiliary PDF (e.g., "156 KB") */
  auxiliaryPdfSize?: string;
  /** Version history for dropdown */
  versionHistory?: VersionHistoryItem[];
  /** Checklist items for progress tracking */
  checklist?: ChecklistItem[];
  /** Additional content */
  children?: React.ReactNode;
}

// Toast notification component
function Toast({
  message,
  visible,
  type = "success",
}: {
  message: string;
  visible: boolean;
  type?: "success" | "info" | "error";
}) {
  return (
    <div
      className={`${styles.toast} ${visible ? styles.toastVisible : ""}`}
      data-type={type}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.toastIcon}>
        {type === "success" ? "\u2713" : type === "error" ? "\u2717" : "\u2139"}
      </span>
      {message}
    </div>
  );
}

// Calculate days until deadline
function getDaysUntil(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Format deadline with urgency
function formatDeadline(deadline: string): {
  text: string;
  daysLeft: number;
  urgency: "critical" | "urgent" | "normal";
} {
  const daysLeft = getDaysUntil(deadline);

  let urgency: "critical" | "urgent" | "normal" = "normal";
  if (daysLeft <= 1) urgency = "critical";
  else if (daysLeft <= 7) urgency = "urgent";

  let text = "";
  if (daysLeft < 0) {
    text = "Deadline passed";
  } else if (daysLeft === 0) {
    text = "Due today!";
  } else if (daysLeft === 1) {
    text = "Due tomorrow!";
  } else {
    text = `${daysLeft} days left`;
  }

  return { text, daysLeft, urgency };
}

/**
 * ApplicationDocument - Professional PDF download with cover page for application documents
 */
export default function ApplicationDocument({
  title,
  subtitle,
  applicant = "Phoenix Rooivalk Inc.",
  deadline,
  status = "draft",
  version = "1.0",
  date,
  logoUrl,
  showPdf = true,
  pdfLabel = "Download Application",
  pdfDescription = "Print full application to PDF",
  auxiliaryPdfUrl,
  auxiliaryPdfLabel = "Supporting Document",
  auxiliaryPdfDescription = "Technical evidence & capability summary",
  auxiliaryPdfSize,
  versionHistory,
  checklist,
  children,
}: ApplicationDocumentProps): React.ReactElement {
  const [toast, setToast] = React.useState({
    visible: false,
    message: "",
    type: "success" as const,
  });
  const [showVersionHistory, setShowVersionHistory] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);

  // Refs for modal accessibility
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  // Focus trap and keyboard handling for modal
  React.useEffect(() => {
    if (!showPreview) return;

    // Save the currently focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the modal when it opens
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Handle Escape key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPreview(false);
        return;
      }

      // Focus trap: keep Tab cycling inside the modal
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements =
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the previously focused element when modal closes
      previousActiveElement.current?.focus();
    };
  }, [showPreview]);

  const showToast = React.useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      setToast({ visible: true, message, type });
      setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
    },
    [],
  );

  const handlePdfDownload = React.useCallback(() => {
    const originalTitle = document.title;
    document.title = `${title} - ${applicant}`;
    document.body.classList.add("printing-application");

    showToast("Opening print dialog...", "info");

    setTimeout(() => {
      window.print();
    }, 100);

    const cleanup = () => {
      document.body.classList.remove("printing-application");
      document.title = originalTitle;
    };

    if ("onafterprint" in window) {
      window.addEventListener("afterprint", cleanup, { once: true });
    } else {
      setTimeout(cleanup, 1000);
    }
  }, [title, applicant, showToast]);

  const handleAuxiliaryDownload = React.useCallback(() => {
    if (auxiliaryPdfUrl) {
      showToast("Download started!", "success");
      // noopener,noreferrer prevents tabnabbing attacks
      window.open(auxiliaryPdfUrl, "_blank", "noopener,noreferrer");
    }
  }, [auxiliaryPdfUrl, showToast]);

  const handleCopyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      showToast("Link copied to clipboard!", "success");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  }, [showToast]);

  const handleShare = React.useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: subtitle || `${title} - ${applicant}`,
          url: window.location.href,
        });
        showToast("Shared successfully!", "success");
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== "AbortError") {
          showToast("Share failed", "error");
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  }, [title, subtitle, applicant, showToast, handleCopyLink]);

  const statusLabels = {
    draft: "DRAFT",
    final: "FINAL",
    submitted: "SUBMITTED",
  };

  const currentDate =
    date ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Calculate deadline info
  const deadlineInfo = deadline ? formatDeadline(deadline) : null;

  // Create calendar event for deadline
  const deadlineEvent: CalendarEvent | null = deadline
    ? {
        title: `${title} - Deadline`,
        description: subtitle
          ? `Submission deadline for ${title}: ${subtitle}\n\nApplicant: ${applicant}`
          : `Submission deadline for ${title}\n\nApplicant: ${applicant}`,
        startDate: new Date(deadline),
        allDay: false,
        location: "Online Submission",
        category: "Deadline",
        url: typeof window !== "undefined" ? window.location.href : undefined,
      }
    : null;

  // Calculate checklist progress
  const checklistProgress = checklist
    ? {
        completed: checklist.filter((item) => item.completed).length,
        total: checklist.length,
        percent: Math.round(
          (checklist.filter((item) => item.completed).length /
            checklist.length) *
            100,
        ),
      }
    : null;

  return (
    <>
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
      />

      {/* Main Download Controls */}
      <div className={styles.downloadControls}>
        {/* Left Section: Status, Version, Deadline */}
        <div className={styles.leftSection}>
          <div className={styles.statusRow}>
            <span className={styles.statusBadge} data-status={status}>
              {statusLabels[status]}
            </span>

            {/* Version with dropdown */}
            <div className={styles.versionWrapper}>
              <button
                className={styles.versionButton}
                onClick={() =>
                  versionHistory && setShowVersionHistory(!showVersionHistory)
                }
                disabled={!versionHistory}
                title={versionHistory ? "View version history" : undefined}
              >
                <span>v{version}</span>
                {versionHistory && (
                  <span className={styles.dropdownIcon}>
                    {showVersionHistory ? "\u25B2" : "\u25BC"}
                  </span>
                )}
              </button>

              {/* Version History Dropdown */}
              {showVersionHistory && versionHistory && (
                <div className={styles.versionDropdown}>
                  <div className={styles.versionDropdownHeader}>
                    Version History
                  </div>
                  {versionHistory.map((v, i) => (
                    <div
                      key={i}
                      className={styles.versionItem}
                      data-current={v.version === version}
                    >
                      <span className={styles.versionNumber}>v{v.version}</span>
                      <span className={styles.versionDate}>{v.date}</span>
                      {v.changes && (
                        <span className={styles.versionChanges}>
                          {v.changes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deadline Indicator */}
          {deadlineInfo && (
            <div className={styles.deadlineRow}>
              <div
                className={styles.deadlineIndicator}
                data-urgency={deadlineInfo.urgency}
              >
                <span className={styles.deadlineIcon}>{"\u23F0"}</span>
                <span className={styles.deadlineText}>{deadlineInfo.text}</span>
              </div>
              {deadlineEvent && (
                <div className={styles.calendarExportWrapper}>
                  <CalendarExport
                    events={[deadlineEvent]}
                    buttonText="Add to Calendar"
                    filename={`${title.replace(/\s+/g, "-")}-Deadline`}
                    variant="outline"
                    size="small"
                  />
                </div>
              )}
            </div>
          )}

          {/* Checklist Progress */}
          {checklistProgress && (
            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${checklistProgress.percent}%` }}
                />
              </div>
              <span className={styles.progressText}>
                {checklistProgress.completed}/{checklistProgress.total} complete
              </span>
            </div>
          )}
        </div>

        {/* Right Section: Action Buttons */}
        <div className={styles.actionSection}>
          {/* Share/Copy Buttons */}
          <div className={styles.shareButtons}>
            <button
              className={styles.iconButton}
              onClick={handleCopyLink}
              title="Copy link"
              aria-label="Copy link to clipboard"
            >
              {linkCopied ? "\u2713" : "\u{1F517}"}
            </button>
            <button
              className={styles.iconButton}
              onClick={handleShare}
              title="Share"
              aria-label="Share document"
            >
              {"\u{1F4E4}"}
            </button>
          </div>

          {/* Download Buttons */}
          <div className={styles.downloadButtons}>
            {showPdf && (
              <button
                className={`${styles.downloadButton} ${styles.downloadButtonSecondary}`}
                onClick={handlePdfDownload}
                title={pdfDescription}
              >
                <span className={styles.buttonIcon}>{"\u{1F5A8}"}</span>
                <span className={styles.buttonContent}>
                  <span className={styles.buttonLabel}>{pdfLabel}</span>
                  <span className={styles.buttonMeta}>{pdfDescription}</span>
                </span>
              </button>
            )}

            {auxiliaryPdfUrl && (
              <div className={styles.auxiliaryButtonWrapper}>
                <button
                  className={`${styles.downloadButton} ${styles.downloadButtonPrimary}`}
                  onClick={handleAuxiliaryDownload}
                  title={auxiliaryPdfDescription}
                >
                  <span className={styles.buttonIcon}>{"\u{1F4C4}"}</span>
                  <span className={styles.buttonContent}>
                    <span className={styles.buttonLabel}>
                      {auxiliaryPdfLabel}
                    </span>
                    <span className={styles.buttonMeta}>
                      {auxiliaryPdfDescription}
                      {auxiliaryPdfSize && ` (${auxiliaryPdfSize})`}
                    </span>
                  </span>
                </button>
                <button
                  className={styles.previewButton}
                  onClick={() => setShowPreview(true)}
                  title="Preview document"
                  aria-label="Preview supporting document"
                >
                  {"\u{1F441}"}
                </button>
              </div>
            )}
          </div>
        </div>
        {children}
      </div>

      {/* PDF Preview Modal */}
      {showPreview && auxiliaryPdfUrl && (
        <div
          className={styles.previewOverlay}
          onClick={() => setShowPreview(false)}
        >
          <div
            ref={modalRef}
            className={styles.previewModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
            tabIndex={-1}
          >
            <div className={styles.previewHeader}>
              <h3 id="preview-title">{auxiliaryPdfLabel}</h3>
              <button
                className={styles.previewClose}
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                {"\u2715"}
              </button>
            </div>
            <div className={styles.previewContent}>
              <iframe
                src={`${auxiliaryPdfUrl}#toolbar=0`}
                title={auxiliaryPdfLabel}
                className={styles.previewIframe}
              />
            </div>
            <div className={styles.previewFooter}>
              <button
                className={styles.previewDownload}
                onClick={handleAuxiliaryDownload}
              >
                {"\u{2B07}"} Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Page - Only visible in print */}
      <div className={styles.coverPage}>
        <div className={styles.coverHeader}>
          {logoUrl ? (
            <img src={logoUrl} alt={applicant} className={styles.coverLogo} />
          ) : (
            <div className={styles.coverLogoPlaceholder}>
              <span className={styles.logoIcon}>{"\u{1F525}"}</span>
              <span className={styles.companyName}>{applicant}</span>
            </div>
          )}
        </div>

        <div className={styles.coverContent}>
          <div className={styles.coverStatus} data-status={status}>
            {statusLabels[status]}
          </div>
          <h1 className={styles.coverTitle}>{title}</h1>
          {subtitle && <p className={styles.coverSubtitle}>{subtitle}</p>}
        </div>

        <div className={styles.coverDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Applicant:</span>
            <span className={styles.detailValue}>{applicant}</span>
          </div>
          {deadline && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Deadline:</span>
              <span className={styles.detailValue}>{deadline}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Document Date:</span>
            <span className={styles.detailValue}>{currentDate}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Version:</span>
            <span className={styles.detailValue}>{version}</span>
          </div>
        </div>

        <div className={styles.coverFooter}>
          <p className={styles.confidential}>CONFIDENTIAL</p>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} {applicant}. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
