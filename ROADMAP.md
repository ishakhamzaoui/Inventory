# Steel Tubes Inventory Manager — Development Roadmap (v1.0, Final)

Each phase ends with a working app. Build in this order — later phases
depend on earlier ones.

---

## Phase 1 — Foundation

**Goal:** A blank app that runs, navigates, and saves data.

- Expo + TypeScript project setup
- Folder structure, ESLint/Prettier, theme (colors/spacing/typography)
- Navigation
- SQLite storage configured
- State management (Zustand)
- Base reusable UI components

**Deliverable:** Empty app with working navigation and persistent storage.

---

## Phase 2 — Data & Business Logic

**Goal:** The inventory engine, with no UI yet.

- Tables: Batches, Movements, Settings
- Models: Batch, Movement, Settings
- Services: BatchService, MovementService, InventoryService,
  SettingsService, ImportExportService
- Core calculations: total length, total weight, kg ↔ meter conversion,
  average purchase price
- Validation: no negative stock, no invalid quantities

**Deliverable:** The engine can create, update, delete, and query inventory
correctly, provable with a simple test script — before any screen exists.

---

## Phase 3 — Inventory Management

**Goal:** View and manage batches.

- Screens: Inventory list, Batch details, Add/Edit/Delete batch
- Search, sort, filter, live totals

**Deliverable:** User can fully manage batches by hand.

---

## Phase 4 — Purchases & Sales

**Goal:** The two actions the owner uses every day.

- Purchase form → increases stock automatically
- Sale form (by kg / meter / whole tube) → decreases stock automatically
- Stock validation (blocks overselling)
- Purchase & sale history views

**Deliverable:** Buying and selling correctly update inventory, and stock
can never go negative.

---

## Phase 5 — Stock History & Adjustments

**Goal:** Every inventory change is traceable.

- Manual adjustment (increase/decrease with required reason)
- Unified movement timeline (purchase / sale / adjustment)
- Filter by batch, type, or date

**Deliverable:** Complete, auditable inventory history.

---

## Phase 6 — Dashboard, Search & Reports

**Goal:** Answer business questions at a glance.

- Dashboard cards: batch count, tube count, total weight, total length,
  inventory value + quick actions
- Advanced search/filter (diameter, thickness, length, supplier, stock)
- Reports: current inventory, purchases, sales, low stock, grouped by
  diameter/thickness

**Deliverable:** Owner can answer any "how much / how many" question in
seconds.

---

## Phase 7 — Import / Export & Settings

**Goal:** Backup, restore, and configuration.

- Export to JSON
- Import with validation + confirmation dialog (replaces current data)
- Settings: unit preferences, currency, about

**Deliverable:** Data can move between an Android phone and an iPhone.

---

## Phase 8 — Testing & Polish

**Goal:** Ship a stable, pleasant MVP.

- Test all core flows: add/edit/delete batch, buy/sell by kg and meter,
  conversions, validation edge cases, import/export round-trip
- UI polish: loading states, empty states, confirmation dialogs,
  success/error messages, spacing/icons pass

**Deliverable:** Production-ready MVP.

---

## Priority Reference

| Phase | Priority |
| --- | --- |
| 1. Foundation | 🔴 Critical |
| 2. Data & Business Logic | 🔴 Critical |
| 3. Inventory Management | 🔴 Critical |
| 4. Purchases & Sales | 🔴 Critical |
| 5. Stock History & Adjustments | 🟠 High |
| 6. Dashboard, Search & Reports | 🟠 High |
| 7. Import / Export & Settings | 🟡 Medium |
| 8. Testing & Polish | 🔴 Critical |

---

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
| File I/O | expo-file-system, expo-document-picker, expo-sharing |
| Icons | Expo Vector Icons |

---

## Why this order

Phases 1–2 build the engine before any screen exists — the math and data
rules are the hardest part to get wrong and the easiest to test in
isolation. Every phase after that is UI wrapped around an already-correct
engine, which keeps each milestone small and low-risk.
