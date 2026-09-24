/**
 * Los tracks de una charla, en un solo sitio.
 *
 * Ojo con el nombre: `tracks.ts` es otra cosa —los carriles de contenido que
 * se anuncian en la portada—. Éstos son la categoría a la que pertenece una
 * sesión, y los usan la agenda, los salones y los speakers.
 */

export type SessionTrack = {
  value: string;
  label: string;
  /** Clases del distintivo: borde, fondo y tinta. */
  color: string;
};

export const TRACKS: SessionTrack[] = [
  { value: "general", label: "General", color: "border-surface-500 bg-surface-700 text-surface-100" },
  { value: "cloud", label: "Cloud Fundamentals", color: "border-blue-500/50 bg-blue-500/15 text-blue-300" },
  { value: "devops", label: "DevOps & Platform", color: "border-emerald/50 bg-emerald/15 text-emerald" },
  { value: "security", label: "Security", color: "border-red-500/50 bg-red-500/15 text-red-300" },
  { value: "data", label: "Data & Analytics", color: "border-sky-400/50 bg-sky-400/15 text-sky-300" },
  { value: "ai-ml", label: "AI / ML", color: "border-aws-orange/50 bg-aws-orange/15 text-aws-orange" },
  { value: "serverless", label: "Serverless", color: "border-amber-400/50 bg-amber-400/15 text-amber-300" },
  { value: "soft-skills", label: "Soft Skills", color: "border-pink-400/50 bg-pink-400/15 text-pink-300" },
];

const POR_VALOR = new Map(TRACKS.map((t) => [t.value, t]));

/** La etiqueta de un track. Si llega uno que no está, se devuelve tal cual. */
export function trackLabel(value: string): string {
  return POR_VALOR.get(value)?.label ?? value;
}

/** Las clases del distintivo de un track. */
export function trackColor(value: string): string {
  return POR_VALOR.get(value)?.color ?? "border-surface-500 bg-surface-700 text-surface-100";
}

/** Para los desplegables que admiten «sin track». */
export const TRACKS_CON_VACIO: { value: string; label: string }[] = [
  { value: "", label: "Sin track específico" },
  ...TRACKS.map(({ value, label }) => ({ value, label })),
];
