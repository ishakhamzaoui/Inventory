import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Typography";
import { TextField } from "@/components/TextField";
import { Card } from "@/components/Card";
import { colors, spacing } from "@/constants/theme";
import { Batch } from "@/types";
import { filterBatches } from "@/utils/inventoryFilters";
import { formatNumber } from "@/utils/format";

interface BatchPickerProps {
  batches: Batch[];
  onSelect: (batch: Batch) => void;
}

export function BatchPicker({ batches, onSelect }: BatchPickerProps) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterBatches(batches, { query }), [batches, query]);

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>
        Select a batch
      </Text>
      <TextField
        label="Search"
        placeholder="Diameter, thickness, length, or supplier"
        value={query}
        onChangeText={setQuery}
      />
      <FlatList
        data={visible}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelect(item)}>
            <Card style={styles.itemCard}>
              <Text variant="bodyBold">
                Ø{formatNumber(item.diameterMm, 1)}mm × {formatNumber(item.thicknessMm, 1)}mm
              </Text>
              <Text color={colors.textSecondary}>
                {formatNumber(item.quantity, 0)} tubes in stock
              </Text>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={<Text color={colors.textSecondary}>No batches match your search.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: spacing.sm,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
});
