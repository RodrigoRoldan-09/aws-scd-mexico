import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ReminderEventEmail } from "@/emails/reminder-event";
import { KeynoteAnnouncementEmail } from "@/emails/keynote-announcement";
import { PassportLaunchEmail } from "@/emails/passport-launch";
import { SpeakerSlidesEmail } from "@/emails/speaker-slides";
import { VolunteerMeetingEmail } from "@/emails/volunteer-meeting";
import { VolunteerMeetingTodayEmail } from "@/emails/volunteer-meeting-today";
import { VolunteerSetupEmail } from "@/emails/volunteer-setup";
import { BadgePickupEmail } from "@/emails/badge-pickup";
import { PassportGuideEmail } from "@/emails/passport-guide";
import { PostSurveyEmail } from "@/emails/post-survey";
import { GalleryRecordingsEmail } from "@/emails/gallery-recordings";
import { CertChallengeEmail } from "@/emails/cert-challenge";
import { ResilienceMessageEmail } from "@/emails/resilience-message";
import { ConfirmAttendanceEmail } from "@/emails/confirm-attendance";
import { ConfirmReminderEmail } from "@/emails/confirm-reminder";
import { ConfirmFinalEmail } from "@/emails/confirm-final";
import { SpeakerRejectionEmail } from "@/emails/speaker-rejection";
import { SpeakerUploadEmail } from "@/emails/speaker-upload";
import { VolunteerRecordingEmail } from "@/emails/volunteer-recording";
import { keynotes } from "@/data/keynotes";
import { EventConfig, DEFAULT_TIPS } from "@/models/event-config";
import { sendEmail, MARKETING_EMAIL_FROM } from "@/lib/resend";
import type { CampaignType } from "@/models/campaign";
import { EVENT_OPS, SITE_URL } from "@/lib/constants";

const APP_URL = SITE_URL;

const SUBJECTS: Record<CampaignType, string> = {
  reminder_15d: "[PRUEBA] ¡Faltan 15 días! — AWS Student Community Day México 2026",
  reminder_5d: "[PRUEBA] ¡Ya falta muy poco! — AWS Student Community Day México 2026",
  reminder_5d_unconfirmed: "[PRUEBA] ¡Faltan 5 días! Confirma tu asistencia — AWS Student Community Day México 2026",
  reminder_1d: "[PRUEBA] Tu pase para mañana — AWS Student Community Day México 2026",
  keynote_daniel: "[PRUEBA] ¡Daniel Saldarriaga viene al AWS Student Community Day México 2026!",
  keynote_alejandra: "[PRUEBA] ¡Alejandra Bricio viene al AWS Student Community Day México 2026!",
  day_of: "[PRUEBA] ¡Activa tu pasaporte digital! — AWS Student Community Day México 2026",
  speaker_slides: "[PRUEBA] Tu plantilla oficial de presentación — AWS Student Community Day México 2026",
  speaker_upload: `[PRUEBA] 📂 Sube tu presentación antes del ${EVENT_OPS.slidesDeadline} — AWS Student Community Day México 2026`,
  volunteer_meeting: "[PRUEBA] Reunión obligatoria de voluntarios — AWS Student Community Day México 2026",
  volunteer_meeting_today: "[PRUEBA] ⏰ HOY: reunión obligatoria de voluntarios a las 6 PM — AWS Student Community Day México 2026",
  volunteer_setup: `[PRUEBA] 🛠️ Te esperamos en el montaje — ${EVENT_OPS.setup} — AWS Student Community Day México 2026`,
  confirm_attendance: "[PRUEBA] 🎟️ Confirma tu asistencia — AWS Student Community Day México 2026",
  confirm_reminder: "[PRUEBA] ⚠️ Aún no confirmas tu asistencia — AWS Student Community Day México 2026",
  confirm_final: "[PRUEBA] 🚨 Último llamado: confirma tu asistencia — AWS Student Community Day México 2026",
  speaker_rejection: "[PRUEBA] Actualización sobre tu postulación como speaker — AWS Student Community Day México 2026",
  volunteer_recording: "[PRUEBA] Grabación de la reunión de voluntarios — AWS Student Community Day México 2026",
  badge_pickup: "[PRUEBA] 🎟️ ¿Quieres recoger tu escarapela hoy? — AWS Student Community Day México 2026",
  passport_guide: "[PRUEBA] 🎫 Tu pasaporte digital: así funciona — AWS Student Community Day México 2026",
  resilience_message: "[PRUEBA] 💪 Gracias por tu resiliencia — ¡Quédate para el cierre! — AWS Student Community Day México 2026",
  post_survey: "[PRUEBA] 📝 Cuéntanos cómo te fue — Encuesta AWS Student Community Day México 2026",
  gallery_recordings: "[PRUEBA] 🎬 Fotos y grabaciones del AWS Student Community Day México 2026",
  cert_challenge: "[PRUEBA] Tu certificación AWS AI Practitioner empieza aquí 🚀",
};

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { type, to } = await request.json() as { type: CampaignType; to: string };
    if (!type) return NextResponse.json({ error: "type requerido" }, { status: 400 });
    if (!to || !to.includes("@")) return NextResponse.json({ error: "email inválido" }, { status: 400 });

    await connectDB();
    const config = await EventConfig.findOne().lean() as Record<string, unknown> | null;
    const tips = (config?.tips as string[] | undefined)?.length ? config!.tips as string[] : DEFAULT_TIPS;
    let html: string;

    if (type === "reminder_5d_unconfirmed") {
      html = await render(
        ConfirmReminderEmail({
          name: "Sebastián (prueba)",
          confirmUrl: `${APP_URL}/confirmar/PREVIEW123`,
          qrUrl: `${APP_URL}/api/passes/PREVIEW123`,
        })
      );
    } else if (type.startsWith("reminder_")) {
      const daysLeft = type === "reminder_15d" ? 15 : type === "reminder_5d" ? 5 : 1;
      html = await render(
        ReminderEventEmail({
          name: "Sebastián (prueba)",
          qrUrl: `${APP_URL}/api/passes/PREVIEW123`,
          qrImageUrl: `${APP_URL}/api/pass-qr/PREVIEW123`,
          daysLeft: daysLeft as 15 | 5 | 1,
          tips,
        })
      );
    } else if (type === "day_of") {
      html = await render(
        PassportLaunchEmail({
          name: "Sebastián (prueba)",
          qrUrl: `${APP_URL}/api/passes/PREVIEW123`,
        })
      );
    } else if (type === "volunteer_meeting") {
      html = await render(VolunteerMeetingEmail({ name: "Sebastián (prueba)" }));
    } else if (type === "volunteer_meeting_today") {
      html = await render(VolunteerMeetingTodayEmail({ name: "Sebastián (prueba)" }));
    } else if (type === "volunteer_setup") {
      html = await render(VolunteerSetupEmail({ name: "Sebastián (prueba)" }));
    } else if (type === "badge_pickup") {
      html = await render(BadgePickupEmail({ name: "Sebastián (prueba)" }));
    } else if (type === "cert_challenge") {
      html = await render(CertChallengeEmail({ name: "Sebastián (prueba)" }));
    } else if (type === "post_survey") {
      html = await render(PostSurveyEmail({ name: "Sebastián (prueba)", surveyUrl: `${APP_URL}/encuesta/PREVIEW123` }));
    } else if (type === "gallery_recordings") {
      html = await render(GalleryRecordingsEmail({
        name: "Sebastián (prueba)",
        galleryUrl: "https://photos.example.com/aws-scd",
        virtualRecordingUrl: "https://youtube.com/track-virtual",
        hybridRecordingUrl: "https://youtube.com/track-hibrido",
      }));
    } else if (type === "passport_guide") {
      html = await render(PassportGuideEmail({ name: "Sebastián (prueba)", passportUrl: `${APP_URL}/pasaporte/PREVIEW123` }));
    } else if (type === "resilience_message") {
      html = await render(ResilienceMessageEmail({ name: "Sebastián (prueba)" }));
    } else if (type === "confirm_attendance") {
      html = await render(
        ConfirmAttendanceEmail({ name: "Sebastián (prueba)", confirmUrl: `${APP_URL}/confirmar/PREVIEW123` })
      );
    } else if (type === "confirm_reminder") {
      html = await render(
        ConfirmReminderEmail({ name: "Sebastián (prueba)", confirmUrl: `${APP_URL}/confirmar/PREVIEW123` })
      );
    } else if (type === "confirm_final") {
      html = await render(
        ConfirmFinalEmail({
          name: "Sebastián (prueba)",
          confirmUrl: `${APP_URL}/confirmar/PREVIEW123`,
          qrUrl: `${APP_URL}/api/passes/PREVIEW123`,
        })
      );
    } else if (type === "speaker_upload") {
      const uploadUrl = (config?.speakerUploadUrl as string | undefined) ?? "https://drive.google.com/carpeta-ejemplo";
      html = await render(SpeakerUploadEmail({ name: "Sebastián (prueba)", uploadUrl }));
    } else if (type === "speaker_rejection") {
      html = await render(
        SpeakerRejectionEmail({ name: "Sebastián (prueba)", registerUrl: `${APP_URL}/registro` })
      );
    } else if (type === "volunteer_recording") {
      const recordingUrl = (config?.volunteerRecordingUrl as string | undefined) ?? "https://teams.microsoft.com/recording-ejemplo";
      html = await render(VolunteerRecordingEmail({ name: "Sebastián (prueba)", recordingUrl }));
    } else if (type === "speaker_slides") {
      const slideUrl = (config?.slideTemplateUrl as string | undefined) ?? `${APP_URL}/plantilla-ejemplo.pptx`;
      html = await render(SpeakerSlidesEmail({ name: "Sebastián (prueba)", slideUrl }));
    } else {
      const kn = keynotes[type === "keynote_daniel" ? 0 : 1];
      html = await render(
        KeynoteAnnouncementEmail({
          recipientName: "Sebastián (prueba)",
          firstName: kn.firstName,
          lastName: kn.lastName,
          role: kn.role,
          company: kn.company,
          talkType: kn.talkType,
          talkTitle: kn.talkTitle,
          photoAbsoluteUrl: kn.photo ? `${APP_URL}${kn.photo}` : undefined,
          linkedinUrl: kn.linkedin,
        })
      );
    }

    await sendEmail({ from: MARKETING_EMAIL_FROM, to, subject: SUBJECTS[type], html });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
