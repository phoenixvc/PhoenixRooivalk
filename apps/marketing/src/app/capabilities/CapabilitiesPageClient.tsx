"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { CapabilitiesSection } from "../../components/sections/CapabilitiesSection";
import { InteractiveMesh } from "../../components/ui/InteractiveMesh";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";
import styles from "./capabilities.module.css";

export default function CapabilitiesPage(): React.ReactElement {
  usePerformanceOptimizations();

  return (
    <main className={styles.main}>
      <InteractiveMesh
        gridSize={50}
        color="rgba(234, 124, 28, 0.1)"
        bendStrength={20}
        bendRadius={100}
      />

      <Navigation />

      <div className={styles.contentWrapper}>
        <CapabilitiesSection />
      </div>

      <Footer />
    </main>
  );
}
