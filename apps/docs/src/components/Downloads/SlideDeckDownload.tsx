import * as React from "react";
import DownloadButton from "./DownloadButton";
import BrowserOnly from "@docusaurus/BrowserOnly";
import PresentationMode from "./PresentationMode";
import useBaseUrl from "@docusaurus/useBaseUrl";

/**
 * Represents a key point that can be plain text or have nested sub-points
 */
export type KeyPoint = string | { text: string; subPoints?: string[] };

/**
 * Slide layout types for different content presentations
 */
export type SlideLayout =
  | "default" // Standard bullet points layout
  | "title-only" // Section divider with just title
  | "image" // Image-focused with optional caption
  | "image-right" // Key points left, image right (split layout)
  | "two-column" // Side-by-side comparison
  | "quote" // Quote/testimonial layout
  | "code" // Code block layout for technical content
  | "team" // Team members grid layout
  | "video"; // Video-focused layout with optional caption

/**
 * Team member for team layout slides
 */
export interface TeamMember {
  /** Initials for avatar */
  initials: string;
  /** Full name */
  name: string;
  /** Role/title */
  title: string;
  /** Key highlights/experience points */
  highlights: string[];
  /** Optional avatar color (hex) */
  color?: string;
  /** Optional LinkedIn URL */
  linkedin?: string;
}

/**
 * Color theme presets for different audiences
 */
export type ColorTheme =
  | "default" // Phoenix Rooivalk brand (dark blue + orange)
  | "investor" // Professional blue tones
  | "technical" // Green/terminal inspired
  | "military" // Dark tactical theme
  | "light"; // Light theme for print-friendly

export interface ColorPalette {
  primary: string;
  accent: string;
  dark: string;
  darker: string;
  text: string;
  textSecondary: string;
  textMuted: string;
}

export interface Slide {
  /** Slide number */
  number: number;
  /** Slide title */
  title: string;
  /** Duration in seconds */
  duration: number;
  /** Key points (supports nested sub-bullets) */
  keyPoints: KeyPoint[];
  /** Optional talking script (also used as speaker notes in PPTX) */
  script?: string;
  /** Optional icon/emoji */
  icon?: string;
  /** Slide layout type */
  layout?: SlideLayout;
  /** Optional image URL for image layouts */
  image?: string;
  /** Optional image caption */
  imageCaption?: string;
  /** Optional quote author (for quote layout) */
  quoteAuthor?: string;
  /** Optional code block (for code layout) */
  codeBlock?: string;
  /** Optional code language (for code layout) */
  codeLanguage?: string;
  /** Left column content (for two-column layout) */
  leftColumn?: KeyPoint[];
  /** Right column content (for two-column layout) */
  rightColumn?: KeyPoint[];
  /** Left column title (for two-column layout) */
  leftColumnTitle?: string;
  /** Right column title (for two-column layout) */
  rightColumnTitle?: string;
  /** Team members (for team layout) */
  teamMembers?: TeamMember[];
  /** Speaker notes (for presenter view) */
  speakerNotes?: string;
  /** Video URL for video layout (relative to /static or absolute) */
  video?: string;
  /** Video caption */
  videoCaption?: string;
  /** Whether video should autoplay in presentation mode */
  videoAutoplay?: boolean;
  /** Presenter name for this slide (e.g., "Pieter", "Eben") */
  presenter?: string;
}

interface PptxGeneratorProps {
  slides: Slide[];
  title: string;
  duration: number;
  audience?: string;
  date?: string;
  theme?: ColorTheme;
  customColors?: Partial<ColorPalette>;
  contactUrl?: string;
  contactEmail?: string;
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
  theme,
  customColors,
  contactUrl,
  contactEmail,
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
        theme,
        customColors,
        contactUrl,
        contactEmail,
      });
    } catch (error) {
      console.error("Failed to generate PPTX:", error);
      alert("Failed to generate PowerPoint file. Please try again.");
    }
  }, [
    slides,
    title,
    duration,
    audience,
    date,
    theme,
    customColors,
    contactUrl,
    contactEmail,
  ]);

  return (
    <DownloadButton
      label="Download PowerPoint"
      type="slidedeck"
      onDownload={handleDownloadPptx}
      variant="primary"
    />
  );
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
  /** Color theme */
  theme?: ColorTheme;
  /** Custom color overrides */
  customColors?: Partial<ColorPalette>;
  /** Contact URL for QR code */
  contactUrl?: string;
  /** Contact email */
  contactEmail?: string;
}

/**
 * Parse rich text with **bold** and *italic* markers
 */
function parseRichText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for bold (**text**)
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Check for italic (*text*)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const italicIndex = italicMatch ? remaining.indexOf(italicMatch[0]) : -1;

    // Find the first match
    let firstMatch: RegExpMatchArray | null = null;
    let firstIndex = -1;

    if (boldIndex !== -1 && (italicIndex === -1 || boldIndex <= italicIndex)) {
      firstMatch = boldMatch;
      firstIndex = boldIndex;
    } else if (italicIndex !== -1) {
      firstMatch = italicMatch;
      firstIndex = italicIndex;
    }

    if (firstMatch && firstIndex !== -1) {
      // Add text before the match
      if (firstIndex > 0) {
        parts.push(remaining.substring(0, firstIndex));
      }

      // Add the formatted text
      if (firstMatch[0].startsWith("**")) {
        parts.push(
          <strong key={key++} className="font-bold">
            {firstMatch[1]}
          </strong>,
        );
      } else {
        parts.push(
          <em key={key++} className="italic">
            {firstMatch[1]}
          </em>,
        );
      }

      remaining = remaining.substring(firstIndex + firstMatch[0].length);
    } else {
      // No more matches, add the rest
      parts.push(remaining);
      break;
    }
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Render a key point (supports nested sub-bullets)
 */
function renderKeyPoint(
  point: KeyPoint,
  index: number,
  isSubPoint = false,
): React.ReactNode {
  if (typeof point === "string") {
    return (
      <li
        key={index}
        className={`flex items-start gap-2 ${isSubPoint ? "ml-6 text-sm text-gray-600 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"}`}
      >
        <span
          className={`${isSubPoint ? "text-gray-400" : "text-blue-500"} mt-1`}
          aria-hidden="true"
        >
          {isSubPoint ? "\u25E6" : "\u25CF"}
        </span>
        <span>{parseRichText(point)}</span>
      </li>
    );
  }

  return (
    <React.Fragment key={index}>
      <li className="flex items-start gap-2 text-gray-800 dark:text-gray-200">
        <span className="text-blue-500 mt-1" aria-hidden="true">
          {"\u25CF"}
        </span>
        <span>{parseRichText(point.text)}</span>
      </li>
      {point.subPoints && point.subPoints.length > 0 && (
        <ul className="space-y-1 mt-1">
          {point.subPoints.map((subPoint, subIndex) =>
            renderKeyPoint(subPoint, subIndex, true),
          )}
        </ul>
      )}
    </React.Fragment>
  );
}

/**
 * Get pacing indicator color based on duration
 */
function getPacingColor(
  duration: number,
  targetPerSlide: number,
): { bg: string; text: string; label: string } {
  const ratio = duration / targetPerSlide;
  if (ratio < 0.7) {
    return {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      label: "Quick",
    };
  } else if (ratio > 1.3) {
    return {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
      label: "Long",
    };
  }
  return {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Good",
  };
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
  theme = "default",
  customColors,
  contactUrl,
  contactEmail,
}: SlideDeckDownloadProps): React.ReactElement {
  const logoUrl = useBaseUrl("/img/logo.svg");
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isPresentationMode, setIsPresentationMode] = React.useState(false);
  const printContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-number slides if they don't have numbers
  const numberedSlides = React.useMemo(() => {
    return slides.map((slide, index) => ({
      ...slide,
      number: slide.number || index + 1,
    }));
  }, [slides]);

  const handleDownloadScript = React.useCallback(() => {
    setIsPreviewOpen(true);
  }, []);

  const handleStartPresentation = React.useCallback(() => {
    setIsPresentationMode(true);
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

  // Calculate target duration per slide for pacing indicators
  const totalSeconds = numberedSlides.reduce((acc, s) => acc + s.duration, 0);
  const targetPerSlide = totalSeconds / numberedSlides.length;

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <BrowserOnly fallback={<div>Loading...</div>}>
          {() => (
            <PptxGenerator
              slides={numberedSlides}
              title={title}
              duration={duration}
              audience={audience}
              date={date}
              theme={theme}
              customColors={customColors}
              contactUrl={contactUrl}
              contactEmail={contactEmail}
            />
          )}
        </BrowserOnly>
        <DownloadButton
          label="Download Script"
          type="slidedeck"
          onDownload={handleDownloadScript}
          variant={variant}
        />
        <button
          type="button"
          onClick={handleStartPresentation}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
        >
          <span>{"\u{1F3AC}"}</span>
          Present
        </button>
      </div>

      {/* Presentation Mode */}
      <BrowserOnly fallback={null}>
        {() => (
          <PresentationMode
            title={title}
            slides={numberedSlides}
            duration={duration}
            audience={audience}
            isOpen={isPresentationMode}
            onClose={() => setIsPresentationMode(false)}
          />
        )}
      </BrowserOnly>

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
                  {/* Large Brand Logo on Title Slide */}
                  <div className="mb-6 flex justify-center">
                    <img
                      src={logoUrl}
                      alt="Phoenix Rooivalk"
                      className="w-20 h-20 opacity-80"
                    />
                  </div>
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

              {/* Table of Contents / Agenda Slide */}
              <div className="slide-page mb-8 pb-8 border-b-2 border-gray-200 dark:border-gray-700 print:break-after-page relative">
                <img
                  src={logoUrl}
                  alt=""
                  className="absolute top-0 right-0 w-8 h-8 opacity-40"
                  aria-hidden="true"
                />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span aria-hidden="true">{"\u{1F4CB}"}</span>
                  Agenda
                </h2>
                <ol className="space-y-2">
                  {numberedSlides.map((slide, index) => (
                    <li
                      key={slide.number}
                      className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                    >
                      <span className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="flex-1">{slide.title}</span>
                      <span className="text-sm text-gray-400">
                        {slide.duration}s
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
                  Total Duration: {duration} minutes ({totalSeconds} seconds)
                </div>
              </div>

              {/* Individual Slides */}
              {numberedSlides.map((slide, index) => {
                const pacing = getPacingColor(slide.duration, targetPerSlide);

                return (
                  <div
                    key={slide.number}
                    className={`slide-page mb-8 pb-8 relative ${index < numberedSlides.length - 1 ? "border-b border-gray-200 dark:border-gray-700 print:break-after-page" : ""}`}
                  >
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 right-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: `${((index + 1) / numberedSlides.length) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Small Brand Logo - larger on first slide */}
                    <img
                      src={logoUrl}
                      alt=""
                      className={`absolute top-2 right-0 ${index === 0 ? "w-10 h-10 opacity-50" : "w-6 h-6 opacity-40"}`}
                      aria-hidden="true"
                    />

                    {/* Slide Header */}
                    <div className="flex items-center justify-between mb-6 mt-4">
                      <div className="flex items-center gap-3">
                        {slide.icon && (
                          <span className="text-2xl" aria-hidden="true">
                            {slide.icon}
                          </span>
                        )}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {parseRichText(slide.title)}
                        </h2>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          Slide {slide.number}/{numberedSlides.length}
                        </span>
                        {/* Pacing Indicator */}
                        <span
                          className={`px-2 py-1 rounded ${pacing.bg} ${pacing.text}`}
                        >
                          {slide.duration}s ({pacing.label})
                        </span>
                      </div>
                    </div>

                    {/* Render based on layout type */}
                    {slide.layout === "title-only" ? (
                      // Title-only layout (section divider)
                      <div className="text-center py-12">
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                          {slide.keyPoints[0] &&
                            parseRichText(
                              typeof slide.keyPoints[0] === "string"
                                ? slide.keyPoints[0]
                                : slide.keyPoints[0].text,
                            )}
                        </p>
                      </div>
                    ) : slide.layout === "image" && slide.image ? (
                      // Image-focused layout
                      <div className="flex flex-col items-center gap-4">
                        <img
                          src={slide.image}
                          alt={slide.imageCaption || slide.title}
                          className="max-w-full max-h-64 rounded-lg shadow-lg"
                        />
                        {slide.imageCaption && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            {slide.imageCaption}
                          </p>
                        )}
                        {slide.keyPoints.length > 0 && (
                          <ul className="space-y-2 mt-4">
                            {slide.keyPoints.map((point, i) =>
                              renderKeyPoint(point, i),
                            )}
                          </ul>
                        )}
                      </div>
                    ) : slide.layout === "image-right" && slide.image ? (
                      // Split layout: key points left, image right
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <ul className="space-y-2">
                            {slide.keyPoints.map((point, i) =>
                              renderKeyPoint(point, i),
                            )}
                          </ul>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <img
                            src={slide.image}
                            alt={slide.imageCaption || slide.title}
                            className="max-w-full max-h-56 rounded-lg shadow-lg"
                          />
                          {slide.imageCaption && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2 text-center">
                              {slide.imageCaption}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : slide.layout === "two-column" ? (
                      // Two-column comparison layout
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          {slide.leftColumnTitle && (
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                              {slide.leftColumnTitle}
                            </h4>
                          )}
                          <ul className="space-y-2">
                            {(slide.leftColumn || []).map((point, i) =>
                              renderKeyPoint(point, i),
                            )}
                          </ul>
                        </div>
                        <div>
                          {slide.rightColumnTitle && (
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                              {slide.rightColumnTitle}
                            </h4>
                          )}
                          <ul className="space-y-2">
                            {(slide.rightColumn || []).map((point, i) =>
                              renderKeyPoint(point, i),
                            )}
                          </ul>
                        </div>
                      </div>
                    ) : slide.layout === "quote" ? (
                      // Quote/testimonial layout
                      <div className="text-center py-8">
                        <blockquote className="text-2xl italic text-gray-700 dark:text-gray-300 mb-4">
                          &ldquo;
                          {slide.keyPoints[0] &&
                            parseRichText(
                              typeof slide.keyPoints[0] === "string"
                                ? slide.keyPoints[0]
                                : slide.keyPoints[0].text,
                            )}
                          &rdquo;
                        </blockquote>
                        {slide.quoteAuthor && (
                          <p className="text-lg text-gray-500 dark:text-gray-400">
                            — {slide.quoteAuthor}
                          </p>
                        )}
                      </div>
                    ) : slide.layout === "code" && slide.codeBlock ? (
                      // Code block layout
                      <div>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-4">
                          <code>{slide.codeBlock}</code>
                        </pre>
                        {slide.keyPoints.length > 0 && (
                          <ul className="space-y-2">
                            {slide.keyPoints.map((point, i) =>
                              renderKeyPoint(point, i),
                            )}
                          </ul>
                        )}
                      </div>
                    ) : slide.layout === "team" && slide.teamMembers ? (
                      // Team members grid layout
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {slide.teamMembers.map((member, memberIndex) => (
                            <div
                              key={memberIndex}
                              className="text-center p-4 rounded-lg"
                              style={{
                                background: `linear-gradient(180deg, ${member.color || "#1e40af"}15 0%, ${member.color || "#1e40af"}05 100%)`,
                                border: `1px solid ${member.color || "#1e40af"}30`,
                              }}
                            >
                              <div
                                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl"
                                style={{
                                  background: `linear-gradient(135deg, ${member.color || "#1e40af"} 0%, ${member.color || "#1e40af"}cc 100%)`,
                                }}
                              >
                                {member.initials}
                              </div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                {member.name}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {member.title}
                              </p>
                              <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 text-left">
                                {member.highlights.map((highlight, hIndex) => (
                                  <li
                                    key={hIndex}
                                    className="flex items-start gap-1"
                                  >
                                    <span className="text-gray-400 mt-0.5">
                                      {"\u2022"}
                                    </span>
                                    <span>{highlight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                        {slide.keyPoints.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                              Key Points
                            </h3>
                            <ul className="space-y-2">
                              {slide.keyPoints.map((point, i) =>
                                renderKeyPoint(point, i),
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : slide.layout === "video" && slide.video ? (
                      // Video-focused layout
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg shadow-lg overflow-hidden">
                          <video
                            src={slide.video}
                            controls
                            autoPlay={slide.videoAutoplay}
                            muted={slide.videoAutoplay}
                            className="w-full h-full object-contain"
                            poster={slide.image}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        {slide.videoCaption && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center">
                            {slide.videoCaption}
                          </p>
                        )}
                        {slide.keyPoints.length > 0 && (
                          <ul className="space-y-2 mt-4 w-full">
                            {slide.keyPoints.map((point, i) =>
                              renderKeyPoint(point, i),
                            )}
                          </ul>
                        )}
                      </div>
                    ) : (
                      // Default layout with key points
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                          Key Points
                        </h3>
                        <ul className="space-y-2">
                          {slide.keyPoints.map((point, i) =>
                            renderKeyPoint(point, i),
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Script */}
                    {slide.script && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                          Script
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 italic">
                          &quot;{slide.script}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Summary Footer */}
              <div className="mt-8 pt-8 border-t-2 border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Total: {numberedSlides.length} slides | {duration} minutes |{" "}
                  {totalSeconds} seconds
                </p>
                {(contactUrl || contactEmail) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Contact:{" "}
                      {contactEmail && (
                        <a
                          href={`mailto:${contactEmail}`}
                          className="text-blue-500 hover:underline"
                        >
                          {contactEmail}
                        </a>
                      )}
                      {contactUrl && (
                        <>
                          {contactEmail && " | "}
                          <a
                            href={contactUrl}
                            className="text-blue-500 hover:underline"
                          >
                            {contactUrl}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
