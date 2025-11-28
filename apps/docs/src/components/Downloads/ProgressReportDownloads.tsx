import * as React from "react";
import DocumentDownload from "./DocumentDownload";
import SlideDeckDownload, { type Slide } from "./SlideDeckDownload";

interface ProgressReportDownloadsProps {
  /** Report title for PDF filename */
  title: string;
  /** Slide deck data */
  slides?: Slide[];
  /** Slide deck metadata */
  slideDeckMeta?: {
    title: string;
    duration: number;
    audience?: string;
    date?: string;
  };
  /** Show PDF download button */
  showPdf?: boolean;
  /** Show slidedeck download button */
  showSlideDeck?: boolean;
}

/**
 * ProgressReportDownloads - Combined download component for progress reports
 *
 * Provides both PDF download of the full report and slidedeck download
 * for presentations.
 */
export default function ProgressReportDownloads({
  title,
  slides,
  slideDeckMeta,
  showPdf = true,
  showSlideDeck = true,
}: ProgressReportDownloadsProps): React.ReactElement {
  return (
    <DocumentDownload
      title={title}
      showPdf={showPdf}
      pdfLabel="Download Full Report (PDF)"
    >
      {showSlideDeck && slides && slideDeckMeta && (
        <SlideDeckDownload
          title={slideDeckMeta.title}
          duration={slideDeckMeta.duration}
          slides={slides}
          audience={slideDeckMeta.audience}
          date={slideDeckMeta.date}
          buttonLabel={`Download ${slideDeckMeta.duration}-Min Slide Deck`}
          variant="secondary"
        />
      )}
    </DocumentDownload>
  );
}
