import React, { useState } from "react";
import styles from "./Calendar.module.css";

interface BookingType {
  /** Unique identifier for the booking type */
  id: string;
  /** Display name */
  name: string;
  /** Duration in minutes */
  duration: number;
  /** Description */
  description?: string;
  /** Cal.com event slug */
  slug: string;
}

interface BookingWidgetProps {
  /** Cal.com username or team name */
  calUsername?: string;
  /** Title for the booking section */
  title?: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Available booking types */
  bookingTypes?: BookingType[];
  /** Show inline embed instead of link */
  embed?: boolean;
  /** Theme for embed */
  theme?: "light" | "dark" | "auto";
}

const DEFAULT_BOOKING_TYPES: BookingType[] = [
  {
    id: "demo",
    name: "Product Demo",
    duration: 30,
    description: "See Phoenix Rooivalk in action",
    slug: "demo",
  },
  {
    id: "consultation",
    name: "Technical Consultation",
    duration: 45,
    description: "Discuss your counter-UAS requirements",
    slug: "consultation",
  },
  {
    id: "investor",
    name: "Investor Meeting",
    duration: 60,
    description: "Investment opportunity discussion",
    slug: "investor-meeting",
  },
];

/**
 * BookingWidget provides an interface for scheduling meetings via Cal.com
 *
 * @example
 * ```tsx
 * <BookingWidget
 *   calUsername="phoenixrooivalk"
 *   title="Schedule a Meeting"
 *   subtitle="Book time with our team"
 * />
 * ```
 */
export default function BookingWidget({
  calUsername = "phoenixrooivalk",
  title = "Schedule a Meeting",
  subtitle = "Book time with our team to discuss your needs",
  bookingTypes = DEFAULT_BOOKING_TYPES,
  embed = false,
  theme = "auto",
}: BookingWidgetProps): React.ReactElement {
  const [selectedType, setSelectedType] = useState<BookingType | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  const handleBookingClick = (bookingType: BookingType) => {
    const url = `https://cal.com/${calUsername}/${bookingType.slug}`;

    if (embed) {
      setSelectedType(bookingType);
      setShowEmbed(true);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const closeEmbed = () => {
    setShowEmbed(false);
    setSelectedType(null);
  };

  return (
    <div className={styles.bookingWidget}>
      <div className={styles.bookingHeader}>
        <h3 className={styles.bookingTitle}>{title}</h3>
        {subtitle && <p className={styles.bookingSubtitle}>{subtitle}</p>}
      </div>

      <div className={styles.bookingTypes}>
        {bookingTypes.map((type) => (
          <button
            key={type.id}
            className={styles.bookingType}
            onClick={() => handleBookingClick(type)}
            type="button"
          >
            <div className={styles.bookingTypeHeader}>
              <span className={styles.bookingTypeName}>{type.name}</span>
              <span className={styles.bookingDuration}>{type.duration} min</span>
            </div>
            {type.description && (
              <p className={styles.bookingTypeDescription}>{type.description}</p>
            )}
            <span className={styles.bookingCta}>
              Schedule {"\u2192"}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.bookingFooter}>
        <span className={styles.poweredBy}>
          Powered by{" "}
          <a
            href="https://cal.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.calLink}
          >
            Cal.com
          </a>
        </span>
      </div>

      {/* Embed Modal */}
      {showEmbed && selectedType && (
        <div className={styles.embedOverlay} onClick={closeEmbed}>
          <div className={styles.embedModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.embedHeader}>
              <h4>{selectedType.name}</h4>
              <button
                className={styles.embedClose}
                onClick={closeEmbed}
                aria-label="Close"
                type="button"
              >
                {"\u2715"}
              </button>
            </div>
            <div className={styles.embedContent}>
              <iframe
                src={`https://cal.com/${calUsername}/${selectedType.slug}?embed=true&theme=${theme}`}
                className={styles.embedIframe}
                title={`Book ${selectedType.name}`}
                frameBorder="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
