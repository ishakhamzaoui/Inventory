/**
 * Domain types. These mirror SPECS.md Section 3 exactly.
 * Phase 2 (Data & Business Logic) builds the services/models around these.
 */

export type PurchasePriceUnit = "per_kg" | "per_meter";

export interface Batch {
  id: string;
  diameterMm: number;
  thicknessMm: number;
  tubeLengthM: number;
  quantity: number; // integer, must never go negative
  weightPerMeter: number; // kg/m
  totalLength: number; // derived: tubeLengthM * quantity
  totalWeight: number; // derived: weightPerMeter * totalLength
  purchasePrice: number; // average price paid
  purchasePriceUnit: PurchasePriceUnit;
  supplier?: string;
  notes?: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export type MovementType = "purchase" | "sale" | "adjustment";
export type MovementUnit = "kg" | "meter" | "tube";

export interface Movement {
  id: string;
  batchId: string;
  type: MovementType;
  date: string; // ISO datetime
  quantity: number;
  unit: MovementUnit;
  unitPrice?: number;
  totalPrice?: number;
  reason?: string; // required for "adjustment" at the service/validation layer
}

export type DiameterUnit = "mm" | "in";
export type QuantityUnit = "kg" | "meter";

export interface Settings {
  diameterUnit: DiameterUnit;
  quantityUnit: QuantityUnit;
  currency: string; // default "DZD"
}
