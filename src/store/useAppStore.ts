import { create } from "zustand";
import { Settings } from "@/types";

/**
 * Phase 1 scope: store shape + basic app-readiness state only.
 * Batches/movements state and actions arrive in Phase 2, wired to the
 * services layer (not directly to the database).
 */

interface AppState {
  isDbReady: boolean;
  setDbReady: (ready: boolean) => void;

  settings: Settings;
  setSettings: (settings: Settings) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isDbReady: false,
  setDbReady: (ready) => set({ isDbReady: ready }),

  settings: {
    diameterUnit: "mm",
    quantityUnit: "kg",
    currency: "DZD",
  },
  setSettings: (settings) => set({ settings }),
}));
