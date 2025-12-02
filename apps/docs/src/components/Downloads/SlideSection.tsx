import * as React from "react";
import styles from "./Downloads.module.css";
import type { KeyPoint, SlideLayout } from "./SlideDeckDownload";

/** Branded icon for slide decks - bar chart emoji */
const SLIDE_DECK_BRAND_ICON = "\u{1F4CA}"; // 📊

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
          <strong key={key++} className={styles.richTextBold}>
            {firstMatch[1]}
          </strong>,
        );
      } else {
        parts.push(
          <em key={key++} className={styles.richTextItalic}>
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
 * Render a key point (supports nested sub-bullets and rich text)
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
        className={isSubPoint ? styles.keyPointSub : styles.keyPoint}
      >
        <span
          className={
            isSubPoint ? styles.keyPointBulletSub : styles.keyPointBullet
          }
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
      <li className={styles.keyPoint}>
        <span className={styles.keyPointBullet} aria-hidden="true">
          {"\u25CF"}
        </span>
        <span>{parseRichText(point.text)}</span>
      </li>
      {point.subPoints && point.subPoints.length > 0 && (
        <ul className={styles.keyPointsListSub}>
          {point.subPoints.map((subPoint, subIndex) =>
            renderKeyPoint(subPoint, subIndex, true),
          )}
        </ul>
      )}
    </React.Fragment>
  );
}

export interface SlideSectionProps {
  /** Slide number */
  number: number;
  /** Slide title */
  title: string;
  /** Duration in seconds */
  duration: number;
  /** Optional icon/emoji */
  icon?: string;
  /** Key points (supports nested sub-bullets and rich text) */
  keyPoints?: KeyPoint[];
  /** Talking script */
  script?: string;
  /** Children content (alternative to keyPoints) */
  children?: React.ReactNode;
  /** Whether this is the first slide (shows larger brand icon) */
  isFirst?: boolean;
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
  /** Total number of slides (for progress indicator) */
  totalSlides?: number;
}

/**
 * SlideSection - A single slide that displays inline in the document
 * Can be grouped in a SlideDeck for download functionality
 *
 * Supports multiple layouts:
 * - default: Standard bullet points
 * - title-only: Section divider with just title
 * - image: Image-focused with optional caption
 * - two-column: Side-by-side comparison
 * - quote: Quote/testimonial layout
 * - code: Code block layout for technical content
 */
export default function SlideSection({
  number,
  title,
  duration,
  icon,
  keyPoints = [],
  script,
  children,
  isFirst,
  layout = "default",
  image,
  imageCaption,
  quoteAuthor,
  codeBlock,
  codeLanguage,
  leftColumn,
  rightColumn,
  leftColumnTitle,
  rightColumnTitle,
  totalSlides,
}: SlideSectionProps): React.ReactElement {
  // Calculate progress percentage
  const progressPercent = totalSlides ? (number / totalSlides) * 100 : 0;

  return (
    <div className={styles.slidePage} data-slide-number={number}>
      {/* Progress Bar (if totalSlides provided) */}
      {totalSlides && (
        <div className={styles.slideProgressBar}>
          <div
            className={styles.slideProgressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Brand Icon - larger on first slide, smaller on others */}
      <div
        className={
          isFirst ? styles.slideBrandIconLarge : styles.slideBrandIconSmall
        }
        aria-hidden="true"
      >
        {SLIDE_DECK_BRAND_ICON}
      </div>

      {/* Slide Header */}
      <div className={styles.slideHeader}>
        <div className={styles.slideHeaderLeft}>
          {icon && (
            <span className={styles.slideIcon} aria-hidden="true">
              {icon}
            </span>
          )}
          <h3 className={styles.slideTitle}>{parseRichText(title)}</h3>
        </div>
        <div className={styles.slideHeaderRight}>
          <span>
            Slide {number}
            {totalSlides ? `/${totalSlides}` : ""}
          </span>
          <span className={styles.slideDuration}>{duration}s</span>
        </div>
      </div>

      {/* Render content based on layout type */}
      {layout === "title-only" ? (
        // Title-only layout (section divider)
        <div className={styles.slideTitleOnly}>
          {keyPoints[0] && (
            <p className={styles.slideTitleOnlyText}>
              {parseRichText(
                typeof keyPoints[0] === "string"
                  ? keyPoints[0]
                  : keyPoints[0].text,
              )}
            </p>
          )}
        </div>
      ) : layout === "image" && image ? (
        // Image-focused layout
        <div className={styles.slideImageLayout}>
          <img
            src={image}
            alt={imageCaption || title}
            className={styles.slideImage}
          />
          {imageCaption && (
            <p className={styles.slideImageCaption}>{imageCaption}</p>
          )}
          {keyPoints.length > 0 && (
            <ul className={styles.keyPointsList}>
              {keyPoints.map((point, i) => renderKeyPoint(point, i))}
            </ul>
          )}
        </div>
      ) : layout === "two-column" ? (
        // Two-column comparison layout
        <div className={styles.slideTwoColumn}>
          <div className={styles.slideColumn}>
            {leftColumnTitle && (
              <h4 className={styles.slideColumnTitle}>{leftColumnTitle}</h4>
            )}
            <ul className={styles.keyPointsList}>
              {(leftColumn || []).map((point, i) => renderKeyPoint(point, i))}
            </ul>
          </div>
          <div className={styles.slideColumnDivider} />
          <div className={styles.slideColumn}>
            {rightColumnTitle && (
              <h4 className={styles.slideColumnTitle}>{rightColumnTitle}</h4>
            )}
            <ul className={styles.keyPointsList}>
              {(rightColumn || []).map((point, i) => renderKeyPoint(point, i))}
            </ul>
          </div>
        </div>
      ) : layout === "quote" ? (
        // Quote/testimonial layout
        <div className={styles.slideQuote}>
          {keyPoints[0] && (
            <blockquote className={styles.slideQuoteText}>
              &ldquo;
              {parseRichText(
                typeof keyPoints[0] === "string"
                  ? keyPoints[0]
                  : keyPoints[0].text,
              )}
              &rdquo;
            </blockquote>
          )}
          {quoteAuthor && (
            <p className={styles.slideQuoteAuthor}>— {quoteAuthor}</p>
          )}
        </div>
      ) : layout === "code" && codeBlock ? (
        // Code block layout
        <div className={styles.slideCodeLayout}>
          <div className={styles.slideCodeBlock}>
            {codeLanguage && (
              <span className={styles.slideCodeLanguage}>{codeLanguage}</span>
            )}
            <pre className={styles.slideCodePre}>
              <code>{codeBlock}</code>
            </pre>
          </div>
          {keyPoints.length > 0 && (
            <ul className={styles.keyPointsList}>
              {keyPoints.map((point, i) => renderKeyPoint(point, i))}
            </ul>
          )}
        </div>
      ) : (
        // Default layout with key points
        <>
          {keyPoints.length > 0 && (
            <div className={styles.keyPointsSection}>
              <div className={styles.keyPointsLabel}>Key Points</div>
              <ul className={styles.keyPointsList}>
                {keyPoints.map((point, i) => renderKeyPoint(point, i))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Custom children content */}
      {children && <div className={styles.slideChildren}>{children}</div>}

      {/* Script */}
      {script && (
        <div className={styles.scriptSection}>
          <div className={styles.scriptLabel}>Script</div>
          <p className={styles.scriptText}>&quot;{script}&quot;</p>
        </div>
      )}
    </div>
  );
}
