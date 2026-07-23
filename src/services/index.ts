import { Repositories } from "@/repositories/types";
import { BatchService } from "@/services/BatchService";
import { MovementService } from "@/services/MovementService";
import { InventoryService } from "@/services/InventoryService";
import { SettingsService } from "@/services/SettingsService";
import { ImportExportService } from "@/services/ImportExportService";

export interface Services {
  batches: BatchService;
  movements: MovementService;
  inventory: InventoryService;
  settings: SettingsService;
  importExport: ImportExportService;
}

/**
 * Wires services to a set of repositories. The app calls this with SQLite
 * repositories once the database is ready (see App.tsx); the test script
 * calls it with in-memory repositories instead. The services themselves
 * don't know or care which one they got.
 */
export function createServices(repos: Repositories): Services {
  return {
    batches: new BatchService(repos.batches),
    movements: new MovementService(repos.movements),
    inventory: new InventoryService(repos.batches, repos.movements),
    settings: new SettingsService(repos.settings),
    importExport: new ImportExportService(repos),
  };
}
