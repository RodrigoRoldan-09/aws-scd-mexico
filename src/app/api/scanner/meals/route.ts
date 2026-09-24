import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";
import { createLog } from "@/lib/log";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer", "volunteer"]);
    const { shortId, type } = await request.json() as { shortId: string; type: "lunch" | "snack" };

    if (!shortId || !type || !["lunch", "snack"].includes(type)) {
      return NextResponse.json({ error: "shortId y type ('lunch'|'snack') requeridos" }, { status: 400 });
    }

    await connectDB();
    const passport = await Passport.findOne({ shortId });
    if (!passport) return NextResponse.json({ found: false }, { status: 404 });

    const meals = passport.meals ?? {};
    const existing = (meals as Record<string, { claimedAt?: Date; claimedBy?: string } | undefined>)[type];

    if (existing?.claimedAt) {
      return NextResponse.json({
        found: true,
        alreadyClaimed: true,
        claimedAt: existing.claimedAt,
        claimedBy: existing.claimedBy,
        firstName: passport.firstName,
        lastName: passport.lastName,
        role: passport.role,
      });
    }

    passport.meals = meals;
    (passport.meals as Record<string, { claimedAt: Date; claimedBy: string }>)[type] = {
      claimedAt: new Date(),
      claimedBy: user.name,
    };
    await passport.save();

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "MEAL_CLAIMED",
      target: `${passport.firstName} ${passport.lastName}`.trim(),
      targetId: shortId,
      details: type === "lunch" ? "Almuerzo" : "Refrigerio",
    });

    return NextResponse.json({
      found: true,
      alreadyClaimed: false,
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
