import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
// Directo por Resend: SES está en sandbox (solo correos verificados, 200/día), así
// que intentarlo primero solo duplica el tiempo de cada envío.
import { sendEmailRawResend, MARKETING_EMAIL_FROM } from "@/lib/resend";
import { gatherBroadRecipients, type BroadRecipient } from "@/lib/campaign-audience";
import { ReminderEventEmail } from "@/emails/reminder-event";
import { Registration } from "@/models/registration";
import { SpeakerProfile } from "@/models/speaker-profile";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { User } from "@/models/user";
import { SITE_URL } from "@/lib/constants";
import { REMINDER_ANNOUNCEMENTS, REMINDER_DATES, REMINDER_EVENT_DATE } from "@/lib/reminder-schedule";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const APP_URL = SITE_URL;
const EVENT_DATE = REMINDER_EVENT_DATE;

// Amplify corta las peticiones SSR a ~30 s. Cada llamada trabaja como máximo
// TIME_BUDGET_MS y devuelve `remaining`; EventBridge la vuelve a disparar cada
// minuto y, como cada persona se marca justo al enviarse, nadie recibe doble.
const TIME_BUDGET_MS = 18_000;
const CONCURRENCY = 5;
// Resend permite 10 req/s: 5 por tanda con tandas de al menos 600 ms ≈ 8/s.
const MIN_CHUNK_MS = 600;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Recordatorios automáticos del evento. Lo llama EventBridge (API destination)
 * cada minuto dentro de la ventana de envío; solo envía en REMINDER_DATES (o con
 * ?force=1). Idempotente: marca auto_reminder_YYYY-MM-DD en sentCampaigns.
 *   ?dryRun=1 → solo reporta audiencia/pendientes, no envía.
 * Protegido igual que retry-emails: Authorization: Bearer <JWT_SECRET> (o ?key=).
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

function subjectFor(daysLeft: number): string {
  if (daysLeft <= 0) return "¡Es hoy! · It's today! — AWS Student Community Day México 2026";
  if (daysLeft === 1) return "Es mañana · It's tomorrow — AWS Student Community Day México 2026";
  return `Faltan ${daysLeft} días · ${daysLeft} days to go — AWS Student Community Day México 2026`;
}

/** Marca a estos destinatarios como enviados para la campaña (por colección). */
async function markSent(list: BroadRecipient[], campaignId: string) {
  const ids = (src: BroadRecipient["source"]) => list.filter((r) => r.source === src).map((r) => r.id);
  const regIds = ids("registration");
  const speakerIds = ids("speaker");
  const volIds = ids("volunteer");
  const userIds = ids("user");
  await Promise.all([
    regIds.length ? Registration.updateMany({ _id: { $in: regIds } }, { $addToSet: { sentCampaigns: campaignId } }) : null,
    speakerIds.length ? SpeakerProfile.updateMany({ _id: { $in: speakerIds } }, { $addToSet: { sentSpeakerCampaigns: campaignId } }) : null,
    volIds.length ? VolunteerSubmission.updateMany({ _id: { $in: volIds } }, { $addToSet: { sentVolunteerCampaigns: campaignId } }) : null,
    userIds.length ? User.updateMany({ _id: { $in: userIds } }, { $addToSet: { sentCampaigns: campaignId } }) : null,
  ]);
}

async function handleCron(request: NextRequest) {
  const started = Date.now();

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
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const announcement = REMINDER_ANNOUNCEMENTS[date];

  if (!REMINDER_DATES.includes(date) && !force) {
    return NextResponse.json({ date, daysLeft, intended: false, sent: 0, failed: 0, remaining: 0, reason: "date-not-in-allowlist" });
  }

  try {
    // ?testTo=correo → manda solo UN correo de prueba a esa dirección; no marca a nadie.
    const testTo = request.nextUrl.searchParams.get("testTo");
    if (testTo) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo)) {
        return NextResponse.json({ error: "testTo inválido" }, { status: 400 });
      }
      const html = await render(ReminderEventEmail({ name: "Prueba", daysLeft, announcement }));
      const res = await sendEmailRawResend({ from: MARKETING_EMAIL_FROM, to: testTo, subject: `[PRUEBA] ${subjectFor(daysLeft)}`, html });
      return NextResponse.json({ test: true, to: testTo, date, daysLeft, announcement: announcement ?? null, id: res.id, error: res.error });
    }

    await connectDB();
    const campaignId = `auto_reminder_${date}`;
    const pending = await gatherBroadRecipients(campaignId);
    const subject = subjectFor(daysLeft);

    if (dryRun) {
      const audience = await gatherBroadRecipients(campaignId, undefined, { skipSentFilter: true });
      return NextResponse.json({
        dryRun: true,
        date,
        daysLeft,
        announcement: announcement ?? null,
        subject,
        audience: audience.length,
        alreadySent: audience.length - pending.length,
        pending: pending.length,
        bySource: pending.reduce<Record<string, number>>((acc, r) => ((acc[r.source] = (acc[r.source] ?? 0) + 1), acc), {}),
      });
    }

    // (3) Envío por tandas dentro del presupuesto de tiempo
    let sent = 0;
    let failed = 0;
    let processed = 0;
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      if (Date.now() - started > TIME_BUDGET_MS) break;
      const chunkStart = Date.now();
      const chunk = pending.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (r) => {
          try {
            const qrImageUrl = r.qrCode ? `${APP_URL}/api/pass-qr/${r.qrCode}` : undefined;
            const html = await render(ReminderEventEmail({ name: r.name, qrImageUrl, daysLeft, announcement }));
            const res = await sendEmailRawResend({ from: MARKETING_EMAIL_FROM, to: r.email, subject, html });
            if (res.error) console.error(`[cron/send-reminders] Resend rechazó ${r.email}: ${res.error}`);
            return !res.error;
          } catch (e) {
            console.error(`[cron/send-reminders] Error con ${r.email}:`, e);
            return false;
          }
        }),
      );
      const ok = chunk.filter((_, k) => results[k]);
      if (ok.length) await markSent(ok, campaignId);
      sent += ok.length;
      failed += chunk.length - ok.length;
      processed += chunk.length;
      const wait = MIN_CHUNK_MS - (Date.now() - chunkStart);
      if (wait > 0) await sleep(wait);
    }

    return NextResponse.json({
      date,
      daysLeft,
      intended: true,
      announcement: announcement ?? null,
      sent,
      failed,
      // Los fallidos no se marcan: vuelven a intentarse en el siguiente disparo.
      remaining: pending.length - processed + failed,
      elapsedMs: Date.now() - started,
    });
  } catch (e) {
    console.error("[cron/send-reminders]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
