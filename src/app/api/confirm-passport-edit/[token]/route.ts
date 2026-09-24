import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Passport } from "@/models/passport";
import { PassportEditToken } from "@/models/passport-edit-token";

// POST (no GET) para que los prefetchers de correo no consuman el token de un solo uso.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    await connectDB();

    const doc = await PassportEditToken.findOne({ token });
    if (!doc) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (doc.usedAt) return Response.json({ ok: false, error: "used", shortId: doc.shortId }, { status: 409 });
    if (doc.expiresAt.getTime() < Date.now()) return Response.json({ ok: false, error: "expired", shortId: doc.shortId }, { status: 410 });

    const passport = await Passport.findOne({ shortId: doc.shortId }).select("social photoUrl");
    if (!passport) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

    const ch = doc.changes || {};
    if (ch.social && typeof ch.social === "object") {
      passport.social = { ...((passport.social ?? {}) as Record<string, string>), ...ch.social };
      passport.markModified("social");
    }
    if (typeof ch.photoUrl === "string") passport.photoUrl = ch.photoUrl;
    await passport.save();

    doc.usedAt = new Date();
    await doc.save();

    return Response.json({ ok: true, shortId: doc.shortId });
  } catch {
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}
