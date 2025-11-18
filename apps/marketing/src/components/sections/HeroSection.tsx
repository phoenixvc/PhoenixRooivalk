import * as React from "react";
import { Button } from "../ui/button";
import styles from "./HeroSection.module.css";

export const HeroSection: React.FC = () => {
  return (
    <section className={styles.section} id="hero">
      <div className={styles.container}>
        {/* Development status indicators */}
        <div className={styles.statusBadges}>
          <span className="pill pill--concept">Phase 1: Pneumatic Net Launcher</span>
          <span className="pill pill--partners">
            SkySnare™ Consumer | AeroNet™ Enterprise
          </span>
          <span className="pill pill--sbir">Seeking Early Partners</span>
        </div>

        {/* Vision-focused headline */}
        <h1 className={styles.headline}>
          Dual-Brand{" "}
          <span className={styles.headlineOrange}>Counter-Drone</span> Platform
          <span className={styles.headlineSubtext}>
            SkySnare™ Consumer Sports | AeroNet™ Enterprise Security
          </span>
        </h1>
        <p className={styles.description}>
          Pneumatic interception technology designed for two markets: consumer
          sports training and enterprise infrastructure protection.
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
            <strong>Our Strategy:</strong> Build consumer brand (SkySnare™) to
            demonstrate safety and reliability, then scale proven technology to
            enterprise markets (AeroNet™).
          </p>
        </div>
        <div className={styles.metricsCard}>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <div className={styles.metricValue}>Phase 1</div>
              <div className={styles.metricLabel}>Pneumatic Net Launcher</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>2026-2027</div>
              <div className={styles.metricLabel}>Launch + Testing</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>2 Brands</div>
              <div className={styles.metricLabel}>SkySnare™ + AeroNet™</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>Future Phases</div>
              <div className={styles.metricLabel}>Advanced Detection</div>
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
                Our Development Path (2025-2030)
              </h3>
              <p className={styles.conceptDescription}>
                Starting with proven pneumatic technology, expanding to advanced systems
              </p>
            </div>

            {/* Visual concept representation */}
            <div className={styles.conceptMetrics}>
              <div className={styles.conceptMetric}>
                <span className={styles.conceptMetricLabel}>Phase 1 (2026)</span>
                <span className={styles.conceptMetricValue}>Net Launcher</span>
              </div>
              <div className={styles.conceptMetric}>
                <span className={styles.conceptMetricLabel}>
                  Phase 2 (2027)
                </span>
                <span className={styles.conceptMetricValue}>AI Detection</span>
              </div>
              <div className={styles.conceptMetric}>
                <span className={styles.conceptMetricLabel}>
                  Phase 3+ (2028-30)
                </span>
                <span className={styles.conceptMetricValue}>Full Platform</span>
              </div>
            </div>

            <div className={styles.disclaimer}>
              <p className={styles.disclaimerText}>
                💡 Phased approach reduces risk and validates technology at each stage
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
