// Design tokens for Roomie — "Tactile / Playful LIGHT".
// Vibrant solid-color accent cards + oversized Outfit headlines on a warm
// off-white canvas. See /app/design_guidelines.json. Light theme only.
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces
  surface: "#F7F6F2", // warm off-white canvas
  onSurface: "#1A1A1A",
  surfaceSecondary: "#FFFFFF", // neutral cards
  onSurfaceSecondary: "#1A1A1A",
  surfaceTertiary: "#EEEDE7", // inputs, chips, segmented track
  onSurfaceTertiary: "#4A4A47",
  surfaceInverse: "#161616", // black nav, black CTAs, black cards
  onSurfaceInverse: "#FFFFFF",
  muted: "#8A8A84",

  // Brand — primary CTA is a black pill; lime is the hero accent.
  brand: "#DDF73E",
  onBrand: "#1A1A1A",
  brandPrimary: "#161616",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#DDF73E",
  onBrandSecondary: "#1A1A1A",
  brandTertiary: "#C4B5FD",
  onBrandTertiary: "#1A1A1A",

  // Status (kept readable for badges / urgency, not pastel)
  success: "#2F7A43",
  onSuccess: "#FFFFFF",
  warning: "#B7791F",
  onWarning: "#FFFFFF",
  error: "#D8422C",
  onError: "#FFFFFF",
  info: "#2F6AA8",
  onInfo: "#FFFFFF",

  // Lines
  border: "#ECEAE3",
  borderStrong: "#161616", // bold tactile outlines
  divider: "#ECEAE3",

  // Vibrant solid accent cards (flat, no gradient)
  accentLime: "#DDF73E",
  onAccentLime: "#1A1A1A",
  accentLavender: "#C4B5FD",
  onAccentLavender: "#1A1A1A",
  accentYellow: "#FDE047",
  onAccentYellow: "#1A1A1A",
  accentMint: "#A7F3D0",
  onAccentMint: "#1A1A1A",
  accentBlue: "#BAE6FD",
  onAccentBlue: "#1A1A1A",
  accentPink: "#FBCFE8",
  onAccentPink: "#1A1A1A",

  // Legacy gradient-hero tokens (repointed to the new pastels so existing
  // screens using <GradientHero/> stay cohesive).
  gradHomeA: "#E6FB7A",
  gradHomeB: "#DDF73E",
  gradHomeC: "#F4FBD2",
  gradInventoryA: "#C8F7DE",
  gradInventoryB: "#A7F3D0",
  gradInventoryC: "#E8FBF1",
  gradAiA: "#D8CCFD",
  gradAiB: "#C4B5FD",
  gradAiC: "#EFEAFE",
  gradExpensesA: "#D6ECFE",
  gradExpensesB: "#BAE6FD",
  gradExpensesC: "#EAF5FE",
  gradTasksA: "#FEEC8A",
  gradTasksB: "#FDE047",
  gradTasksC: "#FDF6CE",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

// Spacing (8pt grid) & radius tokens
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 14, md: 20, lg: 28, xl: 34, pill: 999 };

// Type families — Outfit for oversized display headlines, Plus Jakarta Sans for text.
export const font = {
  displayRegular: "Outfit-Regular",
  displayMedium: "Outfit-Medium",
  displaySemiBold: "Outfit-SemiBold",
  displayBold: "Outfit-Bold",
  displayExtra: "Outfit-ExtraBold",
  regular: "Jakarta-Regular",
  medium: "Jakarta-Medium",
  semibold: "Jakarta-SemiBold",
  bold: "Jakarta-Bold",
};
