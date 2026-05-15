# Specs Arduino — Kiosko Museo del Gato

> Documento dirigido al/la dev de hardware que está modificando los `.ino`.
> Lo escribe el dev de software para alinear ambos lados.
> Plataforma destino: PC Windows 11 con 5 Arduinos Leonardo (HID Keyboard).

---

## Resumen ejecutivo

- **5 Arduinos Leonardo**, uno por jugador. Cada uno se comporta como teclado USB (HID).
- **Cada Arduino debe mandar teclas DISTINTAS** según el jugador que represente. Hoy todos mandan las mismas (`r w e r`) y eso rompe el juego — el sistema no puede distinguir quién apretó.
- **1 solo Arduino** (puede ser cualquiera, recomendado el del encargado/tech) lleva un botón extra que manda `SPACE`. Los otros 4 Arduinos NO llevan ese botón. SPACE = arranca juego / doble-press = reset.

---

## 1. Mapeo de teclas por jugador

Esto es lo que la web app espera recibir (definido en `app/game/useKeyboardInput.ts`):

| Player | Botón 1 (Orejas) | Botón 2 (Pata) | Botón 3 (Cara) | Botón 4 (Cola) |
|--------|------------------|----------------|----------------|----------------|
| **P1** | `1`              | `2`            | `3`            | `4`            |
| **P2** | `q`              | `w`            | `e`            | `r`            |
| **P3** | `a`              | `s`            | `d`            | `f`            |
| **P4** | `z`              | `x`            | `c`            | `v`            |
| **P5** | `u`              | `i`            | `o`            | `p`            |
| **Tech** | (solo 1 Arduino lleva este botón) `SPACE` | | | |

**Orden de partes:** 0=Orejas, 1=Pata, 2=Cara, 3=Cola.

---

## 2. Estructura recomendada del sketch (parametrizable)

En lugar de tener 5 archivos `.ino` distintos, mantenemos **un solo sketch** con un `#define PLAYER_ID` que se cambia antes de flashear cada Arduino:

```cpp
#include <Keyboard.h>

// ============================================================
// CONFIGURACIÓN: cambia este número antes de flashear cada Arduino
//   0 = Player 1
//   1 = Player 2
//   2 = Player 3
//   3 = Player 4
//   4 = Player 5
// ============================================================
#define PLAYER_ID 0

// ============================================================
// Si este Arduino tiene el botón tech (encargado), poner en 1.
// Solo UN Arduino del set debe tenerlo en 1.
// ============================================================
#define HAS_TECH_BUTTON 0

// ============================================================
// Mapeo de teclas — NO modificar (debe coincidir con la web app)
// ============================================================
const char KEY_MAP[5][4] = {
  {'1','2','3','4'},  // P1
  {'q','w','e','r'},  // P2
  {'a','s','d','f'},  // P3
  {'z','x','c','v'},  // P4
  {'u','i','o','p'},  // P5
};

// ============================================================
// Pines físicos — ajustar según el cableado real del PCB
// ============================================================
#define BTN_1 A0   // botón 1 (Orejas)
#define BTN_2 A1   // botón 2 (Pata)
#define BTN_3 A2   // botón 3 (Cara)
#define BTN_4 A3   // botón 4 (Cola)
#define BTN_TECH A4 // SOLO si HAS_TECH_BUTTON == 1

// LEDs y audio (DFPlayer) son independientes, se mantienen como hoy.

void setup() {
  pinMode(BTN_1, INPUT_PULLUP);
  pinMode(BTN_2, INPUT_PULLUP);
  pinMode(BTN_3, INPUT_PULLUP);
  pinMode(BTN_4, INPUT_PULLUP);
  #if HAS_TECH_BUTTON
    pinMode(BTN_TECH, INPUT_PULLUP);
  #endif
  Keyboard.begin();
  // ...resto del setup (DFPlayer, LEDs, etc.)
}

void checkAndSend(int pin, int partIdx, int &lastState) {
  int current = digitalRead(pin);
  if (current == LOW && lastState == HIGH) {
    char key = KEY_MAP[PLAYER_ID][partIdx];
    Keyboard.press(key);
    delay(50);
    Keyboard.release(key);
    // ...lógica de LED, audio, etc.
  }
  lastState = current;
}

void loop() {
  static int last[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};
  checkAndSend(BTN_1, 0, last[0]);
  checkAndSend(BTN_2, 1, last[1]);
  checkAndSend(BTN_3, 2, last[2]);
  checkAndSend(BTN_4, 3, last[3]);
  #if HAS_TECH_BUTTON
    int currentTech = digitalRead(BTN_TECH);
    if (currentTech == LOW && last[4] == HIGH) {
      Keyboard.press(' ');  // SPACE — NO usar KEY_RETURN
      delay(50);
      Keyboard.release(' ');
    }
    last[4] = currentTech;
  #endif
  delay(10);
}
```

**Ventaja**: un solo binario base. Para flashear el Arduino del P3, cambias `#define PLAYER_ID 2` y `#define HAS_TECH_BUTTON 0` (o 1 si va a tener el tech), compilas y subes. Listo. Pega una etiqueta física al Arduino con su número.

---

## 3. Bugs encontrados en `player1nuevo1.ino` (revisar y corregir)

### 3.1 Char inválido en línea 85

```cpp
checkButton(BTN_Q, ' r', 0, LED_Q, 1);
//                ^^^^ NO es un literal char válido
```

Debe ser un solo carácter, por ejemplo `'1'` (si es P1) o el que corresponda según el `KEY_MAP[PLAYER_ID][0]`. El compilador probablemente sólo da warning y manda un código de tecla inesperado.

### 3.2 ENTER no es la tecla tech

El sketch actual manda `KEY_RETURN` cuando se aprieta el 5to botón. La web app espera `' '` (SPACE) — ver `app/game/useKeyboardInput.ts` línea 52:

```ts
if (key === " " || key === "enter") { ... onTechInput(); ... }
```

Bueno — ENTER también dispara tech actualmente (por compatibilidad histórica), pero **es preferible mandar SPACE** para evitar conflictos con campos de formulario, atajos del navegador, etc. Recomendado: usar `Keyboard.press(' ')` no `Keyboard.press(KEY_RETURN)`.

### 3.3 Tech repetido en múltiples Arduinos

Si los 5 Arduinos llevan el botón tech, los 5 mandarán SPACE al mismo tiempo y la web recibirá 5 eventos, lo que puede causar un doble-press accidental (que resetea el juego). **Solución**: solo el Arduino del encargado lleva ese 5to botón físico; los otros 4 Arduinos no.

### 3.4 DFPlayer + LEDs

Si no todos los Arduinos llevan audio (DFPlayer Mini) o LEDs locales, sugiero parametrizar también:

```cpp
#define HAS_AUDIO 1   // 0 si este Arduino no tiene DFPlayer
#define HAS_LEDS 1    // 0 si este Arduino no tiene LEDs locales
```

Y envolver el código correspondiente en `#if HAS_AUDIO` / `#endif`.

---

## 4. Convención de etiquetado físico

Cada Arduino debe llevar una etiqueta visible (cinta, marcador permanente) con:

- **Player N** (donde N es 1..5).
- (Si aplica) **TECH** si lleva el 5to botón del encargado.

Esto evita que cuando se desconecten/reconecten cables se pierda quién es quién. Si un Arduino se rompe y se reemplaza, se flashea el nuevo con el `PLAYER_ID` que corresponda al puesto que sustituye.

---

## 5. Cómo verificar que cada Arduino está correctamente flasheado

Antes del montaje final:

1. Enchufar el Arduino a la PC.
2. Abrir `http://localhost:3000` en Chrome.
3. Abrir la consola del navegador (`F12`).
4. Apretar cada uno de los 4 botones físicos del Arduino.
5. En la consola deben aparecer logs como: `Player 3, Botón 1 (OREJAS)`, `Player 3, Botón 2 (PATA)`, etc.
6. Si aparece `Player N` distinto al esperado o un botón cae a otro player, revisar `PLAYER_ID` y/o el cableado de los pines.

---

## 6. Conexión USB — orden de enchufado

**En la PC Windows del museo**, la primera vez que se enchufa cada Arduino en cada puerto USB, Windows instala drivers automáticamente (10-30 segundos). Después de la primera vez es instantáneo. **Recomendación**:

1. Antes del día de inauguración, enchufar los 5 Arduinos a los puertos USB que se usarán definitivamente.
2. Esperar a que Windows reconozca cada uno (notificación de driver instalado).
3. **No mover los Arduinos a otros puertos USB después de eso.**

El orden de los puertos USB **no importa** para el juego, porque cada Arduino se identifica solo por las teclas que manda, no por el puerto donde está enchufado.
