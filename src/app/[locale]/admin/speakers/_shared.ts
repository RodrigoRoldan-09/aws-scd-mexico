import type { FC } from "react";
import { Clock, Eye, CalendarCheck, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import {
  IconAws, IconFacebook, IconGithub, IconGlobe, IconInstagram, IconLinkedin,
  IconRss, IconX,
} from "@/components/ui/social-icons";

/**
 * Tipos y constantes de la pantalla de speakers (una sola lista y una ficha
 * por persona).
 */

export type SortMode =
  | "approval_date" | "name_asc" | "name_desc" | "lastname_asc"
  | "international_first" | "custom";

/**
 * Los estados del trámite.
 *
 * Son los mismos seis del modelo (`PROFILE_STATUSES`); si se agrega uno allá,
 * hay que agregarlo acá o la tabla falla al leerlo.
 */
export type SpeakerStatus =
  | "submitted" | "reviewing" | "accepted" | "waitlisted" | "rejected" | "scheduled";

export type SpeakerType = "local" | "international";

/** Una persona que postuló, tal como la sirve `/api/speakers`. */
export interface SpeakerRow {
  id: string;
  slug: string;
  submittedAt: string;
  approved: boolean;
  approvedAt: string | null;
  scheduledAt: string | null;
  status: SpeakerStatus;
  speakerType: SpeakerType | null;
  profileId: string | null;

  // ── Publicación ──
  isPublic: boolean;
  track: string;
  sortOrder: number;
  cardApproved: boolean;
  cardImageUrl: string;

  // ── La persona ──
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  countryCity: string;
  role: string;
  tagline: string;
  company: string;
  companyLogo: string;
  bio: string;
  photo: string;
  firstTimeSpeaker: boolean;

  // ── La charla ──
  talkTitle: string;
  talkAbstract: string;
  sessionType: string;
  preRecordingDate: string;
  audienceLevel: string;
  language: string;
  requirements: string;

  social: {
    builderCenter: string;
    linkedin: string;
    twitter: string;
    github: string;
    instagram: string;
    website: string;
    blog: string;
    facebook: string;
  };
  coSpeakers: {
    name: string; email: string; role: string; company: string;
    photo: string; tagline: string; countryCity: string;
  }[];
}

/** Nombre completo de una fila, con el correo como último recurso. */
export function speakerName(s: Pick<SpeakerRow, "name" | "firstName" | "lastName" | "email">): string {
  return s.name || `${s.firstName} ${s.lastName}`.trim() || s.email || "—";
}

/**
 * Qué es cada estado.
 *
 * `means` se muestra en la ficha para explicar qué implica cada uno.
 */
export const STATUS: Record<
  SpeakerStatus,
  {
    label: string;
    means: string;
    tone: "neutral" | "info" | "good" | "warn" | "danger" | "accent";
    Icon: FC<{ className?: string }>;
  }
> = {
  submitted: {
    label: "Postulado",
    means: "Llegó la propuesta y todavía no la ha mirado nadie.",
    tone: "neutral",
    Icon: Clock,
  },
  reviewing: {
    label: "En revisión",
    means: "Alguien del equipo la está evaluando.",
    tone: "info",
    Icon: Eye,
  },
  accepted: {
    label: "Aceptado",
    means: "Va al evento y ya recibió el correo con su carta. Falta darle sala y hora.",
    tone: "good",
    Icon: CheckCircle2,
  },
  scheduled: {
    label: "Agendado",
    means: "Aceptado y con sala y hora asignadas en la agenda.",
    tone: "accent",
    Icon: CalendarCheck,
  },
  waitlisted: {
    label: "En espera",
    means: "Gusta la propuesta pero no hay cupo ahora mismo.",
    tone: "warn",
    Icon: Hourglass,
  },
  rejected: {
    label: "Rechazado",
    means: "No entra en esta edición.",
    tone: "danger",
    Icon: XCircle,
  },
};

/** El camino normal. Lo de fuera —espera y rechazo— son desvíos, no etapas. */
export const CAMINO: SpeakerStatus[] = ["submitted", "reviewing", "accepted", "scheduled"];

/**
 * Qué pasa al mover a alguien a cada estado.
 *
 * `mail` es lo importante: de todas las acciones, la única que le escribe a la
 * persona es aprobar.
 */
export const MOVER: Record<SpeakerStatus, { verb: string; what: string; mail: boolean }> = {
  submitted: {
    verb: "Devolver a la bandeja",
    what: "Vuelve a quedar como recién llegada, sin revisar.",
    mail: false,
  },
  reviewing: {
    verb: "Empezar a revisar",
    what: "Queda marcada como que alguien la está mirando.",
    mail: false,
  },
  accepted: {
    verb: "Aprobar y avisarle",
    what: "Queda aceptada y se le envía el correo con la carta en PDF.",
    mail: true,
  },
  scheduled: {
    verb: "Agendar",
    what: "Se le da sala y hora desde la agenda.",
    mail: false,
  },
  waitlisted: {
    verb: "Dejar en espera",
    what: "Queda como buena propuesta sin cupo, por si se abre uno.",
    mail: false,
  },
  rejected: {
    verb: "Rechazar",
    what: "Queda fuera de esta edición.",
    mail: false,
  },
};

/**
 * A dónde se puede mover desde cada estado, separado en avanzar y volver atrás.
 *
 * `accepted` y `scheduled` no aparecen nunca: `PATCH /api/speakers/[id]/status`
 * sólo admite los otros cuatro —aceptar es `POST /approve`, que además manda el
 * correo, y agendar lo hace la pantalla de sesiones—. Ofrecer «pasar a
 * aceptado» acá sería un botón que siempre responde 400. `volver` permite
 * deshacer una aceptación por error.
 */
export const TRANSICIONES: Record<
  SpeakerStatus,
  { avanzar: SpeakerStatus[]; volver: SpeakerStatus[] }
> = {
  submitted: { avanzar: ["reviewing", "waitlisted", "rejected"], volver: [] },
  reviewing: { avanzar: ["waitlisted", "rejected"], volver: ["submitted"] },
  accepted: { avanzar: ["waitlisted", "rejected"], volver: ["reviewing"] },
  scheduled: { avanzar: ["waitlisted", "rejected"], volver: ["reviewing"] },
  waitlisted: { avanzar: ["rejected"], volver: ["reviewing", "submitted"] },
  rejected: { avanzar: [], volver: ["reviewing", "waitlisted"] },
};

export const SORT_OPTIONS: { value: SortMode; label: string; desc: string }[] = [
  { value: "approval_date", label: "Orden de aprobación", desc: "Según cuándo fueron aprobados" },
  { value: "name_asc", label: "Nombre A → Z", desc: "Alfabético por primer nombre" },
  { value: "name_desc", label: "Nombre Z → A", desc: "Alfabético inverso" },
  { value: "lastname_asc", label: "Apellido A → Z", desc: "Alfabético por apellido" },
  { value: "international_first", label: "Internacionales primero", desc: "Speakers internacionales al inicio" },
  { value: "custom", label: "A mano", desc: "El orden lo defines tú, arrastrando" },
];

export const SESSION_TYPE_LABEL: Record<string, string> = {
  online: "Online",
  "in-person": "Presencial",
};

export const LEVEL_LABEL: Record<string, string> = {
  "100": "100 · Introductorio",
  "200": "200 · Intermedio",
  "300": "300 · Avanzado",
  "400": "400 · Experto",
};

export const LANG_LABEL: Record<string, string> = { es: "Español", en: "Inglés" };

/**
 * Los tracks salen de `@/data/session-tracks`, que es la lista única. Se
 * re-exportan para quien ya los importaba de acá.
 */
export { TRACKS, trackLabel, trackColor } from "@/data/session-tracks";

/** Las redes que puede tener un speaker, con su etiqueta y su marca. */
export const SOCIAL_FIELDS: {
  key: keyof SpeakerRow["social"];
  label: string;
  Icon: FC<{ className?: string }>;
}[] = [
  { key: "builderCenter", label: "AWS Builder Center", Icon: IconAws },
  { key: "linkedin", label: "LinkedIn", Icon: IconLinkedin },
  { key: "twitter", label: "X", Icon: IconX },
  { key: "github", label: "GitHub", Icon: IconGithub },
  { key: "instagram", label: "Instagram", Icon: IconInstagram },
  { key: "facebook", label: "Facebook", Icon: IconFacebook },
  { key: "blog", label: "Blog", Icon: IconRss },
  { key: "website", label: "Sitio web", Icon: IconGlobe },
];
