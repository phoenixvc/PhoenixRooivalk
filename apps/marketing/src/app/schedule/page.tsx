"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { CalendarIntegration } from "../../components/CalendarIntegration";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";

export default function SchedulePage(): React.ReactElement {
  // Apply performance optimizations
  usePerformanceOptimizations();

  return (
    <main className="relative overflow-hidden bg-[rgb(var(--darker))] text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_#1b2735_0%,_#090a0f_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.03)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(0,255,136,0.03)_1px,_transparent_1px)] bg-[length:50px_50px] animate-gridMove" />
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="pt-20">
        <CalendarIntegration showEventTypes={true} />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
