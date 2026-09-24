import { NextRequest } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SpeakerProfile } from "@/models/speaker-profile";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { SpeakerApprovalEmail } from "@/emails/speaker-approval";
import { generateSpeakerPDF } from "@/lib/pdf/speaker";
import { generateInternationalSpeakerPDF } from "@/lib/pdf/speaker-international";
import { createLog } from "@/lib/log";
import { Setting } from "@/models/setting";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    const { id } = await params;
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const speakerType = body.speakerType === "international" ? "international" : "local";
    const track = typeof body.track === "string" ? body.track : "general";

    await connectDB();

    const profile = await SpeakerProfile.findById(id);
    if (!profile) return Response.json({ error: "No encontrado" }, { status: 404 });
    if (profile.status === "accepted") return Response.json({ error: "Ya fue aprobado" }, { status: 400 });

    profile.status = "accepted";
    profile.approvedAt = new Date();
    profile.approvedBy = user._id.toString();
    profile.speakerType = speakerType;
    profile.track = track;
    profile.isPublic = true;
    await profile.save();

    // La modalidad sale del tipo de sesión que eligió al postular.
    const detectedMode = ["online", "virtual"].includes((profile?.sessionType as string | undefined) ?? "")
      ? "online" : "in-person";
    const presentationMode: "in-person" | "online" =
      body.presentationMode === "online" ? "online"
      : body.presentationMode === "in-person" ? "in-person"
      : detectedMode;

    const name = profile?.name ?? "";
    const email = profile?.email ?? "";
    const slug      = profile?.slug ?? "";
    const appUrl    = SITE_URL;
    const profileUrl = `${appUrl}/speakers/${slug}`;
    const cardUrl   = (profile?.cardImageUrl as string | undefined) || `${appUrl}/api/og/speaker/${slug}`;

    if (email) {
      const html = await render(
        SpeakerApprovalEmail({ name, speakerType, presentationMode, profileUrl, cardUrl })
      );

      // Always include the default PDF
      const defaultPdf = speakerType === "international"
        ? await generateInternationalSpeakerPDF(name)
        : await generateSpeakerPDF(name);

      const attachments: { filename: string; content: string }[] = [
        { filename: "invitacion-speaker-aws-scd.pdf", content: defaultPdf.toString("base64") },
      ];

      // Also attach the custom uploaded PDF if one exists
      const pdfKey = speakerType === "international" ? "pdf_international" : "pdf_local";
      const pdfSetting = await Setting.findOne({ key: pdfKey }).lean();
      if (pdfSetting?.value) {
        const res = await fetch(pdfSetting.value as string);
        if (res.ok) {
          const customBuffer = Buffer.from(await res.arrayBuffer());
          attachments.push({ filename: "informacion-adicional-speaker.pdf", content: customBuffer.toString("base64") });
        }
      }

      await sendEmail({
        from: EMAIL_FROM,
        to: email,
        subject: "¡Has sido aceptado como Speaker — AWS Student Community Day 2026! 🎉",
        html,
        attachments,
      });
    }

    await createLog({
      action: "SPEAKER_APPROVED",
      target: name || id,
      targetId: id,
      details: `${speakerType} · ${email}`,
    });

    return Response.json({ ok: true, slug });
  } catch (e) {
    console.error("[approve]", e);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
