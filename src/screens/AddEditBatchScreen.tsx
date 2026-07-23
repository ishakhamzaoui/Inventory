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
import { colors, spacing } from "@/constants/theme";
import { getServices } from "@/services/container";
import { batchFormSchema, BatchFormValues } from "@/utils/batchSchema";
import { inchesToMm } from "@/utils/converters";
import type { InventoryStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<InventoryStackParamList, "AddEditBatch">;
type Route = { params: InventoryStackParamList["AddEditBatch"] };

const DEFAULT_VALUES: BatchFormValues = {
  diameterValue: 0,
  diameterUnit: "mm",
  thicknessMm: 0,
  tubeLengthM: 0,
  weightPerMeter: 0,
  purchasePriceUnit: "per_meter",
  supplier: "",
  notes: "",
};

export function AddEditBatchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as Route;
  const batchId = route.params?.batchId;
  const isEditing = Boolean(batchId);

  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? "Edit Batch" : "Add Batch" });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (!batchId) return;
    getServices()
      .batches.get(batchId)
      .then((batch) => {
        reset({
          diameterValue: batch.diameterMm,
          diameterUnit: "mm",
          thicknessMm: batch.thicknessMm,
          tubeLengthM: batch.tubeLengthM,
          weightPerMeter: batch.weightPerMeter,
          purchasePriceUnit: batch.purchasePriceUnit,
          supplier: batch.supplier ?? "",
          notes: batch.notes ?? "",
        });
      })
      .catch((e) => setSubmitError(e instanceof Error ? e.message : "Failed to load batch"))
      .finally(() => setLoadingExisting(false));
  }, [batchId, reset]);

  const onSubmit = async (values: BatchFormValues) => {
    setSubmitError(null);
    const diameterMm =
      values.diameterUnit === "in" ? inchesToMm(values.diameterValue) : values.diameterValue;

    const input = {
      diameterMm,
      thicknessMm: values.thicknessMm,
      tubeLengthM: values.tubeLengthM,
      weightPerMeter: values.weightPerMeter,
      purchasePriceUnit: values.purchasePriceUnit,
      supplier: values.supplier?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    };

    try {
      const services = getServices();
      if (batchId) {
        await services.batches.update(batchId, input);
      } else {
        await services.batches.create(input);
      }
      navigation.goBack();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save batch");
    }
  };

  if (loadingExisting) {
    return (
      <Screen>
        <Text color={colors.textSecondary}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="caption" color={colors.textSecondary} style={styles.sectionLabel}>
          Diameter
        </Text>
        <Controller
          control={control}
          name="diameterUnit"
          render={({ field }) => (
            <SegmentedControl
              options={[
                { label: "mm", value: "mm" },
                { label: "in", value: "in" },
              ]}
              value={field.value}
              onChange={field.onChange}
              style={styles.segmentSpacing}
            />
          )}
        />
        <Controller
          control={control}
          name="diameterValue"
          render={({ field }) => (
            <TextField
              label="Diameter value"
              keyboardType="decimal-pad"
              value={field.value ? String(field.value) : ""}
              onChangeText={(t) => field.onChange(t.replace(",", "."))}
              error={errors.diameterValue?.message}
              placeholder="e.g. 400"
            />
          )}
        />

        <Controller
          control={control}
          name="thicknessMm"
          render={({ field }) => (
            <TextField
              label="Wall thickness (mm)"
              keyboardType="decimal-pad"
              value={field.value ? String(field.value) : ""}
              onChangeText={(t) => field.onChange(t.replace(",", "."))}
              error={errors.thicknessMm?.message}
              placeholder="e.g. 8"
            />
          )}
        />

        <Controller
          control={control}
          name="tubeLengthM"
          render={({ field }) => (
            <TextField
              label="Length per tube (m)"
              keyboardType="decimal-pad"
              value={field.value ? String(field.value) : ""}
              onChangeText={(t) => field.onChange(t.replace(",", "."))}
              error={errors.tubeLengthM?.message}
              placeholder="e.g. 12"
            />
          )}
        />

        <Controller
          control={control}
          name="weightPerMeter"
          render={({ field }) => (
            <TextField
              label="Weight per meter (kg/m)"
              keyboardType="decimal-pad"
              value={field.value ? String(field.value) : ""}
              onChangeText={(t) => field.onChange(t.replace(",", "."))}
              error={errors.weightPerMeter?.message}
              placeholder="e.g. 59.7"
            />
          )}
        />

        <Text variant="caption" color={colors.textSecondary} style={styles.sectionLabel}>
          Purchase price is tracked per
        </Text>
        <Controller
          control={control}
          name="purchasePriceUnit"
          render={({ field }) => (
            <SegmentedControl
              options={[
                { label: "Meter", value: "per_meter" },
                { label: "Kg", value: "per_kg" },
              ]}
              value={field.value}
              onChange={field.onChange}
              style={styles.segmentSpacing}
            />
          )}
        />

        <Controller
          control={control}
          name="supplier"
          render={({ field }) => (
            <TextField
              label="Supplier (optional)"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="e.g. ArcelorMittal"
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <TextField
              label="Notes (optional)"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          )}
        />

        {!isEditing ? (
          <Text variant="caption" color={colors.textMuted} style={styles.hint}>
            New batches start at zero stock. Record a purchase (or an adjustment for existing stock)
            afterwards to bring it into inventory.
          </Text>
        ) : null}

        {submitError ? (
          <Text color={colors.danger} style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}

        <Button
          label={isEditing ? "Save Changes" : "Add Batch"}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  segmentSpacing: {
    marginBottom: spacing.md,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  hint: {
    marginBottom: spacing.md,
  },
  submitError: {
    marginBottom: spacing.md,
  },
});
