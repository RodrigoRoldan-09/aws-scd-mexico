import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { PrintConfig } from "@/models/print-config";
import { createLog } from "@/lib/log";

export const dynamic = "force-dynamic";

// Valida una alineación de texto
const AL = (v: unknown) => (["left", "center", "right"].includes(String(v)) ? String(v) : "left");

// Listar presets (lo usan todos los que imprimen para elegir)
export async function GET() {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
    await connectDB();

    // Sembrar el preset por defecto (impresora D520BT, etiqueta 4×6") si no hay ninguno
    if (await PrintConfig.countDocuments() === 0) {
      await PrintConfig.create({
        name: 'Etiqueta 4×6" (D520BT)',
        widthMm: 101.6, heightMm: 152.4, marginMm: 3,
        qrPct: 32, fontScale: 1, perLabel: 1,
        showQr: true, showRole: true, showCompany: true, showJobTitle: true,
        isDefault: true,
      });
    }

    const configs = await PrintConfig.find({}).sort({ isDefault: -1, name: 1 }).lean();
    return NextResponse.json({ configs: configs.map((c) => ({ ...c, id: String(c._id) })) });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 401 });
  }
}

// Crear preset (solo admin)
export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(["admin"]);
    const b = await req.json();
    const widthMm = Number(b.widthMm), heightMm = Number(b.heightMm);
    if (!b.name || !(widthMm > 0) || !(heightMm > 0)) {
      return NextResponse.json({ error: "Nombre, ancho y alto (mm) son requeridos" }, { status: 400 });
    }
    await connectDB();

    if (b.isDefault) await PrintConfig.updateMany({}, { isDefault: false });

    const doc = await PrintConfig.create({
      name: String(b.name).trim(),
      widthMm, heightMm,
      marginMm: Number(b.marginMm) || 0,
      qrPct: Number(b.qrPct) || 32,
      fontScale: Number(b.fontScale) || 1,
      perLabel: Number(b.perLabel) === 2 ? 2 : 1,
      rotate: [90, 180, 270].includes(Number(b.rotate)) ? Number(b.rotate) : 0,
      layout: b.layout === "stacked" ? "stacked" : "side",
      alignName: AL(b.alignName),
      alignJobTitle: AL(b.alignJobTitle),
      alignCompany: AL(b.alignCompany),
      alignRole: AL(b.alignRole),
      showQr: b.showQr !== false,
      showRole: b.showRole !== false,
      showCompany: b.showCompany !== false,
      showJobTitle: b.showJobTitle !== false,
      isDefault: !!b.isDefault,
    });

    await createLog({ userId: String(actor._id), userName: actor.name, userRole: actor.role, action: "PRINT_CONFIG_CREATED", target: doc.name, targetId: String(doc._id), details: `${widthMm}×${heightMm}mm` });

    return NextResponse.json({ ok: true, config: { ...doc.toObject(), id: String(doc._id) } });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
