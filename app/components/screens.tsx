"use client";

import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import { ROUNDS, SEQ_LENGTH } from "../game/config";
import type { GameState } from "../game/useGame";
import { PartIcon } from "./PartIcon";

/**
 * Wrapper que carga un archivo Lottie .json desde una URL pública y lo
 * renderiza con lottie-react. La librería oficial espera `animationData` ya
 * parseado, así que aquí hacemos el fetch + JSON.parse a runtime.
 *
 * Si el fetch falla, no muestra nada (devuelve null) — la lógica del juego
 * sigue corriendo en useGame, solo se pierde la animación visual.
 */
function LottieFromUrl({
  src,
  loop = false,
  className,
}: {
  src: string;
  loop?: boolean;
  className?: string;
}) {
  const [data, setData] = useState<object | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src]);
  if (!data) return null;
  return (
    <Lottie animationData={data} loop={loop} autoplay className={className} />
  );
}

/* -------------------------------- Standby -------------------------------- */

export function StandbyScreen({ onTechPress }: { onTechPress: () => void }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Video de loop como fondo. Muted + autoPlay para que el browser
          permita reproducir sin gesto del usuario. En el kiosko Chrome corre
          con --autoplay-policy=no-user-gesture-required, así que tampoco hay
          problema si el video tuviera audio. */}
      <video
        src="/videos/standby.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Contenido por encima del video — solo el logo, centrado. El juego
          se inicia con SPACE/ENTER (teclado o botón tech del Arduino). En
          modo dev, además hay un botón "Tech" en la barra superior. */}
      <div
        className="relative h-full w-full flex items-center justify-center cursor-pointer"
        onClick={onTechPress}
      >
        <img
          src="/imagenes/logo.png"
          alt="Museo del Gato"
          className="w-[65vw] max-w-[1100px] max-h-[80vh] object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}

/* ----------------------------- Instructions ------------------------------ */

/**
 * Muestra el video de instrucciones a pantalla completa. Cuando el video
 * termina (evento `onEnded`), llama a `onEnded` para que el juego avance al
 * countdown. Si el video falla en disparar onEnded por cualquier motivo, hay
 * una red de seguridad en `useGame` que fuerza el avance a los
 * `TIMINGS.instructionsMaxMs`.
 */
export function InstructionsScreen({ onEnded }: { onEnded: () => void }) {
  // Este video SÍ tiene audio. Para que el browser permita autoplay con
  // sonido, la página requiere un gesto previo del usuario — que ya ocurrió
  // (click en JUGAR o press del botón tech del Arduino, que mete keydown en
  // el window). Si por alguna razón el autoplay con audio falla, el
  // useEffect fuerza la reproducción con play() y, si eso también falla,
  // hace fallback a muted para que al menos se vea el video.
  return (
    <div className="relative h-full w-full overflow-hidden">
      <video
        src="/videos/instrucciones.mp4"
        autoPlay
        playsInline
        onEnded={onEnded}
        ref={(el) => {
          if (!el) return;
          // Asegura volumen al máximo (algunos browsers lo dejan en 0).
          el.volume = 1;
          // Intento explícito de play() — útil si autoPlay no disparó solo.
          el.play().catch(() => {
            // Browser bloqueó autoplay con audio. Fallback: muted + play.
            el.muted = true;
            el.play().catch(() => {});
          });
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* TEMP: placeholder de referencia hasta que llegue el video final.
          Quitar este overlay cuando se entregue el video con texto en el
          propio video. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white text-[8rem] font-bold tracking-wider drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          Instrucciones
        </span>
      </div>
    </div>
  );
}

/* ------------------------------ Countdown -------------------------------- */

/**
 * Muestra el video de cuenta regresiva. Cuando termina, llama a `onEnded`
 * para que el juego pase a la fase sequence (mostrar la randomización de
 * partes del gato que los jugadores deben memorizar). Fallback de seguridad
 * en useGame por si el video falla.
 */
export function CountdownScreen({ onEnded }: { onEnded: () => void }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <video
        src="/videos/cuenta-regresiva.mp4"
        autoPlay
        playsInline
        onEnded={onEnded}
        ref={(el) => {
          if (!el) return;
          el.volume = 1;
          el.play().catch(() => {
            el.muted = true;
            el.play().catch(() => {});
          });
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}

/* ------------------------------ Sequence --------------------------------- */

/**
 * NOTA: el video de fondo (`/videos/fondo-rondas.mp4`) NO vive aquí —
 * está en `app/page.tsx` para que persista continuo entre las fases
 * sequence ↔ input sin reiniciarse al cambiar de fase.
 */
export function SequenceScreen({ state }: { state: GameState }) {
  // Audio de "transición" que suena cada vez que aparece una parte del
  // gato. Reutilizamos un solo Audio element (en lugar de crear uno nuevo
  // por icono) para no acumular instancias en el garbage collector.
  const transitionAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    transitionAudioRef.current = new Audio("/videos/transition.mp3");
    transitionAudioRef.current.volume = 0.8;
    transitionAudioRef.current.preload = "auto";
  }, []);

  // Dispara el sonido cada vez que `sequenceIndex` cambia a un valor >= 0
  // (aparición de un nuevo icono). Rewind a 0 por si el sonido anterior
  // aún estaba sonando — así el siguiente icono dispara desde el inicio.
  useEffect(() => {
    if (state.sequenceIndex < 0) return;
    const audio = transitionAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [state.sequenceIndex]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-14">
      <div className="text-3xl uppercase tracking-widest text-black font-bold">
        Memoriza la secuencia · Ronda {state.round + 1}/{ROUNDS}
      </div>
      <div className="flex items-center justify-center min-h-[60vh]">
        {state.sequenceIndex >= 0 ? (
          // key={sequenceIndex} fuerza el remount del PartIcon en cada icono
          // nuevo, lo que reinicia la animación de pop-in con bounce.
          <PartIcon
            key={state.sequenceIndex}
            part={state.sequence[state.sequenceIndex]}
            size="2xl"
            animated
          />
        ) : (
          <div className="w-[75vw] h-[60vh] max-w-[1400px] max-h-[800px]" />
        )}
      </div>
      <div className="flex gap-5">
        {Array.from({ length: SEQ_LENGTH }, (_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full ${
              i <= state.sequenceIndex ? "bg-black" : "bg-black/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Input ---------------------------------- */

/**
 * NOTA: comparte el video de fondo (`/videos/fondo-rondas.mp4`) con
 * SequenceScreen — el video vive en `app/page.tsx` y se mantiene continuo
 * mientras pasamos de sequence a input sin reiniciar.
 *
 * El timer numérico (7s → 0) y la barra de progreso fueron reemplazados por
 * una animación Lottie del reloj de arena. La lógica del timer sigue
 * corriendo en useGame y sigue cerrando la ronda a los 6s; la Lottie es
 * solo la representación visual.
 */
export function InputScreen({ state }: { state: GameState }) {
  // Audio que suena cuando arranca la fase input (al mismo tiempo que el
  // reloj de arena Lottie). El componente se monta al entrar a phase=input,
  // así que un useEffect con deps [] dispara el sonido una sola vez al
  // arrancar la ventana de input, y se vuelve a disparar cuando InputScreen
  // se remonta en la siguiente ronda.
  useEffect(() => {
    const audio = new Audio("/videos/6segondos.wav");
    audio.volume = 0.8;
    audio.play().catch(() => {});
    return () => {
      // Si se sale de input antes de los 6s (tech skip, todos terminaron),
      // cortamos el audio para que no siga sonando en la siguiente fase.
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-12">
      <div className="text-3xl uppercase tracking-widest text-black font-bold">
        ¡Repite la secuencia! · Ronda {state.round + 1}/{ROUNDS}
      </div>

      {/* Reloj de arena: animación Lottie (JSON) que reemplaza el contador
          numérico y la barra de progreso. Vectorial → transparencia nativa,
          escala perfecto, sin artefactos de codec. El timer real corre en
          useGame; este es solo el indicador visual. Se reproduce una vez por
          ronda (loop=false). InputScreen se remonta en cada ronda, así que
          la animación arranca fresca cada vez.

          Para cambiar la animación: dropear un .json nuevo en public/videos/
          y actualizar el src acá. */}
      <LottieFromUrl
        src="/videos/reloj-arena.json"
        loop={false}
        className="h-[32rem] w-[32rem]"
      />

      {/* Contador numérico de debug — muestra los segundos reales del timer
          de input (7s en kiosko, 30s en dev). Útil para verificar que el
          `?kiosk=1` está tomado correctamente. Quitar antes de producción
          o envolverlo en un check del flag de kiosko. */}
      <div className="text-4xl font-mono font-bold text-black bg-white/60 px-4 py-1 rounded">
        {(state.inputRemainingMs / 1000).toFixed(1)}s
      </div>

      <div className="flex gap-5 mt-2">
        {state.pressCountsThisRound.map((count, i) => {
          // El chip se pone verde cuando el jugador ya presionó 4 teclas
          // (`pressCountsThisRound` cuenta TODOS los presses, incluso los
          // que ocurren después de haberse equivocado y quedar bloqueado
          // en `currentInputs`). Es indicador puro de "ya hice mis 4 inputs",
          // sin filtrar si acertó. La revelación de quién ganó es al final.
          const completed = count >= SEQ_LENGTH;
          return (
            <div
              key={i}
              className={`px-6 py-3 rounded-full text-xl font-bold text-black ${
                completed ? "bg-emerald-500/60" : "bg-white/40"
              }`}
            >
              P{i + 1} {completed ? "✓" : "..."}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- Winner --------------------------------- */

/**
 * Reproduce a pantalla completa el video de celebración del ganador
 * (`/videos/playerN.mp4`, donde N = winner+1). Cuando termina, llama
 * `onEnded` para que el FSM pase a la fase final. El audio del video
 * se intenta reproducir; si el browser lo bloquea, fallback a muted.
 *
 * key={winner} en el page.tsx asegura remount si por alguna razón el
 * ganador cambia (caso bordeline, normalmente no aplica).
 */
export function WinnerScreen({
  winner,
  onEnded,
}: {
  winner: number;
  onEnded: () => void;
}) {
  const src = `/videos/ganador-${winner + 1}.mp4`;
  return (
    <div className="relative h-full w-full overflow-hidden">
      <video
        src={src}
        autoPlay
        playsInline
        onEnded={onEnded}
        ref={(el) => {
          if (!el) return;
          el.volume = 1;
          el.play().catch(() => {
            el.muted = true;
            el.play().catch(() => {});
          });
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}

/* --------------------------------- Final --------------------------------- */

/**
 * Video final del juego, a pantalla completa. Cuando termina, vuelve a
 * standby. Misma estrategia de autoplay con fallback que WinnerScreen.
 */
export function FinalScreen({ onEnded }: { onEnded: () => void }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <video
        src="/videos/final.mp4"
        autoPlay
        playsInline
        onEnded={onEnded}
        ref={(el) => {
          if (!el) return;
          el.volume = 1;
          el.play().catch(() => {
            el.muted = true;
            el.play().catch(() => {});
          });
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* TEMP: placeholder de referencia hasta que llegue el video final.
          Quitar este overlay cuando se entregue el video definitivo. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white text-[12rem] font-bold tracking-widest drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          FIN
        </span>
      </div>
    </div>
  );
}
