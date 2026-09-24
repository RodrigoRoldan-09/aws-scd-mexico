import { NextRequest } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { VolunteerApprovalEmail } from "@/emails/volunteer-approval";
import { generateVolunteerPDF } from "@/lib/pdf/volunteer";
import { createLog } from "@/lib/log";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    const { id } = await params;

    await connectDB();

    const submission = await VolunteerSubmission.findById(id);
    if (!submission) {
      return Response.json({ error: "No encontrado" }, { status: 404 });
    }
    if (submission.approved) {
      return Response.json({ error: "Ya fue aprobado" }, { status: 400 });
    }

    submission.approved = true;
    submission.approvedAt = new Date();
    submission.approvedBy = user._id.toString();
    await submission.save();

    // Sólo el primer nombre y el primer apellido: es lo que entra en la
    // escarapela del PDF sin desbordarse.
    const firstName = submission.firstName.trim().split(/\s+/)[0] ?? "";
    const lastName = submission.lastName.trim().split(/\s+/)[0] ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ");
    const email = submission.email;

    if (email) {
      const html = await render(VolunteerApprovalEmail({ name }));
      const pdfBuffer = await generateVolunteerPDF(name);
      const pdfBase64 = pdfBuffer.toString("base64");
      await sendEmail({
        from: EMAIL_FROM,
        to: email,
        subject: "¡Has sido aceptado como Voluntario — AWS Student Community Day 2026!",
        html,
        attachments: [{ filename: "invitacion-voluntario-aws-scd.pdf", content: pdfBase64 }],
      });
    }

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "VOLUNTEER_APPROVED",
      target: name || id,
      targetId: id,
      details: email || null,
    });

    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
