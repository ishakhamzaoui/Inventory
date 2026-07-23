import { Batch, MovementUnit } from "@/types";
import { kgToMeters } from "@/utils/converters";

/** SPECS.md Section 4 — Total Length = tubeLengthM * quantity. */
export function calcTotalLength(tubeLengthM: number, quantity: number): number {
  return tubeLengthM * quantity;
}

/** SPECS.md Section 4 — Total Weight = weightPerMeter * totalLength. */
export function calcTotalWeight(weightPerMeter: number, totalLength: number): number {
  return weightPerMeter * totalLength;
}

type BatchSpecs = Pick<Batch, "tubeLengthM" | "weightPerMeter">;

/** Converts a quantity expressed in `unit` into meters, for a given batch's tube specs. */
export function toMeters(batch: BatchSpecs, quantity: number, unit: MovementUnit): number {
  switch (unit) {
    case "tube":
      return quantity * batch.tubeLengthM;
    case "meter":
      return quantity;
    case "kg":
      return kgToMeters(quantity, batch.weightPerMeter);
  }
}

/**
 * Converts a quantity expressed in `unit` into an equivalent tube count.
 * This is the common basis the engine uses to track stock (Batch.quantity),
 * regardless of which unit a purchase/sale/adjustment was recorded in.
 * Note: this can be fractional (e.g. selling a partial tube by weight) —
 * see InventoryService for how that's reconciled against SPECS.md's integer
 * `quantity` field.
 */
export function toTubes(batch: BatchSpecs, quantity: number, unit: MovementUnit): number {
  return toMeters(batch, quantity, unit) / batch.tubeLengthM;
}

/**
 * Weighted average price after adding a new purchase to existing stock.
 * existingQty/newQty must already be expressed in the same unit as the
 * batch's purchasePriceUnit (kg or meters) — see InventoryService.recordPurchase.
 */
export function calcWeightedAveragePrice(
  existingQty: number,
  existingAvgPrice: number,
  newQty: number,
  newPrice: number,
): number {
  const totalQty = existingQty + newQty;
  if (totalQty <= 0) return newPrice;
  return (existingQty * existingAvgPrice + newQty * newPrice) / totalQty;
}
