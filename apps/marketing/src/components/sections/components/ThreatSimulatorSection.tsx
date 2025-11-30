import * as React from "react";
import Image from "next/image";
import { Button } from "../../ui/button";
import styles from "./ThreatSimulatorSection.module.css";

export const ThreatSimulatorSection: React.FC = () => {
  return (
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
            <h4 className={styles.demoCtaTitle}>Interactive Simulator Demo</h4>
            <p className={styles.demoCtaDescription}>
              Launch the full-featured threat simulator built with Rust and
              WebAssembly. Control weapons, deploy drones, and neutralize aerial
              threats in real-time.
            </p>
            <ul className={styles.demoFeatureList}>
              <li>✓ Real-time threat detection and tracking</li>
              <li>✓ Multiple weapon systems and deployments</li>
              <li>✓ Advanced radar visualization</li>
              <li>✓ Energy management and synergy systems</li>
            </ul>
          </div>
          <div className={styles.demoScreenshots}>
            <Image
              src="/assets/simulator-1.png"
              alt="Threat Simulator Screenshot 1"
              width={400}
              height={300}
              className={styles.screenshot}
            />
            <Image
              src="/assets/simulator-2.png"
              alt="Threat Simulator Screenshot 2"
              width={400}
              height={300}
              className={styles.screenshot}
            />
            <Image
              src="/assets/simulator-3.png"
              alt="Threat Simulator Screenshot 3"
              width={400}
              height={300}
              className={styles.screenshot}
            />
          </div>
          <div className={styles.demoButtonWrapper}>
            <Button href="/interactive-demo" variant="primary" size="lg">
              🚀 Launch Interactive Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
