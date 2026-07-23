import React from "react";
import { StyleSheet } from "react-native";
import { Card } from "@/components/Card";
import { Text } from "@/components/Typography";
import { colors, spacing } from "@/constants/theme";
import { Batch } from "@/types";
import { formatNumber } from "@/utils/format";

export function BatchSummaryCard({ batch }: { batch: Batch }) {
  return (
    <Card style={styles.card}>
      <Text variant="h3">
        Ø{formatNumber(batch.diameterMm, 1)}mm × {formatNumber(batch.thicknessMm, 1)}mm
      </Text>
      <Text color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
        {formatNumber(batch.tubeLengthM, 2)}m per tube · {formatNumber(batch.quantity, 0)} tubes in
        stock
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
});
