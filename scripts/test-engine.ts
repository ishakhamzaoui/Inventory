/**
 * Standalone engine test.
 *
 * Proves the Phase 2 inventory engine is correct — purchases, sales,
 * adjustments, stock validation, conversions, import/export — without
 * needing a device, simulator, or a single screen.
 *
 * Run with: npm run test:engine
 */
import assert from "node:assert/strict";
import { createMemoryRepositories } from "../src/repositories/memoryRepository";
import { createServices } from "../src/services/index";
import { InsufficientStockError, ValidationError } from "../src/utils/errors";
import { inchesToMm } from "../src/utils/converters";

let passed = 0;

async function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  ok  - ${name}`);
  } catch (err) {
    process.exitCode = 1;
    console.error(`FAIL - ${name}`);
    console.error(err);
  }
}

async function main() {
  const repos = createMemoryRepositories();
  const services = createServices(repos);

  // 1. A new batch starts at zero stock — nothing is sellable until a
  //    purchase (or adjustment) creates a movement backing it.
  const batch = await services.batches.create({
    diameterMm: 400,
    thicknessMm: 8,
    tubeLengthM: 12,
    weightPerMeter: 59.7,
    purchasePriceUnit: "per_meter",
    supplier: "ArcelorMittal",
  });
  await check("new batch starts at zero stock", () => {
    assert.equal(batch.quantity, 0);
    assert.equal(batch.totalLength, 0);
    assert.equal(batch.totalWeight, 0);
  });

  // 2. Purchase 30 whole tubes.
  const { batch: afterPurchase1 } = await services.inventory.recordPurchase({
    batchId: batch.id,
    quantity: 30,
    unit: "tube",
    unitPrice: 4500, // per meter
  });
  await check("purchase increases quantity and derives totals automatically", () => {
    assert.equal(afterPurchase1.quantity, 30);
    assert.equal(afterPurchase1.totalLength, 360); // 12m * 30
    assert.equal(Math.round(afterPurchase1.totalWeight), Math.round(59.7 * 360));
    assert.equal(afterPurchase1.purchasePrice, 4500);
  });

  // 3. A second purchase, in meters, at a different price -> weighted average.
  const { batch: afterPurchase2 } = await services.inventory.recordPurchase({
    batchId: batch.id,
    quantity: 120,
    unit: "meter",
    unitPrice: 5000,
  });
  await check("second purchase computes a correct weighted average price", () => {
    const expected = (360 * 4500 + 120 * 5000) / 480;
    assert.equal(Math.round(afterPurchase2.purchasePrice), Math.round(expected));
    assert.equal(afterPurchase2.totalLength, 480);
  });

  // 4. Sell by kg — must convert to meters/tubes automatically.
  const { batch: afterSale } = await services.inventory.recordSale({
    batchId: batch.id,
    quantity: 2000,
    unit: "kg",
    unitPrice: 6000,
  });
  await check("sale by kg converts through meters and decreases stock", () => {
    const soldMeters = 2000 / 59.7;
    const expectedLength = 480 - soldMeters;
    assert.ok(Math.abs(afterSale.totalLength - expectedLength) < 0.01);
  });

  // 5. Overselling is rejected, and must not mutate stock at all.
  await check("overselling is rejected and stock is left unchanged", async () => {
    const before = await services.batches.get(batch.id);
    await assert.rejects(
      () =>
        services.inventory.recordSale({
          batchId: batch.id,
          quantity: 999_999,
          unit: "kg",
          unitPrice: 6000,
        }),
      InsufficientStockError,
    );
    const after = await services.batches.get(batch.id);
    assert.equal(after.quantity, before.quantity);
  });

  // 6. Adjustments without a reason are rejected.
  await check("adjustment without a reason is rejected", async () => {
    await assert.rejects(
      () =>
        services.inventory.recordAdjustment({
          batchId: batch.id,
          quantity: -1,
          unit: "tube",
          reason: "",
        }),
      ValidationError,
    );
  });

  // 7. A valid adjustment (e.g. damage) decreases stock.
  const { batch: afterAdjustment } = await services.inventory.recordAdjustment({
    batchId: batch.id,
    quantity: -1,
    unit: "tube",
    reason: "1 tube damaged in transit",
  });
  await check("adjustment with a reason decreases stock", () => {
    assert.ok(afterAdjustment.quantity < afterSale.quantity);
  });

  // 8. Traceability: recomputing purely from movement history must match
  //    the cached quantity on the batch.
  await check("recomputed quantity from movements matches the live batch", async () => {
    const recomputed = await services.inventory.recomputeQuantityFromMovements(batch.id);
    const live = await services.batches.get(batch.id);
    assert.ok(Math.abs(recomputed - live.quantity) < 0.001);
  });

  // 9. Stock can never go negative via ANY movement type, on a fresh batch too.
  await check("a fresh batch can never be pushed negative via adjustment", async () => {
    const batch2 = await services.batches.create({
      diameterMm: 200,
      thicknessMm: 5,
      tubeLengthM: 6,
      weightPerMeter: 20,
      purchasePriceUnit: "per_kg",
    });
    await assert.rejects(() =>
      services.inventory.recordAdjustment({
        batchId: batch2.id,
        quantity: -1,
        unit: "tube",
        reason: "test",
      }),
    );
  });

  // 10. Export -> import round-trip preserves data, into a completely fresh store.
  await check("export -> import round-trip preserves data", async () => {
    const bundle = await services.importExport.exportAll();
    const freshServices = createServices(createMemoryRepositories());
    await freshServices.importExport.importAll(bundle);

    const restored = await freshServices.batches.list();
    assert.equal(restored.length, bundle.batches.length);
    const restoredBatch = restored.find((b) => b.id === batch.id);
    const originalBatch = bundle.batches.find((b) => b.id === batch.id);
    assert.ok(restoredBatch && originalBatch);
    assert.equal(restoredBatch!.quantity, originalBatch!.quantity);
  });

  // 11. Inches -> mm conversion, used by diameter input (SPECS.md Section 4).
  await check("inches to mm conversion is correct (16in -> 406.4mm)", () => {
    assert.ok(Math.abs(inchesToMm(16) - 406.4) < 0.001);
  });

  console.log(`\n${passed} check(s) passed.`);
  if (process.exitCode) {
    console.log("Some checks FAILED — see above.\n");
  } else {
    console.log("Engine is correct. Safe to build Phase 3 screens on top of it.\n");
  }
}

main();
