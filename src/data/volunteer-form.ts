import { labelOf, type CountryCode, type Locale, type Traducible } from "./attendee-form";

/**
 * Catálogo del formulario de voluntarios.
 *
 * Mismo criterio que el de asistentes: las preguntas están en el código, no en
 * el panel, porque de ellas dependen la lista de impresión, los correos del
 * equipo y los filtros. Lo único editable desde el panel es la lista de
 * Student Builder Groups, que cambia con cada edición y con cada país.
 */

/**
 * Una opción del formulario, con su texto en los dos idiomas.
 *
 * El panel y el CSV leen siempre `label` —son herramientas del equipo, que
 * trabaja en español—; el formulario público resuelve con `labelOf()`.
 */
export type Option = Traducible & { value: string };

// ── Talla de camiseta ────────────────────────────────────────────────────────

/** Una sola tabla para todos los países: la escala S–XXL es la misma. */
export const SHIRT_SIZES: Option[] = [
  { value: "xs", label: "XS", en: "XS" },
  { value: "s", label: "S", en: "S" },
  { value: "m", label: "M", en: "M" },
  { value: "l", label: "L", en: "L" },
  { value: "xl", label: "XL", en: "XL" },
  { value: "xxl", label: "XXL", en: "XXL" },
];

// ── Disponibilidad ───────────────────────────────────────────────────────────

export const AVAILABILITY: Option[] = [
  { value: "morning", label: "Mañana", en: "Morning" },
  { value: "afternoon", label: "Tarde", en: "Afternoon" },
  { value: "full", label: "Todo el día", en: "All day" },
];

// ── Áreas de interés ─────────────────────────────────────────────────────────

/** Se pueden elegir varias: el equipo rota entre áreas durante el día. */
export const INTEREST_AREAS: Option[] = [
  { value: "registration", label: "Registro y bienvenida", en: "Registration and welcome" },
  { value: "rooms", label: "Logística de sala", en: "Room logistics" },
  { value: "tech", label: "Soporte técnico", en: "Tech support" },
  { value: "social", label: "Redes sociales y fotografía", en: "Social media and photography" },
  { value: "protocol", label: "Protocolo y guías", en: "Protocol and wayfinding" },
  { value: "catering", label: "Alimentación y coffee break", en: "Catering and coffee break" },
  { value: "any", label: "Donde más se necesite", en: "Wherever I am needed most" },
];

// ── Experiencia previa ───────────────────────────────────────────────────────

export const PREVIOUS_EXPERIENCE: Option[] = [
  { value: "none", label: "Es mi primera vez", en: "This is my first time" },
  { value: "some", label: "Sí, en uno o dos eventos", en: "Yes, at one or two events" },
  { value: "lots", label: "Sí, en varios eventos", en: "Yes, at several events" },
];

// ── Alimentación ─────────────────────────────────────────────────────────────

/**
 * Restricciones alimentarias.
 *
 * Hace falta porque el evento incluye almuerzo: sin este dato, el pedido se
 * hace a ciegas y alguien se queda sin comer. Se pregunta con opciones y no
 * como texto libre para poder contar cuántos de cada tipo, que es lo que el
 * proveedor necesita; el campo de texto queda para lo que no encaje.
 */
export const DIETARY: Option[] = [
  { value: "none", label: "Sin restricciones", en: "No restrictions" },
  { value: "vegetarian", label: "Vegetariano", en: "Vegetarian" },
  { value: "vegan", label: "Vegano", en: "Vegan" },
  { value: "gluten_free", label: "Sin gluten / celíaco", en: "Gluten free / coeliac" },
  { value: "lactose_free", label: "Sin lactosa", en: "Lactose free" },
  { value: "other", label: "Otra (la especifico)", en: "Other (I will specify)" },
];

// ── Student Builder Groups ───────────────────────────────────────────────────

/**
 * Clave del ajuste donde se guarda la lista editable, un nombre por línea.
 *
 * Es lo único del formulario que se administra desde el panel: los SBG cambian
 * en cada edición y en cada país, y no tiene sentido volver a desplegar el
 * sitio para agregar uno.
 */
export const SBG_SETTING_KEY = "volunteer_sbg_list";

/** Punto de partida por país, si el ajuste todavía no se ha tocado. */
export const DEFAULT_SBGS: Record<CountryCode, string[]> = {
  CL: ["SBG Duoc UC — Maipú", "SBG Duoc UC — Virtual Campus"],
  CO: [
    "SBG EAN",
    "SBG UDFJC",
    "SBG Universidad de Antioquia",
    "SBG Uniempresarial",
    "SBG Universidad del Valle",
    "SBG Universidad Sergio Arboleda",
  ],
  MX: ["SBG IPN CDMX"],
  AR: [],
};

/** Convierte el ajuste (un nombre por línea) en opciones para el desplegable. */
export function parseSbgList(raw: string, fallback: string[]): Option[] {
  const names = raw
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
  const list = names.length > 0 ? names : fallback;
  return [
    { value: "none", label: "No pertenezco a ninguno", en: "I do not belong to one" },
    // El nombre del grupo es el mismo en los dos idiomas: es un nombre propio.
    ...list.map((n) => ({ value: n, label: n, en: n })),
    { value: "other", label: "Otro (lo escribo)", en: "Other (I will type it)" },
  ];
}

// ── Códigos → etiquetas ──────────────────────────────────────────────────────

/**
 * Las postulaciones guardan códigos; esto los traduce para mostrar.
 *
 * Un código que ya no esté en el catálogo —porque la opción se retiró— se
 * devuelve tal cual: es feo, pero pierde menos información que una celda vacía.
 */
const labelIn = (list: Option[], code: string, locale: Locale = "es"): string => {
  const o = list.find((x) => x.value === code);
  return o ? labelOf(o, locale) : code;
};

export const availabilityLabelOf = (code: string, locale: Locale = "es") =>
  labelIn(AVAILABILITY, code, locale);
export const experienceLabelOf = (code: string, locale: Locale = "es") =>
  labelIn(PREVIOUS_EXPERIENCE, code, locale);
export const shirtSizeLabelOf = (code: string, locale: Locale = "es") =>
  labelIn(SHIRT_SIZES, code, locale);

export function dietaryLabelOf(code: string, other?: string | null, locale: Locale = "es"): string {
  if (code === "other") return other || (locale === "en" ? "Other" : "Otra");
  return labelIn(DIETARY, code, locale);
}

export function interestAreasLabelOf(codes: string[], locale: Locale = "es"): string {
  return codes.map((c) => labelIn(INTEREST_AREAS, c, locale)).join(", ");
}

/** El SBG se guarda con su nombre, así que `none` es lo único que traducir. */
export function sbgLabelOf(value: string, locale: Locale = "es"): string {
  if (value && value !== "none") return value;
  return locale === "en" ? "Not in one" : "No pertenece a ninguno";
}

/** Máximo de los campos de texto libre del formulario. */
export const VOLUNTEER_TEXT_MAX = 80;
/** Máximo del texto de motivación, que sí es un párrafo. */
export const MOTIVATION_MAX = 600;
