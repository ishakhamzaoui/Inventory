import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { colors, spacing } from "@/constants/theme";
import { Batch, Settings } from "@/types";
import { getServices } from "@/services/container";
import { calcInventoryTotals } from "@/utils/inventoryFilters";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { RootTabParamList } from "@/navigation/types";

type Nav = BottomTabNavigationProp<RootTabParamList, "Dashboard">;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const services = getServices();
      const [allBatches, currentSettings] = await Promise.all([
        services.batches.list(),
        services.settings.get(),
      ]);
      setBatches(allBatches);
      setSettings(currentSettings);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = useMemo(() => calcInventoryTotals(batches), [batches]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text variant="h1" style={styles.title}>
          Dashboard
        </Text>

        {error ? (
          <Text color={colors.danger}>{error}</Text>
        ) : (
          <>
            <View style={styles.grid}>
              <StatCard label="Batches" value={formatNumber(totals.batchCount, 0)} />
              <StatCard label="Tubes" value={formatNumber(totals.tubeCount, 0)} />
              <StatCard label="Total Length" value={`${formatNumber(totals.totalLength)} m`} />
              <StatCard label="Total Weight" value={`${formatNumber(totals.totalWeight)} kg`} />
            </View>
            <Card style={styles.valueCard}>
              <Text variant="caption" color={colors.textSecondary}>
                Estimated Inventory Value
              </Text>
              <Text variant="h1" style={{ marginTop: spacing.xs }}>
                {formatCurrency(totals.inventoryValue, settings?.currency ?? "DZD")}
              </Text>
            </Card>
          </>
        )}

        <Text variant="h3" style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <View style={styles.actionsRow}>
          <Button
            label="Add Purchase"
            style={styles.actionButton}
            onPress={() => navigation.navigate("Inventory", { screen: "AddPurchase", params: {} })}
          />
          <Button
            label="Add Sale"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => navigation.navigate("Inventory", { screen: "AddSale", params: {} })}
          />
        </View>
        <Button
          label="View Inventory"
          variant="secondary"
          onPress={() =>
            navigation.navigate("Inventory", { screen: "InventoryList", params: undefined })
          }
        />
      </ScrollView>
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statCard}>
      <Text variant="h2">{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    width: "47%",
    alignItems: "center",
  },
  valueCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
