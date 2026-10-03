import { Text, View, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { APP_NAME } from "@/src/config";
import { useApp } from "@/src/context/AppContext";
import { supabase } from "@/src/lib/supabase";
import { PrimaryButton, GhostButton, useToast } from "@/src/components/core";
import { useTheme, spacing, radius } from "@/src/theme";

WebBrowser.maybeCompleteAuthSession();

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { signInWithGoogle } = useApp();
  const toast = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      // Web: redirect to Google and let Supabase auto-exchange the ?code= on return.
      // Native: deep-link back into the app, then exchange the code for a session (PKCE).
      const redirectTo =
        Platform.OS === "web" ? window.location.origin + "/" : Linking.createURL("auth/callback");
      const url = await signInWithGoogle(redirectTo);
      if (!url) throw new Error("Could not start Google sign-in");
      if (Platform.OS === "web") {
        window.location.href = url;
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
      if (result.type === "success" && result.url) {
        const code = Linking.parse(result.url).queryParams?.code;
        if (typeof code === "string") {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw new Error(error.message);
          // AuthGate in the root layout handles navigation once the session is set.
        } else {
          toast("Google sign-in didn't complete", "error");
        }
      } else if (result.type === "cancel" || result.type === "dismiss") {
        toast("Google sign-in was cancelled", "info");
      }
    } catch (e: any) {
      toast(e.message ?? "Google sign-in is not set up yet", "error");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient
        colors={[colors.gradHomeA, colors.gradHomeC, colors.surface]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: "55%" }}
      />
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: insets.top + 80, paddingBottom: insets.bottom + spacing.xl }}>
        <View style={{ flex: 1, gap: spacing.md }}>
          <View
            style={{
              width: 72, height: 72, borderRadius: 24, backgroundColor: colors.surfaceInverse,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.onSurfaceInverse, fontSize: 34, fontWeight: "700" }}>R</Text>
          </View>
          <Text style={{ fontSize: 44, fontWeight: "700", letterSpacing: -1.5, color: colors.onSurface }}>{APP_NAME}</Text>
          <Text style={{ fontSize: 17, color: colors.onSurfaceTertiary, lineHeight: 26, maxWidth: 300 }}>
            Chores, groceries, expenses and dinner — one calm home for everyone you live with.
          </Text>
        </View>
        <View style={{ gap: spacing.sm }}>
          <PrimaryButton testID="welcome-get-started" label="Get started" onPress={() => router.push("/(auth)/signup")} />
          <GhostButton testID="welcome-google" label="Continue with Google" icon="logo-google" onPress={handleGoogle} loading={googleLoading} />
          <GhostButton testID="welcome-login" label="I already have an account" onPress={() => router.push("/(auth)/login")} />
        </View>
      </View>
    </View>
  );
}

void radius;
