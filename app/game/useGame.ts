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
  currentInputs: number[][]; // [player] inputs entered in current round (solo los aceptados — se detiene al equivocarse)
  /**
   * Conteo total de presses por jugador en la ronda actual, INCLUYENDO las
   * que ocurren después de que el jugador se equivocó (cuando `playerDone`
   * lo bloquea de seguir avanzando en `currentInputs`). Sirve solo para
   * feedback visual: el chip se pone verde cuando este conteo llega a
   * SEQ_LENGTH, independiente de si el jugador acertó o falló.
   */
  pressCountsThisRound: number[];
  playerDone: boolean[]; // locked for current round (finished correctly or wrong)
  winner: number | null;
}

/* -------------------------------------------------------------------------- */

const randomSequence = () =>
  Array.from({ length: SEQ_LENGTH }, () => Math.floor(Math.random() * PARTS));

const emptyInputs = () => Array.from({ length: PLAYERS }, () => [] as number[]);
const emptyDone = () => Array.from({ length: PLAYERS }, () => false);
const emptyPressCounts = () => Array.from({ length: PLAYERS }, () => 0);

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
  pressCountsThisRound: emptyPressCounts(),
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
  // Evita agendar finishRound dos veces si llegan más presses después de que
  // todos los chips ya estaban verdes (durante el delay de 1s de gracia).
  const finishScheduledRef = useRef(false);

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
    // La transición a countdown la dispara el video de instrucciones cuando
    // termina (ver InstructionsScreen + onInstructionsEnded). Este schedule
    // es una red de seguridad: si el video falla en cargar o no dispara
    // onEnded por cualquier razón, igual avanzamos a los 60s para que el
    // juego no se quede colgado.
    schedule(TIMINGS.instructionsMaxMs, () => {
      if (stateRef.current.phase === "instructions") startCountdown(0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimers]);

  /** Llamado por InstructionsScreen cuando el video de instrucciones termina. */
  const onInstructionsEnded = useCallback(() => {
    if (stateRef.current.phase !== "instructions") return;
    clearTimers();
    startCountdown(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimers]);

  /** Llamado por CountdownScreen cuando el video de cuenta regresiva termina. */
  const onCountdownEnded = useCallback(() => {
    if (stateRef.current.phase !== "countdown") return;
    clearTimers();
    startSequenceDisplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimers]);

  /** Llamado por WinnerScreen cuando el video del ganador (playerN.mp4) termina. */
  const onWinnerEnded = useCallback(() => {
    if (stateRef.current.phase !== "winner") return;
    startFinalPhase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Llamado por FinalScreen cuando el video final (final.mp4) termina. */
  const onFinalEnded = useCallback(() => {
    if (stateRef.current.phase !== "final") return;
    goToStandby();
  }, [goToStandby]);

  const startCountdown = (round: number) => {
    setState((s) => ({
      ...s,
      phase: "countdown",
      round,
      countdown: 3, // legacy, ya no se usa visualmente (video reemplazó al texto)
      sequence: randomSequence(),
      currentInputs: emptyInputs(),
      pressCountsThisRound: emptyPressCounts(),
      playerDone: emptyDone(),
      sequenceIndex: -1,
    }));
    // La transición a sequence la dispara el video de cuenta regresiva
    // (ver CountdownScreen + onCountdownEnded). Fallback de seguridad por si
    // el video falla en cargar o no dispara onEnded.
    schedule(TIMINGS.countdownMaxMs, () => {
      if (stateRef.current.phase === "countdown") startSequenceDisplay();
    });
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
    finishScheduledRef.current = false;
    setState((s) => ({
      ...s,
      phase: "input",
      inputRemainingMs: TIMINGS.inputWindowMs,
      currentInputs: emptyInputs(),
      pressCountsThisRound: emptyPressCounts(),
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
    // La transición a "final" la dispara el video del ganador cuando
    // termina (ver WinnerScreen + onWinnerEnded). Fallback por si falla.
    schedule(TIMINGS.winnerMaxMs, () => {
      if (stateRef.current.phase === "winner") startFinalPhase();
    });
  };

  /**
   * Pasa a la fase "final" y agenda un fallback para volver a standby
   * por si el video de final falla en disparar onEnded.
   */
  const startFinalPhase = () => {
    clearTimers();
    setState((cs) => ({ ...cs, phase: "final" }));
    schedule(TIMINGS.finalMaxMs, () => {
      if (stateRef.current.phase === "final") goToStandby();
    });
  };

  /* ---------------- input handlers ---------------- */

  const onPlayerInput = useCallback((playerId: number, partId: number) => {
    const s = stateRef.current;
    if (s.phase !== "input") return;

    // Si el jugador ya está bloqueado (se equivocó antes) o ya terminó
    // correctamente, igual contamos el press para el feedback visual del
    // chip — el chip se pone verde a los 4 presses, independiente de si
    // los presses entraron a la lógica del juego.
    if (s.playerDone[playerId]) {
      setState((cs) => {
        const newPressCounts = cs.pressCountsThisRound.map((c, i) =>
          i === playerId ? c + 1 : c,
        );
        const allFinishedPressing = newPressCounts.every(
          (c) => c >= SEQ_LENGTH,
        );
        if (allFinishedPressing && !finishScheduledRef.current) {
          finishScheduledRef.current = true;
          // 1 segundo de gracia para que el usuario alcance a ver los 5
          // chips en verde antes de pasar a la siguiente pantalla.
          schedule(1000, () => finishRound());
        }
        return { ...cs, pressCountsThisRound: newPressCounts };
      });
      return;
    }

    const inputs = [...s.currentInputs[playerId], partId];
    const expected = s.sequence[inputs.length - 1];

    setState((cs) => {
      const newInputs = cs.currentInputs.map((arr, i) =>
        i === playerId ? inputs : arr,
      );
      const newDone = [...cs.playerDone];
      const newResults = cs.results.map((row) => row.slice());
      const newPressCounts = cs.pressCountsThisRound.map((c, i) =>
        i === playerId ? c + 1 : c,
      );

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

      // La ronda termina cuando todos los jugadores presionaron SEQ_LENGTH
      // veces (chip verde). Antes usábamos `playerDone.every(Boolean)`,
      // pero eso cierra la ronda en cuanto el último jugador en pendiente
      // se equivoca en su primer press (porque `playerDone` se marca true
      // tanto al fallar como al completar). Resultado: el jugador no
      // alcanzaba a meter sus 4 inputs si los demás ya estaban listos.
      const allFinishedPressing = newPressCounts.every(
        (c) => c >= SEQ_LENGTH,
      );
      const next = {
        ...cs,
        currentInputs: newInputs,
        pressCountsThisRound: newPressCounts,
        playerDone: newDone,
        results: newResults,
      };
      if (allFinishedPressing && !finishScheduledRef.current) {
        finishScheduledRef.current = true;
        // 1 segundo de gracia para que el usuario alcance a ver los 5
        // chips en verde antes de pasar a la siguiente pantalla.
        schedule(1000, () => finishRound());
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Tech (encargado) control — botón SPACE/ENTER del Arduino del encargado,
   * el botón "Tech" de la UI dev, o el botón JUGAR del standby.
   *
   * - Doble press (<500ms) en CUALQUIER fase: reset a standby.
   * - Press único: skip universal — avanza a la siguiente fase del FSM.
   *   - standby      → arranca el juego (instrucciones).
   *   - instructions → salta el video, va a countdown.
   *   - countdown    → salta el video, va a sequence.
   *   - sequence     → salta la randomización, va a input.
   *   - input        → termina la ronda (avanza a la siguiente o a winner).
   *   - winner       → salta al final.
   *   - final        → salta al standby.
   */
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
    switch (s.phase) {
      case "standby":
        startGame();
        break;
      case "instructions":
        onInstructionsEnded();
        break;
      case "countdown":
        onCountdownEnded();
        break;
      case "sequence":
        clearTimers();
        startInputPhase();
        break;
      case "input":
        // finishRound() internamente decide si va a la siguiente ronda o a
        // winner (si era la última). Limpia timers y intervals.
        finishRound();
        break;
      case "winner":
        onWinnerEnded();
        break;
      case "final":
        onFinalEnded();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    goToStandby,
    startGame,
    onInstructionsEnded,
    onCountdownEnded,
    onWinnerEnded,
    onFinalEnded,
    clearTimers,
  ]);

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

  return {
    state,
    onPlayerInput,
    onTechInput,
    onInstructionsEnded,
    onCountdownEnded,
    onWinnerEnded,
    onFinalEnded,
  };
}
