"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { CalendarIntegration } from "../../components/CalendarIntegration";
import { InteractiveMesh } from "../../components/ui/InteractiveMesh";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";
import styles from "./schedule.module.css";

export default function SchedulePage(): React.ReactElement {
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
        <CalendarIntegration showEventTypes={true} />
      </div>

      <Footer />
    </main>
  );
}
