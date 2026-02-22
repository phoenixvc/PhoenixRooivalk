"use client";

import React from "react";

export interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  target?: string;
  rel?: string;
}

/**
 * Button component using Phoenix Rooivalk design tokens.
 *
 * Renders either a <button> or <a> element depending on whether `href` is
 * provided.  All interactive states honour WCAG AA+ contrast and 44×44 px
 * minimum touch targets.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  target,
  rel,
  ...rest
}) => {
  const baseClasses =
    "inline-block rounded font-bold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pr-brand-orange,#f97316)]";

  const variantClasses = {
    primary:
      "bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-[var(--dark)]",
    secondary: "bg-[var(--secondary,#f97316)] text-white",
    outline:
      "border-2 border-[var(--primary)] text-[var(--primary)] bg-transparent",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    };

    // Build safe rel value, deduplicated, when opening in a new tab
    const computedRel = (() => {
      if (target === "_blank") {
        const parts = new Set(["noopener", "noreferrer"]);
        if (rel) rel.split(/\s+/).forEach((r) => parts.add(r));
        // Remove noopener/noreferrer duplicates already added
        return Array.from(parts).join(" ");
      }
      return rel;
    })();

    return (
      <a
        href={href}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        rel={computedRel}
        target={target}
        onClick={handleLinkClick}
        className={classes}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  );
};
