import { NextRequest } from "next/server";
import { render } from "@react-email/components";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { SpeakerApprovalEmail } from "@/emails/speaker-approval";
import { generateSpeakerPDF } from "@/lib/pdf/speaker";
import { generateInternationalSpeakerPDF } from "@/lib/pdf/speaker-international";
import { Setting } from "@/models/setting";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const body = await request.json() as { to?: string; speakerType?: string };
    const to = typeof body.to === "string" && body.to.includes("@") ? body.to : null;
    if (!to) return Response.json({ error: "Email destino requerido" }, { status: 400 });
    const speakerType = body.speakerType === "international" ? "international" : "local";

    const appUrl = SITE_URL;
    const profileUrl = `${appUrl}/speakers/speaker-ejemplo`;
    const cardUrl    = `${appUrl}/api/og/speaker/speaker-ejemplo`;

    const html = await render(
      SpeakerApprovalEmail({ name: "Speaker de Prueba", speakerType, profileUrl, cardUrl })
    );

    // Use custom PDF from S3 if uploaded, else generate
    let pdfBuffer: Buffer;
    const pdfKey = speakerType === "international" ? "pdf_international" : "pdf_local";
    const pdfSetting = await Setting.findOne({ key: pdfKey }).lean();

    if (pdfSetting?.value) {
      const res = await fetch(pdfSetting.value);
      if (!res.ok) throw new Error("No se pudo descargar el PDF desde S3");
      pdfBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      pdfBuffer = speakerType === "international"
        ? await generateInternationalSpeakerPDF("Speaker de Prueba")
        : await generateSpeakerPDF("Speaker de Prueba");
    }

    await sendEmail({
      from: EMAIL_FROM,
      to,
      subject: `[PRUEBA] ¡Has sido aceptado como Speaker — AWS SCD 2026! 🎉`,
      html,
      attachments: [{ filename: "invitacion-speaker-aws-scd.pdf", content: pdfBuffer.toString("base64") }],
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("[test-email]", e);
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
