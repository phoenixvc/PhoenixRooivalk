import React from "react";
import styles from "./CalendarIntegration.module.css";

interface CalendarIntegrationProps {
  calComUser?: string;
  showEventTypes?: boolean;
}

/**
 * CalendarIntegration provides scheduling integration with Cal.com
 * for booking demos, meetings, and consultations.
 *
 * @component
 * @example
 * ```tsx
 * <CalendarIntegration
 *   calComUser="phoenixrooivalk"
 *   showEventTypes={true}
 * />
 * ```
 */
export const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({
  calComUser = "phoenixrooivalk",
  showEventTypes = true,
}) => {
  const eventTypes = [
    {
      name: "Product Demo",
      duration: "30 minutes",
      icon: "presentation",
      description:
        "Interactive demonstration of Phoenix Rooivalk c-UAS capabilities, including SkySnare™ and AeroNet™ systems.",
    },
    {
      name: "Investor Meeting",
      duration: "45 minutes",
      icon: "briefcase",
      description:
        "Discuss investment opportunities, strategic roadmap, and financial projections for Series A funding.",
    },
    {
      name: "Technical Consultation",
      duration: "60 minutes",
      icon: "code",
      description:
        "Deep dive into system architecture, integration requirements, and technical specifications with engineering team.",
    },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "presentation":
        return (
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
        );
      case "briefcase":
        return (
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "code":
        return (
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.integrationContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Schedule a Meeting</h2>
        <p className={styles.description}>
          Connect with our team to explore Phoenix Rooivalk capabilities,
          discuss partnerships, or get technical support.
        </p>
      </div>

      {showEventTypes && (
        <div className={styles.eventTypes}>
          {eventTypes.map((event, index) => (
            <div key={index} className={styles.eventType}>
              <div className={styles.eventTypeHeader}>
                <div className={styles.eventTypeIcon}>
                  {getIcon(event.icon)}
                </div>
                <h3 className={styles.eventTypeName}>{event.name}</h3>
              </div>
              <div className={styles.eventTypeDuration}>{event.duration}</div>
              <p className={styles.eventTypeDescription}>{event.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className={styles.schedulingSection}>
        <h3 className={styles.sectionTitle}>
          <svg
            className={styles.sectionIcon}
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
          Book Your Meeting
        </h3>
        <p className={styles.sectionDescription}>
          Select your preferred date and time below. You&apos;ll receive a
          confirmation email with meeting details and calendar invite.
        </p>

        {/* Placeholder for Cal.com widget */}
        {/* To activate, create a Cal.com account and replace the placeholder */}
        <div className={styles.placeholderWidget}>
          <svg
            className={styles.placeholderIcon}
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
          <h4 className={styles.placeholderTitle}>
            Calendar Integration Coming Soon
          </h4>
          <p className={styles.placeholderText}>
            Cal.com scheduling widget will be embedded here once configured.
            <br />
            For now, please contact us directly to schedule a meeting.
          </p>
          <a
            href={`https://cal.com/${calComUser}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.placeholderLink}
          >
            Visit Our Scheduling Page
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        {/* Actual Cal.com embed code would go here: */}
        {/* <Cal calLink={`${calComUser}/demo`} /> */}
        {/* Requires: npm install @calcom/embed-react */}
      </div>
    </div>
  );
};
