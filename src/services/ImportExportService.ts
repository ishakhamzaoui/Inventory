import { Batch, Movement, Settings } from "@/types";
import { Repositories } from "@/repositories/types";
import { ValidationError } from "@/utils/errors";

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  batches: Batch[];
  movements: Movement[];
  settings: Settings;
}

/**
 * Full-database export/import, per SPECS.md Section 8.
 * Import always REPLACES current data — there is no merge logic in v1.
 * The actual file picker / share sheet is a Phase 7 concern; this service
 * only deals with the data, so it's fully testable without any file I/O.
 */
export class ImportExportService {
  constructor(private repos: Repositories) {}

  async exportAll(): Promise<ExportBundle> {
    const [batches, movements, settings] = await Promise.all([
      this.repos.batches.findAll(),
      this.repos.movements.findAll(),
      this.repos.settings.get(),
    ]);
    return { version: 1, exportedAt: new Date().toISOString(), batches, movements, settings };
  }

  async importAll(bundle: ExportBundle): Promise<void> {
    if (!bundle || bundle.version !== 1) {
      throw new ValidationError("Unsupported or invalid export file");
    }
    if (!Array.isArray(bundle.batches) || !Array.isArray(bundle.movements)) {
      throw new ValidationError("Export file is missing batches or movements");
    }

    const existingBatches = await this.repos.batches.findAll();
    for (const b of existingBatches) {
      await this.repos.batches.delete(b.id); // cascades movements too
    }
    for (const batch of bundle.batches) {
      await this.repos.batches.create(batch);
    }
    for (const movement of bundle.movements) {
      await this.repos.movements.create(movement);
    }
    if (bundle.settings) {
      await this.repos.settings.update(bundle.settings);
    }
  }
}
