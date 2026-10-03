import React, { useEffect, useRef, useState } from "react";
import {
  Animated, Easing, KeyboardAvoidingView, Modal, PanResponder, Platform,
  Pressable, StyleSheet, Text, View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing, useTheme } from "@/src/theme";
import { PrimaryButton, GhostButton } from "@/src/components/core";

const HIDDEN = 700;
const DISMISS_THRESHOLD = 120;

// Safe no-op on web; adds a subtle native tick on iOS/Android.
function tick(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(style).catch(() => {});
}

// iOS-style rubber-band resistance for over-drag (pulling up past the rest point).
function rubberband(overshoot: number, dim = 220) {
  return (1 - 1 / (overshoot / dim + 1)) * dim;
}

// Bottom sheet mounted in a high-level Modal so tab bars never overlap it.
// Uses React Native's core Animated (not Reanimated): Reanimated's animated
// styles are not reliably committed inside an RN <Modal> on iOS, which left the
// scrim invisible AND un-tappable so the sheet could not be dismissed.
export function Sheet({
  visible, onClose, children, title,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(HIDDEN)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 120, friction: 18 }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: HIDDEN, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible, rendered, opacity, translateY]);

  // Keep the latest onClose so the memoised PanResponder never calls a stale one.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Swipe the handle down to dismiss, with rubber-band resistance + haptics.
  const armed = useRef(false); // true once the drag passes the dismiss threshold
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        armed.current = false;
      },
      onPanResponderMove: (_, g) => {
        if (g.dy >= 0) {
          translateY.setValue(g.dy);
          const nowArmed = g.dy > DISMISS_THRESHOLD;
          // Tick once, right as the user crosses into / out of the "release to close" zone.
          if (nowArmed !== armed.current) {
            armed.current = nowArmed;
            tick(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          // Pulling up past the top: resist elastically instead of following 1:1.
          translateY.setValue(-rubberband(-g.dy));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.8) {
          tick(Haptics.ImpactFeedbackStyle.Medium);
          onCloseRef.current();
        } else {
          // Springy snap-back with a subtle overshoot for a rubber-band feel.
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 160,
            friction: 9,
            restDisplacementThreshold: 0.5,
            restSpeedThreshold: 0.5,
          }).start();
        }
        armed.current = false;
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 160, friction: 9 }).start();
        armed.current = false;
      },
    }),
  ).current;

  if (!rendered) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} testID="sheet-scrim" />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.surfaceSecondary, paddingBottom: insets.bottom + spacing.lg, transform: [{ translateY }] },
            ]}
          >
            <View {...pan.panHandlers} style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
            </View>
            <Pressable
              testID="sheet-close"
              onPress={onClose}
              hitSlop={10}
              style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="close" size={20} color={colors.onSurfaceTertiary} />
            </Pressable>
            {title ? <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text> : null}
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function ConfirmSheet({
  visible, onClose, onConfirm, title, message, confirmLabel = "Confirm", destructive = false,
  confirmTestID = "confirm-sheet-confirm",
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  confirmTestID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {message ? (
        <Text style={{ fontSize: 15, color: colors.onSurfaceTertiary, lineHeight: 22, marginBottom: spacing.lg }}>{message}</Text>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        <View style={destructive ? { borderRadius: radius.pill, overflow: "hidden" } : undefined}>
          <PrimaryButton testID={confirmTestID} label={confirmLabel} onPress={onConfirm} />
        </View>
        <GhostButton testID="confirm-sheet-cancel" label="Cancel" onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(16,16,16,0.45)" },
  sheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg, paddingTop: spacing.xs, maxHeight: "88%",
  },
  handleArea: { alignSelf: "stretch", alignItems: "center", paddingVertical: spacing.sm },
  handle: { width: 40, height: 5, borderRadius: 3 },
  closeBtn: {
    position: "absolute", top: spacing.sm, right: spacing.lg, zIndex: 2,
    width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "600", marginBottom: spacing.md, marginTop: spacing.xs },
});
