import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { LogBox, Text, View } from "react-native";
import { useFonts } from "expo-font";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetInfo } from "@react-native-community/netinfo";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AppProvider, useApp } from "@/src/context/AppContext";
import { ToastProvider } from "@/src/components/core";
import { useTheme, radius, spacing } from "@/src/theme";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

function OfflineBanner() {
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  if (netInfo.isConnected !== false) return null;
  return (
    <View
      testID="offline-banner"
      style={{
        position: "absolute", top: insets.top + 8, alignSelf: "center",
        backgroundColor: colors.surfaceInverse, paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: radius.pill, zIndex: 10,
      }}
    >
      <Text style={{ color: colors.onSurfaceInverse, fontSize: 12, fontWeight: "500" }}>
        You're offline — changes will sync when you're back
      </Text>
    </View>
  );
}

function AuthGate() {
  const { session, household, loading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const root = segments[0] as string | undefined;
    if (root === "_designpreview") return; // TEMP: design preview route
    const inAuth = root === "(auth)";
    const inOnboarding = root === "onboarding";
    if (!session && !inAuth) {
      router.replace("/(auth)/welcome");
    } else if (session && !household && !inOnboarding) {
      router.replace("/onboarding");
    } else if (session && household && (inAuth || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [session, household, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F7F6F2" } }} />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
    "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-Bold": require("../assets/fonts/Outfit-Bold.ttf"),
    "Outfit-ExtraBold": require("../assets/fonts/Outfit-ExtraBold.ttf"),
    "Jakarta-Regular": require("../assets/fonts/Jakarta-Regular.ttf"),
    "Jakarta-Medium": require("../assets/fonts/Jakarta-Medium.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/Jakarta-SemiBold.ttf"),
    "Jakarta-Bold": require("../assets/fonts/Jakarta-Bold.ttf"),
  });

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <AppProvider>
            <ToastProvider>
              <OfflineBanner />
              {fontsLoaded ? <AuthGate /> : <View style={{ flex: 1, backgroundColor: "#F7F6F2" }} />}
            </ToastProvider>
          </AppProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

void spacing;
