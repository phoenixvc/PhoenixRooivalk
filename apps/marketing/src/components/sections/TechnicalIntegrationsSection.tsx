import * as React from "react";
import { RevealSection } from "../RevealSection";
import { Card } from "../ui/Card";
import styles from "./TechnicalIntegrationsSection.module.css";

export const TechnicalIntegrationsSection: React.FC = () => {
  const coreIntegrations = [
    {
      name: "Solana Blockchain",
      description: "Immutable evidence trails and legal compliance",
      icon: "⛓️",
      metrics: [
        { value: "400ms", label: "Confirmation" },
        { value: "100%", label: "Tamper-proof" },
      ],
      colorClass: "purple",
      status: "Live",
      tier: "Core",
    },
    {
      name: "Morpheus AI",
      description: "Enhanced threat analysis when network available",
      icon: "🤖",
      metrics: [
        { value: "97%", label: "Accuracy" },
        { value: "10-30s", label: "Analysis" },
      ],
      colorClass: "green",
      status: "Beta",
      tier: "Enhanced",
    },
    {
      name: "Hivemapper Network",
      description: "Anti-spoofing protection and location validation",
      icon: "🗺️",
      metrics: [
        { value: "Multi-node", label: "Verification" },
        { value: "Active", label: "Anti-spoof" },
      ],
      colorClass: "teal",
      status: "Planned",
      tier: "Enhanced",
    },
    {
      name: "Pinax Analytics",
      description: "Historical pattern analysis and compliance reporting",
      icon: "📊",
      metrics: [
        { value: "99.9%", label: "Uptime SLA" },
        { value: "Advanced", label: "Patterns" },
      ],
      colorClass: "orange",
      status: "Planned",
      tier: "Strategic",
    },
  ];

  return (
    <section className={styles.section} id="integrations">
      <div className={styles.container}>
        <RevealSection>
          <div className={styles.header}>
            <h2 className={styles.title}>Core Technical Integrations</h2>
            <p className={styles.description}>
              Phoenix Rooivalk operates autonomously at the edge, with optional
              blockchain and AI enhancements when network connectivity is
              available. Core functionality never depends on external services.
            </p>
          </div>

          <div className={styles.grid}>
            {coreIntegrations.map((integration) => (
              <div
                key={integration.name}
                className={`${styles.card} ${styles[`card${integration.colorClass.charAt(0).toUpperCase() + integration.colorClass.slice(1)}`]}`}
              >
                <div className={styles.badges}>
                  <span
                    className={`${styles.badge} ${
                      integration.status === "Live"
                        ? styles.badgeLive
                        : integration.status === "Beta"
                          ? styles.badgeBeta
                          : styles.badgePlanned
                    }`}
                  >
                    {integration.status}
                  </span>
                  <span
                    className={`${styles.badge} ${
                      integration.tier === "Core"
                        ? styles.badgeCore
                        : integration.tier === "Enhanced"
                          ? styles.badgeEnhanced
                          : styles.badgeStrategic
                    }`}
                  >
                    {integration.tier}
                  </span>
                </div>
                <div className={styles.cardContent}>
                  <div
                    className={`${styles.icon} ${styles[`icon${integration.colorClass.charAt(0).toUpperCase() + integration.colorClass.slice(1)}`]}`}
                  >
                    {integration.icon}
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>{integration.name}</h3>
                    <p className={styles.cardDescription}>
                      {integration.description}
                    </p>
                  </div>
                </div>

                <div className={styles.metricsGrid}>
                  {integration.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className={styles.metricBox}>
                      <div className={styles.metricValue}>{metric.value}</div>
                      <div className={styles.metricLabel}>{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Technical Architecture Diagram */}
          <div className={styles.architectureDiagram}>
            <h3 className={styles.architectureTitle}>
              Three-Tier Defense Architecture
            </h3>
            <div className={styles.architectureGrid}>
              <div className={styles.architectureItem}>
                <div
                  className={`${styles.architectureIcon} ${styles.architectureIconBlue}`}
                >
                  ⚡
                </div>
                <h4 className={styles.architectureItemTitle}>
                  Edge Processing
                </h4>
                <p className={styles.architectureItemSubtitle}>
                  &lt;50ms response
                </p>
                <span
                  className={`${styles.architectureItemBadge} ${styles.architectureItemBadgeCore}`}
                >
                  Core
                </span>
              </div>

              <div className={styles.architectureItem}>
                <div
                  className={`${styles.architectureIcon} ${styles.architectureIconGreen}`}
                >
                  🤖
                </div>
                <h4 className={styles.architectureItemTitle}>Morpheus AI</h4>
                <p className={styles.architectureItemSubtitle}>
                  10-30s analysis
                </p>
                <span
                  className={`${styles.architectureItemBadge} ${styles.architectureItemBadgeEnhanced}`}
                >
                  Enhanced
                </span>
              </div>

              <div className={styles.architectureItem}>
                <div
                  className={`${styles.architectureIcon} ${styles.architectureIconPurple}`}
                >
                  ⛓️
                </div>
                <h4 className={styles.architectureItemTitle}>
                  Solana Blockchain
                </h4>
                <p className={styles.architectureItemSubtitle}>
                  400ms confirmation
                </p>
                <span
                  className={`${styles.architectureItemBadge} ${styles.architectureItemBadgeCore}`}
                >
                  Core
                </span>
              </div>

              <div className={styles.architectureItem}>
                <div
                  className={`${styles.architectureIcon} ${styles.architectureIconOrange}`}
                >
                  📊
                </div>
                <h4 className={styles.architectureItemTitle}>
                  Pinax Analytics
                </h4>
                <p className={styles.architectureItemSubtitle}>99.9% uptime</p>
                <span
                  className={`${styles.architectureItemBadge} ${styles.architectureItemBadgeStrategic}`}
                >
                  Strategic
                </span>
              </div>
            </div>

            <div className={styles.architectureFooter}>
              <div className={styles.architectureFooterText}>
                Core functionality operates autonomously, with optional
                enhancements when network connectivity is available
              </div>
              <div className={styles.architectureFooterGrid}>
                <div className={styles.architectureFooterCard}>
                  <div className={styles.architectureFooterCardTitle}>
                    Core Defense
                  </div>
                  <div>Edge processing, sensor fusion, autonomous response</div>
                </div>
                <div className={styles.architectureFooterCard}>
                  <div className={styles.architectureFooterCardTitle}>
                    Enhanced Intelligence
                  </div>
                  <div>AI analysis, blockchain evidence, anti-spoofing</div>
                </div>
                <div className={styles.architectureFooterCard}>
                  <div className={styles.architectureFooterCardTitle}>
                    Strategic Analytics
                  </div>
                  <div>Historical patterns, compliance reporting, insights</div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className={styles.valueProposition}>
            <Card
              icon="⚡"
              title="Core Performance"
              description="Sub-second response with zero network dependency"
              colorVariant="green"
              metrics={[
                { value: "<1s", label: "Response" },
                { value: "100%", label: "Autonomous" },
                { value: "Military", label: "Grade" },
              ]}
            />
            <Card
              icon="🧠"
              title="Enhanced Intelligence"
              description="AI-powered analysis with immutable evidence trails"
              colorVariant="purple"
              metrics={[
                { value: "97%", label: "AI Accuracy" },
                { value: "Tamper-proof", label: "Evidence" },
                { value: "Pattern", label: "Analysis" },
              ]}
            />
            <Card
              icon="🎯"
              title="Strategic Value"
              description="Future-proof architecture with compliance-ready design"
              colorVariant="yellow"
              metrics={[
                { value: "Scalable", label: "Architecture" },
                { value: "Compliant", label: "Design" },
                { value: "Protected", label: "Investment" },
              ]}
            />
          </div>
        </RevealSection>
      </div>
    </section>
  );
};
