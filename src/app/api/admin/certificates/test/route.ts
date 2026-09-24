import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { generateVolunteerCertificate } from "@/lib/pdf/certificate";
import { VolunteerCertificateEmail } from "@/emails/volunteer-certificate";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";

// Envío de PRUEBA: el certificado del voluntario elegido al correo que se indique.
// No marca certSentAt (es solo para verificar el adjunto y el diseño).
export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { id, email } = await req.json() as { id?: string; email?: string };
    if (!id || !email || !email.includes("@")) {
      return NextResponse.json({ error: "id y email válidos son requeridos" }, { status: 400 });
    }
    await connectDB();

    const vol = await VolunteerSubmission.findById(id).select("firstName lastName certName").lean();
    if (!vol) return NextResponse.json({ error: "Voluntario no encontrado" }, { status: 404 });

    const name = (vol.certName || `${vol.firstName} ${vol.lastName}` || "Volunteer").trim();

    const pdf = await generateVolunteerCertificate(name);
    const html = await render(VolunteerCertificateEmail({ name }));
    const res = await sendEmail({
      from: EMAIL_FROM,
      to: email.trim(),
      subject: "[PRUEBA] 🏆 Tu certificado de voluntariado — AWS Student Community Day México 2026",
      html,
      attachments: [{ filename: "certificado-aws-scd-2026.pdf", content: pdf.toString("base64") }],
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 502 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
