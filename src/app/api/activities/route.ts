import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Activity, type ActivityType } from "@/models/activity";
import { createLog } from "@/lib/log";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const adminParam = searchParams.get("admin");

    let isAdmin = false;
    if (adminParam === "1") {
      try {
        await requireAuth(["admin", "organizer", "volunteer"]);
        isAdmin = true;
      } catch {
        isAdmin = false;
      }
    }

    const filter: Record<string, unknown> = {};
    if (!isAdmin) {
      filter.isPublished = true;
    }
    if (typeParam && ["workshop", "hackathon", "activity"].includes(typeParam)) {
      filter.type = typeParam;
    }

    const docs = await Activity.find(filter)
      .sort({ order: 1, startTime: 1, createdAt: 1 })
      .lean();

    const activities = docs.map((act) => {
      const maxCapacity = act.maxCapacity || 0;
      const registeredCount = act.registeredCount || 0;
      const spotsLeft = Math.max(0, maxCapacity - registeredCount);
      const isSoldOut = registeredCount >= maxCapacity;
      return {
        ...act,
        spotsLeft,
        isSoldOut,
      };
    });

    return NextResponse.json({ activities });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const {
      slug,
      type,
      title,
      titleEn,
      description,
      descriptionEn,
      agendaEventId,
      roomId,
      roomName,
      speakerName,
      level,
      startTime,
      endTime,
      isPublished,
      isOpen,
      maxCapacity,
      formConfig,
      order,
    } = body;

    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json({ error: "El slug es obligatorio" }, { status: 400 });
    }
    const cleanSlug = slug.trim().toLowerCase();

    if (!type || !["workshop", "hackathon", "activity"].includes(type)) {
      return NextResponse.json(
        { error: "El tipo debe ser 'workshop', 'hackathon' o 'activity'" },
        { status: 400 },
      );
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }
    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "startTime y endTime son obligatorios (formato HH:mm)" },
        { status: 400 },
      );
    }
    const capacityNum = typeof maxCapacity === "number" ? maxCapacity : parseInt(maxCapacity, 10);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      return NextResponse.json({ error: "maxCapacity debe ser un número mayor a 0" }, { status: 400 });
    }

    const existing = await Activity.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json({ error: "Ya existe una actividad con este slug" }, { status: 409 });
    }

    const activity = await Activity.create({
      slug: cleanSlug,
      type: type as ActivityType,
      title: title.trim(),
      titleEn: typeof titleEn === "string" ? titleEn.trim() : "",
      description: typeof description === "string" ? description.trim() : "",
      descriptionEn: typeof descriptionEn === "string" ? descriptionEn.trim() : "",
      agendaEventId: agendaEventId || null,
      roomId: roomId || null,
      roomName: typeof roomName === "string" ? roomName.trim() : "",
      speakerName: typeof speakerName === "string" ? speakerName.trim() : "",
      level: level || "",
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      isPublished: typeof isPublished === "boolean" ? isPublished : false,
      isOpen: typeof isOpen === "boolean" ? isOpen : true,
      maxCapacity: capacityNum,
      registeredCount: 0,
      formConfig: formConfig || {},
      order: typeof order === "number" ? order : 0,
    });

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "ACTIVITY_CREATED",
      target: activity.title,
      targetId: String(activity._id),
      details: `Tipo: ${activity.type}, Slug: ${activity.slug}, Cupo: ${activity.maxCapacity}`,
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
