import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Setting } from "@/models/setting";
import { revalidatePublic, SPEAKERS_TAG } from "@/lib/data/revalidate";

export const dynamic = "force-dynamic";

// GET: fetch multiple keys at once ?keys=pdf_local,pdf_international
export async function GET(req: NextRequest) {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();
    const keys = req.nextUrl.searchParams.get("keys")?.split(",").filter(Boolean) ?? [];
    const docs = await Setting.find(keys.length ? { key: { $in: keys } } : {}).lean();
    const result: Record<string, string> = {};
    for (const d of docs) result[d.key] = d.value;
    return Response.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    return Response.json({ error: msg }, { status: 403 });
  }
}

// PATCH: upsert a single setting { key, value }
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    await connectDB();
    const { key, value } = await req.json() as { key: string; value: string };
    if (!key) return Response.json({ error: "key requerido" }, { status: 400 });
    await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
    // El orden de speakers afecta el listado público cacheado
    if (key === "speaker_sort") revalidatePublic(SPEAKERS_TAG);
    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    return Response.json({ error: msg }, { status: 403 });
  }
}
