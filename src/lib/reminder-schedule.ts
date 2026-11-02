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
export const REMINDER_SEND_TIME_LABEL = "9:00 AM (CDMX) · 31 oct y 3 nov también 9:00 PM";

/**
 * Anuncio especial que lleva el recordatorio de cierto día.
 *  - "agenda": ya está publicada la agenda de Main Stage y Builders Stage.
 *  - "registrations": ya se puede registrar a las actividades de todos los escenarios.
 */
export type ReminderAnnouncement = "agenda" | "registrations" | "see-you-soon" | "live";
/**
 * Clave: "AAAA-MM-DD" o "AAAA-MM-DD:slot". El slot llega como ?slot= desde la
 * regla de EventBridge y permite más de un envío el mismo día (cada uno con su
 * propia marca de idempotencia).
 */
export const REMINDER_ANNOUNCEMENTS: Record<string, ReminderAnnouncement> = {
  "2026-10-31": "agenda",
  "2026-11-01": "registrations",
  "2026-11-03:pm": "see-you-soon", // martes 9 PM: último masivo antes del evento
  "2026-11-04": "live", // miércoles 9 AM: el evento ya empezó
};
