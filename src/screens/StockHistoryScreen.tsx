import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Typography";
import { TextField } from "@/components/TextField";
import { SegmentedControl } from "@/components/SegmentedControl";
import { MovementRow } from "@/components/MovementRow";
import { colors, spacing } from "@/constants/theme";
import { Batch, Movement, MovementType } from "@/types";
import { getServices } from "@/services/container";
import { filterBatches } from "@/utils/inventoryFilters";
import { formatNumber } from "@/utils/format";

type TypeFilter = "all" | MovementType;

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Buy", value: "purchase" },
  { label: "Sell", value: "sale" },
  { label: "Adjust", value: "adjustment" },
];

export function StockHistoryScreen() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [batchQuery, setBatchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const services = getServices();
      const [allMovements, allBatches] = await Promise.all([
        services.movements.list(),
        services.batches.list(),
      ]);
      setMovements(allMovements);
      setBatches(allBatches);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const batchLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of batches) {
      map.set(b.id, `Ø${formatNumber(b.diameterMm, 1)}mm × ${formatNumber(b.thicknessMm, 1)}mm`);
    }
    return map;
  }, [batches]);

  const matchingBatchIds = useMemo(() => {
    if (!batchQuery.trim()) return null; // null = no batch filter applied
    return new Set(filterBatches(batches, { query: batchQuery }).map((b) => b.id));
  }, [batches, batchQuery]);

  const visibleMovements = useMemo(() => {
    return movements
      .filter((m) => {
        if (typeFilter !== "all" && m.type !== typeFilter) return false;
        if (matchingBatchIds && !matchingBatchIds.has(m.batchId)) return false;
        const dateOnly = m.date.slice(0, 10);
        if (fromDate && dateOnly < fromDate) return false;
        if (toDate && dateOnly > toDate) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [movements, typeFilter, matchingBatchIds, fromDate, toDate]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <SegmentedControl
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={setTypeFilter}
          style={styles.segmentSpacing}
        />
        <TextField
          label="Filter by batch"
          placeholder="Diameter, thickness, length, or supplier"
          value={batchQuery}
          onChangeText={setBatchQuery}
        />
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <TextField label="From (YYYY-MM-DD)" value={fromDate} onChangeText={setFromDate} />
          </View>
          <View style={styles.dateField}>
            <TextField label="To (YYYY-MM-DD)" value={toDate} onChangeText={setToDate} />
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.centerFill}>
          <Text color={colors.danger}>{error}</Text>
        </View>
      ) : !loading && visibleMovements.length === 0 ? (
        <View style={styles.centerFill}>
          <Text variant="h3">No movements found</Text>
          <Text color={colors.textSecondary} style={{ marginTop: spacing.xs, textAlign: "center" }}>
            {movements.length === 0
              ? "Purchases, sales, and adjustments will show up here."
              : "No movements match your filters."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleMovements}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <MovementRow movement={item} batchLabel={batchLabels.get(item.batchId)} />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  segmentSpacing: {
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
});
