import { NextRequest } from "next/server";
import { render } from "@react-email/components";
import { requireAuth } from "@/lib/auth";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { VolunteerApprovalEmail } from "@/emails/volunteer-approval";
import { generateVolunteerPDF } from "@/lib/pdf/volunteer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json() as { to?: string; name?: string };
    const to = typeof body.to === "string" && body.to.includes("@") ? body.to : null;
    if (!to) return Response.json({ error: "Email destino requerido" }, { status: 400 });
    const name = typeof body.name === "string" ? body.name : "Voluntario de Prueba";

    const html = await render(VolunteerApprovalEmail({ name }));
    const pdfBuffer = await generateVolunteerPDF(name);

    await sendEmail({
      from: EMAIL_FROM,
      to,
      subject: "[PRUEBA] Aprobación como Voluntario — AWS Student Community Day 2026",
      html,
      attachments: [{ filename: "invitacion-voluntario-aws-scd.pdf", content: pdfBuffer.toString("base64") }],
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("[volunteer test-email]", e);
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
