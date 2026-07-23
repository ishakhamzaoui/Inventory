# Steel Tubes Inventory Manager

An offline-first mobile app for a small business that buys and sells steel
tubes. Built with React Native (Expo) + TypeScript + SQLite.

See [`SPECS.md`](./SPECS.md) for the full functional specification and
[`ROADMAP.md`](./ROADMAP.md) for the phased development plan.

## Status

**Phase 1 — Foundation: complete.**
**Phase 2 — Data & Business Logic: complete.**

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

Next up: **Phase 3 — Inventory Management** (the actual screens: list,
details, add/edit/delete) per `ROADMAP.md`.

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
  components/    reusable UI (Screen, Text, Button, Card, ...)
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
