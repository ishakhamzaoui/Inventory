# Steel Tubes Inventory Manager

An offline-first mobile app for a small business that buys and sells steel
tubes. Built with React Native (Expo) + TypeScript + SQLite.

See [`SPECS.md`](./SPECS.md) for the full functional specification and
[`ROADMAP.md`](./ROADMAP.md) for the phased development plan.

## Status

**Phase 1 — Foundation: complete.**
**Phase 2 — Data & Business Logic: complete.**
**Phase 3 — Inventory Management: complete.**
**Phase 4 — Purchases & Sales: complete.**
**Phase 5 — Stock History & Adjustments: complete.**
**Phase 6 — Dashboard, Search & Reports: complete.**

Phase 1:

- ✅ Expo + TypeScript project
- ✅ Folder structure, ESLint/Prettier, theme (colors/spacing/typography)
- ✅ Navigation (bottom tabs + inventory stack) with placeholder screens
- ✅ SQLite configured, schema created on launch
- ✅ Zustand store scaffolded
- ✅ Base reusable UI components (`Screen`, `Text`, `Button`, `Card`)

Phase 2:

- ✅ Repository layer (`src/repositories`) — decouples business logic from
  storage, with a real SQLite implementation for the app and an in-memory
  one for tests
- ✅ Services (`src/services`): `BatchService`, `MovementService`,
  `InventoryService`, `SettingsService`, `ImportExportService`
- ✅ Calculations (`src/utils/calculations.ts`, `converters.ts`): total
  length/weight, kg ↔ meter conversion, inches ↔ mm, weighted average
  purchase price
- ✅ Validation (`src/utils/validation.ts`, `errors.ts`): no negative stock,
  no invalid quantities, adjustments require a reason
- ✅ Standalone engine test (`scripts/test-engine.ts`) — proves the whole
  engine works with **zero UI and zero device/simulator**

Phase 3:

- ✅ **Inventory** screen: search (diameter in mm or inches, thickness,
  length, supplier), sort (newest / diameter / stock, either direction),
  "available stock only" filter, live totals bar, pull-to-refresh, empty
  states, floating add button
- ✅ **Batch Details** screen: full spec sheet, live totals, average
  purchase price, and complete movement history for that batch
- ✅ **Add / Edit Batch** form: validated with Zod + React Hook Form,
  diameter entry in mm or inches, delete with a confirmation dialog
- ✅ Filtering/sorting/totals logic (`src/utils/inventoryFilters.ts`) is
  pure and covered by `test:engine` — no simulator needed to prove it's
  correct

Phase 4:

- ✅ **Add Purchase** form: quantity in tube/meter/kg, unit price, date —
  increases stock automatically via `InventoryService.recordPurchase`
- ✅ **Add Sale** form: same unit choices, optional selling price, blocks
  overselling with a clear "not enough stock" message instead of a crash
- ✅ Both screens work whether opened from a specific batch (via Batch
  Details) or on their own — in the latter case they show a searchable
  batch picker first
- ✅ Per-batch purchase/sale history is visible on Batch Details (built in
  Phase 3); the cross-batch, filterable timeline is Phase 5

Phase 5:

- ✅ **Adjust Stock** form: increase or decrease, in tube/meter/kg, with a
  **required** reason — the app won't let you save one blank
- ✅ **History** tab is now the real, unified movement timeline — every
  purchase, sale, and adjustment across every batch, newest first
- ✅ Filterable by type (all/buy/sell/adjust), by batch (search diameter,
  thickness, length, or supplier), and by date range
- ✅ `MovementRow` extracted as a shared component so Batch Details and the
  global timeline render movements identically

Phase 6:

- ✅ **Dashboard** tab: live totals (batches, tubes, length, weight,
  estimated inventory value in your currency) + quick actions (Add
  Purchase, Add Sale, View Inventory) that jump straight into the
  Inventory stack from another tab
- ✅ **Reports** tab: current inventory summary, purchases (count + total
  spent), sales (count + total revenue), low stock (≤5 tubes, excludes
  empty batches), grouped by diameter (any thickness) and grouped by
  thickness (any diameter) — the exact "400mm regardless of thickness"
  question from SPECS.md Section 7 is answerable in one glance
- ✅ Advanced search/filter (diameter in mm or inches, thickness, length,
  supplier, available-stock-only) was already built into the Inventory
  screen back in Phase 3 — nothing new needed there
- ✅ All report math (`src/utils/reports.ts`) is pure and covered by
  `test:engine`

Run the engine test yourself:

```bash
npm install
npm run test:engine
```

**One documented design decision:** a batch always starts at zero stock.
To seed opening inventory, create the batch, then record an adjustment
(e.g. reason: "Initial stock count"). This keeps SPECS.md's "movements are
the source of truth" rule true with no exceptions — every unit in the
system always traces back to a movement.

Next up: **Phase 7 — Import / Export & Settings** (JSON export/import with
a confirmation dialog, and the Settings screen for units/currency) per
`ROADMAP.md`.

## Getting Started

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS), or
press `a` / `i` to launch a simulator.

## Folder Structure

```text
src/
  components/    reusable UI (Screen, Text, Button, Card, TextField,
                 SegmentedControl, ...)
  constants/     theme.ts — colors, spacing, typography
  database/      SQLite setup and schema
  hooks/         shared React hooks (Phase 3+)
  navigation/    React Navigation tree
  repositories/  storage abstraction — sqliteRepository.ts (app) and
                 memoryRepository.ts (tests) implement the same interface
  screens/       one file per screen from SPECS.md Section 6
  services/      BatchService, MovementService, InventoryService,
                 SettingsService, ImportExportService
  store/         Zustand global state
  types/         Batch, Movement, Settings — mirrors SPECS.md Section 3
  utils/         calculations.ts, converters.ts, validation.ts, errors.ts
scripts/
  test-engine.ts standalone proof that the engine works — no UI needed
```

## Tech Stack

| Category | Choice |
| --- | --- |
| Framework | React Native + Expo |
| Language | TypeScript |
| Database | SQLite (expo-sqlite) |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Navigation | React Navigation |
| Dates | date-fns |
