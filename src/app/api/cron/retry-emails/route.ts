import { NextRequest, NextResponse } from "next/server";
import { retryPendingRegistrations } from "@/lib/email-queue";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Endpoint de cron diario para reintentar correos pendientes/fallidos.
 * Puede ser llamado por CloudWatch Events, Vercel Cron, GitHub Actions o curl.
 * Protegido mediante token en header Authorization o query param key.
 */
export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const secret = process.env.JWT_SECRET;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const queryKey = request.nextUrl.searchParams.get("key");

  if (!secret || (bearerToken !== secret && queryKey !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  const result = await retryPendingRegistrations(limit);

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ...result,
  });
}
