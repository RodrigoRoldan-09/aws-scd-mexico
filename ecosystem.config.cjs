/**
 * pm2 — AWS Student Community Day México.
 *
 * Corre bajo el usuario `ubuntu` (no root): `cwd` y el directorio de logs
 * tienen que pertenecerle, así el despliegue no necesita sudo.
 *
 * Si en el VPS conviven otros sitios, el nombre del proceso y el puerto tienen
 * que ser únicos. Si cambias el puerto, cámbialo también en deploy/nginx.
 */
module.exports = {
  apps: [
    {
      name: "scd-mexico",
      cwd: "/srv/scd-mexico",

      // Se llama al binario de Next directamente y no a "npm start": con npm de
      // intermediario, pm2 vigila al proceso de npm y un reinicio puede dejar
      // huérfano al servidor real ocupando el puerto.
      script: "./node_modules/next/dist/bin/next",
      args: "start",
      interpreter: "node",

      // Una sola instancia: el estado vive en MongoDB y el modo cluster sólo
      // duplicaría la memoria.
      exec_mode: "fork",
      instances: 1,

      env: {
        NODE_ENV: "production",
        PORT: 2000,
      },

      max_memory_restart: "600M",
      min_uptime: "20s",
      max_restarts: 10,
      restart_delay: 4000,

      time: true,
      merge_logs: true,
      // Este directorio tiene que existir y pertenecer a `ubuntu`; si no, el
      // proceso no arranca y el motivo no queda en ningún log.
      out_file: "/var/log/scd-mexico/out.log",
      error_file: "/var/log/scd-mexico/error.log",
    },
  ],
};
