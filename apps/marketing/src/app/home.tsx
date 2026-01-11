"use client";
import * as React from "react";

import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { ContactSection } from "../components/sections/ContactSection";
import { FeaturesSection } from "../components/sections/FeaturesSection";
import { HeroSection } from "../components/sections/HeroSection";
import { ProductHighlightsSection } from "../components/sections/ProductHighlightsSection";
import { usePerformanceOptimizations } from "../hooks/usePerformanceOptimizations";
import styles from "./home.module.css";

export default function HomePage(): React.ReactElement {
  // Apply performance optimizations
  usePerformanceOptimizations();

  return (
    <main className={styles.main} id="main-content">
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.backgroundGrid} />
      </div>

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

      {/* FAQ Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is PhoenixRooivalk's dual-brand strategy?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "PhoenixRooivalk operates two brands: SkySnare™ for consumer sports/training markets ($1.68B TAM @ 8.2% CAGR) and AeroNet™ for enterprise infrastructure security ($4.2B TAM @ 47% CAGR). We prove reliability at consumer scale, then leverage that track record for enterprise markets.",
                },
              },
              {
                "@type": "Question",
                name: "What is the 5-year revenue trajectory?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "PhoenixRooivalk targets growth from $1.825M (FY26) to $50M (FY30) revenue with 30% EBITDA margin. Year 1: prototype + 4,500 SkySnare™ units. Year 5: 75K consumer units + 35 AeroNet™ enterprise sites.",
                },
              },
              {
                "@type": "Question",
                name: "What is the combined market opportunity?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "PhoenixRooivalk addresses a $5.9B combined TAM: $1.68B consumer sports/training market growing at 8.2% CAGR plus $4.2B counter-drone security market growing at 47% CAGR. Dual-brand strategy minimizes channel conflict.",
                },
              },
              {
                "@type": "Question",
                name: "How does certification build competitive advantage?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Dual certification creates a regulatory moat: CPSC for SkySnare™ consumer safety (May 2026) and FAA waiver for AeroNet™ enterprise operations (June 2026). This safety-first approach builds trust and market credibility.",
                },
              },
              {
                "@type": "Question",
                name: "What is the capital strategy?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "PhoenixRooivalk requires $41.5M across 4 funding rounds: Seed ($1.5M, 2025-26), Series A ($5M, 2027), Series B ($15M, 2028), Growth ($20M, 2029). Target exit: $250-400M valuation by 2030, delivering 8-30× returns to early investors.",
                },
              },
            ],
          }),
        }}
      />
    </main>
  );
}
