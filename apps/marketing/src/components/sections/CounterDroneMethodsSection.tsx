"use client";
import * as React from "react";
import { RevealSection } from "../RevealSection";
import styles from "./CounterDroneMethodsSection.module.css";

interface MethodCardProps {
  icon: string;
  title: string;
  description: string;
  effectiveness: string;
  responseTime: string;
  range: string;
  pros: string[];
  cons: string[];
  useCase: string;
}

const MethodCard: React.FC<MethodCardProps> = ({
  icon,
  title,
  description,
  effectiveness,
  responseTime,
  range,
  pros,
  cons,
  useCase,
}) => (
  <div className={styles.card}>
    <div className={styles.cardHeader}>
      <div className={styles.cardIcon}>{icon}</div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
    </div>

    {/* Key Metrics */}
    <div className={styles.metricsGrid}>
      <div className={styles.metricBox}>
        <div className={styles.metricLabel}>Effectiveness</div>
        <div className={`${styles.metricValue} ${styles.metricValueSuccess}`}>
          {effectiveness}
        </div>
      </div>
      <div className={styles.metricBox}>
        <div className={styles.metricLabel}>Response Time</div>
        <div className={`${styles.metricValue} ${styles.metricValuePrimary}`}>
          {responseTime}
        </div>
      </div>
      <div className={styles.metricBox}>
        <div className={styles.metricLabel}>Range</div>
        <div className={`${styles.metricValue} ${styles.metricValueAccent}`}>
          {range}
        </div>
      </div>
    </div>

    {/* Pros and Cons */}
    <div className={styles.prosConsGrid}>
      <div className={styles.prosSection}>
        <h4 className={styles.prosTitle}>✓ Advantages</h4>
        <ul className={styles.list}>
          {pros.map((pro, index) => (
            <li key={index} className={styles.listItem}>
              <span
                className={`${styles.listBullet} ${styles.listBulletSuccess}`}
              >
                •
              </span>
              {pro}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.consSection}>
        <h4 className={styles.consTitle}>⚠ Limitations</h4>
        <ul className={styles.list}>
          {cons.map((con, index) => (
            <li key={index} className={styles.listItem}>
              <span
                className={`${styles.listBullet} ${styles.listBulletWarning}`}
              >
                •
              </span>
              {con}
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Use Case */}
    <div className={styles.useCaseBox}>
      <h4 className={styles.useCaseTitle}>Best Use Case</h4>
      <p className={styles.useCaseText}>{useCase}</p>
    </div>
  </div>
);

export const CounterDroneMethodsSection: React.FC = () => {
  const methods = [
    {
      icon: "📡",
      title: "RF Jamming",
      description:
        "Disrupts drone communication and control signals using radio frequency interference.",
      effectiveness: "85%",
      responseTime: "50-200ms",
      range: "1-5km",
      pros: [
        "Immediate effect on communication",
        "Works against most commercial drones",
        "Non-destructive approach",
        "Can affect multiple targets",
      ],
      cons: [
        "May affect friendly communications",
        "Limited against autonomous drones",
        "Requires significant power",
        "Legal restrictions in some areas",
      ],
      useCase:
        "Ideal for disrupting communication-dependent drones in controlled environments where collateral interference is acceptable.",
    },
    {
      icon: "🎯",
      title: "GPS Spoofing",
      description:
        "Provides false GPS signals to mislead drone navigation and positioning systems.",
      effectiveness: "70%",
      responseTime: "100-500ms",
      range: "500m-2km",
      pros: [
        "Redirects drones to safe areas",
        "Non-destructive method",
        "Can be targeted and precise",
        "Works against GPS-dependent systems",
      ],
      cons: [
        "Limited against non-GPS navigation",
        "May affect nearby GPS devices",
        "Requires sophisticated equipment",
        "Legal and regulatory concerns",
      ],
      useCase:
        "Best for redirecting GPS-dependent drones away from sensitive areas without causing damage.",
    },
    {
      icon: "⚡",
      title: "Electronic Warfare",
      description:
        "Advanced electromagnetic attacks targeting drone electronics and control systems.",
      effectiveness: "95%",
      responseTime: "20-100ms",
      range: "2-10km",
      pros: [
        "Highest effectiveness rate",
        "Can disable multiple systems",
        "Works against hardened targets",
        "Precise targeting capabilities",
      ],
      cons: [
        "High power requirements",
        "May cause collateral damage",
        "Complex deployment",
        "Expensive equipment",
      ],
      useCase:
        "Critical infrastructure protection where maximum effectiveness is required and collateral effects are acceptable.",
    },
    {
      icon: "🔍",
      title: "Kinetic Intercept",
      description:
        "Physical destruction using projectiles, nets, or other kinetic means.",
      effectiveness: "90%",
      responseTime: "200-1000ms",
      range: "100m-2km",
      pros: [
        "Immediate neutralization",
        "Works against all drone types",
        "Visual confirmation of success",
        "No electronic interference",
      ],
      cons: [
        "Destructive method",
        "Debris and safety concerns",
        "Limited ammunition",
        "May cause collateral damage",
      ],
      useCase:
        "High-threat scenarios where immediate neutralization is required and collateral damage is acceptable.",
    },
    {
      icon: "🌐",
      title: "Cyber Takeover",
      description:
        "Hacking into drone systems to gain control or disable them remotely.",
      effectiveness: "60%",
      responseTime: "1-5s",
      range: "Unlimited",
      pros: [
        "Non-destructive approach",
        "Can gain intelligence",
        "Reversible action",
        "No physical debris",
      ],
      cons: [
        "Requires specific vulnerabilities",
        "Time-intensive process",
        "May not work on all drones",
        "Requires specialized skills",
      ],
      useCase:
        "Intelligence gathering missions where gaining control of the drone provides valuable information.",
    },
    {
      icon: "🛡️",
      title: "Directed Energy",
      description:
        "High-energy laser or microwave systems to disable drone electronics.",
      effectiveness: "80%",
      responseTime: "100-300ms",
      range: "500m-3km",
      pros: [
        "Precise targeting",
        "No ammunition required",
        "Can be scaled for power",
        "Silent operation",
      ],
      cons: [
        "High power consumption",
        "Weather dependent",
        "Line-of-sight required",
        "Expensive technology",
      ],
      useCase:
        "Perimeter defense where precision targeting is needed and power resources are available.",
    },
  ];

  return (
    <RevealSection>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.innerContainer}>
            {/* Section Header */}
            <div className={styles.header}>
              <h2 className={styles.title}>Counter-Drone Defense Methods</h2>
              <p className={styles.subtitle}>
                Phoenix Rooivalk integrates multiple defense strategies to
                provide comprehensive protection against various drone threats.
              </p>
            </div>

            {/* Methods Grid */}
            <div className={styles.grid}>
              {methods.map((method, index) => (
                <MethodCard key={index} {...method} />
              ))}
            </div>

            {/* Integration Note */}
            <div className={styles.integrationSection}>
              <div className={styles.integrationCard}>
                <h3 className={styles.integrationTitle}>
                  Integrated Defense Strategy
                </h3>
                <p className={styles.integrationDescription}>
                  Phoenix Rooivalk combines multiple counter-drone methods in a
                  layered defense approach. The system automatically selects the
                  most appropriate method based on threat type, environmental
                  conditions, and operational requirements.
                </p>
                <div className={styles.statsGrid}>
                  <div className={styles.statBox}>
                    <div
                      className={`${styles.statValue} ${styles.statValueSuccess}`}
                    >
                      95%
                    </div>
                    <div className={styles.statLabel}>
                      Combined Effectiveness
                    </div>
                  </div>
                  <div className={styles.statBox}>
                    <div
                      className={`${styles.statValue} ${styles.statValuePrimary}`}
                    >
                      &lt;200ms
                    </div>
                    <div className={styles.statLabel}>
                      Average Response Time
                    </div>
                  </div>
                  <div className={styles.statBox}>
                    <div
                      className={`${styles.statValue} ${styles.statValueAccent}`}
                    >
                      6
                    </div>
                    <div className={styles.statLabel}>Defense Methods</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </RevealSection>
  );
};
