import { z } from "zod";

export const batchFormSchema = z.object({
  diameterValue: z.coerce.number().positive("Diameter must be greater than zero"),
  diameterUnit: z.enum(["mm", "in"]),
  thicknessMm: z.coerce.number().positive("Thickness must be greater than zero"),
  tubeLengthM: z.coerce.number().positive("Tube length must be greater than zero"),
  weightPerMeter: z.coerce.number().positive("Weight per meter must be greater than zero"),
  purchasePriceUnit: z.enum(["per_kg", "per_meter"]),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

export type BatchFormValues = z.infer<typeof batchFormSchema>;
