import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { generateVolunteerCertificate } from "@/lib/pdf/certificate";
import { VolunteerCertificateEmail } from "@/emails/volunteer-certificate";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { createLog } from "@/lib/log";

const SUBJECT = "🏆 Tu certificado de voluntariado — AWS Student Community Day México 2026";

// Envía el certificado (PDF adjunto) a los voluntarios seleccionados (1 o varios).
export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(["admin"]);
    const { ids } = await req.json() as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids requerido" }, { status: 400 });
    }
    await connectDB();

    const vols = await VolunteerSubmission.find({ _id: { $in: ids }, approved: true })
      .select("firstName lastName email certName")
      .lean();

    // Envío individual (el batch de Resend NO soporta adjuntos) con marcado
    // exacto: solo se marca certSentAt a quienes de verdad les salió el correo.
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const okIds: string[] = [];
    let sentCount = 0, failedCount = 0, skipped = 0;

    for (const v of vols) {
      const email = v.email;
      const name = (v.certName || `${v.firstName} ${v.lastName}`).trim();
      if (!email || !name) { skipped++; continue; }

      const pdf = await generateVolunteerCertificate(name);
      const html = await render(VolunteerCertificateEmail({ name }));
      const res = await sendEmail({
        from: EMAIL_FROM,
        to: email,
        subject: SUBJECT,
        html,
        attachments: [{ filename: "certificado-aws-scd-2026.pdf", content: pdf.toString("base64") }],
      });
      if (res.error) { failedCount++; } else { sentCount++; okIds.push(String(v._id)); }
      await sleep(550); // rate limit de Resend (~2 req/s)
    }

    if (okIds.length > 0) {
      await VolunteerSubmission.updateMany(
        { _id: { $in: okIds } },
        { $set: { certSentAt: new Date() } },
      );
    }

    await createLog({
      userId: String(actor._id), userName: actor.name, userRole: actor.role,
      action: "CERT_SENT",
      target: sentCount === 1 ? "1 certificado" : `${sentCount} certificados`,
      details: `${sentCount} enviados${failedCount ? `, ${failedCount} fallidos` : ""}${skipped ? `, ${skipped} sin correo/nombre` : ""}`,
    });

    return NextResponse.json({ sentCount, failedCount, skipped });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
