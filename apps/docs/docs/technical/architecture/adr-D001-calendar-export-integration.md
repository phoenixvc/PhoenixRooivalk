---
id: adr-D001-calendar-export-integration
title: "ADR D001: Calendar Export and Integration"
sidebar_label: "ADR D001: Calendar Export"
difficulty: intermediate
estimated_reading_time: 7
points: 25
tags:
  - technical
  - integration
  - calendar
  - export
  - development
prerequisites: []
---

# ADR D001: Calendar Export and Integration

**Date**: 2025-12-09 **Status**: Accepted

---

## Executive Summary

1. **Problem**: Project timeline and milestones are only viewable on the website; users cannot import them into their personal calendars
2. **Decision**: Implement iCal/ICS export with Google Calendar and Outlook integration, plus Cal.com booking integration
3. **Trade-off**: Standard iCal format ensures broad compatibility but requires manual maintenance of event data

---

## Context

PhoenixRooivalk's 5-year strategic roadmap (2025-2030) contains critical milestones and deadlines spanning multiple years. Currently, this information is only accessible through the marketing website's timeline page. Stakeholders, investors, and team members need the ability to:

- Import roadmap milestones into their personal calendars
- Receive reminders for key deliverables and deadlines
- View project timeline alongside other commitments
- Schedule meetings and collaboration sessions around milestones

The timeline includes 5 major phases with approximately 25 individual milestones, each tied to specific quarters or months. These events need to be:
- Downloadable in a universal calendar format
- Importable into popular calendar applications (Google Calendar, Outlook, Apple Calendar)
- Accessible via direct integration links
- Optionally integrated with scheduling systems for booking demos and meetings

---

## Options Considered

### Option 1: iCal/ICS File Export Only ✅ Selected

**Description**: Generate RFC 5545-compliant iCalendar (.ics) files from timeline data that users can download and import into any calendar application.

**Pros**:
- Universal compatibility (works with Google Calendar, Outlook, Apple Calendar, etc.)
- No external API dependencies or rate limits
- Fully client-side generation (no backend required)
- Privacy-friendly (no data sent to third parties)
- Simple implementation with standard libraries
- Works offline after initial download

**Cons**:
- Requires manual import by users
- No automatic updates when timeline changes
- Multiple steps for end users (download → import)
- No native calendar UI integration

**Implementation Complexity**: Low (1-2 days)
**Cost**: None

---

### Option 2: Calendar API Direct Integration

**Description**: Use Google Calendar API and Microsoft Graph API to directly add events to users' calendars after OAuth authentication.

**Pros**:
- One-click experience for users
- Automatic updates possible
- Deep integration with calendar services

**Cons**:
- Requires OAuth flow and user consent
- Separate API integration for each calendar service
- Rate limits and quotas to manage
- Privacy concerns (requires calendar write access)
- Backend service required to store tokens
- Increased security surface area
- Higher implementation complexity

**Implementation Complexity**: High (1-2 weeks)
**Cost**: Medium (OAuth service hosting, potential API costs)

---

### Option 3: "Add to Calendar" Button Services

**Description**: Use third-party services like AddEvent.com or AddToCalendar to provide pre-configured calendar links.

**Pros**:
- Simple drop-in solution
- Multiple calendar services supported
- Better UX than manual download
- No OAuth required

**Cons**:
- Dependency on third-party service
- Potential service availability issues
- Some services require paid plans for full features
- Less control over generated events
- May include branding/ads in free tiers

**Implementation Complexity**: Low (1 day)
**Cost**: Low to Medium (free tier limits, potential paid plans)

---

## Decision

**Adopt Option 1 (iCal/ICS Export) with Option 3 (Add to Calendar Links) as supplementary integration.**

### Primary Implementation: iCal/ICS Export

We will implement client-side generation of RFC 5545-compliant iCalendar files containing all roadmap milestones. The implementation will:

1. **Generate ICS files** with proper formatting:
   - PRODID and VERSION headers
   - VEVENT blocks for each milestone
   - DTSTART/DTEND with appropriate date formats
   - SUMMARY, DESCRIPTION, and LOCATION fields
   - CATEGORIES for filtering (e.g., "PhoenixRooivalk Milestone")
   - UID for event uniqueness

2. **Provide download functionality** via:
   - "Download All Events" button (single .ics file with all milestones)
   - Individual event export (per-milestone download)
   - Blob URL generation for instant download

3. **Ensure broad compatibility**:
   - All-day events for milestones without specific times
   - UTF-8 encoding for international character support
   - CRLF line endings per RFC 5545
   - Proper escaping of special characters

### Supplementary Integration: "Add to Calendar" Links

To reduce friction, we will also implement direct calendar links:

1. **Google Calendar**: URL-based event creation (`calendar.google.com/calendar/render`)
2. **Outlook Calendar**: URL-based event creation (`outlook.live.com/calendar`)
3. **Cal.com Integration**: Embed Cal.com scheduling widget for booking demos/consultations

### Interface Design

The calendar export interface will include:

1. **Primary CTA Button**: "Add to My Calendar" dropdown with options:
   - Download All Events (.ics file)
   - Add to Google Calendar
   - Add to Outlook Calendar
   - Individual milestone export

2. **Cal.com Widget**: Embedded scheduling interface for:
   - Product demos
   - Investor meetings
   - Technical consultations

3. **Visual Indicators**: Icons showing which calendar services are supported

---

## Consequences

### Positive

1. **Universal Compatibility**: iCal format works with all major calendar applications
2. **No External Dependencies**: Primary feature (ICS export) works without third-party APIs
3. **Privacy-Preserving**: No calendar permissions or OAuth required
4. **Offline-Capable**: Users can download once and import anywhere
5. **Low Maintenance**: No API tokens, rate limits, or service dependencies to manage
6. **Progressive Enhancement**: Direct links provide better UX while maintaining fallback
7. **Scheduling Integration**: Cal.com widget enables direct booking without calendar export

### Negative

1. **Manual Import Required**: Users must perform import action themselves
2. **No Auto-Updates**: Changes to timeline require re-download and re-import
3. **Multi-Step Process**: Download → Open Calendar → Import (vs. one-click API integration)
4. **Limited Analytics**: Cannot track which users imported events
5. **Cal.com Dependency**: Scheduling widget depends on external service availability

### Neutral

1. **User Education Needed**: Brief instructions on how to import .ics files
2. **Browser Compatibility**: Blob downloads work in all modern browsers (IE11+ not supported)
3. **File Size**: ~5KB for all events (negligible)

---

## Implementation Plan

### Phase 1: Core ICS Export (Week 1)

1. Create `/apps/marketing/src/utils/calendar.ts`:
   - `generateICS(events: Event[]): string` - Generate RFC 5545 ICS content
   - `downloadICS(events: Event[], filename: string): void` - Trigger download
   - `eventToICS(event: Event): string` - Convert single event to VEVENT format

2. Create `/apps/marketing/src/components/CalendarExport.tsx`:
   - Dropdown button UI
   - "Download All" functionality
   - Per-event download buttons

3. Update `/apps/marketing/src/components/sections/TimelineSection.tsx`:
   - Add CalendarExport component
   - Extract timeline data into exportable format

### Phase 2: Direct Calendar Links (Week 1)

1. Add Google Calendar URL generation to `calendar.ts`
2. Add Outlook Calendar URL generation to `calendar.ts`
3. Update CalendarExport component with direct link options

### Phase 3: Cal.com Integration (Week 2)

1. Create Cal.com account and configure booking types
2. Create `/apps/marketing/src/components/CalendarIntegration.tsx`:
   - Embed Cal.com widget
   - Configure event types (demo, investor meeting, consultation)
3. Add to timeline page and/or contact page

### Phase 4: Testing & Documentation (Week 2)

1. Test ICS import in Google Calendar, Outlook, Apple Calendar
2. Verify direct link functionality
3. Test Cal.com widget responsiveness
4. Document usage in README
5. Add inline help/tooltips for users

---

## Testing Strategy

### Manual Testing

- [ ] Download ICS file and verify valid RFC 5545 format
- [ ] Import to Google Calendar and verify all events appear correctly
- [ ] Import to Outlook and verify all events appear correctly
- [ ] Import to Apple Calendar and verify all events appear correctly
- [ ] Test direct Google Calendar link
- [ ] Test direct Outlook link
- [ ] Test Cal.com widget booking flow

### Automated Testing

- [ ] Unit test: `generateICS()` produces valid ICS format
- [ ] Unit test: Date formatting is correct for all-day events
- [ ] Unit test: Special characters are properly escaped
- [ ] Integration test: CalendarExport button triggers download
- [ ] Snapshot test: CalendarExport component UI

---

## Security Considerations

1. **No Sensitive Data**: Timeline is public information; no ITAR/sensitive content
2. **Client-Side Only**: No backend processing or data storage required
3. **No Authentication**: Public feature accessible to all website visitors
4. **XSS Prevention**: Sanitize event descriptions before ICS generation
5. **Cal.com Widget**: Use official embed code with CSP-compliant sources

---

## Monitoring & Success Metrics

While the primary ICS export doesn't provide direct analytics, we can track:

1. **Click Tracking**: Monitor "Add to Calendar" button clicks via analytics
2. **Download Counts**: Track .ics file download events
3. **Cal.com Analytics**: Booking conversion rates through widget
4. **User Feedback**: Monitor support requests related to calendar import

**Success Criteria**:
- Zero import errors reported across major calendar platforms
- <2 clicks from timeline page to calendar event
- Cal.com booking widget achieves >10% conversion rate from views

---

## References

- [RFC 5545 - Internet Calendaring and Scheduling (iCalendar)](https://tools.ietf.org/html/rfc5545)
- [Google Calendar URL Scheme](https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md)
- [Outlook Calendar URL Scheme](https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/outlook-live.md)
- [Cal.com Developer Documentation](https://cal.com/docs)

---

## Change Log

| Date       | Change                                  | Author    |
| ---------- | --------------------------------------- | --------- |
| 2025-12-09 | Initial ADR created                     | AI Agent  |

---

## Notes

This ADR follows the template defined in ADR-0000. Future calendar-related decisions (e.g., adding other calendar services, implementing sync, or migration to API integration) should reference this document and create superseding ADRs if the architecture changes.
