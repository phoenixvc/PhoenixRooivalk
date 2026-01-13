import React from "react";
import styles from "./Card.module.css";

export interface CardMetric {
  value: string;
  label: string;
}

export interface CardProps {
  icon?: string;
  title: string;
  description: string;
  proof?: string;
  metrics?: CardMetric[];
  className?: string;
  colorVariant?: "default" | "green" | "blue" | "purple" | "yellow";
  centered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  icon,
  title,
  description,
  proof,
  metrics,
  className = "",
  colorVariant = "default",
  centered = false,
}) => {
  const colorClass =
    colorVariant !== "default"
      ? styles[
          `card${colorVariant.charAt(0).toUpperCase() + colorVariant.slice(1)}`
        ]
      : "";

  const centeredClass = centered ? styles.cardCentered : "";

  return (
    <div className={`${styles.card} ${colorClass} ${centeredClass} ${className}`}>
      {icon && <div className={styles.cardIcon}>{icon}</div>}
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
      {proof && <div className={styles.cardProof}>✓ {proof}</div>}
      {metrics && metrics.length > 0 && (
        <div className={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <div key={index} className={styles.metricBox}>
              <div className={styles.metricValue}>{metric.value}</div>
              <div className={styles.metricLabel}>{metric.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
