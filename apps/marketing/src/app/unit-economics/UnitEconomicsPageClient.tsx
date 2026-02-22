"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import styles from "./unit-economics.module.css";

/* ------------------------------------------------------------------ */
/* Data sourced from apps/docs/src/data/pricing.ts — kept in-sync     */
/* with that canonical file. Segment-level deployment-package pricing. */
/* For individual SKU prices see apps/marketing/src/data/products.ts.  */
/* ------------------------------------------------------------------ */

const unitEconomics = {
  cac: { value: "R50,000", usd: "~$2,780", note: "Customer Acquisition Cost" },
  ltv: { value: "R1,200,000", usd: "~$66,700", note: "Customer Lifetime Value" },
  payback: { value: "12 mo", note: "Average payback period" },
  ltvCacRatio: "24:1",
};

const cogs = {
  inHouse: { usd: "$56,000", zar: "R850,000", label: "In-House Manufacturing" },
  outsourced: { usd: "$93,000", zar: "R1,400,000", label: "Outsourced Manufacturing" },
  savings: "60%",
  savingsNote: "Cost reduction through in-house Kevlar manufacturing",
};

const margins = {
  gross: { value: 65, note: "Hardware + software combined" },
  ebitda: { value: 25, note: "Target by Year 3" },
};

const revenueProjections = [
  { year: "Year 1", amount: "R25M", systems: 25, note: "Initial installations" },
  { year: "Year 2", amount: "R75M", systems: 75, note: "Including services revenue" },
  { year: "Year 3", amount: "R150M", systems: 150, note: "Including recurring revenue" },
  { year: "Year 4", amount: "R300M", systems: 300, note: "International expansion" },
  { year: "Year 5", amount: "R500M", systems: 500, note: "Market leadership" },
];

const funding = {
  seed: {
    stage: "Seed",
    amount: "$500K\u2013$1M",
    runway: "18 months",
    allocation: { hardware: 30, market: 40, team: 30 },
    milestones: [
      "5 pilot installations",
      "10 x402 enterprise customers",
      "Key regulatory certifications",
    ],
  },
  seriesA: {
    stage: "Series A",
    amount: "R120M (~$6.7M)",
    timeline: "Q3 2026",
    milestones: ["Proven revenue", "5 operational installations"],
  },
  exit: {
    stage: "Exit Target",
    amount: "R2\u20135B",
    timeline: "Year 5\u20137",
    milestones: ["IPO or strategic acquisition"],
  },
};

export default function UnitEconomicsPageClient(): React.ReactElement {
  return (
    <main className={styles.main}>
      <Navigation />

      <div className={styles.contentWrapper}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.headerSection}>
            <h1 className={styles.title}>Unit Economics</h1>
            <p className={styles.subtitle}>
              Key financial metrics behind Phoenix Rooivalk&apos;s counter-drone
              platform: customer acquisition cost, lifetime value, margins, and
              five-year revenue projections.
            </p>
          </div>

          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>CAC</div>
              <div className={styles.kpiValue}>{unitEconomics.cac.value}</div>
              <div className={styles.kpiNote}>
                {unitEconomics.cac.usd} &middot; {unitEconomics.cac.note}
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>LTV</div>
              <div className={styles.kpiValue}>{unitEconomics.ltv.value}</div>
              <div className={styles.kpiNote}>
                {unitEconomics.ltv.usd} &middot; {unitEconomics.ltv.note}
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>Payback Period</div>
              <div className={styles.kpiValue}>{unitEconomics.payback.value}</div>
              <div className={styles.kpiNote}>
                LTV:CAC ratio {unitEconomics.ltvCacRatio}
              </div>
            </div>
          </div>

          {/* COGS */}
          <section className={styles.cogsSection}>
            <h2 className={styles.sectionTitle}>Cost of Goods Sold</h2>
            <div className={styles.cogsGrid}>
              <div className={styles.cogsCard}>
                <div className={styles.cogsCardTitle}>{cogs.inHouse.label}</div>
                <div className={styles.cogsAmount}>{cogs.inHouse.usd}</div>
                <div className={styles.cogsAmountSub}>{cogs.inHouse.zar} per enterprise unit</div>
              </div>
              <div className={styles.cogsCard}>
                <div className={styles.cogsCardTitle}>{cogs.outsourced.label}</div>
                <div className={styles.cogsAmount}>{cogs.outsourced.usd}</div>
                <div className={styles.cogsAmountSub}>{cogs.outsourced.zar} per enterprise unit</div>
              </div>
            </div>
            <div className={styles.cogsSavings}>
              <div className={styles.cogsSavingsValue}>{cogs.savings} cost savings</div>
              <div className={styles.cogsSavingsNote}>{cogs.savingsNote}</div>
            </div>
          </section>

          {/* Margins */}
          <section className={styles.marginsSection}>
            <h2 className={styles.sectionTitle}>Target Margins</h2>
            <div className={styles.marginsGrid}>
              <div className={styles.marginCard}>
                <div className={styles.marginTitle}>Gross Margin</div>
                <div className={styles.marginValue}>{margins.gross.value}%</div>
                <div className={styles.marginNote}>{margins.gross.note}</div>
                <div className={styles.marginBar}>
                  <div
                    className={styles.marginBarFill}
                    style={{ width: `${margins.gross.value}%` }}
                  />
                </div>
              </div>
              <div className={styles.marginCard}>
                <div className={styles.marginTitle}>EBITDA Margin</div>
                <div className={styles.marginValue}>{margins.ebitda.value}%</div>
                <div className={styles.marginNote}>{margins.ebitda.note}</div>
                <div className={styles.marginBar}>
                  <div
                    className={styles.marginBarFill}
                    style={{ width: `${margins.ebitda.value}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Revenue Projections */}
          <section className={styles.revenueSection}>
            <h2 className={styles.sectionTitle}>Revenue Projections (ZAR)</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.revenueTable}>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Revenue</th>
                    <th>Systems</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueProjections.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td className={styles.revenueAmount}>{row.amount}</td>
                      <td className={styles.revenueSystems}>{row.systems}</td>
                      <td className={styles.revenueNote}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Funding Rounds */}
          <section className={styles.fundingSection}>
            <h2 className={styles.sectionTitle}>Funding Roadmap</h2>
            <div className={styles.fundingGrid}>
              {/* Seed */}
              <div className={styles.fundingCard}>
                <div className={styles.fundingStage}>{funding.seed.stage}</div>
                <div className={styles.fundingAmount}>{funding.seed.amount}</div>
                <div className={styles.fundingDetail}>Runway: {funding.seed.runway}</div>
                {/* Allocation bar */}
                <div className={styles.allocationBar}>
                  <div
                    className={styles.allocationSegment}
                    style={{
                      width: `${funding.seed.allocation.hardware}%`,
                      background: "rgb(var(--primary))",
                    }}
                  />
                  <div
                    className={styles.allocationSegment}
                    style={{
                      width: `${funding.seed.allocation.market}%`,
                      background: "rgb(var(--accent))",
                    }}
                  />
                  <div
                    className={styles.allocationSegment}
                    style={{
                      width: `${funding.seed.allocation.team}%`,
                      background: "rgb(var(--secondary))",
                    }}
                  />
                </div>
                <div className={styles.allocationLegend}>
                  <span className={styles.allocationLegendItem}>
                    <span className={styles.allocationDot} style={{ background: "rgb(var(--primary))" }} />
                    Hardware 30%
                  </span>
                  <span className={styles.allocationLegendItem}>
                    <span className={styles.allocationDot} style={{ background: "rgb(var(--accent))" }} />
                    Market 40%
                  </span>
                  <span className={styles.allocationLegendItem}>
                    <span className={styles.allocationDot} style={{ background: "rgb(var(--secondary))" }} />
                    Team 30%
                  </span>
                </div>
                <ul className={styles.fundingMilestones}>
                  {funding.seed.milestones.map((m) => (
                    <li key={m} className={styles.fundingMilestone}>{m}</li>
                  ))}
                </ul>
              </div>

              {/* Series A */}
              <div className={styles.fundingCard}>
                <div className={styles.fundingStage}>{funding.seriesA.stage}</div>
                <div className={styles.fundingAmount}>{funding.seriesA.amount}</div>
                <div className={styles.fundingDetail}>Timeline: {funding.seriesA.timeline}</div>
                <ul className={styles.fundingMilestones}>
                  {funding.seriesA.milestones.map((m) => (
                    <li key={m} className={styles.fundingMilestone}>{m}</li>
                  ))}
                </ul>
              </div>

              {/* Exit */}
              <div className={styles.fundingCard}>
                <div className={styles.fundingStage}>{funding.exit.stage}</div>
                <div className={styles.fundingAmount}>{funding.exit.amount}</div>
                <div className={styles.fundingDetail}>Timeline: {funding.exit.timeline}</div>
                <ul className={styles.fundingMilestones}>
                  {funding.exit.milestones.map((m) => (
                    <li key={m} className={styles.fundingMilestone}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <div className={styles.disclaimer}>
            All financial projections are forward-looking estimates based on
            current market analysis and are subject to change. Revenue and
            margin targets assume successful execution of the five-phase
            development roadmap. Currency conversions use a reference rate of
            R18/USD. This is not investment advice.
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
