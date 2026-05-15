"use client";

import { useEffect } from "react";

/**
 * Maps keyboard keys to (playerId, partId).
 * Layout matches the physical button grid:
 *
 *   1 2 3 4    -> P1
 *   Q W E R    -> P2
 *   A S D F    -> P3
 *   Z X C V    -> P4
 *   U I O P    -> P5  (provisional, mientras llegan los pads físicos)
 *
 *   SPACE / ENTER -> Tech (encargado)
 *
 * Use this with an Arduino Leonardo / Pro Micro / ESP32-S2/S3 running the
 * `arduino/hid_keyboard` sketch — the board acts as a USB keyboard, no
 * special drivers or browser permissions needed.
 */
export const KEY_MAP: Record<string, { player: number; part: number }> = {
  "1": { player: 0, part: 0 },
  "2": { player: 0, part: 1 },
  "3": { player: 0, part: 2 },
  "4": { player: 0, part: 3 },
  q: { player: 1, part: 0 },
  w: { player: 1, part: 1 },
  e: { player: 1, part: 2 },
  r: { player: 1, part: 3 },
  a: { player: 2, part: 0 },
  s: { player: 2, part: 1 },
  d: { player: 2, part: 2 },
  f: { player: 2, part: 3 },
  z: { player: 3, part: 0 },
  x: { player: 3, part: 1 },
  c: { player: 3, part: 2 },
  v: { player: 3, part: 3 },
  u: { player: 4, part: 0 },
  i: { player: 4, part: 1 },
  o: { player: 4, part: 2 },
  p: { player: 4, part: 3 },
};

export function useKeyboardInput(
  onPlayerInput: (player: number, part: number) => void,
  onTechInput: () => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      // Ignore key events while focused inside any input/textarea (future-proofing).
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === " " || key === "enter") {
        e.preventDefault();
        onTechInput();
        return;
      }
      const mapped = KEY_MAP[key];
      if (mapped) {
        e.preventDefault();
        onPlayerInput(mapped.player, mapped.part);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPlayerInput, onTechInput]);
}
