# Steel Tubes Inventory Manager

An offline-first mobile app for a small business that buys and sells steel
tubes. Built with React Native (Expo) + TypeScript + SQLite.

See [`SPECS.md`](./SPECS.md) for the full functional specification and
[`ROADMAP.md`](./ROADMAP.md) for the phased development plan.

## Status

**Phase 1 — Foundation: complete.**

- ✅ Expo + TypeScript project
- ✅ Folder structure, ESLint/Prettier, theme (colors/spacing/typography)
- ✅ Navigation (bottom tabs + inventory stack) with placeholder screens
- ✅ SQLite configured, schema created on launch
- ✅ Zustand store scaffolded
- ✅ Base reusable UI components (`Screen`, `Text`, `Button`, `Card`)

Next up: **Phase 2 — Data & Business Logic** (services, calculations,
validation) per `ROADMAP.md`.

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
  components/   reusable UI (Screen, Text, Button, Card, ...)
  constants/     theme.ts — colors, spacing, typography
  database/      SQLite setup and schema
  hooks/         shared React hooks (Phase 2+)
  navigation/    React Navigation tree
  screens/       one file per screen from SPECS.md Section 6
  services/      BatchService, MovementService, etc. (Phase 2+)
  store/         Zustand global state
  types/         Batch, Movement, Settings — mirrors SPECS.md Section 3
  utils/         unit converters, calculators (Phase 2+)
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
