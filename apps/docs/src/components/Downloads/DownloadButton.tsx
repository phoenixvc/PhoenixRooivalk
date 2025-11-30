import * as React from "react";
import styles from "./Downloads.module.css";

interface DownloadButtonProps {
  /** Button label */
  label: string;
  /** Optional icon to display before the label */
  icon?: string;
  /** Content type being downloaded */
  type: "pdf" | "slidedeck";
  /** Callback function when download is triggered */
  onDownload: () => void;
  /** Optional additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: "primary" | "secondary" | "outline";
}

export default function DownloadButton({
  label,
  icon,
  type,
  onDownload,
  className = "",
  variant = "primary",
}: DownloadButtonProps): React.ReactElement {
  const variantClass = {
    primary: styles.downloadButtonPrimary,
    secondary: styles.downloadButtonSecondary,
    outline: styles.downloadButtonOutline,
  };

  const defaultIcons = {
    pdf: "\u{1F4C4}",
    slidedeck: "\u{1F4CA}",
  };

  return (
    <button
      type="button"
      onClick={onDownload}
      className={`${styles.downloadButton} ${variantClass[variant]} ${className}`}
      aria-label={`Download ${label}`}
    >
      <span className={styles.downloadButtonIcon} aria-hidden="true">
        {icon || defaultIcons[type]}
      </span>
      <span>{label}</span>
    </button>
  );
}
