"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import styles from "./InteractiveElementsSection.module.css";
import { AdaptationCard } from "./components/AdaptationCard";
import { adaptationCardsData } from "./data/adaptationData";
import {
  calculateROI,
  type ROIInputs,
  type SensitivityLevel,
} from "./utils/roiCalculator";

export const InteractiveElementsSection: React.FC = () => {
  const [roiInputs, setRoiInputs] = useState<ROIInputs>({
    threatFrequency: 5, // threats per month
    averageResponseTime: 3000, // milliseconds
    deploymentCost: 250000, // USD
    personnelCost: 150000, // USD per year
  });

  const [sensitivity, setSensitivity] =
    useState<SensitivityLevel>("conservative");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const roi = calculateROI(roiInputs, sensitivity);

  return (
    <section className={styles.section}>
      {/* Background pattern */}
      <div className={styles.backgroundPattern} />

      <div className={styles.container}>
        <div className={styles.innerContainer}>
          {/* Section Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>Projected ROI Analysis</h2>
            <p className={styles.subtitle}>
              Explore the potential return on investment for Phoenix
              Rooivalk&apos;s target 120ms response time based on current market
              analysis and projected performance.
            </p>
          </div>

          {/* ROI Calculator */}
          <div className={styles.calculatorCard}>
            {/* Hypothetical Disclaimer */}
            <div className={styles.disclaimer}>
              <p className={styles.disclaimerText}>
                ⚠️ HYPOTHETICAL ANALYSIS: All inputs/outputs are assumptions for
                illustrative purposes only. No real-world performance data
                available.
              </p>
            </div>
            <div className={styles.grid}>
              {/* Input Controls */}
              <div className={styles.inputSection}>
                {/* Sensitivity Toggle */}
                <div>
                  <fieldset>
                    <legend className={styles.legend}>
                      Analysis Sensitivity (Default: Conservative)
                    </legend>
                    <div className={styles.buttonGroup}>
                      {(["conservative", "median", "aggressive"] as const).map(
                        (option) => (
                          <button
                            key={option}
                            onClick={() => setSensitivity(option)}
                            className={`btn ${
                              sensitivity === option
                                ? "btn--primary"
                                : "btn--secondary"
                            } text-sm capitalize`}
                            aria-pressed={sensitivity === option}
                          >
                            {option}
                          </button>
                        ),
                      )}
                    </div>
                  </fieldset>
                  <p className={styles.helperText}>
                    Conservative uses lower success rates and incident costs for
                    realistic projections.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="roi-threat-frequency"
                    className={styles.label}
                  >
                    Threat Frequency (per month)
                  </label>
                  <input
                    id="roi-threat-frequency"
                    type="range"
                    min="1"
                    max="20"
                    value={roiInputs.threatFrequency}
                    onChange={(e) =>
                      setRoiInputs((prev) => ({
                        ...prev,
                        threatFrequency: parseInt(e.target.value),
                      }))
                    }
                    className={styles.rangeInput}
                  />
                  <div className={styles.rangeLabels}>
                    <span className="flex-shrink-0">1</span>
                    <span className={styles.rangeValue}>
                      {roiInputs.threatFrequency} threats/month
                    </span>
                    <span className="flex-shrink-0">20</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="roi-response-time" className={styles.label}>
                    Current Response Time (ms)
                  </label>
                  <input
                    id="roi-response-time"
                    type="range"
                    min="1000"
                    max="10000"
                    step="500"
                    value={roiInputs.averageResponseTime}
                    onChange={(e) =>
                      setRoiInputs((prev) => ({
                        ...prev,
                        averageResponseTime: parseInt(e.target.value),
                      }))
                    }
                    className={styles.rangeInput}
                  />
                  <div className={styles.rangeLabels}>
                    <span className="flex-shrink-0">1s</span>
                    <span className={styles.rangeValue}>
                      {roiInputs.averageResponseTime}ms
                    </span>
                    <span className="flex-shrink-0">10s</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="roi-deployment-cost" className={styles.label}>
                    Deployment Cost (USD)
                  </label>
                  <input
                    id="roi-deployment-cost"
                    type="range"
                    min="100000"
                    max="1000000"
                    step="50000"
                    value={roiInputs.deploymentCost}
                    onChange={(e) =>
                      setRoiInputs((prev) => ({
                        ...prev,
                        deploymentCost: parseInt(e.target.value),
                      }))
                    }
                    className={styles.rangeInput}
                  />
                  <div className={styles.rangeLabels}>
                    <span className="flex-shrink-0">$100K</span>
                    <span className={styles.rangeValue}>
                      $
                      {isClient
                        ? roiInputs.deploymentCost.toLocaleString()
                        : roiInputs.deploymentCost.toString()}
                    </span>
                    <span className="flex-shrink-0">$1M</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className={styles.inputSection}>
                <div className={styles.resultCard}>
                  <h4 className={styles.resultCardTitle}>
                    Phoenix Rooivalk Results
                  </h4>
                  <div className={styles.resultRows}>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Success Rate:</span>
                      <span className={styles.resultValueSuccess}>
                        {(roi.phoenix.successRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>
                        Threats Prevented/Year:
                      </span>
                      <span className={styles.resultValueWhite}>
                        {roi.phoenix.prevented.toFixed(1)}
                      </span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>
                        Annual Savings:
                      </span>
                      <span className={styles.resultValueSuccess}>
                        {isClient
                          ? `$${Math.round(roi.phoenix.savings).toLocaleString()}`
                          : `$${Math.round(roi.phoenix.savings).toString()}`}
                      </span>
                    </div>
                    <div
                      className={`${styles.resultRow} ${styles.resultRowDivider}`}
                    >
                      <span className={styles.resultLabel}>ROI:</span>
                      <span className={styles.resultValueAccent}>
                        {roi.phoenix.roi.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.resultCardSecondary}>
                  <h4 className={styles.resultCardTitleSecondary}>
                    Traditional Systems
                  </h4>
                  <div className={styles.resultRows}>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Success Rate:</span>
                      <span className={styles.resultValueWarning}>
                        {(roi.traditional.successRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>
                        Threats Prevented/Year:
                      </span>
                      <span className={styles.resultValueWhite}>
                        {roi.traditional.prevented.toFixed(1)}
                      </span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>
                        Annual Savings:
                      </span>
                      <span className={styles.resultValueWarning}>
                        {isClient
                          ? `$${Math.round(roi.traditional.savings).toLocaleString()}`
                          : `$${Math.round(roi.traditional.savings).toString()}`}
                      </span>
                    </div>
                    <div
                      className={`${styles.resultRow} ${styles.resultRowDivider}`}
                    >
                      <span className={styles.resultLabel}>ROI:</span>
                      <span className={styles.resultValueGray}>
                        {roi.traditional.roi.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Demo CTA */}
          <div className={styles.demoSection}>
            <div className={styles.demoHeader}>
              <h3 className={styles.demoTitle}>Experience the System</h3>
              <p className={styles.demoSubtitle}>
                Try our interactive defense simulator to see Phoenix Rooivalk
                technology in action. Experience real-time threat detection,
                autonomous response, and tactical coordination.
              </p>
            </div>

            <div className={styles.demoCtaContainer}>
              <div className={styles.demoCta}>
                <div className={styles.demoCtaContent}>
                  <div className={styles.demoCtaIcon}>🎮</div>
                  <h4 className={styles.demoCtaTitle}>
                    Interactive Simulator Demo
                  </h4>
                  <p className={styles.demoCtaDescription}>
                    Launch the full-featured threat simulator built with Rust
                    and WebAssembly. Control weapons, deploy drones, and
                    neutralize aerial threats in real-time.
                  </p>
                  <ul className={styles.demoFeatureList}>
                    <li>✓ Real-time threat detection and tracking</li>
                    <li>✓ Multiple weapon systems and deployments</li>
                    <li>✓ Advanced radar visualization</li>
                    <li>✓ Energy management and synergy systems</li>
                  </ul>
                </div>
                <div className={styles.demoButtonWrapper}>
                  <Button href="/interactive-demo" variant="primary" size="lg">
                    🚀 Launch Interactive Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Metrics */}
          <div className={styles.performanceSection}>
            <div className={styles.performanceCard}>
              <h3 className={styles.performanceTitle}>
                Performance Comparison
              </h3>

              <div className={styles.performanceGrid}>
                <div className={styles.performanceItem}>
                  <div
                    className={`${styles.performanceValue} ${styles.performanceValueDanger}`}
                  >
                    3-10s
                  </div>
                  <div className={styles.performanceLabel}>
                    Traditional Systems
                  </div>
                  <div
                    className={`${styles.performanceBar} ${styles.performanceBarDanger}`}
                  >
                    <div
                      className={`${styles.performanceFill} ${styles.performanceFillDanger}`}
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                  <div className={styles.performanceNote}>
                    Network dependent
                  </div>
                </div>

                <div className={styles.performanceItem}>
                  <div
                    className={`${styles.performanceValue} ${styles.performanceValuePrimary}`}
                  >
                    1-3s
                  </div>
                  <div className={styles.performanceLabel}>Current Best</div>
                  <div
                    className={`${styles.performanceBar} ${styles.performanceBarPrimary}`}
                  >
                    <div
                      className={`${styles.performanceFill} ${styles.performanceFillPrimary}`}
                      style={{ width: "30%" }}
                    ></div>
                  </div>
                  <div className={styles.performanceNote}>
                    With network dependency
                  </div>
                </div>

                <div className={styles.performanceItem}>
                  <div
                    className={`${styles.performanceValue} ${styles.performanceValueSuccess}`}
                  >
                    120ms
                  </div>
                  <div className={styles.performanceLabel}>
                    Phoenix Rooivalk
                  </div>
                  <div
                    className={`${styles.performanceBar} ${styles.performanceBarSuccess}`}
                  >
                    <div
                      className={`${styles.performanceFill} ${styles.performanceFillSuccess}`}
                      style={{ width: "4%" }}
                    ></div>
                  </div>
                  <div className={styles.performanceNote}>
                    Autonomous edge processing
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Concept Adaptation Calculator */}
          <div className={styles.adaptationSection}>
            <h3 className={styles.adaptationTitle}>
              Concept Adaptation Explorer
            </h3>
            <p className={styles.adaptationSubtitle}>
              Explore how Phoenix Rooivalk&apos;s core technology could adapt to
              different operational environments and threat scenarios.
            </p>

            <div className={styles.adaptationGrid}>
              {adaptationCardsData.map((card, index) => (
                <AdaptationCard key={index} {...card} />
              ))}
            </div>

            <div className={styles.adaptationWarning}>
              <p className={styles.adaptationWarningText}>
                💡 These are potential applications under exploration. Actual
                deployment would require regulatory approval, market validation,
                and technology adaptation for specific use cases.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className={styles.ctaSection}>
            <h3 className={styles.ctaTitle}>Interested in the Technology?</h3>
            <p className={styles.ctaSubtitle}>
              Learn more about Phoenix Rooivalk&apos;s innovative approach to
              autonomous counter-drone defense and explore partnership
              opportunities.
            </p>
            <div className={styles.ctaButtons}>
              <Button href="/contact" size="lg" variant="primary">
                Join Development Program
              </Button>
              <Button href="/technical" variant="secondary" size="lg">
                View Technical Concept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
