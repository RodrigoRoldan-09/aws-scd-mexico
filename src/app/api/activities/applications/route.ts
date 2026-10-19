import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Activity } from "@/models/activity";
import { ActivityApplication } from "@/models/activity-application";
import { ActivityRegistration } from "@/models/activity-registration";
import { doTimesOverlap } from "@/lib/activity-schedule";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.trim();
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const activityIdParam = searchParams.get("activityId")?.trim();

    const filter: Record<string, unknown> = {};

    if (statusParam && ["pending", "assigned", "cancelled"].includes(statusParam)) {
      filter.status = statusParam;
    }

    if (activityIdParam) {
      filter.$or = [
        { assignedActivityId: activityIdParam },
        { "priorities.activityId": activityIdParam },
      ];
    }

    if (search) {
      filter.$and = [
        {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { qrCode: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const applications = await ActivityApplication.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // 1. Obtener todas las actividades para enriquecer prioridades y nombres
    const allActivities = await Activity.find({}).lean();
    const activityMap = new Map<string, (typeof allActivities)[0]>();
    for (const act of allActivities) {
      activityMap.set(String(act._id), act);
      activityMap.set(act.slug, act);
    }

    // 2. Extraer correos de todos los postulantes para buscar sus workshops/hackatones activos en masa
    const emails = Array.from(new Set(applications.map((a) => a.email.toLowerCase().trim())));

    const activeRegistrations = emails.length > 0
      ? await ActivityRegistration.find({
          $or: [
            { email: { $in: emails } },
            { "team.members.email": { $in: emails } },
          ],
          status: "registered",
        }).lean()
      : [];

    interface EnrolledWorkshopItem {
      activityTitle: string;
      slug: string;
      type: string;
      startTime: string;
      endTime: string;
    }

    const enrolledByEmail = new Map<string, EnrolledWorkshopItem[]>();

    for (const reg of activeRegistrations) {
      const act = activityMap.get(String(reg.activityId));
      const item: EnrolledWorkshopItem = {
        activityTitle: act?.title || reg.activitySlug,
        slug: reg.activitySlug,
        type: reg.activityType,
        startTime: act?.startTime || "",
        endTime: act?.endTime || "",
      };

      const leaderEmail = reg.email.toLowerCase().trim();
      if (!enrolledByEmail.has(leaderEmail)) enrolledByEmail.set(leaderEmail, []);
      enrolledByEmail.get(leaderEmail)!.push(item);

      for (const member of reg.team?.members || []) {
        const mEmail = member.email.toLowerCase().trim();
        if (!enrolledByEmail.has(mEmail)) enrolledByEmail.set(mEmail, []);
        enrolledByEmail.get(mEmail)!.push(item);
      }
    }

    // 3. Enriquecer cada postulación
    const enrichedApplications = applications.map((app) => {
      const userEmail = app.email.toLowerCase().trim();
      const userEnrolled = enrolledByEmail.get(userEmail) || [];

      const enrichedPriorities = (app.priorities || []).map((p) => {
        const act = activityMap.get(String(p.activityId)) || activityMap.get(p.activitySlug);
        const maxCapacity = act?.maxCapacity ?? 0;
        const registeredCount = act?.registeredCount ?? 0;
        const spotsLeft = Math.max(0, maxCapacity - registeredCount);
        const isSoldOut = registeredCount >= maxCapacity;

        // Comprobar conflicto de horario con workshops o hackatones activos del asistente
        const conflict = userEnrolled.find((w) => {
          if (!w.startTime || !w.endTime || !p.startTime || !p.endTime) return false;
          return doTimesOverlap(p.startTime, p.endTime, w.startTime, w.endTime);
        });

        return {
          ...p,
          maxCapacity,
          registeredCount,
          spotsLeft,
          isSoldOut,
          isOpen: act?.isOpen ?? true,
          hasScheduleConflict: !!conflict,
          conflictingItem: conflict
            ? {
                title: conflict.activityTitle,
                type: conflict.type,
                startTime: conflict.startTime,
                endTime: conflict.endTime,
              }
            : null,
        };
      });

      let assignedActivity = null;
      if (app.assignedActivityId) {
        const act = activityMap.get(String(app.assignedActivityId));
        if (act) {
          assignedActivity = {
            _id: act._id,
            slug: act.slug,
            title: act.title,
            titleEn: act.titleEn,
            roomName: act.roomName,
            startTime: act.startTime,
            endTime: act.endTime,
            maxCapacity: act.maxCapacity,
            registeredCount: act.registeredCount,
          };
        }
      }

      return {
        ...app,
        priorities: enrichedPriorities,
        assignedActivity,
        enrolledWorkshops: userEnrolled,
      };
    });

    return NextResponse.json({
      applications: enrichedApplications,
      total: enrichedApplications.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
