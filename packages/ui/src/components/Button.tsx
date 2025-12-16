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
}

/**
 * Button component using Phoenix Rooivalk design tokens
 *
 * Uses CSS custom properties for consistent theming:
 * - Colors: var(--pr-brand-orange), var(--pr-bg-base), etc.
 * - Sizing: var(--btn-sm-*), var(--btn-md-*), var(--btn-lg-*)
 *
 * Falls back to Tailwind values when design tokens aren't available.
 */
export const Button: React.FC<
  ButtonProps &
    React.AnchorHTMLAttributes<HTMLAnchorElement> &
    React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  ...rest
}) => {
  // Base styles using design tokens with Tailwind fallbacks
  const baseClasses =
    "inline-flex items-center justify-center rounded-[var(--pr-radius-md,0.375rem)] font-semibold transition-all duration-[var(--pr-duration-normal,150ms)] ease-[var(--pr-ease,cubic-bezier(0.4,0,0.2,1))] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pr-brand-orange,#f97316)]";

  // Variant styles using design tokens
  const variantClasses = {
    primary:
      "bg-[var(--pr-brand-orange,#f97316)] text-white hover:bg-[var(--pr-brand-orange-dark,#ea580c)] shadow-md hover:shadow-lg",
    secondary:
      "bg-[var(--pr-bg-muted,#1e293b)] text-[var(--pr-fg-base,#f1f5f9)] border border-[var(--pr-border-muted,#334155)] hover:bg-[var(--pr-bg-emphasis,#334155)]",
    outline:
      "border-2 border-[var(--pr-brand-orange,#f97316)] text-[var(--pr-brand-orange,#f97316)] bg-transparent hover:bg-[var(--pr-brand-orange,#f97316)] hover:text-white",
  };

  // Size classes using button tokens with fallbacks
  const sizeClasses = {
    sm: "px-[var(--btn-sm-padding-x,0.625rem)] py-[var(--btn-sm-padding-y,0.375rem)] text-[var(--btn-sm-font-size,0.75rem)] min-h-[var(--btn-sm-min-height,32px)]",
    md: "px-[var(--btn-md-padding-x,1rem)] py-[var(--btn-md-padding-y,0.5rem)] text-[var(--btn-md-font-size,0.875rem)] min-h-[var(--btn-md-min-height,40px)]",
    lg: "px-[var(--btn-lg-padding-x,1.5rem)] py-[var(--btn-lg-padding-y,0.75rem)] text-[var(--btn-lg-font-size,1rem)] min-h-[var(--btn-lg-min-height,48px)]",
  };

  const classes = `${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size as keyof typeof sizeClasses]} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  if (href) {
    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      onClick?.(event);
    };

    // Compute safe rel attribute when opening in a new tab
    const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    const computedRel =
      anchorProps?.target === "_blank"
        ? ["noopener", "noreferrer", anchorProps.rel].filter(Boolean).join(" ")
        : anchorProps?.rel;

    return (
      <a
        href={disabled ? undefined : href}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        rel={computedRel}
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
