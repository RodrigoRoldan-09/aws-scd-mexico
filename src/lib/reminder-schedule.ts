/**
 * Calendario de recordatorios automáticos (fechas en America/Mexico_City).
 * Lo usa el cron /api/cron/send-reminders (solo envía en estas fechas) y el
 * panel de admin para mostrarlo. Sin dependencias de servidor: es seguro
 * importarlo desde componentes de cliente.
 */
export const REMINDER_DATES = ["2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"];

/** Fecha del evento (America/Mexico_City). */
export const REMINDER_EVENT_DATE = "2026-11-04";

/** Hora a la que EventBridge dispara el cron (referencia para la UI). */
export const REMINDER_SEND_TIME_LABEL = "9:00 AM (CDMX)";
