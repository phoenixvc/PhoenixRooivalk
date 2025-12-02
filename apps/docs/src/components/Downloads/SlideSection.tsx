import * as React from "react";
import styles from "./Downloads.module.css";

/** Branded icon for slide decks - bar chart emoji */
const SLIDE_DECK_BRAND_ICON = "\u{1F4CA}"; // 📊

export interface SlideSectionProps {
  /** Slide number */
  number: number;
  /** Slide title */
  title: string;
  /** Duration in seconds */
  duration: number;
  /** Optional icon/emoji */
  icon?: string;
  /** Key points as children or array */
  keyPoints?: string[];
  /** Talking script */
  script?: string;
  /** Children content (alternative to keyPoints) */
  children?: React.ReactNode;
  /** Whether this is the first slide (shows larger brand icon) */
  isFirst?: boolean;
}

/**
 * SlideSection - A single slide that displays inline in the document
 * Can be grouped in a SlideDeck for download functionality
 */
export default function SlideSection({
  number,
  title,
  duration,
  icon,
  keyPoints,
  script,
  children,
  isFirst,
}: SlideSectionProps): React.ReactElement {
  return (
    <div className={styles.slidePage} data-slide-number={number}>
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
          <h3 className={styles.slideTitle}>{title}</h3>
        </div>
        <div className={styles.slideHeaderRight}>
          <span>Slide {number}</span>
          <span className={styles.slideDuration}>{duration}s</span>
        </div>
      </div>

      {/* Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <div className={styles.keyPointsSection}>
          <div className={styles.keyPointsLabel}>Key Points</div>
          <ul className={styles.keyPointsList}>
            {keyPoints.map((point, i) => (
              <li key={i} className={styles.keyPoint}>
                <span className={styles.keyPointBullet} aria-hidden="true">
                  {"\u25CF"}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
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
