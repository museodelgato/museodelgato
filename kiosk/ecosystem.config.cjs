/**
 * Configuración pm2 para correr el server Next.js de "Museo del Gato"
 * como servicio Windows que arranca automáticamente con la PC.
 *
 * Uso (una sola vez en la PC del museo — ver kiosk/INSTALL.md):
 *   1. pnpm add -g pm2
 *   2. Instalar pm2-installer (https://github.com/jessety/pm2-installer)
 *      para que pm2 corra como servicio Windows desde el arranque.
 *   3. cd C:\museodelgato\estacion2
 *   4. pnpm run build   (única vez, o cada vez que cambie el código)
 *   5. pm2 start kiosk/ecosystem.config.cjs
 *   6. pm2 save
 *
 * Verificar:
 *   - pm2 status        → muestra "museodelgato" como "online"
 *   - pm2 logs museodelgato → ver logs del server
 *   - reiniciar la PC → el server debe arrancar solo
 */

module.exports = {
  apps: [
    {
      name: "museodelgato",
      // IMPORTANTE: ajustar este path al directorio real del repo en la PC del museo.
      cwd: "C:\\museodelgato\\estacion2",
      // Llamamos a pnpm directamente. En Windows pnpm vive típicamente en
      // %APPDATA%\npm\pnpm.cmd o similar — pm2 lo resuelve via PATH.
      script: "pnpm",
      args: "start",
      // Si pm2 no encuentra "pnpm" en PATH al arrancar como servicio, cambiar
      // script al path absoluto, por ejemplo:
      //   script: "C:\\Users\\<usuario>\\AppData\\Roaming\\npm\\pnpm.cmd",
      autorestart: true,
      max_restarts: 50,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      // Logs
      out_file: "C:\\museodelgato\\logs\\out.log",
      error_file: "C:\\museodelgato\\logs\\error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
