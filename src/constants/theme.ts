/**
 * Central design tokens for the app.
 * Every screen/component should pull colors, spacing, and typography
 * from here instead of hardcoding values.
 */

export const colors = {
  background: "#0F172A",
  surface: "#1E293B",
  surfaceAlt: "#334155",
  border: "#334155",

  primary: "#38BDF8",
  primaryMuted: "#0EA5E9",

  success: "#4ADE80",
  danger: "#F87171",
  warning: "#FBBF24",

  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",

  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodyBold: { fontSize: 15, fontWeight: "600" as const },
  caption: { fontSize: 12, fontWeight: "400" as const },
};

export const theme = { colors, spacing, radius, typography };

export type Theme = typeof theme;
