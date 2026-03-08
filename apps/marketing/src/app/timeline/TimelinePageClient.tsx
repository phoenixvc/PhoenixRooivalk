"use client";
import dynamic from "next/dynamic";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { TimelineSection } from "../../components/sections/TimelineSection";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";
import styles from "./timeline.module.css";

const InteractiveMesh = dynamic(
  () =>
    import("../../components/ui/InteractiveMesh").then(
      (mod) => mod.InteractiveMesh,
    ),
  { ssr: false },
);

/** Development timeline marketing page. */
export function TimelinePage(): React.ReactElement {
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
        <TimelineSection />
      </div>

      <Footer />
    </main>
  );
}

export default TimelinePage;
