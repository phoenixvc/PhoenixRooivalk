import * as React from "react";
import { Button } from "../ui/button";
import styles from "./HeroSection.module.css";

export const HeroSection: React.FC = () => {
  return (
    <section className={styles.section} id="hero">
      <div className={styles.container}>
        {/* Single status indicator - buyer-focused */}
        <p className={styles.statusLine}>
          Preorders open · First deliveries Q3 2026
        </p>

        {/* Clear headline - what you get */}
        <h1 className={styles.headline}>
          Capture drones safely.
          <span className={styles.headlineAccent}> No damage.</span>
        </h1>

        {/* One line - why it matters */}
        <p className={styles.description}>
          Pneumatic net launchers for training, events, and facility security.
          Legal. Non-destructive. Deployable today.
        </p>

        {/* Single primary CTA */}
        <div className={styles.ctaSection}>
          <Button
            href="/preorder"
            size="lg"
            variant="primary"
            trackingEvent="Preorder Clicked"
            trackingProps={{ location: "hero", type: "primary" }}
            aria-label="Preorder now"
          >
            Preorder Now
          </Button>
          <Button
            href="/products"
            variant="secondary"
            size="lg"
            trackingEvent="Products Clicked"
            trackingProps={{ location: "hero", type: "secondary" }}
            aria-label="See all products"
          >
            See Products
          </Button>
        </div>

        {/* Simple proof points - not a card, just text */}
        <div className={styles.proofPoints}>
          <span className={styles.proofPoint}>
            <strong>3 product lines</strong> — Training to Enterprise
          </span>
          <span className={styles.proofDivider}>·</span>
          <span className={styles.proofPoint}>
            <strong>100% safe</strong> — Non-destructive capture
          </span>
          <span className={styles.proofDivider}>·</span>
          <span className={styles.proofPoint}>
            <strong>Legal</strong> — No RF, no jamming
          </span>
        </div>
      </div>
    </section>
  );
};
