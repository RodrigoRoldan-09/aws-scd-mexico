import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Activity } from "@/models/activity";
import { ActivityRegistration } from "@/models/activity-registration";
import { ActivityApplication } from "@/models/activity-application";
import { createLog } from "@/lib/log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
    await connectDB();
    const { id } = await context.params;

    const activity = await Activity.findById(id).lean();
    if (!activity) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const statusParam = searchParams.get("status")?.trim();

    if (activity.type === "activity") {
      // Es una actividad dinámica: los "inscritos" son las solicitudes que tienen esta actividad asignada
      const appFilter: Record<string, unknown> = {
        assignedActivityId: activity._id,
      };

      if (statusParam) {
        appFilter.status = statusParam;
      } else {
        // Por defecto solo las asignadas
        appFilter.status = "assigned";
      }

      if (search) {
        appFilter.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { qrCode: { $regex: search, $options: "i" } },
        ];
      }

      const applications = await ActivityApplication.find(appFilter)
        .sort({ assignedAt: -1, createdAt: -1 })
        .lean();

      const spotsLeft = Math.max(0, activity.maxCapacity - activity.registeredCount);

      return NextResponse.json({
        activity: {
          ...activity,
          spotsLeft,
          isSoldOut: activity.registeredCount >= activity.maxCapacity,
        },
        type: "activity",
        registrations: applications,
      });
    }

    // Para workshop o hackathon: registros directos
    const regFilter: Record<string, unknown> = {
      activityId: activity._id,
    };

    if (statusParam) {
      regFilter.status = statusParam;
    }

    if (search) {
      regFilter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { qrCode: { $regex: search, $options: "i" } },
        { "team.teamName": { $regex: search, $options: "i" } },
        { "team.members.email": { $regex: search, $options: "i" } },
      ];
    }

    const registrations = await ActivityRegistration.find(regFilter)
      .sort({ createdAt: -1 })
      .lean();

    const spotsLeft = Math.max(0, activity.maxCapacity - activity.registeredCount);

    return NextResponse.json({
      activity: {
        ...activity,
        spotsLeft,
        isSoldOut: activity.registeredCount >= activity.maxCapacity,
      },
      type: activity.type,
      registrations,
    });
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

    const { searchParams } = new URL(request.url);
    const regId = searchParams.get("regId");
    if (!regId) {
      return NextResponse.json({ error: "Parámetro regId requerido" }, { status: 400 });
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
    }

    // 1. Intentar encontrar en ActivityRegistration (Workshops / Hackathons)
    const reg = await ActivityRegistration.findOne({ _id: regId, activityId: id });
    if (reg) {
      if (reg.status === "cancelled") {
        return NextResponse.json({ error: "El registro ya se encuentra cancelado" }, { status: 400 });
      }

      reg.status = "cancelled";
      await reg.save();

      const spotsToFree = reg.spotsConsumed || 1;
      await Activity.findByIdAndUpdate(id, {
        $inc: { registeredCount: -spotsToFree },
      });
      await Activity.updateOne(
        { _id: id, registeredCount: { $lt: 0 } },
        { $set: { registeredCount: 0 } },
      );

      await createLog({
        userId: String(user._id),
        userName: user.name,
        userRole: user.role,
        action: "ACTIVITY_REGISTRATION_CANCELLED",
        target: `${reg.firstName} ${reg.lastName} (${reg.email})`,
        targetId: String(reg._id),
        details: `Cancelado registro a ${activity.title}. Liberados ${spotsToFree} lugares.`,
      });

      return NextResponse.json({ ok: true, status: "cancelled", releasedSpots: spotsToFree });
    }

    // 2. Intentar encontrar en ActivityApplication (Activities)
    const app = await ActivityApplication.findOne({ _id: regId, assignedActivityId: id });
    if (app) {
      app.status = "pending";
      app.assignedActivityId = null;
      app.assignedActivitySlug = null;
      app.assignedPriorityRank = null;
      app.assignedAt = null;
      app.assignedBy = null;
      await app.save();

      await Activity.findByIdAndUpdate(id, {
        $inc: { registeredCount: -1 },
      });
      await Activity.updateOne(
        { _id: id, registeredCount: { $lt: 0 } },
        { $set: { registeredCount: 0 } },
      );

      await createLog({
        userId: String(user._id),
        userName: user.name,
        userRole: user.role,
        action: "ACTIVITY_UNASSIGNED",
        target: `${app.firstName} ${app.lastName} (${app.email})`,
        targetId: String(app._id),
        details: `Desasignado de ${activity.title}. Liberado 1 lugar.`,
      });

      return NextResponse.json({ ok: true, status: "unassigned", releasedSpots: 1 });
    }

    return NextResponse.json({ error: "Registro o postulación no encontrada" }, { status: 404 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
