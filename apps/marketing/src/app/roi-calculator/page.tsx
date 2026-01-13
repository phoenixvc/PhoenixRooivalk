"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { InteractiveElementsSection } from "../../components/sections/InteractiveElementsSection";
import { InteractiveMesh } from "../../components/ui/InteractiveMesh";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";
import styles from "./roi-calculator.module.css";

export default function ROICalculatorPage(): React.ReactElement {
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
        <InteractiveElementsSection />
      </div>

      <Footer />
    </main>
  );
}
