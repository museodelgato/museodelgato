# Lista de assets — Museo del Gato

Este documento lista todos los archivos multimedia que el juego necesita.
Está dirigido al/la **diseñador(a) / animador(a)** que produce el contenido.

**Para reemplazar un asset**: simplemente entregue el archivo con el nombre
exacto de esta lista. El sistema lo lee directo por ese path; no requiere
cambio de código siempre que el nombre se conserve.

## Hardware del kiosko (contexto para producción)

- **Pantalla**: 120" capaz de 4K UHD (3840×2160).
- **PC**: Beelink S13 Pro — Intel N150 (4C/4T hasta 3.6 GHz), Intel UHD Graphics (24 EU), 16 GB DDR4, 500 GB SSD, dual HDMI 2.0 a 4K@60Hz, Win 11.

**Decisión de codec**: todos los videos se entregan en **H.264 (AVC) a 30fps**. El N150 lo decodifica en hardware a 4K@30fps sin estresar el CPU. H.264 funciona en Chrome out-of-the-box (no requiere extensiones como HEVC). El cinemático/loop visual no requiere 60fps — 30fps es estándar narrativo.

---

## Estructura de carpetas

```
public/
├── videos/        ← todos los videos (.mp4) y la animación Lottie (.json)
└── imagenes/      ← imágenes de las partes del gato (.png)
```

---

## Videos (`public/videos/`)

Todos los `.mp4` se reproducen a pantalla completa con `object-cover` (la
imagen llena toda la pantalla aunque tenga que recortar bordes; **importante
mantener acción centrada** porque los bordes pueden cortarse según el
aspect ratio del monitor del kiosko).

### Specs comunes para TODOS los videos

- **Resolución**: **3840×2160 (4K UHD)**, aspect ratio **16:9**.
- **Codec**: **H.264 / AVC** (no H.265). Container `.mp4`. Profile **High @ 4.2**.
- **Framerate**: **30 fps**.
- **Bitrate**: **15–20 Mbps** (excelente calidad sin archivos innecesariamente grandes).
- **Audio**: cuando aplique, **AAC 192–256 kbps, 48 kHz, stereo**. Mastering a **−14 LUFS**.

### `standby.mp4` — Fondo de pantalla inicial

- **Cuándo se ve**: pantalla de espera, antes de que arranque el juego. Detrás del logo del museo.
- **Comportamiento**: en **loop infinito**, muted (sin audio).
- **Duración recomendada**: 15–30 segundos. Loopea, así que debe verse continuo en el corte.
- **Audio**: NO (se reproduce muted siempre).

### `instrucciones.mp4` — Video de instrucciones del juego

- **Cuándo se ve**: después de presionar JUGAR, antes de la cuenta regresiva.
- **Comportamiento**: se reproduce **una vez**. Al terminar, el juego avanza solo a la cuenta regresiva.
- **Duración recomendada**: 10–30 segundos (el tiempo que tome explicar las reglas).
- **Audio**: SÍ, idealmente con narración. Se reproduce con audio.
- **Saltable**: el encargado puede presionar SPACE/ENTER para saltarlo.

### `cuenta-regresiva.mp4` — Cuenta regresiva antes de cada ronda

- **Cuándo se ve**: justo antes de mostrar la secuencia de partes del gato que los jugadores deben memorizar. Se reproduce **antes de cada una de las 4 rondas**.
- **Comportamiento**: se reproduce una vez completo en cada ronda. Al terminar, arranca la secuencia.
- **Duración recomendada**: 3–6 segundos.
- **Audio**: SÍ (efectos típicos de cuenta regresiva).

### `fondo-rondas.mp4` — Fondo durante las rondas (sequence + input)

- **Cuándo se ve**: durante la fase de **mostrar la secuencia** y durante la **fase de input** (cuando los jugadores presionan los botones). Persiste continuo entre ambas, **sin reiniciar**.
- **Comportamiento**: **loop infinito**, muted.
- **Duración recomendada**: 20–40 segundos. Loopea seamlessly.
- **Audio**: NO (siempre muted, evita audio acumulado al loopear).

### `ganador-1.mp4` … `ganador-5.mp4` — Videos de celebración del ganador

- **Cuándo se ve**: al terminar las 4 rondas, se reproduce el video del jugador que ganó. `ganador-1.mp4` para Player 1, `ganador-2.mp4` para Player 2, etc. Total: **5 archivos**.
- **Comportamiento**: se reproduce una vez. Al terminar, pasa al video final.
- **Duración recomendada**: 5–10 segundos cada uno.
- **Audio**: SÍ (música de victoria, etc.).
- **Saltable**: el encargado puede saltar con SPACE/ENTER.

### `final.mp4` — Video de cierre del juego

- **Cuándo se ve**: después del video del ganador. Es el último video antes de volver al standby.
- **Comportamiento**: se reproduce una vez. Al terminar, vuelve al loop de standby.
- **Duración recomendada**: 5–15 segundos.
- **Audio**: SÍ.
- **Saltable**: el encargado puede saltar con SPACE/ENTER.

### `reloj-arena.json` — Animación del timer (Lottie)

- **Cuándo se ve**: durante la **fase de input** de cada ronda (cuando los jugadores presionan los botones). Aparece como la animación grande en el centro de la pantalla, representando el tiempo que tienen para responder.
- **Formato**: archivo Lottie en formato **JSON** (no `.lottie`). Exportar desde After Effects con el plugin **Bodymovin** → "Export as JSON".
- **Duración exacta**: **7 segundos**. Esta duración debe coincidir con el valor `inputWindowMs` definido en `app/game/config.ts`.
- **Si quieren cambiar la duración**: avisar al equipo de software para que ajusten `inputWindowMs` (actualmente `7000`).
- **Frame rate sugerido**: 25 o 30 fps.
- **Comportamiento**: se reproduce **una vez** por ronda. NO loopea.
- **Transparencia**: SÍ, debe tener fondo transparente (la animación se ve encima del video de fondo de rondas).
- **Resolución del canvas**: 1080×1080 o similar (cuadrado). El render es vectorial, así que escala perfecto a cualquier tamaño en pantalla 4K.

---

## Imágenes (`public/imagenes/`)

Las 4 partes del gato que aparecen como iconos en la secuencia que los
jugadores memorizan, y también en los botones de cada estación. **Más** el
logo del museo.

### `logo.png` — Logo del Museo del Gato

- **Cuándo se ve**: pantalla de standby, centrado encima del video de fondo.
- **Tamaño en pantalla**: hasta ~65% del ancho del monitor (en 4K = ~2500px).
- **Resolución mínima**: 2048px de ancho. **Ideal: 4000px de ancho**.
- **Aspect ratio**: libre, idealmente horizontal o cuadrado.
- **Fondo**: transparente (PNG alpha).

### `parte-orejas.png` — Orejas del gato

### `parte-pata.png` — Pata del gato

### `parte-cara.png` — Cara del gato

### `parte-cola.png` — Cola del gato

**Especificaciones comunes para las 4 partes**:

- **Formato**: PNG con **transparencia** (alpha channel).
- **Resolución mínima**: **2048×2048**. **Ideal: 4096×4096** — en pantalla 4K las partes se renderizan a ~60% del alto del monitor (~1300px), así que con 2048 mínimo se ve nítido; con 4096 hay margen para zoom/efectos futuros.
- **Aspect ratio**: idealmente cuadrado (1:1), aunque el sistema usa `object-contain` así que respeta cualquier proporción.
- **Estilo**: el set debe ser visualmente consistente entre las 4 partes (mismo estilo de ilustración, paleta, grosor de líneas, etc.).
- **Fondo**: transparente. El sistema NO les agrega fondo de color.
- **Importante**: el orden de las partes en el juego es siempre `[orejas, pata, cara, cola]`. Este orden determina qué tecla del Arduino corresponde a qué parte y debe coincidir con el cableado físico de los pads (ver `arduino/SPECS_KIOSKO.md`).

---

## Resumen — Total de archivos a entregar

| Tipo | Cantidad | Archivos |
|------|----------|----------|
| Videos `.mp4` | **10** | `standby.mp4`, `instrucciones.mp4`, `cuenta-regresiva.mp4`, `fondo-rondas.mp4`, `final.mp4`, `ganador-1.mp4` ... `ganador-5.mp4` |
| Animación Lottie `.json` | **1** | `reloj-arena.json` |
| Imágenes `.png` | **5** | `logo.png`, `parte-orejas.png`, `parte-pata.png`, `parte-cara.png`, `parte-cola.png` |
| **TOTAL** | **16 archivos** | |

---

## Workflow de entrega

1. Producir los archivos con los nombres EXACTOS de esta lista (todo en minúsculas, con guiones, sin acentos ni espacios).
2. Reemplazar los archivos correspondientes en:
   - `public/videos/` (para `.mp4` y `.json`)
   - `public/imagenes/` (para `.png`)
3. Recargar la página en el browser. No requiere recompilar — Next.js sirve los assets directamente desde `public/`.
4. Si cambia la duración del Lottie del reloj de arena, avisar al equipo de software para sincronizar `inputWindowMs` en el código.

## Codecs y compatibilidad

- **Videos**: **H.264 (AVC)**, container `.mp4`, profile **High @ 4.2**. Es el codec más compatible con Chrome/Edge en Windows y se decodifica en hardware por la iGPU del N150 (a 4K@30fps sin problema). Bitrate **15–20 Mbps** para 4K — archivos manejables (~60-75 MB para 30 seg).
- **NO usar H.265 / HEVC**: aunque el N150 también lo decodifica, Chrome en Windows requiere instalar la "HEVC Video Extension" de Microsoft, lo que agrega un paso de mantenimiento innecesario.
- **Lottie**: exportar como JSON puro (no como `.lottie` comprimido) usando el plugin Bodymovin de After Effects.
- **PNG**: cualquier PNG estándar con transparencia funciona. Evitar PNG-8 (perdería gradientes); usar PNG-24 o PNG-32.

## Audio

- El kiosko Windows reproducirá audio por los parlantes conectados a la PC.
- El volumen se controla desde Windows (sound mixer). El código no aplica ajustes de volumen al audio del video.
- Asegurar que los videos NO tengan **picos de volumen** muy altos — esto distorsiona en parlantes pequeños y molesta en sala de museo. Mastering recomendado: **−14 LUFS** (estándar streaming).
