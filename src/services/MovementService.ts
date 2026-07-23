import { Movement } from "@/types";
import { MovementFilter, MovementRepository } from "@/repositories/types";

/**
 * Read-only access to movement history. Movements are only ever *created*
 * through InventoryService (recordPurchase/recordSale/recordAdjustment), so
 * that stock rules and traceability can't be bypassed by writing one directly.
 */
export class MovementService {
  constructor(private repo: MovementRepository) {}

  async listForBatch(batchId: string): Promise<Movement[]> {
    return this.repo.findByBatchId(batchId);
  }

  async list(filter?: MovementFilter): Promise<Movement[]> {
    return this.repo.findAll(filter);
  }
}
