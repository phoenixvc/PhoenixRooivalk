import React from "react";
import styles from "./FeatureCard.module.css";

export interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  proof?: string;
  colorVariant?: "default" | "green" | "blue" | "purple" | "yellow" | "orange";
  className?: string;
}

/**
 * FeatureCard component - A horizontal layout card with icon, title, and description
 * Used for displaying features, problems, solutions, etc.
 *
 * Color variants:
 * - default: neutral gray styling
 * - green: teal/green accent for success/active states
 * - blue: blue accent for information/AI features
 * - purple: purple accent for premium/enhanced features
 * - yellow: yellow/amber accent for warnings/caution
 * - orange: primary orange accent for emphasis
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  proof,
  colorVariant = "default",
  className = "",
}) => {
  const variantClass =
    colorVariant !== "default"
      ? styles[
          `variant${colorVariant.charAt(0).toUpperCase() + colorVariant.slice(1)}`
        ]
      : "";

  return (
    <div className={`${styles.featureCard} ${variantClass} ${className}`}>
      <span className={styles.featureIcon}>{icon}</span>
      <div className={styles.featureContent}>
        <div className={styles.featureTitle}>{title}</div>
        <div className={styles.featureDescription}>{description}</div>
        {proof && <div className={styles.featureProof}>{proof}</div>}
      </div>
    </div>
  );
};
