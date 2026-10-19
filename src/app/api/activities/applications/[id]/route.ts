import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Activity } from "@/models/activity";
import { ActivityApplication } from "@/models/activity-application";
import { createLog } from "@/lib/log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();
    const { id } = await context.params;

    const application = await ActivityApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (application.status === "cancelled") {
      return NextResponse.json({ error: "La solicitud ya está cancelada" }, { status: 400 });
    }

    // Si estaba asignada a una actividad, liberar el lugar
    if (application.status === "assigned" && application.assignedActivityId) {
      await Activity.findByIdAndUpdate(application.assignedActivityId, {
        $inc: { registeredCount: -1 },
      });
      await Activity.updateOne(
        { _id: application.assignedActivityId, registeredCount: { $lt: 0 } },
        { $set: { registeredCount: 0 } },
      );
    }

    application.status = "cancelled";
    await application.save();

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "ACTIVITY_APPLICATION_CANCELLED",
      target: `${application.firstName} ${application.lastName} (${application.email})`,
      targetId: String(application._id),
      details: `Solicitud de actividades cancelada.`,
    });

    return NextResponse.json({ ok: true, application });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
