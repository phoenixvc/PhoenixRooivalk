import React from "react";
import { RevealSection } from "../RevealSection";
import styles from "./MarketIntelligenceSection.module.css";

export const MarketIntelligenceSection: React.FC = () => {
  const marketData = [
    {
      metric: "$5.9B",
      label: "Combined TAM",
      description: "SkySnare™ ($1.68B @ 8.2% CAGR) + AeroNet™ ($4.2B @ 47% CAGR)",
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
      name: "Consumer Sports Equipment",
      status: "$1.68B market @ 8.2% CAGR",
      capability: "Established brands, retail distribution",
      limitation: "No counter-drone crossover, limited tech integration",
    },
    {
      name: "Counter-Drone Security",
      status: "$4.2B market @ 47% CAGR",
      capability: "Anduril, Fortem, DroneShield",
      limitation: "No consumer validation, compliance-heavy entry barriers",
    },
    {
      name: "Dual-Market Players",
      status: "Minimal competition",
      capability: "Gap opportunity: consumer + enterprise",
      limitation: "Most players focus on single market segment",
    },
  ];

  return (
    <section className={styles.section} id="market">
      <div className={styles.container}>
        <RevealSection className={styles.header}>
          <h2 className={styles.title}>
            Dual-Brand Market Strategy
          </h2>
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
                <div className={styles.competitorStatus}>
                  {competitor.status}
                </div>
                <div className={styles.competitorCapability}>
                  <strong>Strengths:</strong> {competitor.capability}
                </div>
                <div className={styles.competitorLimitation}>
                  <strong>Limitations:</strong> {competitor.limitation}
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Phoenix Advantage */}
        <RevealSection className={styles.advantageSection}>
          <div className={styles.advantageCard}>
            <h3 className={styles.advantageTitle}>
              Key Competitive Advantages
            </h3>
            <div className={styles.advantageGrid}>
              <div className={styles.advantageItem}>
                <div className={styles.advantageItemTitle}>Safety & Compliance</div>
                <div className={styles.advantageItemDescription}>
                  Dual certification (CPSC + FAA) builds regulatory moat
                </div>
              </div>
              <div className={styles.advantageItem}>
                <div className={styles.advantageItemTitle}>AI Edge Processing</div>
                <div className={styles.advantageItemDescription}>
                  On-device intelligence ensures privacy and low latency
                </div>
              </div>
              <div className={styles.advantageItem}>
                <div className={styles.advantageItemTitle}>Brand Separation</div>
                <div className={styles.advantageItemDescription}>
                  Two brands—consumer & enterprise—avoid channel conflict
                </div>
              </div>
              <div className={styles.advantageItem}>
                <div className={styles.advantageItemTitle}>Data Asset Creation</div>
                <div className={styles.advantageItemDescription}>
                  Proprietary training data from AeroNet™ deployments
                </div>
              </div>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
};
