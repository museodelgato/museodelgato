"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * WebSerial bridge for any Arduino (Uno / Mega / Nano / etc.) running the
 * `arduino/serial` sketch.
 *
 * Protocol (text, line-delimited, 9600 baud):
 *   READY         — sent by Arduino on boot (optional, ignored)
 *   P{p}:{b}      — player p (0-3) pressed button b (0-3), e.g. "P0:2"
 *   T             — tech (encargado) button pressed
 *
 * Notes:
 * - WebSerial requires Chrome/Edge over HTTPS or localhost.
 * - The user must click "Conectar Arduino" once per session to grant access.
 * - For unattended kiosk launches, prefer the HID keyboard path (Leonardo /
 *   Pro Micro / ESP32-S2/S3) — no permission gesture required.
 */

interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
}

interface NavigatorSerial {
  requestPort(): Promise<SerialPortLike>;
}

const isSerialSupported = () =>
  typeof navigator !== "undefined" && "serial" in navigator;

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
        if (p >= 0 && p < 4 && b >= 0 && b < 4) {
          onPlayerInput(p, b);
        }
      }
      // Anything else (e.g. "READY") is ignored.
    },
    [onPlayerInput, onTechInput],
  );

  const connect = useCallback(async () => {
    setError(null);
    if (!isSerialSupported()) {
      setError("WebSerial no soportado. Usa Chrome/Edge.");
      return;
    }
    try {
      const nav = navigator as unknown as { serial: NavigatorSerial };
      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setConnected(true);

      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable).catch(() => {});
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      // Read loop.
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
    } catch (e) {
      setError(String(e));
      setConnected(false);
    }
  }, [parseLine]);

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
