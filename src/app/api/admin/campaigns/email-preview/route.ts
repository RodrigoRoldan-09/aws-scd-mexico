import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ReminderEventEmail } from "@/emails/reminder-event";
import { KeynoteAnnouncementEmail } from "@/emails/keynote-announcement";
import { PassportLaunchEmail } from "@/emails/passport-launch";
import { SpeakerApprovalEmail } from "@/emails/speaker-approval";
import { SpeakerSlidesEmail } from "@/emails/speaker-slides";
import { VolunteerMeetingEmail } from "@/emails/volunteer-meeting";
import { VolunteerMeetingTodayEmail } from "@/emails/volunteer-meeting-today";
import { VolunteerSetupEmail } from "@/emails/volunteer-setup";
import { ConfirmAttendanceEmail } from "@/emails/confirm-attendance";
import { ConfirmReminderEmail } from "@/emails/confirm-reminder";
import { ConfirmFinalEmail } from "@/emails/confirm-final";
import { BadgePickupEmail } from "@/emails/badge-pickup";
import { PassportGuideEmail } from "@/emails/passport-guide";
import { ResilienceMessageEmail } from "@/emails/resilience-message";
import { PostSurveyEmail } from "@/emails/post-survey";
import { GalleryRecordingsEmail } from "@/emails/gallery-recordings";
import { CertChallengeEmail } from "@/emails/cert-challenge";
import { SpeakerRejectionEmail } from "@/emails/speaker-rejection";
import { SpeakerUploadEmail } from "@/emails/speaker-upload";
import { VolunteerRecordingEmail } from "@/emails/volunteer-recording";
import { keynotes } from "@/data/keynotes";
import { EventConfig, DEFAULT_TIPS } from "@/models/event-config";
import type { CampaignType } from "@/models/campaign";
import { SITE_URL } from "@/lib/constants";

const APP_URL = SITE_URL;

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const type = request.nextUrl.searchParams.get("type") as string | null;
    // variant=guest → preview the version speakers/volunteers/internal users get (no QR button)
    const variant = request.nextUrl.searchParams.get("variant");
    if (!type) return NextResponse.json({ error: "type requerido" }, { status: 400 });

    await connectDB();
    const config = await EventConfig.findOne().lean() as Record<string, unknown> | null;
    const tips = (config?.tips as string[] | undefined)?.length ? config!.tips as string[] : DEFAULT_TIPS;
    let html: string;

    if (type === "reminder_15d" || type === "reminder_5d" || type === "reminder_1d") {
      const daysLeft = type === "reminder_15d" ? 15 : type === "reminder_5d" ? 5 : 1;
      html = await render(
        ReminderEventEmail({
          name: "Santiago García",
          // Registrants get the QR "Ver mi entrada" button; guests (speakers/volunteers/internal) don't.
          qrUrl: variant === "guest" ? undefined : `${APP_URL}/api/passes/PREVIEW123`,
          qrImageUrl: variant === "guest" ? undefined : `${APP_URL}/api/pass-qr/PREVIEW123`,
          daysLeft: daysLeft as 15 | 5 | 1,
          tips,
        })
      );
    } else if (type === "day_of") {
      html = await render(
        PassportLaunchEmail({
          name: "Santiago García",
          qrUrl: `${APP_URL}/api/passes/PREVIEW123`,
        })
      );
    } else if (type === "speaker_approval_inperson") {
      html = await render(
        SpeakerApprovalEmail({
          name: "Santiago García",
          speakerType: "local",
          presentationMode: "in-person",
          profileUrl: `${APP_URL}/speakers/preview`,
          cardUrl: `${APP_URL}/api/og/speaker/preview`,
        })
      );
    } else if (type === "speaker_approval_online") {
      html = await render(
        SpeakerApprovalEmail({
          name: "María Fernanda López",
          speakerType: "international",
          presentationMode: "online",
          profileUrl: `${APP_URL}/speakers/preview`,
          cardUrl: `${APP_URL}/api/og/speaker/preview`,
        })
      );
    } else if (type === "volunteer_meeting") {
      html = await render(VolunteerMeetingEmail({ name: "Santiago García" }));
    } else if (type === "volunteer_meeting_today") {
      html = await render(VolunteerMeetingTodayEmail({ name: "Santiago García" }));
    } else if (type === "volunteer_setup") {
      html = await render(VolunteerSetupEmail({ name: "Santiago García" }));
    } else if (type === "badge_pickup") {
      html = await render(BadgePickupEmail({ name: "Santiago García" }));
    } else if (type === "passport_guide") {
      html = await render(PassportGuideEmail({ name: "Santiago García", passportUrl: variant === "guest" ? undefined : `${APP_URL}/pasaporte/PREVIEW123` }));
    } else if (type === "resilience_message") {
      html = await render(ResilienceMessageEmail({ name: "Santiago García" }));
    } else if (type === "cert_challenge") {
      html = await render(CertChallengeEmail({ name: "Santiago García" }));
    } else if (type === "post_survey") {
      html = await render(PostSurveyEmail({ name: "Santiago García", surveyUrl: `${APP_URL}/encuesta/PREVIEW123` }));
    } else if (type === "gallery_recordings") {
      html = await render(GalleryRecordingsEmail({
        name: "Santiago García",
        galleryUrl: (config?.photosUrl as string | undefined) || "https://photos.example.com/aws-scd",
        virtualRecordingUrl: (config?.recordingVirtualUrl as string | undefined) || "https://youtube.com/track-virtual",
        hybridRecordingUrl: (config?.recordingHybridUrl as string | undefined) || "https://youtube.com/track-hibrido",
      }));
    } else if (type === "confirm_attendance") {
      html = await render(
        ConfirmAttendanceEmail({ name: "Santiago García", confirmUrl: `${APP_URL}/confirmar/PREVIEW123` })
      );
    } else if (type === "confirm_reminder") {
      html = await render(
        ConfirmReminderEmail({ name: "Santiago García", confirmUrl: `${APP_URL}/confirmar/PREVIEW123` })
      );
    } else if (type === "confirm_final") {
      html = await render(
        ConfirmFinalEmail({
          name: "Santiago García",
          confirmUrl: `${APP_URL}/confirmar/PREVIEW123`,
          qrUrl: `${APP_URL}/api/passes/PREVIEW123`,
        })
      );
    } else if (type === "reminder_5d_unconfirmed") {
      html = await render(
        ConfirmReminderEmail({
          name: "Santiago García",
          confirmUrl: `${APP_URL}/confirmar/PREVIEW123`,
          qrUrl: `${APP_URL}/api/passes/PREVIEW123`,
        })
      );
    } else if (type === "speaker_upload") {
      const uploadUrl = (config?.speakerUploadUrl as string | undefined) ?? "https://drive.google.com/carpeta-ejemplo";
      html = await render(
        SpeakerUploadEmail({ name: "Santiago García", uploadUrl })
      );
    } else if (type === "speaker_rejection") {
      html = await render(
        SpeakerRejectionEmail({ name: "Santiago García", registerUrl: `${APP_URL}/registro` })
      );
    } else if (type === "volunteer_recording") {
      const recordingUrl = (config?.volunteerRecordingUrl as string | undefined) ?? "https://teams.microsoft.com/recording-ejemplo";
      html = await render(
        VolunteerRecordingEmail({ name: "Santiago García", recordingUrl })
      );
    } else if (type === "speaker_slides") {
      const slideTemplateUrl = (config?.slideTemplateUrl as string | undefined) ?? `${APP_URL}/plantilla-ejemplo.pptx`;
      html = await render(
        SpeakerSlidesEmail({ name: "Santiago García", slideUrl: slideTemplateUrl })
      );
    } else {
      const kn = keynotes[(type as CampaignType) === "keynote_daniel" ? 0 : 1];
      html = await render(
        KeynoteAnnouncementEmail({
          recipientName: "Santiago García",
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

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
