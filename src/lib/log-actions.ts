/**
 * Catálogo único de acciones del registro de actividad. Lo usan la pantalla de
 * logs (etiquetas y filtros) y el API (lista blanca); no duplicarlo.
 */

export type LogGroup = "personas" | "evento" | "contenido" | "sistema" | "peligro";

export const GROUP_LABELS: Record<LogGroup, string> = {
  personas: "Personas",
  evento: "Día del evento",
  contenido: "Contenido",
  sistema: "Sistema",
  peligro: "Destructivas",
};

type Entry = { label: string; group: LogGroup };

/**
 * Lo que el código escribe hoy. Es lo que se puede filtrar.
 *
 * Si se añade un `createLog` con una acción nueva, va acá — si no, sale en
 * crudo en la tabla y no aparece en el desplegable.
 */
export const LOG_ACTIONS: Record<string, Entry> = {
  // ── Personas ──
  REGISTRATION_MANUAL: { label: "Registro manual", group: "personas" },
  REGISTRATION_DELETED: { label: "Registro eliminado", group: "peligro" },
  REGISTRATION_MOVED_TO_VOLUNTEER: { label: "Movido a voluntarios", group: "personas" },
  REGISTRATION_ATTENDANCE_CHANGED: { label: "Cambio de modalidad", group: "personas" },
  VOLUNTEER_APPROVED: { label: "Voluntario aprobado", group: "personas" },
  VOLUNTEER_DELETED: { label: "Voluntario eliminado", group: "peligro" },
  VOLUNTEER_MOVED_TO_REGISTRATION: { label: "Movido a asistentes", group: "personas" },
  SPEAKER_APPROVED: { label: "Speaker aprobado", group: "personas" },
  SPEAKER_STATUS_CHANGED: { label: "Estado de speaker", group: "personas" },
  SPEAKER_MOVED_TO_REGISTRATION: { label: "Speaker a asistentes", group: "personas" },

  // ── Día del evento ──
  CHECK_IN: { label: "Check-in", group: "evento" },
  ATTENDANCE_CONFIRMED: { label: "Asistencia confirmada", group: "evento" },
  SESSION_ATTENDANCE: { label: "Asistencia a sala", group: "evento" },
  MEAL_CLAIMED: { label: "Comida entregada", group: "evento" },
  BADGE_GIVEN: { label: "Badge entregado", group: "evento" },
  BADGE_PRINTED: { label: "Escarapela impresa", group: "evento" },
  CERT_SENT: { label: "Certificado enviado", group: "evento" },
  CERT_NAME_UPDATED: { label: "Nombre de certificado", group: "evento" },
  CAMPAIGN_SENT: { label: "Campaña enviada", group: "evento" },

  // ── Contenido ──
  AGENDA_CREATED: { label: "Agenda creada", group: "contenido" },
  AGENDA_UPDATED: { label: "Agenda editada", group: "contenido" },
  AGENDA_DELETED: { label: "Agenda eliminada", group: "contenido" },
  FAQ_CREATED: { label: "FAQ creada", group: "contenido" },
  FAQ_UPDATED: { label: "FAQ editada", group: "contenido" },
  FAQ_DELETED: { label: "FAQ eliminada", group: "contenido" },
  SPEAKER_PROFILE_CREATED: { label: "Perfil creado", group: "contenido" },
  SPEAKER_PROFILE_UPDATED: { label: "Perfil editado", group: "contenido" },
  SPEAKER_PROFILE_PATCHED: { label: "Perfil retocado", group: "contenido" },
  SPEAKER_PROFILE_DELETED: { label: "Perfil eliminado", group: "peligro" },
  SPEAKER_CARD_APPROVED: { label: "Tarjeta aprobada", group: "contenido" },
  SPEAKER_CARD_RESET: { label: "Tarjeta reiniciada", group: "contenido" },
  SLIDE_TEMPLATE_UPLOADED: { label: "Plantilla subida", group: "contenido" },

  // ── Sistema ──
  USER_LOGIN: { label: "Inició sesión", group: "sistema" },
  USER_LOGOUT: { label: "Cerró sesión", group: "sistema" },
  USER_CREATED: { label: "Cuenta creada", group: "sistema" },
  USER_UPDATED: { label: "Cuenta editada", group: "sistema" },
  USER_INVITE_RESENT: { label: "Invitación reenviada", group: "sistema" },
  FORM_PUBLISHED: { label: "Recepción abierta", group: "sistema" },
  FORM_CLOSED: { label: "Recepción cerrada", group: "sistema" },
  EVENT_CONFIG_UPDATED: { label: "Configuración editada", group: "sistema" },
  PRINT_CONFIG_CREATED: { label: "Preset creado", group: "sistema" },
  PRINT_CONFIG_UPDATED: { label: "Preset editado", group: "sistema" },
  PRINT_CONFIG_DELETED: { label: "Preset eliminado", group: "sistema" },

  // ── Destructivas ──
  DATA_WIPED: { label: "Borrado masivo", group: "peligro" },
};

/**
 * Acciones que ya no se escriben pero siguen en la base.
 *
 * Se conservan sólo para que las filas viejas se lean bien; no salen en el
 * desplegable porque filtrar por ellas sería ofrecer un filtro que hoy no
 * puede devolver nada nuevo.
 */
const LEGACY_LABELS: Record<string, string> = {
  LOGIN: "Inició sesión",
  LOGOUT: "Cerró sesión",
  FORM_EDITED: "Formulario editado",
  FORM_UPDATED: "Formulario editado",
  FORM_UNPUBLISHED: "Formulario despublicado",
};

/** Etiqueta legible. Si la acción no está en ninguna lista, se devuelve tal cual. */
export function labelOfAction(action: string): string {
  return LOG_ACTIONS[action]?.label ?? LEGACY_LABELS[action] ?? action;
}

export function groupOfAction(action: string): LogGroup {
  return LOG_ACTIONS[action]?.group ?? "sistema";
}

export function isLoggedAction(value: string): boolean {
  return Object.hasOwn(LOG_ACTIONS, value);
}

/** El desplegable, agrupado por familia. */
export const ACTIONS_BY_GROUP: { group: LogGroup; actions: string[] }[] = (
  Object.keys(GROUP_LABELS) as LogGroup[]
).map((group) => ({
  group,
  actions: Object.keys(LOG_ACTIONS)
    .filter((a) => LOG_ACTIONS[a].group === group)
    .sort((a, b) => LOG_ACTIONS[a].label.localeCompare(LOG_ACTIONS[b].label, "es")),
}));

/** Los roles que un registro puede llevar. */
export const LOG_ROLES: Record<string, string> = {
  admin: "Admin",
  organizer: "Organizador",
  volunteer: "Voluntario",
  badges: "Badges",
  attendee: "Asistente",
};
