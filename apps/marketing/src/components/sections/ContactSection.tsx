"use client";

import React from "react";
import { Button } from "../ui/button";
import styles from "./ContactSection.module.css";

export const ContactSection: React.FC = () => {
  return (
    <section className={styles.section} id="contact">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Ready to Order?</h2>
          <p className={styles.subtitle}>
            Preorder now with no deposit required. Questions? We&apos;re here to
            help.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Preorder & Sales</h3>
            <p className={styles.cardDescription}>
              Training facilities, event organizers, and security teams —
              preorder your system today. No deposit, delivery Q3 2026.
            </p>
            <div className={styles.buttonGroup}>
              <Button
                href="/preorder"
                size="lg"
                className={styles.fullWidthButton}
                trackingEvent="Preorder Clicked"
                trackingProps={{ location: "contact-section", type: "primary" }}
                aria-label="Go to preorder page"
              >
                Preorder Now
              </Button>
              <Button
                href="mailto:sales@phoenixrooivalk.com"
                variant="ghost"
                size="lg"
                className={styles.fullWidthButton}
                trackingEvent="Sales Inquiry"
                trackingProps={{ location: "contact-section", type: "email" }}
                aria-label="Email sales team"
              >
                Contact Sales
              </Button>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Support & Questions</h3>
            <p className={styles.cardDescription}>
              Have questions about product specs, compatibility, or deployment?
              Our team is ready to help you find the right solution.
            </p>
            <div className={styles.buttonGroup}>
              <Button
                href="/products"
                size="lg"
                className={styles.fullWidthButton}
                trackingEvent="Products Viewed"
                trackingProps={{ location: "contact-section", type: "link" }}
                aria-label="View all products"
              >
                View Products
              </Button>
              <Button
                href="mailto:support@phoenixrooivalk.com"
                variant="ghost"
                size="lg"
                className={styles.fullWidthButton}
                trackingEvent="Support Inquiry"
                trackingProps={{ location: "contact-section", type: "email" }}
                aria-label="Email support team"
              >
                Get Support
              </Button>
            </div>
          </div>
        </div>

        {/* Secondary: Partners/Investors - demoted below buyer content */}
        <div className={styles.secondarySection}>
          <p className={styles.secondaryText}>
            Looking for partnership or investment opportunities?{" "}
            <a href="/contact" className={styles.secondaryLink}>
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
