/**
 * Tests for Calendar Export Utilities
 */

import { describe, it, expect } from "vitest";
import {
  eventToICS,
  generateICS,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  type CalendarEvent,
} from "../utils/calendar";

describe("Calendar Export Utilities", () => {
  const sampleEvent: CalendarEvent = {
    title: "Test Event",
    description: "This is a test event description",
    location: "Test Location",
    startDate: new Date("2026-05-01T00:00:00Z"),
    allDay: true,
    category: "Test Category",
    url: "https://example.com",
  };

  describe("eventToICS", () => {
    it("should generate valid VEVENT format", () => {
      const ics = eventToICS(sampleEvent);

      expect(ics).toContain("BEGIN:VEVENT");
      expect(ics).toContain("END:VEVENT");
      expect(ics).toContain("SUMMARY:Test Event");
      expect(ics).toContain("DESCRIPTION:This is a test event description");
      expect(ics).toContain("LOCATION:Test Location");
      expect(ics).toContain("CATEGORIES:Test Category");
      expect(ics).toContain("URL:https://example.com");
    });

    it("should format all-day events correctly", () => {
      const ics = eventToICS(sampleEvent);

      expect(ics).toContain("DTSTART;VALUE=DATE:20260501");
      expect(ics).toContain("DTEND;VALUE=DATE:20260502");
    });

    it("should format timed events correctly", () => {
      const timedEvent: CalendarEvent = {
        ...sampleEvent,
        allDay: false,
        startDate: new Date("2026-05-01T10:00:00Z"),
        endDate: new Date("2026-05-01T11:00:00Z"),
      };

      const ics = eventToICS(timedEvent);

      expect(ics).toContain("DTSTART:20260501T100000Z");
      expect(ics).toContain("DTEND:20260501T110000Z");
    });

    it("should escape special characters", () => {
      const eventWithSpecialChars: CalendarEvent = {
        title: "Test; Event, With\\Special\nChars",
        description: "Description; with, special\\chars\nnewline",
        startDate: new Date("2026-05-01T00:00:00Z"),
        allDay: true,
      };

      const ics = eventToICS(eventWithSpecialChars);

      expect(ics).toContain("SUMMARY:Test\\; Event\\, With\\\\Special\\nChars");
      expect(ics).toContain(
        "DESCRIPTION:Description\\; with\\, special\\\\chars\\nnewline",
      );
    });

    it("should generate unique UIDs", () => {
      const ics1 = eventToICS(sampleEvent);
      const ics2 = eventToICS({
        ...sampleEvent,
        title: "Different Title",
      });

      const uid1 = ics1.match(/UID:([^\r\n]+)/)?.[1];
      const uid2 = ics2.match(/UID:([^\r\n]+)/)?.[1];

      expect(uid1).toBeDefined();
      expect(uid2).toBeDefined();
      expect(uid1).not.toBe(uid2);
    });

    it("should include DTSTAMP", () => {
      const ics = eventToICS(sampleEvent);
      expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    });
  });

  describe("generateICS", () => {
    it("should generate valid iCalendar file with multiple events", () => {
      const events: CalendarEvent[] = [
        sampleEvent,
        {
          title: "Event 2",
          description: "Second event",
          startDate: new Date("2026-06-01T00:00:00Z"),
          allDay: true,
        },
      ];

      const ics = generateICS(events);

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("END:VCALENDAR");
      expect(ics).toContain("VERSION:2.0");
      expect(ics).toContain("PRODID:-//Phoenix Rooivalk//Timeline Events//EN");
      expect(ics).toContain("X-WR-CALNAME:Phoenix Rooivalk Timeline");

      // Should contain both events
      expect(ics).toContain("SUMMARY:Test Event");
      expect(ics).toContain("SUMMARY:Event 2");

      // Should have two VEVENT blocks
      const veventMatches = ics.match(/BEGIN:VEVENT/g);
      expect(veventMatches).toHaveLength(2);
    });

    it("should use CRLF line endings", () => {
      const ics = generateICS([sampleEvent]);
      expect(ics).toContain("\r\n");
      expect(ics.split("\r\n").length).toBeGreaterThan(1);
    });

    it("should handle empty events array", () => {
      const ics = generateICS([]);

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("END:VCALENDAR");

      // Should not contain any VEVENT blocks
      expect(ics).not.toContain("BEGIN:VEVENT");
    });
  });

  describe("generateGoogleCalendarURL", () => {
    it("should generate valid Google Calendar URL", () => {
      const url = generateGoogleCalendarURL(sampleEvent);

      expect(url).toContain("calendar.google.com/calendar/render");
      expect(url).toContain("action=TEMPLATE");
      expect(url).toContain("text=Test+Event");
      expect(url).toContain(
        "details=This+is+a+test+event+description",
      );
      expect(url).toContain("location=Test+Location");
    });

    it("should include formatted dates", () => {
      const url = generateGoogleCalendarURL(sampleEvent);
      expect(url).toContain("dates=");
    });

    it("should handle events without location", () => {
      const eventNoLocation: CalendarEvent = {
        title: "Event",
        description: "Description",
        startDate: new Date("2026-05-01T00:00:00Z"),
        allDay: true,
      };

      const url = generateGoogleCalendarURL(eventNoLocation);
      expect(url).not.toContain("location=");
    });
  });

  describe("generateOutlookCalendarURL", () => {
    it("should generate valid Outlook Calendar URL", () => {
      const url = generateOutlookCalendarURL(sampleEvent);

      expect(url).toContain("outlook.live.com/calendar");
      expect(url).toContain("subject=Test+Event");
      expect(url).toContain(
        "body=This+is+a+test+event+description",
      );
      expect(url).toContain("location=Test+Location");
    });

    it("should include ISO date format", () => {
      const url = generateOutlookCalendarURL(sampleEvent);
      expect(url).toContain("startdt=");
      expect(url).toContain("enddt=");
    });

    it("should set allday parameter for all-day events", () => {
      const url = generateOutlookCalendarURL(sampleEvent);
      expect(url).toContain("allday=true");
    });

    it("should handle events without end date", () => {
      const url = generateOutlookCalendarURL(sampleEvent);
      expect(url).toContain("startdt=");
      expect(url).toContain("enddt=");
    });
  });

  describe("Date formatting", () => {
    it("should handle dates in different time zones consistently", () => {
      const event1: CalendarEvent = {
        title: "Event 1",
        description: "Test",
        startDate: new Date("2026-05-01T00:00:00Z"),
        allDay: true,
      };

      const event2: CalendarEvent = {
        title: "Event 2",
        description: "Test",
        startDate: new Date("2026-05-01T10:00:00+05:00"),
        allDay: true,
      };

      const ics1 = eventToICS(event1);
      const ics2 = eventToICS(event2);

      // Both should have consistent date format for all-day events
      expect(ics1).toContain("DTSTART;VALUE=DATE:20260501");
      expect(ics2).toContain("DTSTART;VALUE=DATE:20260501");
    });

    it("should handle year-end dates correctly", () => {
      const event: CalendarEvent = {
        title: "New Year Event",
        description: "Test",
        startDate: new Date("2026-12-31T00:00:00Z"),
        allDay: true,
      };

      const ics = eventToICS(event);

      expect(ics).toContain("DTSTART;VALUE=DATE:20261231");
      expect(ics).toContain("DTEND;VALUE=DATE:20270101");
    });
  });
});
