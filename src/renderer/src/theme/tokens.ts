// Design tokens from ADR-03 (docs/decisions.md). The single source of all theme values.
// DOM-free so that tests and the CSS generation can import it.
export const tokens = {
  color: {
    bg: {
      base: "#0B0F17",
      surface1: "#121826",
      surface2: "#1A2233",
      surface3: "#232D42",
    },
    border: {
      subtle: "#2C3850",
      control: "#64779A",
    },
    text: {
      primary: "#E6EBF5",
      secondary: "#A7B2C6",
      muted: "#8C99B2",
    },
    accent: {
      primary: "#3DD6D0",
      primaryHover: "#6BE3DE",
      onPrimary: "#0B0F17",
      boardComputer: "#B69CFF",
    },
    focus: "#7FEFEA",
    credits: "#F2B544",
    status: {
      success: "#4FD18B",
      warning: "#F59E3D",
      danger: "#FF7A7A",
      info: "#6DB3FF",
    },
  },
  fontFamily: {
    heading: '"Space Grotesk", system-ui, sans-serif',
    body: '"IBM Plex Sans", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  /** Font sizes in px. */
  fontSize: {
    hint: 12,
    base: 14,
    emphasis: 16,
    h3: 20,
    h2: 24,
    h1: 32,
  },
  /** Unitless line heights. */
  lineHeight: {
    text: 1.5,
    heading: 1.25,
  },
  /** Spacing steps in px on a 4 px grid. */
  space: {
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    32: 32,
    48: 48,
  },
  /** Corner radii in px. */
  radius: {
    sm: 2,
    md: 4,
    lg: 8,
  },
  shadow: {
    dialog: "0 8px 32px rgb(0 0 0 / 0.5)",
  },
  /** Durations in ms. */
  duration: {
    fast: 120,
    normal: 200,
    slow: 320,
  },
  easing: {
    enter: "cubic-bezier(0.2, 0, 0, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

export type Tokens = typeof tokens;
