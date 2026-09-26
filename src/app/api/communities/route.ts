import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { CommunitySubmission } from "@/models/community-submission";
import { parseCommunityInput } from "@/lib/community-input";
import { verifyCaptcha } from "@/lib/captcha";
import { rateLimit, getIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();

    const submissions = await CommunitySubmission.find({}).sort({ submittedAt: -1 }).lean();
    return Response.json({ submissions });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(`comm:${getIp(request)}`, 20, 15 * 60 * 1000);
    if (!rl.ok) {
      return Response.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json();
    const captchaToken = typeof body.captchaToken === "string" ? body.captchaToken : "";
    if (!(await verifyCaptcha(captchaToken))) {
      return Response.json({ error: "Captcha inválido. Por favor intenta de nuevo." }, { status: 400 });
    }

    await connectDB();

    const parsed = parseCommunityInput((body.data ?? {}) as Record<string, unknown>);
    if ("error" in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    const data = parsed.data;

    const existing = await CommunitySubmission.findOne({ contactEmail: data.contactEmail });
    if (existing) {
      return Response.json(
        { error: "Ya existe una propuesta registrada con este correo de contacto." },
        { status: 409 },
      );
    }

    const submission = await CommunitySubmission.create({
      ...data,
      metadata: {
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return Response.json({ ok: true, id: submission._id });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "Error al procesar la solicitud" }, { status: 500 });
  }
}
