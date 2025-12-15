/**
 * Calendar export utilities for generating RFC 5545-compliant iCalendar files
 * and calendar integration links.
 */

export interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  category?: string;
  url?: string;
}

/**
 * Formats a date for iCalendar format (YYYYMMDD or YYYYMMDDTHHmmssZ)
 */
function formatICalDate(date: Date, allDay: boolean = false): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (allDay) {
    return `${year}${month}${day}`;
  }

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters for iCalendar text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generates a unique identifier for an event
 */
function generateUID(event: CalendarEvent): string {
  const timestamp = event.startDate.getTime();
  const titleHash = event.title
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `${timestamp}-${titleHash}@phoenixrooivalk.com`;
}

/**
 * Converts a single event to iCalendar VEVENT format
 */
export function eventToICS(event: CalendarEvent): string {
  const lines: string[] = [];

  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${generateUID(event)}`);
  lines.push(`DTSTAMP:${formatICalDate(new Date(), false)}`);

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatICalDate(event.startDate, true)}`);
  } else {
    lines.push(`DTSTART:${formatICalDate(event.startDate, false)}`);
  }

  if (event.endDate) {
    if (event.allDay) {
      lines.push(`DTEND;VALUE=DATE:${formatICalDate(event.endDate, true)}`);
    } else {
      lines.push(`DTEND:${formatICalDate(event.endDate, false)}`);
    }
  } else if (event.allDay) {
    const nextDay = new Date(event.startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    lines.push(`DTEND;VALUE=DATE:${formatICalDate(nextDay, true)}`);
  }

  lines.push(`SUMMARY:${escapeICalText(event.title)}`);
  lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);

  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }

  if (event.category) {
    lines.push(`CATEGORIES:${escapeICalText(event.category)}`);
  }

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

/**
 * Generates a complete iCalendar file from multiple events
 */
export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [];

  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Phoenix Rooivalk//Events//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push("X-WR-CALNAME:Phoenix Rooivalk Events");
  lines.push("X-WR-CALDESC:Events and milestones for Phoenix Rooivalk");
  lines.push("X-WR-TIMEZONE:UTC");

  events.forEach((event) => {
    lines.push(eventToICS(event));
  });

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Triggers a download of the ICS file
 */
export function downloadICS(events: CalendarEvent[], filename: string): void {
  const icsContent = generateICS(events);
  const blob = new Blob([icsContent], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generates a Google Calendar URL for adding an event
 */
export function generateGoogleCalendarURL(event: CalendarEvent): string {
  const baseURL = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
  });

  if (event.location) {
    params.append("location", event.location);
  }

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const startDateFormatted = formatGoogleDate(event.startDate);
  if (event.endDate) {
    const endDateFormatted = formatGoogleDate(event.endDate);
    params.append("dates", `${startDateFormatted}/${endDateFormatted}`);
  } else {
    params.append("dates", `${startDateFormatted}/${startDateFormatted}`);
  }

  return `${baseURL}?${params.toString()}`;
}

/**
 * Generates an Outlook Calendar URL for adding an event
 */
export function generateOutlookCalendarURL(event: CalendarEvent): string {
  const baseURL = "https://outlook.live.com/calendar/0/deeplink/compose";
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    body: event.description,
  });

  if (event.location) {
    params.append("location", event.location);
  }

  params.append("startdt", event.startDate.toISOString());
  if (event.endDate) {
    params.append("enddt", event.endDate.toISOString());
  } else {
    const endDate = new Date(event.startDate);
    endDate.setHours(endDate.getHours() + 1);
    params.append("enddt", endDate.toISOString());
  }

  if (event.allDay) {
    params.append("allday", "true");
  }

  return `${baseURL}?${params.toString()}`;
}

/**
 * Opens a calendar URL in a new window
 */
export function openCalendarLink(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
