import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";
import { createLog } from "@/lib/log";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer", "volunteer"]);
    const { shortId, sessionId, sessionTitle, room } = await request.json() as {
      shortId: string;
      sessionId: string;
      sessionTitle?: string;
      room?: string;
    };

    if (!shortId || !sessionId) {
      return NextResponse.json({ error: "shortId y sessionId requeridos" }, { status: 400 });
    }

    await connectDB();
    const passport = await Passport.findOne({ shortId });
    if (!passport) return NextResponse.json({ found: false }, { status: 404 });

    const already = passport.sessionAttendance?.find(
      (e: { sessionId: string }) => e.sessionId === sessionId
    );

    if (already) {
      return NextResponse.json({
        found: true,
        alreadyScanned: true,
        scannedAt: already.scannedAt,
        firstName: passport.firstName,
        lastName: passport.lastName,
        role: passport.role,
      });
    }

    passport.sessionAttendance = passport.sessionAttendance ?? [];
    passport.sessionAttendance.push({
      sessionId,
      sessionTitle: sessionTitle ?? "",
      room: room ?? "",
      scannedAt: new Date(),
      scannedBy: user.name,
    });
    await passport.save();

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "SESSION_ATTENDANCE",
      target: `${passport.firstName} ${passport.lastName}`.trim(),
      targetId: shortId,
      details: [sessionTitle, room].filter(Boolean).join(" · ") || sessionId,
    });

    return NextResponse.json({
      found: true,
      alreadyScanned: false,
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
