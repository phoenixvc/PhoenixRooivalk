import * as React from "react";
import DownloadButton from "./DownloadButton";
import BrowserOnly from "@docusaurus/BrowserOnly";

// Import type only for type checking
import type { Slide } from "./SlideDeckDownload";

interface PptxGeneratorProps {
  slides: Slide[];
  title: string;
  duration: number;
  audience?: string;
  date?: string;
}

/**
 * Client-only PPTX generator component
 * This wrapper ensures pptxgenjs is only loaded in the browser
 */
function PptxGenerator({
  slides,
  title,
  duration,
  audience,
  date,
}: PptxGeneratorProps) {
  const handleDownloadPptx = React.useCallback(async () => {
    try {
      // Dynamic import only in browser
      const { generatePptx } = await import("../../utils/generatePptx");
      await generatePptx(slides, {
        title,
        duration,
        audience,
        date,
      });
    } catch (error) {
      console.error("Failed to generate PPTX:", error);
      alert("Failed to generate PowerPoint file. Please try again.");
    }
  }, [slides, title, duration, audience, date]);

  return (
    <DownloadButton
      label="Download PowerPoint"
      type="slidedeck"
      onDownload={handleDownloadPptx}
      variant="primary"
    />
  );
}

export interface Slide {
  /** Slide number */
  number: number;
  /** Slide title */
  title: string;
  /** Duration in seconds */
  duration: number;
  /** Key points (bullet points) */
  keyPoints: string[];
  /** Optional talking script */
  script?: string;
  /** Optional icon/emoji */
  icon?: string;
}

interface SlideDeckDownloadProps {
  /** Presentation title */
  title: string;
  /** Total duration in minutes */
  duration: number;
  /** Array of slides */
  slides: Slide[];
  /** Audience description */
  audience?: string;
  /** Optional date */
  date?: string;
  /** Button label */
  buttonLabel?: string;
  /** Button variant */
  variant?: "primary" | "secondary" | "outline";
}

/**
 * SlideDeckDownload - Generates a printable slide deck from structured data
 *
 * Creates a clean, printable presentation format with slides formatted
 * for easy printing or PDF export.
 */
export default function SlideDeckDownload({
  title,
  duration,
  slides,
  audience = "Investors/Advisors",
  date,
  buttonLabel = "Download Slide Deck",
  variant = "secondary",
}: SlideDeckDownloadProps): React.ReactElement {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const printContainerRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadScript = React.useCallback(() => {
    setIsPreviewOpen(true);
  }, []);

  const handlePrint = React.useCallback(() => {
    // Store original title
    const originalTitle = document.title;
    document.title = `${title} - Slide Deck`;

    // Add print class
    document.body.classList.add("printing-slidedeck");

    // Trigger print
    window.print();

    // Cleanup
    const cleanup = () => {
      document.body.classList.remove("printing-slidedeck");
      document.title = originalTitle;
    };

    if ("onafterprint" in window) {
      window.addEventListener("afterprint", cleanup, { once: true });
    } else {
      setTimeout(cleanup, 1000);
    }
  }, [title]);

  const handleClose = React.useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPreviewOpen) {
        setIsPreviewOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isPreviewOpen]);

  return (
    <>
      <div className="flex items-center gap-3">
        <BrowserOnly fallback={<div>Loading...</div>}>
          {() => (
            <PptxGenerator
              slides={slides}
              title={title}
              duration={duration}
              audience={audience}
              date={date}
            />
          )}
        </BrowserOnly>
        <DownloadButton
          label="Download Script"
          type="slidedeck"
          onDownload={handleDownloadScript}
          variant={variant}
        />
      </div>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-start justify-center p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="slidedeck-title"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 print:hidden">
              <h2
                id="slidedeck-title"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                Slide Deck Preview
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>{"\u{1F5A8}"}</span>
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close preview"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Slide Content */}
            <div
              ref={printContainerRef}
              className="p-8 slidedeck-print-content"
            >
              {/* Title Slide */}
              <div className="slide-page mb-8 pb-8 border-b-2 border-gray-200 dark:border-gray-700 print:break-after-page">
                <div className="text-center py-12">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {title}
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                    {duration}-Minute Presentation
                  </p>
                  <p className="text-lg text-gray-500 dark:text-gray-500">
                    {audience}
                  </p>
                  {date && (
                    <p className="text-sm text-gray-400 dark:text-gray-600 mt-4">
                      {date}
                    </p>
                  )}
                </div>
              </div>

              {/* Individual Slides */}
              {slides.map((slide, index) => (
                <div
                  key={slide.number}
                  className={`slide-page mb-8 pb-8 ${index < slides.length - 1 ? "border-b border-gray-200 dark:border-gray-700 print:break-after-page" : ""}`}
                >
                  {/* Slide Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {slide.icon && (
                        <span className="text-2xl" aria-hidden="true">
                          {slide.icon}
                        </span>
                      )}
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {slide.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Slide {slide.number}</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {slide.duration}s
                      </span>
                    </div>
                  </div>

                  {/* Key Points */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Key Points
                    </h3>
                    <ul className="space-y-2">
                      {slide.keyPoints.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-gray-800 dark:text-gray-200"
                        >
                          <span
                            className="text-blue-500 mt-1"
                            aria-hidden="true"
                          >
                            {"\u25CF"}
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Script */}
                  {slide.script && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Script
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 italic">
                        &quot;{slide.script}&quot;
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Summary Footer */}
              <div className="mt-8 pt-8 border-t-2 border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Total: {slides.length} slides | {duration} minutes |{" "}
                  {slides.reduce((acc, s) => acc + s.duration, 0)} seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
