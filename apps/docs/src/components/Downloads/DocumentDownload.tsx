import * as React from "react";
import DownloadButton from "./DownloadButton";
import styles from "./Downloads.module.css";

interface DocumentDownloadProps {
  /** Document title for the PDF filename */
  title?: string;
  /** Optional selector for specific content to print (defaults to main content) */
  contentSelector?: string;
  /** Show download as PDF button */
  showPdf?: boolean;
  /** Custom label for PDF button */
  pdfLabel?: string;
  /** Additional content to render alongside buttons */
  children?: React.ReactNode;
}

/**
 * DocumentDownload - Provides PDF download functionality for documentation pages
 *
 * Uses the browser's native print-to-PDF functionality for clean, high-quality output.
 * The print styles are defined in print.css for optimal PDF formatting.
 */
export default function DocumentDownload({
  title,
  contentSelector = "article",
  showPdf = true,
  pdfLabel = "Download as PDF",
  children,
}: DocumentDownloadProps): React.ReactElement {
  const handlePdfDownload = React.useCallback(() => {
    // Store original title
    const originalTitle = document.title;

    // Set document title for PDF filename
    if (title) {
      document.title = title;
    }

    // Add print class to body for print-specific styles
    document.body.classList.add("printing-pdf");

    // Focus the content area if selector provided
    if (contentSelector) {
      const content = document.querySelector(contentSelector);
      if (content) {
        content.classList.add("print-target");
      }
    }

    // Trigger print dialog
    window.print();

    // Cleanup after print dialog closes
    const cleanup = () => {
      document.body.classList.remove("printing-pdf");
      if (title) {
        document.title = originalTitle;
      }
      const content = document.querySelector(contentSelector);
      if (content) {
        content.classList.remove("print-target");
      }
    };

    // Use afterprint event if available, otherwise timeout
    if ("onafterprint" in window) {
      window.addEventListener("afterprint", cleanup, { once: true });
    } else {
      setTimeout(cleanup, 1000);
    }
  }, [title, contentSelector]);

  return (
    <div className={styles.documentDownload}>
      <div className={styles.downloadLabel}>
        <span aria-hidden="true">{"\u{2B07}"}</span>
        <span>Download:</span>
      </div>
      {showPdf && (
        <DownloadButton
          label={pdfLabel}
          type="pdf"
          onDownload={handlePdfDownload}
          variant="primary"
        />
      )}
      {children}
    </div>
  );
}
