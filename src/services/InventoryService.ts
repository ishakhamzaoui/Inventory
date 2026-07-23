import { Batch, Movement, MovementUnit } from "@/types";
import { BatchRepository, MovementRepository } from "@/repositories/types";
import { generateId } from "@/utils/id";
import {
  calcTotalLength,
  calcTotalWeight,
  calcWeightedAveragePrice,
  toMeters,
  toTubes,
} from "@/utils/calculations";
import { assertNonEmpty, assertPositive, assertValidUnit } from "@/utils/validation";
import { InsufficientStockError, NotFoundError, ValidationError } from "@/utils/errors";

export interface RecordPurchaseInput {
  batchId: string;
  quantity: number; // expressed in `unit`
  unit: MovementUnit;
  unitPrice: number;
  date?: string; // ISO datetime, defaults to now
}

export interface RecordSaleInput {
  batchId: string;
  quantity: number; // expressed in `unit`
  unit: MovementUnit;
  unitPrice?: number;
  date?: string;
}

export interface RecordAdjustmentInput {
  batchId: string;
  /** Expressed in `unit`. Signed: positive increases stock, negative decreases it. */
  quantity: number;
  unit: MovementUnit;
  reason: string;
  date?: string;
}

export interface MovementResult {
  batch: Batch;
  movement: Movement;
}

// Tolerance for floating point comparisons around the zero-stock boundary.
const STOCK_EPSILON = 1e-6;

/**
 * The inventory engine. This is the only place allowed to create movements
 * or change a batch's quantity/totals — every stock change goes through here
 * so "no negative stock" and "every change is a movement" can never be
 * bypassed by another part of the app (SPECS.md Section 5).
 */
export class InventoryService {
  constructor(
    private batchRepo: BatchRepository,
    private movementRepo: MovementRepository,
  ) {}

  async recordPurchase(input: RecordPurchaseInput): Promise<MovementResult> {
    assertValidUnit(input.unit);
    assertPositive(input.quantity, "quantity");
    assertPositive(input.unitPrice, "unitPrice");

    const batch = await this.getBatchOrThrow(input.batchId);
    const tubeDelta = toTubes(batch, input.quantity, input.unit);

    // Weighted average purchase price, computed in the batch's own price unit
    // (per_kg or per_meter) so it stays meaningful regardless of which unit
    // this particular purchase was recorded in.
    const priceUnit = batch.purchasePriceUnit;
    const existingQtyInPriceUnit = priceUnit === "per_kg" ? batch.totalWeight : batch.totalLength;
    const newMeters = toMeters(batch, input.quantity, input.unit);
    const newQtyInPriceUnit = priceUnit === "per_kg" ? newMeters * batch.weightPerMeter : newMeters;
    const nextPurchasePrice = calcWeightedAveragePrice(
      existingQtyInPriceUnit,
      batch.purchasePrice,
      newQtyInPriceUnit,
      input.unitPrice,
    );

    const movement: Movement = {
      id: generateId(),
      batchId: batch.id,
      type: "purchase",
      date: input.date ?? new Date().toISOString(),
      quantity: input.quantity,
      unit: input.unit,
      unitPrice: input.unitPrice,
      totalPrice: input.quantity * input.unitPrice,
    };
    await this.movementRepo.create(movement);

    const updatedBatch = await this.applyDelta(batch, tubeDelta, {
      purchasePrice: nextPurchasePrice,
    });
    return { batch: updatedBatch, movement };
  }

  async recordSale(input: RecordSaleInput): Promise<MovementResult> {
    assertValidUnit(input.unit);
    assertPositive(input.quantity, "quantity");

    const batch = await this.getBatchOrThrow(input.batchId);
    const tubeDelta = -toTubes(batch, input.quantity, input.unit);

    // Validate stock BEFORE writing anything, so a rejected sale never
    // leaves a dangling movement record behind.
    this.assertWontGoNegative(batch, tubeDelta, () => {
      throw new InsufficientStockError(
        `Cannot sell ${input.quantity} ${input.unit}: only ${batch.quantity} tube(s) equivalent in stock for batch ${batch.id}`,
      );
    });

    const movement: Movement = {
      id: generateId(),
      batchId: batch.id,
      type: "sale",
      date: input.date ?? new Date().toISOString(),
      quantity: input.quantity,
      unit: input.unit,
      unitPrice: input.unitPrice,
      totalPrice: input.unitPrice !== undefined ? input.quantity * input.unitPrice : undefined,
    };
    await this.movementRepo.create(movement);

    const updatedBatch = await this.applyDelta(batch, tubeDelta);
    return { batch: updatedBatch, movement };
  }

  async recordAdjustment(input: RecordAdjustmentInput): Promise<MovementResult> {
    assertValidUnit(input.unit);
    assertNonEmpty(input.reason, "reason");
    if (input.quantity === 0) {
      throw new ValidationError("Adjustment quantity cannot be zero");
    }

    const batch = await this.getBatchOrThrow(input.batchId);
    const tubeDelta = toTubes(batch, input.quantity, input.unit); // signed

    this.assertWontGoNegative(batch, tubeDelta, () => {
      throw new InsufficientStockError(`Adjustment would take batch ${batch.id} below zero stock`);
    });

    const movement: Movement = {
      id: generateId(),
      batchId: batch.id,
      type: "adjustment",
      date: input.date ?? new Date().toISOString(),
      quantity: input.quantity,
      unit: input.unit,
      reason: input.reason,
    };
    await this.movementRepo.create(movement);

    const updatedBatch = await this.applyDelta(batch, tubeDelta);
    return { batch: updatedBatch, movement };
  }

  /**
   * Recomputes a batch's quantity purely from its movement history, ignoring
   * the cached `quantity` field entirely. This should always agree with the
   * live value — it exists to prove (and let tests prove) that every number
   * traces back to a movement, per SPECS.md's "Traceable" design principle.
   */
  async recomputeQuantityFromMovements(batchId: string): Promise<number> {
    const batch = await this.getBatchOrThrow(batchId);
    const movements = await this.movementRepo.findByBatchId(batchId);
    let quantity = 0;
    for (const m of movements) {
      const tubes = toTubes(batch, m.quantity, m.unit);
      // purchase: always adds. sale: always removes. adjustment: quantity is
      // already signed (positive = increase, negative = decrease).
      quantity += m.type === "sale" ? -tubes : tubes;
    }
    return quantity;
  }

  private async getBatchOrThrow(batchId: string): Promise<Batch> {
    const batch = await this.batchRepo.findById(batchId);
    if (!batch) throw new NotFoundError(`Batch ${batchId} not found`);
    return batch;
  }

  private assertWontGoNegative(batch: Batch, tubeDelta: number, onViolation: () => never): void {
    if (batch.quantity + tubeDelta < -STOCK_EPSILON) {
      onViolation();
    }
  }

  private async applyDelta(
    batch: Batch,
    tubeDelta: number,
    extra: Partial<Batch> = {},
  ): Promise<Batch> {
    const nextQuantity = batch.quantity + tubeDelta;
    if (nextQuantity < -STOCK_EPSILON) {
      throw new InsufficientStockError(
        `Insufficient stock for batch ${batch.id}: has ${batch.quantity}, requested change ${tubeDelta}`,
      );
    }
    const quantity = Math.max(0, nextQuantity);
    const totalLength = calcTotalLength(batch.tubeLengthM, quantity);
    const totalWeight = calcTotalWeight(batch.weightPerMeter, totalLength);

    const updated: Batch = {
      ...batch,
      ...extra,
      quantity,
      totalLength,
      totalWeight,
      updatedAt: new Date().toISOString(),
    };
    await this.batchRepo.update(updated);
    return updated;
  }
}
