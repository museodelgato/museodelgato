@echo off
REM ============================================================
REM  Museo del Gato — Lanzador Chrome kiosk en bucle
REM
REM  Arranca Chrome en modo kiosko apuntando al server Next.js
REM  local. Si Chrome se cierra (por error o por el tecnico), se
REM  reabre automaticamente despues de 3 segundos.
REM
REM  Como se ejecuta automaticamente al iniciar sesion:
REM    1. Win+R -> shell:startup -> pegar un acceso directo a este .bat
REM    2. Reiniciar la PC y verificar
REM
REM  Para salir del kiosko manualmente:
REM    - Alt+F4 cierra Chrome pero el bucle lo reabre
REM    - Para parar el bucle: abrir Task Manager (Ctrl+Shift+Esc)
REM      y terminar el proceso "cmd.exe" que esta corriendo este .bat
REM ============================================================

REM Espera 8 segundos a que pm2 termine de arrancar el server Node
timeout /t 8 /nobreak >nul

:loop
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --kiosk ^
  --autoplay-policy=no-user-gesture-required ^
  --noerrdialogs ^
  --disable-pinch ^
  --disable-infobars ^
  --no-first-run ^
  --disable-session-crashed-bubble ^
  --disable-features=TranslateUI ^
  --user-data-dir="C:\museodelgato-chrome-profile" ^
  http://localhost:3000/?kiosk=1

REM Si Chrome se cierra, esperar 3 segundos y reintentar
timeout /t 3 /nobreak >nul
goto loop
