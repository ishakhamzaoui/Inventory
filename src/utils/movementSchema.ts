import { z } from "zod";

export const movementUnitSchema = z.enum(["kg", "meter", "tube"]);

export const purchaseFormSchema = z.object({
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: movementUnitSchema,
  unitPrice: z.coerce.number().positive("Unit price must be greater than zero"),
  date: z.string().optional(),
});
export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export const saleFormSchema = z.object({
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: movementUnitSchema,
  unitPrice: z.coerce.number().nonnegative("Unit price can't be negative").optional(),
  date: z.string().optional(),
});
export type SaleFormValues = z.infer<typeof saleFormSchema>;

export const adjustmentFormSchema = z.object({
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: movementUnitSchema,
  direction: z.enum(["increase", "decrease"]),
  reason: z.string().min(1, "A reason is required"),
  date: z.string().optional(),
});
export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

/** Turns a "YYYY-MM-DD" (or blank) form field into an ISO datetime, or undefined for "now". */
export function parseFormDate(value: string | undefined): string | undefined {
  if (!value || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
