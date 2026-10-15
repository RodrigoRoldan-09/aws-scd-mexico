import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { retryPendingRegistrations } from "@/lib/email-queue";

export const maxDuration = 300; // 5 minutos máximo

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    const isKeyAuth = adminKey && adminKey === process.env.JWT_SECRET;
    if (!isKeyAuth) {
      await requireAuth(["admin", "organizer"]);
    }

    const body = await request.json().catch(() => ({}));
    const limit = typeof body.limit === "number" ? body.limit : 100;

    const result = await retryPendingRegistrations(limit);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
