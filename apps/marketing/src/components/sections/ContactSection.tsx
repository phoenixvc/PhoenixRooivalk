"use client";

import { downloadWhitepaper } from "@phoenix-rooivalk/utils";
import React from "react";
import { Button } from "../ui/button";
import styles from "./ContactSection.module.css";

export const ContactSection: React.FC = () => {
  return (
    <section className={styles.section} id="contact">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Partner With Us</h2>
          <p className={styles.subtitle}>
            We&apos;re seeking early partners and investors to bring pneumatic
            drone interception to market. Join us in Phase 1.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Early Partner Program</h3>
            <p className={styles.cardDescription}>
              Be among the first to deploy our pneumatic net launcher
              technology. We&apos;re looking for pilot partners in drone
              racing, event security, and critical infrastructure.
            </p>
            <div className={styles.buttonGroup}>
              <Button
                href="mailto:partners@phoenixrooivalk.com"
                size="lg"
                className="w-full"
                trackingEvent="Partnership Inquiry"
                trackingProps={{ location: "contact-section", type: "email" }}
                aria-label="Email us for partnership inquiries"
              >
                Become an Early Partner
              </Button>
              <Button
                href="mailto:info@phoenixrooivalk.com"
                variant="ghost"
                size="lg"
                className="w-full"
                trackingEvent="General Inquiry"
                trackingProps={{ location: "contact-section", type: "email" }}
                aria-label="Email us for general inquiries"
              >
                General Inquiries
              </Button>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Resources & Documentation</h3>
            <p className={styles.cardDescription}>
              Learn more about our dual-brand strategy, market opportunity, and
              technical approach. Download our whitepaper or explore detailed
              specifications.
            </p>
            <div className={styles.buttonGroup}>
              <Button
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  downloadWhitepaper();
                }}
                size="lg"
                className="w-full"
                type="button"
                trackingEvent="Whitepaper Downloaded"
                trackingProps={{ location: "contact-section", type: "button" }}
                aria-label="Download technical whitepaper PDF"
              >
                Download Whitepaper
              </Button>
              <Button
                href="/technical"
                variant="ghost"
                size="lg"
                className="w-full"
                trackingEvent="Technical Specs Viewed"
                trackingProps={{ location: "contact-section", source: "cta" }}
                aria-label="View detailed technical specifications"
              >
                Technical Specifications
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.sbirSection}>
          <div className={styles.sbirCard}>
            <h3 className={styles.sbirTitle}>Investors & Government</h3>
            <p className={styles.sbirDescription}>
              We&apos;re raising our Seed round and pursuing SBIR opportunities.
              Contact us if you&apos;re interested in the counter-drone market
              or government contracting partnerships.
            </p>
            <Button href="mailto:investors@phoenixrooivalk.com" size="lg">
              Investment Inquiries
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
