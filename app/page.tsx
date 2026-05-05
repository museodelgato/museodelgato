"use client";

import { useState } from "react";
import { PLAYERS } from "./game/config";
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

export default function Page() {
  const { state, onPlayerInput, onTechInput } = useGame();
  const [showSimulator, setShowSimulator] = useState(true);

  // HID keyboard path: works automatically once the Arduino is plugged in.
  // The on-screen pads and the keyboard share the same dispatcher.
  useKeyboardInput(onPlayerInput, onTechInput);

  const goFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* main stage */}
      <div className="absolute inset-0">
        {state.phase === "standby" && <StandbyScreen onTechPress={onTechInput} />}
        {state.phase === "instructions" && <InstructionsScreen />}
        {state.phase === "countdown" && (
          <CountdownScreen value={state.countdown} round={state.round} />
        )}
        {state.phase === "sequence" && <SequenceScreen state={state} />}
        {state.phase === "input" && <InputScreen state={state} />}
        {state.phase === "winner" && state.winner !== null && (
          <WinnerScreen winner={state.winner} state={state} />
        )}
        {state.phase === "final" && <FinalScreen />}
      </div>

      {/* dev controls — hidden in real kiosk */}
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
            onPlayerInput={onPlayerInput}
            onTechInput={onTechInput}
          />
        </div>
        <KeyLegend />
      </div>

      {/* on-screen player pads (mouse simulator) */}
      {showSimulator && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-40">
          {Array.from({ length: PLAYERS }, (_, i) => (
            <PlayerPad
              key={i}
              playerId={i}
              onPress={onPlayerInput}
              disabled={state.phase !== "input" || state.playerDone[i]}
              highlightDone={state.playerDone[i]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
