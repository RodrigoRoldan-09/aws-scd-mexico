import { NextRequest } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SpeakerProfile } from "@/models/speaker-profile";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { SpeakerApprovalEmail } from "@/emails/speaker-approval";
import { generateSpeakerPDF } from "@/lib/pdf/speaker";
import { createLog } from "@/lib/log";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    const body = await request.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

    if (!ids.length) return Response.json({ error: "Sin IDs" }, { status: 400 });

    await connectDB();

    const results = await Promise.allSettled(
      ids.map(async (id) => {
        // Un solo documento por speaker: estado y datos en el mismo sitio.
        const profile = await SpeakerProfile.findById(id);
        if (!profile || profile.status === "accepted") return { id, skipped: true };

        profile.status = "accepted";
        profile.approvedAt = new Date();
        profile.approvedBy = user._id.toString();
        profile.isPublic = true;
        await profile.save();

        const name = profile.name ?? "";
        const email = profile.email ?? "";

        if (email) {
          const html = await render(SpeakerApprovalEmail({ name }));
          const pdfBuffer = await generateSpeakerPDF(name);
          const pdfBase64 = pdfBuffer.toString("base64");
          await sendEmail({
            from: EMAIL_FROM,
            to: email,
            subject: "¡Has sido aceptado como Speaker — AWS Student Community Day 2026!",
            html,
            attachments: [{ filename: "invitacion-speaker-aws-scd.pdf", content: pdfBase64 }],
          });
        }

        await createLog({
          userId: user._id.toString(),
          userName: user.name,
          userRole: user.role,
          action: "SPEAKER_APPROVED",
          target: name || id,
          targetId: id,
          details: email || null,
        });

        return { id, approved: true };
      }),
    );

    const approved = results.filter(
      (r) => r.status === "fulfilled" && !(r.value as { skipped?: boolean }).skipped,
    ).length;
    const skipped = results.filter(
      (r) => r.status === "fulfilled" && (r.value as { skipped?: boolean }).skipped,
    ).length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return Response.json({ approved, skipped, failed });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
