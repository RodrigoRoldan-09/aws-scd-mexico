import { nanoid } from "nanoid";

import { Registration, type Attendance } from "@/models/registration";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { SpeakerProfile } from "@/models/speaker-profile";
import { Passport } from "@/models/passport";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { buildRegistrationEmail } from "@/lib/registration-email";
import { roleLabelOf } from "@/data/attendee-form";
import { createLog } from "@/lib/log";

/**
 * Movimientos de una persona entre listas. Los usan los botones de las tablas
 * y la consola. Cada función devuelve qué pasó de verdad —qué se creó, qué se
 * borró, si salió un correo— para mostrarlo en pantalla.
 *
 * Dos reglas que se respetan en todos los movimientos:
 *
 * 1. Nadie está en dos listas a la vez. Mover significa crear en el destino y
 *    borrar en el origen, no copiar.
 * 2. El pasaporte es del track presencial. Se crea al llegar a presencial y se
 *    borra al salir: quien sigue la transmisión desde su casa no puede sellar
 *    una cartilla pasando por los stands.
 */

/**
 * Quien ejecuta el movimiento.
 *
 * Se tipa acá y no se importa el usuario entero de Mongoose para que estas
 * funciones se puedan llamar desde cualquier ruta sin arrastrar el modelo.
 */
export type Actor = {
  _id: { toString(): string };
  name: string;
  role: "admin" | "organizer" | "volunteer" | "attendee" | "badges";
};

/** Lo que hizo el movimiento, para contarlo tal cual en pantalla. */
export type MoveResult = {
  ok: true;
  /** Frases en orden, ya listas para mostrar. */
  done: string[];
};

/** Faltan datos: la interfaz tiene que pedirlos antes de reintentar. */
export type MoveNeeds = { ok: false; needs: string[]; message: string };

/** El movimiento no aplica (no existe, ya está así, hay un duplicado…). */
export type MoveError = { ok: false; error: string };

export type Move = MoveResult | MoveNeeds | MoveError;

const isNeeds = (v: Move): v is MoveNeeds => !v.ok && "needs" in v;
export { isNeeds };

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Crea el pasaporte de un registro presencial. Idempotente. */
async function ensurePassport(reg: {
  qrCode: string;
  firstName: string;
  lastName: string;
  entityName: string | null;
  role: string;
  roleOther: string | null;
  _id: { toString(): string };
}): Promise<boolean> {
  const existing = await Passport.findOne({ shortId: reg.qrCode }).select("_id").lean();
  if (existing) return false;
  await Passport.create({
    shortId: reg.qrCode,
    role: "attendee",
    firstName: reg.firstName || "Sin",
    lastName: reg.lastName || "Nombre",
    company: reg.entityName ?? undefined,
    jobTitle: roleLabelOf(reg.role, reg.roleOther) || undefined,
    linkedRegistrationId: reg._id.toString(),
    isManual: false,
    viewPin: String(Math.floor(1000 + Math.random() * 9000)),
  });
  return true;
}

// ── Modalidad: online ↔ presencial ───────────────────────────────────────────

/**
 * Cambia la modalidad de un registro y pone al día todo lo que cuelga de ella.
 *
 * Al pasar a presencial hace falta el documento: el registro online no lo pidió
 * —no hay puerta que controlar— y el control de acceso sí lo necesita. Por eso
 * puede responder que faltan datos en vez de hacer el cambio a medias.
 */
export async function changeAttendance(
  id: string,
  to: Attendance,
  extra: Record<string, unknown>,
  actor: Actor,
  opts: { sendMail?: boolean } = {},
): Promise<Move> {
  const reg = await Registration.findById(id);
  if (!reg) return { ok: false, error: "No encontramos ese registro." };
  if (reg.attendance === to) {
    return { ok: false, error: `Ya está en ${to === "online" ? "online" : "presencial"}.` };
  }

  const done: string[] = [];

  if (to === "in-person") {
    // El documento es lo único que el formulario online no pregunta.
    const documentType = str(extra.documentType) || reg.documentType || "";
    const documentNumber = str(extra.documentNumber) || reg.documentNumber || "";
    if (!documentType || !documentNumber) {
      return {
        ok: false,
        needs: ["documentType", "documentNumber"],
        message: "Para entrar a la sede hace falta el documento, que el registro online no pidió.",
      };
    }
    reg.documentType = documentType;
    reg.documentNumber = documentNumber;
    reg.attendance = "in-person";
    await reg.save();
    done.push("Modalidad cambiada a presencial");
    done.push(`Documento guardado (${documentType} ${documentNumber})`);

    if (await ensurePassport(reg)) done.push("Pasaporte creado");
    else done.push("Ya tenía pasaporte, se conservó");
  } else {
    reg.attendance = "online";
    await reg.save();
    done.push("Modalidad cambiada a online");

    // El pasaporte se va con la modalidad: sin recorrido por los stands no hay
    // nada que sellar, y dejarlo sería prometer una cartilla imposible.
    const del = await Passport.deleteMany({ shortId: reg.qrCode });
    if (del.deletedCount) done.push(`${del.deletedCount} pasaporte(s) eliminado(s)`);
  }

  // El correo del track correcto: el de presencial lleva QR y PDF, el de online
  // no lleva ninguno de los dos.
  if (opts.sendMail !== false && reg.email) {
    try {
      const built = await buildRegistrationEmail(
        `${reg.firstName} ${reg.lastName}`.trim(),
        reg.qrCode,
        to,
      );
      const res = await sendEmail({
        from: EMAIL_FROM,
        to: reg.email,
        subject: built.subject,
        html: `${built.html}<!-- ref:${reg.qrCode} -->`,
        attachments: built.attachments,
      });
      if (res.error) {
        reg.emailStatus = "failed";
        reg.emailError = res.error;
        done.push(`El correo falló: ${res.error}`);
      } else {
        reg.emailStatus = "sent";
        reg.emailSentAt = new Date();
        reg.resendId = res.id;
        done.push(to === "in-person" ? "Correo de presencial enviado (con QR y pase)" : "Correo de online enviado");
      }
      await reg.save();
    } catch (e) {
      done.push(`El correo falló: ${(e as Error).message}`);
    }
  }

  await createLog({
    userId: actor._id.toString(),
    userName: actor.name,
    userRole: actor.role,
    action: "REGISTRATION_ATTENDANCE_CHANGED",
    target: `${reg.firstName} ${reg.lastName}`.trim() || reg.email,
    targetId: id,
    details: done.join(" · "),
  });

  return { ok: true, done };
}

// ── Asistente → voluntario ───────────────────────────────────────────────────

/** Lo que el formulario de voluntarios pregunta y el de asistentes no. */
const VOLUNTEER_NEEDS = [
  "phone",
  "availability",
  "interestAreas",
  "shirtSize",
  "dietary",
  "emergencyName",
  "emergencyPhone",
] as const;

export async function registrationToVolunteer(
  id: string,
  extra: Record<string, unknown>,
  actor: Actor,
): Promise<Move> {
  const reg = await Registration.findById(id);
  if (!reg) return { ok: false, error: "No encontramos ese registro." };

  const already = await VolunteerSubmission.findOne({ email: reg.email }).select("_id").lean();
  if (already) {
    return { ok: false, error: "Ese correo ya está en la lista de voluntarios." };
  }

  // El voluntariado es presencial y pregunta cosas que el registro no: si
  // faltan, se piden antes de mover en vez de crear una ficha a medias.
  const needs: string[] = [];
  if (!reg.documentType || !reg.documentNumber) {
    if (!str(extra.documentType)) needs.push("documentType");
    if (!str(extra.documentNumber)) needs.push("documentNumber");
  }
  for (const k of VOLUNTEER_NEEDS) {
    const v = extra[k];
    const empty = k === "interestAreas" ? !Array.isArray(v) || v.length === 0 : !str(v);
    if (empty) needs.push(k);
  }
  if (needs.length) {
    return {
      ok: false,
      needs,
      message: "El voluntariado pide datos que el registro de asistente no tiene.",
    };
  }

  await VolunteerSubmission.create({
    firstName: reg.firstName,
    lastName: reg.lastName,
    email: reg.email,
    phone: str(extra.phone),
    documentType: reg.documentType || str(extra.documentType),
    documentNumber: reg.documentNumber || str(extra.documentNumber),
    role: reg.role,
    roleOther: reg.roleOther,
    entityType: reg.entityType,
    entityName: reg.entityName,
    sbg: str(extra.sbg) || "none",
    availability: str(extra.availability),
    interestAreas: Array.isArray(extra.interestAreas) ? extra.interestAreas.map(String) : [],
    previousExperience: str(extra.previousExperience) || "none",
    motivation: str(extra.motivation),
    shirtSize: str(extra.shirtSize),
    dietary: str(extra.dietary) || "none",
    dietaryOther: str(extra.dietaryOther) || null,
    emergencyName: str(extra.emergencyName),
    emergencyPhone: str(extra.emergencyPhone),
    // Se conserva la fecha del consentimiento original: es la que hay que poder
    // demostrar, no la del día en que se movió la ficha.
    consent: reg.consent,
    submittedAt: new Date(),
  });

  const passports = await Passport.deleteMany({
    $or: [{ linkedRegistrationId: id }, { shortId: reg.qrCode }],
  });
  await Registration.findByIdAndDelete(id);

  const done = [
    "Postulación de voluntario creada",
    "Registro de asistente eliminado",
    ...(passports.deletedCount ? [`${passports.deletedCount} pasaporte(s) eliminado(s)`] : []),
  ];

  await createLog({
    userId: actor._id.toString(),
    userName: actor.name,
    userRole: actor.role,
    action: "REGISTRATION_MOVED_TO_VOLUNTEER",
    target: `${reg.firstName} ${reg.lastName}`.trim() || reg.email,
    targetId: id,
    details: done.join(" · "),
  });

  return { ok: true, done };
}

// ── Voluntario → asistente ───────────────────────────────────────────────────

export async function volunteerToRegistration(
  id: string,
  extra: Record<string, unknown>,
  actor: Actor,
): Promise<Move> {
  const vol = await VolunteerSubmission.findById(id);
  if (!vol) return { ok: false, error: "No encontramos esa postulación." };

  const attendance = str(extra.attendance) === "online" ? "online" : "in-person";
  if (!str(extra.attendance)) {
    return {
      ok: false,
      needs: ["attendance"],
      message: "Falta decidir si asiste presencial o en línea.",
    };
  }

  const existing = await Registration.findOne({ email: vol.email }).select("_id").lean();
  const done: string[] = [];

  if (existing) {
    done.push("Ya existía como asistente, no se duplicó");
  } else {
    const qrCode = nanoid(12);
    const reg = await Registration.create({
      firstName: vol.firstName,
      lastName: vol.lastName,
      email: vol.email,
      attendance,
      // El documento sólo se guarda si va a la sede.
      documentType: attendance === "in-person" ? vol.documentType || null : null,
      documentNumber: attendance === "in-person" ? vol.documentNumber || null : null,
      role: vol.role,
      roleOther: vol.roleOther,
      entityType: vol.entityType,
      entityName: vol.entityName,
      consent: vol.consent,
      qrCode,
      isManual: true,
      emailStatus: "skipped",
    });
    done.push(`Registro de asistente creado (${attendance === "online" ? "online" : "presencial"})`);

    if (attendance === "in-person" && (await ensurePassport(reg))) {
      done.push("Pasaporte creado");
    }
  }

  const passports = await Passport.deleteMany({ linkedRegistrationId: id });
  await VolunteerSubmission.findByIdAndDelete(id);
  done.push("Postulación de voluntario eliminada");
  if (passports.deletedCount) done.push(`${passports.deletedCount} pasaporte(s) de voluntario eliminado(s)`);

  await createLog({
    userId: actor._id.toString(),
    userName: actor.name,
    userRole: actor.role,
    action: "VOLUNTEER_MOVED_TO_REGISTRATION",
    target: `${vol.firstName} ${vol.lastName}`.trim() || vol.email,
    targetId: id,
    details: done.join(" · "),
  });

  return { ok: true, done };
}

// ── Speaker → asistente ──────────────────────────────────────────────────────

/**
 * Para quien postuló como speaker y va a ir igual: rechazado, en lista de
 * espera o simplemente porque no puede presentar.
 *
 * La postulación **no** se borra: el histórico de quién propuso qué es parte
 * del proceso de curaduría y se conserva. Esto sólo le crea su registro de
 * asistente sin que tenga que llenar nada de nuevo.
 */
export async function speakerToRegistration(
  id: string,
  extra: Record<string, unknown>,
  actor: Actor,
): Promise<Move> {
  const speaker = await SpeakerProfile.findById(id);
  if (!speaker) return { ok: false, error: "No encontramos ese speaker." };
  if (!speaker.email) {
    return { ok: false, error: "Ese speaker no tiene correo guardado." };
  }

  const existing = await Registration.findOne({ email: speaker.email }).select("_id").lean();
  if (existing) return { ok: false, error: "Ese correo ya está registrado como asistente." };

  const attendance = str(extra.attendance) === "online" ? "online" : "in-person";
  const needs: string[] = [];
  if (!str(extra.attendance)) needs.push("attendance");
  if (!str(extra.role)) needs.push("role");
  if (!str(extra.entityType)) needs.push("entityType");
  if (attendance === "in-person") {
    if (!str(extra.documentType)) needs.push("documentType");
    if (!str(extra.documentNumber)) needs.push("documentNumber");
  }
  if (needs.length) {
    return {
      ok: false,
      needs,
      message: "El perfil de speaker no guarda rol, entidad ni documento: hay que completarlos.",
    };
  }

  const qrCode = nanoid(12);
  const now = new Date();
  const reg = await Registration.create({
    firstName: speaker.firstName || speaker.name.split(" ")[0] || "Sin",
    lastName: speaker.lastName || speaker.name.split(" ").slice(1).join(" ") || "Nombre",
    email: speaker.email,
    attendance,
    documentType: attendance === "in-person" ? str(extra.documentType) : null,
    documentNumber: attendance === "in-person" ? str(extra.documentNumber) : null,
    role: str(extra.role),
    roleOther: str(extra.roleOther) || null,
    entityType: str(extra.entityType),
    entityName: str(extra.entityName) || speaker.company || null,
    // Aceptó los mismos términos al postular como speaker.
    consent: { codeOfConduct: now, privacy: now },
    qrCode,
    isManual: true,
    emailStatus: "skipped",
  });

  const done = [`Registro de asistente creado (${attendance === "online" ? "online" : "presencial"})`];
  if (attendance === "in-person" && (await ensurePassport(reg))) done.push("Pasaporte creado");
  done.push("La postulación de speaker se conservó");

  await createLog({
    userId: actor._id.toString(),
    userName: actor.name,
    userRole: actor.role,
    action: "SPEAKER_MOVED_TO_REGISTRATION",
    target: speaker.name || speaker.email,
    targetId: id,
    details: done.join(" · "),
  });

  return { ok: true, done };
}
