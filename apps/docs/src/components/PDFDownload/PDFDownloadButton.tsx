/**
 * PDF Download Button Component
 *
 * A floating button that appears on doc pages allowing users to download
 * the current page as a PDF using the browser's print dialog.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "@docusaurus/router";
import "./PDFDownloadButton.css";

interface PDFDownloadButtonProps {
  /** Position of the button */
  position?: "bottom-left" | "bottom-right" | "top-right";
}

export function PDFDownloadButton({
  position = "bottom-left",
}: PDFDownloadButtonProps): React.ReactElement | null {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Only show on doc pages
  useEffect(() => {
    const isDocPage =
      location.pathname.startsWith("/docs/") ||
      location.pathname === "/docs";
    setIsVisible(isDocPage);
  }, [location.pathname]);

  const handleDownload = useCallback(() => {
    setIsPrinting(true);

    // Add a class to body for print-specific styling
    document.body.classList.add("printing-pdf");

    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();

      // Remove the class after print dialog closes
      // Use a timeout as we can't reliably detect print dialog close
      setTimeout(() => {
        document.body.classList.remove("printing-pdf");
        setIsPrinting(false);
      }, 1000);
    }, 100);
  }, []);

  // Listen for keyboard shortcut (Ctrl/Cmd + Shift + P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        handleDownload();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDownload]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`pdf-download-button pdf-download-button--${position}`}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isPrinting}
        className={`pdf-download-button__trigger ${isPrinting ? "pdf-download-button__trigger--loading" : ""}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Download page as PDF"
      >
        {isPrinting ? (
          <span className="pdf-download-button__spinner" />
        ) : (
          <span className="pdf-download-button__icon">📄</span>
        )}
        <span className="pdf-download-button__label">PDF</span>
      </button>
      {showTooltip && !isPrinting && (
        <div className="pdf-download-button__tooltip">
          <span>Download as PDF</span>
          <kbd>⌘</kbd>
          <kbd>⇧</kbd>
          <kbd>P</kbd>
        </div>
      )}
    </div>
  );
}

export default PDFDownloadButton;
