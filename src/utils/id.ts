/**
 * RFC4122 v4-ish UUID generator with no native/runtime dependency.
 * Deliberately simple: it needs to run identically in the Expo/Hermes app
 * and in a plain Node test script (see scripts/test-engine.ts).
 */
export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
