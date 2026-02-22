"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { InteractiveMesh } from "../../components/ui/InteractiveMesh";
import { usePerformanceOptimizations } from "../../hooks/usePerformanceOptimizations";
import styles from "./sbir.module.css";

export default function SBIRPage(): React.ReactElement {
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

      {/* Main Content */}
      <div className={styles.contentWrapper}>
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.container}>
              {/* Section Header */}
              <div className={styles.headerSection}>
                <h1 className={styles.title}>SBIR Program</h1>
                <p className={styles.subtitle}>
                  Phoenix Rooivalk is actively pursuing Air Force SBIR Phase I
                  funding and seeking partnerships with defense contractors for
                  market entry.
                </p>
              </div>

              {/* SBIR Program Details */}
              <div className={styles.programGrid}>
                {/* Program Overview */}
                <div className={styles.programColumn}>
                  <div className={styles.programCard}>
                    <h3 className={styles.programTitle}>
                      Air Force SBIR Phase I
                    </h3>
                    <div className={styles.programDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>
                          Funding Amount:
                        </span>
                        <span
                          className={`${styles.detailValue} ${styles.detailValueSuccess}`}
                        >
                          $350,000
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Duration:</span>
                        <span
                          className={`${styles.detailValue} ${styles.detailValuePrimary}`}
                        >
                          6 months
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Status:</span>
                        <span
                          className={`${styles.detailValue} ${styles.detailValueWarning}`}
                        >
                          In Progress
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.programCard}>
                    <h3 className={styles.programTitle}>Program Objectives</h3>
                    <ul className={styles.objectivesList}>
                      <li className={styles.objectiveItem}>
                        <span className={styles.objectiveCheck}>✓</span>
                        <span className={styles.objectiveText}>
                          Technical validation of SAE Level 4 autonomy concept
                        </span>
                      </li>
                      <li className={styles.objectiveItem}>
                        <span className={styles.objectiveCheck}>✓</span>
                        <span className={styles.objectiveText}>
                          Demonstration of sub-200ms response times
                        </span>
                      </li>
                      <li className={styles.objectiveItem}>
                        <span className={styles.objectiveCheck}>✓</span>
                        <span className={styles.objectiveText}>
                          RF-denied environment testing
                        </span>
                      </li>
                      <li className={styles.objectiveItem}>
                        <span className={styles.objectiveCheck}>✓</span>
                        <span className={styles.objectiveText}>
                          Swarm defense capability validation
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Partnership Opportunities */}
                <div className={styles.programColumn}>
                  <div className={styles.programCard}>
                    <h3 className={styles.programTitle}>
                      Partnership Opportunities
                    </h3>
                    <div className={styles.programDetails}>
                      <div className={styles.partnershipBox}>
                        <h4 className={styles.partnershipBoxTitle}>
                          Defense Contractors
                        </h4>
                        <p className={styles.partnershipBoxDescription}>
                          Integration with existing defense systems and
                          platforms
                        </p>
                      </div>
                      <div className={styles.partnershipBox}>
                        <h4 className={styles.partnershipBoxTitle}>
                          Technology Partners
                        </h4>
                        <p className={styles.partnershipBoxDescription}>
                          Sensor fusion, AI/ML, and blockchain integration
                        </p>
                      </div>
                      <div className={styles.partnershipBox}>
                        <h4 className={styles.partnershipBoxTitle}>
                          Academic Institutions
                        </h4>
                        <p className={styles.partnershipBoxDescription}>
                          Research collaboration and technology validation
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.programCard}>
                    <h3 className={styles.programTitle}>
                      Government Contracting
                    </h3>
                    <div className={styles.programDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>
                          CMMC Level 2:
                        </span>
                        <span
                          className={`${styles.detailValue} ${styles.detailValueWarning}`}
                        >
                          Planned
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>
                          ITAR Compliance:
                        </span>
                        <span
                          className={`${styles.detailValue} ${styles.detailValueWarning}`}
                        >
                          Planned
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>
                          Security Clearance:
                        </span>
                        <span
                          className={`${styles.detailValue} ${styles.detailValueWarning}`}
                        >
                          Planned
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className={styles.contactSection}>
                <h3 className={styles.contactTitle}>
                  Interested in SBIR Collaboration?
                </h3>
                <p className={styles.contactDescription}>
                  Contact us to learn more about our SBIR program participation
                  and explore collaboration opportunities for government
                  contracting and defense partnerships.
                </p>
                <div className={styles.contactButtons}>
                  <a
                    href="mailto:sbir@phoenixrooivalk.com"
                    className="btn btn--primary"
                  >
                    SBIR Collaboration
                  </a>
                  <a
                    href="mailto:government@phoenixrooivalk.com"
                    className="btn btn--secondary"
                  >
                    Government Contracting
                  </a>
                </div>
              </div>

              {/* Disclaimer */}
              <div className={styles.disclaimer}>
                <p className={styles.disclaimerText}>
                  💡 SBIR program participation is subject to proposal
                  acceptance and funding approval. All timelines and funding
                  amounts are estimates and subject to change.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
