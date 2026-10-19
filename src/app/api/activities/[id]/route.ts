import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Activity, type ActivityType } from "@/models/activity";
import { ActivityRegistration } from "@/models/activity-registration";
import { ActivityApplication } from "@/models/activity-application";
import { createLog } from "@/lib/log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();
    const { id } = await context.params;

    const activity = await Activity.findById(id);
    if (!activity) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
    }

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

    if (slug !== undefined) {
      const cleanSlug = String(slug).trim().toLowerCase();
      if (!cleanSlug) {
        return NextResponse.json({ error: "El slug no puede estar vacío" }, { status: 400 });
      }
      if (cleanSlug !== activity.slug) {
        const existing = await Activity.findOne({ slug: cleanSlug, _id: { $ne: activity._id } });
        if (existing) {
          return NextResponse.json({ error: "Ya existe otra actividad con este slug" }, { status: 409 });
        }
        activity.slug = cleanSlug;
      }
    }

    if (type !== undefined) {
      if (!["workshop", "hackathon", "activity"].includes(type)) {
        return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
      }
      activity.type = type as ActivityType;
    }

    if (title !== undefined) {
      const cleanTitle = String(title).trim();
      if (!cleanTitle) {
        return NextResponse.json({ error: "El título no puede estar vacío" }, { status: 400 });
      }
      activity.title = cleanTitle;
    }

    if (titleEn !== undefined) activity.titleEn = String(titleEn).trim();
    if (description !== undefined) activity.description = String(description).trim();
    if (descriptionEn !== undefined) activity.descriptionEn = String(descriptionEn).trim();
    if (agendaEventId !== undefined) activity.agendaEventId = agendaEventId || null;
    if (roomId !== undefined) activity.roomId = roomId || null;
    if (roomName !== undefined) activity.roomName = String(roomName).trim();
    if (speakerName !== undefined) activity.speakerName = String(speakerName).trim();
    if (level !== undefined) {
      const cleanLevel = String(level).trim();
      activity.level = (["", "100", "200", "300", "400"].includes(cleanLevel) ? cleanLevel : "") as "" | "100" | "200" | "300" | "400";
    }
    if (startTime !== undefined) activity.startTime = String(startTime).trim();
    if (endTime !== undefined) activity.endTime = String(endTime).trim();
    if (typeof isPublished === "boolean") activity.isPublished = isPublished;
    if (typeof isOpen === "boolean") activity.isOpen = isOpen;

    if (maxCapacity !== undefined) {
      const cap = typeof maxCapacity === "number" ? maxCapacity : parseInt(maxCapacity, 10);
      if (isNaN(cap) || cap < 0) {
        return NextResponse.json({ error: "maxCapacity debe ser un número >= 0" }, { status: 400 });
      }
      activity.maxCapacity = cap;
    }

    if (formConfig && typeof formConfig === "object") {
      activity.formConfig = {
        ...activity.formConfig,
        ...formConfig,
      };
    }

    if (typeof order === "number") {
      activity.order = order;
    }

    await activity.save();

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "ACTIVITY_UPDATED",
      target: activity.title,
      targetId: String(activity._id),
      details: `Actualizada actividad: ${activity.slug}. Publicada: ${activity.isPublished}, Abierta: ${activity.isOpen}`,
    });

    return NextResponse.json({ activity });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();
    const { id } = await context.params;

    const activity = await Activity.findById(id);
    if (!activity) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
    }

    // Si tiene registros directos (workshops / hackatones), cancelarlos
    await ActivityRegistration.updateMany(
      { activityId: activity._id, status: "registered" },
      { $set: { status: "cancelled" } },
    );

    // Si tiene postulaciones asignadas (activity), devolverlas a pending
    await ActivityApplication.updateMany(
      { assignedActivityId: activity._id },
      {
        $set: {
          status: "pending",
          assignedActivityId: null,
          assignedActivitySlug: null,
          assignedPriorityRank: null,
          assignedAt: null,
          assignedBy: null,
        },
      },
    );

    await Activity.findByIdAndDelete(id);

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "ACTIVITY_DELETED",
      target: activity.title,
      targetId: String(activity._id),
      details: `Eliminada actividad ${activity.slug} (${activity.type})`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
