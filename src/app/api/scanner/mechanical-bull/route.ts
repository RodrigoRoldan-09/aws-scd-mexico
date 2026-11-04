import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";
import { createLog } from "@/lib/log";
// Toro mecánico: una sola vez por persona. Igual que almuerzos, pero el registro
// es atómico (findOneAndUpdate condicionado) para que dos escaneos simultáneos
// del mismo QR no puedan registrarse ambos.
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer", "volunteer"]);
    const body = await request.json().catch(() => ({})) as { shortId?: unknown };
    const shortId = typeof body.shortId === "string" ? body.shortId.trim() : "";
    if (!shortId) {
      return NextResponse.json({ error: "shortId requerido" }, { status: 400 });
    }
    await connectDB();
    const now = new Date();
    const passport = await Passport.findOneAndUpdate(
      {
        shortId,
        $or: [
          { "mechanicalBull.claimedAt": { $exists: false } },
          { "mechanicalBull.claimedAt": null },
        ],
      },
      { $set: { "mechanicalBull.claimedAt": now, "mechanicalBull.claimedBy": user.name } },
      { returnDocument: "after" },
    );
    if (!passport) {
      const existing = await Passport.findOne({ shortId }).lean();
      if (!existing) return NextResponse.json({ found: false }, { status: 404 });
      return NextResponse.json({
        found: true,
        alreadyClaimed: true,
        claimedAt: existing.mechanicalBull?.claimedAt,
        claimedBy: existing.mechanicalBull?.claimedBy,
        firstName: existing.firstName,
        lastName: existing.lastName,
        role: existing.role,
      });
    }
    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "MECHANICAL_BULL_RIDE",
      target: `${passport.firstName} ${passport.lastName}`.trim(),
      targetId: shortId,
      details: "Toro mecánico",
    });
    return NextResponse.json({
      found: true,
      alreadyClaimed: false,
      claimedAt: now,
      firstName: passport.firstName,
      lastName: passport.lastName,
      role: passport.role,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
