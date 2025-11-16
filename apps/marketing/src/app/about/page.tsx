"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { SocialProofSection } from "../../components/sections/SocialProofSection";
import { TeamSection } from "../../components/sections/TeamSection";
import { TechnicalIntegrationsSection } from "../../components/sections/TechnicalIntegrationsSection";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";
import styles from "./about.module.css";

export default function AboutPage(): React.ReactElement {
  // Apply performance optimizations
  usePerformanceOptimizations();

  return (
    <main className={styles.main}>
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gridPattern} />
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content Sections */}
      <div className={styles.contentWrapper}>
        <SocialProofSection />
        <TeamSection />
        <TechnicalIntegrationsSection />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
