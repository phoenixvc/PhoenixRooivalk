"use client";
import React, { useMemo, useState } from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { ROICalculatorInputs } from "./components/ROICalculatorInputs";
import { ROIResults } from "./components/ROIResults";
import { ROICallToAction } from "./components/ROICallToAction";
import styles from "./financial.module.css";

/** ROI calculator and financial analysis page. */
export function FinancialPage(): React.ReactElement {
  const [inputs, setInputs] = useState({
    threatFrequency: 5,
    averageResponseTime: 3000,
    deploymentCost: 150000, // AeroNet Enterprise setup ($150K, products.ts AN-ENT-001); adjust slider for your tier
    personnelCost: 150000,
    downtimeCost: 500000,
  });

  const roi = useMemo(() => {
    const {
      threatFrequency,
      averageResponseTime,
      deploymentCost,
      personnelCost,
      downtimeCost,
    } = inputs;

    // Calculate annual threat events
    const annualThreats = threatFrequency * 12;

    // Calculate success rates based on response time
    const phoenixSuccessRate = averageResponseTime <= 120 ? 0.95 : 0.85;
    const traditionalSuccessRate = averageResponseTime <= 3000 ? 0.65 : 0.45;

    // Calculate prevented incidents
    const phoenixPrevented = annualThreats * phoenixSuccessRate;
    const traditionalPrevented = annualThreats * traditionalSuccessRate;

    // Calculate savings
    const phoenixSavings = phoenixPrevented * downtimeCost;
    const traditionalSavings = traditionalPrevented * downtimeCost;

    // Calculate ROI
    const phoenixROI =
      ((phoenixSavings - deploymentCost - personnelCost) /
        (deploymentCost + personnelCost)) *
      100;
    const traditionalROI =
      ((traditionalSavings - deploymentCost * 2 - personnelCost) /
        (deploymentCost * 2 + personnelCost)) *
      100;

    return {
      phoenix: {
        prevented: phoenixPrevented,
        savings: phoenixSavings,
        roi: phoenixROI,
        successRate: phoenixSuccessRate,
        paybackPeriod:
          phoenixSavings > 0
            ? (deploymentCost + personnelCost) / phoenixSavings
            : Infinity,
      },
      traditional: {
        prevented: traditionalPrevented,
        savings: traditionalSavings,
        roi: traditionalROI,
        successRate: traditionalSuccessRate,
        paybackPeriod:
          traditionalSavings > 0
            ? (deploymentCost * 2 + personnelCost) / traditionalSavings
            : Infinity,
      },
    };
  }, [inputs]);

  return (
    <main className={styles.main}>
      <Navigation />

      <div className={styles.contentWrapper}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.headerSection}>
            <h1 className={styles.title}>
              ROI Calculator & Financial Analysis
            </h1>
            <p className={styles.subtitle}>
              Calculate the return on investment for Phoenix Rooivalk&apos;s
              autonomous counter-drone defense system. Compare costs, savings,
              and performance against traditional solutions.
            </p>
          </div>

          {/* Calculator */}
          <div className={styles.calculatorGrid}>
            {/* Input Controls */}
            <ROICalculatorInputs inputs={inputs} setInputs={setInputs} />

            {/* Results */}
            <ROIResults phoenix={roi.phoenix} traditional={roi.traditional} />
          </div>

          {/* CTA Section */}
          <ROICallToAction />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}

export default FinancialPage;
