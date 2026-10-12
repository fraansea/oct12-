// Design tokens for Roomie — "Tactile / Playful" with light + dark modes.
// Vibrant solid-color accent cards + oversized Outfit headlines. Hero accent: lime.
import { useMemo, useSyncExternalStore } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";
import { storage } from "@/src/utils/storage";

export type ColorScheme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";

const light = {
  surface: "#F7F6F2",
  onSurface: "#1A1A1A",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1A1A1A",
  surfaceTertiary: "#EEEDE7",
  onSurfaceTertiary: "#4A4A47",
  surfaceInverse: "#161616",
  onSurfaceInverse: "#FFFFFF",
  muted: "#8A8A84",

  brand: "#DDF73E",
  onBrand: "#1A1A1A",
  brandPrimary: "#161616",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#DDF73E",
  onBrandSecondary: "#1A1A1A",
  brandTertiary: "#C4B5FD",
  onBrandTertiary: "#1A1A1A",

  success: "#2F7A43",
  onSuccess: "#FFFFFF",
  warning: "#B7791F",
  onWarning: "#FFFFFF",
  error: "#D8422C",
  onError: "#FFFFFF",
  info: "#2F6AA8",
  onInfo: "#FFFFFF",

  border: "#ECEAE3",
  borderStrong: "#161616",
  divider: "#ECEAE3",

  // Vibrant solid accent cards — identical in both themes (bright fill, dark text).
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

const dark: ThemeColors = {
  surface: "#121211",
  onSurface: "#F4F3EF",
  surfaceSecondary: "#1C1C1A",
  onSurfaceSecondary: "#F4F3EF",
  surfaceTertiary: "#282826",
  onSurfaceTertiary: "#C9C8C2",
  surfaceInverse: "#F4F3EF", // flips to light: CTAs / nav / bands become light with dark text
  onSurfaceInverse: "#161616",
  muted: "#908F89",

  brand: "#DDF73E",
  onBrand: "#161616",
  brandPrimary: "#DDF73E", // bright lime CTA pops on dark
  onBrandPrimary: "#161616",
  brandSecondary: "#DDF73E",
  onBrandSecondary: "#161616",
  brandTertiary: "#C4B5FD",
  onBrandTertiary: "#161616",

  success: "#5FB477",
  onSuccess: "#0E2A16",
  warning: "#E0A33A",
  onWarning: "#2A1E07",
  error: "#F26C56",
  onError: "#2A0D08",
  info: "#6FA8DC",
  onInfo: "#07121F",

  border: "#2F2F2C",
  borderStrong: "#F4F3EF",
  divider: "#2A2A27",

  // Accent cards stay bright with dark text in dark mode too.
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

  gradHomeA: "#3A451A",
  gradHomeB: "#4C5A1E",
  gradHomeC: "#22260F",
  gradInventoryA: "#1E3A2C",
  gradInventoryB: "#235140",
  gradInventoryC: "#13211A",
  gradAiA: "#342A52",
  gradAiB: "#3F3466",
  gradAiC: "#1E1930",
  gradExpensesA: "#1E3346",
  gradExpensesB: "#234459",
  gradExpensesC: "#121E28",
  gradTasksA: "#49411A",
  gradTasksB: "#5A4E1E",
  gradTasksC: "#26220F",
};

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

// ---- Theme mode store (Light / Dark / System), persisted ----
let _mode: ThemeMode = "system";
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

export function setThemeMode(mode: ThemeMode) {
  _mode = mode;
  Appearance.setColorScheme?.(mode === "system" ? null : mode);
  void storage.setItem("themeMode", mode);
  emit();
}

// Hydrate the saved preference on startup.
void storage.getItem<ThemeMode>("themeMode", "system").then((saved) => {
  if (saved && saved !== _mode) {
    _mode = saved;
    Appearance.setColorScheme?.(saved === "system" ? null : saved);
    emit();
  }
});

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getMode() { return _mode; }

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, getMode, getMode);
}

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const mode = useThemeMode();
  const resolved: ColorScheme = mode === "system" ? ((system as ColorScheme) ?? "light") : mode;
  const scheme: ColorScheme = themes[resolved] ? resolved : "light";
  return { scheme, colors: themes[scheme] };
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
