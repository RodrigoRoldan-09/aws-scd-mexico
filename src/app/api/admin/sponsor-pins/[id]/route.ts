import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SponsorPin } from "@/models/sponsor-pin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(["admin"]);
    const { id } = await params;
    const body = await req.json();
    await connectDB();

    const update: Record<string, unknown> = {};
    if (body.sponsorName !== undefined) update.sponsorName = String(body.sponsorName).trim();
    if (body.logoUrl !== undefined) update.logoUrl = body.logoUrl ? String(body.logoUrl).trim() : undefined;
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);
    if (body.pin !== undefined) {
      const pin = String(body.pin).trim();
      if (!/^\d{4}$/.test(pin)) {
        return Response.json({ error: "El PIN debe ser exactamente 4 dígitos" }, { status: 400 });
      }
      const conflict = await SponsorPin.findOne({ pin, _id: { $ne: id } });
      if (conflict) return Response.json({ error: "PIN ya en uso" }, { status: 409 });
      update.pin = pin;
    }

    const doc = await SponsorPin.findByIdAndUpdate(id, update, { returnDocument: "after" });
    if (!doc) return Response.json({ error: "No encontrado" }, { status: 404 });

    return Response.json({ pin: doc });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(["admin"]);
    const { id } = await params;
    await connectDB();
    await SponsorPin.findByIdAndDelete(id);
    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
