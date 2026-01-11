import Link from "next/link";
import * as React from "react";
import styles from "./Footer.module.css";

export const Footer: React.FC = () => {
  const footerSections = [
    {
      title: "Products",
      links: [
        { href: "/products", label: "All Products" },
        { href: "/preorder", label: "Preorder" },
        { href: "/timeline", label: "Development Timeline" },
        { href: "/roi-calculator", label: "ROI Calculator" },
      ],
    },
    {
      title: "Technology",
      links: [
        { href: "/technical", label: "Technical Specs" },
        { href: "/capabilities", label: "Capabilities" },
        { href: "/methods", label: "Defense Methods" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/contact", label: "Contact Us" },
        { href: "/partnerships", label: "Partnerships" },
        { href: "/about", label: "About Us" },
      ],
    },
  ];

  return (
    <footer className={styles.footer}>
      {/* Background pattern */}
      <div className={styles.backgroundPattern}>
        <div className={styles.patternGrid}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          {/* Main Footer Content */}
          <div className={styles.grid}>
            {/* Company Info */}
            <div className={styles.companyInfo}>
              <h3 className={styles.companyTitle}>Phoenix Rooivalk</h3>
              <p className={styles.companyDescription}>
                Advanced counter-UAS defense systems for military and civilian
                protection.
              </p>
              <p className={styles.companySubtext}>
                Nexamesh Technologies (Delaware C-Corp in progress)
              </p>
              <div className={styles.iconRow}>
                <div className={styles.iconBox}>
                  <span className={styles.icon}>🛡️</span>
                </div>
                <div className={styles.iconBox}>
                  <span className={styles.icon}>🚁</span>
                </div>
                <div className={styles.iconBox}>
                  <span className={styles.icon}>📡</span>
                </div>
              </div>
            </div>

            {/* Footer Sections */}
            {footerSections.map((section) => (
              <div key={section.title} className={styles.section}>
                <h4 className={styles.sectionTitle}>{section.title}</h4>
                <ul className={styles.linkList}>
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={styles.link}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className={styles.bottom}>
            <div className={styles.bottomContent}>
              <div className={styles.copyright}>
                <p className={styles.copyrightText}>
                  © 2025 Phoenix Rooivalk. All rights reserved.
                </p>
                <p className={styles.copyrightSubtext}>
                  ITAR Compliance Planned • ISO 27001 Certification Planned •
                  Classified Operations Planned Ready
                </p>
              </div>

              <div className={styles.status}>
                <div className={styles.statusIndicator}>
                  <div className={styles.statusDot}></div>
                  <span className={styles.statusText}>System Online</span>
                </div>
                <div className={styles.version}>v2.1.0-alpha</div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className={styles.disclaimer}>
              <p className={styles.disclaimerText}>
                <strong className={styles.disclaimerStrong}>Disclaimer:</strong>{" "}
                Phoenix Rooivalk is an R&D concept in planning. No
                certifications, pilots, or endorsements are claimed. All
                simulations and metrics are illustrative and subject to change.
                This platform demonstrates potential capabilities for
                educational and planning purposes only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
