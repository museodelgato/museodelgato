"use client";

import { ROUNDS, SEQ_LENGTH, TIMINGS } from "../game/config";
import type { GameState } from "../game/useGame";
import { PartIcon } from "./PartIcon";

/* -------------------------------- Standby -------------------------------- */

export function StandbyScreen({ onTechPress }: { onTechPress: () => void }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-12">
      <h1 className="text-7xl font-bold tracking-tight">Museo del Gato</h1>
      <p className="text-xl text-white/60">Esperando jugadores...</p>
      <button
        onClick={onTechPress}
        className="px-16 py-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-3xl font-bold tracking-widest transition-colors"
      >
        JUGAR
      </button>
      <p className="text-xs text-white/30 mt-8">
        Encargado: 1 click = iniciar · 2 clicks = reset
      </p>
    </div>
  );
}

/* ----------------------------- Instructions ------------------------------ */

export function InstructionsScreen() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <h2 className="text-6xl font-bold">Instrucciones</h2>
    </div>
  );
}

/* ------------------------------ Countdown -------------------------------- */

export function CountdownScreen({ value, round }: { value: number; round: number }) {
  const label = value === 0 ? "¡INICIAR!" : String(value);
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8">
      <div className="text-sm uppercase tracking-widest text-white/40">
        Ronda {round + 1} de {ROUNDS}
      </div>
      <div className="text-9xl font-bold">{label}</div>
    </div>
  );
}

/* ------------------------------ Sequence --------------------------------- */

export function SequenceScreen({ state }: { state: GameState }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-12">
      <div className="text-sm uppercase tracking-widest text-white/40">
        Memoriza la secuencia · Ronda {state.round + 1}/{ROUNDS}
      </div>
      <div className="h-72 flex items-center justify-center">
        {state.sequenceIndex >= 0 ? (
          <PartIcon part={state.sequence[state.sequenceIndex]} size="xl" />
        ) : (
          <div className="w-64 h-64" />
        )}
      </div>
      <div className="flex gap-3">
        {Array.from({ length: SEQ_LENGTH }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i <= state.sequenceIndex ? "bg-white" : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Input ---------------------------------- */

export function InputScreen({ state }: { state: GameState }) {
  const seconds = (state.inputRemainingMs / 1000).toFixed(1);
  const pct = (state.inputRemainingMs / TIMINGS.inputWindowMs) * 100;
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-10">
      <div className="text-sm uppercase tracking-widest text-white/40">
        ¡Repite la secuencia! · Ronda {state.round + 1}/{ROUNDS}
      </div>
      <div className="text-8xl font-bold tabular-nums">{seconds}s</div>
      <div className="w-2/3 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 transition-[width] duration-75 linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-3 mt-4">
        {state.playerDone.map((done, i) => (
          <div
            key={i}
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              done ? "bg-emerald-500/30 text-emerald-300" : "bg-white/5 text-white/40"
            }`}
          >
            P{i + 1} {done ? "✓" : "..."}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Winner --------------------------------- */

export function WinnerScreen({ winner, state }: { winner: number; state: GameState }) {
  const summary = state.results.reduce(
    (acc, round) => {
      round.forEach((r, p) => {
        if (r.correct) {
          acc[p].correct += 1;
          acc[p].total += r.timeMs;
        }
      });
      return acc;
    },
    Array.from({ length: 4 }, () => ({ correct: 0, total: 0 })),
  );

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-10">
      <div className="text-2xl uppercase tracking-widest text-white/50">
        Ganador
      </div>
      <div className="text-9xl font-bold text-emerald-400">
        Player {winner + 1}
      </div>
      <div className="grid grid-cols-4 gap-4 mt-8">
        {summary.map((s, i) => (
          <div
            key={i}
            className={`px-4 py-3 rounded-lg text-center ${
              i === winner ? "bg-emerald-500/20 border border-emerald-400/40" : "bg-white/5"
            }`}
          >
            <div className="text-xs text-white/50">P{i + 1}</div>
            <div className="text-sm font-bold">{s.correct}/4 ok</div>
            <div className="text-xs text-white/60 tabular-nums">
              {s.correct > 0 ? (s.total / 1000).toFixed(2) + "s" : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Final --------------------------------- */

export function FinalScreen() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="text-5xl font-bold text-white/70">Video final</div>
    </div>
  );
}
