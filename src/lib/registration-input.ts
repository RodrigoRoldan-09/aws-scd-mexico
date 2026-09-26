import {
  DOC_TYPES,
  ENTITY_TYPES,
  ROLES,
  countryCodeOf,
  FREE_TEXT_MAX,
} from "@/data/attendee-form";
import { EVENT } from "@/lib/constants";
import { cleanWhitespace, toName, normalizeDocument, normalizeEmail } from "@/lib/normalize";
import type { Attendance } from "@/models/registration";

/**
 * Convierte lo que llega del formulario en los campos del registro.
 *
 * Valida en el servidor, no sólo en el navegador: el formulario público ya
 * comprueba todo esto, pero una petición se puede armar a mano y lo que se
 * guarda tiene que ser válido igual. Es la misma razón por la que el login
 * valida el correo del lado del servidor.
 *
 * Devuelve códigos, no etiquetas — `in-person`, `student_ip` —, que es lo que
 * el modelo guarda.
 */

const COUNTRY = countryCodeOf(EVENT.country);

export type RegistrationInput = {
  firstName: string;
  lastName: string;
  email: string;
  attendance: Attendance;
  documentType: string | null;
  documentNumber: string | null;
  role: string;
  roleOther: string | null;
  entityType: string;
  entityName: string | null;
  fromCommunity: boolean;
  communityName: string | null;
  consent: { codeOfConduct: Date | null; privacy: Date | null };
};

type Parsed = { data: RegistrationInput } | { error: string };

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? cleanWhitespace(v).slice(0, max) : "";

export function parseRegistrationInput(
  raw: Record<string, unknown>,
  opts: { manual?: boolean } = {},
): Parsed {
  // Nombre y apellido se guardan con la caja ya ordenada (ver toName).
  const firstName = toName(str(raw.firstName, 60));
  const lastName = toName(str(raw.lastName, 60));
  if (!firstName) return { error: "Falta el nombre." };
  if (!lastName) return { error: "Falta el apellido." };

  const mail = normalizeEmail(str(raw.email, 200));
  if (!mail.ok) return { error: mail.reason ?? "El correo no es válido." };

  // El evento es 100% presencial en sede IPN.
  const rawAttendance = str(raw.attendance, 20).toLowerCase();
  if (!opts.manual && (rawAttendance === "online" || rawAttendance.startsWith("virtual"))) {
    return { error: "El evento es 100% presencial. No hay modalidad en línea disponible." };
  }

  const attendance: Attendance = "in-person";

  // ── Documento: obligatorio por ser presencial ──
  let documentType: string | null = null;
  let documentNumber: string | null = null;
  const wanted = str(raw.documentType, 40);
  const doc = DOC_TYPES[COUNTRY].find((d) => d.value === wanted || d.label === wanted);
  if (!doc) return { error: "Falta el tipo de documento." };

  const checked = normalizeDocument(str(raw.documentNumber, 30), doc.rule);
  if (!checked.ok) return { error: checked.reason };

  documentType = doc.value;
  documentNumber = checked.value;

  // ── Rol ──
  const wantedRole = str(raw.role, 80);
  const role = ROLES[COUNTRY].find((r) => r.value === wantedRole || r.label === wantedRole);
  // Un rol que no está en el catálogo se guarda como "otro" con su texto: es
  // lo que hace el formulario cuando la persona elige "Otro", y evita perder
  // el dato por no reconocer una etiqueta.
  const roleValue = role ? role.value : "other";
  const roleOther = role && role.value !== "other"
    ? null
    : str(raw.roleOther || wantedRole, FREE_TEXT_MAX) || null;
  if (!roleValue) return { error: "Falta el rol." };
  if (roleValue === "other" && !roleOther) return { error: "Falta indicar cuál es tu rol." };

  // ── Entidad ──
  const wantedEntity = str(raw.entityType, 60);
  const entity = ENTITY_TYPES[COUNTRY].find(
    (e) => e.value === wantedEntity || e.label === wantedEntity,
  );
  if (!entity) return { error: "Falta indicar de dónde vienes." };
  const entityName = entity.value === "none"
    ? null
    : str(raw.entityName, FREE_TEXT_MAX) || null;
  if (entity.value !== "none" && !entityName) {
    return { error: "Falta el nombre de la entidad." };
  }

  // ── Comunidad ──
  const rawFromComm = raw.fromCommunity;
  const fromCommunity = rawFromComm === true || rawFromComm === "true" || rawFromComm === "yes" || rawFromComm === "si" || rawFromComm === "sí";
  const communityName = fromCommunity ? (str(raw.communityName, FREE_TEXT_MAX) || null) : null;
  if (fromCommunity && !communityName) {
    return { error: "Falta indicar el nombre de tu comunidad." };
  }

  // ── Consentimientos ──
  // En el alta manual los da por buenos el staff: la persona ya aceptó en
  // papel o presencialmente, y bloquear el alta ahí sería quedarse sin poder
  // inscribir a alguien en la puerta.
  const now = new Date();
  const accepted = (v: unknown) =>
    v === true || v === "sí" || v === "si" || v === "true" || v === "1";
  const coc = opts.manual || accepted(raw.acceptCoc);
  const priv = opts.manual || accepted(raw.acceptPrivacy);
  if (!coc) return { error: "Falta aceptar el código de conducta." };
  if (!priv) return { error: "Falta autorizar el tratamiento de datos." };

  return {
    data: {
      firstName,
      lastName,
      email: mail.value,
      attendance,
      documentType,
      documentNumber,
      role: roleValue,
      roleOther,
      entityType: entity.value,
      entityName,
      fromCommunity,
      communityName,
      consent: { codeOfConduct: now, privacy: now },
    },
  };
}
