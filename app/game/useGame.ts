"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PARTS,
  PLAYERS,
  ROUNDS,
  SEQ_LENGTH,
  TIMINGS,
} from "./config";

export type Phase =
  | "standby"
  | "instructions"
  | "countdown"
  | "sequence"
  | "input"
  | "winner"
  | "final";

export interface PlayerRoundResult {
  correct: boolean;
  timeMs: number; // ms from input phase start to last correct press; inputWindowMs if failed/timeout
}

export interface GameState {
  phase: Phase;
  round: number; // 0..ROUNDS-1
  sequence: number[]; // current round sequence
  countdown: number; // 3,2,1,0(=GO); only meaningful in 'countdown'
  sequenceIndex: number; // index of currently displayed icon, -1 between icons
  inputRemainingMs: number; // 0..inputWindowMs
  results: PlayerRoundResult[][]; // [round][player]
  currentInputs: number[][]; // [player] inputs entered in current round
  playerDone: boolean[]; // locked for current round (finished correctly or wrong)
  winner: number | null;
}

/* -------------------------------------------------------------------------- */

const randomSequence = () =>
  Array.from({ length: SEQ_LENGTH }, () => Math.floor(Math.random() * PARTS));

const emptyInputs = () => Array.from({ length: PLAYERS }, () => [] as number[]);
const emptyDone = () => Array.from({ length: PLAYERS }, () => false);

const initialState = (): GameState => ({
  phase: "standby",
  round: 0,
  sequence: [],
  countdown: 3,
  sequenceIndex: -1,
  inputRemainingMs: TIMINGS.inputWindowMs,
  results: Array.from({ length: ROUNDS }, () =>
    Array.from({ length: PLAYERS }, () => ({
      correct: false,
      timeMs: TIMINGS.inputWindowMs,
    })),
  ),
  currentInputs: emptyInputs(),
  playerDone: emptyDone(),
  winner: null,
});

/* -------------------------------------------------------------------------- */

export function useGame() {
  const [state, setState] = useState<GameState>(initialState);

  // Mutable refs so timer callbacks read fresh values without re-subscribing.
  const stateRef = useRef(state);
  stateRef.current = state;

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputStartRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const schedule = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  /* ---------------- transitions ---------------- */

  const goToStandby = useCallback(() => {
    clearTimers();
    setState(initialState());
  }, [clearTimers]);

  const startGame = useCallback(() => {
    clearTimers();
    setState((s) => ({ ...s, phase: "instructions" }));
    schedule(TIMINGS.instructionsMs, () => startCountdown(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimers]);

  const startCountdown = (round: number) => {
    setState((s) => ({
      ...s,
      phase: "countdown",
      round,
      countdown: 3,
      sequence: randomSequence(),
      currentInputs: emptyInputs(),
      playerDone: emptyDone(),
      sequenceIndex: -1,
    }));
    // 3 -> 2 -> 1 -> GO -> sequence
    schedule(TIMINGS.countdownStepMs, () =>
      setState((s) => ({ ...s, countdown: 2 })),
    );
    schedule(TIMINGS.countdownStepMs * 2, () =>
      setState((s) => ({ ...s, countdown: 1 })),
    );
    schedule(TIMINGS.countdownStepMs * 3, () =>
      setState((s) => ({ ...s, countdown: 0 })),
    );
    schedule(TIMINGS.countdownStepMs * 4, () => startSequenceDisplay());
  };

  const startSequenceDisplay = () => {
    setState((s) => ({ ...s, phase: "sequence", sequenceIndex: -1 }));
    const step = TIMINGS.iconShowMs + TIMINGS.iconGapMs;
    for (let i = 0; i < SEQ_LENGTH; i++) {
      schedule(i * step, () =>
        setState((s) => ({ ...s, sequenceIndex: i })),
      );
      schedule(i * step + TIMINGS.iconShowMs, () =>
        setState((s) => ({ ...s, sequenceIndex: -1 })),
      );
    }
    schedule(SEQ_LENGTH * step, () => startInputPhase());
  };

  const startInputPhase = () => {
    inputStartRef.current = performance.now();
    setState((s) => ({
      ...s,
      phase: "input",
      inputRemainingMs: TIMINGS.inputWindowMs,
      currentInputs: emptyInputs(),
      playerDone: emptyDone(),
    }));

    intervalRef.current = setInterval(() => {
      const elapsed = performance.now() - inputStartRef.current;
      const remaining = Math.max(0, TIMINGS.inputWindowMs - elapsed);
      setState((s) => ({ ...s, inputRemainingMs: remaining }));
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        finishRound();
      }
    }, 50);
  };

  const finishRound = () => {
    clearTimers();
    const s = stateRef.current;
    // Players that didn't finish correctly get inputWindowMs penalty (already default).
    const nextRound = s.round + 1;
    if (nextRound >= ROUNDS) {
      schedule(0, () => computeWinner());
    } else {
      schedule(0, () => startCountdown(nextRound));
    }
  };

  const computeWinner = () => {
    const s = stateRef.current;
    const summary = Array.from({ length: PLAYERS }, (_, p) => {
      let correct = 0;
      let total = 0;
      for (let r = 0; r < ROUNDS; r++) {
        const res = s.results[r][p];
        if (res.correct) correct += 1;
        total += res.timeMs;
      }
      return { player: p, correct, total };
    });
    summary.sort((a, b) =>
      a.correct !== b.correct ? b.correct - a.correct : a.total - b.total,
    );
    // Find players tied at top.
    const top = summary.filter(
      (x) => x.correct === summary[0].correct && x.total === summary[0].total,
    );
    const winner = top[Math.floor(Math.random() * top.length)].player;

    setState((cs) => ({ ...cs, phase: "winner", winner }));
    schedule(TIMINGS.winnerMs, () => {
      setState((cs) => ({ ...cs, phase: "final" }));
      schedule(TIMINGS.finalMs, () => goToStandby());
    });
  };

  /* ---------------- input handlers ---------------- */

  const onPlayerInput = useCallback((playerId: number, partId: number) => {
    const s = stateRef.current;
    if (s.phase !== "input") return;
    if (s.playerDone[playerId]) return;

    const inputs = [...s.currentInputs[playerId], partId];
    const expected = s.sequence[inputs.length - 1];

    setState((cs) => {
      const newInputs = cs.currentInputs.map((arr, i) =>
        i === playerId ? inputs : arr,
      );
      const newDone = [...cs.playerDone];
      const newResults = cs.results.map((row) => row.slice());

      const wrong = partId !== expected;
      const finishedCorrect =
        !wrong && inputs.length === SEQ_LENGTH;

      if (wrong) {
        newDone[playerId] = true;
        newResults[cs.round][playerId] = {
          correct: false,
          timeMs: TIMINGS.inputWindowMs,
        };
      } else if (finishedCorrect) {
        newDone[playerId] = true;
        const elapsed = performance.now() - inputStartRef.current;
        newResults[cs.round][playerId] = {
          correct: true,
          timeMs: elapsed,
        };
      }

      // If everyone is done, end the round early.
      const allDone = newDone.every(Boolean);
      const next = {
        ...cs,
        currentInputs: newInputs,
        playerDone: newDone,
        results: newResults,
      };
      if (allDone) {
        // schedule round finish on next tick so React can flush state first
        queueMicrotask(() => finishRound());
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Tech (encargado) control. Single press in standby = start. Double press = reset to standby. */
  const lastTechPressRef = useRef<number>(0);
  const onTechInput = useCallback(() => {
    const now = performance.now();
    const isDouble = now - lastTechPressRef.current < 500;
    lastTechPressRef.current = now;

    if (isDouble) {
      goToStandby();
      return;
    }
    const s = stateRef.current;
    if (s.phase === "standby") {
      startGame();
    }
    // Otherwise: single press during a round is ignored. Reset is double-press.
  }, [goToStandby, startGame]);

  /* ---------------- expose to window for Arduino bridge ---------------- */

  useEffect(() => {
    // Single shared API. The Arduino integration (e.g. WebSerial bridge) should
    // call window.museoGato.playerInput(playerId, partId) and .techInput().
    (window as unknown as { museoGato: unknown }).museoGato = {
      playerInput: onPlayerInput,
      techInput: onTechInput,
    };
  }, [onPlayerInput, onTechInput]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return { state, onPlayerInput, onTechInput };
}
