"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import styles from "./competitors.module.css";

/* ------------------------------------------------------------------ */
/* Data sourced from apps/docs/src/data/competitors.ts — kept in-sync */
/* with that canonical file.                                           */
/* ------------------------------------------------------------------ */

const comparisonRows = [
  {
    feature: "Response Time",
    phoenix: "<200ms",
    droneShield: ">5,000ms",
    dedrone: ">10,000ms",
    anduril: "~2,000ms",
    rafael: ">10,000ms",
  },
  {
    feature: "Offline Capable",
    phoenix: "Full",
    droneShield: "No",
    dedrone: "No",
    anduril: "Limited",
    rafael: "Partial",
  },
  {
    feature: "Blockchain Evidence",
    phoenix: "Yes",
    droneShield: "No",
    dedrone: "No",
    anduril: "No",
    rafael: "No",
  },
  {
    feature: "Pre-Hardware Revenue",
    phoenix: "x402 Live",
    droneShield: "No",
    dedrone: "No",
    anduril: "No",
    rafael: "No",
  },
  {
    feature: "Open Architecture",
    phoenix: "Yes",
    droneShield: "Proprietary",
    dedrone: "Proprietary",
    anduril: "Proprietary",
    rafael: "Proprietary",
  },
  {
    feature: "Export Flexibility",
    phoenix: "Non-ITAR",
    droneShield: "Some restrictions",
    dedrone: "US-based",
    anduril: "ITAR restricted",
    rafael: "Israel export controls",
  },
];

const competitors = [
  {
    name: "DroneShield",
    hq: "Australia / USA",
    ticker: "DRO (ASX)",
    pricing: "$1.2M+",
    products: ["DroneGun", "DroneSentry", "DroneOptID"],
    strengths: [
      "Established market presence",
      "Public company with capital access",
      "Government contracts",
    ],
    weaknesses: [
      "Slow response time (>5s)",
      "Cloud-dependent systems",
      "No blockchain evidence",
      "Higher pricing",
    ],
  },
  {
    name: "Dedrone (Axon)",
    hq: "USA / Germany",
    pricing: "$1.5M+",
    products: ["DedroneTracker", "DedroneSensor"],
    strengths: [
      "Strong detection capabilities",
      "Enterprise customer base",
      "Axon backing",
    ],
    weaknesses: [
      "Detection only \u2014 no neutralization",
      "Cloud-dependent",
      "No blockchain",
      "High pricing",
    ],
  },
  {
    name: "Anduril Industries",
    hq: "USA",
    pricing: "Premium (undisclosed)",
    products: ["Lattice AI", "Anvil", "Sentry Tower", "Ghost"],
    strengths: [
      "$14B valuation, $4.5B+ funding",
      "Advanced AI/ML capabilities",
      "DoD relationships",
    ],
    weaknesses: [
      "US-focused (ITAR restrictions)",
      "Premium pricing",
      "Not focused on commercial market",
    ],
  },
  {
    name: "Rafael Drone Dome",
    hq: "Israel",
    pricing: "$1.3M+",
    products: ["Drone Dome", "C-Guard RD"],
    strengths: [
      "Combat-proven in Middle East",
      "Integrated with Iron Dome",
      "Strong military credentials",
    ],
    weaknesses: [
      "Military-only focus",
      "High cost",
      "Export restrictions",
      "Slow soft-kill response",
    ],
  },
  {
    name: "Fortem Technologies",
    hq: "USA",
    pricing: "$800K\u2013$1.2M",
    products: ["TrueView Radar", "DroneHunter", "SkyDome"],
    strengths: [
      "AI-powered radar detection",
      "Autonomous interception",
      "FAA partnerships",
    ],
    weaknesses: [
      "Slower response time",
      "Cloud-dependent analytics",
      "No blockchain",
      "US-centric",
    ],
  },
  {
    name: "Raytheon Coyote",
    hq: "USA (RTX Corporation)",
    pricing: "$5.04B gov contract",
    products: ["Coyote Block 2", "Coyote Block 3"],
    strengths: [
      "Combat-proven",
      "Massive government contract",
      "Kinetic kill capability",
    ],
    weaknesses: [
      "Consumable (not reusable)",
      "High per-unit cost",
      "Military-only",
      "US government focus",
    ],
  },
];

const advantages = [
  {
    title: "Response Speed",
    metric: "<200ms",
    detail: "10\u2013150x faster than competitors (5,000\u201330,000ms)",
  },
  {
    title: "Pricing Advantage",
    metric: "60% lower",
    detail: "$25K\u2013$100K vs $800K\u2013$1.5M competitor systems",
  },
  {
    title: "Blockchain Evidence",
    metric: "Unique",
    detail: "Court-admissible audit trail \u2014 no competitor offers this",
  },
  {
    title: "Offline Operation",
    metric: "Full autonomy",
    detail: "Works in RF-denied and GPS-denied environments",
  },
  {
    title: "Export Reach",
    metric: "150+ countries",
    detail: "South Africa (non-ITAR) vs US ITAR restrictions",
  },
  {
    title: "Pre-Hardware Revenue",
    metric: "x402 Live",
    detail: "Revenue from day one via verification protocol",
  },
];

const positioning = {
  niche: "Fast, autonomous, blockchain-verified counter-drone defense",
  differentiators: [
    "Only sub-200ms response + blockchain evidence",
    "Only fully offline-capable system",
    "Only pre-hardware revenue model (x402)",
    "Lowest cost through in-house manufacturing",
    "Non-ITAR jurisdiction for global exports",
  ],
  avoid: [
    "Direct military kinetic systems (Raytheon)",
    "Pure detection plays (Dedrone)",
    "US government-only contracts (Anduril)",
  ],
  targets: [
    "Commercial airports (EU, Canada)",
    "Critical infrastructure (power, prisons)",
    "International military (non-US allies)",
    "Private security (events, corporate)",
  ],
};

function cellClass(value: string): string {
  if (
    value === "No" ||
    value === "Proprietary" ||
    value.includes("restricted") ||
    value.includes("controls")
  ) {
    return styles.competitorCell;
  }
  return styles.competitorCell;
}

export default function CompetitorsPageClient(): React.ReactElement {
  return (
    <main className={styles.main}>
      <Navigation />

      <div className={styles.contentWrapper}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.headerSection}>
            <h1 className={styles.title}>Competitive Landscape</h1>
            <p className={styles.subtitle}>
              How Phoenix Rooivalk compares to established counter-drone systems
              on speed, autonomy, evidence integrity, pricing, and global export
              reach.
            </p>
          </div>

          {/* Comparison Table */}
          <section className={styles.tableSection}>
            <h2 className={styles.sectionTitle}>Feature Comparison</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th className={styles.phoenixHeader}>Phoenix Rooivalk</th>
                    <th>DroneShield</th>
                    <th>Dedrone</th>
                    <th>Anduril</th>
                    <th>Rafael</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature}>
                      <td className={styles.featureCell}>{row.feature}</td>
                      <td className={styles.phoenixCell}>{row.phoenix}</td>
                      <td className={cellClass(row.droneShield)}>{row.droneShield}</td>
                      <td className={cellClass(row.dedrone)}>{row.dedrone}</td>
                      <td className={cellClass(row.anduril)}>{row.anduril}</td>
                      <td className={cellClass(row.rafael)}>{row.rafael}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Phoenix Advantages */}
          <section className={styles.advantagesSection}>
            <h2 className={styles.sectionTitle}>Phoenix Rooivalk Advantages</h2>
            <div className={styles.advantagesGrid}>
              {advantages.map((adv) => (
                <div key={adv.title} className={styles.advantageCard}>
                  <div className={styles.advantageTitle}>{adv.title}</div>
                  <div className={styles.advantageMetric}>{adv.metric}</div>
                  <div className={styles.advantageDetail}>{adv.detail}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Competitor Details */}
          <section className={styles.competitorSection}>
            <h2 className={styles.sectionTitle}>Competitor Profiles</h2>
            <div className={styles.competitorGrid}>
              {competitors.map((comp) => (
                <div key={comp.name} className={styles.competitorCard}>
                  <div className={styles.competitorName}>{comp.name}</div>
                  <div className={styles.competitorMeta}>{comp.hq}</div>
                  <div className={styles.competitorPricing}>{comp.pricing}</div>
                  <div className={styles.competitorProducts}>
                    {comp.products.map((p) => (
                      <span key={p} className={styles.productTag}>{p}</span>
                    ))}
                  </div>
                  <div className={styles.listTitle}>Strengths</div>
                  <ul className={styles.strengthsList}>
                    {comp.strengths.map((s) => (
                      <li key={s} className={styles.strengthItem}>{s}</li>
                    ))}
                  </ul>
                  <div className={styles.listTitle}>Weaknesses</div>
                  <ul className={styles.weaknessesList}>
                    {comp.weaknesses.map((w) => (
                      <li key={w} className={styles.weaknessItem}>{w}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Market Positioning */}
          <section className={styles.positioningSection}>
            <h2 className={styles.sectionTitle}>Market Positioning</h2>
            <div className={styles.positioningCard}>
              <div className={styles.positioningNiche}>{positioning.niche}</div>
              <div className={styles.positioningColumns}>
                <div>
                  <div className={styles.positioningColumnTitle}>Differentiators</div>
                  <ul className={styles.positioningList}>
                    {positioning.differentiators.map((d) => (
                      <li key={d} className={styles.positioningItem}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className={styles.positioningColumnTitle}>Target Markets</div>
                  <ul className={styles.positioningList}>
                    {positioning.targets.map((t) => (
                      <li key={t} className={styles.positioningItem}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className={styles.positioningColumnTitle}>Avoid Competing</div>
                  <ul className={styles.positioningList}>
                    {positioning.avoid.map((a) => (
                      <li key={a} className={styles.positioningItem}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <div className={styles.disclaimer}>
            Competitor information is based on publicly available data as of
            February 2026. Pricing figures are approximate and may vary by
            contract scope, geography, and customization level. Phoenix
            Rooivalk pricing represents deployment-package estimates, not
            individual SKU prices.
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
