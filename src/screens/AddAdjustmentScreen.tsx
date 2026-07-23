import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Typography";
import { TextField } from "@/components/TextField";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Button } from "@/components/Button";
import { BatchSummaryCard } from "@/components/BatchSummaryCard";
import { BatchPicker } from "@/components/BatchPicker";
import { colors, spacing } from "@/constants/theme";
import { Batch, MovementUnit } from "@/types";
import { getServices } from "@/services/container";
import { InsufficientStockError } from "@/utils/errors";
import {
  AdjustmentFormValues,
  adjustmentFormSchema,
  parseFormDate,
  todayStr,
} from "@/utils/movementSchema";
import type { InventoryStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<InventoryStackParamList, "AddAdjustment">;
type Route = { params: InventoryStackParamList["AddAdjustment"] };

const UNIT_OPTIONS: { label: string; value: MovementUnit }[] = [
  { label: "Tube", value: "tube" },
  { label: "Meter", value: "meter" },
  { label: "Kg", value: "kg" },
];

const DIRECTION_OPTIONS: { label: string; value: "increase" | "decrease" }[] = [
  { label: "Increase", value: "increase" },
  { label: "Decrease", value: "decrease" },
];

export function AddAdjustmentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as Route;

  const [batchId, setBatchId] = useState<string | undefined>(route.params?.batchId);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      quantity: 0,
      unit: "tube",
      direction: "increase",
      reason: "",
      date: todayStr(),
    },
  });

  useEffect(() => {
    const services = getServices();
    setLoading(true);
    if (batchId) {
      services.batches
        .get(batchId)
        .then(setBatch)
        .catch((e) => setSubmitError(e instanceof Error ? e.message : "Failed to load batch"))
        .finally(() => setLoading(false));
    } else {
      services.batches
        .list()
        .then(setAllBatches)
        .catch((e) => setSubmitError(e instanceof Error ? e.message : "Failed to load batches"))
        .finally(() => setLoading(false));
    }
  }, [batchId]);

  const onSubmit = async (values: AdjustmentFormValues) => {
    if (!batchId) return;
    setSubmitError(null);
    const signedQuantity = values.direction === "decrease" ? -values.quantity : values.quantity;
    try {
      await getServices().inventory.recordAdjustment({
        batchId,
        quantity: signedQuantity,
        unit: values.unit,
        reason: values.reason,
        date: parseFormDate(values.date),
      });
      navigation.goBack();
    } catch (e) {
      if (e instanceof InsufficientStockError) {
        setSubmitError(
          `That decrease is larger than the current stock: ${batch ? `${batch.quantity.toFixed(0)} tube(s) available` : "not enough in stock"}.`,
        );
      } else {
        setSubmitError(e instanceof Error ? e.message : "Failed to record adjustment");
      }
    }
  };

  if (loading) {
    return (
      <Screen>
        <Text color={colors.textSecondary}>Loading…</Text>
      </Screen>
    );
  }

  if (!batchId) {
    return (
      <Screen>
        {submitError ? (
          <Text color={colors.danger} style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}
        <BatchPicker
          batches={allBatches}
          onSelect={(b) => {
            setBatchId(b.id);
            setBatch(b);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {batch ? <BatchSummaryCard batch={batch} /> : null}

        <Controller
          control={control}
          name="direction"
          render={({ field }) => (
            <SegmentedControl
              options={DIRECTION_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              style={styles.segmentSpacing}
            />
          )}
        />

        <Controller
          control={control}
          name="unit"
          render={({ field }) => (
            <SegmentedControl
              options={UNIT_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              style={styles.segmentSpacing}
            />
          )}
        />

        <Controller
          control={control}
          name="quantity"
          render={({ field }) => (
            <TextField
              label="Quantity"
              keyboardType="decimal-pad"
              value={field.value ? String(field.value) : ""}
              onChangeText={(t) => field.onChange(t.replace(",", "."))}
              error={errors.quantity?.message}
              placeholder="e.g. 1"
            />
          )}
        />

        <Controller
          control={control}
          name="reason"
          render={({ field }) => (
            <TextField
              label="Reason (required)"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.reason?.message}
              placeholder="e.g. Damaged in transit, recount correction…"
              multiline
              numberOfLines={2}
              style={styles.reasonInput}
            />
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <TextField
              label="Date (YYYY-MM-DD)"
              value={field.value}
              onChangeText={field.onChange}
              placeholder={todayStr()}
            />
          )}
        />

        {submitError ? (
          <Text color={colors.danger} style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}

        <Button label="Save Adjustment" onPress={handleSubmit(onSubmit)} disabled={isSubmitting} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  segmentSpacing: {
    marginBottom: spacing.md,
  },
  reasonInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  submitError: {
    marginBottom: spacing.md,
  },
});
