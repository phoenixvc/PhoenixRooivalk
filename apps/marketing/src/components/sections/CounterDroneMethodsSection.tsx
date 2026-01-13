"use client";
import * as React from "react";
import { RevealSection } from "../RevealSection";
import { Card } from "../ui/Card";
import styles from "./CounterDroneMethodsSection.module.css";

export const CounterDroneMethodsSection: React.FC = () => {
  const methods = [
    {
      icon: "📡",
      title: "RF Jamming",
      description: "Disrupts drone communication and control signals",
      metrics: [
        { value: "85%", label: "Effectiveness" },
        { value: "50-200ms", label: "Response" },
        { value: "1-5km", label: "Range" },
      ],
    },
    {
      icon: "🎯",
      title: "GPS Spoofing",
      description: "Misleads drone navigation with false positioning",
      metrics: [
        { value: "70%", label: "Effectiveness" },
        { value: "100-500ms", label: "Response" },
        { value: "500m-2km", label: "Range" },
      ],
    },
    {
      icon: "⚡",
      title: "Electronic Warfare",
      description: "Targets drone electronics with electromagnetic attacks",
      metrics: [
        { value: "95%", label: "Effectiveness" },
        { value: "20-100ms", label: "Response" },
        { value: "2-10km", label: "Range" },
      ],
    },
    {
      icon: "🔍",
      title: "Kinetic Intercept",
      description: "Physical neutralization using nets or projectiles",
      metrics: [
        { value: "90%", label: "Effectiveness" },
        { value: "200-1000ms", label: "Response" },
        { value: "100m-2km", label: "Range" },
      ],
    },
    {
      icon: "🌐",
      title: "Cyber Takeover",
      description: "Hacks into drone systems to gain remote control",
      metrics: [
        { value: "60%", label: "Effectiveness" },
        { value: "1-5s", label: "Response" },
        { value: "Unlimited", label: "Range" },
      ],
    },
    {
      icon: "🛡️",
      title: "Directed Energy",
      description: "Disables drones with high-energy laser or microwave",
      metrics: [
        { value: "80%", label: "Effectiveness" },
        { value: "100-300ms", label: "Response" },
        { value: "500m-3km", label: "Range" },
      ],
    },
  ];

  return (
    <RevealSection>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.innerContainer}>
            <div className={styles.header}>
              <h2 className={styles.title}>Counter-Drone Defense Methods</h2>
              <p className={styles.subtitle}>
                Phoenix Rooivalk integrates multiple defense strategies for
                comprehensive drone threat protection.
              </p>
            </div>

            <div className={styles.grid}>
              {methods.map((method, index) => (
                <Card key={index} centered {...method} />
              ))}
            </div>

            <div className={styles.integrationSection}>
              <Card
                title="Integrated Defense Strategy"
                description="Automatically selects the optimal defense method based on threat type and conditions."
                metrics={[
                  { value: "95%", label: "Combined Effectiveness" },
                  { value: "<200ms", label: "Avg Response" },
                  { value: "6", label: "Methods" },
                ]}
                centered
              />
            </div>
          </div>
        </div>
      </section>
    </RevealSection>
  );
};
