import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { PrintConfig } from "@/models/print-config";
import { createLog } from "@/lib/log";

// Editar preset (solo admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth(["admin"]);
    const { id } = await params;
    const b = await req.json();
    await connectDB();

    const doc = await PrintConfig.findById(id);
    if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (typeof b.name === "string") doc.name = b.name.trim();
    if (b.widthMm != null && Number(b.widthMm) > 0) doc.widthMm = Number(b.widthMm);
    if (b.heightMm != null && Number(b.heightMm) > 0) doc.heightMm = Number(b.heightMm);
    if (b.marginMm != null) doc.marginMm = Number(b.marginMm) || 0;
    if (b.qrPct != null) doc.qrPct = Number(b.qrPct) || 32;
    if (b.fontScale != null) doc.fontScale = Number(b.fontScale) || 1;
    if (b.perLabel != null) doc.perLabel = Number(b.perLabel) === 2 ? 2 : 1;
    if (b.rotate != null) doc.rotate = [90, 180, 270].includes(Number(b.rotate)) ? Number(b.rotate) : 0;
    if (b.layout != null) doc.layout = b.layout === "stacked" ? "stacked" : "side";
    const AL = (v: unknown) => (["left", "center", "right"].includes(String(v)) ? String(v) : "left");
    if (b.alignName != null) doc.alignName = AL(b.alignName);
    if (b.alignJobTitle != null) doc.alignJobTitle = AL(b.alignJobTitle);
    if (b.alignCompany != null) doc.alignCompany = AL(b.alignCompany);
    if (b.alignRole != null) doc.alignRole = AL(b.alignRole);
    if (typeof b.showQr === "boolean") doc.showQr = b.showQr;
    if (typeof b.showRole === "boolean") doc.showRole = b.showRole;
    if (typeof b.showCompany === "boolean") doc.showCompany = b.showCompany;
    if (typeof b.showJobTitle === "boolean") doc.showJobTitle = b.showJobTitle;
    if (typeof b.isDefault === "boolean") {
      if (b.isDefault) await PrintConfig.updateMany({ _id: { $ne: doc._id } }, { isDefault: false });
      doc.isDefault = b.isDefault;
    }
    await doc.save();

    await createLog({ userId: String(actor._id), userName: actor.name, userRole: actor.role, action: "PRINT_CONFIG_UPDATED", target: doc.name, targetId: String(doc._id) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth(["admin"]);
    const { id } = await params;
    await connectDB();
    const doc = await PrintConfig.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await createLog({ userId: String(actor._id), userName: actor.name, userRole: actor.role, action: "PRINT_CONFIG_DELETED", target: doc.name, targetId: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
