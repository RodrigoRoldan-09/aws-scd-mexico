import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Campaign, CAMPAIGN_LABELS, type CampaignType } from "@/models/campaign";
import { createLog } from "@/lib/log";
import { Registration } from "@/models/registration";
import { User } from "@/models/user";
import { EventConfig, DEFAULT_TIPS } from "@/models/event-config";
import { sendEmailBatch, MARKETING_EMAIL_FROM } from "@/lib/resend";
import { ReminderEventEmail } from "@/emails/reminder-event";
import { KeynoteAnnouncementEmail } from "@/emails/keynote-announcement";
import { PassportLaunchEmail } from "@/emails/passport-launch";
import { SpeakerSlidesEmail } from "@/emails/speaker-slides";
import { VolunteerMeetingEmail } from "@/emails/volunteer-meeting";
import { VolunteerMeetingTodayEmail } from "@/emails/volunteer-meeting-today";
import { VolunteerSetupEmail } from "@/emails/volunteer-setup";
import { ConfirmAttendanceEmail } from "@/emails/confirm-attendance";
import { ConfirmReminderEmail } from "@/emails/confirm-reminder";
import { ConfirmFinalEmail } from "@/emails/confirm-final";
import { BadgePickupEmail } from "@/emails/badge-pickup";
import { PassportGuideEmail } from "@/emails/passport-guide";
import { PostSurveyEmail } from "@/emails/post-survey";
import { GalleryRecordingsEmail } from "@/emails/gallery-recordings";
import { CertChallengeEmail } from "@/emails/cert-challenge";
import { SurveyRecipient } from "@/models/survey-recipient";
import { nanoid } from "nanoid";
import { ResilienceMessageEmail } from "@/emails/resilience-message";
import { SpeakerRejectionEmail } from "@/emails/speaker-rejection";
import { SpeakerUploadEmail } from "@/emails/speaker-upload";
import { VolunteerRecordingEmail } from "@/emails/volunteer-recording";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { Passport } from "@/models/passport";
import { SpeakerProfile } from "@/models/speaker-profile";
import { keynotes } from "@/data/keynotes";
import { gatherRecipientsForType } from "@/lib/campaign-audience";
import { EVENT_OPS, SITE_URL } from "@/lib/constants";

const APP_URL = SITE_URL;

const SUBJECTS: Record<CampaignType, string> = {
  reminder_15d: "¡Faltan 15 días! — AWS Student Community Day México 2026",
  reminder_5d: "¡Ya falta muy poco! — AWS Student Community Day México 2026",
  reminder_5d_unconfirmed: "¡Faltan 5 días! Confirma tu asistencia — AWS Student Community Day México 2026",
  reminder_1d: "Tu pase para mañana — AWS Student Community Day México 2026",
  keynote_daniel: "¡Daniel Saldarriaga viene al AWS Student Community Day México 2026!",
  keynote_alejandra: "¡Alejandra Bricio viene al AWS Student Community Day México 2026!",
  day_of: "¡Activa tu pasaporte digital! — AWS Student Community Day México 2026",
  speaker_slides: "Tu plantilla oficial de presentación — AWS Student Community Day México 2026",
  speaker_upload: `📂 Sube tu presentación antes del ${EVENT_OPS.slidesDeadline} — AWS Student Community Day México 2026`,
  volunteer_meeting: "Reunión obligatoria de voluntarios — AWS Student Community Day México 2026",
  volunteer_meeting_today: "⏰ HOY: reunión obligatoria de voluntarios a las 6 PM — AWS Student Community Day México 2026",
  volunteer_setup: `🛠️ Te esperamos en el montaje — ${EVENT_OPS.setup} — AWS Student Community Day México 2026`,
  confirm_attendance: "🎟️ Confirma tu asistencia — AWS Student Community Day México 2026",
  confirm_reminder: "⚠️ Aún no confirmas tu asistencia — AWS Student Community Day México 2026",
  confirm_final: "🚨 Último llamado: confirma tu asistencia — AWS Student Community Day México 2026",
  speaker_rejection: "Actualización sobre tu postulación como speaker — AWS Student Community Day México 2026",
  volunteer_recording: "Grabación de la reunión de voluntarios — AWS Student Community Day México 2026",
  badge_pickup: "🎟️ ¿Quieres recoger tu escarapela hoy? (opcional) — AWS Student Community Day México 2026",
  passport_guide: "🎫 Tu pasaporte digital: así funciona — AWS Student Community Day México 2026",
  resilience_message: "💪 Gracias por tu resiliencia — ¡Quédate para el cierre! — AWS Student Community Day México 2026",
  post_survey: "📝 Cuéntanos cómo te fue — Encuesta AWS Student Community Day México 2026",
  gallery_recordings: "🎬 Fotos y grabaciones del AWS Student Community Day México 2026",
  cert_challenge: "Tu certificación AWS AI Practitioner empieza aquí 🚀",
};

const SURVEY_ROLE_LABEL: Record<string, string> = {
  registration: "Registrado", speaker: "Speaker", volunteer: "Voluntario", user: "Organizador",
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin"]);
    const { type } = await request.json() as { type: CampaignType };
    if (!type) return NextResponse.json({ error: "type requerido" }, { status: 400 });

    await connectDB();

    const eventConfig = await EventConfig.findOne().lean() as Record<string, unknown> | null;
    const tips = (eventConfig?.tips as string[] | undefined)?.length ? eventConfig!.tips as string[] : DEFAULT_TIPS;

    const campaignDoc = await Campaign.create({
      type,
      status: "sending",
      sentCount: 0,
      failedCount: 0,
      triggeredBy: user.name,
    });

    // speaker_slides: va a los speakers, no a los registros
    if (type === "speaker_slides") {
      const slideTemplateUrl = (eventConfig?.slideTemplateUrl as string | undefined) ?? "";
      if (!slideTemplateUrl) {
        await Campaign.findByIdAndUpdate(campaignDoc._id, { status: "error", failedCount: 0 });
        return NextResponse.json({ error: "slideTemplateUrl no configurado en EventConfig" }, { status: 400 });
      }

      const submissions = await SpeakerProfile.find({
        status: "accepted",
        sentSpeakerCampaigns: { $nin: ["speaker_slides"] },
      }).lean();

      const emails: Parameters<typeof sendEmailBatch>[0] = [];
      const submissionIds: string[] = [];

      for (const sub of submissions) {
        const email = sub.email;
        if (!email) continue;
        const name = sub.name;
        const html = await render(SpeakerSlidesEmail({ name, slideUrl: slideTemplateUrl }));
        emails.push({ from: MARKETING_EMAIL_FROM, to: email, subject: SUBJECTS[type], html });
        submissionIds.push(String(sub._id));
      }

      const { sentCount, failedCount } = await sendEmailBatch(emails);

      if (sentCount > 0) {
        await SpeakerProfile.updateMany(
          { _id: { $in: submissionIds.slice(0, sentCount) } },
          { $addToSet: { sentSpeakerCampaigns: "speaker_slides" } },
        );
      }

      await Campaign.findByIdAndUpdate(campaignDoc._id, {
        status: failedCount === emails.length ? "error" : "done",
        sentCount,
        failedCount,
      });

      await createLog({
        userId: String(user._id), userName: user.name, userRole: user.role,
        action: "CAMPAIGN_SENT",
        target: CAMPAIGN_LABELS[type] ?? type,
        details: `${sentCount} enviados${failedCount ? `, ${failedCount} fallidos` : ""}`,
      });

      return NextResponse.json({ sentCount, failedCount });
    }

    // speaker_upload: speakers aceptados suben su presentación (enlace de Drive)
    if (type === "speaker_upload") {
      const uploadUrl = (eventConfig?.speakerUploadUrl as string | undefined) ?? "";
      if (!uploadUrl) {
        await Campaign.findByIdAndUpdate(campaignDoc._id, { status: "error", failedCount: 0 });
        return NextResponse.json({ error: "Falta la URL de la carpeta para subir presentaciones. Pégala en la tarjeta antes de enviar." }, { status: 400 });
      }

      const submissions = await SpeakerProfile.find({
        status: "accepted",
        sentSpeakerCampaigns: { $nin: ["speaker_upload"] },
      }).lean();

      const emails: Parameters<typeof sendEmailBatch>[0] = [];
      const submissionIds: string[] = [];

      for (const sub of submissions) {
        const email = sub.email;
        if (!email) continue;
        const name = sub.name;
        const html = await render(SpeakerUploadEmail({ name, uploadUrl }));
        emails.push({ from: MARKETING_EMAIL_FROM, to: email, subject: SUBJECTS[type], html });
        submissionIds.push(String(sub._id));
      }

      const { sentCount, failedCount } = await sendEmailBatch(emails);

      if (sentCount > 0) {
        await SpeakerProfile.updateMany(
          { _id: { $in: submissionIds.slice(0, sentCount) } },
          { $addToSet: { sentSpeakerCampaigns: "speaker_upload" } },
        );
      }

      await Campaign.findByIdAndUpdate(campaignDoc._id, {
        status: failedCount === emails.length ? "error" : "done",
        sentCount,
        failedCount,
      });

      await createLog({
        userId: String(user._id), userName: user.name, userRole: user.role,
        action: "CAMPAIGN_SENT",
        target: CAMPAIGN_LABELS[type] ?? type,
        details: `${sentCount} enviados${failedCount ? `, ${failedCount} fallidos` : ""}`,
      });

      return NextResponse.json({ sentCount, failedCount });
    }

    // speaker_rejection: va a las postulaciones rechazadas
    if (type === "speaker_rejection") {
      const submissions = await SpeakerProfile.find({
        status: "rejected",
        sentSpeakerCampaigns: { $nin: ["speaker_rejection"] },
      }).lean();

      const registerUrl = `${APP_URL}/registro`;
      const emails: Parameters<typeof sendEmailBatch>[0] = [];
      const submissionIds: string[] = [];

      for (const sub of submissions) {
        const email = sub.email;
        if (!email) continue;
        const name = sub.name;
        const html = await render(SpeakerRejectionEmail({ name, registerUrl }));
        emails.push({ from: MARKETING_EMAIL_FROM, to: email, subject: SUBJECTS[type], html });
        submissionIds.push(String(sub._id));
      }

      const { sentCount, failedCount } = await sendEmailBatch(emails);

      if (sentCount > 0) {
        await SpeakerProfile.updateMany(
          { _id: { $in: submissionIds.slice(0, sentCount) } },
          { $addToSet: { sentSpeakerCampaigns: "speaker_rejection" } },
        );
      }

      await Campaign.findByIdAndUpdate(campaignDoc._id, {
        status: failedCount === emails.length ? "error" : "done",
        sentCount,
        failedCount,
      });

      await createLog({
        userId: String(user._id), userName: user.name, userRole: user.role,
        action: "CAMPAIGN_SENT",
        target: CAMPAIGN_LABELS[type] ?? type,
        details: `${sentCount} enviados${failedCount ? `, ${failedCount} fallidos` : ""}`,
      });

      return NextResponse.json({ sentCount, failedCount });
    }

    // volunteer_meeting: reunión obligatoria de voluntarios
    if (type === "volunteer_meeting") {
      const submissions = await VolunteerSubmission.find({
        approved: true,
        sentVolunteerCampaigns: { $nin: ["volunteer_meeting"] },
      }).lean();

      const emails: Parameters<typeof sendEmailBatch>[0] = [];
      const submissionIds: string[] = [];

      for (const sub of submissions) {
        const email = sub.email;
        if (!email) continue;
        const name = `${sub.firstName} ${sub.lastName}`.trim();
        const html = await render(VolunteerMeetingEmail({ name }));
        emails.push({ from: MARKETING_EMAIL_FROM, to: email, subject: SUBJECTS[type], html });
        submissionIds.push(String(sub._id));
      }

      const { sentCount, failedCount } = await sendEmailBatch(emails);

      if (sentCount > 0) {
        await VolunteerSubmission.updateMany(
          { _id: { $in: submissionIds.slice(0, sentCount) } },
          { $addToSet: { sentVolunteerCampaigns: "volunteer_meeting" } },
        );
      }

      await Campaign.findByIdAndUpdate(campaignDoc._id, {
        status: failedCount === emails.length ? "error" : "done",
        sentCount,
        failedCount,
      });

      await createLog({
        userId: String(user._id), userName: user.name, userRole: user.role,
        action: "CAMPAIGN_SENT",
        target: CAMPAIGN_LABELS[type] ?? type,
        details: `${sentCount} enviados${failedCount ? `, ${failedCount} fallidos` : ""}`,
      });

      return NextResponse.json({ sentCount, failedCount });
    }

    // volunteer_setup: invitación a la jornada de montaje
    if (type === "volunteer_setup") {
      const submissions = await VolunteerSubmission.find({
        approved: true,
        sentVolunteerCampaigns: { $nin: ["volunteer_setup"] },
      }).lean();

      const emails: Parameters<typeof sendEmailBatch>[0] = [];
      const submissionIds: string[] = [];

      for (const sub of submissions) {
        const email = sub.email;
        if (!email) continue;
        const name = `${sub.firstName} ${sub.lastName}`.trim();
        const html = await render(VolunteerSetupEmail({ name }));
        emails.push({ from: MARKETING_EMAIL_FROM, to: email, subject: SUBJECTS[type], html });
        submissionIds.push(String(sub._id));
      }

      const { sentCount, failedCount } = await sendEmailBatch(emails);

      if (sentCount > 0) {
        await VolunteerSubmission.updateMany(
          { _id: { $in: submissionIds.slice(0, sentCount) } },
          { $addToSet: { sentVolunteerCampaigns: "volunteer_setup" } },
        );
      }

      await Campaign.findByIdAndUpdate(campaignDoc._id, {
        status: failedCount === emails.length ? "error" : "done",
        sentCount,
        failedCount,
      });

      await createLog({
        userId: String(user._id), userName: user.name, userRole: user.role,
        action: "CAMPAIGN_SENT",
        target: CAMPAIGN_LABELS[type] ?? type,
        details: `${sentCount} enviados${failedCount ? `, ${failedCount} fallidos` : ""}`,
      });

      return NextResponse.json({ sentCount, failedCount });
    }

    // volunteer_meeting_today: recordatorio el mismo día
    if (type === "volunteer_meeting_today") {
      const submissions = await VolunteerSubmission.find({
        approved: true,
        sentVolunteerCampaigns: { $nin: ["volunteer_meeting_today"] },
      }).lean();

      const emails: Parameters<typeof sendEmailBatch>[0] = [];
      const submissionIds: string[] = [];

      for (const sub of submissions) {
        const email = sub.email;
        if (!email) continue;
        const name = `${sub.firstName} ${sub.lastName}`.trim();
        const html = await render(VolunteerMeetingTodayEmail({ name }));
        emails.push({ from: MARKETING_EMAIL_FROM, to: email, subject: SUBJECTS[type], html });
        submissionIds.push(String(sub._id));
      }

      const { sentCount, failedCount } = await sendEmailBatch(emails);

      if (sentCount > 0) {
        await VolunteerSubmission.updateMany(
          { _id: { $in: submissionIds.slice(0, sentCount) } },
          { $addToSet: { sentVolunteerCampaigns: "volunteer_meeting_today" } },
        );
      }

      await Campaign.findByIdAndUpdate(campaignDoc._id, {
        status: failedCount === emails.length ? "error" : "done",
        sentCount,
        failedCount,
      });

      await createLog({
        userId: String(user._id), userName: user.name, userRole: user.role,
        action: "CAMPAIGN_SENT",
        target: CAMPAIGN_LABELS[type] ?? type,
        details: `${sentCount} enviados${failedCount ? `, ${failedCount} fallidos` : ""}`,
      });

      return NextResponse.json({ sentCount, failedCount });
    }

    // volunteer_recording: envía el enlace de la grabación a voluntarios aprobados
    if (type === "volunteer_recording") {
      const recordingUrl = (eventConfig?.volunteerRecordingUrl as string | undefined) ?? "";
      if (!recordingUrl) {
        await Campaign.findByIdAndUpdate(campaignDoc._id, { status: "error", failedCount: 0 });
        return NextResponse.json({ error: "Falta la URL de la grabación. Pégala en la tarjeta antes de enviar." }, { status: 400 });
      }

      const submissions = await VolunteerSubmission.find({
        approved: true,
        sentVolunteerCampaigns: { $nin: ["volunteer_recording"] },
      }).lean();

      const emails: Parameters<typeof sendEmailBatch>[0] = [];
      const submissionIds: string[] = [];

      for (const sub of submissions) {
        const email = sub.email;
        if (!email) continue;
        const name = `${sub.firstName} ${sub.lastName}`.trim();
        const html = await render(VolunteerRecordingEmail({ name, recordingUrl }));
        emails.push({ from: MARKETING_EMAIL_FROM, to: email, subject: SUBJECTS[type], html });
        submissionIds.push(String(sub._id));
      }

      const { sentCount, failedCount } = await sendEmailBatch(emails);

      if (sentCount > 0) {
        await VolunteerSubmission.updateMany(
          { _id: { $in: submissionIds.slice(0, sentCount) } },
          { $addToSet: { sentVolunteerCampaigns: "volunteer_recording" } },
        );
      }

      await Campaign.findByIdAndUpdate(campaignDoc._id, {
        status: failedCount === emails.length ? "error" : "done",
        sentCount,
        failedCount,
      });

      await createLog({
        userId: String(user._id), userName: user.name, userRole: user.role,
        action: "CAMPAIGN_SENT",
        target: CAMPAIGN_LABELS[type] ?? type,
        details: `${sentCount} enviados${failedCount ? `, ${failedCount} fallidos` : ""}`,
      });

      return NextResponse.json({ sentCount, failedCount });
    }

    // Recordatorios y keynotes van a la audiencia amplia; el día del evento y los
    // de confirmación, solo a registros. El helper resuelve quién recibe cada tipo.
    const recipients = await gatherRecipientsForType(type);

    const daysLeft = type === "reminder_15d" ? 15 : type === "reminder_5d" ? 5 : 1;
    const isReminder = type.startsWith("reminder_");
    const kn = keynotes[type === "keynote_daniel" ? 0 : 1];

    // Para la guía del pasaporte: link directo al pasaporte de CADA destinatario,
    // sin importar el rol. El passport se enlaza por linkedRegistrationId (= id de la
    // fuente: registro / voluntario / usuario; speakers van por su perfil).
    const passportShortIdBy = { byLinked: new Map<string, string>(), bySubmission: new Map<string, string>() };
    if (type === "passport_guide") {
      const passports = await Passport.find({}).select("shortId linkedRegistrationId").lean<{ shortId: string; linkedRegistrationId?: string }[]>();
      for (const p of passports) if (p.linkedRegistrationId) passportShortIdBy.byLinked.set(String(p.linkedRegistrationId), p.shortId);
      const profiles = await SpeakerProfile.find({ submissionId: { $ne: null } }).select("_id submissionId").lean<{ _id: unknown; submissionId?: unknown }[]>();
      for (const pr of profiles) {
        const sid = passportShortIdBy.byLinked.get(String(pr._id));
        if (sid && pr.submissionId) passportShortIdBy.bySubmission.set(String(pr.submissionId), sid);
      }
    }
    const passportUrlFor = (r: { source: string; id: string; qrCode?: string }): string | undefined => {
      let shortId: string | undefined;
      if (r.source === "registration") shortId = r.qrCode ?? passportShortIdBy.byLinked.get(r.id);
      else if (r.source === "speaker") shortId = passportShortIdBy.bySubmission.get(r.id);
      else shortId = passportShortIdBy.byLinked.get(r.id); // volunteer, user interno
      return shortId ? `${APP_URL}/pasaporte/${shortId}` : undefined;
    };

    // URLs para el correo de galería + grabaciones (se pegan en la tarjeta → EventConfig)
    const galleryUrl = (eventConfig?.photosUrl as string | undefined) || "";
    const virtualRecordingUrl = (eventConfig?.recordingVirtualUrl as string | undefined) || "";
    const hybridRecordingUrl = (eventConfig?.recordingHybridUrl as string | undefined) || "";
    if (type === "gallery_recordings" && !galleryUrl && !virtualRecordingUrl && !hybridRecordingUrl) {
      await Campaign.findByIdAndUpdate(campaignDoc._id, { status: "error", failedCount: 0 });
      return NextResponse.json({ error: "Pega al menos un enlace (galería o grabación) en la tarjeta antes de enviar." }, { status: 400 });
    }

    // Encuesta: precarga tokens existentes y arma los upserts en bloque (sin 1 escritura por persona)
    const surveyTokenBy = new Map<string, string>();
    const surveyOps: Parameters<typeof SurveyRecipient.bulkWrite>[0] = [];
    if (type === "post_survey") {
      const existing = await SurveyRecipient.find({}).select("source sourceId token").lean<{ source: string; sourceId: string; token: string }[]>();
      for (const e of existing) surveyTokenBy.set(`${e.source}:${e.sourceId}`, e.token);
    }
    const surveyTokenFor = (r: { source: string; id: string }) => {
      const key = `${r.source}:${r.id}`;
      let token = surveyTokenBy.get(key);
      if (!token) { token = nanoid(24); surveyTokenBy.set(key, token); }
      return token;
    };

    const emails: Parameters<typeof sendEmailBatch>[0] = [];

    for (const r of recipients) {
      // Solo los registros tienen QR; speakers, voluntarios e internos no.
      const qrUrl = r.qrCode ? `${APP_URL}/api/passes/${r.qrCode}` : undefined;

      let html: string;
      if (type === "reminder_5d_unconfirmed") {
        // Registrados sin confirmar: correo reducido con QR + CTA de confirmar.
        html = await render(
          ConfirmReminderEmail({ name: r.name, confirmUrl: `${APP_URL}/confirmar/${r.qrCode}`, qrUrl })
        );
      } else if (isReminder) {
        html = await render(
          ReminderEventEmail({
            name: r.name,
            qrUrl,
            qrImageUrl: r.qrCode ? `${APP_URL}/api/pass-qr/${r.qrCode}` : undefined,
            daysLeft: daysLeft as 15 | 5 | 1,
            tips,
          })
        );
      } else if (type === "day_of") {
        html = await render(PassportLaunchEmail({ name: r.name, qrUrl: qrUrl ?? "" }));
      } else if (type === "passport_guide") {
        html = await render(PassportGuideEmail({ name: r.name, passportUrl: passportUrlFor(r) }));
      } else if (type === "post_survey") {
        // Token propio por persona (enlace que registra el clic). La escritura va en bloque al final.
        const token = surveyTokenFor(r);
        surveyOps.push({
          updateOne: {
            filter: { source: r.source, sourceId: r.id },
            update: {
              $setOnInsert: { token },
              $set: { name: r.name, roleLabel: SURVEY_ROLE_LABEL[r.source] ?? "Asistente", email: r.email, lastSentAt: new Date() },
              $inc: { sentCount: 1 },
            },
            upsert: true,
          },
        });
        html = await render(PostSurveyEmail({ name: r.name, surveyUrl: `${APP_URL}/encuesta/${token}` }));
      } else if (type === "gallery_recordings") {
        html = await render(GalleryRecordingsEmail({ name: r.name, galleryUrl, virtualRecordingUrl, hybridRecordingUrl }));
      } else if (type === "cert_challenge") {
        html = await render(CertChallengeEmail({ name: r.name }));
      } else if (type === "resilience_message") {
        html = await render(ResilienceMessageEmail({ name: r.name }));
      } else if (type === "badge_pickup") {
        html = await render(BadgePickupEmail({ name: r.name }));
      } else if (type === "confirm_attendance") {
        html = await render(
          ConfirmAttendanceEmail({ name: r.name, confirmUrl: `${APP_URL}/confirmar/${r.qrCode}` })
        );
      } else if (type === "confirm_reminder") {
        html = await render(
          ConfirmReminderEmail({ name: r.name, confirmUrl: `${APP_URL}/confirmar/${r.qrCode}` })
        );
      } else if (type === "confirm_final") {
        // Último llamado: incluye QR (todos son registros) + CTA de confirmar.
        html = await render(
          ConfirmFinalEmail({ name: r.name, confirmUrl: `${APP_URL}/confirmar/${r.qrCode}`, qrUrl })
        );
      } else {
        html = await render(
          KeynoteAnnouncementEmail({
            recipientName: r.name,
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

      // El recordatorio de 1 día adjunta el QR del pase como archivo (solo registros)
      let attachments: { filename: string; content: string }[] | undefined;
      if (type === "reminder_1d" && r.qrCode) {
        try {
          const buf = await QRCode.toBuffer(r.qrCode, { type: "png", width: 360, margin: 2, color: { dark: "#111827", light: "#FFFFFF" } });
          attachments = [{ filename: "mi-pase-aws-scd.png", content: buf.toString("base64") }];
        } catch { /* sin adjunto */ }
      }

      emails.push({ from: MARKETING_EMAIL_FROM, to: r.email, subject: SUBJECTS[type], html, attachments });
    }

    // Encuesta: persiste los destinatarios/tokens en UNA sola operación en bloque
    if (type === "post_survey" && surveyOps.length > 0) {
      await SurveyRecipient.bulkWrite(surveyOps, { ordered: false });
    }

    const { sentCount, failedCount } = await sendEmailBatch(emails);

    // emails va 1:1 con recipients (mismo orden) → marca los primeros `sentCount` por fuente.
    // resilience_message es re-enviable: no se marca en sentCampaigns.
    if (sentCount > 0 && type !== "resilience_message" && type !== "post_survey") {
      const sent = recipients.slice(0, sentCount);
      const regIds = sent.filter((r) => r.source === "registration").map((r) => r.id);
      const speakerIds = sent.filter((r) => r.source === "speaker").map((r) => r.id);
      const volIds = sent.filter((r) => r.source === "volunteer").map((r) => r.id);
      const userIds = sent.filter((r) => r.source === "user").map((r) => r.id);
      await Promise.all([
        regIds.length ? Registration.updateMany({ _id: { $in: regIds } }, { $addToSet: { sentCampaigns: type } }) : Promise.resolve(),
        speakerIds.length ? SpeakerProfile.updateMany({ _id: { $in: speakerIds } }, { $addToSet: { sentSpeakerCampaigns: type } }) : Promise.resolve(),
        volIds.length ? VolunteerSubmission.updateMany({ _id: { $in: volIds } }, { $addToSet: { sentVolunteerCampaigns: type } }) : Promise.resolve(),
        userIds.length ? User.updateMany({ _id: { $in: userIds } }, { $addToSet: { sentCampaigns: type } }) : Promise.resolve(),
      ]);
    }

    await Campaign.findByIdAndUpdate(campaignDoc._id, {
      status: failedCount === emails.length ? "error" : "done",
      sentCount,
      failedCount,
    });

    await createLog({
      userId: String(user._id), userName: user.name, userRole: user.role,
      action: "CAMPAIGN_SENT",
      target: CAMPAIGN_LABELS[type] ?? type,
      details: `${sentCount} enviados${failedCount ? `, ${failedCount} fallidos` : ""}`,
    });

    return NextResponse.json({ sentCount, failedCount });
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[campaigns/send]", e);
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno", detail: msg }, { status: 500 });
  }
}
