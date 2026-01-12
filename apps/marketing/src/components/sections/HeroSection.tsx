import * as React from "react";
import { Button } from "../ui/button";
import styles from "./HeroSection.module.css";

export const HeroSection: React.FC = () => {
  return (
    <section className={styles.section} id="hero">
      <div className={styles.container}>
        {/* Development status indicators */}
        <div className={styles.statusBadges}>
          <span className="pill pill--concept">Now Taking Preorders</span>
          <span className="pill pill--partners">
            Safe &amp; Non-Destructive Technology
          </span>
          <span className="pill pill--sbir">Seeking Early Partners</span>
        </div>

        {/* Vision-focused headline */}
        <h1 className={styles.headline}>
          Smart <span className={styles.headlineOrange}>Drone Capture</span>{" "}
          Systems
          <span className={styles.headlineSubtext}>
            From Training to Security — Solutions for Every Need
          </span>
        </h1>
        <p className={styles.description}>
          Pneumatic net launchers that safely capture drones without damage.
          Perfect for training, sports, and professional security applications.
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
            <strong>Our Approach:</strong> Safe, reliable drone capture
            technology — starting with consumer training systems and scaling to
            enterprise-grade security solutions.
          </p>
        </div>
        <div className={styles.metricsCard}>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <div className={styles.metricValue}>Net Launcher</div>
              <div className={styles.metricLabel}>Pneumatic Technology</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>Jul 2026</div>
              <div className={styles.metricLabel}>First Deliveries</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>100% Safe</div>
              <div className={styles.metricLabel}>Non-Destructive Capture</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>3 Product Lines</div>
              <div className={styles.metricLabel}>Training to Enterprise</div>
            </div>
          </div>
        </div>

        {/* Enhanced CTAs with specific value propositions */}
        <div className={styles.ctaSection}>
          <div className={styles.ctaButtons}>
            <Button
              href="/products"
              size="lg"
              variant="primary"
              trackingEvent="Products Clicked"
              trackingProps={{ location: "hero", type: "primary" }}
              aria-label="Browse our product catalog"
            >
              Browse Products
            </Button>
            <Button
              href="/contact"
              variant="secondary"
              size="lg"
              trackingEvent="Preorder Clicked"
              trackingProps={{ location: "hero", type: "preorder" }}
              aria-label="Contact us to preorder"
            >
              Get in Touch
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
              href="/timeline"
              variant="ghost"
              size="sm"
              trackingEvent="Timeline Viewed"
              trackingProps={{ location: "hero" }}
              aria-label="View development timeline"
            >
              Development Timeline →
            </Button>
            <Button
              href="/contact"
              variant="ghost"
              size="sm"
              trackingEvent="Contact Viewed"
              trackingProps={{ location: "hero" }}
              aria-label="Contact us for partnerships"
            >
              Contact & Partnerships →
            </Button>
          </div>
        </div>

        {/* 5-Year Strategic Path */}
        <div className={styles.conceptCard}>
          <div className="card card--elevated">
            <div className={styles.conceptTitle}>
              <h3 className={styles.conceptTitleText}>
                Our Development Path (2026-2030)
              </h3>
              <p className={styles.conceptDescription}>
                Starting with proven pneumatic technology, expanding to advanced
                systems
              </p>
            </div>

            {/* Visual concept representation */}
            <div className={styles.conceptMetrics}>
              <div className={styles.conceptMetric}>
                <span className={styles.conceptMetricLabel}>
                  Phase 1 (2026)
                </span>
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
                Phased approach reduces risk and validates technology at each
                stage
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
