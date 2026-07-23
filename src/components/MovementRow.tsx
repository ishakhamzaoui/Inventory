import React from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "@/components/Card";
import { Text } from "@/components/Typography";
import { colors, spacing } from "@/constants/theme";
import { Movement } from "@/types";
import { formatNumber } from "@/utils/format";

const MOVEMENT_LABEL: Record<Movement["type"], string> = {
  purchase: "Purchase",
  sale: "Sale",
  adjustment: "Adjustment",
};

const MOVEMENT_COLOR: Record<Movement["type"], string> = {
  purchase: colors.success,
  sale: colors.primary,
  adjustment: colors.warning,
};

interface MovementRowProps {
  movement: Movement;
  /** When shown outside a single batch's context (e.g. the global timeline). */
  batchLabel?: string;
}

export function MovementRow({ movement, batchLabel }: MovementRowProps) {
  const date = new Date(movement.date);
  const dateLabel = Number.isNaN(date.getTime()) ? movement.date : date.toLocaleDateString();
  const sign = movement.type === "sale" ? "-" : movement.quantity < 0 ? "" : "+";

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="bodyBold" color={MOVEMENT_COLOR[movement.type]}>
          {MOVEMENT_LABEL[movement.type]}
        </Text>
        <Text color={colors.textSecondary}>{dateLabel}</Text>
      </View>
      {batchLabel ? (
        <Text color={colors.textSecondary} style={styles.batchLabel}>
          {batchLabel}
        </Text>
      ) : null}
      <Text>
        {sign}
        {formatNumber(Math.abs(movement.quantity))} {movement.unit}
        {movement.unitPrice !== undefined ? ` @ ${formatNumber(movement.unitPrice)}` : ""}
      </Text>
      {movement.reason ? (
        <Text color={colors.textSecondary} style={styles.reason}>
          {movement.reason}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  batchLabel: {
    marginBottom: spacing.xs,
  },
  reason: {
    marginTop: spacing.xs,
  },
});
