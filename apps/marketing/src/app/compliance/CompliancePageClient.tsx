"use client";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import styles from "./compliance.module.css";

export default function CompliancePage(): React.ReactElement {
  return (
    <main className={styles.main}>
      {/* Navigation */}
      <Navigation />

      {/* Header */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.headerSection}>
            <h1 className={styles.title}>Compliance & Assurance Roadmap</h1>
            <p className={styles.subtitle}>
              Planning compliance framework for defense technology development.
              All standards listed as targets, not current certifications.
            </p>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className={`${styles.section} ${styles.sectionGradient}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            Assurance Roadmap (Targets, Post-Funding)
          </h2>
          <div className={styles.grid4Cols}>
            {[
              {
                icon: "🇺🇸",
                title: "ITAR Compliance",
                description:
                  "ITAR compliance framework planning for defense technology export controls. Target standard, pre-audit.",
                status: "Planned",
                progress: "0%",
              },
              {
                icon: "🔒",
                title: "ISO 27001",
                description:
                  "ISO 27001 information security management system planning. Planned post-MVP.",
                status: "Planned",
                progress: "0%",
              },
              {
                icon: "🌍",
                title: "Export Control",
                description:
                  "EAR and dual-use technology compliance framework established. Regional restrictions mapped.",
                status: "Planned",
                progress: "0%",
              },
              {
                icon: "✅",
                title: "Regional Approvals",
                description:
                  "CE marking, FCC certification, and regional approval processes initiated. Documentation prepared.",
                status: "Planned",
                progress: "0%",
              },
              {
                icon: "🛡️",
                title: "Military Standards",
                description:
                  "MIL-STD-810G environmental testing and MIL-STD-461 electromagnetic compatibility standards compliance.",
                status: "Planned",
                progress: "0%",
              },
              {
                icon: "🔐",
                title: "FIPS 140-2",
                description:
                  "Federal Information Processing Standard for cryptographic modules. Hardware security module integration planned.",
                status: "Planned",
                progress: "0%",
              },
              {
                icon: "🌐",
                title: "GDPR Compliance",
                description:
                  "General Data Protection Regulation compliance framework for European operations and data handling.",
                status: "Planned",
                progress: "0%",
              },
              {
                icon: "⚖️",
                title: "Legal Framework",
                description:
                  "Comprehensive legal compliance framework including liability, insurance, and operational restrictions.",
                status: "Planned",
                progress: "0%",
              },
            ].map((cert) => (
              <div key={cert.title} className={styles.certCard}>
                <div className={styles.certIcon}>{cert.icon}</div>
                <h3 className={styles.certTitle}>{cert.title}</h3>
                <p className={styles.certDescription}>{cert.description}</p>

                {/* Progress Bar */}
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span>Progress</span>
                    <span>{cert.progress}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: cert.progress }}
                    ></div>
                  </div>
                </div>

                <div
                  className={`${styles.statusBadge} ${
                    cert.status === "Certified"
                      ? styles.statusCertified
                      : cert.status === "In Progress"
                        ? styles.statusInProgress
                        : styles.statusPlanned
                  }`}
                >
                  {cert.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Security & Privacy Framework</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Data Protection</h3>
              <ul className={styles.securityList}>
                <li className={styles.securityListItem}>
                  <span className={styles.securityListBullet}>•</span>
                  <div>
                    <strong>End-to-End Encryption:</strong> All communications
                    encrypted using AES-256 standards
                  </div>
                </li>
                <li className={styles.securityListItem}>
                  <span className={styles.securityListBullet}>•</span>
                  <div>
                    <strong>Zero-Knowledge Architecture:</strong> Sensitive
                    operational data never stored in plaintext
                  </div>
                </li>
                <li className={styles.securityListItem}>
                  <span className={styles.securityListBullet}>•</span>
                  <div>
                    <strong>GDPR Compliance:</strong> Full compliance for
                    European deployments and data handling
                  </div>
                </li>
                <li className={styles.securityListItem}>
                  <span className={styles.securityListBullet}>•</span>
                  <div>
                    <strong>Key Management:</strong> Secure key rotation and
                    hardware security module integration
                  </div>
                </li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Operational Security</h3>
              <ul className={styles.securityList}>
                <li className={styles.securityListItem}>
                  <span className={styles.securityListBullet}>•</span>
                  <div>
                    <strong>Mandatory Geofencing:</strong> Configurable
                    no-engage zones and operational boundaries
                  </div>
                </li>
                <li className={styles.securityListItem}>
                  <span className={styles.securityListBullet}>•</span>
                  <div>
                    <strong>Fail-Safe Protocols:</strong> Return-to-launch and
                    safe-mode activation on system failure
                  </div>
                </li>
                <li className={styles.securityListItem}>
                  <span className={styles.securityListBullet}>•</span>
                  <div>
                    <strong>Multi-Factor Authentication:</strong> Biometric and
                    token-based operator verification
                  </div>
                </li>
                <li className={styles.securityListItem}>
                  <span className={styles.securityListBullet}>•</span>
                  <div>
                    <strong>Comprehensive Audit Logging:</strong> Immutable
                    blockchain-anchored operation records
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Security */}
      <section className={`${styles.section} ${styles.sectionGradient2}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Blockchain Evidence Integrity</h2>
          <div className={styles.grid3Cols}>
            <div className={styles.card}>
              <div className={styles.featureIcon}>🔗</div>
              <h3 className={styles.featureTitle}>Multi-Chain Anchoring</h3>
              <p className={styles.featureDescription}>
                Every defensive action cryptographically anchored to Solana and
                EtherLink blockchains for tamper-proof audit trails.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.featureIcon}>📋</div>
              <h3 className={styles.featureTitle}>Immutable Logging</h3>
              <p className={styles.featureDescription}>
                All system events recorded in append-only logs with SHA-256
                integrity verification and distributed consensus.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.featureIcon}>🛡️</div>
              <h3 className={styles.featureTitle}>Fault Tolerance</h3>
              <p className={styles.featureDescription}>
                Redundant blockchain anchoring ensures evidence integrity even
                during network outages or targeted attacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Responsible Use */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Responsible Use Framework</h2>
          <div className={styles.card}>
            <div className={styles.grid}>
              <div>
                <h3 className={styles.cardTitle}>Acceptable Use</h3>
                <ul className={styles.cardList}>
                  <li>• Defensive counter-UAS applications</li>
                  <li>• Safety testing and evaluation</li>
                  <li>• Critical infrastructure protection</li>
                  <li>• Government and military operations</li>
                  <li>• Event security and crowd safety</li>
                </ul>
              </div>
              <div>
                <h3 className={styles.cardTitle}>Prohibited Use</h3>
                <ul className={styles.cardList}>
                  <li>• Unlawful surveillance or harassment</li>
                  <li>• Targeting of civilian populations</li>
                  <li>• Circumvention of export controls</li>
                  <li>• Unauthorized weapons integration</li>
                  <li>• Violation of international law</li>
                </ul>
              </div>
            </div>
            <div className={styles.noticeBox}>
              <p className={styles.noticeText}>
                <strong>Compliance Notice:</strong> All deployments must include
                mandatory geofences, fail-safe RTL protocols, do-not-engage
                zones, and comprehensive audit logging. Violations may result in
                access revocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
