# Steel Tubes Inventory Manager — Functional Specification (v1.0, Final)

Status: **Approved for development**
Scope: **MVP only** — see Section 9 for what is explicitly excluded.

---

## 1. Purpose

A mobile app for a small business that buys and sells steel tubes. It replaces
notebooks and spreadsheets with a simple, offline inventory tool.

**Non-negotiable constraints:**

- Runs fully offline, on-device. No accounts, no login, no internet required.
- One business, one user, one device at a time (multi-device via export/import only).
- Platforms: Android and iPhone.
- Stack: React Native (Expo) + TypeScript + SQLite.

---

## 2. Core Capabilities

The app must let the user:

1. Record purchases (stock in).
2. Record sales (stock out).
3. See current inventory at any time, automatically kept up to date.
4. Search/filter inventory by tube specs.
5. Auto-calculate total length, total weight, and kg ↔ meter conversions.
6. Adjust stock manually (damage, correction) with a required reason.
7. View a history of every stock change.
8. Export and import the full database as a single JSON file.

Anything not in this list is out of scope for v1 (Section 9).

---

## 3. Data Model

### Batch

A batch = a group of identical tubes (same diameter, thickness, and length).

|Field|Type|Notes|
|---|---|---|
|id|string|primary key|
|diameterMm|number|always stored in mm, even if entered in inches|
|thicknessMm|number||
|tubeLengthM|number|length of one tube, in meters|
|quantity|integer|number of tubes, must never go negative|
|weightPerMeter|number|kg/m, entered or calculated|
|totalLength|number|derived: `tubeLengthM × quantity`|
|totalWeight|number|derived: `weightPerMeter × totalLength`|
|purchasePrice|number|average price paid|
|purchasePriceUnit|enum|`per_kg` \| `per_meter`|
|supplier|string?|optional|
|notes|string?|optional|
|createdAt / updatedAt|datetime||

Two batches with different specs are always kept separate, even if the
difference is only thickness.

### Movement (history record)

|Field|Type|Notes|
|---|---|---|
|id|string|primary key|
|batchId|string||
|type|enum|`purchase` \| `sale` \| `adjustment`|
|date|datetime||
|quantity|number|in the unit below|
|unit|enum|`kg` \| `meter` \| `tube`|
|unitPrice|number?|not required for adjustments|
|totalPrice|number?||
|reason|string?|**required** for `adjustment`, optional otherwise|

Current inventory = sum of all movements per batch. Movements are the source
of truth; the batch's live totals are a cached projection of them.

### Settings

|Field|Default|
|---|---|
|diameterUnit|mm|
|quantityUnit|kg|
|currency|DZD|

---

## 4. Calculations (must be automatic, never manual)

- **Total Length** = `tubeLengthM × quantity`
- **Total Weight** = `weightPerMeter × totalLength`
- **Kg ↔ Meter conversion**, per batch, using `weightPerMeter`:
  - meters → kg: `meters × weightPerMeter`
  - kg → meters: `kg ÷ weightPerMeter`
- **Inches → mm** (diameter input only): `inches × 25.4`

Every converted value used in a transaction is stored on the movement record
itself, so historical reports never change if a batch's numbers are edited
later.

---

## 5. Business Rules

- **Stock can never go negative.** A sale or adjustment that would take a
  batch below zero must be rejected before it's saved.
- Every stock change (purchase, sale, adjustment) creates exactly one
  Movement record. No silent inventory edits.
- Manual adjustments always require a reason.
- Diameter search must work regardless of whether the user searches in mm
  or inches.
- Sales must support selling by kg, by meter, or by whole tube (whichever
  the batch owner prefers).

---

## 6. Screens (v1 set — no more, no less)

1. **Dashboard** — batch count, tube count, total weight, total length,
   estimated inventory value, quick actions (Add Purchase / Add Sale).
2. **Inventory** — list of batches, with search/filter/sort.
3. **Batch Details** — full batch info + its movement history.
4. **Add / Edit Batch**
5. **Add Purchase**
6. **Add Sale**
7. **Stock History** — all movements, filterable by type/date/batch.
8. **Reports** — current inventory, purchases, sales, low stock, grouped by
   diameter/thickness.
9. **Settings** — units, currency, export, import, about.

---

## 7. Search & Filters

Must support, individually or combined:

- Diameter (mm or inches)
- Thickness
- Length
- Supplier
- Available stock only

Example question the app must answer directly: *"Total length of all 400 mm
tubes, regardless of thickness."*

---

## 8. Import / Export

- **Export**: one JSON file containing all batches, movements, and settings.
- **Import**: user picks a JSON file → app validates it → user confirms →
  it **replaces** the current database. No merge logic in v1.

---

## 9. Explicitly Out of Scope for v1

Do not build these now — they may come later:

- Accounts / login / multi-user
- Cloud sync
- Barcode / QR scanning
- Invoice generation
- Supplier or customer management (beyond a free-text field)
- Profit analytics
- Multi-warehouse
- Printing, Excel/PDF export

---

## 10. Design Principles

- **Offline-first** — no backend dependency, ever.
- **Simple** — minimal taps for the two things the owner does all day:
  recording a purchase and recording a sale.
- **Automatic math** — the user should never need a calculator.
- **Traceable** — every number in the app can be traced back to a movement.
- **Portable** — one JSON file is the entire backup/restore mechanism.
