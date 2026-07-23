import { MovementUnit } from "@/types";
import { ValidationError } from "@/utils/errors";

export function assertPositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ValidationError(`${field} must be a positive number`);
  }
}

export function assertNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new ValidationError(`${field} must be zero or greater`);
  }
}

export function assertValidUnit(unit: string): asserts unit is MovementUnit {
  if (unit !== "kg" && unit !== "meter" && unit !== "tube") {
    throw new ValidationError(`Invalid unit: ${unit}`);
  }
}

export function assertNonEmpty(value: string | undefined, field: string): asserts value is string {
  if (!value || !value.trim()) {
    throw new ValidationError(`${field} is required`);
  }
}
