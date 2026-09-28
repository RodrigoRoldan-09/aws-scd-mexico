import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Form } from "@/models/form";
import { Registration } from "@/models/registration";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { buildRegistrationEmail } from "@/lib/registration-email";
import { parseRegistrationInput } from "@/lib/registration-input";
import { roleLabelOf } from "@/data/attendee-form";
import { createLog } from "@/lib/log";
import { checkAlreadyVolunteer } from "@/lib/duplicate-check";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { Passport } from "@/models/passport";
import { verifyCaptcha } from "@/lib/captcha";
import { notifyNewRegistration } from "@/lib/sns";

export async function GET() {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);

    await connectDB();
    const registrations = await Registration.find({}).sort({ createdAt: -1 });
    return Response.json({ registrations });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manual, skipEmail, checkedIn: initialCheckedIn, generatePassport = true } = body;
    // El cuerpo va directo al parser: exige que cada valor sea texto —lo que
    // bloquea un `{$gt: ""}`—, lo recorta y lo valida contra el catálogo.
    const input = (body.data ?? {}) as Record<string, unknown>;
    if (typeof input !== "object" || Array.isArray(input)) {
      return Response.json({ error: "Datos de formulario inválidos" }, { status: 400 });
    }

    // If manual, require auth
    let actor = null;
    if (manual) {
      actor = await requireAuth(["admin", "organizer", "volunteer"]);
    }

    // Rate limit + captcha solo para registros públicos
    // (los manuales los crea el staff ya autenticado).
    if (!manual) {
      const rl = rateLimit(`reg:${getIp(request)}`, 50, 15 * 60 * 1000);
      if (!rl.ok) {
        return Response.json(
          { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
          { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
        );
      }

      const captchaToken = typeof body.captchaToken === "string" ? body.captchaToken : "";
      const captchaOk = await verifyCaptcha(captchaToken);
      if (!captchaOk) {
        return Response.json({ error: "Captcha inválido. Por favor intenta de nuevo." }, { status: 400 });
      }
    }

    await connectDB();

    // La recepción se consulta igual, pero el formulario ya no aporta campos:
    // las preguntas son fijas. Un alta manual entra aunque esté cerrada.
    if (!manual) {
      const form = await Form.findOne({ formType: "attendee", isOpen: true });
      if (!form) {
        return Response.json({ error: "El registro no está disponible" }, { status: 404 });
      }
      if (form.maxSubmissions) {
        const count = await Registration.countDocuments({});
        if (count >= form.maxSubmissions) {
          return Response.json({ error: "Se alcanzó el límite de registros" }, { status: 400 });
        }
      }
    }

    const parsed = parseRegistrationInput(input, { manual });
    if ("error" in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    const data = parsed.data;

    // El correo es único por registro.
    const existing = await Registration.findOne({ email: data.email });
    if (existing) {
      return Response.json(
        { error: "Este correo ya está registrado en el evento" },
        { status: 409 },
      );
    }

    // Cruce con la lista de voluntarios: no se puede estar en las dos.
    // Sólo aplica al registro público — el staff sí puede inscribir a mano.
    if (!manual) {
      const cross = await checkAlreadyVolunteer(data.email);
      if (cross.blocked) {
        return Response.json({ error: cross.error }, { status: 409 });
      }
    }

    const qrCode = nanoid(12);

    const registration = await Registration.create({
      ...data,
      qrCode,
      isManual: !!manual,
      ...(manual && initialCheckedIn ? {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInBy: actor?._id.toString() || null,
      } : {}),
    });

    const name = `${data.firstName} ${data.lastName}`.trim();
    const email = data.email;

    // Publicar evento en AWS SNS Topic
    void notifyNewRegistration({
      name,
      email,
      attendance: data.attendance,
      qrCode,
      role: roleLabelOf(data.role, data.roleOther) || data.role,
      entityName: data.entityName ?? undefined,
    });

    // Auto-create Passport for new registration (shortId = qrCode for seamless reuse)
    //
    // A quien asiste en línea no se le crea: el pasaporte se llena con sellos
    // que se consiguen pasando por los stands, y ese recorrido no existe para
    // alguien que sigue la transmisión desde su casa. Crearlo le daría una
    // cartilla vacía que nunca va a poder completar.
    if (generatePassport !== false && data.attendance !== "online") try {
      const viewPin = String(Math.floor(1000 + Math.random() * 9000));
      const firstName = data.firstName || "Sin";
      const lastName = data.lastName || "Nombre";
      await Passport.updateOne(
        { shortId: qrCode },
        {
          $setOnInsert: {
            shortId: qrCode,
            role: "attendee",
            firstName,
            lastName,
            company: data.entityName ?? undefined,
            jobTitle: roleLabelOf(data.role, data.roleOther) || undefined,
            linkedRegistrationId: registration._id.toString(),
            isManual: false,
            viewPin,
          },
        },
        { upsert: true },
      );
    } catch { /* non-fatal — passport can be generated from admin later */ }

    // Skip email if: manual + skipEmail, or no email found
    const shouldSkipEmail = (manual && skipEmail) || !email;

    if (!shouldSkipEmail && email) {
      try {
        const built = await buildRegistrationEmail(name, registration.qrCode, data.attendance);
        let html = built.html;

        // La referencia al final es lo que permite casar el webhook de Resend
        // con este registro, así que va en los dos casos.
        html += `<!-- ref:${registration.qrCode} -->`;
        const result = await sendEmail({
          from: EMAIL_FROM,
          to: email,
          subject: built.subject,
          html,
          attachments: built.attachments,
        });
        if (result.error) {
          registration.emailStatus = "failed";
          registration.emailError = result.error;
        } else {
          registration.emailStatus = "sent";
          registration.emailSentAt = new Date();
          registration.resendId = result.id;
        }
        await registration.save();
      } catch (emailErr) {
        registration.emailStatus = "failed";
        registration.emailError = (emailErr as Error).message;
        await registration.save();
      }
    } else {
      registration.emailStatus = "skipped";
      await registration.save();
    }

    if (manual && actor) {
      await createLog({
        userId: actor._id.toString(),
        userName: actor.name,
        userRole: actor.role,
        action: "REGISTRATION_MANUAL",
        target: name || email || qrCode,
        targetId: registration._id.toString(),
        details: initialCheckedIn ? "Con check-in" : "Sin check-in",
      });
    }

    return Response.json({ id: registration._id, qrCode }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
