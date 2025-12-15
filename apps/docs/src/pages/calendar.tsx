/**
 * Project Calendar Page
 *
 * Displays all project dates, deadlines, milestones, and events
 * in a unified timeline view.
 */

import React, { useState, useMemo } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { downloadICS, generateICS, type CalendarEvent } from "../components/Calendar";
import BookingWidget from "../components/Calendar/BookingWidget";
import styles from "./calendar.module.css";

interface CalendarItem {
  date: string;
  title: string;
  description: string;
  category: "opportunity" | "development" | "compliance" | "meeting" | "funding" | "hackathon";
  priority: "critical" | "high" | "medium" | "low";
  link?: string;
}

// All calendar events consolidated from project data
const calendarEvents: CalendarItem[] = [
  // ============================================
  // Q4 2025 - IMMEDIATE DEADLINES
  // ============================================
  {
    date: "2025-12-01",
    title: "Movement M1 Hackathon Starts",
    description: "4-week hackathon, $30K prize pool - Move language for evidence anchoring",
    category: "hackathon",
    priority: "high",
  },
  {
    date: "2025-12-06",
    title: "Encode Club Scoop AI London",
    description: "London event, $10K prizes, AI agent track",
    category: "hackathon",
    priority: "medium",
  },
  {
    date: "2025-12-15",
    title: "Canada CUAS Sandbox Application Deadline",
    description: "Submit application via PriviDox by 2:00 PM ET - $1.75M CAD prize pool",
    category: "opportunity",
    priority: "critical",
    link: "/docs/business/opportunities/cuas-sandbox-2026",
  },
  {
    date: "2025-12-15",
    title: "Solana Winter Build Challenge",
    description: "4-week sprint, $10K+ prizes, x402 payment protocol integration",
    category: "hackathon",
    priority: "high",
  },
  {
    date: "2025-12-31",
    title: "AWS Kiro Startup Credits Deadline",
    description: "Free Kiro Pro+ access - Apply before year end",
    category: "funding",
    priority: "high",
  },
  {
    date: "2025-12-31",
    title: "Q4 2025 Milestone Review",
    description: "Quarterly review of progress and objectives",
    category: "meeting",
    priority: "high",
  },

  // ============================================
  // Q1 2026
  // ============================================
  {
    date: "2026-01-01",
    title: "DARPA Lift Challenge Registration Opens",
    description: "Heavy-lift drone challenge, $6.5M total prizes",
    category: "opportunity",
    priority: "high",
  },
  {
    date: "2026-01-15",
    title: "Prototype Validation Target",
    description: "Net launcher prototype manufactured and validated",
    category: "development",
    priority: "critical",
    link: "/docs/progress/progress-overview",
  },
  {
    date: "2026-01-31",
    title: "NVIDIA Inception Program Application",
    description: "Apply for $150K+ cloud credits, hardware discounts",
    category: "funding",
    priority: "high",
  },
  {
    date: "2026-02-15",
    title: "Canada CUAS Selection Notification",
    description: "Expected notification 6-8 weeks after deadline",
    category: "opportunity",
    priority: "high",
  },
  {
    date: "2026-02-28",
    title: "Google for Startups AI Accelerator Application",
    description: "10-12 weeks program, $350K cloud credits",
    category: "funding",
    priority: "high",
  },
  {
    date: "2026-03-01",
    title: "First EU Pilot Installation",
    description: "Initial deployment in European market",
    category: "development",
    priority: "critical",
  },
  {
    date: "2026-03-15",
    title: "DHS C-UAS Grant Program Opens",
    description: "FY2026 state/local grants for C-UAS capabilities",
    category: "opportunity",
    priority: "high",
  },
  {
    date: "2026-03-31",
    title: "CPSC/ASTM/EN-71 Certification",
    description: "Safety certification for consumer product",
    category: "compliance",
    priority: "critical",
  },
  {
    date: "2026-03-31",
    title: "Operation Flytrap 5.0",
    description: "Army xTechCounter Strike live competition, $350K winners",
    category: "opportunity",
    priority: "high",
  },
  {
    date: "2026-03-31",
    title: "Q1 2026 Milestone Review",
    description: "End of quarter progress review",
    category: "meeting",
    priority: "medium",
  },

  // ============================================
  // Q2 2026
  // ============================================
  {
    date: "2026-04-01",
    title: "Techstars Air Force Accelerator Begins",
    description: "$120K funding + equity, Boston-based program",
    category: "funding",
    priority: "high",
  },
  {
    date: "2026-04-30",
    title: "Phase 1a Prototype Complete",
    description: "Core platform prototype finished",
    category: "development",
    priority: "critical",
  },
  {
    date: "2026-05-01",
    title: "D2C Website Launch",
    description: "SkySnare consumer direct-to-consumer launch",
    category: "development",
    priority: "high",
  },
  {
    date: "2026-05-01",
    title: "MBDA Swarm Drone Challenge Registration",
    description: "Indoor swarm competition, \u20AC50K prizes - German-based",
    category: "opportunity",
    priority: "medium",
  },
  {
    date: "2026-05-15",
    title: "UK DASA Cycle Submission",
    description: "Defence and Security Accelerator - up to \u00A3350K per proposal",
    category: "opportunity",
    priority: "high",
    link: "/docs/business/opportunities/opportunities-summary",
  },
  {
    date: "2026-06-01",
    title: "EU Certification Achieved",
    description: "Full EU regulatory certification",
    category: "compliance",
    priority: "critical",
  },
  {
    date: "2026-06-15",
    title: "FAA Part 107 Waiver Submission",
    description: "US regulatory compliance submission for AeroNet",
    category: "compliance",
    priority: "high",
  },
  {
    date: "2026-06-30",
    title: "NATO Innovation Fund Pitch Target",
    description: "Rolling submissions - up to \u20AC15M per company",
    category: "funding",
    priority: "high",
  },
  {
    date: "2026-06-30",
    title: "Q2 2026 Milestone Review",
    description: "End of quarter progress review",
    category: "meeting",
    priority: "medium",
  },

  // ============================================
  // Q3 2026
  // ============================================
  {
    date: "2026-07-01",
    title: "Series A Fundraise",
    description: "Target: R120M (~$6.7M) with proven revenue",
    category: "funding",
    priority: "critical",
    link: "/docs/executive/investor-executive-summary",
  },
  {
    date: "2026-07-01",
    title: "Silent Swarm 2026 Experimentation",
    description: "2-week Navy experimentation (maritime environment), free CRADA",
    category: "opportunity",
    priority: "high",
  },
  {
    date: "2026-07-22",
    title: "Microsoft for Startups Credits Expire",
    description: "Use remaining credits before expiration",
    category: "funding",
    priority: "high",
  },
  {
    date: "2026-08-01",
    title: "DARPA AIxCC Challenge",
    description: "AI Cyber Challenge at DEF CON, up to $4M prizes",
    category: "hackathon",
    priority: "high",
  },
  {
    date: "2026-08-15",
    title: "DARPA Lift Challenge Event",
    description: "Heavy-lift drone challenge finals",
    category: "opportunity",
    priority: "high",
  },
  {
    date: "2026-09-01",
    title: "Enterprise Pilot MOU Target",
    description: "Signed MOU with enterprise customer",
    category: "development",
    priority: "critical",
  },
  {
    date: "2026-09-14",
    title: "Canada CUAS Sandbox Event Begins",
    description: "CFB Suffield, Alberta - Live demonstration (Sep 14 - Oct 9)",
    category: "opportunity",
    priority: "critical",
    link: "/docs/business/opportunities/cuas-sandbox-2026",
  },
  {
    date: "2026-09-30",
    title: "Q3 2026 Milestone Review",
    description: "End of quarter progress review",
    category: "meeting",
    priority: "medium",
  },

  // ============================================
  // Q4 2026
  // ============================================
  {
    date: "2026-10-01",
    title: "Canada Expansion Begins",
    description: "Manufacturing partnerships established",
    category: "development",
    priority: "high",
  },
  {
    date: "2026-10-09",
    title: "Canada CUAS Sandbox Event Ends",
    description: "Final day of sandbox demonstration",
    category: "opportunity",
    priority: "critical",
    link: "/docs/business/opportunities/cuas-sandbox-2026",
  },
  {
    date: "2026-10-15",
    title: "Proven in Pendleton Counter-UAS Challenge",
    description: "Annual event, $100K+ prizes",
    category: "opportunity",
    priority: "high",
  },
  {
    date: "2026-11-01",
    title: "Australia LAND 156 Subcontracting Review",
    description: "Monitor Leidos Australia for subcontracting opportunities",
    category: "opportunity",
    priority: "medium",
  },
  {
    date: "2026-12-31",
    title: "5,000 Consumer Units Target",
    description: "SkySnare consumer sales milestone",
    category: "development",
    priority: "high",
  },
  {
    date: "2026-12-31",
    title: "Q4 2026 Milestone Review",
    description: "End of year progress review",
    category: "meeting",
    priority: "high",
  },

  // ============================================
  // Q1 2027
  // ============================================
  {
    date: "2027-01-15",
    title: "First AeroNet Enterprise Pilot Deployment",
    description: "Initial customer deployment target",
    category: "development",
    priority: "critical",
  },
];

const categoryConfig = {
  opportunity: { label: "Opportunity", color: "#ef4444", icon: "🎯" },
  development: { label: "Development", color: "#3b82f6", icon: "🔧" },
  compliance: { label: "Compliance", color: "#f59e0b", icon: "📋" },
  meeting: { label: "Meeting", color: "#22c55e", icon: "👥" },
  funding: { label: "Funding", color: "#a855f7", icon: "💰" },
  hackathon: { label: "Hackathon", color: "#06b6d4", icon: "💻" },
};

const priorityConfig = {
  critical: { label: "Critical", badge: "🔴" },
  high: { label: "High", badge: "🟡" },
  medium: { label: "Medium", badge: "🟢" },
  low: { label: "Low", badge: "⚪" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getTimeLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `In ${days} days`;
  if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`;
  if (days <= 365) return `In ${Math.ceil(days / 30)} months`;
  return `In ${Math.ceil(days / 365)} years`;
}

// Custom event stored in localStorage
interface CustomEvent extends CalendarItem {
  id: string;
  isCustom: true;
}

const CUSTOM_EVENTS_KEY = "phoenix-calendar-custom-events";

function loadCustomEvents(): CustomEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomEvents(events: CustomEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_EVENTS_KEY, JSON.stringify(events));
}

export default function CalendarPage(): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showPast, setShowPast] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    category: "meeting" as CalendarItem["category"],
    priority: "medium" as CalendarItem["priority"],
  });

  // Load custom events from localStorage on mount
  React.useEffect(() => {
    setCustomEvents(loadCustomEvents());
  }, []);

  const allEvents = useMemo(() => {
    return [...calendarEvents, ...customEvents];
  }, [customEvents]);

  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    // Filter by category
    if (selectedCategory !== "all") {
      events = events.filter((e) => e.category === selectedCategory);
    }

    // Filter past events
    if (!showPast) {
      events = events.filter((e) => getDaysUntil(e.date) >= 0);
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events;
  }, [selectedCategory, showPast, allEvents]);

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert("Please fill in the title and date");
      return;
    }
    const event: CustomEvent = {
      ...newEvent,
      id: Date.now().toString(),
      isCustom: true,
    };
    const updated = [...customEvents, event];
    setCustomEvents(updated);
    saveCustomEvents(updated);
    setNewEvent({
      title: "",
      description: "",
      date: "",
      category: "meeting",
      priority: "medium",
    });
    setShowAddModal(false);
  };

  const handleDeleteCustomEvent = (id: string) => {
    const updated = customEvents.filter((e) => e.id !== id);
    setCustomEvents(updated);
    saveCustomEvents(updated);
  };

  const handleExportAll = () => {
    const events: CalendarEvent[] = filteredEvents.map((item) => ({
      title: item.title,
      description: item.description,
      startDate: new Date(item.date),
      allDay: true,
      category: item.category,
    }));
    downloadICS(events, "phoenix-rooivalk-calendar.ics");
  };

  const upcomingCritical = filteredEvents.filter(
    (e) => e.priority === "critical" && getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 90
  );

  // Generate ICS content for subscription (includes custom events)
  const allEventsForExport: CalendarEvent[] = allEvents.map((item) => ({
    title: item.title,
    description: item.description,
    startDate: new Date(item.date),
    allDay: true,
    category: item.category,
  }));

  const handleCopyICS = async () => {
    const icsContent = generateICS(allEventsForExport);
    try {
      await navigator.clipboard.writeText(icsContent);
      alert("Calendar data copied! Paste into a .ics file to import.");
    } catch {
      // Fallback - download instead
      downloadICS(allEventsForExport, "phoenix-rooivalk-calendar.ics");
    }
  };

  const handleSubscribeGoogle = () => {
    // Google Calendar subscribe URL (would need hosted ICS file in production)
    window.open(
      "https://calendar.google.com/calendar/r?cid=webcal://docs.phoenixrooivalk.com/calendar.ics",
      "_blank"
    );
  };

  const handleSubscribeOutlook = () => {
    // Outlook subscribe URL
    window.open(
      "https://outlook.live.com/calendar/0/addfromweb?url=webcal://docs.phoenixrooivalk.com/calendar.ics",
      "_blank"
    );
  };

  return (
    <Layout
      title="Project Calendar"
      description="Phoenix Rooivalk project deadlines, milestones, and events"
    >
      <main className={styles.calendarPage}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>
              <span className={styles.headerIcon}>📅</span> Project Calendar
            </h1>
            <p>
              Track all deadlines, milestones, opportunities, and events in one place.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.exportButton} onClick={() => setShowAddModal(true)}>
              + Add Event
            </button>
            <button className={styles.exportButton} onClick={handleExportAll} style={{ background: "var(--ifm-color-emphasis-200)", color: "var(--ifm-color-content)" }}>
              📥 Export
            </button>
            <Link
              to="/docs/operations/calendar/project-calendar"
              className={styles.detailsLink}
            >
              View Full Details →
            </Link>
          </div>
        </div>

        {/* Action Cards - Book Meeting & Subscribe */}
        <div className={styles.actionCards}>
          {/* Book a Meeting */}
          <div className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
              <span className={styles.actionCardIcon}>📅</span>
              <h2>Book a Meeting</h2>
            </div>
            <p className={styles.actionCardDescription}>
              Schedule time with our team to discuss your counter-UAS requirements,
              see a product demo, or explore investment opportunities.
            </p>
            <BookingWidget
              calUsername="phoenixrooivalk"
              title=""
              subtitle=""
              embed={false}
            />
          </div>

          {/* Calendar Integration */}
          <div className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
              <span className={styles.actionCardIcon}>🔗</span>
              <h2>Sync to Your Calendar</h2>
            </div>
            <p className={styles.actionCardDescription}>
              Stay updated with all Phoenix Rooivalk deadlines and milestones
              by adding our calendar to your favorite app.
            </p>
            <div className={styles.integrationOptions}>
              <button
                className={styles.integrationButton}
                onClick={handleSubscribeGoogle}
              >
                <span className={styles.integrationIcon}>G</span>
                <span className={styles.integrationLabel}>
                  <span className={styles.integrationTitle}>Google Calendar</span>
                  <span className={styles.integrationDesc}>Subscribe & auto-sync</span>
                </span>
              </button>
              <button
                className={styles.integrationButton}
                onClick={handleSubscribeOutlook}
              >
                <span className={styles.integrationIcon}>O</span>
                <span className={styles.integrationLabel}>
                  <span className={styles.integrationTitle}>Outlook Calendar</span>
                  <span className={styles.integrationDesc}>Subscribe & auto-sync</span>
                </span>
              </button>
              <button
                className={styles.integrationButton}
                onClick={handleExportAll}
              >
                <span className={styles.integrationIcon}>📥</span>
                <span className={styles.integrationLabel}>
                  <span className={styles.integrationTitle}>Download .ics File</span>
                  <span className={styles.integrationDesc}>Apple Calendar & others</span>
                </span>
              </button>
              <button
                className={styles.integrationButton}
                onClick={handleCopyICS}
              >
                <span className={styles.integrationIcon}>📋</span>
                <span className={styles.integrationLabel}>
                  <span className={styles.integrationTitle}>Copy Calendar Data</span>
                  <span className={styles.integrationDesc}>For manual import</span>
                </span>
              </button>
            </div>
            <div className={styles.subscribeHint}>
              <strong>Pro tip:</strong> Subscribing keeps your calendar automatically
              updated when new events are added.
            </div>
          </div>
        </div>

        {/* Critical Deadlines Alert */}
        {upcomingCritical.length > 0 && (
          <div className={styles.criticalAlert}>
            <h3>🔴 Critical Deadlines (Next 90 Days)</h3>
            <div className={styles.criticalList}>
              {upcomingCritical.map((event, idx) => (
                <div key={idx} className={styles.criticalItem}>
                  <span className={styles.criticalDate}>
                    {formatDate(event.date)}
                  </span>
                  <span className={styles.criticalTitle}>{event.title}</span>
                  <span className={styles.criticalCountdown}>
                    {getTimeLabel(getDaysUntil(event.date))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.categoryFilters}>
            <button
              className={`${styles.filterButton} ${selectedCategory === "all" ? styles.active : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </button>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                className={`${styles.filterButton} ${selectedCategory === key ? styles.active : ""}`}
                onClick={() => setSelectedCategory(key)}
                style={{ "--category-color": config.color } as React.CSSProperties}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
          <label className={styles.showPastToggle}>
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
            />
            Show past events
          </label>
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          {filteredEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No events found for the selected filters.</p>
            </div>
          ) : (
            filteredEvents.map((event, idx) => {
              const days = getDaysUntil(event.date);
              const isPast = days < 0;
              const isToday = days === 0;
              const isSoon = days > 0 && days <= 7;
              const config = categoryConfig[event.category];

              return (
                <div
                  key={idx}
                  className={`${styles.timelineItem} ${isPast ? styles.past : ""} ${isToday ? styles.today : ""} ${isSoon ? styles.soon : ""}`}
                  style={{ "--category-color": config.color } as React.CSSProperties}
                >
                  <div className={styles.timelineDate}>
                    <span className={styles.dateLabel}>{formatDate(event.date)}</span>
                    <span className={styles.countdown}>{getTimeLabel(days)}</span>
                  </div>
                  <div className={styles.timelineMarker}>
                    <span className={styles.priorityBadge}>
                      {priorityConfig[event.priority].badge}
                    </span>
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.eventHeader}>
                      <span className={styles.categoryBadge}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <h3 className={styles.eventTitle}>
                      {event.link ? (
                        <Link to={event.link}>{event.title}</Link>
                      ) : (
                        event.title
                      )}
                      {"isCustom" in event && (
                        <button
                          className={styles.deleteEventButton}
                          onClick={() => handleDeleteCustomEvent((event as CustomEvent).id)}
                          title="Delete custom event"
                        >
                          ×
                        </button>
                      )}
                    </h3>
                    <p className={styles.eventDescription}>
                      {event.description}
                      {"isCustom" in event && (
                        <span className={styles.customBadge}>Custom</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <h4>Legend</h4>
          <div className={styles.legendItems}>
            <div className={styles.legendSection}>
              <span className={styles.legendLabel}>Priority:</span>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <span key={key} className={styles.legendItem}>
                  {config.badge} {config.label}
                </span>
              ))}
            </div>
            <div className={styles.legendSection}>
              <span className={styles.legendLabel}>Category:</span>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <span
                  key={key}
                  className={styles.legendItem}
                  style={{ color: config.color }}
                >
                  {config.icon} {config.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Add Event Modal */}
        {showAddModal && (
          <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Add Custom Event</h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.formGroup}>
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event description"
                    className={styles.formInput}
                    rows={3}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Category</label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as CalendarItem["category"] })}
                      className={styles.formInput}
                    >
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.icon} {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Priority</label>
                    <select
                      value={newEvent.priority}
                      onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as CalendarItem["priority"] })}
                      className={styles.formInput}
                    >
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.badge} {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.modalActions}>
                  <button
                    className={styles.modalCancel}
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.modalSubmit}
                    onClick={handleAddEvent}
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
