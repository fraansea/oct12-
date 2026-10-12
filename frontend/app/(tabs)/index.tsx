import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo } from "react";
import { useApp, displayNameOf } from "@/src/context/AppContext";
import { useExpenses, useGroceries, useInventory, useNotifications, useSettlements, useTasks, useWallet, computeBalances } from "@/src/lib/hooks";
import { fmtMoney, greeting, firstName, expiryInfo, relativeDay, daysUntil } from "@/src/lib/format";
import {
  Avatar, Card, ColorCard, Chip, CircleButton, IconCircle, PressableScale, SectionHeader,
  SkeletonCard, StatusTag, Ionicons, type AccentTone,
} from "@/src/components/core";
import { useTheme, spacing, font } from "@/src/theme";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profile, household, members, session } = useApp();
  const tasks = useTasks();
  const inventory = useInventory();
  const groceries = useGroceries();
  const expenses = useExpenses();
  const settlements = useSettlements();
  const wallet = useWallet();
  const { unread } = useNotifications();

  const uid = session?.user.id ?? "";
  const today = new Date().toISOString().slice(0, 10);

  const todaysTasks = useMemo(
    () => (tasks.data ?? []).filter((t) => t.status !== "completed" && (!t.due_date || t.due_date <= today)).slice(0, 4),
    [tasks.data, today],
  );
  const todayCount = useMemo(
    () => (tasks.data ?? []).filter((t) => t.status !== "completed" && (!t.due_date || t.due_date <= today)).length,
    [tasks.data, today],
  );
  const neededGroceries = useMemo(() => (groceries.data ?? []).filter((g) => !g.purchased), [groceries.data]);
  const useSoon = useMemo(
    () => (inventory.data ?? []).filter((i) => {
      const d = daysUntil(i.expiry_date);
      return d !== null && d <= 3 && i.quantity > 0;
    }),
    [inventory.data],
  );
  const owed = useMemo(() => {
    const { pairs } = computeBalances(expenses.data ?? [], settlements.data ?? [], members.map((m) => m.user_id));
    return pairs.filter((p) => p.from === uid).reduce((s, p) => s + p.amount, 0);
  }, [expenses.data, settlements.data, members, uid]);

  const memberById = (id: string | null) => members.find((m) => m.user_id === id);
  const name = firstName(profile?.full_name, profile?.email);

  const stats: { key: string; testID: string; tone: AccentTone; value: string; suffix?: string; label: string; route: string; badge?: boolean }[] = [
    { key: "tasks", testID: "metric-tasks", tone: "lavender", value: String(todayCount), suffix: "today", label: "Tasks", route: "/(tabs)/tasks", badge: todayCount > 0 },
    { key: "groceries", testID: "metric-groceries", tone: "mint", value: String(neededGroceries.length), suffix: "needed", label: "Groceries", route: "/groceries" },
    { key: "inventory", testID: "metric-inventory", tone: "yellow", value: String(inventory.data?.length ?? 0), suffix: "items", label: "Pantry", route: "/(tabs)/inventory", badge: useSoon.length > 0 },
    { key: "owed", testID: "metric-owed", tone: "pink", value: fmtMoney(owed), label: "You owe", route: "/expenses" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <FlatList
        data={[]}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.sm, gap: spacing.lg }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Avatar name={profile?.full_name ?? "?"} uri={profile?.avatar_url} size={48} />
              <Pressable testID="home-notifications" onPress={() => router.push("/notifications")} hitSlop={8}>
                <IconCircle icon="notifications-outline" badge={unread > 0} tone="light" />
              </Pressable>
            </View>

            {/* Oversized mixed-weight greeting */}
            <Text style={{ fontSize: 40, lineHeight: 44, letterSpacing: -1.4, color: colors.onSurface }}>
              <Text style={{ fontFamily: font.displayRegular }}>{greeting()} 👋{"\n"}</Text>
              <Text testID="home-user-name" style={{ fontFamily: font.displayExtra }}>{name}</Text>
              <Text style={{ fontFamily: font.displayRegular }}>, your home at a glance.</Text>
            </Text>

            {/* Lime budget hero card */}
            <ColorCard tone="lime" testID="home-budget-card" onPress={() => router.push("/budget")}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#161616", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="wallet" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={{ fontFamily: font.semibold, fontSize: 14, color: colors.onAccentLime }}>
                    {household?.name ?? "Home"} · Food budget
                  </Text>
                </View>
                <CircleButton testID="home-budget-open" icon="arrow-forward" tone="ink" size={40} onPress={() => router.push("/budget")} />
              </View>
              <Text testID="home-budget-remaining" style={{ fontFamily: font.displayExtra, fontSize: 60, letterSpacing: -2.5, color: colors.onAccentLime, marginTop: spacing.md }}>
                {fmtMoney(wallet.balance)}
              </Text>
              <View style={{ flexDirection: "row", gap: spacing.xl, marginTop: 2 }}>
                <View>
                  <Text style={{ fontFamily: font.regular, fontSize: 12, color: colors.onAccentLime, opacity: 0.7 }}>Spent this month</Text>
                  <Text style={{ fontFamily: font.bold, fontSize: 16, color: colors.onAccentLime }}>{fmtMoney(monthSpend(expenses.data ?? []))}</Text>
                </View>
                <View>
                  <Text style={{ fontFamily: font.regular, fontSize: 12, color: colors.onAccentLime, opacity: 0.7 }}>Contributed</Text>
                  <Text style={{ fontFamily: font.bold, fontSize: 16, color: colors.onAccentLime }}>
                    {fmtMoney(Object.values(wallet.contributions).reduce((a, b) => a + b, 0))}
                  </Text>
                </View>
              </View>
            </ColorCard>

            {/* Pastel stat grid */}
            <View style={{ gap: spacing.md }}>
              {[stats.slice(0, 2), stats.slice(2, 4)].map((row, ri) => (
                <View key={ri} style={{ flexDirection: "row", gap: spacing.md }}>
                  {row.map((s) => (
                    <ColorCard key={s.key} tone={s.tone} testID={s.testID} onPress={() => router.push(s.route as any)}
                      style={{ flex: 1, minHeight: 124, justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontFamily: font.semibold, fontSize: 14, color: "#1A1A1A" }}>{s.label}</Text>
                        <CircleButton testID={`${s.testID}-go`} icon="arrow-forward" tone="ink" size={32} onPress={() => router.push(s.route as any)} />
                      </View>
                      <Text style={{ fontFamily: font.displayExtra, fontSize: 34, letterSpacing: -1.5, color: "#1A1A1A", marginTop: spacing.md }}>
                        {s.value}
                        {s.suffix ? <Text style={{ fontFamily: font.medium, fontSize: 13, color: "#1A1A1A" }}> {s.suffix}</Text> : null}
                      </Text>
                    </ColorCard>
                  ))}
                </View>
              ))}
            </View>

            {/* Tonight's suggestion — ink card */}
            <ColorCard tone="ink" testID="home-meal-hero" onPress={() => router.push("/ai")}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentLime, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="sparkles" size={20} color={colors.onAccentLime} />
                </View>
                <CircleButton testID="home-meal-open" icon="arrow-forward" tone="white" size={40} onPress={() => router.push("/ai")} />
              </View>
              <Text style={{ fontFamily: font.regular, fontSize: 13, color: "#FFFFFF", opacity: 0.6, marginTop: spacing.lg }}>{"Tonight's suggestion"}</Text>
              <Text style={{ fontFamily: font.displayBold, fontSize: 26, letterSpacing: -0.6, color: "#FFFFFF", marginTop: 2 }}>
                What can we cook? 🍳
              </Text>
              <Text style={{ fontFamily: font.regular, fontSize: 14, color: "#FFFFFF", opacity: 0.7, marginTop: 6, lineHeight: 20 }}>
                {inventory.data?.length
                  ? `Kitchen AI checks your ${inventory.data.length} pantry items and budget first.`
                  : "Add what's in your kitchen and I'll plan dinner around it."}
              </Text>
            </ColorCard>

            {/* Today's tasks */}
            <View>
              <SectionHeader title="Today's tasks" actionLabel="All" testID="home-see-tasks"
                onAction={() => router.push("/(tabs)/tasks")} />
              {tasks.isLoading ? (
                <SkeletonCard />
              ) : todaysTasks.length === 0 ? (
                <Card><Text style={{ color: colors.muted, fontSize: 14, fontFamily: font.regular }}>Nothing to do right now. Enjoy it. 🎉</Text></Card>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {todaysTasks.map((t) => (
                    <PressableScale key={t.id} testID={`home-task-${t.id}`} onPress={() => router.push({ pathname: "/tasks/[id]", params: { id: t.id } })}>
                      <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }}>
                        <IconCircle icon="ellipse-outline" size={40} badge={!!t.due_date && t.due_date < today} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontFamily: font.semibold, color: colors.onSurface }}>{t.title}</Text>
                          <Text style={{ fontSize: 12, fontFamily: font.regular, color: colors.muted, marginTop: 1 }}>
                            {displayNameOf(memberById(t.assigned_to))} · {relativeDay(t.due_date)}
                          </Text>
                        </View>
                        {t.priority === "high" ? <Chip label="High" tone="pink" /> : null}
                      </Card>
                    </PressableScale>
                  ))}
                </View>
              )}
            </View>

            {/* Use soon */}
            {useSoon.length > 0 ? (
              <View>
                <SectionHeader title="Use soon" actionLabel="Pantry" testID="home-see-inventory"
                  onAction={() => router.push("/(tabs)/inventory")} />
                <FlatList
                  horizontal
                  data={useSoon}
                  keyExtractor={(i) => i.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.md }}
                  renderItem={({ item }) => {
                    const e = expiryInfo(item);
                    return (
                      <PressableScale testID={`use-soon-${item.id}`}
                        onPress={() => router.push({ pathname: "/inventory/[id]", params: { id: item.id } })}>
                        <ColorCard tone="yellow" style={{ width: 164, minHeight: 124, justifyContent: "space-between" }}>
                          <StatusTag label={e.label} tone={e.tone} />
                          <View>
                            <Text style={{ fontSize: 17, fontFamily: font.displayBold, color: "#1A1A1A" }}>{item.name}</Text>
                            <Text style={{ fontSize: 12, fontFamily: font.regular, color: "#1A1A1A", opacity: 0.6 }}>{item.quantity} {item.unit}</Text>
                          </View>
                        </ColorCard>
                      </PressableScale>
                    );
                  }}
                />
              </View>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

function monthSpend(expenses: { expense_date: string; amount: number }[]): number {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return expenses.filter((e) => e.expense_date?.startsWith(prefix)).reduce((s, e) => s + Number(e.amount), 0);
}
