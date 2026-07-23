import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { SegmentedControl } from "@/components/SegmentedControl";
import { colors, radius, spacing } from "@/constants/theme";
import { Batch } from "@/types";
import { useBatches } from "@/hooks/useBatches";
import {
  calcInventoryTotals,
  filterBatches,
  SortDirection,
  SortField,
  sortBatches,
} from "@/utils/inventoryFilters";
import { formatNumber } from "@/utils/format";
import type { InventoryStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<InventoryStackParamList, "InventoryList">;

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: "Newest", value: "createdAt" },
  { label: "Diameter", value: "diameterMm" },
  { label: "Stock", value: "quantity" },
];

export function InventoryScreen() {
  const navigation = useNavigation<Nav>();
  const { batches, loading, error, refresh } = useBatches();

  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const visibleBatches = useMemo(() => {
    const filtered = filterBatches(batches, { query, availableOnly });
    return sortBatches(filtered, sortField, sortDirection);
  }, [batches, query, availableOnly, sortField, sortDirection]);

  const totals = useMemo(() => calcInventoryTotals(visibleBatches), [visibleBatches]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <TextField
          label="Search"
          placeholder="Diameter, thickness, length, or supplier"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />

        <View style={styles.filterRow}>
          <SegmentedControl
            options={SORT_OPTIONS}
            value={sortField}
            onChange={setSortField}
            style={styles.sortControl}
          />
          <Pressable
            onPress={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
            style={styles.iconButton}
          >
            <Ionicons
              name={sortDirection === "asc" ? "arrow-up" : "arrow-down"}
              size={18}
              color={colors.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={() => setAvailableOnly((v) => !v)}
            style={[styles.iconButton, availableOnly && styles.iconButtonActive]}
          >
            <Ionicons
              name="cube"
              size={18}
              color={availableOnly ? colors.background : colors.textPrimary}
            />
          </Pressable>
        </View>

        <Card style={styles.totalsCard}>
          <TotalStat label="Batches" value={formatNumber(totals.batchCount, 0)} />
          <TotalStat label="Tubes" value={formatNumber(totals.tubeCount, 0)} />
          <TotalStat label="Length" value={`${formatNumber(totals.totalLength)} m`} />
          <TotalStat label="Weight" value={`${formatNumber(totals.totalWeight)} kg`} />
        </Card>
      </View>

      {error ? (
        <View style={styles.centerFill}>
          <Text color={colors.danger}>{error}</Text>
        </View>
      ) : !loading && visibleBatches.length === 0 ? (
        <View style={styles.centerFill}>
          <Text variant="h3">No batches yet</Text>
          <Text color={colors.textSecondary} style={{ marginTop: spacing.xs, textAlign: "center" }}>
            {batches.length === 0
              ? "Add your first batch to start tracking inventory."
              : "No batches match your search or filters."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleBatches}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={refresh}
          renderItem={({ item }) => (
            <BatchListItem
              batch={item}
              onPress={() => navigation.navigate("BatchDetails", { batchId: item.id })}
            />
          )}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("AddEditBatch", {})}
        accessibilityLabel="Add batch"
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>
    </Screen>
  );
}

function TotalStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="h3">{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>
        {label}
      </Text>
    </View>
  );
}

function BatchListItem({ batch, onPress }: { batch: Batch; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.batchCard}>
        <View style={styles.batchCardHeader}>
          <Text variant="h3">
            Ø{formatNumber(batch.diameterMm, 1)}mm × {formatNumber(batch.thicknessMm, 1)}mm
          </Text>
          <Text variant="bodyBold" color={batch.quantity > 0 ? colors.success : colors.textMuted}>
            {formatNumber(batch.quantity, 0)} tubes
          </Text>
        </View>
        <Text color={colors.textSecondary}>
          {formatNumber(batch.tubeLengthM, 2)}m per tube · {formatNumber(batch.totalLength)}m ·{" "}
          {formatNumber(batch.totalWeight)}kg total
        </Text>
        {batch.supplier ? (
          <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
            {batch.supplier}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchInput: {
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sortControl: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  totalsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  batchCard: {
    marginBottom: spacing.sm,
  },
  batchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
