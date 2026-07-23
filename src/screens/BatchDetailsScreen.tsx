import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { MovementRow } from "@/components/MovementRow";
import { colors, spacing } from "@/constants/theme";
import { Batch, Movement } from "@/types";
import { getServices } from "@/services/container";
import { formatNumber } from "@/utils/format";
import type { InventoryStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<InventoryStackParamList, "BatchDetails">;
type Route = { params: InventoryStackParamList["BatchDetails"] };

export function BatchDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as Route;
  const { batchId } = route.params;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const services = getServices();
      const [loadedBatch, loadedMovements] = await Promise.all([
        services.batches.get(batchId),
        services.movements.listForBatch(batchId),
      ]);
      setBatch(loadedBatch);
      setMovements(loadedMovements);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load batch");
    }
  }, [batchId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = () => {
    Alert.alert(
      "Delete this batch?",
      "This removes the batch and its entire movement history. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await getServices().batches.delete(batchId);
              navigation.goBack();
            } catch (e) {
              Alert.alert(
                "Couldn't delete batch",
                e instanceof Error ? e.message : "Unknown error",
              );
            }
          },
        },
      ],
    );
  };

  if (error) {
    return (
      <Screen>
        <Text color={colors.danger}>{error}</Text>
      </Screen>
    );
  }

  if (!batch) {
    return (
      <Screen>
        <Text color={colors.textSecondary}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text variant="h2">
            Ø{formatNumber(batch.diameterMm, 1)}mm × {formatNumber(batch.thicknessMm, 1)}mm
          </Text>
          <Text color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
            {formatNumber(batch.tubeLengthM, 2)}m per tube
          </Text>

          <View style={styles.statsRow}>
            <Stat label="In stock" value={`${formatNumber(batch.quantity, 0)} tubes`} />
            <Stat label="Length" value={`${formatNumber(batch.totalLength)} m`} />
            <Stat label="Weight" value={`${formatNumber(batch.totalWeight)} kg`} />
          </View>

          <View style={styles.divider} />

          <Row label="Weight per meter" value={`${formatNumber(batch.weightPerMeter)} kg/m`} />
          <Row
            label="Avg. purchase price"
            value={`${formatNumber(batch.purchasePrice)} / ${
              batch.purchasePriceUnit === "per_kg" ? "kg" : "m"
            }`}
          />
          {batch.supplier ? <Row label="Supplier" value={batch.supplier} /> : null}
          {batch.notes ? <Row label="Notes" value={batch.notes} /> : null}
        </Card>

        <View style={styles.actionsRow}>
          <Button
            label="Add Purchase"
            variant="primary"
            style={styles.actionButton}
            onPress={() => navigation.navigate("AddPurchase", { batchId })}
          />
          <Button
            label="Add Sale"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => navigation.navigate("AddSale", { batchId })}
          />
        </View>
        <View style={styles.actionsRow}>
          <Button
            label="Edit"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => navigation.navigate("AddEditBatch", { batchId })}
          />
          <Button
            label="Delete"
            variant="danger"
            style={styles.actionButton}
            onPress={handleDelete}
          />
        </View>
        <Button
          label="Adjust Stock"
          variant="secondary"
          style={styles.adjustButton}
          onPress={() => navigation.navigate("AddAdjustment", { batchId })}
        />

        <Text variant="h3" style={styles.historyTitle}>
          History
        </Text>
        {movements.length === 0 ? (
          <Text color={colors.textSecondary}>No movements recorded yet.</Text>
        ) : (
          movements.map((m) => <MovementRow key={m.id} movement={m} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="bodyBold">{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>
        {label}
      </Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text color={colors.textSecondary}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  adjustButton: {
    marginBottom: spacing.md,
  },
  historyTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
