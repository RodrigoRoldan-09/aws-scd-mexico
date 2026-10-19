import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db";
import { Registration, type IRegistration } from "@/models/registration";
import { Passport } from "@/models/passport";
import { parseRegistrationInput } from "@/lib/registration-input";
import { roleLabelOf } from "@/data/attendee-form";
import { buildRegistrationEmail } from "@/lib/registration-email";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { normalizeEmail } from "@/lib/normalize";

export interface HybridRegistrationResult {
  registration?: IRegistration;
  qrCode?: string;
  createdGeneralRegistration?: boolean;
  error?: string;
  status?: number;
}

export async function ensureGeneralRegistration(
  email: string,
  generalProfile?: Record<string, unknown>,
): Promise<HybridRegistrationResult> {
  await connectDB();

  const normMail = normalizeEmail(email);
  if (!normMail.ok) {
    return { error: normMail.reason || "Correo inválido", status: 400 };
  }
  const cleanEmail = normMail.value;

  const existing = await Registration.findOne({ email: cleanEmail });
  if (existing) {
    return {
      registration: existing,
      qrCode: existing.qrCode,
      createdGeneralRegistration: false,
    };
  }

  // Si no existe, es obligatorio proporcionar generalProfile
  if (!generalProfile || typeof generalProfile !== "object") {
    return {
      error: "Para registrarte debes completar también los datos de tu perfil general del evento.",
      status: 400,
    };
  }

  const parsed = parseRegistrationInput({ ...generalProfile, email: cleanEmail });
  if ("error" in parsed) {
    return { error: parsed.error, status: 400 };
  }

  const qrCode = nanoid(12);
  const registration = await Registration.create({
    ...parsed.data,
    email: cleanEmail,
    qrCode,
    isManual: false,
  });

  // Crear Pasaporte Digital automáticamente
  try {
    const viewPin = String(Math.floor(1000 + Math.random() * 9000));
    await Passport.updateOne(
      { shortId: qrCode },
      {
        $setOnInsert: {
          shortId: qrCode,
          role: "attendee",
          firstName: registration.firstName || "Sin",
          lastName: registration.lastName || "Nombre",
          company: registration.entityName ?? undefined,
          jobTitle: roleLabelOf(registration.role, registration.roleOther) || undefined,
          linkedRegistrationId: registration._id.toString(),
          isManual: false,
          viewPin,
        },
      },
      { upsert: true },
    );
  } catch (e) {
    console.error("[HybridRegistration] Error creando pasaporte:", e);
  }

  // Enviar correo de confirmación de registro general en segundo plano
  try {
    const name = `${registration.firstName} ${registration.lastName}`.trim();
    const built = await buildRegistrationEmail(name, registration.qrCode, registration.attendance);
    const html = `${built.html}<!-- ref:${registration.qrCode} -->`;
    void sendEmail({
      from: EMAIL_FROM,
      to: cleanEmail,
      subject: built.subject,
      html,
      attachments: built.attachments,
    });
  } catch (e) {
    console.error("[HybridRegistration] Error enviando correo de confirmación general:", e);
  }

  return {
    registration,
    qrCode,
    createdGeneralRegistration: true,
  };
}
