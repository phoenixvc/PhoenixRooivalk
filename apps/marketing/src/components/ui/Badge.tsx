import React from "react";
import styles from "./Badge.module.css";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "gradient" | "outlined" | "status";
  size?: "default" | "small" | "xsmall";
  status?: "live" | "beta" | "planned";
  tier?: "core" | "enhanced" | "strategic";
  className?: string;
}

/**
 * Badge Component
 * Unified badge component for status indicators, labels, and tags
 *
 * Size variants:
 * - default: 0.5rem 1rem padding, 0.875rem font (section headers)
 * - small: 0.25rem 0.75rem padding, 0.75rem font (inline status)
 * - xsmall: 0.2rem 0.5rem padding, 0.625rem font (product badges)
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "default",
  status,
  tier,
  className = "",
}) => {
  const variantClass =
    styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
  const sizeClass =
    styles[
      `size${size === "xsmall" ? "XSmall" : size.charAt(0).toUpperCase() + size.slice(1)}`
    ];
  const statusClass = status
    ? styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]
    : "";
  const tierClass = tier
    ? styles[`tier${tier.charAt(0).toUpperCase() + tier.slice(1)}`]
    : "";

  return (
    <span
      className={`${styles.badge} ${variantClass} ${sizeClass} ${statusClass} ${tierClass} ${className}`}
    >
      {children}
    </span>
  );
};
