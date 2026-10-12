import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar, ColorCard, CircleButton, IconCircle, SegmentedControl, PrimaryButton,
  Ionicons, type AccentTone,
} from "@/src/components/core";
import { useTheme, spacing, font, setThemeMode, useThemeMode } from "@/src/theme";

const LABELS: Record<string, any> = { Light: "light", Dark: "dark", System: "system" };
const MODE_LABEL: Record<string, string> = { light: "Light", dark: "Dark", system: "System" };

const EXP: { tone: AccentTone; icon: string; cat: string; title: string; amt: string; day: string }[] = [
  { tone: "lavender", icon: "home", cat: "Rent", title: "October rent", amt: "$1,200", day: "Mon" },
  { tone: "yellow", icon: "restaurant", cat: "Food", title: "Taco night", amt: "$42", day: "Tue" },
  { tone: "mint", icon: "cart", cat: "Groceries", title: "Weekly shop", amt: "$88", day: "Wed" },
  { tone: "blue", icon: "flash", cat: "Bills", title: "Electricity", amt: "$64", day: "Fri" },
];

export default function DesignPreview() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const mode = useThemeMode();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.sm, gap: spacing.lg, paddingBottom: 80 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Avatar name="Taylor" size={48} />
          <IconCircle icon="notifications-outline" badge tone="light" />
        </View>
        <Text style={{ fontSize: 34, letterSpacing: -1.2, color: colors.onSurface }}>
          <Text style={{ fontFamily: font.displayRegular }}>Theme preview{"\n"}</Text>
          <Text style={{ fontFamily: font.displayExtra }}>Light & Dark</Text>
        </Text>
        <SegmentedControl options={["Light", "Dark", "System"]} value={MODE_LABEL[mode]} onChange={(v) => setThemeMode(LABELS[v])} testIDPrefix="dp-theme" />

        <ColorCard tone="lime">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={{ fontFamily: font.semibold, fontSize: 14, color: "#1A1A1A" }}>Food budget</Text>
            <CircleButton testID="dp-b" icon="arrow-forward" tone="ink" size={40} />
          </View>
          <Text style={{ fontFamily: font.displayExtra, fontSize: 56, letterSpacing: -2.5, color: "#1A1A1A", marginTop: spacing.sm }}>$1,240</Text>
        </ColorCard>

        <ColorCard tone="ink">
          <Text style={{ fontFamily: font.displayBold, fontSize: 24, color: "#FFFFFF" }}>What can we cook? 🍳</Text>
          <Text style={{ fontFamily: font.regular, fontSize: 14, color: "#FFFFFF", opacity: 0.7, marginTop: 4 }}>Ink card stays dark in both themes.</Text>
        </ColorCard>

        <Text style={{ fontSize: 22, fontFamily: font.displayBold, color: colors.onSurface }}>Stacked expenses</Text>
        <View>
          {EXP.map((e, i) => (
            <ColorCard key={e.cat} tone={e.tone} style={{ marginTop: i === 0 ? 0 : -spacing.md, paddingTop: i === 0 ? spacing.lg : spacing.lg + spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#161616", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={e.icon as any} size={15} color="#FFFFFF" />
                  </View>
                  <Text style={{ fontSize: 13, fontFamily: font.semibold, color: "#1A1A1A" }}>{e.cat}</Text>
                </View>
                <Text style={{ fontSize: 12, fontFamily: font.medium, color: "#1A1A1A", opacity: 0.6 }}>{e.day}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: spacing.md }}>
                <Text style={{ fontSize: 22, fontFamily: font.displayBold, color: "#1A1A1A", letterSpacing: -0.5 }}>{e.title}</Text>
                <Text style={{ fontSize: 24, fontFamily: font.displayExtra, color: "#1A1A1A", letterSpacing: -1 }}>−{e.amt}</Text>
              </View>
            </ColorCard>
          ))}
        </View>

        <PrimaryButton testID="dp-p" label="Add expense" onPress={() => {}} />
      </ScrollView>
    </View>
  );
}
