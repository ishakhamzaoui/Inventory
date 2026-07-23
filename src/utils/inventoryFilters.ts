import { Batch } from "@/types";
import { inchesToMm } from "@/utils/converters";

export interface InventoryFilters {
  /** Free-text search: matches diameter (mm or inches), thickness, length, or supplier. */
  query?: string;
  /** Only include batches with stock > 0. */
  availableOnly?: boolean;
}

export type SortField =
  "createdAt" | "diameterMm" | "thicknessMm" | "tubeLengthM" | "quantity" | "totalWeight";
export type SortDirection = "asc" | "desc";

const DIAMETER_TOLERANCE_MM = 0.5;

/**
 * Parses a diameter search term in either unit.
 * Accepts "400", "400mm", "16in", "16\"", "16 inches".
 */
export function parseDiameterQuery(query: string): { valueMm: number } | null {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return null;

  const inchMatch = trimmed.match(/^([\d.]+)\s*(in|"|inch|inches)$/);
  if (inchMatch) {
    const inches = parseFloat(inchMatch[1]);
    return Number.isNaN(inches) ? null : { valueMm: inchesToMm(inches) };
  }

  const mmMatch = trimmed.match(/^([\d.]+)\s*(mm)?$/);
  if (mmMatch) {
    const mm = parseFloat(mmMatch[1]);
    return Number.isNaN(mm) ? null : { valueMm: mm };
  }

  return null;
}

export function filterBatches(batches: Batch[], filters: InventoryFilters): Batch[] {
  return batches.filter((batch) => {
    if (filters.availableOnly && batch.quantity <= 0) return false;

    const query = filters.query?.trim().toLowerCase();
    if (query) {
      const diameterQuery = parseDiameterQuery(query);
      const matchesDiameter = diameterQuery
        ? Math.abs(batch.diameterMm - diameterQuery.valueMm) < DIAMETER_TOLERANCE_MM
        : false;
      const matchesSupplier = batch.supplier?.toLowerCase().includes(query) ?? false;
      const matchesThickness = String(batch.thicknessMm).includes(query);
      const matchesLength = String(batch.tubeLengthM).includes(query);

      if (!matchesDiameter && !matchesSupplier && !matchesThickness && !matchesLength) {
        return false;
      }
    }

    return true;
  });
}

export function sortBatches(batches: Batch[], field: SortField, direction: SortDirection): Batch[] {
  const sorted = [...batches].sort((a, b) => {
    const av = field === "createdAt" ? new Date(a.createdAt).getTime() : a[field];
    const bv = field === "createdAt" ? new Date(b.createdAt).getTime() : b[field];
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}

export interface InventoryTotals {
  batchCount: number;
  tubeCount: number;
  totalLength: number;
  totalWeight: number;
  inventoryValue: number;
}

function calcBatchValue(batch: Batch): number {
  const qtyInPriceUnit =
    batch.purchasePriceUnit === "per_kg" ? batch.totalWeight : batch.totalLength;
  return qtyInPriceUnit * batch.purchasePrice;
}

export function calcInventoryTotals(batches: Batch[]): InventoryTotals {
  return batches.reduce<InventoryTotals>(
    (acc, batch) => ({
      batchCount: acc.batchCount + 1,
      tubeCount: acc.tubeCount + batch.quantity,
      totalLength: acc.totalLength + batch.totalLength,
      totalWeight: acc.totalWeight + batch.totalWeight,
      inventoryValue: acc.inventoryValue + calcBatchValue(batch),
    }),
    { batchCount: 0, tubeCount: 0, totalLength: 0, totalWeight: 0, inventoryValue: 0 },
  );
}
