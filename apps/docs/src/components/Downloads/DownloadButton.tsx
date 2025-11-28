import * as React from "react";

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
  const baseStyles =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer";

  const variantStyles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20",
  };

  const defaultIcons = {
    pdf: "\u{1F4C4}",
    slidedeck: "\u{1F4CA}",
  };

  return (
    <button
      type="button"
      onClick={onDownload}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-label={`Download ${label}`}
    >
      <span aria-hidden="true">{icon || defaultIcons[type]}</span>
      <span>{label}</span>
    </button>
  );
}
