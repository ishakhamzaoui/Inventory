import type { SQLiteDatabase } from "expo-sqlite";
import { Batch, Movement, Settings } from "@/types";
import {
  BatchRepository,
  MovementFilter,
  MovementRepository,
  Repositories,
  SettingsRepository,
} from "@/repositories/types";

/**
 * expo-sqlite backed implementation of the repository interfaces.
 * This is the one the real app uses (wired up in App.tsx once the DB is ready).
 * See src/database/db.ts for schema creation.
 */
export function createSqliteRepositories(db: SQLiteDatabase): Repositories {
  const batchRepo: BatchRepository = {
    async create(batch) {
      await db.runAsync(
        `INSERT INTO batches
           (id, diameterMm, thicknessMm, tubeLengthM, quantity, weightPerMeter,
            totalLength, totalWeight, purchasePrice, purchasePriceUnit, supplier, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batch.id,
          batch.diameterMm,
          batch.thicknessMm,
          batch.tubeLengthM,
          batch.quantity,
          batch.weightPerMeter,
          batch.totalLength,
          batch.totalWeight,
          batch.purchasePrice,
          batch.purchasePriceUnit,
          batch.supplier ?? null,
          batch.notes ?? null,
          batch.createdAt,
          batch.updatedAt,
        ],
      );
    },
    async update(batch) {
      await db.runAsync(
        `UPDATE batches SET
           diameterMm = ?, thicknessMm = ?, tubeLengthM = ?, quantity = ?, weightPerMeter = ?,
           totalLength = ?, totalWeight = ?, purchasePrice = ?, purchasePriceUnit = ?,
           supplier = ?, notes = ?, updatedAt = ?
         WHERE id = ?`,
        [
          batch.diameterMm,
          batch.thicknessMm,
          batch.tubeLengthM,
          batch.quantity,
          batch.weightPerMeter,
          batch.totalLength,
          batch.totalWeight,
          batch.purchasePrice,
          batch.purchasePriceUnit,
          batch.supplier ?? null,
          batch.notes ?? null,
          batch.updatedAt,
          batch.id,
        ],
      );
    },
    async delete(id) {
      // ON DELETE CASCADE on movements.batchId handles the movement rows.
      await db.runAsync(`DELETE FROM batches WHERE id = ?`, [id]);
    },
    async findById(id) {
      const row = await db.getFirstAsync<Batch>(`SELECT * FROM batches WHERE id = ?`, [id]);
      return row ?? null;
    },
    async findAll() {
      return db.getAllAsync<Batch>(`SELECT * FROM batches ORDER BY createdAt DESC`);
    },
  };

  const movementRepo: MovementRepository = {
    async create(movement) {
      await db.runAsync(
        `INSERT INTO movements (id, batchId, type, date, quantity, unit, unitPrice, totalPrice, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movement.id,
          movement.batchId,
          movement.type,
          movement.date,
          movement.quantity,
          movement.unit,
          movement.unitPrice ?? null,
          movement.totalPrice ?? null,
          movement.reason ?? null,
        ],
      );
    },
    async findByBatchId(batchId) {
      return db.getAllAsync<Movement>(
        `SELECT * FROM movements WHERE batchId = ? ORDER BY date DESC`,
        [batchId],
      );
    },
    async findAll(filter?: MovementFilter) {
      const clauses: string[] = [];
      const params: (string | number)[] = [];
      if (filter?.batchId) {
        clauses.push("batchId = ?");
        params.push(filter.batchId);
      }
      if (filter?.type) {
        clauses.push("type = ?");
        params.push(filter.type);
      }
      if (filter?.fromDate) {
        clauses.push("date >= ?");
        params.push(filter.fromDate);
      }
      if (filter?.toDate) {
        clauses.push("date <= ?");
        params.push(filter.toDate);
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      return db.getAllAsync<Movement>(
        `SELECT * FROM movements ${where} ORDER BY date DESC`,
        params,
      );
    },
    async deleteByBatchId(batchId) {
      await db.runAsync(`DELETE FROM movements WHERE batchId = ?`, [batchId]);
    },
  };

  const settingsRepo: SettingsRepository = {
    async get() {
      const row = await db.getFirstAsync<Settings>(
        `SELECT diameterUnit, quantityUnit, currency FROM settings WHERE id = 1`,
      );
      return row ?? { diameterUnit: "mm", quantityUnit: "kg", currency: "DZD" };
    },
    async update(settings) {
      await db.runAsync(
        `UPDATE settings SET diameterUnit = ?, quantityUnit = ?, currency = ? WHERE id = 1`,
        [settings.diameterUnit, settings.quantityUnit, settings.currency],
      );
    },
  };

  return { batches: batchRepo, movements: movementRepo, settings: settingsRepo };
}
