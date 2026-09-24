import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { buildRegistrationEmail } from "@/lib/registration-email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const newEmail = body.email as string | undefined;

    const registration = await Registration.findById(id);
    if (!registration) {
      return Response.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    // Corrección del correo cuando rebotó.
    if (newEmail) {
      registration.email = newEmail;
      await registration.save();
    }

    const email = registration.email;
    if (!email) {
      return Response.json({ error: "No se encontró correo electrónico en el registro" }, { status: 400 });
    }

    const name = `${registration.firstName} ${registration.lastName}`.trim();

    // Mismo armado que el registro nuevo: si esta persona eligió el Track
    // Online, el reenvío tampoco lleva QR ni pase adjunto.
    const built = await buildRegistrationEmail(name, registration.qrCode, registration.attendance);
    const html = `${built.html}<!-- ref:${registration.qrCode} -->`;

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
      registration.emailError = null;
    }
    await registration.save();

    return Response.json({
      success: !result.error,
      emailStatus: registration.emailStatus,
      emailSentAt: registration.emailSentAt,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno al reenviar" }, { status: 500 });
  }
}
