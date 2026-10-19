import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/registration";
import { Form } from "@/models/form";
import { ActivityRegistration } from "@/models/activity-registration";
import { ActivityApplication } from "@/models/activity-application";
import { normalizeEmail } from "@/lib/normalize";
import type { IActivity } from "@/models/activity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email : "";

    const normMail = normalizeEmail(rawEmail);
    if (!normMail.ok) {
      return NextResponse.json({ error: normMail.reason || "Correo inválido" }, { status: 400 });
    }
    const email = normMail.value;

    await connectDB();

    const reg = await Registration.findOne({ email }).lean();
    const attendeeForm = await Form.findOne({ formType: "attendee", isOpen: true }).lean();
    const generalRegistrationOpen = !!attendeeForm;

    // Workshops y Hackatones activos donde el asistente está inscrito (como líder o miembro)
    const enrolledDocs = await ActivityRegistration.find({
      $or: [{ email }, { "team.members.email": email }],
      status: "registered",
    })
      .populate<{ activityId: IActivity }>("activityId")
      .lean();

    const enrolledActivities = enrolledDocs.map((er) => {
      const act = er.activityId as IActivity | null;
      return {
        activityId: act ? String(act._id) : String(er.activityId),
        slug: er.activitySlug,
        title: act?.title || er.activitySlug,
        titleEn: act?.titleEn || "",
        type: er.activityType,
        startTime: act?.startTime || "",
        endTime: act?.endTime || "",
        spotsConsumed: er.spotsConsumed,
      };
    });

    // Postulación al Formulario Unificado de Actividades
    const app = await ActivityApplication.findOne({
      email,
      status: { $in: ["pending", "assigned"] },
    })
      .populate<{ assignedActivityId: IActivity }>("assignedActivityId")
      .lean();

    let activityApplication = null;
    if (app) {
      let assignedActivity = null;
      if (app.status === "assigned" && app.assignedActivityId) {
        const assignedAct = app.assignedActivityId as IActivity | null;
        if (assignedAct) {
          assignedActivity = {
            activityId: String(assignedAct._id),
            slug: app.assignedActivitySlug || assignedAct.slug,
            title: assignedAct.title,
            titleEn: assignedAct.titleEn,
            startTime: assignedAct.startTime,
            endTime: assignedAct.endTime,
            roomName: assignedAct.roomName,
          };
        }
      }

      activityApplication = {
        applicationId: String(app._id),
        status: app.status,
        priorities: app.priorities || [],
        assignedActivity,
      };
    }

    return NextResponse.json({
      existsInGeneralRegistration: !!reg,
      generalRegistrationOpen,
      firstName: reg?.firstName || "",
      lastName: reg?.lastName || "",
      qrCode: reg?.qrCode || "",
      enrolledActivities,
      activityApplication,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
