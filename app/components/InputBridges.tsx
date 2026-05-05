"use client";

import { useSerialBridge } from "../game/useSerialBridge";

interface Props {
  onPlayerInput: (player: number, part: number) => void;
  onTechInput: () => void;
}

/**
 * Dev controls for connecting the physical Arduino via WebSerial.
 * The HID-keyboard path needs no UI — it just works once the Arduino is
 * plugged in (see useKeyboardInput).
 */
export function SerialConnectButton({ onPlayerInput, onTechInput }: Props) {
  const { connected, supported, error, connect, disconnect } = useSerialBridge(
    onPlayerInput,
    onTechInput,
  );

  if (!supported) {
    return (
      <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs">
        WebSerial no disponible
      </span>
    );
  }

  return (
    <button
      onClick={connected ? disconnect : connect}
      title={error ?? undefined}
      className={`px-2 py-1 rounded text-xs ${
        connected
          ? "bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40"
          : "bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30"
      }`}
    >
      {connected ? "Arduino ✓" : "Conectar Arduino"}
    </button>
  );
}

export function KeyLegend() {
  return (
    <div className="text-[10px] text-white/40 leading-tight font-mono whitespace-pre">
      {`P1: 1 2 3 4    P3: A S D F
P2: Q W E R    P4: Z X C V
Tech: SPACE`}
    </div>
  );
}
