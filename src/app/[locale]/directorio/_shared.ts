import { useEffect, useState } from "react";
import type { PublicProfile } from "@/components/sections/speakers";

// Constantes, helpers y tipos compartidos por la página /directorio y sus cards.

// Fecha del evento, en hora de la Ciudad de México (UTC-6 todo el año).
export const EVENT_DATE = "2026-11-04";
export const DEFAULT_DUR_MS = 30 * 60 * 1000;

export function useDebounce<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export const SESSION_LABEL: Record<string, string> = {
  online: "Online", "in-person": "Presencial",
  talk: "Charla", workshop: "Taller", lightning: "Lightning ⚡", panel: "Panel",
};

export const AG_SESSION_LABEL: Record<string, string> = {
  presencial: "Presencial", online: "Online", hibrida: "Híbrida",
};

export const LANG_LABEL: Record<string, string> = {
  es: "Español", en: "English", bilingual: "Bilingüe",
};

export const LEVEL_LABEL: Record<string, string> = {
  "100": "100 · Básico", "200": "200 · Intermedio",
  "300": "300 · Avanzado", "400": "400 · Experto",
};

export const LEVEL_COLORS: Record<string, string> = {
  "100": "bg-emerald/10 text-emerald border-emerald/30",
  "200": "bg-sky-400/10 text-sky-400 border-sky-400/30",
  "300": "bg-[#D85A30]/10 text-[#D85A30] border-[#D85A30]/30",
  "400": "bg-red-400/10 text-red-400 border-red-400/30",
};

// "HH:mm" → ms en la fecha del evento (CDMX, UTC-6).
export function hhmmToMs(hhmm: string): number {
  return new Date(`${EVENT_DATE}T${hhmm || "00:00"}:00-06:00`).getTime();
}

// ms → "HH:mm" hora CDMX.
export function msToKey(ms: number): string {
  return new Date(ms).toLocaleTimeString("es-MX", {
    timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// Mapea el tipo de sesión de la agenda al vocabulario de los filtros.
export function normSessionType(s?: string): string | undefined {
  if (!s) return undefined;
  if (s === "presencial" || s === "hibrida") return "in-person";
  return s; // "online" | "in-person"
}

export interface AgendaEventItem {
  _id: string;
  title: string;
  speaker?: string;
  speakerSlug?: string;
  speakerPhoto?: string;
  description?: string;
  startTime: string;
  endTime: string;
  room: string;
  track: string;
  sessionType?: string;
  level?: string;
  language?: string;
  cta?: string;
}

export type DirItem =
  | {
      kind: "profile"; id: string; profile: PublicProfile;
      track: string; sessionType?: string; language?: string; level?: string; room?: string | null;
      startMs: number; endMs: number; startKey: string; text: string;
    }
  | {
      kind: "event"; id: string; event: AgendaEventItem;
      track: string; sessionType?: string; language?: string; level?: string; room?: string;
      startMs: number; endMs: number; startKey: string; text: string;
    };
