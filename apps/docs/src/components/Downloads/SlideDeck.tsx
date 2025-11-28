import * as React from "react";
import styles from "./Downloads.module.css";

interface SlideDeckProps {
  /** Presentation title */
  title: string;
  /** Total duration in minutes */
  duration: number;
  /** Audience description */
  audience?: string;
  /** Date of presentation */
  date?: string;
  /** Children should be SlideSection components */
  children: React.ReactNode;
}

/**
 * SlideDeck - Container for slides with integrated download button
 * Wraps SlideSection components and provides print/download functionality
 */
export default function SlideDeck({
  title,
  duration,
  audience = "Investors/Advisors",
  date,
  children,
}: SlideDeckProps): React.ReactElement {
  const deckRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = React.useCallback(() => {
    const originalTitle = document.title;
    document.title = `${title} - ${duration}-Min Presentation`;

    // Add print class for styling
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
  }, [title, duration]);

  // Count slides from children
  const slideCount = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.props["data-slide-number"]
  ).length;

  return (
    <div className={styles.slideDeckContainer} ref={deckRef}>
      {/* Header with download button */}
      <div className={styles.slideDeckHeader}>
        <div className={styles.slideDeckInfo}>
          <h2 className={styles.slideDeckTitle}>{title}</h2>
          <div className={styles.slideDeckMeta}>
            <span>{duration} min</span>
            <span className={styles.metaSeparator}>|</span>
            <span>{slideCount || React.Children.count(children)} slides</span>
            <span className={styles.metaSeparator}>|</span>
            <span>{audience}</span>
            {date && (
              <>
                <span className={styles.metaSeparator}>|</span>
                <span>{date}</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className={styles.downloadDeckButton}
          aria-label={`Download ${title} as PDF`}
        >
          <span aria-hidden="true">{"\uD83D\uDCE5"}</span>
          <span>Download Slide Deck</span>
        </button>
      </div>

      {/* Slides */}
      <div className={styles.slidesContainer}>{children}</div>

      {/* Footer */}
      <div className={styles.slideDeckFooter}>
        <span>
          Total: {slideCount || React.Children.count(children)} slides |{" "}
          {duration} minutes
        </span>
      </div>
    </div>
  );
}
