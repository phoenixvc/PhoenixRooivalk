"use client";
import * as React from "react";

import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { ContactSection } from "../components/sections/ContactSection";
import { FeaturesSection } from "../components/sections/FeaturesSection";
import { HeroSection } from "../components/sections/HeroSection";
import { ProductHighlightsSection } from "../components/sections/ProductHighlightsSection";
import { InteractiveMesh } from "../components/ui/InteractiveMesh";
import { usePerformanceOptimizations } from "../hooks/usePerformanceOptimizations";
import styles from "./home.module.css";

export default function HomePage(): React.ReactElement {
  // Apply performance optimizations
  usePerformanceOptimizations();

  return (
    <main className={styles.main} id="main-content">
      {/* Background mesh effect */}
      <InteractiveMesh
        gridSize={50}
        color="rgba(234, 124, 28, 0.12)"
        bendStrength={25}
        bendRadius={120}
      />

      {/* Global Components */}

      {/* Navigation */}
      <Navigation />

      {/* Main Content Sections */}
      <HeroSection />
      <FeaturesSection />
      <ProductHighlightsSection />
      <ContactSection />

      {/* Footer */}
      <Footer />

      {/* FAQ Schema Markup - buyer focused */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How does the drone capture system work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Our pneumatic net launcher uses compressed air to deploy a capture net that safely intercepts drones without damage. No explosives, no RF jamming, no legal complications.",
                },
              },
              {
                "@type": "Question",
                name: "Who uses these systems?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Training facilities, drone racing leagues, event security teams, and facility managers. SkySnare for consumer/training, AeroNet for enterprise security.",
                },
              },
              {
                "@type": "Question",
                name: "When can I get one?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Preorders open now with no deposit required. First deliveries Q3 2026.",
                },
              },
              {
                "@type": "Question",
                name: "Is it legal to use?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Pneumatic net capture only - no RF jamming, no GPS spoofing, no signal interference. FCC compliant.",
                },
              },
            ],
          }),
        }}
      />
    </main>
  );
}
