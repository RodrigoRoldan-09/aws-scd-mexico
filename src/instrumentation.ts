/**
 * Instrumentation hook de Next.js.
 *
 * Se ejecuta automáticamente al arrancar o reiniciar la aplicación.
 * Permite buscar en segundo plano los correos de registro que no se pudieron
 * enviar el día anterior por límites de cuota y reenviarlos.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Esperamos 5 segundos para que la conexión a base de datos y el servidor HTTP estén listos
    setTimeout(async () => {
      try {
        const { retryPendingRegistrations } = await import("@/lib/email-queue");
        console.log("[Instrumentation] Verificando correos pendientes al reiniciar la app...");
        await retryPendingRegistrations();
      } catch (err) {
        console.error("[Instrumentation] Error al procesar cola de correos:", err);
      }
    }, 5000);
  }
}
