import React, { useState, useRef, useEffect } from "react";
import styles from "./CalendarExport.module.css";
import type { CalendarEvent } from "../utils/calendar";
import {
  downloadICS,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  openCalendarLink,
} from "../utils/calendar";

interface CalendarExportProps {
  events: CalendarEvent[];
  buttonText?: string;
  filename?: string;
}

/**
 * CalendarExport provides a dropdown interface for exporting calendar events
 * to various calendar applications.
 *
 * @component
 * @example
 * ```tsx
 * <CalendarExport
 *   events={calendarEvents}
 *   buttonText="Add to Calendar"
 *   filename="phoenix-rooivalk-timeline"
 * />
 * ```
 */
export const CalendarExport: React.FC<CalendarExportProps> = ({
  events,
  buttonText = "Add to My Calendar",
  filename = "phoenix-rooivalk-timeline",
}) => {
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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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
    // For multiple events, download ICS (Google Calendar can import it)
    if (events.length > 1) {
      downloadICS(events, filename);
    } else if (events.length === 1) {
      const url = generateGoogleCalendarURL(events[0]);
      openCalendarLink(url);
    }
    setIsOpen(false);
  };

  const handleOutlookCalendar = () => {
    // For multiple events, download ICS (Outlook can import it)
    if (events.length > 1) {
      downloadICS(events, filename);
    } else if (events.length === 1) {
      const url = generateOutlookCalendarURL(events[0]);
      openCalendarLink(url);
    }
    setIsOpen(false);
  };

  const handleAppleCalendar = () => {
    // Apple Calendar uses ICS files
    downloadICS(events, filename);
    setIsOpen(false);
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className={styles.exportButton}>
      <button
        ref={buttonRef}
        className={styles.button}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={buttonText}
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        <svg
          className={styles.buttonIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {buttonText}
        <svg
          className={styles.buttonIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={styles.dropdown}
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
            <svg
              className={styles.dropdownIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className={styles.dropdownLabel}>
              Download .ics File
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
            <svg
              className={styles.dropdownIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className={styles.dropdownLabel}>
              Google Calendar
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
            <svg
              className={styles.dropdownIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2m0 2v16h10V4H7m2 2h6v2H9V6m0 4h6v2H9v-2m0 4h4v2H9v-2z" />
            </svg>
            <span className={styles.dropdownLabel}>
              Outlook Calendar
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
            <svg
              className={styles.dropdownIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className={styles.dropdownLabel}>
              Apple Calendar
              <span className={styles.dropdownDescription}>
                Download .ics file
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
