import * as React from "react";
import DownloadButton from "./DownloadButton";
import styles from "./ApplicationDocument.module.css";

interface ApplicationDocumentProps {
  /** Document title */
  title: string;
  /** Subtitle or program name */
  subtitle?: string;
  /** Applicant/company name */
  applicant?: string;
  /** Application deadline */
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
  /** URL to auxiliary/supporting document PDF */
  auxiliaryPdfUrl?: string;
  /** Label for auxiliary PDF download button */
  auxiliaryPdfLabel?: string;
  /** Additional content */
  children?: React.ReactNode;
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
  pdfLabel = "Download as PDF",
  auxiliaryPdfUrl,
  auxiliaryPdfLabel = "Download Supporting Document",
  children,
}: ApplicationDocumentProps): React.ReactElement {
  const handlePdfDownload = React.useCallback(() => {
    const originalTitle = document.title;

    // Set document title for PDF filename
    document.title = `${title} - ${applicant}`;

    // Add print class to body
    document.body.classList.add("printing-application");

    // Trigger print dialog
    window.print();

    // Cleanup
    const cleanup = () => {
      document.body.classList.remove("printing-application");
      document.title = originalTitle;
    };

    if ("onafterprint" in window) {
      window.addEventListener("afterprint", cleanup, { once: true });
    } else {
      setTimeout(cleanup, 1000);
    }
  }, [title, applicant]);

  const handleAuxiliaryDownload = React.useCallback(() => {
    if (auxiliaryPdfUrl) {
      // Open the pre-generated PDF in a new tab for download
      window.open(auxiliaryPdfUrl, "_blank");
    }
  }, [auxiliaryPdfUrl]);

  const statusLabels = {
    draft: "DRAFT",
    final: "FINAL",
    submitted: "SUBMITTED",
  };

  const currentDate = date || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Download Controls - Hidden in print */}
      <div className={styles.downloadControls}>
        <div className={styles.downloadInfo}>
          <span className={styles.statusBadge} data-status={status}>
            {statusLabels[status]}
          </span>
          <span className={styles.versionInfo}>Version {version}</span>
        </div>
        {showPdf && (
          <DownloadButton
            label={pdfLabel}
            type="pdf"
            onDownload={handlePdfDownload}
            variant="primary"
          />
        )}
        {auxiliaryPdfUrl && (
          <DownloadButton
            label={auxiliaryPdfLabel}
            type="pdf"
            onDownload={handleAuxiliaryDownload}
            variant="secondary"
          />
        )}
        {children}
      </div>

      {/* Cover Page - Only visible in print */}
      <div className={styles.coverPage}>
        <div className={styles.coverHeader}>
          {logoUrl ? (
            <img src={logoUrl} alt={applicant} className={styles.coverLogo} />
          ) : (
            <div className={styles.coverLogoPlaceholder}>
              <span className={styles.logoIcon}>🔥</span>
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
            © {new Date().getFullYear()} {applicant}. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
