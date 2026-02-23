"use client";
import dynamic from "next/dynamic";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { SocialProofSection } from "../../components/sections/SocialProofSection";
import { TeamSection } from "../../components/sections/TeamSection";
import { TechnicalIntegrationsSection } from "../../components/sections/TechnicalIntegrationsSection";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";
import styles from "./about.module.css";

const InteractiveMesh = dynamic(
  () =>
    import("../../components/ui/InteractiveMesh").then(
      (mod) => mod.InteractiveMesh,
    ),
  { ssr: false },
);

/** About page — team, social proof, and technical integrations. */
export function AboutPage(): React.ReactElement {
  // Apply performance optimizations
  usePerformanceOptimizations();

  return (
    <main className={styles.main}>
      {/* Background mesh effect */}
      <InteractiveMesh
        gridSize={50}
        color="rgba(234, 124, 28, 0.1)"
        bendStrength={20}
        bendRadius={100}
      />

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

export default AboutPage;
