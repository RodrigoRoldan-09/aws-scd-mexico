import { CalendarDays, GitMerge, Mic2, Monitor, Star, Wifi } from "lucide-react";
import type { FC } from "react";

/**
 * Tipos y constantes del programa (horario, por agendar y salones).
 */

export interface BloqueAgenda {
  _id: string;
  title: string;
  speaker: string;
  speakerSlug: string;
  speakerId?: string;
  description: string;
  startTime: string;
  endTime: string;
  room: string;
  roomId?: string;
  track: string;
  order: number;
  sessionType: "presencial" | "online" | "hibrida";
  level: "" | "100" | "200" | "300" | "400";
  language: "es" | "en" | "bilingual";
  cta: string;
  imageUrl?: string;
  cardImageUrl?: string;
}

export interface Salon {
  id: string;
  name: string;
  capacity?: number;
  virtualLink?: string;
  track?: string;
  order: number;
}

/** Un speaker aceptado, que es a quien se puede agendar. */
export interface SpeakerAceptado {
  id: string;
  name: string;
  slug: string;
  photo: string;
  talkTitle: string;
  talkAbstract: string;
  track: string;
  audienceLevel: string;
  language: string;
  status: string;
}

/** Las tres vistas de la pantalla. Viven en la URL para poder compartir el enlace. */
export type Vista = "horario" | "agendar" | "salones";

export const VISTAS: { key: Vista; label: string }[] = [
  { key: "horario", label: "horario" },
  { key: "agendar", label: "por agendar" },
  { key: "salones", label: "salones" },
];

export const MODALIDAD: Record<
  BloqueAgenda["sessionType"],
  { label: string; Icon: FC<{ className?: string }> }
> = {
  presencial: { label: "Presencial", Icon: Monitor },
  online: { label: "Online", Icon: Wifi },
  hibrida: { label: "Híbrida", Icon: GitMerge },
};

export const MODALIDAD_OPCIONES = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "hibrida", label: "Híbrida" },
];

export const NIVEL_OPCIONES = [
  { value: "", label: "Sin nivel" },
  { value: "100", label: "100 · Introductorio" },
  { value: "200", label: "200 · Intermedio" },
  { value: "300", label: "300 · Avanzado" },
  { value: "400", label: "400 · Experto" },
];

export const IDIOMA_OPCIONES = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "bilingual", label: "Bilingüe" },
];

/** Los tres tipos de bloque que se pueden crear. */
export const TIPOS = [
  { key: "session", label: "Sesión", Icon: Mic2 },
  { key: "keynote", label: "Keynote", Icon: Star },
  { key: "free", label: "Bloque libre", Icon: CalendarDays },
] as const;

export type TipoBloque = (typeof TIPOS)[number]["key"];

export const FORM_VACIO = {
  title: "",
  speaker: "",
  speakerSlug: "",
  description: "",
  startTime: "",
  endTime: "",
  room: "",
  track: "general",
  order: 0,
  sessionType: "presencial" as BloqueAgenda["sessionType"],
  level: "" as BloqueAgenda["level"],
  language: "es" as BloqueAgenda["language"],
  cta: "",
  imageUrl: "",
  cardImageUrl: "",
};

export type FormBloque = typeof FORM_VACIO;

/** Ordena por hora de inicio. Las horas son «HH:MM», así que basta comparar texto. */
export function porHora(a: BloqueAgenda, b: BloqueAgenda) {
  return a.startTime.localeCompare(b.startTime);
}
