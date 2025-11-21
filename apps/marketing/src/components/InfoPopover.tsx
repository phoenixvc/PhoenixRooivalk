import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import styles from "./InfoPopover.module.css";

interface InfoPopoverProps {
  title: string;
  brands: string[];
  sources: string[];
  children: React.ReactNode;
  className?: string;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  title,
  brands,
  sources,
  children,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();

  const updatePosition = useCallback(() => {
    if (triggerRef.current && popoverRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      let x = rect.left + rect.width / 2 - popoverRect.width / 2;
      let y = rect.bottom + 8;

      // Adjust if popover goes off screen
      if (x < 8) x = 8;
      if (x + popoverRect.width > window.innerWidth - 8) {
        x = window.innerWidth - popoverRect.width - 8;
      }
      if (y + popoverRect.height > window.innerHeight - 8) {
        y = rect.top - popoverRect.height - 8;
      }

      setPosition({ x, y });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing position with DOM measurements
      updatePosition();
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();

      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleScroll, true);

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [isOpen, updatePosition]);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getSafeUrlInfo = (source: string) => {
    try {
      const url = new URL(source);
      return {
        href: source,
        displayText: url.hostname,
        isValid: true,
      };
    } catch {
      // Handle invalid URLs gracefully
      const sanitizedSource = source.replace(/[<>"']/g, "");
      return {
        href: source.startsWith("/") ? `https://example.com${source}` : "#",
        displayText:
          sanitizedSource.length > 50
            ? `${sanitizedSource.substring(0, 47)}...`
            : sanitizedSource,
        isValid: false,
      };
    }
  };

  return (
    <div
      className={`${styles.trigger} ${className}`}
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-describedby={isOpen ? uniqueId : undefined}
    >
      {children}

      {isOpen && (
        <div
          ref={popoverRef}
          className={styles.popover}
          style={{
            position: "fixed",
            left: position.x,
            top: position.y,
            zIndex: 1000,
          }}
          id={uniqueId}
          role="tooltip"
          aria-hidden={false}
        >
          <div className={styles.header}>
            <h4 className={styles.title}>{title}</h4>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close popover"
            >
              ×
            </button>
          </div>

          <div className={styles.content}>
            {brands.length > 0 && (
              <div className={styles.section}>
                <h5 className={styles.sectionTitle}>Real-World Analogues:</h5>
                <ul className={styles.list}>
                  {brands.map((brand, index) => (
                    <li key={index} className={styles.item}>
                      {brand}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sources.length > 0 && (
              <div className={styles.section}>
                <h5 className={styles.sectionTitle}>Sources:</h5>
                <ul className={styles.list}>
                  {sources.map((source, index) => {
                    const urlInfo = getSafeUrlInfo(source);
                    return (
                      <li key={index} className={styles.item}>
                        <a
                          href={urlInfo.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                          onClick={(e) => e.stopPropagation()}
                          title={urlInfo.isValid ? source : "Invalid URL"}
                        >
                          {urlInfo.displayText}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.arrow}></div>
        </div>
      )}
    </div>
  );
};

export default InfoPopover;
