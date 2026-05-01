"use client";

import { PARTS, PART_COLORS, PART_LABELS } from "../game/config";

interface Props {
  playerId: number;
  onPress: (playerId: number, partId: number) => void;
  disabled?: boolean;
  highlightDone?: boolean;
}

export function PlayerPad({ playerId, onPress, disabled, highlightDone }: Props) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
        highlightDone ? "border-emerald-400/60" : "border-white/10"
      } bg-white/[0.02]`}
    >
      <div className="text-xs uppercase tracking-widest text-white/60">
        Player {playerId + 1}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: PARTS }, (_, partId) => (
          <button
            key={partId}
            disabled={disabled}
            onClick={() => onPress(playerId, partId)}
            className="w-16 h-16 rounded-lg active:scale-95 transition-transform disabled:opacity-30 disabled:active:scale-100 text-[10px] font-bold tracking-widest"
            style={{
              background: PART_COLORS[partId],
              color: "#0b0b0f",
            }}
          >
            {PART_LABELS[partId]}
          </button>
        ))}
      </div>
    </div>
  );
}
