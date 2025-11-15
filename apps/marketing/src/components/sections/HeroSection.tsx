import * as React from "react";
import { Button } from "../ui/button";
import styles from "./HeroSection.module.css";

export const HeroSection: React.FC = () => {
  return (
    <section className={styles.section} id="hero">
      <div className={styles.container}>
        {/* Development status indicators */}
        <div className={styles.statusBadges}>
          <span className="pill pill--concept">Foundation Phase (FY26)</span>
          <span className="pill pill--partners">SkySnare™ Consumer | AeroNet™ Enterprise</span>
          <span className="pill pill--sbir">Seeking Early Partners</span>
        </div>

        {/* Vision-focused headline */}
        <h1 className={styles.headline}>
          Safety-Proven <span className={styles.headlineOrange}>at</span> Consumer Scale.
          Enterprise-Ready <span className={styles.headlineOrange}>with</span> AI Compliance.
          <span className={styles.headlineSubtext}>
            Dual-Brand Strategy: SkySnare™ + AeroNet™
          </span>
        </h1>
        <p className={styles.description}>
          Transform proven pneumatic technology into world-leading brands.
          Consumer sports safety meets enterprise infrastructure security.
        </p>

        {/* Mission Statement */}
        <div className={styles.missionStatement}>
          <div className={styles.missionIcon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <p className={styles.missionText}>
            <strong>Our Strategy:</strong> Prove reliability and safety at consumer scale (SkySnare™), 
            then leverage that track record for high-value enterprise markets (AeroNet™).
          </p>
        </div>
        <div className={styles.metricsCard}>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <div className={styles.metricValue}>$5.9B</div>
              <div className={styles.metricLabel}>Combined TAM</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>$50M</div>
              <div className={styles.metricLabel}>FY30 Target Revenue</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>30%</div>
              <div className={styles.metricLabel}>EBITDA Margin (FY30)</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>2 Brands</div>
              <div className={styles.metricLabel}>SkySnare™ + AeroNet™</div>
            </div>
          </div>
        </div>

        {/* Enhanced CTAs with specific value propositions */}
        <div className={styles.ctaSection}>
          <div className={styles.ctaButtons}>
            <Button
              href="/interactive-demo"
              size="lg"
              variant="primary"
              trackingEvent="Demo Clicked"
              trackingProps={{ location: "hero", type: "primary" }}
              aria-label="Try the interactive threat simulator demo"
            >
              Try the Simulation (Concept UI)
            </Button>
            <Button
              href="/contact"
              variant="secondary"
              size="lg"
              trackingEvent="Contact Clicked"
              trackingProps={{ location: "hero", type: "early-access" }}
              aria-label="Join early access program"
            >
              Join Early Access
            </Button>
          </div>
          <div className={styles.secondaryLinks}>
            <Button
              href="/technical"
              variant="ghost"
              size="sm"
              trackingEvent="Technical Specs Viewed"
              trackingProps={{ location: "hero" }}
              aria-label="View technical specifications"
            >
              Technical Specifications →
            </Button>
            <Button
              href="/financial"
              variant="ghost"
              size="sm"
              trackingEvent="ROI Calculator Viewed"
              trackingProps={{ location: "hero" }}
              aria-label="Calculate return on investment"
            >
              ROI Calculator →
            </Button>
            <Button
              href="/compliance"
              variant="ghost"
              size="sm"
              trackingEvent="Compliance Viewed"
              trackingProps={{ location: "hero" }}
              aria-label="View compliance and certifications"
            >
              Compliance & Certifications →
            </Button>
          </div>
        </div>

        {/* 5-Year Strategic Path */}
        <div className={styles.conceptCard}>
          <div className="card card--elevated">
            <div className={styles.conceptTitle}>
              <h3 className={styles.conceptTitleText}>
                5-Year Strategic Roadmap (2025-2030)
              </h3>
              <p className={styles.conceptDescription}>
                From consumer validation to enterprise leadership
              </p>
            </div>

            {/* Visual concept representation */}
            <div className={styles.conceptMetrics}>
              <div className={styles.conceptMetric}>
                <span className={styles.conceptMetricLabel}>
                  FY26 Revenue
                </span>
                <span className={styles.conceptMetricValue}>$1.8M</span>
              </div>
              <div className={styles.conceptMetric}>
                <span className={styles.conceptMetricLabel}>
                  FY30 Revenue Target
                </span>
                <span className={styles.conceptMetricValue}>$50M</span>
              </div>
              <div className={styles.conceptMetric}>
                <span className={styles.conceptMetricLabel}>
                  Capital Requirement
                </span>
                <span className={styles.conceptMetricValue}>$41.5M</span>
              </div>
            </div>

            <div className={styles.disclaimer}>
              <p className={styles.disclaimerText}>
                💡 Targets based on market research and strategic milestones.
                Performance subject to execution and market conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
