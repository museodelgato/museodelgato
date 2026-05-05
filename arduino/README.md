# Arduino — Museo del Gato

Hay **dos rutas** para conectar los botones físicos a la web app. Elegí una según el board que tengas. La web app soporta las dos al mismo tiempo, así que también podés tener una en producción y la otra como respaldo.

## Total de inputs

- **16 botones de jugador** (4 jugadores × 4 botones: orejas, pata, cara, cola)
- **1 botón de tech / encargado** (iniciar / reset)
- **Total: 17 inputs digitales**

Cada botón se cablea entre su pin asignado y GND. Los pines usan `INPUT_PULLUP`, así que pulsado = `LOW`.

---

## Opción A — HID Keyboard ⭐ recomendada

El Arduino se hace pasar por un teclado USB. La web app escucha `keydown` directamente. **No necesita drivers, permisos ni botón de "conectar"**. Ideal para kiosk.

### Boards compatibles

- Arduino **Leonardo**, **Pro Micro**, Micro, Due, Zero
- **Teensy** (cualquiera)
- **ESP32-S2 / ESP32-S3** con USB-HID habilitado
- ❌ Arduino Uno / Nano / Mega clásicos *no* sirven (no tienen USB-HID nativo)

### Setup

1. Abrir `arduino/hid_keyboard/hid_keyboard.ino` en el Arduino IDE.
2. Asegurarse de que la librería **`Keyboard`** esté disponible (viene built-in).
3. Ajustar el array `PINS[4][4]` y `TECH_PIN` según tu cableado real.
4. Seleccionar el board correcto (Tools → Board) y subir.

### Mapeo de teclas

```
P1 buttons -> 1 2 3 4
P2 buttons -> Q W E R
P3 buttons -> A S D F
P4 buttons -> Z X C V
Tech       -> SPACE
```

El orden dentro de cada jugador corresponde a: **orejas (0), pata (1), cara (2), cola (3)**.

---

## Opción B — Serial + WebSerial

Cualquier Arduino que tenga puerto serie por USB. El sketch imprime mensajes de texto; la web app los lee con la WebSerial API.

### Boards compatibles

- Cualquier Arduino: **Uno**, Nano, Mega, Leonardo, Pro Micro, ESP32, etc.
- Requiere **Chrome o Edge** (Firefox/Safari no soportan WebSerial).
- En la web app hay que clickear "Conectar Arduino" una vez por sesión y elegir el puerto.

### Setup

1. Abrir `arduino/serial/serial.ino`.
2. Ajustar `PINS[4][4]` y `TECH_PIN`.
3. Subir al board.
4. En la web app, click en **"Conectar Arduino"** (esquina superior derecha) y seleccionar el puerto USB.

### Protocolo

| Mensaje | Significado |
|---------|-------------|
| `READY\n` | Arduino arrancó (la web lo ignora) |
| `P0:2\n` | Player 0 apretó botón 2 (cara) |
| `P3:0\n` | Player 3 apretó botón 0 (orejas) |
| `T\n` | Tech / encargado apretó su botón |

Baud rate: **9600**.

---

## Notas para el técnico

- **Debounce**: ambos sketches incluyen debounce por software (25 ms). Si los botones físicos son malos podés subirlo a 50 ms.
- **Pines**: el orden de los pines en `PINS[4][4]` es libre, lo importante es que cada celda corresponda a `[playerId][partId]`. Recordá que `partId` 0=orejas, 1=pata, 2=cara, 3=cola.
- **17 botones en Uno**: caben usando los 14 digitales + A0-A4 como digitales. Dejá A5 libre por si necesitás I²C después.
- **Si pasás de 17 inputs** (ej. luces o feedback): considerá un shift register (74HC165) o un keypad matrix.
- **Para producción**: la opción HID es más robusta porque no requiere gestos del usuario al iniciar. Si elegís Serial, podés automatizar el "Conectar" usando `navigator.serial.getPorts()` para reusar permisos previos (esto se puede agregar después).

---

## Probar sin Arduino

Mientras no haya hardware, podés testear el flow con:

1. **Botones en pantalla** (mouse) — siempre visibles abajo.
2. **Teclado** — usá las mismas teclas del mapeo HID (`1234 qwer asdf zxcv`, `SPACE` para tech). Esto exercita exactamente la misma ruta que usará el Arduino HID.
