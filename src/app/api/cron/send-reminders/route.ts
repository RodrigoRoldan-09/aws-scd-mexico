import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { sendEmailBatch, MARKETING_EMAIL_FROM } from "@/lib/resend";
import { gatherBroadRecipients } from "@/lib/campaign-audience";
import { ReminderEventEmail } from "@/emails/reminder-event";
import { Registration } from "@/models/registration";
import { SpeakerProfile } from "@/models/speaker-profile";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { User } from "@/models/user";
import { SITE_URL } from "@/lib/constants";
import { REMINDER_DATES, REMINDER_EVENT_DATE } from "@/lib/reminder-schedule";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const APP_URL = SITE_URL;

// Fechas (America/Mexico_City) en las que sale el recordatorio automático.
const EVENT_DATE = REMINDER_EVENT_DATE;

/**
 * Recordatorios automáticos del evento. Lo llama EventBridge Scheduler (destino HTTP)
 * una vez al día; solo envía en las fechas de REMINDER_DATES (o con ?force=1).
 * Idempotente: marca auto_reminder_YYYY-MM-DD en sentCampaigns de cada destinatario.
 * Protegido igual que retry-emails: Bearer o ?key= con JWT_SECRET.
 */
export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

function daysBetween(from: string, to: string): number {
  const a = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  const b = Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)));
  return Math.round((b - a) / 86_400_000);
}

async function handleCron(request: NextRequest) {
  // (1) Auth
  const secret = process.env.JWT_SECRET;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const queryKey = request.nextUrl.searchParams.get("key");

  if (!secret || (bearerToken !== secret && queryKey !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // (2) Fecha en CDMX y allowlist, antes de tocar la base
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  const daysLeft = daysBetween(date, EVENT_DATE);
  const force = request.nextUrl.searchParams.get("force") === "1";

  if (!REMINDER_DATES.includes(date) && !force) {
    return NextResponse.json({
      date,
      daysLeft,
      intended: false,
      sent: 0,
      failed: 0,
      audience: 0,
      alreadySent: 0,
      reason: "date-not-in-allowlist",
    });
  }

  try {
    // (3) DB
    await connectDB();

    // (4) Audiencia: pendientes de esta fecha + total (para saber cuántos ya lo recibieron)
    const campaignId = `auto_reminder_${date}`;
    const recipients = await gatherBroadRecipients(campaignId);
    const audienceList = await gatherBroadRecipients(campaignId, undefined, { skipSentFilter: true });

    // (5) Envío — emails va 1:1 con recipients (mismo orden)
    const subject =
      daysLeft <= 0
        ? "¡Es hoy! · It's today! — AWS Student Community Day México 2026"
        : daysLeft === 1
          ? "Es mañana · It's tomorrow — AWS Student Community Day México 2026"
          : `Faltan ${daysLeft} días · ${daysLeft} days to go — AWS Student Community Day México 2026`;

    const emails: Parameters<typeof sendEmailBatch>[0] = [];
    for (const r of recipients) {
      const qrImageUrl = r.qrCode ? `${APP_URL}/api/pass-qr/${r.qrCode}` : undefined;
      const html = await render(ReminderEventEmail({ name: r.name, qrImageUrl, daysLeft }));
      emails.push({ from: MARKETING_EMAIL_FROM, to: r.email, subject, html });
    }

    const { sentCount, failedCount } = await sendEmailBatch(emails);

    // (6) Marcado idempotente: los primeros `sentCount` por fuente
    if (sentCount > 0) {
      const sent = recipients.slice(0, sentCount);
      const regIds = sent.filter((r) => r.source === "registration").map((r) => r.id);
      const speakerIds = sent.filter((r) => r.source === "speaker").map((r) => r.id);
      const volIds = sent.filter((r) => r.source === "volunteer").map((r) => r.id);
      const userIds = sent.filter((r) => r.source === "user").map((r) => r.id);
      await Promise.all([
        regIds.length ? Registration.updateMany({ _id: { $in: regIds } }, { $addToSet: { sentCampaigns: campaignId } }) : Promise.resolve(),
        speakerIds.length ? SpeakerProfile.updateMany({ _id: { $in: speakerIds } }, { $addToSet: { sentSpeakerCampaigns: campaignId } }) : Promise.resolve(),
        volIds.length ? VolunteerSubmission.updateMany({ _id: { $in: volIds } }, { $addToSet: { sentVolunteerCampaigns: campaignId } }) : Promise.resolve(),
        userIds.length ? User.updateMany({ _id: { $in: userIds } }, { $addToSet: { sentCampaigns: campaignId } }) : Promise.resolve(),
      ]);
    }

    // (7) Resumen
    return NextResponse.json({
      date,
      daysLeft,
      intended: true,
      audience: audienceList.length,
      sent: sentCount,
      failed: failedCount,
      alreadySent: audienceList.length - recipients.length,
    });
  } catch (e) {
    console.error("[cron/send-reminders]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
