import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, displayNameOf } from "@/src/context/AppContext";
import { computeBalances, useExpenses, useSettlements } from "@/src/lib/hooks";
import { supabase } from "@/src/lib/supabase";
import { fmtDate, fmtMoney, fmtMoneyDecimals } from "@/src/lib/format";
import {
  CircleButton, ColorCard, EmptyState, IconCircle, PillRow, PressableScale,
  SkeletonCard, useToast, Ionicons, type AccentTone,
} from "@/src/components/core";
import { ConfirmSheet } from "@/src/components/sheets";
import { useTheme, spacing, radius, font } from "@/src/theme";

const FILTERS = ["All", "Groceries", "Bills", "Rent", "Food", "Other"];
const CAT_TONE: Record<string, AccentTone> = {
  groceries: "mint", bills: "blue", utilities: "blue", rent: "lavender", food: "yellow", other: "pink",
};
const CATEGORY_ICON: Record<string, string> = {
  groceries: "cart", bills: "flash", utilities: "flash", rent: "home", food: "restaurant", other: "receipt",
};

export default function Expenses() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { members, session, household, profile } = useApp();
  const expenses = useExpenses();
  const settlements = useSettlements();
  const toast = useToast();
  const [filter, setFilter] = useState("All");
  const [settlePair, setSettlePair] = useState<{ from: string; to: string; amount: number } | null>(null);

  const uid = session?.user.id ?? "";
  const memberById = (id: string | null) => members.find((m) => m.user_id === id);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = useMemo(
    () => (expenses.data ?? []).filter((e) => e.expense_date?.startsWith(monthPrefix)),
    [expenses.data, monthPrefix],
  );
  const monthTotal = thisMonth.reduce((s, e) => s + Number(e.amount), 0);
  const totalParts = fmtMoneyDecimals(monthTotal);

  const { pairs } = useMemo(
    () => computeBalances(expenses.data ?? [], settlements.data ?? [], members.map((m) => m.user_id)),
    [expenses.data, settlements.data, members],
  );

  const filtered = useMemo(() => {
    const list = expenses.data ?? [];
    if (filter === "All") return list;
    return list.filter((e) => e.category === filter.toLowerCase());
  }, [expenses.data, filter]);

  async function handleSettle() {
    if (!settlePair || !household) return;
    try {
      const { error } = await supabase.from("settlements").insert({
        household_id: household.id,
        from_user: settlePair.from,
        to_user: settlePair.to,
        amount: settlePair.amount,
      });
      if (error) throw new Error(error.message);
      toast("Settled — ledger updated", "success");
    } catch (e: any) {
      toast(e.message ?? "Could not settle", "error");
    }
    setSettlePair(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Pressable testID="expenses-back" onPress={() => router.back()} hitSlop={12}>
                <IconCircle icon="chevron-back" />
              </Pressable>
              <View style={{ flex: 1 }} />
              <PressableScale testID="expenses-budget-link" onPress={() => router.push("/budget")}>
                <IconCircle icon="wallet-outline" />
              </PressableScale>
            </View>

            {/* Tiny label + massive headline */}
            <View>
              <Text style={{ fontSize: 14, fontFamily: font.medium, color: colors.muted }}>This month · household spending</Text>
              <Text testID="expenses-month-total" style={{ fontSize: 60, fontFamily: font.displayExtra, letterSpacing: -2.5, color: colors.onSurface, marginTop: 2 }}>
                {totalParts.whole}
                <Text style={{ fontSize: 26, fontFamily: font.displayBold, color: colors.muted }}>{totalParts.decimals}</Text>
              </Text>
            </View>

            {/* Filters */}
            <View style={{ marginHorizontal: -spacing.lg }}>
              <PillRow testIDPrefix="expenses-filter" options={FILTERS} value={filter} onChange={setFilter} />
            </View>

            {/* Balances */}
            {pairs.length > 0 ? (
              <View style={{ backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md }}>
                <Text style={{ fontSize: 16, fontFamily: font.displayBold, color: colors.onSurface }}>Settle up</Text>
                {pairs.map((p, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Text testID={`balance-pair-${i}`} style={{ fontSize: 14, fontFamily: font.regular, color: colors.onSurface }}>
                        <Text style={{ fontFamily: font.bold }}>{displayNameOf(memberById(p.from))}</Text>
                        {" owes "}
                        <Text style={{ fontFamily: font.bold }}>{displayNameOf(memberById(p.to))}</Text>
                        {` ${fmtMoney(p.amount)}`}
                      </Text>
                    </View>
                    {(p.from === uid || p.to === uid) ? (
                      <Pressable testID={`settle-btn-${i}`} onPress={() => setSettlePair(p)}
                        style={{ backgroundColor: colors.surfaceInverse, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9 }}>
                        <Text style={{ color: colors.onSurfaceInverse, fontSize: 12, fontFamily: font.semibold }}>Mark settled</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={{ fontSize: 22, fontFamily: font.displayBold, color: colors.onSurface, letterSpacing: -0.5, marginTop: spacing.xs }}>
              {filter === "All" ? "All expenses" : filter}
            </Text>
          </View>
        }
        ListEmptyComponent={
          expenses.isLoading ? (
            <View style={{ padding: spacing.lg, gap: spacing.md }}><SkeletonCard /><SkeletonCard /></View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No shared expenses yet"
              subtitle="Add the first one — splitting is automatic."
              actionLabel="Add expense"
              actionTestID="expenses-empty-add"
              onAction={() => router.push("/expenses/new")}
            />
          )
        }
        renderItem={({ item, index }) => {
          const tone = CAT_TONE[item.category] ?? "pink";
          const splits = item.expense_splits ?? [];
          return (
            <PressableScale
              testID={`expense-${item.id}`}
              onPress={() => router.push("/expenses/new")}
              style={{ paddingHorizontal: spacing.lg, marginTop: index === 0 ? spacing.sm : -spacing.md }}
            >
              <ColorCard tone={tone} style={{ paddingTop: index === 0 ? spacing.lg : spacing.lg + spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#161616", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={(CATEGORY_ICON[item.category] ?? "receipt") as any} size={15} color="#FFFFFF" />
                    </View>
                    <Text style={{ fontSize: 13, fontFamily: font.semibold, color: "#1A1A1A", textTransform: "capitalize" }}>{item.category}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontFamily: font.medium, color: "#1A1A1A", opacity: 0.6 }}>{fmtDate(item.expense_date)}</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: spacing.md }}>
                  <View style={{ flex: 1, paddingRight: spacing.md }}>
                    <Text numberOfLines={1} style={{ fontSize: 22, fontFamily: font.displayBold, color: "#1A1A1A", letterSpacing: -0.5 }}>{item.title}</Text>
                    <Text style={{ fontSize: 12, fontFamily: font.regular, color: "#1A1A1A", opacity: 0.6, marginTop: 1 }}>
                      Paid by {displayNameOf(memberById(item.paid_by))}
                      {splits.length ? ` · split ${splits.length} ways` : ""}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 24, fontFamily: font.displayExtra, color: "#1A1A1A", letterSpacing: -1 }}>
                    −{fmtMoney(item.amount)}
                  </Text>
                </View>
              </ColorCard>
            </PressableScale>
          );
        }}
      />

      {/* Floating add */}
      <View style={{ position: "absolute", right: spacing.lg, bottom: insets.bottom + 16 }}>
        <CircleButton testID="expenses-add" icon="add" tone="ink" size={60} onPress={() => router.push("/expenses/new")} />
      </View>

      <ConfirmSheet
        visible={!!settlePair}
        onClose={() => setSettlePair(null)}
        onConfirm={handleSettle}
        title="Mark as settled?"
        message={settlePair ? `Record that ${displayNameOf(memberById(settlePair.from))} paid back ${displayNameOf(memberById(settlePair.to))} ${fmtMoney(settlePair.amount)}. No money moves in the app — it's just the ledger.` : ""}
        confirmLabel="Mark settled"
        confirmTestID="settle-confirm"
      />
      {void profile}
    </View>
  );
}
