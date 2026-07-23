import { Batch, PurchasePriceUnit } from "@/types";
import { BatchRepository } from "@/repositories/types";
import { generateId } from "@/utils/id";
import { calcTotalLength, calcTotalWeight } from "@/utils/calculations";
import { assertPositive } from "@/utils/validation";
import { NotFoundError } from "@/utils/errors";

export interface CreateBatchInput {
  diameterMm: number;
  thicknessMm: number;
  tubeLengthM: number;
  weightPerMeter: number;
  purchasePriceUnit?: PurchasePriceUnit; // defaults to "per_meter"
  supplier?: string;
  notes?: string;
}

export type UpdateBatchInput = Partial<CreateBatchInput>;

export class BatchService {
  constructor(private repo: BatchRepository) {}

  /**
   * Creates a batch. Stock always starts at zero — SPECS.md Section 3 states
   * movements are the source of truth for inventory, so there is no path to
   * create a batch with stock that isn't backed by a movement. To seed
   * existing/opening stock, create the batch, then record an adjustment with
   * a reason like "Initial stock count".
   */
  async create(input: CreateBatchInput): Promise<Batch> {
    assertPositive(input.diameterMm, "diameterMm");
    assertPositive(input.thicknessMm, "thicknessMm");
    assertPositive(input.tubeLengthM, "tubeLengthM");
    assertPositive(input.weightPerMeter, "weightPerMeter");

    const now = new Date().toISOString();
    const batch: Batch = {
      id: generateId(),
      diameterMm: input.diameterMm,
      thicknessMm: input.thicknessMm,
      tubeLengthM: input.tubeLengthM,
      quantity: 0,
      weightPerMeter: input.weightPerMeter,
      totalLength: 0,
      totalWeight: 0,
      purchasePrice: 0,
      purchasePriceUnit: input.purchasePriceUnit ?? "per_meter",
      supplier: input.supplier,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.create(batch);
    return batch;
  }

  async update(id: string, input: UpdateBatchInput): Promise<Batch> {
    const existing = await this.get(id);
    const next: Batch = { ...existing, ...input, updatedAt: new Date().toISOString() };

    if (input.diameterMm !== undefined) assertPositive(next.diameterMm, "diameterMm");
    if (input.thicknessMm !== undefined) assertPositive(next.thicknessMm, "thicknessMm");
    if (input.tubeLengthM !== undefined) assertPositive(next.tubeLengthM, "tubeLengthM");
    if (input.weightPerMeter !== undefined) assertPositive(next.weightPerMeter, "weightPerMeter");

    // Specs (tube length / weight per meter) can change after the fact —
    // re-derive totals from the current quantity so they never drift.
    next.totalLength = calcTotalLength(next.tubeLengthM, next.quantity);
    next.totalWeight = calcTotalWeight(next.weightPerMeter, next.totalLength);

    await this.repo.update(next);
    return next;
  }

  async delete(id: string): Promise<void> {
    await this.get(id); // throws NotFoundError if missing
    await this.repo.delete(id);
  }

  async get(id: string): Promise<Batch> {
    const batch = await this.repo.findById(id);
    if (!batch) throw new NotFoundError(`Batch ${id} not found`);
    return batch;
  }

  async list(): Promise<Batch[]> {
    return this.repo.findAll();
  }
}
