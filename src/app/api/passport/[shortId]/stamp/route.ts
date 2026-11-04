import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Passport } from "@/models/passport";
import { SponsorPin } from "@/models/sponsor-pin";
import { getIp, isBlocked, recordFail } from "@/lib/rate-limit";
// Freno contra adivinar el PIN de sponsor (4 dígitos): igual que el PIN de dueño.
// No se limpia al acertar: con un PIN conocido se podría reiniciar el contador.
const FAIL_LIMIT = 5;
const FAIL_WINDOW = 15 * 60 * 1000;
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  try {
    const { shortId } = await params;
    const { pin } = await req.json();
    if (!pin || typeof pin !== "string") {
      return Response.json({ error: "PIN requerido" }, { status: 400 });
    }
    const failKey = `stamp_fail:${getIp(req)}:${shortId}`;
    const { blocked, retryAfterMs } = isBlocked(failKey, FAIL_LIMIT);
    if (blocked) {
      const mins = Math.ceil(retryAfterMs / 60000);
      return Response.json(
        { error: `Demasiados intentos. Intenta en ${mins} min.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
      );
    }
    await connectDB();
    const sponsor = await SponsorPin.findOne({ pin: pin.trim(), isActive: true });
    if (!sponsor) {
      recordFail(failKey, FAIL_LIMIT, FAIL_WINDOW);
      return Response.json({ error: "PIN incorrecto o sponsor inactivo" }, { status: 400 });
    }
    const passport = await Passport.findOne({ shortId });
    if (!passport) {
      return Response.json({ error: "Pasaporte no encontrado" }, { status: 404 });
    }
    const alreadyStamped = passport.stamps.some(
      (s: { sponsorId: string }) => s.sponsorId === sponsor._id.toString(),
    );
    if (alreadyStamped) {
      return Response.json({ error: "Ya tienes el sello de este sponsor" }, { status: 409 });
    }
    passport.stamps.push({
      sponsorId: sponsor._id.toString(),
      sponsorName: sponsor.sponsorName,
      stampedAt: new Date(),
    });
    await passport.save();
    await SponsorPin.findByIdAndUpdate(sponsor._id, { $inc: { totalStamps: 1 } });
    return Response.json({ ok: true, sponsorName: sponsor.sponsorName });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
