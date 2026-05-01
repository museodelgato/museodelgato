// Game tuning constants. Adjust here, no logic should hard-code these.

export const PLAYERS = 4;
export const ROUNDS = 4;
export const SEQ_LENGTH = 4;
export const PARTS = 4;

export const TIMINGS = {
  instructionsMs: 1000,
  countdownStepMs: 1000, // 3, 2, 1, GO — 4 steps
  iconShowMs: 800,
  iconGapMs: 500,
  inputWindowMs: 5000,
  winnerMs: 4000,
  finalMs: 3000,
} as const;

// Cat parts — minimal placeholder labels/colors. Will be replaced by real art.
export const PART_LABELS = ["OREJAS", "PATA", "CARA", "COLA"] as const;
export const PART_COLORS = [
  "#ec4899", // pink — orejas
  "#f59e0b", // amber — pata
  "#06b6d4", // cyan  — cara
  "#a855f7", // violet— cola
] as const;
