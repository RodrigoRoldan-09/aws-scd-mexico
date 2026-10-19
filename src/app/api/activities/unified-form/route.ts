import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Activity } from "@/models/activity";
import {
  getUnifiedActivityFormConfig,
  setUnifiedActivityFormConfig,
} from "@/lib/activity-config";
import { createLog } from "@/lib/log";

export async function GET() {
  try {
    await connectDB();
    const config = await getUnifiedActivityFormConfig();

    const docs = await Activity.find({
      type: "activity",
      isPublished: true,
      isOpen: true,
    })
      .sort({ order: 1, startTime: 1, createdAt: 1 })
      .lean();

    const activities = docs.map((act) => {
      const maxCapacity = act.maxCapacity || 0;
      const registeredCount = act.registeredCount || 0;
      const spotsLeft = Math.max(0, maxCapacity - registeredCount);
      return {
        _id: act._id,
        slug: act.slug,
        type: act.type,
        title: act.title,
        titleEn: act.titleEn,
        description: act.description,
        descriptionEn: act.descriptionEn,
        startTime: act.startTime,
        endTime: act.endTime,
        roomName: act.roomName,
        maxCapacity,
        registeredCount,
        spotsLeft,
        isOpen: act.isOpen,
        formConfig: act.formConfig || {},
      };
    });

    return NextResponse.json({ config, activities });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const updated = await setUnifiedActivityFormConfig(body);

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "UNIFIED_ACTIVITY_FORM_UPDATED",
      target: "Formulario Unificado de Actividades",
      details: `isOpen: ${updated.isOpen}, maxPriorities: ${updated.maxPriorities}`,
    });

    return NextResponse.json({ config: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
