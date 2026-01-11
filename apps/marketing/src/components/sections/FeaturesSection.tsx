import * as React from "react";
import styles from "./FeaturesSection.module.css";

const features = [
  {
    id: "pneumatic-launcher",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="22" y1="12" x2="18" y2="12" />
        <line x1="6" y1="12" x2="2" y2="12" />
        <line x1="12" y1="6" x2="12" y2="2" />
        <line x1="12" y1="22" x2="12" y2="18" />
      </svg>
    ),
    title: "Pneumatic Net Launcher",
    description:
      "Compressed air propulsion system designed for safe, non-destructive drone capture. No explosives, no projectiles, no collateral damage.",
    brand: "Both Brands",
  },
  {
    id: "consumer-safety",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Consumer-Grade Safety",
    description:
      "Designed for CPSC certification. Safe for use in recreational settings, drone racing events, and training facilities.",
    brand: "SkySnare™",
  },
  {
    id: "enterprise-security",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Enterprise Security",
    description:
      "FAA-compliant operations for critical infrastructure protection. Airports, utilities, events, and government facilities.",
    brand: "AeroNet™",
  },
  {
    id: "proven-technology",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Proven Technology",
    description:
      "Pneumatic systems have decades of industrial use. We apply proven engineering to the counter-drone market.",
    brand: "Both Brands",
  },
];

const useCases = [
  {
    id: "drone-racing",
    title: "Drone Racing & Training",
    description: "Safe capture for pilot training and event management",
    brand: "SkySnare™",
  },
  {
    id: "airport-protection",
    title: "Airport Protection",
    description: "Runway safety and airspace security",
    brand: "AeroNet™",
  },
  {
    id: "event-security",
    title: "Event Security",
    description: "Stadium and venue drone defense",
    brand: "AeroNet™",
  },
  {
    id: "critical-infrastructure",
    title: "Critical Infrastructure",
    description: "Power plants, water treatment, data centers",
    brand: "AeroNet™",
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className={styles.section} id="features">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Phase 1 Technology</h2>
          <p className={styles.subtitle}>
            Starting with proven pneumatic interception - safe, reliable, and
            effective
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <div key={feature.id} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <div className={styles.featureContent}>
                <div className={styles.featureHeader}>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <span
                    className={`${styles.brandBadge} ${
                      feature.brand === "SkySnare™"
                        ? styles.brandConsumer
                        : feature.brand === "AeroNet™"
                          ? styles.brandEnterprise
                          : styles.brandBoth
                    }`}
                  >
                    {feature.brand}
                  </span>
                </div>
                <p className={styles.featureDescription}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.useCasesSection}>
          <h3 className={styles.useCasesTitle}>Target Markets</h3>
          <div className={styles.useCasesGrid}>
            {useCases.map((useCase) => (
              <div key={useCase.id} className={styles.useCaseCard}>
                <span
                  className={`${styles.useCaseBadge} ${
                    useCase.brand === "SkySnare™"
                      ? styles.brandConsumer
                      : styles.brandEnterprise
                  }`}
                >
                  {useCase.brand}
                </span>
                <h4 className={styles.useCaseTitle}>{useCase.title}</h4>
                <p className={styles.useCaseDescription}>
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
