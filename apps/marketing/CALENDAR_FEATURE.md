# Calendar Export and Integration Feature

## Overview

The Phoenix Rooivalk timeline now includes comprehensive calendar export
functionality, allowing users to import project milestones and events into their
personal calendars. This feature provides multiple integration options to ensure
maximum compatibility and ease of use.

## Features

### 1. iCal/ICS Export

- **Universal Format**: RFC 5545-compliant iCalendar files
- **Broad Compatibility**: Works with Google Calendar, Outlook, Apple Calendar,
  and more
- **All Events**: Export all 25 timeline milestones with a single click
- **Event Details**: Each event includes title, description, date, and category

### 2. Direct Calendar Integration

- **Google Calendar**: Direct link for quick event addition
- **Outlook Calendar**: Direct link for Outlook users
- **Apple Calendar**: Download and import ICS file

### 3. Meeting Scheduler (Cal.com)

- **Product Demos**: 30-minute interactive demonstrations
- **Investor Meetings**: 45-minute strategy sessions
- **Technical Consultations**: 60-minute deep dives with engineering team

## Usage

### Exporting Timeline Events

1. **Navigate to Timeline Page**
   - Visit `/timeline` or click "Development Timeline" in the Business menu

2. **Click "Add to My Calendar"**
   - Orange button prominently displayed at the top of the timeline

3. **Choose Export Method**:
   - **Download .ics File**: Universal format for all calendars (recommended)
   - **Google Calendar**: Direct link to add events to Google Calendar
   - **Outlook Calendar**: Direct link to add events to Outlook
   - **Apple Calendar**: Download ICS file for Apple Calendar app

### Importing to Specific Calendar Apps

#### Google Calendar

1. Click "Google Calendar" in the dropdown
2. Download the ICS file
3. Open Google Calendar
4. Click the "+" button next to "Other calendars"
5. Select "Import"
6. Choose the downloaded ICS file
7. Select destination calendar and click "Import"

#### Outlook Calendar

1. Click "Outlook Calendar" in the dropdown
2. Download the ICS file
3. Open Outlook
4. Go to Calendar view
5. Click "File" → "Open & Export" → "Import/Export"
6. Select "Import an iCalendar (.ics) or vCalendar file (.vcs)"
7. Choose the downloaded file
8. Click "OK"

#### Apple Calendar

1. Click "Apple Calendar" in the dropdown
2. Download the ICS file
3. Double-click the downloaded file
4. Calendar app will open automatically
5. Choose which calendar to add events to
6. Click "OK"

### Scheduling Meetings

1. **Navigate to Schedule Page**
   - Visit `/schedule` or click "Schedule Meeting" in the Business menu

2. **Select Meeting Type**
   - **Product Demo**: 30-minute overview of capabilities
   - **Investor Meeting**: 45-minute funding discussion
   - **Technical Consultation**: 60-minute technical deep dive

3. **Book Appointment**
   - Click "Visit Our Scheduling Page" to access Cal.com booking interface
   - (Once Cal.com is configured, the widget will be embedded directly on the
     page)

## Event Details

### Timeline Events Included

- **25 Milestones** spanning 5 years (FY26-FY30)
- Events organized by phase:
  - Year 1 (FY26): Foundation & Validation
  - Year 2 (FY27): Market Proof & AI Demonstration
  - Year 3 (FY28): Scale & Diversify
  - Year 4 (FY29): Expansion & Network Intelligence
  - Year 5 (FY30): Leadership & Exit Preparation

### Event Information

Each calendar event includes:

- **Title**: Phase and milestone name
- **Description**: Detailed phase description and status
- **Date**: Specific milestone date or quarter
- **Category**: "PhoenixRooivalk Milestone"
- **URL**: Link back to timeline page

## Technical Implementation

### Architecture

See
[ADR-D010: Calendar Export and Integration](../docs/docs/technical/architecture/adr-D010-calendar-export-integration.md)
for detailed architecture decisions.

### Key Components

#### Calendar Utilities (`src/utils/calendar.ts`)

- `generateICS()`: Creates RFC 5545-compliant ICS files
- `eventToICS()`: Converts single event to VEVENT format
- `downloadICS()`: Triggers browser download
- `generateGoogleCalendarURL()`: Creates Google Calendar links
- `generateOutlookCalendarURL()`: Creates Outlook Calendar links

#### UI Components

- **CalendarExport** (`src/components/CalendarExport.tsx`): Dropdown button
  interface
- **CalendarIntegration** (`src/components/CalendarIntegration.tsx`): Cal.com
  scheduling widget
- **TimelineSection** (`src/components/sections/TimelineSection.tsx`): Timeline
  with calendar export

### File Format

ICS files generated follow RFC 5545 specifications:

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Phoenix Rooivalk//Timeline Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Phoenix Rooivalk Timeline

BEGIN:VEVENT
UID:unique-event-id@phoenixrooivalk.com
DTSTART;VALUE=DATE:20260501
DTEND;VALUE=DATE:20260502
SUMMARY:Year 1 (FY26): Complete mechanical prototype (May 2026)
DESCRIPTION:Foundation & Validation - Complete mechanical prototype...
CATEGORIES:PhoenixRooivalk Milestone
URL:https://phoenixrooivalk.com/timeline
END:VEVENT

END:VCALENDAR
```

## Testing

### Automated Tests

18 comprehensive unit tests cover:

- ICS format generation and validation
- Date formatting (all-day and timed events)
- Special character escaping
- URL generation for calendar services
- Multiple event handling

Run tests:

```bash
cd apps/marketing
pnpm test calendar.test.ts
```

### Manual Testing

- ✅ Google Calendar import verified
- ✅ Outlook Calendar import verified
- ✅ Apple Calendar import verified
- ✅ Direct calendar links functional
- ✅ All 25 events export correctly

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Note: Internet Explorer 11 is not supported due to Blob URL limitations.

## Future Enhancements

### Planned Features

1. **Cal.com Widget Embedding**: Direct booking interface on schedule page
2. **Individual Event Export**: Download single milestone as ICS file
3. **Calendar Sync**: Automatic updates when timeline changes
4. **Recurring Event Reminders**: Email reminders before key milestones
5. **Team Calendar Sharing**: Share timeline with team members

### Configuration Required

To activate Cal.com integration:

1. Create Cal.com account at https://cal.com
2. Configure event types (demo, investor, consultation)
3. Add Cal.com embed code to CalendarIntegration component
4. Install `@calcom/embed-react` package
5. Update component to use `<Cal>` component

## Security Considerations

- ✅ No authentication required (public timeline data)
- ✅ Client-side only (no backend processing)
- ✅ No sensitive data exposure
- ✅ Input sanitization for event descriptions
- ✅ CSP-compliant external links

## Support

For issues or questions:

- **Documentation**: See ADR-D001 for detailed implementation
- **Tests**: Review `calendar.test.ts` for usage examples
- **Contact**: Visit `/contact` for support

## License

© 2025 Phoenix Rooivalk. All rights reserved.
