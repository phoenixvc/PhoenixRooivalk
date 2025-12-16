/**
 * Phoenix Rooivalk Design Tokens (TypeScript)
 *
 * Use these tokens for programmatic access to design system values.
 * For CSS, import the tokens/index.css file directly.
 */

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const fontSize = {
  xs: "var(--pr-text-xs)",
  sm: "var(--pr-text-sm)",
  base: "var(--pr-text-base)",
  lg: "var(--pr-text-lg)",
  xl: "var(--pr-text-xl)",
  "2xl": "var(--pr-text-2xl)",
  "3xl": "var(--pr-text-3xl)",
  "4xl": "var(--pr-text-4xl)",
  "5xl": "var(--pr-text-5xl)",
  "6xl": "var(--pr-text-6xl)",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

export const borderRadius = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

export const zIndex = {
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  overlay: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

export const duration = {
  fast: "100ms",
  normal: "150ms",
  slow: "200ms",
  slower: "300ms",
  slowest: "500ms",
} as const;

export const easing = {
  linear: "linear",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

export const colors = {
  brand: {
    orange: "#f97316",
    orangeLight: "#fb923c",
    orangeDark: "#ea580c",
    gold: "#fbbf24",
    amber: "#f59e0b",
    crimson: "#dc2666",
  },
  status: {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
} as const;

// CSS variable references for theme-aware colors
export const semanticColors = {
  bg: {
    base: "var(--pr-bg-base)",
    subtle: "var(--pr-bg-subtle)",
    muted: "var(--pr-bg-muted)",
    emphasis: "var(--pr-bg-emphasis)",
    inverse: "var(--pr-bg-inverse)",
  },
  fg: {
    base: "var(--pr-fg-base)",
    muted: "var(--pr-fg-muted)",
    subtle: "var(--pr-fg-subtle)",
    inverse: "var(--pr-fg-inverse)",
    onAccent: "var(--pr-fg-on-accent)",
  },
  border: {
    base: "var(--pr-border-base)",
    muted: "var(--pr-border-muted)",
    emphasis: "var(--pr-border-emphasis)",
    accent: "var(--pr-border-accent)",
  },
  accent: {
    base: "var(--pr-accent-base)",
    hover: "var(--pr-accent-hover)",
    active: "var(--pr-accent-active)",
    subtle: "var(--pr-accent-subtle)",
  },
  shadow: {
    sm: "var(--pr-shadow-sm)",
    md: "var(--pr-shadow-md)",
    lg: "var(--pr-shadow-lg)",
    xl: "var(--pr-shadow-xl)",
    "2xl": "var(--pr-shadow-2xl)",
    glow: "var(--pr-shadow-glow)",
  },
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  xs: "320px",
  sm: "480px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Container max widths
export const containers = {
  xs: "20rem",
  sm: "24rem",
  md: "28rem",
  lg: "32rem",
  xl: "36rem",
  "2xl": "42rem",
  "3xl": "48rem",
  "4xl": "56rem",
  "5xl": "64rem",
  "6xl": "72rem",
  "7xl": "80rem",
  max: "90rem",
} as const;

export type SpacingKey = keyof typeof spacing;
export type FontSizeKey = keyof typeof fontSize;
export type FontWeightKey = keyof typeof fontWeight;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ZIndexKey = keyof typeof zIndex;
export type DurationKey = keyof typeof duration;
export type BreakpointKey = keyof typeof breakpoints;
