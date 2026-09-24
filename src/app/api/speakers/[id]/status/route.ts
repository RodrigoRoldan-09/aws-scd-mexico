import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SpeakerProfile } from "@/models/speaker-profile";
import { createLog } from "@/lib/log";
import type { ProfileStatus } from "@/models/speaker-profile";

export const dynamic = "force-dynamic";

const ALLOWED: ProfileStatus[] = ["submitted", "reviewing", "waitlisted", "rejected"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAuth(["admin", "organizer"]); }
  catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    return Response.json({ error: msg }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await request.json() as { status: ProfileStatus };

  if (!ALLOWED.includes(status)) {
    return Response.json({ error: "Status inválido. Usa el endpoint /approve para aceptar." }, { status: 400 });
  }

  await connectDB();
  const profile = await SpeakerProfile.findById(id);
  if (!profile) return Response.json({ error: "No encontrado" }, { status: 404 });

  profile.status = status;
  await profile.save();

  const name = profile.name ?? "";

  await createLog({
    action: "SPEAKER_STATUS_CHANGED",
    target: name || id,
    targetId: id,
    details: status,
  });

  return Response.json({ ok: true, status });
}
