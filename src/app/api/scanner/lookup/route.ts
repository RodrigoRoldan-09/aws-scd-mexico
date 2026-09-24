import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
    const shortId = request.nextUrl.searchParams.get("shortId");
    if (!shortId) return NextResponse.json({ error: "shortId requerido" }, { status: 400 });

    await connectDB();
    const passport = await Passport.findOne({ shortId }).lean() as Record<string, unknown> | null;

    if (!passport) return NextResponse.json({ found: false }, { status: 404 });

    return NextResponse.json({
      found: true,
      shortId: passport.shortId,
      firstName: passport.firstName,
      lastName: passport.lastName,
      role: passport.role,
      sessionAttendance: passport.sessionAttendance ?? [],
      meals: passport.meals ?? {},
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
