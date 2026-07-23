/** SPECS.md Section 4 — Calculations. Pure, dependency-free, easy to unit test. */

export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function metersToKg(meters: number, weightPerMeter: number): number {
  return meters * weightPerMeter;
}

export function kgToMeters(kg: number, weightPerMeter: number): number {
  return kg / weightPerMeter;
}
