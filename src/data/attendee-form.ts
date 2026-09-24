/**
 * Catálogo del formulario de asistentes.
 *
 * Las preguntas viven en el código y no en el panel porque de estos campos
 * dependen el check-in, la escarapela impresa, el pasaporte y los filtros.
 *
 * Lo que cambia por país son los documentos de identidad y cómo se llama cada
 * nivel de estudios. Se elige con el país del evento (`EVENT.country`); para
 * México aplica el bloque `MX` (CURP / INE, licenciatura, TSU, preparatoria).
 *
 * Cada opción lleva su texto en español (`label`) y en inglés (`en`). El panel
 * y el CSV usan siempre el español —son herramientas del equipo—; el
 * formulario público elige con `labelOf()` según el idioma de la página.
 */

import { EVENT } from "@/lib/constants";

const EVENT_COUNTRY = EVENT.country;

export type CountryCode = "CL" | "CO" | "MX" | "AR";

/** El idioma en el que se muestra una opción. */
export type Locale = "es" | "en";

/** Cómo se valida el número, según el tipo de documento. */
export type DocRule =
  /** Sólo dígitos, entre `min` y `max`. */
  | { kind: "digits"; min: number; max: number }
  /** RUN/RUT chileno: se comprueba el dígito verificador. */
  | { kind: "run" }
  /** CURP mexicana: 18 caracteres con estructura fija. */
  | { kind: "curp" }
  /** Alfanumérico suelto: pasaportes y documentos de otros países. */
  | { kind: "loose"; min: number; max: number };

/** Lo mínimo que tiene cualquier opción traducible. */
export type Traducible = { label: string; en: string };

export type DocType = Traducible & {
  /** Se guarda en la base; no cambiarlo sin migrar. */
  value: string;
  /** Ejemplo de formato, para el marcador de posición del campo. */
  example: string;
  exampleEn?: string;
  rule: DocRule;
};

export type RoleGroup = "students" | "teaching" | "work" | "other";

export type RoleOption = Traducible & {
  value: string;
  /** Agrupa el desplegable. */
  group: RoleGroup;
};

export type EntityType = Traducible & { value: string };

/** Devuelve el texto de una opción en el idioma pedido. */
export function labelOf(o: Traducible, locale: Locale = "es"): string {
  return locale === "en" ? o.en : o.label;
}

/** Cabeceras de los grupos del desplegable de roles. */
export const ROLE_GROUPS: Record<RoleGroup, Traducible> = {
  students: { label: "Estudiantes", en: "Students" },
  teaching: { label: "Docencia", en: "Teaching" },
  work: { label: "Trabajo", en: "Work" },
  other: { label: "Otro", en: "Other" },
};

// ── Documentos ───────────────────────────────────────────────────────────────

/**
 * Pasaporte y documento extranjero se repiten en los cuatro países: a un evento
 * abierto siempre llega gente de fuera, y sin estas dos opciones quedaría
 * obligada a inventar un número.
 */
const FOREIGN: DocType[] = [
  {
    value: "PASSPORT",
    label: "Pasaporte",
    en: "Passport",
    example: "AB1234567",
    rule: { kind: "loose", min: 5, max: 20 },
  },
  {
    value: "FOREIGN",
    label: "Documento extranjero / Otro",
    en: "Foreign ID / Other",
    example: "Número de tu documento",
    exampleEn: "Your document number",
    rule: { kind: "loose", min: 4, max: 20 },
  },
];

export const DOC_TYPES: Record<CountryCode, DocType[]> = {
  CL: [
    {
      value: "RUN",
      label: "RUN / Cédula de identidad",
      en: "RUN / National ID",
      example: "12.345.678-5",
      rule: { kind: "run" },
    },
    ...FOREIGN,
  ],
  CO: [
    {
      value: "CC",
      label: "Cédula de ciudadanía",
      en: "National ID card (CC)",
      example: "1012345678",
      rule: { kind: "digits", min: 6, max: 10 },
    },
    {
      value: "TI",
      label: "Tarjeta de identidad",
      en: "Youth ID card (TI)",
      example: "1012345678",
      rule: { kind: "digits", min: 8, max: 11 },
    },
    {
      value: "CE",
      label: "Cédula de extranjería",
      en: "Foreigner ID card (CE)",
      example: "1234567",
      rule: { kind: "digits", min: 5, max: 8 },
    },
    {
      value: "PPT",
      label: "Permiso por Protección Temporal",
      en: "Temporary Protection Permit (PPT)",
      example: "1234567",
      rule: { kind: "digits", min: 5, max: 12 },
    },
    ...FOREIGN,
  ],
  MX: [
    {
      value: "CURP",
      label: "CURP",
      en: "CURP",
      example: "GOMC800101HDFNRR09",
      rule: { kind: "curp" },
    },
    {
      value: "INE",
      label: "INE / Credencial para votar",
      en: "INE / Voter ID",
      example: "Clave de elector",
      exampleEn: "Voter key",
      rule: { kind: "loose", min: 10, max: 20 },
    },
    ...FOREIGN,
  ],
  AR: [
    {
      value: "DNI",
      label: "DNI",
      en: "DNI",
      example: "34123456",
      rule: { kind: "digits", min: 7, max: 8 },
    },
    ...FOREIGN,
  ],
};

// ── Roles ────────────────────────────────────────────────────────────────────

/**
 * Los niveles de estudio se nombran distinto en cada país. Con la etiqueta
 * equivocada la persona elige "Otro" y escribe a mano lo que debió ser una
 * opción. En inglés se conserva la sigla local entre paréntesis (TSU, IP…).
 */
const COMMON_ROLES: RoleOption[] = [
  { value: "postgrad", label: "Estudiante de posgrado", en: "Postgraduate student", group: "students" },
  { value: "teacher", label: "Docente / Profesor", en: "Teacher / Professor", group: "teaching" },
  { value: "researcher", label: "Investigador", en: "Researcher", group: "teaching" },
  { value: "professional", label: "Profesional / Trabajador", en: "Professional / Employed", group: "work" },
  { value: "founder", label: "Emprendedor / Fundador", en: "Founder / Entrepreneur", group: "work" },
  { value: "freelance", label: "Independiente / Freelance", en: "Freelance / Self-employed", group: "work" },
  { value: "jobseeker", label: "Buscando trabajo", en: "Looking for work", group: "work" },
  { value: "other", label: "Otro", en: "Other", group: "other" },
];

export const ROLES: Record<CountryCode, RoleOption[]> = {
  CL: [
    { value: "student_university", label: "Estudiante universitario", en: "University student", group: "students" },
    { value: "student_ip", label: "Estudiante de Instituto Profesional (IP)", en: "Professional Institute (IP) student", group: "students" },
    { value: "student_cft", label: "Estudiante de Centro de Formación Técnica (CFT)", en: "Technical Training Centre (CFT) student", group: "students" },
    { value: "student_school", label: "Estudiante de enseñanza media", en: "High school student", group: "students" },
    ...COMMON_ROLES,
  ],
  CO: [
    { value: "student_university", label: "Estudiante universitario", en: "University student", group: "students" },
    { value: "student_tech", label: "Estudiante técnico o tecnólogo", en: "Technical or technologist student", group: "students" },
    { value: "student_sena", label: "Aprendiz SENA", en: "SENA apprentice", group: "students" },
    { value: "student_school", label: "Estudiante de colegio", en: "School student", group: "students" },
    ...COMMON_ROLES,
  ],
  MX: [
    { value: "student_university", label: "Estudiante de licenciatura", en: "Undergraduate student", group: "students" },
    { value: "student_tsu", label: "Estudiante de TSU / Técnico superior", en: "Higher technician (TSU) student", group: "students" },
    { value: "student_school", label: "Estudiante de preparatoria o bachillerato", en: "High school student", group: "students" },
    ...COMMON_ROLES,
  ],
  AR: [
    { value: "student_university", label: "Estudiante universitario", en: "University student", group: "students" },
    { value: "student_terciario", label: "Estudiante terciario", en: "Tertiary student", group: "students" },
    { value: "student_school", label: "Estudiante secundario", en: "Secondary school student", group: "students" },
    ...COMMON_ROLES,
  ],
};

// ── Entidad ──────────────────────────────────────────────────────────────────

export const ENTITY_TYPES: Record<CountryCode, EntityType[]> = {
  CL: [
    { value: "university", label: "Universidad", en: "University" },
    { value: "ip", label: "Instituto Profesional", en: "Professional Institute (IP)" },
    { value: "cft", label: "Centro de Formación Técnica", en: "Technical Training Centre (CFT)" },
    { value: "school", label: "Colegio / Liceo", en: "School" },
    { value: "company", label: "Empresa", en: "Company" },
    { value: "org", label: "Organización o comunidad", en: "Organisation or community" },
    { value: "none", label: "Ninguna / Independiente", en: "None / Independent" },
  ],
  CO: [
    { value: "university", label: "Universidad", en: "University" },
    { value: "tech", label: "Institución técnica o tecnológica", en: "Technical or technological institution" },
    { value: "sena", label: "SENA", en: "SENA" },
    { value: "school", label: "Colegio", en: "School" },
    { value: "company", label: "Empresa", en: "Company" },
    { value: "org", label: "Organización o comunidad", en: "Organisation or community" },
    { value: "none", label: "Ninguna / Independiente", en: "None / Independent" },
  ],
  MX: [
    { value: "university", label: "Universidad", en: "University" },
    { value: "tech", label: "Universidad Tecnológica o Politécnica", en: "Technological or Polytechnic University" },
    { value: "school", label: "Preparatoria o bachillerato", en: "High school" },
    { value: "company", label: "Empresa", en: "Company" },
    { value: "org", label: "Organización o comunidad", en: "Organisation or community" },
    { value: "none", label: "Ninguna / Independiente", en: "None / Independent" },
  ],
  AR: [
    { value: "university", label: "Universidad", en: "University" },
    { value: "terciario", label: "Instituto terciario", en: "Tertiary institute" },
    { value: "school", label: "Escuela secundaria", en: "Secondary school" },
    { value: "company", label: "Empresa", en: "Company" },
    { value: "org", label: "Organización o comunidad", en: "Organisation or community" },
    { value: "none", label: "Ninguna / Independiente", en: "None / Independent" },
  ],
};

/** Máximo para los campos de texto libre ("Otro" y el nombre de la entidad). */
export const FREE_TEXT_MAX = 80;

/** El código del país del evento, tolerante a cómo esté escrito en EVENT. */
export function countryCodeOf(name: string): CountryCode {
  const n = name.trim().toLowerCase();
  if (n.startsWith("colomb")) return "CO";
  if (n.startsWith("m") && n.includes("xico")) return "MX";
  if (n.startsWith("argent")) return "AR";
  return "CL";
}

// ── Códigos → etiquetas ──────────────────────────────────────────────────────

/**
 * Los registros guardan códigos; estas funciones los traducen para mostrar.
 *
 * Esa separación es la que permite cambiar el texto de una opción —o añadirle
 * un idioma— sin tocar los registros ya guardados. Si un código no está en el
 * catálogo —porque la opción se retiró después— se devuelve el código tal cual
 * en vez de una cadena vacía: es feo, pero pierde menos información que no
 * mostrar nada.
 *
 * Por defecto responden en español, que es lo que usan el panel y el CSV.
 */

export function attendanceLabelOf(code: string, locale: Locale = "es"): string {
  if (code === "online") return "Online";
  return locale === "en" ? "In person" : "Presencial";
}

export function roleLabelOf(
  code: string,
  other?: string | null,
  locale: Locale = "es",
  country = countryCodeOf(EVENT_COUNTRY),
): string {
  if (code === "other") return other || (locale === "en" ? "Other" : "Otro");
  const o = ROLES[country].find((r) => r.value === code);
  return o ? labelOf(o, locale) : code;
}

export function entityLabelOf(
  code: string,
  locale: Locale = "es",
  country = countryCodeOf(EVENT_COUNTRY),
): string {
  const o = ENTITY_TYPES[country].find((e) => e.value === code);
  return o ? labelOf(o, locale) : code;
}

export function docTypeLabelOf(
  code: string | null,
  locale: Locale = "es",
  country = countryCodeOf(EVENT_COUNTRY),
): string {
  if (!code) return "";
  const o = DOC_TYPES[country].find((d) => d.value === code);
  return o ? labelOf(o, locale) : code;
}
