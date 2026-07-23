import { Batch, Movement, Settings } from "@/types";
import {
  BatchRepository,
  MovementFilter,
  MovementRepository,
  Repositories,
  SettingsRepository,
} from "@/repositories/types";

/**
 * Pure in-memory implementation of the repository interfaces.
 * Has no native or React Native dependency, so it can run under plain Node —
 * this is what makes the engine testable via `npm run test:engine`.
 */
export function createMemoryRepositories(): Repositories {
  const batches = new Map<string, Batch>();
  const movements: Movement[] = [];
  let settings: Settings = { diameterUnit: "mm", quantityUnit: "kg", currency: "DZD" };

  const batchRepo: BatchRepository = {
    async create(batch) {
      batches.set(batch.id, { ...batch });
    },
    async update(batch) {
      if (!batches.has(batch.id)) {
        throw new Error(`Batch ${batch.id} not found`);
      }
      batches.set(batch.id, { ...batch });
    },
    async delete(id) {
      batches.delete(id);
      for (let i = movements.length - 1; i >= 0; i--) {
        if (movements[i].batchId === id) movements.splice(i, 1);
      }
    },
    async findById(id) {
      return batches.get(id) ?? null;
    },
    async findAll() {
      return Array.from(batches.values());
    },
  };

  const movementRepo: MovementRepository = {
    async create(movement) {
      movements.push({ ...movement });
    },
    async findByBatchId(batchId) {
      return movements.filter((m) => m.batchId === batchId);
    },
    async findAll(filter?: MovementFilter) {
      return movements.filter((m) => {
        if (filter?.batchId && m.batchId !== filter.batchId) return false;
        if (filter?.type && m.type !== filter.type) return false;
        if (filter?.fromDate && m.date < filter.fromDate) return false;
        if (filter?.toDate && m.date > filter.toDate) return false;
        return true;
      });
    },
    async deleteByBatchId(batchId) {
      for (let i = movements.length - 1; i >= 0; i--) {
        if (movements[i].batchId === batchId) movements.splice(i, 1);
      }
    },
  };

  const settingsRepo: SettingsRepository = {
    async get() {
      return settings;
    },
    async update(next) {
      settings = next;
    },
  };

  return { batches: batchRepo, movements: movementRepo, settings: settingsRepo };
}
