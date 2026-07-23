import { Batch, Movement, MovementType, Settings } from "@/types";

export interface MovementFilter {
  batchId?: string;
  type?: MovementType;
  fromDate?: string; // ISO datetime, inclusive
  toDate?: string; // ISO datetime, inclusive
}

export interface BatchRepository {
  create(batch: Batch): Promise<void>;
  update(batch: Batch): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Batch | null>;
  findAll(): Promise<Batch[]>;
}

export interface MovementRepository {
  create(movement: Movement): Promise<void>;
  findByBatchId(batchId: string): Promise<Movement[]>;
  findAll(filter?: MovementFilter): Promise<Movement[]>;
  deleteByBatchId(batchId: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  update(settings: Settings): Promise<void>;
}

/** Bundle of all three repositories — this is what gets injected into services. */
export interface Repositories {
  batches: BatchRepository;
  movements: MovementRepository;
  settings: SettingsRepository;
}
