"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { CounterDroneMethodsSection } from "../../components/sections/CounterDroneMethodsSection";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";
import styles from "./methods.module.css";

export default function MethodsPage(): React.ReactElement {
  // Apply performance optimizations
  usePerformanceOptimizations();

  return (
    <main className={styles.main}>
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <CounterDroneMethodsSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
