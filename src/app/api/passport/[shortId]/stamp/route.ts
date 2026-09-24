import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Passport } from "@/models/passport";
import { SponsorPin } from "@/models/sponsor-pin";

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

    await connectDB();

    const sponsor = await SponsorPin.findOne({ pin: pin.trim(), isActive: true });
    if (!sponsor) {
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
