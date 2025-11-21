"use client";

import React from "react";
import { trackEvent } from "../../utils/analytics";

type CommonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  trackingEvent?: string;
  trackingProps?: Record<string, string | number | boolean>;
};

type ButtonOnlyProps = CommonProps &
  Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children" | "disabled"
  > & {
    href?: undefined;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  };

type LinkProps = CommonProps &
  Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "className" | "children" | "disabled"
  > & {
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  };

export type ButtonProps = ButtonOnlyProps | LinkProps;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  href,
  className = "",
  disabled = false,
  trackingEvent,
  trackingProps,
  ...rest
}) => {
  const onClick = rest.onClick;
  const ariaLabel = rest["aria-label"];

  // Track analytics on click
  const handleClick = (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Track analytics if event name provided
    if (trackingEvent) {
      trackEvent(trackingEvent, {
        ...trackingProps,
        variant,
        label: typeof children === "string" ? children : ariaLabel || "button",
        ...(href && { href }),
      });
    }

    // Call original onClick handler
    if (onClick) {
      onClick(
        event as React.MouseEvent<HTMLButtonElement> &
          React.MouseEvent<HTMLAnchorElement>,
      );
    }
  };

  // Use the new CSS classes from globals.css
  const getVariantClass = (variant: string) => {
    switch (variant) {
      case "primary":
        return "btn btn--primary";
      case "secondary":
        return "btn btn--secondary";
      case "ghost":
        return "btn btn--ghost";
      default:
        return "btn btn--primary";
    }
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case "sm":
        return "text-sm py-2 px-3";
      case "md":
        return "text-base py-3 px-4";
      case "lg":
        return "text-lg py-4 px-6";
      default:
        return "text-base py-3 px-4";
    }
  };

  const classes =
    `${getVariantClass(variant)} ${getSizeClass(size)} ${className}`.trim();

  if (href) {
    return (
      <a
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        href={disabled ? undefined : href}
        aria-disabled={disabled ? "true" : undefined}
        aria-label={ariaLabel}
        tabIndex={disabled ? -1 : undefined}
        onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      type={
        (rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button"
      }
      onClick={handleClick as React.MouseEventHandler<HTMLButtonElement>}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classes}
    >
      {children}
    </button>
  );
};
