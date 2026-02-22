"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { InteractiveElementsSection } from "../../components/sections/InteractiveElementsSection";
import { InteractiveMesh } from "../../components/ui/InteractiveMesh";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";
import { getProductById } from "../../data/products";
import { formatCurrency } from "@/utils/formatter";
import {
  calculateROI,
  type ROIInputs,
  type SensitivityLevel,
} from "../../components/sections/utils/roiCalculator";
import styles from "./roi-calculator.module.css";

// ---------------------------------------------------------------------------
// Deployment package tiers built from real product catalog pricing
// ---------------------------------------------------------------------------

interface DeploymentTier {
  id: string;
  tier: string;
  audience: string;
  products: Array<{
    id: string;
    role: string;
  }>;
  setupNote?: string;
  monthlyNote?: string;
}

const DEPLOYMENT_TIERS: DeploymentTier[] = [
  {
    id: "basic-home",
    tier: "Basic Home",
    audience: "Homeowners & hobbyists",
    products: [
      { id: "skywatch-nano", role: "Detection" },
      { id: "skysnare", role: "Countermeasure" },
    ],
  },
  {
    id: "property-defense",
    tier: "Property Defense",
    audience: "Farms, estates & small businesses",
    products: [
      { id: "skywatch-pro", role: "Detection" },
      { id: "netsnare-pro", role: "Countermeasure" },
    ],
  },
  {
    id: "enterprise",
    tier: "Enterprise Platform",
    audience: "Critical infrastructure & airports",
    products: [
      { id: "aeronet-enterprise", role: "Detection & Response Platform" },
      { id: "aeronet-command", role: "Command & Control Software" },
    ],
    setupNote: "Setup pricing shown. Monthly subscription applies.",
    monthlyNote: "Subscription",
  },
];

// ---------------------------------------------------------------------------
// Payback period helper — derives months from ROI calculation result
// ---------------------------------------------------------------------------

function derivePaybackMonths(
  roi: ReturnType<typeof calculateROI>,
  inputs: ROIInputs,
): number | null {
  const totalCost = inputs.deploymentCost + inputs.personnelCost;
  if (roi.phoenix.savings <= 0 || totalCost <= 0) return null;
  const monthlySavings = roi.phoenix.savings / 12;
  return Math.ceil(totalCost / monthlySavings);
}

function formatPayback(months: number | null): string {
  if (months === null) return "N/A";
  if (months <= 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years}y ${rem}mo`;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ROICalculatorPage(): React.ReactElement {
  usePerformanceOptimizations();

  // Mirror the same default inputs as InteractiveElementsSection so the
  // payback section stays in sync with the calculator widget above it.
  const [roiInputs] = React.useState<ROIInputs>({
    threatFrequency: 5,
    averageResponseTime: 3000,
    deploymentCost: 150000, // AeroNet Enterprise setup ($150K, products.ts AN-ENT-001); adjust slider for your tier
    personnelCost: 150000,
  });

  const [sensitivity] = React.useState<SensitivityLevel>("conservative");

  const roi = calculateROI(roiInputs, sensitivity);
  const paybackMonths = derivePaybackMonths(roi, roiInputs);

  return (
    <main className={styles.main}>
      <InteractiveMesh
        gridSize={50}
        color="rgba(234, 124, 28, 0.1)"
        bendStrength={20}
        bendRadius={100}
      />

      <Navigation />

      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER                                                          */}
      {/* ------------------------------------------------------------------ */}
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div className={styles.pageHeaderBadge} aria-hidden="true">
            Counter-UAS Financial Analysis
          </div>
          <h1 className={styles.pageTitle}>ROI Calculator</h1>
          <p className={styles.pageSubtitle}>
            Evaluate the financial return of deploying Phoenix Rooivalk
            counter-UAS technology at your facility. Adjust threat frequency,
            response time, and deployment cost below to model your scenario.
          </p>
          <p className={styles.pageDisclaimer}>
            All projections are illustrative estimates based on market
            assumptions — not guarantees of actual performance or savings.
          </p>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* SAMPLE DEPLOYMENT PACKAGES                                           */}
      {/* ------------------------------------------------------------------ */}
      <section
        className={styles.packagesSection}
        aria-labelledby="packages-heading"
      >
        <div className={styles.sectionInner}>
          <h2 id="packages-heading" className={styles.sectionTitle}>
            Sample Deployment Packages
          </h2>
          <p className={styles.sectionSubtitle}>
            Real product pricing from the catalog. Each tier pairs a detection
            sensor with an active countermeasure.
          </p>

          <div className={styles.tiersGrid} role="list">
            {DEPLOYMENT_TIERS.map((tier) => {
              const resolvedProducts = tier.products.map((p) => ({
                ...p,
                product: getProductById(p.id),
              }));

              // Sum min and max across all products in the tier
              const totalMin = resolvedProducts.reduce(
                (sum, rp) => sum + (rp.product?.priceRange.min ?? 0),
                0,
              );
              const totalMax = resolvedProducts.reduce(
                (sum, rp) => sum + (rp.product?.priceRange.max ?? 0),
                0,
              );

              // Collect monthly fees (e.g. AeroNet Enterprise $25K/mo, Command $2.5K/mo)
              const totalMonthly = resolvedProducts.reduce(
                (sum, rp) => sum + (rp.product?.monthlyFee ?? 0),
                0,
              );

              const isEnterprise = tier.id === "enterprise";

              return (
                <article
                  key={tier.id}
                  className={`${styles.tierCard} ${isEnterprise ? styles.tierCardEnterprise : ""}`}
                  role="listitem"
                  aria-label={`${tier.tier} deployment package`}
                >
                  <div className={styles.tierHeader}>
                    <span
                      className={`${styles.tierBadge} ${isEnterprise ? styles.tierBadgeEnterprise : ""}`}
                    >
                      {tier.tier}
                    </span>
                    <p className={styles.tierAudience}>{tier.audience}</p>
                  </div>

                  <ul className={styles.tierProducts} aria-label="Included products">
                    {resolvedProducts.map((rp) => (
                      <li key={rp.id} className={styles.tierProductItem}>
                        <span className={styles.tierProductRole}>{rp.role}</span>
                        <span className={styles.tierProductName}>
                          {rp.product?.name ?? rp.id}
                        </span>
                        <span className={styles.tierProductPrice}>
                          {rp.product?.priceFormatted ?? "—"}
                          {rp.product?.monthlyFee != null && (
                            <span className={styles.tierProductMonthly}>
                              {" "}
                              + {formatCurrency(rp.product.monthlyFee)}/mo
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.tierTotal}>
                    <span className={styles.tierTotalLabel}>
                      {isEnterprise ? "Setup total" : "Package range"}
                    </span>
                    <span className={styles.tierTotalValue}>
                      {totalMin === totalMax
                        ? formatCurrency(totalMin)
                        : `${formatCurrency(totalMin)} – ${formatCurrency(totalMax)}`}
                    </span>
                    {totalMonthly > 0 && (
                      <span className={styles.tierTotalMonthly}>
                        + {formatCurrency(totalMonthly)}/mo subscription
                      </span>
                    )}
                  </div>

                  {tier.setupNote && (
                    <p className={styles.tierNote}>{tier.setupNote}</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ROI CALCULATOR WIDGET (existing InteractiveElementsSection)          */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.contentWrapper}>
        <InteractiveElementsSection />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PAYBACK PERIOD PROJECTIONS                                           */}
      {/* ------------------------------------------------------------------ */}
      <section
        className={styles.paybackSection}
        aria-labelledby="payback-heading"
      >
        <div className={styles.sectionInner}>
          <h2 id="payback-heading" className={styles.sectionTitle}>
            Payback Period Projections
          </h2>
          <p className={styles.sectionSubtitle}>
            Based on the calculator defaults (conservative sensitivity, 5
            threats/month, {formatCurrency(roiInputs.deploymentCost)} deployment
            cost).
          </p>

          <div className={styles.paybackGrid} role="list">
            {/* Conservative scenario */}
            {(["conservative", "median", "aggressive"] as SensitivityLevel[]).map(
              (level) => {
                const scenarioRoi = calculateROI(roiInputs, level);
                const months = derivePaybackMonths(scenarioRoi, roiInputs);
                const annualSavings = scenarioRoi.phoenix.savings;
                const levelRoi = scenarioRoi.phoenix.roi;

                const labelMap: Record<SensitivityLevel, string> = {
                  conservative: "Conservative",
                  median: "Median",
                  aggressive: "Aggressive",
                };
                const descMap: Record<SensitivityLevel, string> = {
                  conservative:
                    "Lower success rates, lower incident costs. Realistic floor.",
                  median:
                    "Mid-range assumptions reflecting typical deployments.",
                  aggressive:
                    "Higher success rates, higher incident cost avoidance.",
                };

                return (
                  <article
                    key={level}
                    className={styles.paybackCard}
                    role="listitem"
                    aria-label={`${labelMap[level]} scenario payback projection`}
                  >
                    <div className={styles.paybackCardHeader}>
                      <span
                        className={`${styles.paybackScenarioLabel} ${styles[`paybackScenario_${level}`]}`}
                      >
                        {labelMap[level]}
                      </span>
                    </div>
                    <p className={styles.paybackDesc}>{descMap[level]}</p>
                    <dl className={styles.paybackStats}>
                      <div className={styles.paybackStat}>
                        <dt className={styles.paybackStatLabel}>
                          Payback period
                        </dt>
                        <dd
                          className={`${styles.paybackStatValue} ${styles.paybackStatValueAccent}`}
                        >
                          {formatPayback(months)}
                        </dd>
                      </div>
                      <div className={styles.paybackStat}>
                        <dt className={styles.paybackStatLabel}>
                          Annual savings
                        </dt>
                        <dd className={styles.paybackStatValue}>
                          {formatCurrency(annualSavings)}
                        </dd>
                      </div>
                      <div className={styles.paybackStat}>
                        <dt className={styles.paybackStatLabel}>
                          Projected ROI
                        </dt>
                        <dd
                          className={`${styles.paybackStatValue} ${levelRoi >= 0 ? styles.paybackStatValuePositive : styles.paybackStatValueNegative}`}
                        >
                          {levelRoi.toFixed(0)}%
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              },
            )}
          </div>

          {/* Financial disclaimer */}
          <div
            className={styles.financialDisclaimer}
            role="note"
            aria-label="Financial projections disclaimer"
          >
            <p className={styles.financialDisclaimerText}>
              <strong>Disclaimer:</strong> All financial projections on this
              page are hypothetical and illustrative only. They are based on
              assumptions about threat frequency, incident costs, and system
              performance that may not reflect your specific operational
              environment. No guarantee of actual savings or return on
              investment is expressed or implied. Consult your security
              procurement team for site-specific assessment.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
