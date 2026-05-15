// Game tuning constants. Adjust here, no logic should hard-code these.

export const PLAYERS = 5;
export const ROUNDS = 4;
export const SEQ_LENGTH = 4;
export const PARTS = 4;

export const TIMINGS = {
  /**
   * Máximo de tiempo que se espera en la fase de instrucciones antes de forzar
   * el avance al countdown. La transición real la dispara el `onEnded` del
   * video de instrucciones (`/videos/instrucciones.mp4`); este valor es solo
   * la red de seguridad para que el juego no se cuelgue si el video falla.
   */
  instructionsMaxMs: 60_000,
  /**
   * Máximo de tiempo en la fase countdown antes de forzar el avance a la
   * fase sequence. La transición real la dispara el `onEnded` del video
   * `/videos/cuenta-regresiva.mp4`; este valor es solo la red de seguridad.
   */
  countdownMaxMs: 30_000,
  iconShowMs: 1500,    // tiempo que cada parte del gato queda visible
  iconGapMs: 600,      // pausa en negro entre partes
  inputWindowMs: 7000, // ventana de 7s — sincronizada con la animación Lottie del reloj de arena
  /**
   * Fallbacks de seguridad para las fases winner y final. La transición real
   * la dispara el `onEnded` del video correspondiente
   * (`/videos/playerN.mp4` y `/videos/final.mp4`). Si el video falla en
   * cargar, igual avanzamos a los 10 minutos para que el juego no se quede
   * colgado. 10 min cubre cualquier video razonable; bumpear si en algún
   * momento se ponen videos más largos que eso.
   */
  winnerMaxMs: 600_000,
  finalMaxMs: 600_000,
} as const;

// Cat parts. El orden importa: 0=Orejas, 1=Pata, 2=Cara, 3=Cola.
export const PART_LABELS = ["OREJAS", "PATA", "CARA", "COLA"] as const;

// Imágenes reales de cada parte. Vienen del set de arte en public/imagenes/.
export const PART_IMAGES = [
  "/imagenes/parte-orejas.png",
  "/imagenes/parte-pata.png",
  "/imagenes/parte-cara.png",
  "/imagenes/parte-cola.png",
] as const;

// Colores fallback / acento (se mantienen como referencia visual, ya no son
// el render principal — las imágenes reemplazaron los cuadrados de color).
export const PART_COLORS = [
  "#ec4899", // pink — orejas
  "#f59e0b", // amber — pata
  "#06b6d4", // cyan  — cara
  "#a855f7", // violet— cola
] as const;
