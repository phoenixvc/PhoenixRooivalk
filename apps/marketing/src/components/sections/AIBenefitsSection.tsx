import React from "react";
import { RevealSection } from "../RevealSection";
import { Button } from "../ui/button";
import { Card } from "../ui/Card";
import { FeatureCard } from "../ui/FeatureCard";
import styles from "./AIBenefitsSection.module.css";

export const AIBenefitsSection: React.FC = () => {
  const performanceMetrics = [
    {
      icon: "🎯",
      title: "AI Detection",
      description: "99.7% accuracy vs 60-70% industry standard",
      metrics: [
        { value: "99.7%", label: "Accuracy" },
        { value: "+40%", label: "vs Industry" },
      ],
    },
    {
      icon: "🔐",
      title: "Data Integrity",
      description: "99.3% protection vs 85% traditional systems",
      metrics: [
        { value: "99.3%", label: "Protected" },
        { value: "+14%", label: "vs Traditional" },
      ],
    },
    {
      icon: "⚡",
      title: "Response Time",
      description: "<200ms vs 1-3s industry standard",
      metrics: [
        { value: "<200ms", label: "Response" },
        { value: "15x", label: "Faster" },
      ],
    },
    {
      icon: "🔑",
      title: "Auth Latency",
      description: "<2ms vs 50-100ms traditional",
      metrics: [
        { value: "<2ms", label: "Latency" },
        { value: "50x", label: "Faster" },
      ],
    },
  ];

  return (
    <section className={styles.section} id="ai-benefits">
      <div className={styles.container}>
        <RevealSection className={styles.header}>
          <div className={styles.badge}>AI + BLOCKCHAIN REVOLUTION</div>
          <h2 className={styles.title}>
            Revolutionary AI + Blockchain Performance
          </h2>
          <p className={styles.subtitle}>
            PhoenixRooivalk combines cutting-edge AI with military-grade
            blockchain technology to deliver unprecedented performance.
          </p>
        </RevealSection>

        <RevealSection className={styles.grid}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>AI + Blockchain Performance</h3>
            <div className={styles.metricsContainer}>
              {performanceMetrics.map((metric, index) => (
                <Card
                  key={index}
                  icon={metric.icon}
                  title={metric.title}
                  description={metric.description}
                  metrics={metric.metrics}
                />
              ))}
            </div>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>AI + Blockchain Capabilities</h3>
            <div className={styles.featuresContainer}>
              <FeatureCard
                icon="🧠"
                title="Multi-Modal AI Intelligence"
                description="Processes RF, visual, acoustic, and radar data with blockchain-verified results for comprehensive threat analysis"
              />
              <FeatureCard
                icon="🔗"
                title="Blockchain Security"
                description="99.3% data integrity protection with tamper-proof audit trails and cryptographic identity management"
              />
              <FeatureCard
                icon="🔄"
                title="Federated Learning + Blockchain"
                description="Distributed AI model training with blockchain consensus while maintaining data privacy and model provenance"
              />
              <FeatureCard
                icon="🎯"
                title="Explainable AI + Audit Trails"
                description="Transparent AI decision-making with immutable blockchain audit trails for military accountability and regulatory compliance"
              />
              <FeatureCard
                icon="⚡"
                title="Autonomous Swarm Coordination"
                description="AI-powered swarm intelligence with blockchain consensus for coordinated multi-drone operations in contested environments"
              />
            </div>
          </div>
        </RevealSection>

        <RevealSection className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <h3 className={styles.ctaTitle}>
              18-Month AI + Blockchain Advantage
            </h3>
            <p className={styles.ctaDescription}>
              While competitors race to meet the 2027 autonomous warfare
              deadline, PhoenixRooivalk&apos;s integrated AI-blockchain system
              is ready for immediate deployment, providing a decisive
              technological advantage in the critical race for autonomous
              warfare dominance.
            </p>
            <div className={styles.ctaButtons}>
              <Button href="#contact" size="lg">
                Request AI + Blockchain Demo
              </Button>
              <Button
                href="mailto:smit.jurie@gmail.com?subject=Phoenix%20Rooivalk%20-%20AI%20%2B%20Blockchain%20Capabilities%20Inquiry"
                variant="ghost"
                size="lg"
              >
                Technical Brief
              </Button>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
};
