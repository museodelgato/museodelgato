"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * WebSerial bridge for any Arduino (Uno / Mega / Nano / etc.) running the
 * `arduino/serial` sketch.
 *
 * Protocol (text, line-delimited, 9600 baud):
 *   READY         — sent by Arduino on boot (optional, ignored)
 *   P{p}:{b}      — player p (0-4) pressed button b (0-3), e.g. "P0:2"
 *   T             — tech (encargado) button pressed
 *
 * Notes:
 * - WebSerial requires Chrome/Edge over HTTPS or localhost.
 * - First-time use requires the user to click "Conectar Arduino" and pick
 *   the port. AFTER that, the browser remembers the granted permission and
 *   this hook auto-reconnects on page load via `navigator.serial.getPorts()`.
 *   This makes the kiosko zero-click on subsequent boots.
 * - For unattended kiosk launches, prefer the HID keyboard path (Leonardo /
 *   Pro Micro / ESP32-S2/S3) — no permission gesture required at all.
 */

interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
}

interface NavigatorSerial {
  requestPort(): Promise<SerialPortLike>;
  getPorts(): Promise<SerialPortLike[]>;
}

const isSerialSupported = () =>
  typeof navigator !== "undefined" && "serial" in navigator;

const getSerial = (): NavigatorSerial | null => {
  if (!isSerialSupported()) return null;
  return (navigator as unknown as { serial: NavigatorSerial }).serial;
};

export function useSerialBridge(
  onPlayerInput: (player: number, part: number) => void,
  onTechInput: () => void,
) {
  const [connected, setConnected] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const portRef = useRef<SerialPortLike | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  useEffect(() => setSupported(isSerialSupported()), []);

  const parseLine = useCallback(
    (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed === "T") {
        onTechInput();
        return;
      }
      const m = trimmed.match(/^P(\d):(\d)$/);
      if (m) {
        const p = parseInt(m[1], 10);
        const b = parseInt(m[2], 10);
        if (p >= 0 && p < 5 && b >= 0 && b < 4) {
          onPlayerInput(p, b);
        }
      }
      // Anything else (e.g. "READY") is ignored.
    },
    [onPlayerInput, onTechInput],
  );

  /**
   * Abre un puerto serial ya autorizado (sea recién pedido por el usuario,
   * sea recuperado por `getPorts()` en startup). Arranca el read loop.
   */
  const attachPort = useCallback(
    async (port: SerialPortLike) => {
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setConnected(true);
      setError(null);

      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable).catch(() => {});
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      let buffer = "";
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (!value) continue;
            buffer += value;
            let idx = buffer.indexOf("\n");
            while (idx >= 0) {
              parseLine(buffer.slice(0, idx));
              buffer = buffer.slice(idx + 1);
              idx = buffer.indexOf("\n");
            }
          }
        } catch (e) {
          setError(String(e));
        } finally {
          setConnected(false);
        }
      })();
    },
    [parseLine],
  );

  /**
   * Auto-reconnect en startup: revisa si el browser ya tiene permisos para
   * algún puerto previo (otorgados en sesiones anteriores via requestPort).
   * Si lo hay, lo abre sin requerir interacción del usuario. Esto es lo que
   * permite que el kiosko arranque sin que nadie clickee "Conectar Arduino".
   *
   * Si nunca se ha autorizado ningún puerto, getPorts() devuelve [] y este
   * efecto no hace nada — el usuario tendrá que clickear la primera vez.
   */
  useEffect(() => {
    const serial = getSerial();
    if (!serial) return;

    let cancelled = false;
    (async () => {
      try {
        const ports = await serial.getPorts();
        if (cancelled) return;
        if (ports.length === 0) return;
        // Toma el primer puerto autorizado. Si en el futuro se quieren manejar
        // múltiples puertos simultáneos (un Arduino serial por jugador) habría
        // que iterar y mantener un array de portRef.
        await attachPort(ports[0]);
      } catch (e) {
        // Silencioso: si falla la auto-reconexión, el usuario aún puede
        // clickear "Conectar Arduino" manualmente.
        if (!cancelled) setError(String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachPort]);

  const connect = useCallback(async () => {
    setError(null);
    const serial = getSerial();
    if (!serial) {
      setError("WebSerial no soportado. Usa Chrome/Edge.");
      return;
    }
    try {
      const port = await serial.requestPort();
      await attachPort(port);
    } catch (e) {
      setError(String(e));
      setConnected(false);
    }
  }, [attachPort]);

  const disconnect = useCallback(async () => {
    try {
      await readerRef.current?.cancel();
    } catch {}
    readerRef.current = null;
    try {
      await portRef.current?.close();
    } catch {}
    portRef.current = null;
    setConnected(false);
  }, []);

  return { connected, supported, error, connect, disconnect };
}
