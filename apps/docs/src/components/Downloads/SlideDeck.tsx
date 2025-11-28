import * as React from "react";
import styles from "./Downloads.module.css";

export interface SlideDeckProps {
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

  // Extract slide info from children
  const slideInfo = React.useMemo(() => {
    const slides = React.Children.toArray(children).filter(
      (
        child,
      ): child is React.ReactElement<{ number: number; duration?: number }> =>
        React.isValidElement(child) &&
        typeof (child.props as { number?: number }).number === "number",
    );
    const count = slides.length;
    const totalSeconds = slides.reduce(
      (sum, slide) => sum + (slide.props.duration || 0),
      0,
    );
    return { count, totalSeconds };
  }, [children]);

  const slideCount = slideInfo.count;

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

      {/* Print-only title page */}
      <div className={styles.printTitlePage}>
        <h1 className={styles.printTitle}>{title}</h1>
        <p className={styles.printMeta}>
          {duration}-Minute Presentation | {slideCount} Slides
        </p>
        <p className={styles.printAudience}>{audience}</p>
        {date && <p className={styles.printDate}>{date}</p>}
      </div>

      {/* Slides */}
      <div className={styles.slidesContainer}>{children}</div>

      {/* Footer */}
      <div className={styles.slideDeckFooter}>
        <span>
          Total: {slideCount || React.Children.count(children)} slides |{" "}
          {slideInfo.totalSeconds}s ({duration} min)
        </span>
      </div>
    </div>
  );
}
