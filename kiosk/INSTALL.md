# Instalación del Kiosko — Museo del Gato (Windows 11)

> Esta guía es para configurar la PC del museo desde cero, de modo que al prenderla **arranque automáticamente todo** sin intervención humana: server Next.js, Chrome en kiosko, Arduinos conectados.
>
> Tiempo estimado de setup: **45-60 minutos** la primera vez.

---

## Pre-requisitos

- PC Windows 11 (Pro o Home), conectada a internet **al menos durante el setup**.
- Cuenta de usuario local del museo (recomendado crear una nueva, ej. `kiosko`).
- Permisos de administrador.
- 5 Arduinos Leonardo flasheados con el sketch correcto (ver `arduino/SPECS_KIOSKO.md`).
- Google Chrome instalado.

---

## Paso 1 — Clonar el repo en la PC

Ubicación recomendada: `C:\museodelgato\estacion2`

```powershell
mkdir C:\museodelgato
cd C:\museodelgato
git clone git@github-museodelgato:museodelgato/museodelgato.git estacion2
cd estacion2
```

> Si no hay SSH key configurada para `github-museodelgato` en esta PC, usar HTTPS:
> `git clone https://github.com/museodelgato/museodelgato.git estacion2`

---

## Paso 2 — Instalar Node.js, pnpm y dependencias

1. Instalar **Node.js LTS** desde https://nodejs.org (v20 o superior).
2. Abrir PowerShell **como administrador**:

   ```powershell
   npm install -g pnpm
   cd C:\museodelgato\estacion2
   pnpm install
   pnpm run build
   ```

3. Probar manualmente que arranque:

   ```powershell
   pnpm start
   ```

   Abrir `http://localhost:3000` en Chrome. Debe verse el juego. Cerrar con `Ctrl+C` en PowerShell.

---

## Paso 3 — Instalar pm2 como servicio de Windows

`pm2-installer` convierte pm2 en un servicio nativo de Windows que arranca con el sistema.

```powershell
# Como administrador
npm install -g pm2
# Descargar pm2-installer
cd C:\
git clone https://github.com/jessety/pm2-installer.git
cd pm2-installer
npm run configure
npm run configure-policy
npm run setup
```

Después de esto, `pm2` está disponible globalmente y se ejecuta como servicio Windows. Reiniciar PowerShell para que los nuevos PATH se carguen.

---

## Paso 4 — Registrar el server Next.js en pm2

```powershell
cd C:\museodelgato\estacion2
mkdir C:\museodelgato\logs
pm2 start kiosk\ecosystem.config.cjs
pm2 save
```

Verificar:

```powershell
pm2 status
```

Debe mostrar `museodelgato` en estado `online`.

```powershell
pm2 logs museodelgato --lines 30
```

Debe verse la salida típica de Next.js (`Ready in Xms`, etc.). Abrir `http://localhost:3000` en Chrome y confirmar que el juego carga.

**Si pm2 no encuentra `pnpm` al arrancar como servicio**: editar `kiosk/ecosystem.config.cjs` y cambiar el campo `script` al path absoluto del `pnpm.cmd` (típicamente `C:\Users\<usuario>\AppData\Roaming\npm\pnpm.cmd`), luego:

```powershell
pm2 delete museodelgato
pm2 start kiosk\ecosystem.config.cjs
pm2 save
```

---

## Paso 5 — Configurar login automático de Windows

**Método A — netplwiz (más simple):**

1. `Win+R` → escribir `netplwiz` → Enter.
2. Si el checkbox "Users must enter a user name and password..." no aparece, ejecutar esto en PowerShell como admin y volver a abrir netplwiz:

   ```powershell
   reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\PasswordLess\Device" /v DevicePasswordLessBuildVersion /t REG_DWORD /d 0 /f
   ```

3. Desmarcar el checkbox → OK → escribir el password del usuario kiosko dos veces.

**Método B — Sysinternals Autologon (más robusto):**

1. Descargar de https://learn.microsoft.com/sysinternals/downloads/autologon
2. Ejecutar `Autologon.exe`.
3. Ingresar usuario, dominio (vacío o nombre de la PC) y contraseña → Enable.

Reiniciar para verificar que entra solo sin pedir contraseña.

---

## Paso 6 — Configurar arranque automático de Chrome kiosk

1. `Win+R` → `shell:startup` → Enter. Se abre la carpeta de startup del usuario.
2. Arrastrar `C:\museodelgato\estacion2\kiosk\start-kiosk-loop.bat` a esa carpeta con `Alt` presionado para crear un **acceso directo** (NO copiarlo).
3. Click derecho sobre el acceso directo → Properties → Run → seleccionar "Minimized" (para que la ventana de consola no tape el kiosko).

Verificar: cerrar sesión y volver a entrar. Después de ~10 segundos debe abrir Chrome en pantalla completa con el juego.

---

## Paso 7 — Deshabilitar sleep, screensaver y notificaciones

### Sleep / pantalla
- `Settings → System → Power & battery → Screen and sleep`:
  - "When plugged in, turn off my screen after" → **Never**
  - "When plugged in, put my device to sleep after" → **Never**

### Screensaver
- `Settings → Personalization → Lock screen → Screen saver`:
  - Screen saver → **(None)**

### Notificaciones
- `Settings → System → Notifications` → desactivar el toggle principal.

### Focus assist (modo "no molestar")
- `Settings → System → Focus` → "Turn on Do not disturb automatically" → marcar todos los horarios o dejarlo permanentemente activo.

### Windows Update — evitar reinicios en horario de operación
- `Settings → Windows Update → Advanced options → Active hours`: configurar como activas todas las horas que el museo esté abierto (por ejemplo 09:00–18:00). Windows no reiniciará automáticamente en ese rango.
- Adicionalmente, considerar pausar updates durante exposiciones importantes (`Pause updates` por 1-5 semanas).

---

## Paso 8 — Pre-cargar los drivers de los 5 Arduinos

**Antes del día de inauguración**:

1. Decidir qué puertos USB se van a usar definitivamente para los 5 Arduinos.
2. Enchufar cada Arduino, uno por uno, a su puerto definitivo.
3. Esperar a que Windows muestre la notificación "Device is ready to use" (puede tardar 10-30 segundos por Arduino la primera vez).
4. Cuando los 5 estén instalados, NO mover los Arduinos a otros puertos USB.

> El orden de los puertos USB no afecta al juego (cada Arduino se identifica por las teclas que manda, no por el puerto). Pero pre-cargar drivers evita que en la inauguración el primer enchufe tarde 30 segundos en responder.

---

## Paso 9 — Test end-to-end

1. **Reiniciar la PC.**
2. Sin tocar nada: en menos de **1 minuto** la pantalla debe mostrar Chrome en kiosk con la pantalla de standby del juego.
3. Apretar el botón tech físico (Arduino del encargado) → arranca la cuenta regresiva.
4. Jugar una ronda completa con 5 jugadores → verificar que cada Arduino activa al jugador correcto.
5. Cerrar Chrome con Alt+F4 → debe reabrir en ~3 segundos.
6. Apagar y prender la PC → todo arranca de nuevo.

---

## Comandos útiles de mantenimiento

```powershell
# Ver estado del server
pm2 status

# Ver logs en vivo
pm2 logs museodelgato

# Reiniciar manualmente el server
pm2 restart museodelgato

# Parar el server (no se reinicia hasta el próximo boot o pm2 start)
pm2 stop museodelgato

# Después de hacer git pull con cambios de código:
cd C:\museodelgato\estacion2
git pull
pnpm install     # si hubo cambios en package.json
pnpm run build
pm2 restart museodelgato
```

---

## Modo dev / debug en la PC del museo

Si necesitas debug en sitio sin desarmar todo:

1. Salir del kiosko: abrir Task Manager (`Ctrl+Shift+Esc`) → terminar el proceso `cmd.exe` que está corriendo `start-kiosk-loop.bat` → cerrar Chrome con `Alt+F4`.
2. Abrir un Chrome normal en `http://localhost:3000` **sin el query `?kiosk=1`** → aparece la UI de debug arriba a la derecha (pads on-screen, botones de Tech, Fullscreen, etc.) y el legend de teclas.
3. Abrir DevTools (`F12`) para ver los `console.log` de cada press: `Player N, Botón M (LABEL)`.

> **Convención de URL**:
> - `http://localhost:3000` → modo desarrollo (UI dev visible).
> - `http://localhost:3000/?kiosk=1` → modo museo (UI dev oculta). Es la URL que abre el `.bat` automáticamente.

Para volver al kiosko: doble-click manualmente al acceso directo de `start-kiosk-loop.bat` que está en `shell:startup`, o reiniciar la PC.

---

## Troubleshooting

**Chrome no arranca al boot.**
- Verificar que el `.bat` esté en `shell:startup` (Win+R → `shell:startup`).
- Abrir el `.bat` manualmente desde el explorador para ver si hay error en la ventana de consola.
- Verificar que la ruta de chrome.exe sea correcta (puede estar en `C:\Program Files (x86)\Google\Chrome\...` en algunas instalaciones).

**El server no arranca al boot (Chrome muestra "This site can't be reached").**
- `pm2 status` → ¿está `online`? Si no, `pm2 logs museodelgato` para ver el error.
- Verificar que `pnpm` esté en el PATH del servicio. Si pm2-installer no lo encontró, usar el path absoluto en `ecosystem.config.cjs` (ver Paso 4).

**Los Arduinos no responden.**
- Abrir `http://localhost:3000/?dev=1` y `F12` para ver consola.
- Apretar un botón físico → debería aparecer `Player N, Botón M`.
- Si no aparece nada: Windows no está reconociendo el Arduino como teclado. Desenchufar y reenchufar; revisar Device Manager bajo "Keyboards" — debe aparecer "USB Keyboard Device" o "HID Keyboard Device".
- Si aparece pero con player equivocado: el Arduino está flasheado con el `PLAYER_ID` incorrecto. Pedir al dev de hardware que lo reflashee.

**Windows Update reinició la PC en medio del horario del museo.**
- Configurar Active Hours más amplios (Paso 7).
- Considerar pausar updates durante eventos especiales.
