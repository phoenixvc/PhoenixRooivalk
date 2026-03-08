import React from "react";
import { RevealSection } from "../RevealSection";
import { Card } from "../ui/Card";
import styles from "./MarketIntelligenceSection.module.css";

export const MarketIntelligenceSection: React.FC = () => {
  const marketData = [
    {
      metric: "$5.9B",
      label: "Combined TAM",
      description:
        "SkySnare™ ($1.68B @ 8.2% CAGR) + AeroNet™ ($4.2B @ 47% CAGR)",
    },
    {
      metric: "$50M",
      label: "FY30 Revenue Target",
      description: "5-year growth from $1.825M (FY26) to $50M (FY30)",
    },
    {
      metric: "30%",
      label: "Target EBITDA Margin",
      description: "Profitable unit economics by Year 5 (FY30)",
    },
    {
      metric: "$41.5M",
      label: "Capital Strategy",
      description: "Seed through Growth rounds to fund market leadership",
    },
  ];

  const competitors = [
    {
      name: "Consumer Sports",
      description: "Established brands with retail distribution",
      metrics: [
        { value: "$1.68B", label: "Market" },
        { value: "8.2%", label: "CAGR" },
      ],
    },
    {
      name: "Counter-Drone",
      description: "Anduril, Fortem, DroneShield leading",
      metrics: [
        { value: "$4.2B", label: "Market" },
        { value: "47%", label: "CAGR" },
      ],
    },
    {
      name: "Dual-Market Gap",
      description: "Phoenix opportunity: consumer + enterprise",
      metrics: [
        { value: "Minimal", label: "Competition" },
        { value: "High", label: "Opportunity" },
      ],
    },
  ];

  return (
    <section className={styles.section} id="market">
      <div className={styles.container}>
        <RevealSection className={styles.header}>
          <h2 className={styles.title}>Dual-Brand Market Strategy</h2>
          <p className={styles.description}>
            PhoenixRooivalk targets $5.9B combined opportunity through parallel
            consumer validation (SkySnare™) and enterprise scaling (AeroNet™)
          </p>
        </RevealSection>

        {/* Market Metrics */}
        <RevealSection className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Market Intelligence</h3>
          <div className={styles.metricsGrid}>
            {marketData.map((data, index) => (
              <div key={index} className={styles.metricCard}>
                <div className={styles.metricValue}>{data.metric}</div>
                <div className={styles.metricLabel}>{data.label}</div>
                <div className={styles.metricDescription}>
                  {data.description}
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Competitive Analysis */}
        <RevealSection>
          <h3 className={styles.subsectionTitle}>Competitive Landscape</h3>
          <div className={styles.competitorsGrid}>
            {competitors.map((competitor, index) => (
              <div key={index} className={styles.competitorCard}>
                <div className={styles.competitorName}>{competitor.name}</div>
                <div className={styles.competitorDescription}>
                  {competitor.description}
                </div>
                <div className={styles.competitorMetrics}>
                  {competitor.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className={styles.competitorMetric}>
                      <div className={styles.competitorMetricValue}>
                        {metric.value}
                      </div>
                      <div className={styles.competitorMetricLabel}>
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Phoenix Advantage */}
        <RevealSection className={styles.advantageSection}>
          <h3 className={styles.subsectionTitle}>Key Competitive Advantages</h3>
          <div className={styles.advantageGrid}>
            <Card
              icon="🛡️"
              title="Safety & Compliance"
              description="Dual certification (CPSC + FAA) builds regulatory moat"
              colorVariant="green"
            />
            <Card
              icon="🧠"
              title="AI Edge Processing"
              description="On-device intelligence ensures privacy and low latency"
              colorVariant="blue"
            />
            <Card
              icon="🏷️"
              title="Brand Separation"
              description="Consumer & enterprise brands avoid channel conflict"
              colorVariant="purple"
            />
            <Card
              icon="📊"
              title="Data Asset Creation"
              description="Proprietary training data from AeroNet™ deployments"
              colorVariant="yellow"
            />
          </div>
        </RevealSection>
      </div>
    </section>
  );
};
