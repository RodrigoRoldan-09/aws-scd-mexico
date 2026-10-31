import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createLog } from "@/lib/log";
import { Registration } from "@/models/registration";
import { sendEmail, EMAIL_FROM } from "@/lib/email-service";
import { buildRegistrationEmail } from "@/lib/registration-email";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 5000;
const SAMPLE_SIZE = 10;

/**
 * Reenvía el correo de confirmación de registro a quienes nunca lo recibieron
 * (emailStatus distinto de "sent").
 * - GET, o POST sin cuerpo / {dryRun:true}: solo cuenta y muestra una muestra.
 * - POST {dryRun:false, confirm:"SEND"}: envía de verdad.
 */
function parseLimit(request: NextRequest): number {
  const raw = request.nextUrl.searchParams.get("limit");
  if (raw === null) return DEFAULT_LIMIT;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return n > MAX_LIMIT ? MAX_LIMIT : n;
}

function authError(e: unknown): NextResponse | null {
  const msg = (e as Error)?.message;
  if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
  if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
  return null;
}

async function findEligible(limit: number) {
  const filter = { emailStatus: { $ne: "sent" as const } };
  const [scanned, eligibleDocs] = await Promise.all([
    Registration.countDocuments({}),
    Registration.find(filter).sort({ createdAt: 1 }).limit(limit).exec(),
  ]);
  return { scanned, eligibleDocs };
}

async function dryRun(limit: number) {
  const { scanned, eligibleDocs } = await findEligible(limit);
  return NextResponse.json({
    dryRun: true,
    scanned,
    eligible: eligibleDocs.length,
    sample: eligibleDocs.slice(0, SAMPLE_SIZE).map((r) => ({
      email: r.email,
      name: `${r.firstName} ${r.lastName}`.trim(),
      attendance: r.attendance,
      emailStatus: r.emailStatus,
    })),
    warning: `Esto mandaría ${eligibleDocs.length} correos reales. Para enviar de verdad manda POST {dryRun:false, confirm:"SEND"}.`,
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    await connectDB();
    return await dryRun(parseLimit(request));
  } catch (e) {
    const res = authError(e);
    if (res) return res;
    console.error("[backfill-confirmations]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin"]);

    // Cuerpo ausente o no-JSON → dry-run
    let body: Record<string, unknown> | null = null;
    try {
      const parsed = await request.json();
      body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      body = null;
    }

    if (body && "dryRun" in body && typeof body.dryRun !== "boolean") {
      return NextResponse.json({ error: "dryRun debe ser booleano" }, { status: 400 });
    }

    const wantsRealSend = body?.dryRun === false;
    if (wantsRealSend && body?.confirm !== "SEND") {
      return NextResponse.json(
        { error: 'Para enviar de verdad manda {dryRun:false, confirm:"SEND"}' },
        { status: 400 },
      );
    }

    await connectDB();
    const limit = parseLimit(request);

    if (!wantsRealSend) return await dryRun(limit);

    // Envío real: mismo loop que email-queue.ts
    const { scanned, eligibleDocs } = await findEligible(limit);
    const eligible = eligibleDocs.length;
    let sent = 0;
    let failed = 0;

    for (const reg of eligibleDocs) {
      const email = reg.email;
      if (!email) {
        failed++;
        continue;
      }

      const name = `${reg.firstName} ${reg.lastName}`.trim();
      try {
        const built = await buildRegistrationEmail(name, reg.qrCode, reg.attendance);
        const html = `${built.html}<!-- ref:${reg.qrCode} -->`;

        const res = await sendEmail({
          from: EMAIL_FROM,
          to: email,
          subject: built.subject,
          html,
          attachments: built.attachments,
        });

        if (res.error) {
          failed++;
          reg.emailStatus = "failed";
          reg.emailError = res.error;
        } else {
          sent++;
          reg.emailStatus = "sent";
          reg.emailSentAt = new Date();
          reg.resendId = res.id;
          reg.emailError = null;
        }
        await reg.save();
      } catch (err: unknown) {
        failed++;
        const errMsg = err instanceof Error ? err.message : "Error inesperado al construir/enviar correo";
        reg.emailStatus = "failed";
        reg.emailError = errMsg;
        await reg.save().catch(() => {});
        console.error(`[backfill-confirmations] Excepción enviando a ${email}:`, errMsg);
      }

      // Pausa entre correos para respetar rate limits
      await new Promise((r) => setTimeout(r, 250));
    }

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "REGISTRATIONS_BACKFILL",
      target: "backfill-confirmations",
      details: `sent ${sent} / failed ${failed} de ${eligible} elegibles`,
    });

    return NextResponse.json({ scanned, eligible, sent, failed });
  } catch (e) {
    const res = authError(e);
    if (res) return res;
    console.error("[backfill-confirmations]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
