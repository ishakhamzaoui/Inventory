import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { colors, spacing } from "@/constants/theme";
import { Batch, Movement, Settings } from "@/types";
import { getServices } from "@/services/container";
import { calcInventoryTotals } from "@/utils/inventoryFilters";
import { formatCurrency, formatNumber } from "@/utils/format";
import {
  DiameterGroup,
  groupByDiameter,
  groupByThickness,
  lowStockBatches,
  summarizeMovements,
  ThicknessGroup,
} from "@/utils/reports";

const LOW_STOCK_THRESHOLD = 5;

export function ReportsScreen() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [purchases, setPurchases] = useState<Movement[]>([]);
  const [sales, setSales] = useState<Movement[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const services = getServices();
      const [allBatches, purchaseMovements, saleMovements, currentSettings] = await Promise.all([
        services.batches.list(),
        services.movements.list({ type: "purchase" }),
        services.movements.list({ type: "sale" }),
        services.settings.get(),
      ]);
      setBatches(allBatches);
      setPurchases(purchaseMovements);
      setSales(saleMovements);
      setSettings(currentSettings);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = useMemo(() => calcInventoryTotals(batches), [batches]);
  const purchaseSummary = useMemo(() => summarizeMovements(purchases), [purchases]);
  const saleSummary = useMemo(() => summarizeMovements(sales), [sales]);
  const lowStock = useMemo(() => lowStockBatches(batches, LOW_STOCK_THRESHOLD), [batches]);
  const byDiameter = useMemo(() => groupByDiameter(batches), [batches]);
  const byThickness = useMemo(() => groupByThickness(batches), [batches]);
  const currency = settings?.currency ?? "DZD";

  if (error) {
    return (
      <Screen>
        <Text color={colors.danger}>{error}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="h1" style={styles.pageTitle}>
          Reports
        </Text>

        <Section title="Current Inventory">
          <Card>
            <StatRow label="Batches" value={formatNumber(totals.batchCount, 0)} />
            <StatRow label="Tubes" value={formatNumber(totals.tubeCount, 0)} />
            <StatRow label="Total Length" value={`${formatNumber(totals.totalLength)} m`} />
            <StatRow label="Total Weight" value={`${formatNumber(totals.totalWeight)} kg`} />
            <StatRow
              label="Estimated Value"
              value={formatCurrency(totals.inventoryValue, currency)}
            />
          </Card>
        </Section>

        <Section title="Purchases">
          <Card>
            <StatRow label="Purchases recorded" value={formatNumber(purchaseSummary.count, 0)} />
            <StatRow
              label="Total spent"
              value={formatCurrency(purchaseSummary.totalValue, currency)}
            />
          </Card>
        </Section>

        <Section title="Sales">
          <Card>
            <StatRow label="Sales recorded" value={formatNumber(saleSummary.count, 0)} />
            <StatRow
              label="Total revenue"
              value={formatCurrency(saleSummary.totalValue, currency)}
            />
          </Card>
        </Section>

        <Section title={`Low Stock (≤ ${LOW_STOCK_THRESHOLD} tubes)`}>
          {lowStock.length === 0 ? (
            <Card>
              <Text color={colors.textSecondary}>No batches are running low right now.</Text>
            </Card>
          ) : (
            lowStock.map((b) => (
              <Card key={b.id} style={styles.rowCard}>
                <Text variant="bodyBold">
                  Ø{formatNumber(b.diameterMm, 1)}mm × {formatNumber(b.thicknessMm, 1)}mm
                </Text>
                <Text color={colors.warning}>{formatNumber(b.quantity, 0)} tubes left</Text>
              </Card>
            ))
          )}
        </Section>

        <Section title="Grouped by Diameter">
          {byDiameter.length === 0 ? (
            <Card>
              <Text color={colors.textSecondary}>No batches yet.</Text>
            </Card>
          ) : (
            <Card>
              {byDiameter.map((g, i) => (
                <DiameterGroupRow
                  key={g.diameterMm}
                  group={g}
                  isLast={i === byDiameter.length - 1}
                />
              ))}
            </Card>
          )}
        </Section>

        <Section title="Grouped by Thickness">
          {byThickness.length === 0 ? (
            <Card>
              <Text color={colors.textSecondary}>No batches yet.</Text>
            </Card>
          ) : (
            <Card>
              {byThickness.map((g, i) => (
                <ThicknessGroupRow
                  key={g.thicknessMm}
                  group={g}
                  isLast={i === byThickness.length - 1}
                />
              ))}
            </Card>
          )}
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="h3" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text color={colors.textSecondary}>{label}</Text>
      <Text variant="bodyBold">{value}</Text>
    </View>
  );
}

function DiameterGroupRow({ group, isLast }: { group: DiameterGroup; isLast: boolean }) {
  return (
    <View style={[styles.groupRow, !isLast && styles.groupRowDivider]}>
      <Text variant="bodyBold">Ø{formatNumber(group.diameterMm, 1)}mm</Text>
      <Text color={colors.textSecondary}>
        {formatNumber(group.tubeCount, 0)} tubes · {formatNumber(group.totalLength)}m ·{" "}
        {formatNumber(group.totalWeight)}kg
      </Text>
    </View>
  );
}

function ThicknessGroupRow({ group, isLast }: { group: ThicknessGroup; isLast: boolean }) {
  return (
    <View style={[styles.groupRow, !isLast && styles.groupRowDivider]}>
      <Text variant="bodyBold">{formatNumber(group.thicknessMm, 1)}mm wall</Text>
      <Text color={colors.textSecondary}>
        {formatNumber(group.tubeCount, 0)} tubes · {formatNumber(group.totalLength)}m ·{" "}
        {formatNumber(group.totalWeight)}kg
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  rowCard: {
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupRow: {
    paddingVertical: spacing.sm,
  },
  groupRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
