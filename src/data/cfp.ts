/**
 * Call for Speakers — AWS Student Community Day México-CDMX 2026.
 * Horas de la Ciudad de México (UTC-6); los ISO llevan el offset explícito
 * para no depender de la zona horaria del navegador. Los textos con la fecha
 * escrita están en i18n ("CFP") y en el correo de confirmación.
 */

/** Cierre del CFP: 9 de octubre de 2026, 23:59 CDMX. */
export const CFP_DEADLINE = "2026-10-09T23:59:00-06:00";

/**
 * Modalidad de ponencias. Establecido en `false` porque todas las sesiones
 * son 100% presenciales en IPN-Casco Santo Tomas.
 */
export const CFP_ONLINE_SPEAKERS = false;

/** Entrega de diapositivas finales: 28 de octubre de 2026, 23:59 CDMX. */
export const SLIDES_DEADLINE = "2026-10-28T23:59:00-06:00";

/** Hitos del proceso, en orden cronológico. El texto sale de i18n ("CFP"). */
export const cfpMilestones = [
  {
    id: "close",
    dateKey: "milestone_close_date",
    titleKey: "milestone_close_title",
    descKey: "milestone_close_desc",
    highlight: true,
  },
  {
    id: "review",
    dateKey: "milestone_review_date",
    titleKey: "milestone_review_title",
    descKey: "milestone_review_desc",
    highlight: false,
  },
  {
    id: "notify",
    dateKey: "milestone_notify_date",
    titleKey: "milestone_notify_title",
    descKey: "milestone_notify_desc",
    highlight: false,
  },
  {
    id: "slides",
    dateKey: "milestone_slides_date",
    titleKey: "milestone_slides_title",
    descKey: "milestone_slides_desc",
    highlight: false,
  },
] as const;

/** Modalidades de sesión aceptadas. */
export const cfpFormats = [
  {
    id: "talk",
    icon: "Mic",
    durationKey: "format_talk_duration",
    titleKey: "format_talk_title",
    descKey: "format_talk_desc",
  },
  {
    id: "workshop",
    icon: "Laptop",
    durationKey: "format_workshop_duration",
    titleKey: "format_workshop_title",
    descKey: "format_workshop_desc",
  },
] as const;

/** Criterios de selección que se muestran a quien postula. */
export const cfpCriteria = [
  { id: "anonymous", icon: "EyeOff", titleKey: "criteria_anonymous_title", descKey: "criteria_anonymous_desc" },
  { id: "educational", icon: "GraduationCap", titleKey: "criteria_educational_title", descKey: "criteria_educational_desc" },
  { id: "ai", icon: "Sparkles", titleKey: "criteria_ai_title", descKey: "criteria_ai_desc" },
] as const;

/** Tracks y tópicos sugeridos para postular (no son los tracks del landing). */
export const cfpTracks = [
  { id: "foundations", titleKey: "track_foundations_title", topicsKey: "track_foundations_topics" },
  { id: "cloud-ai", titleKey: "track_cloud_ai_title", topicsKey: "track_cloud_ai_topics" },
  { id: "security", titleKey: "track_security_title", topicsKey: "track_security_topics" },
  { id: "career", titleKey: "track_career_title", topicsKey: "track_career_topics" },
] as const;
