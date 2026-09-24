import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Prefijo de rutas estáticas; sólo aplica en el export a GitHub Pages. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Generates a locale-aware path respecting localePrefix: "as-needed".
 *  Spanish (default) → no prefix. English → /en prefix.
 *  path must start with "/" (e.g. "/registro") or be "" for home.
 */
export function localePath(locale: string, path: string = ""): string {
  if (locale === "es") return path || "/";
  return `/${locale}${path}`;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Enmascara un correo para mostrarlo parcialmente: johseacu@gmail.com → joh****@g****.com */
export function maskEmail(email: string): string {
  const [local, domain] = (email || "").split("@");
  if (!local || !domain) return email || "";
  const maskLocal = local.length <= 3 ? `${local[0] ?? ""}***` : `${local.slice(0, 3)}****`;
  const dot = domain.lastIndexOf(".");
  const dom = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : "";
  return `${maskLocal}@${dom[0] ?? ""}****${tld}`;
}

export interface BadgeNameOption {
  first: string;
  last: string;
  label: string;
}

/** Builds the badge-name choices from what the attendee registered.
 *  Splits first names and last names into tokens (UPPERCASE) and returns
 *  every first×last combination. Default = first token of each.
 *  e.g. "JOHAN SEBASTIÁN" + "ACUÑA BERNAL" →
 *    JOHAN ACUÑA (default) · SEBASTIÁN ACUÑA · JOHAN BERNAL · SEBASTIÁN BERNAL
 */
export function badgeNameOptions(first: string, last: string): {
  firsts: string[];
  lasts: string[];
  options: BadgeNameOption[];
  default: BadgeNameOption;
} {
  const firstRaw = (first || "").trim();
  const lastRaw = (last || "").trim();

  const firsts = (firstRaw.split(/\s+/).filter(Boolean).map((s) => s.toUpperCase()));
  const lasts = (lastRaw.split(/\s+/).filter(Boolean).map((s) => s.toUpperCase()));

  const firstsSafe = firsts.length ? firsts : [""];
  const lastsSafe = lasts.length ? lasts : [""];

  const options: BadgeNameOption[] = [];
  for (const first of firstsSafe) {
    for (const last of lastsSafe) {
      options.push({ first, last, label: [first, last].filter(Boolean).join(" ") });
    }
  }

  return { firsts: firstsSafe, lasts: lastsSafe, options, default: options[0] };
}
