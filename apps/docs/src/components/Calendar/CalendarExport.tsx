import React, { useState, useRef, useEffect } from "react";
import styles from "./Calendar.module.css";
import type { CalendarEvent } from "./calendar";
import {
  downloadICS,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  openCalendarLink,
} from "./calendar";

interface CalendarExportProps {
  /** Events to export */
  events: CalendarEvent[];
  /** Button text */
  buttonText?: string;
  /** Filename for downloaded ICS file */
  filename?: string;
  /** Variant style */
  variant?: "primary" | "secondary" | "outline";
  /** Size */
  size?: "small" | "medium" | "large";
}

/**
 * CalendarExport provides a dropdown interface for exporting calendar events
 * to various calendar applications.
 *
 * @example
 * ```tsx
 * <CalendarExport
 *   events={[{
 *     title: "Product Demo",
 *     description: "Phoenix Rooivalk demonstration",
 *     startDate: new Date("2025-01-15T14:00:00Z"),
 *     allDay: false
 *   }]}
 *   buttonText="Add to Calendar"
 * />
 * ```
 */
export default function CalendarExport({
  events,
  buttonText = "Add to Calendar",
  filename = "phoenix-rooivalk-event",
  variant = "primary",
  size = "medium",
}: CalendarExportProps): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleDownloadAll = () => {
    downloadICS(events, filename);
    setIsOpen(false);
  };

  const handleGoogleCalendar = () => {
    if (events.length > 1) {
      downloadICS(events, filename);
    } else if (events.length === 1) {
      const url = generateGoogleCalendarURL(events[0]);
      openCalendarLink(url);
    }
    setIsOpen(false);
  };

  const handleOutlookCalendar = () => {
    if (events.length > 1) {
      downloadICS(events, filename);
    } else if (events.length === 1) {
      const url = generateOutlookCalendarURL(events[0]);
      openCalendarLink(url);
    }
    setIsOpen(false);
  };

  const handleAppleCalendar = () => {
    downloadICS(events, filename);
    setIsOpen(false);
  };

  if (events.length === 0) {
    return null;
  }

  const buttonClasses = [
    styles.calendarButton,
    styles[`calendarButton${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`calendarButton${size.charAt(0).toUpperCase() + size.slice(1)}`],
  ].join(" ");

  return (
    <div className={styles.calendarExport}>
      <button
        ref={buttonRef}
        className={buttonClasses}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={buttonText}
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        <span className={styles.calendarIcon}>{"\u{1F4C5}"}</span>
        {buttonText}
        <span
          className={styles.chevron}
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          {"\u25BC"}
        </span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={styles.calendarDropdown}
          role="menu"
          aria-label="Calendar export options"
        >
          <div className={styles.dropdownHeader}>
            Export {events.length} Event{events.length !== 1 ? "s" : ""}
          </div>

          <button
            className={styles.dropdownItem}
            onClick={handleDownloadAll}
            role="menuitem"
            type="button"
          >
            <span className={styles.dropdownIcon}>{"\u{2B07}"}</span>
            <span className={styles.dropdownLabel}>
              <span className={styles.dropdownTitle}>Download .ics File</span>
              <span className={styles.dropdownDescription}>
                Universal format for all calendars
              </span>
            </span>
          </button>

          <div className={styles.divider} />

          <button
            className={styles.dropdownItem}
            onClick={handleGoogleCalendar}
            role="menuitem"
            type="button"
          >
            <span className={styles.dropdownIcon}>G</span>
            <span className={styles.dropdownLabel}>
              <span className={styles.dropdownTitle}>Google Calendar</span>
              <span className={styles.dropdownDescription}>
                {events.length > 1 ? "Import .ics file" : "Add directly"}
              </span>
            </span>
          </button>

          <button
            className={styles.dropdownItem}
            onClick={handleOutlookCalendar}
            role="menuitem"
            type="button"
          >
            <span className={styles.dropdownIcon}>O</span>
            <span className={styles.dropdownLabel}>
              <span className={styles.dropdownTitle}>Outlook Calendar</span>
              <span className={styles.dropdownDescription}>
                {events.length > 1 ? "Import .ics file" : "Add directly"}
              </span>
            </span>
          </button>

          <button
            className={styles.dropdownItem}
            onClick={handleAppleCalendar}
            role="menuitem"
            type="button"
          >
            <span className={styles.dropdownIcon}>{"\u{F8FF}"}</span>
            <span className={styles.dropdownLabel}>
              <span className={styles.dropdownTitle}>Apple Calendar</span>
              <span className={styles.dropdownDescription}>
                Download .ics file
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
