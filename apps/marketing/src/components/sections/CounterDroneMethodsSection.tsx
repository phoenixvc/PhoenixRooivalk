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
}

const MethodCard: React.FC<MethodCardProps> = ({
  icon,
  title,
  description,
  effectiveness,
  responseTime,
  range,
}) => (
  <div className={styles.card}>
    <div className={styles.cardIcon}>{icon}</div>
    <h3 className={styles.cardTitle}>{title}</h3>
    <p className={styles.cardDescription}>{description}</p>
    <div className={styles.metricsGrid}>
      <div className={styles.metricBox}>
        <div className={styles.metricValue}>{effectiveness}</div>
        <div className={styles.metricLabel}>Effectiveness</div>
      </div>
      <div className={styles.metricBox}>
        <div className={styles.metricValue}>{responseTime}</div>
        <div className={styles.metricLabel}>Response</div>
      </div>
      <div className={styles.metricBox}>
        <div className={styles.metricValue}>{range}</div>
        <div className={styles.metricLabel}>Range</div>
      </div>
    </div>
  </div>
);

export const CounterDroneMethodsSection: React.FC = () => {
  const methods = [
    {
      icon: "📡",
      title: "RF Jamming",
      description: "Disrupts drone communication and control signals",
      effectiveness: "85%",
      responseTime: "50-200ms",
      range: "1-5km",
    },
    {
      icon: "🎯",
      title: "GPS Spoofing",
      description: "Misleads drone navigation with false positioning",
      effectiveness: "70%",
      responseTime: "100-500ms",
      range: "500m-2km",
    },
    {
      icon: "⚡",
      title: "Electronic Warfare",
      description: "Targets drone electronics with electromagnetic attacks",
      effectiveness: "95%",
      responseTime: "20-100ms",
      range: "2-10km",
    },
    {
      icon: "🔍",
      title: "Kinetic Intercept",
      description: "Physical neutralization using nets or projectiles",
      effectiveness: "90%",
      responseTime: "200-1000ms",
      range: "100m-2km",
    },
    {
      icon: "🌐",
      title: "Cyber Takeover",
      description: "Hacks into drone systems to gain remote control",
      effectiveness: "60%",
      responseTime: "1-5s",
      range: "Unlimited",
    },
    {
      icon: "🛡️",
      title: "Directed Energy",
      description: "Disables drones with high-energy laser or microwave",
      effectiveness: "80%",
      responseTime: "100-300ms",
      range: "500m-3km",
    },
  ];

  return (
    <RevealSection>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.innerContainer}>
            <div className={styles.header}>
              <h2 className={styles.title}>Counter-Drone Defense Methods</h2>
              <p className={styles.subtitle}>
                Phoenix Rooivalk integrates multiple defense strategies for
                comprehensive drone threat protection.
              </p>
            </div>

            <div className={styles.grid}>
              {methods.map((method, index) => (
                <MethodCard key={index} {...method} />
              ))}
            </div>

            <div className={styles.integrationSection}>
              <div className={styles.integrationCard}>
                <h3 className={styles.integrationTitle}>
                  Integrated Defense Strategy
                </h3>
                <p className={styles.integrationDescription}>
                  Automatically selects the optimal defense method based on
                  threat type and conditions.
                </p>
                <div className={styles.statsGrid}>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>95%</div>
                    <div className={styles.statLabel}>Combined Effectiveness</div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>&lt;200ms</div>
                    <div className={styles.statLabel}>Avg Response</div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>6</div>
                    <div className={styles.statLabel}>Methods</div>
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
