/**
 * Project Calendar Page
 *
 * Displays all project dates, deadlines, milestones, and events
 * in a unified timeline view.
 */

import React, { useState, useMemo } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { downloadICS, type CalendarEvent } from "../components/Calendar";
import styles from "./calendar.module.css";

interface CalendarItem {
  date: string;
  title: string;
  description: string;
  category: "opportunity" | "development" | "compliance" | "meeting" | "funding";
  priority: "critical" | "high" | "medium" | "low";
  link?: string;
}

// All calendar events consolidated from project data
const calendarEvents: CalendarItem[] = [
  // Q4 2025
  {
    date: "2025-12-15",
    title: "Canada CUAS Sandbox Application Deadline",
    description: "Submit application via PriviDox by 2:00 PM ET",
    category: "opportunity",
    priority: "critical",
    link: "/docs/business/opportunities/cuas-sandbox-2026",
  },
  {
    date: "2025-12-31",
    title: "Q4 2025 Milestone Review",
    description: "Quarterly review of progress and objectives",
    category: "meeting",
    priority: "high",
  },
  // Q1 2026
  {
    date: "2026-01-15",
    title: "Prototype Validation Target",
    description: "Net launcher prototype manufactured and validated",
    category: "development",
    priority: "critical",
    link: "/docs/progress/progress-overview",
  },
  {
    date: "2026-02-15",
    title: "Canada CUAS Selection Notification",
    description: "Expected notification 6-8 weeks after deadline",
    category: "opportunity",
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
    date: "2026-03-31",
    title: "CPSC/ASTM/EN-71 Certification",
    description: "Safety certification for consumer product",
    category: "compliance",
    priority: "critical",
  },
  // Q2 2026
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
    date: "2026-05-15",
    title: "UK DASA Cycle Submission",
    description: "Defence and Security Accelerator opportunity",
    category: "opportunity",
    priority: "high",
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
    description: "US regulatory compliance submission",
    category: "compliance",
    priority: "high",
  },
  // Q3 2026
  {
    date: "2026-07-01",
    title: "Series A Fundraise",
    description: "Target: R120M (~$6.7M) with proven revenue",
    category: "funding",
    priority: "critical",
    link: "/docs/executive/investor-executive-summary",
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
    description: "Live demonstration at sandbox event (Sep 14 - Oct 9)",
    category: "opportunity",
    priority: "critical",
    link: "/docs/business/opportunities/cuas-sandbox-2026",
  },
  // Q4 2026
  {
    date: "2026-10-01",
    title: "Canada Expansion Begins",
    description: "Manufacturing partnerships established",
    category: "development",
    priority: "high",
  },
  {
    date: "2026-12-31",
    title: "5,000 Consumer Units Target",
    description: "SkySnare consumer sales milestone",
    category: "development",
    priority: "high",
  },
];

const categoryConfig = {
  opportunity: { label: "Opportunity", color: "#ef4444", icon: "🎯" },
  development: { label: "Development", color: "#3b82f6", icon: "🔧" },
  compliance: { label: "Compliance", color: "#f59e0b", icon: "📋" },
  meeting: { label: "Meeting", color: "#22c55e", icon: "👥" },
  funding: { label: "Funding", color: "#a855f7", icon: "💰" },
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

export default function CalendarPage(): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showPast, setShowPast] = useState(false);

  const filteredEvents = useMemo(() => {
    let events = [...calendarEvents];

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
  }, [selectedCategory, showPast]);

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
            <button className={styles.exportButton} onClick={handleExportAll}>
              📥 Export to Calendar
            </button>
            <Link
              to="/docs/operations/calendar/project-calendar"
              className={styles.detailsLink}
            >
              View Full Details →
            </Link>
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
                    </h3>
                    <p className={styles.eventDescription}>{event.description}</p>
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
      </main>
    </Layout>
  );
}
