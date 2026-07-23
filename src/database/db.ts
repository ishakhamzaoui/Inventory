import * as SQLite from "expo-sqlite";

/**
 * Phase 1 scope: open the database and create the schema.
 * CRUD operations, services, and query logic belong in Phase 2 (services/).
 */

const DB_NAME = "inventory.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
    if (!dbInstance) {
        dbInstance = SQLite.openDatabaseSync(DB_NAME);
    }
    return dbInstance;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY NOT NULL,
  diameterMm REAL NOT NULL,
  thicknessMm REAL NOT NULL,
  tubeLengthM REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  weightPerMeter REAL NOT NULL,
  totalLength REAL NOT NULL DEFAULT 0,
  totalWeight REAL NOT NULL DEFAULT 0,
  purchasePrice REAL NOT NULL DEFAULT 0,
  purchasePriceUnit TEXT NOT NULL CHECK (purchasePriceUnit IN ('per_kg','per_meter')),
  supplier TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS movements (
  id TEXT PRIMARY KEY NOT NULL,
  batchId TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase','sale','adjustment')),
  date TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg','meter','tube')),
  unitPrice REAL,
  totalPrice REAL,
  reason TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  diameterUnit TEXT NOT NULL DEFAULT 'mm',
  quantityUnit TEXT NOT NULL DEFAULT 'kg',
  currency TEXT NOT NULL DEFAULT 'DZD'
);

INSERT OR IGNORE INTO settings (id, diameterUnit, quantityUnit, currency)
VALUES (1, 'mm', 'kg', 'DZD');
`;

export async function initDatabase(): Promise<void> {
  const db = getDb();
  await db.execAsync(SCHEMA);
}
