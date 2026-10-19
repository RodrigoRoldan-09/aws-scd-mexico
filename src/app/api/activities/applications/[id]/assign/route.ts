import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Activity } from "@/models/activity";
import { ActivityApplication } from "@/models/activity-application";
import { ActivityRegistration } from "@/models/activity-registration";
import { doTimesOverlap } from "@/lib/activity-schedule";
import { createLog } from "@/lib/log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();
    const { id } = await context.params;

    const application = await ActivityApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { activityId, adminNotes } = body;

    // CASO 1: Desasignar (activityId === null)
    if (activityId === null) {
      if (application.status === "assigned" && application.assignedActivityId) {
        const prevId = application.assignedActivityId;
        await Activity.findByIdAndUpdate(prevId, {
          $inc: { registeredCount: -1 },
        });
        await Activity.updateOne(
          { _id: prevId, registeredCount: { $lt: 0 } },
          { $set: { registeredCount: 0 } },
        );
      }

      application.status = "pending";
      application.assignedActivityId = null;
      application.assignedActivitySlug = null;
      application.assignedPriorityRank = null;
      application.assignedAt = null;
      application.assignedBy = null;
      if (typeof adminNotes === "string") {
        application.adminNotes = adminNotes.trim();
      }

      await application.save();

      await createLog({
        userId: String(user._id),
        userName: user.name,
        userRole: user.role,
        action: "ACTIVITY_UNASSIGNED",
        target: `${application.firstName} ${application.lastName} (${application.email})`,
        targetId: String(application._id),
        details: `Solicitud devuelta a pendiente. Notas: ${adminNotes || "N/A"}`,
      });

      return NextResponse.json({ ok: true, application });
    }

    // CASO 2: Asignar a una actividad
    if (!activityId || typeof activityId !== "string") {
      return NextResponse.json(
        { error: "activityId debe ser un ID válido o null para desasignar" },
        { status: 400 },
      );
    }

    const targetActivity = await Activity.findById(activityId);
    if (!targetActivity) {
      return NextResponse.json({ error: "La actividad seleccionada no existe" }, { status: 404 });
    }

    if (targetActivity.type !== "activity") {
      return NextResponse.json(
        { error: "Solo se puede asignar a actividades de tipo 'activity'" },
        { status: 400 },
      );
    }

    // Validar traslapes de horario con workshops y hackatones activos del asistente
    const userEmail = application.email.toLowerCase().trim();
    const activeRegistrations = await ActivityRegistration.find({
      $or: [
        { email: userEmail },
        { "team.members.email": userEmail },
      ],
      status: "registered",
    }).lean();

    const regActivityIds = activeRegistrations.map((r) => r.activityId);
    const enrolledActivities = regActivityIds.length > 0
      ? await Activity.find({ _id: { $in: regActivityIds } }).lean()
      : [];

    const enrolledActMap = new Map(enrolledActivities.map((a) => [String(a._id), a]));

    for (const reg of activeRegistrations) {
      const act = enrolledActMap.get(String(reg.activityId));
      const sTime = act?.startTime;
      const eTime = act?.endTime;
      if (sTime && eTime && targetActivity.startTime && targetActivity.endTime) {
        if (doTimesOverlap(targetActivity.startTime, targetActivity.endTime, sTime, eTime)) {
          return NextResponse.json(
            {
              error: "SCHEDULE_CONFLICT",
              message: `Conflicto de horario: el asistente ya está inscrito en "${act.title || reg.activitySlug}" (${sTime} - ${eTime})`,
              conflict: {
                title: act.title || reg.activitySlug,
                type: reg.activityType,
                startTime: sTime,
                endTime: eTime,
              },
            },
            { status: 409 },
          );
        }
      }
    }

    // Actualización atómica de cupo
    const isSameActivity =
      application.status === "assigned" &&
      application.assignedActivityId &&
      String(application.assignedActivityId) === String(targetActivity._id);

    if (!isSameActivity) {
      // Intentar reservar 1 lugar atómicamente en la nueva actividad
      const updatedTarget = await Activity.findOneAndUpdate(
        {
          _id: targetActivity._id,
          $expr: { $lt: ["$registeredCount", "$maxCapacity"] },
        },
        { $inc: { registeredCount: 1 } },
        { new: true },
      );

      if (!updatedTarget) {
        return NextResponse.json(
          {
            error: "SOLD_OUT",
            message: `Cupo agotado en la actividad "${targetActivity.title}" (${targetActivity.registeredCount}/${targetActivity.maxCapacity})`,
          },
          { status: 409 },
        );
      }

      // Si antes ya tenía asignada OTRA actividad, liberar el lugar anterior
      if (application.status === "assigned" && application.assignedActivityId) {
        const prevId = application.assignedActivityId;
        await Activity.findByIdAndUpdate(prevId, {
          $inc: { registeredCount: -1 },
        });
        await Activity.updateOne(
          { _id: prevId, registeredCount: { $lt: 0 } },
          { $set: { registeredCount: 0 } },
        );
      }
    }

    // Calcular si coincide con alguna de sus prioridades
    let assignedPriorityRank: number | null = null;
    const prioMatch = (application.priorities || []).find(
      (p) =>
        String(p.activityId) === String(targetActivity._id) ||
        p.activitySlug === targetActivity.slug,
    );
    if (prioMatch) {
      assignedPriorityRank = prioMatch.priority;
    }

    application.status = "assigned";
    application.assignedActivityId = targetActivity._id;
    application.assignedActivitySlug = targetActivity.slug;
    application.assignedPriorityRank = assignedPriorityRank;
    application.assignedAt = new Date();
    application.assignedBy = user.name || user.email;
    if (typeof adminNotes === "string") {
      application.adminNotes = adminNotes.trim();
    }

    await application.save();

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "ACTIVITY_ASSIGNED",
      target: `${application.firstName} ${application.lastName} (${application.email})`,
      targetId: String(application._id),
      details: `Asignado a "${targetActivity.title}" (${targetActivity.slug}). Prioridad: ${assignedPriorityRank ?? "Asignación directa / Fuera de lista"}. Notas: ${adminNotes || "N/A"}`,
    });

    return NextResponse.json({
      ok: true,
      application,
      assignedActivity: {
        _id: targetActivity._id,
        slug: targetActivity.slug,
        title: targetActivity.title,
        startTime: targetActivity.startTime,
        endTime: targetActivity.endTime,
        roomName: targetActivity.roomName,
        registeredCount: targetActivity.registeredCount + (isSameActivity ? 0 : 1),
        maxCapacity: targetActivity.maxCapacity,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
