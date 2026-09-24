import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SpeakerProfile } from "@/models/speaker-profile";
import { revalidatePublic, SPEAKERS_TAG } from "@/lib/data/revalidate";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();

    const { orders } = await request.json() as { orders: { id: string; sortOrder: number }[] };
    if (!Array.isArray(orders)) return Response.json({ error: "orders requerido" }, { status: 400 });

    await Promise.all(
      orders.map(({ id, sortOrder }) =>
        SpeakerProfile.findByIdAndUpdate(id, { sortOrder })
      )
    );

    revalidatePublic(SPEAKERS_TAG);

    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden")    return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
