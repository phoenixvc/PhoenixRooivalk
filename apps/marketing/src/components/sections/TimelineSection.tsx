import * as React from "react";
import { RevealSection } from "../RevealSection";
import { CalendarExport } from "../CalendarExport";
import type { CalendarEvent } from "../../utils/calendar";
import styles from "./TimelineSection.module.css";

export const TimelineSection: React.FC = () => {
  const timelineItems = [
    {
      phase: "Year 1 (FY26)",
      title: "Foundation & Validation",
      duration: "Nov 2025 - Oct 2026",
      status: "Active" as const,
      description:
        "Complete mechanical prototype, achieve certification, launch SkySnare™ D2C",
      milestones: [
        "Complete mechanical prototype (May 2026)",
        "Achieve CPSC certification",
        "Launch SkySnare™ D2C, target 4,500+ units",
        "Integrate initial AI detection into AeroNet™ prototype",
        "FY26 Revenue Target: $1.825M / R29M",
      ],
    },
    {
      phase: "Year 2 (FY27)",
      title: "Market Proof & AI Demonstration",
      duration: "Nov 2026 - Oct 2027",
      status: "Planned" as const,
      description:
        "FAA waiver approved, first AeroNet™ pilot, AI detection deployment",
      milestones: [
        "FAA waiver approved (June 2026)",
        "First AeroNet™ pilot live (Q2 2027)",
        "Deploy AI-based detection and tracking",
        "SkySnare™ expands to 15,000 units",
        "FY27 Revenue Target: $5M / R83M",
      ],
    },
    {
      phase: "Year 3 (FY28)",
      title: "Scale & Diversify",
      duration: "Nov 2027 - Oct 2028",
      status: "Planned" as const,
      description:
        "Introduce SkySnare™ Pro, expand AeroNet™ pilots with predictive AI",
      milestones: [
        "Launch SkySnare™ Pro (advanced training)",
        "AeroNet™: 6-8 operational pilots",
        "Implement AI compliance logging",
        "Predictive AI tracking deployed",
        "FY28 Revenue Target: $18M / R300M",
      ],
    },
    {
      phase: "Year 4 (FY29)",
      title: "Expansion & Network Intelligence",
      duration: "Nov 2028 - Oct 2029",
      status: "Future" as const,
      description:
        "60K SkySnare™ units, 15 AeroNet™ sites with cloud coordination",
      milestones: [
        "60,000 SkySnare™ units sold globally",
        "15 AeroNet™ sites operating",
        "Deploy AeroNet AI 2.0 (predictive risk models)",
        "Edge self-calibration enabled",
        "FY29 Revenue Target: $32M / R533M",
      ],
    },
    {
      phase: "Year 5 (FY30)",
      title: "Leadership & Exit Preparation",
      duration: "Nov 2029 - Oct 2030",
      status: "Future" as const,
      description:
        "75K SkySnare™ units, 35 AeroNet™ deployments, exit readiness",
      milestones: [
        "75,000 SkySnare™ units delivered",
        "35 AeroNet™ deployments active",
        "EBITDA margin: 30%",
        "FY30 Revenue Target: $50M / R833M",
        "Position for Series C or strategic acquisition",
      ],
    },
  ];

  // Convert timeline items to calendar events
  const calendarEvents: CalendarEvent[] = React.useMemo(() => {
    const events: CalendarEvent[] = [];

    timelineItems.forEach((item) => {
      item.milestones.forEach((milestone) => {
        // Extract date from milestone text if available
        const dateMatch = milestone.match(/\(([^)]+)\)/);
        let eventDate = new Date();

        if (dateMatch) {
          const dateStr = dateMatch[1];
          // Parse dates like "May 2026", "June 2026", "Q2 2027"
          if (dateStr.includes("Q1")) {
            eventDate = new Date(dateStr.replace("Q1", "March"));
          } else if (dateStr.includes("Q2")) {
            eventDate = new Date(dateStr.replace("Q2", "June"));
          } else if (dateStr.includes("Q3")) {
            eventDate = new Date(dateStr.replace("Q3", "September"));
          } else if (dateStr.includes("Q4")) {
            eventDate = new Date(dateStr.replace("Q4", "December"));
          } else {
            eventDate = new Date(dateStr + " 1");
          }
        } else {
          // Use the phase's start date
          const startDateMatch = item.duration.match(/([A-Za-z]+)\s+(\d{4})/);
          if (startDateMatch) {
            eventDate = new Date(`${startDateMatch[1]} 1, ${startDateMatch[2]}`);
          }
        }

        events.push({
          title: `${item.phase}: ${milestone}`,
          description: `${item.title} - ${item.description}\n\nPhase: ${item.phase}\nStatus: ${item.status}`,
          startDate: eventDate,
          allDay: true,
          category: "PhoenixRooivalk Milestone",
          url: "https://phoenixrooivalk.com/timeline",
        });
      });
    });

    return events;
  }, []);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Completed":
        return styles.statusCompleted;
      case "Active":
        return styles.statusActive;
      case "Planned":
        return styles.statusPlanned;
      case "Future":
        return styles.statusFuture;
      default:
        return styles.statusFuture;
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.backgroundPattern}>
        <div className={styles.backgroundGrid}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          <RevealSection className={styles.header}>
            <h2 className={styles.title}>
              5-Year Strategic Roadmap (2025-2030)
            </h2>
            <p className={styles.description}>
              From foundation to market leadership: SkySnare™ consumer
              validation to AeroNet™ enterprise dominance, targeting $50M
              revenue by FY30.
            </p>
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
              <CalendarExport
                events={calendarEvents}
                filename="phoenix-rooivalk-timeline"
              />
            </div>
          </RevealSection>

          <div className={styles.timeline}>
            {timelineItems.map((item, index) => (
              <RevealSection key={index}>
                <div className={styles.timelineItem}>
                  <div className={styles.phaseLabel}>{item.phase}</div>
                  <h3 className={styles.phaseTitle}>{item.title}</h3>
                  <p className={styles.phaseDuration}>{item.duration}</p>
                  <span
                    className={`${styles.phaseStatus} ${getStatusClass(item.status)}`}
                  >
                    {item.status}
                  </span>
                  <p className={styles.phaseDescription}>{item.description}</p>
                  <ul className={styles.milestones}>
                    {item.milestones.map((milestone, milestoneIndex) => (
                      <li key={milestoneIndex} className={styles.milestone}>
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
