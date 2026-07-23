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
import { calcInventoryTotals, filterBatches, sortBatches } from "../src/utils/inventoryFilters";
import {
  groupByDiameter,
  groupByThickness,
  lowStockBatches,
  summarizeMovements,
} from "../src/utils/reports";

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

  // 12. Diameter search must work in either mm or inches (SPECS.md Section 7).
  await check("diameter search matches by mm and by inches", async () => {
    const batch400 = await services.batches.create({
      diameterMm: 400,
      thicknessMm: 8,
      tubeLengthM: 12,
      weightPerMeter: 59.7,
    });
    const batch300 = await services.batches.create({
      diameterMm: 300,
      thicknessMm: 6,
      tubeLengthM: 12,
      weightPerMeter: 44.7,
    });
    const all = await services.batches.list();

    const byMm = filterBatches(all, { query: "400" });
    assert.ok(byMm.some((b) => b.id === batch400.id));
    assert.ok(!byMm.some((b) => b.id === batch300.id));

    // 406.4mm ~= 16in
    const near16in = await services.batches.create({
      diameterMm: 406.4,
      thicknessMm: 8,
      tubeLengthM: 12,
      weightPerMeter: 60,
    });
    const allWith16 = await services.batches.list();
    const byInches = filterBatches(allWith16, { query: '16"' });
    assert.ok(byInches.some((b) => b.id === near16in.id));
  });

  // 13. "Available stock only" filter excludes zero-stock batches.
  await check('"available stock only" excludes empty batches', async () => {
    const empty = await services.batches.create({
      diameterMm: 250,
      thicknessMm: 5,
      tubeLengthM: 6,
      weightPerMeter: 30,
    });
    const all = await services.batches.list();
    const availableOnly = filterBatches(all, { availableOnly: true });
    assert.ok(!availableOnly.some((b) => b.id === empty.id));
  });

  // 14. Sorting by quantity ascending/descending orders correctly.
  await check("sortBatches orders by quantity in both directions", async () => {
    const all = await services.batches.list();
    const asc = sortBatches(all, "quantity", "asc");
    for (let i = 1; i < asc.length; i++) {
      assert.ok(asc[i - 1].quantity <= asc[i].quantity);
    }
    const desc = sortBatches(all, "quantity", "desc");
    for (let i = 1; i < desc.length; i++) {
      assert.ok(desc[i - 1].quantity >= desc[i].quantity);
    }
  });

  // 15. Totals add up across all batches (Dashboard/Inventory header numbers).
  await check("calcInventoryTotals sums batch/tube/length/weight correctly", async () => {
    const all = await services.batches.list();
    const totals = calcInventoryTotals(all);
    const expectedTubes = all.reduce((sum, b) => sum + b.quantity, 0);
    const expectedLength = all.reduce((sum, b) => sum + b.totalLength, 0);
    assert.equal(totals.batchCount, all.length);
    assert.ok(Math.abs(totals.tubeCount - expectedTubes) < 0.001);
    assert.ok(Math.abs(totals.totalLength - expectedLength) < 0.001);
  });

  // 16. An "increase" adjustment (positive signed quantity) actually adds stock.
  await check("increase adjustment adds stock", async () => {
    const before = await services.batches.get(batch.id);
    const { batch: afterIncrease } = await services.inventory.recordAdjustment({
      batchId: batch.id,
      quantity: 2,
      unit: "tube",
      reason: "Recount found 2 extra tubes",
    });
    assert.ok(afterIncrease.quantity > before.quantity);
  });

  // 17. Global movement listing (used by the Stock History screen) returns
  //     every movement across every batch, and type filtering works.
  await check("movements.list() returns all movements across all batches", async () => {
    const all = await services.movements.list();
    const allBatchIds = new Set((await services.batches.list()).map((b) => b.id));
    assert.ok(all.length > 0);
    assert.ok(all.every((m) => allBatchIds.has(m.batchId)));

    const onlyAdjustments = await services.movements.list({ type: "adjustment" });
    assert.ok(onlyAdjustments.every((m) => m.type === "adjustment"));
    assert.ok(onlyAdjustments.length < all.length);
  });

  // 18. Grouping by diameter combines batches of different thickness that
  //     share a diameter (SPECS.md Section 7's worked example).
  await check("groupByDiameter combines batches of the same diameter, any thickness", async () => {
    const repos = createMemoryRepositories();
    const reportServices = createServices(repos);
    const a = await reportServices.batches.create({
      diameterMm: 400,
      thicknessMm: 8,
      tubeLengthM: 12,
      weightPerMeter: 59.7,
    });
    const b = await reportServices.batches.create({
      diameterMm: 400,
      thicknessMm: 10,
      tubeLengthM: 6,
      weightPerMeter: 70,
    });
    await reportServices.inventory.recordAdjustment({
      batchId: a.id,
      quantity: 10,
      unit: "tube",
      reason: "seed",
    });
    await reportServices.inventory.recordAdjustment({
      batchId: b.id,
      quantity: 5,
      unit: "tube",
      reason: "seed",
    });
    const all = await reportServices.batches.list();
    const groups = groupByDiameter(all);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].diameterMm, 400);
    assert.equal(groups[0].batchCount, 2);
    assert.equal(groups[0].tubeCount, 15);
  });

  // 19. Low stock report excludes empty batches and batches above the threshold.
  await check("lowStockBatches only includes batches with 1..threshold stock", async () => {
    const repos = createMemoryRepositories();
    const reportServices = createServices(repos);
    const empty = await reportServices.batches.create({
      diameterMm: 100,
      thicknessMm: 4,
      tubeLengthM: 6,
      weightPerMeter: 10,
    });
    const low = await reportServices.batches.create({
      diameterMm: 150,
      thicknessMm: 4,
      tubeLengthM: 6,
      weightPerMeter: 12,
    });
    const healthy = await reportServices.batches.create({
      diameterMm: 200,
      thicknessMm: 5,
      tubeLengthM: 6,
      weightPerMeter: 15,
    });
    await reportServices.inventory.recordAdjustment({
      batchId: low.id,
      quantity: 3,
      unit: "tube",
      reason: "seed",
    });
    await reportServices.inventory.recordAdjustment({
      batchId: healthy.id,
      quantity: 50,
      unit: "tube",
      reason: "seed",
    });
    const all = await reportServices.batches.list();
    const low_stock = lowStockBatches(all, 5);
    assert.ok(low_stock.some((b) => b.id === low.id));
    assert.ok(!low_stock.some((b) => b.id === empty.id));
    assert.ok(!low_stock.some((b) => b.id === healthy.id));
  });

  // 20. Movement summaries sum recorded totalPrice correctly (purchases/sales report totals).
  await check("summarizeMovements sums totalPrice across movements", async () => {
    const repos = createMemoryRepositories();
    const reportServices = createServices(repos);
    const b = await reportServices.batches.create({
      diameterMm: 300,
      thicknessMm: 6,
      tubeLengthM: 12,
      weightPerMeter: 44.7,
    });
    await reportServices.inventory.recordPurchase({
      batchId: b.id,
      quantity: 10,
      unit: "tube",
      unitPrice: 4000,
    });
    await reportServices.inventory.recordPurchase({
      batchId: b.id,
      quantity: 5,
      unit: "tube",
      unitPrice: 4200,
    });
    const purchases = await reportServices.movements.list({ type: "purchase" });
    const summary = summarizeMovements(purchases);
    assert.equal(summary.count, 2);
    assert.equal(summary.totalValue, 10 * 4000 + 5 * 4200); // totalPrice = quantity * unitPrice, in the unit the movement was recorded in
  });

  // 18b. Grouping by thickness combines batches that share a thickness, any diameter.
  await check("groupByThickness combines batches of the same thickness, any diameter", async () => {
    const repos = createMemoryRepositories();
    const reportServices = createServices(repos);
    const a = await reportServices.batches.create({
      diameterMm: 300,
      thicknessMm: 8,
      tubeLengthM: 12,
      weightPerMeter: 44.7,
    });
    const b = await reportServices.batches.create({
      diameterMm: 500,
      thicknessMm: 8,
      tubeLengthM: 6,
      weightPerMeter: 80,
    });
    await reportServices.inventory.recordAdjustment({
      batchId: a.id,
      quantity: 4,
      unit: "tube",
      reason: "seed",
    });
    await reportServices.inventory.recordAdjustment({
      batchId: b.id,
      quantity: 6,
      unit: "tube",
      reason: "seed",
    });
    const all = await reportServices.batches.list();
    const groups = groupByThickness(all);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].thicknessMm, 8);
    assert.equal(groups[0].tubeCount, 10);
  });

  console.log(`\n${passed} check(s) passed.`);
  if (process.exitCode) {
    console.log("Some checks FAILED — see above.\n");
  } else {
    console.log("Engine is correct. Safe to build Phase 3 screens on top of it.\n");
  }
}

main();
