import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SponsorPin } from "@/models/sponsor-pin";

export async function GET() {
  try {
    await requireAuth(["admin"]);
    await connectDB();
    const pins = await SponsorPin.find({}).sort({ createdAt: -1 }).lean();
    return Response.json({ pins });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { sponsorName, logoUrl, pin } = await req.json();

    if (!sponsorName?.trim() || !pin?.trim()) {
      return Response.json({ error: "Nombre y PIN son requeridos" }, { status: 400 });
    }
    if (!/^\d{4}$/.test(pin.trim())) {
      return Response.json({ error: "El PIN debe ser exactamente 4 dígitos" }, { status: 400 });
    }

    await connectDB();

    const existing = await SponsorPin.findOne({ pin: pin.trim() });
    if (existing) {
      return Response.json({ error: "PIN ya en uso por otro sponsor" }, { status: 409 });
    }

    const doc = await SponsorPin.create({
      sponsorName: sponsorName.trim(),
      logoUrl: logoUrl?.trim() || undefined,
      pin: pin.trim(),
    });
    return Response.json({ pin: doc }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
