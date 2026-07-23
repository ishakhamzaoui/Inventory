import { Batch, Movement } from "@/types";

interface GroupTotals {
  batchCount: number;
  tubeCount: number;
  totalLength: number;
  totalWeight: number;
}

export interface DiameterGroup extends GroupTotals {
  diameterMm: number;
}

export interface ThicknessGroup extends GroupTotals {
  thicknessMm: number;
}

function emptyTotals(): GroupTotals {
  return { batchCount: 0, tubeCount: 0, totalLength: 0, totalWeight: 0 };
}

/**
 * Groups batches by diameter, regardless of thickness — answers questions
 * like "total length of all 400mm tubes" straight from SPECS.md Section 7.
 */
export function groupByDiameter(batches: Batch[]): DiameterGroup[] {
  const map = new Map<number, DiameterGroup>();
  for (const b of batches) {
    const existing = map.get(b.diameterMm) ?? { diameterMm: b.diameterMm, ...emptyTotals() };
    existing.batchCount += 1;
    existing.tubeCount += b.quantity;
    existing.totalLength += b.totalLength;
    existing.totalWeight += b.totalWeight;
    map.set(b.diameterMm, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.diameterMm - b.diameterMm);
}

export function groupByThickness(batches: Batch[]): ThicknessGroup[] {
  const map = new Map<number, ThicknessGroup>();
  for (const b of batches) {
    const existing = map.get(b.thicknessMm) ?? { thicknessMm: b.thicknessMm, ...emptyTotals() };
    existing.batchCount += 1;
    existing.tubeCount += b.quantity;
    existing.totalLength += b.totalLength;
    existing.totalWeight += b.totalWeight;
    map.set(b.thicknessMm, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.thicknessMm - b.thicknessMm);
}

/** Batches with some stock, but at or below the threshold. Zero-stock batches aren't "low stock" — they're out. */
export function lowStockBatches(batches: Batch[], threshold = 5): Batch[] {
  return batches
    .filter((b) => b.quantity > 0 && b.quantity <= threshold)
    .sort((a, b) => a.quantity - b.quantity);
}

export interface MovementSummary {
  count: number;
  totalValue: number;
}

/** Sums the recorded totalPrice across a set of movements (e.g. all purchases, or all sales). */
export function summarizeMovements(movements: Movement[]): MovementSummary {
  return movements.reduce<MovementSummary>(
    (acc, m) => ({ count: acc.count + 1, totalValue: acc.totalValue + (m.totalPrice ?? 0) }),
    { count: 0, totalValue: 0 },
  );
}
