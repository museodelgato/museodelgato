"use client";

import { PARTS, PART_IMAGES, PART_LABELS } from "../game/config";

interface Props {
  playerId: number;
  onPress: (playerId: number, partId: number) => void;
  /**
   * Si está deshabilitado, el botón no acepta clicks — pero NO se muestra
   * visualmente como deshabilitado (sin opacity-30). Esto evita filtrar al
   * jugador si se equivocó o si ya terminó la ronda.
   */
  disabled?: boolean;
  /** partId actualmente highlighted (por press reciente). null = ninguno. */
  pressedPartId?: number | null;
}

export function PlayerPad({
  playerId,
  onPress,
  disabled,
  pressedPartId,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="text-xs uppercase tracking-widest text-white/60">
        Player {playerId + 1}
      </div>
      <div className="flex flex-row gap-2">
        {Array.from({ length: PARTS }, (_, partId) => {
          const isPressed = pressedPartId === partId;
          return (
            <button
              key={partId}
              disabled={disabled}
              onClick={() => onPress(playerId, partId)}
              aria-label={PART_LABELS[partId]}
              className={`w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center transition-all active:scale-95 ${
                isPressed ? "ring-4 ring-white scale-110" : ""
              }`}
            >
              <img
                src={PART_IMAGES[partId]}
                alt={PART_LABELS[partId]}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
