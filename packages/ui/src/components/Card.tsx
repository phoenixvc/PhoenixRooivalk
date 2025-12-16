"use client";

import React from "react";

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  as?: "div" | "article" | "section";
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card component using Phoenix Rooivalk design tokens
 *
 * Uses CSS custom properties for consistent theming:
 * - Background: var(--pr-bg-muted), var(--pr-bg-subtle)
 * - Border: var(--pr-border-muted)
 * - Border radius: var(--pr-radius-lg)
 * - Shadows: var(--pr-shadow-sm), var(--pr-shadow-md)
 *
 * Falls back to Tailwind values when design tokens aren't available.
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  padding = "md",
  className = "",
  onClick,
  as: Component = "div",
}) => {
  // Base styles using design tokens with fallbacks
  const baseClasses =
    "rounded-[var(--pr-radius-lg,0.5rem)] transition-all duration-[var(--pr-duration-slow,200ms)] ease-[var(--pr-ease,cubic-bezier(0.4,0,0.2,1))]";

  // Variant styles
  const variantClasses = {
    default:
      "bg-[var(--pr-bg-muted,#1e293b)] border border-[var(--pr-border-muted,#334155)]",
    elevated:
      "bg-[var(--pr-bg-muted,#1e293b)] border border-[var(--pr-border-muted,#334155)] shadow-[var(--pr-shadow-md,0_4px_6px_-1px_rgba(0,0,0,0.4))]",
    outlined: "bg-transparent border-2 border-[var(--pr-border-muted,#334155)]",
    interactive:
      "bg-[var(--pr-bg-muted,#1e293b)] border border-[var(--pr-border-muted,#334155)] cursor-pointer hover:border-[var(--pr-brand-orange,#f97316)] hover:shadow-[var(--pr-shadow-lg,0_10px_15px_-3px_rgba(0,0,0,0.4))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pr-brand-orange,#f97316)]",
  };

  // Padding sizes
  const paddingClasses = {
    none: "",
    sm: "p-[var(--pr-space-3,0.75rem)]",
    md: "p-[var(--pr-space-4,1rem)]",
    lg: "p-[var(--pr-space-6,1.5rem)]",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  const interactiveProps =
    variant === "interactive"
      ? {
          tabIndex: 0,
          role: "button",
          onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
            }
          },
        }
      : {};

  return (
    <Component className={classes} onClick={onClick} {...interactiveProps}>
      {children}
    </Component>
  );
};

/**
 * Card Header component for displaying title and optional actions.
 *
 * Renders a header section with bottom border separator using Phoenix Rooivalk design tokens.
 *
 * @param props - The component props
 * @param props.children - Content to render inside the header (typically title, subtitle, or actions)
 * @param props.className - Optional additional CSS classes to apply. Defaults to empty string.
 *
 * @returns A styled div element containing the header content
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <h3>Card Title</h3>
 *   </CardHeader>
 *   <CardBody>Content here</CardBody>
 * </Card>
 * ```
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`border-b border-[var(--pr-border-muted,#334155)] pb-[var(--pr-space-3,0.75rem)] mb-[var(--pr-space-4,1rem)] ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Card Body component for the main content area of a card.
 *
 * Renders the primary content section with muted text color using Phoenix Rooivalk design tokens.
 *
 * @param props - The component props
 * @param props.children - The main content to render inside the card body
 * @param props.className - Optional additional CSS classes to apply. Defaults to empty string.
 *
 * @returns A styled div element containing the body content with muted text styling
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardBody>
 *     <p>This is the main content of the card.</p>
 *     <p>It can contain any React elements.</p>
 *   </CardBody>
 * </Card>
 * ```
 */
export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`text-[var(--pr-fg-muted,#94a3b8)] ${className}`}>
      {children}
    </div>
  );
};

/**
 * Card Footer component for actions or metadata at the bottom of a card.
 *
 * Renders a footer section with top border separator using Phoenix Rooivalk design tokens.
 * Typically used for action buttons, links, or supplementary information.
 *
 * @param props - The component props
 * @param props.children - Content to render inside the footer (typically buttons or metadata)
 * @param props.className - Optional additional CSS classes to apply. Defaults to empty string.
 *
 * @returns A styled div element containing the footer content with top border
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardBody>Card content</CardBody>
 *   <CardFooter>
 *     <Button variant="primary">Save</Button>
 *     <Button variant="secondary">Cancel</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`border-t border-[var(--pr-border-muted,#334155)] pt-[var(--pr-space-3,0.75rem)] mt-[var(--pr-space-4,1rem)] ${className}`}
    >
      {children}
    </div>
  );
};
