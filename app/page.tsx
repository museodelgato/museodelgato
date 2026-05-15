"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PART_LABELS, PLAYERS } from "./game/config";
import { useGame } from "./game/useGame";
import { useKeyboardInput } from "./game/useKeyboardInput";
import { PlayerPad } from "./components/PlayerPad";
import { KeyLegend, SerialConnectButton } from "./components/InputBridges";
import {
  CountdownScreen,
  FinalScreen,
  InputScreen,
  InstructionsScreen,
  SequenceScreen,
  StandbyScreen,
  WinnerScreen,
} from "./components/screens";

const HIGHLIGHT_MS = 200;

/**
 * Devuelve true si la URL contiene ?kiosk=1 (modo museo).
 *
 * Default = false (modo desarrollo): la UI de debug queda visible — pads
 * on-screen, botón Hide pads, Fullscreen, Tech, Conectar Arduino, KeyLegend.
 *
 * En la PC del museo, el `.bat` de arranque abre la URL con `?kiosk=1` y
 * todo eso se oculta, dejando solo el juego. Ver `kiosk/start-kiosk-loop.bat`.
 */
function useKioskMode() {
  const [kioskMode, setKioskMode] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setKioskMode(params.get("kiosk") === "1");
  }, []);
  return kioskMode;
}

export default function Page() {
  const {
    state,
    onPlayerInput,
    onTechInput,
    onInstructionsEnded,
    onCountdownEnded,
    onWinnerEnded,
    onFinalEnded,
  } = useGame();
  const kioskMode = useKioskMode();
  const [showSimulator, setShowSimulator] = useState(true);

  // Botón actualmente "presionado" por jugador, para feedback visual.
  // null = sin highlight. Se limpia automáticamente después de HIGHLIGHT_MS.
  const [pressedByPlayer, setPressedByPlayer] = useState<(number | null)[]>(
    () => Array.from({ length: PLAYERS }, () => null),
  );
  const clearTimeoutsRef = useRef<(ReturnType<typeof setTimeout> | null)[]>(
    Array.from({ length: PLAYERS }, () => null),
  );

  // Wrapper que (a) loguea cada press para debug, (b) activa el highlight visual,
  // (c) delega al dispatcher del juego. Ejecuta SIEMPRE, sin importar la fase.
  const handlePlayerInput = useCallback(
    (playerId: number, partId: number) => {
      console.log(
        `Player ${playerId + 1}, Botón ${partId + 1} (${PART_LABELS[partId] ?? "?"})`,
      );

      setPressedByPlayer((prev) => {
        const next = [...prev];
        next[playerId] = partId;
        return next;
      });

      const prevTimeout = clearTimeoutsRef.current[playerId];
      if (prevTimeout) clearTimeout(prevTimeout);
      clearTimeoutsRef.current[playerId] = setTimeout(() => {
        setPressedByPlayer((prev) => {
          const next = [...prev];
          next[playerId] = null;
          return next;
        });
        clearTimeoutsRef.current[playerId] = null;
      }, HIGHLIGHT_MS);

      onPlayerInput(playerId, partId);
    },
    [onPlayerInput],
  );

  // HID keyboard path: works automatically once the Arduino is plugged in.
  // The on-screen pads and the keyboard share the same dispatcher.
  useKeyboardInput(handlePlayerInput, onTechInput);

  const goFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // El video de fondo de las fases sequence + input debe ser CONTINUO entre
  // las dos fases (no debe reiniciarse al pasar de sequence → input). Para
  // eso, lo renderizamos a este nivel — un solo <video> queda montado
  // durante ambas fases y se desmonta solo cuando aparece countdown o winner.
  const showSeqBackground =
    state.phase === "sequence" || state.phase === "input";

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background loop de las rondas — persistente sequence↔input. */}
      {showSeqBackground && (
        <video
          src="/videos/fondo-rondas.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* main stage */}
      <div className="absolute inset-0">
        {state.phase === "standby" && <StandbyScreen onTechPress={onTechInput} />}
        {state.phase === "instructions" && (
          <InstructionsScreen onEnded={onInstructionsEnded} />
        )}
        {state.phase === "countdown" && (
          <CountdownScreen onEnded={onCountdownEnded} />
        )}
        {state.phase === "sequence" && <SequenceScreen state={state} />}
        {state.phase === "input" && <InputScreen state={state} />}
        {state.phase === "winner" && state.winner !== null && (
          <WinnerScreen winner={state.winner} onEnded={onWinnerEnded} />
        )}
        {state.phase === "final" && <FinalScreen onEnded={onFinalEnded} />}
      </div>

      {/* dev controls — visibles por default. En kiosko (?kiosk=1): ocultos. */}
      {!kioskMode && (
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-50">
          <div className="flex gap-2">
            <button
              onClick={() => setShowSimulator((v) => !v)}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs"
            >
              {showSimulator ? "Hide pads" : "Show pads"}
            </button>
            <button
              onClick={goFullscreen}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs"
            >
              Fullscreen
            </button>
            <button
              onClick={onTechInput}
              className="px-2 py-1 rounded bg-amber-400/20 hover:bg-amber-400/40 text-xs"
              title="Simula el botón del encargado"
            >
              Tech
            </button>
            <SerialConnectButton
              onPlayerInput={handlePlayerInput}
              onTechInput={onTechInput}
            />
          </div>
          <KeyLegend />
        </div>
      )}

      {/* on-screen player pads (mouse simulator) — visibles por default */}
      {!kioskMode && showSimulator && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-40">
          {Array.from({ length: PLAYERS }, (_, i) => (
            <PlayerPad
              key={i}
              playerId={i}
              onPress={handlePlayerInput}
              disabled={state.phase !== "input" || state.playerDone[i]}
              pressedPartId={pressedByPlayer[i]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
