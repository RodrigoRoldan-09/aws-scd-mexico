import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Activity, type IActivity } from "@/models/activity";
import { ActivityRegistration } from "@/models/activity-registration";
import { ActivityApplication } from "@/models/activity-application";
import { getUnifiedActivityFormConfig } from "@/lib/activity-config";
import { verifyCaptcha } from "@/lib/captcha";
import { normalizeEmail } from "@/lib/normalize";
import { ensureGeneralRegistration } from "@/lib/activity-hybrid-registration";
import { doTimesOverlap } from "@/lib/activity-schedule";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      captchaToken,
      email: rawEmail,
      generalProfile,
      prioritySlugs,
      logistics,
      globalCustomAnswers,
      activityCustomAnswers,
    } = body;

    // 1. Recepción abierta
    const config = await getUnifiedActivityFormConfig();
    if (!config.isOpen) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "El registro unificado a actividades no está abierto en este momento." },
        { status: 404 },
      );
    }

    // Captcha
    const captchaOk = await verifyCaptcha(typeof captchaToken === "string" ? captchaToken : "");
    if (!captchaOk) {
      return NextResponse.json(
        { error: "Captcha inválido. Por favor intenta de nuevo." },
        { status: 400 },
      );
    }

    const normMail = normalizeEmail(typeof rawEmail === "string" ? rawEmail : "");
    if (!normMail.ok) {
      return NextResponse.json({ error: normMail.reason || "Correo inválido" }, { status: 400 });
    }
    const email = normMail.value;

    await connectDB();

    // 2. Postulación única activa
    const existingApp = await ActivityApplication.findOne({
      email,
      status: { $in: ["pending", "assigned"] },
    });
    if (existingApp) {
      return NextResponse.json(
        {
          error: "ALREADY_APPLIED_ACTIVITIES",
          message: "Ya cuentas con una postulación activa en el registro de actividades.",
        },
        { status: 409 },
      );
    }

    // 3. Flujo híbrido con registro general
    const hybrid = await ensureGeneralRegistration(email, generalProfile);
    if (hybrid.error || !hybrid.registration || !hybrid.qrCode) {
      return NextResponse.json({ error: hybrid.error || "Error en registro general" }, { status: hybrid.status || 400 });
    }

    // 4. Consultar workshops y hackatones activos del asistente
    const activeEnrolled = await ActivityRegistration.find({
      $or: [{ email }, { "team.members.email": email }],
      status: "registered",
    })
      .populate<{ activityId: IActivity }>("activityId")
      .lean();

    // Consultar todas las actividades publicadas y abiertas de tipo "activity"
    const allActivities = await Activity.find({
      type: "activity",
      isPublished: true,
      isOpen: true,
    })
      .sort({ order: 1, startTime: 1 })
      .lean();

    // Filtrar aquellas sin traslape de horario con los workshops/hackatones activos del usuario
    const eligibleActivities: IActivity[] = [];
    const conflictBySlug = new Map<string, { activityTitle: string; enrolledTitle: string; enrolledTime: string }>();

    for (const act of allActivities) {
      let hasConflict = false;
      for (const enr of activeEnrolled) {
        const otherAct = enr.activityId as IActivity | null;
        if (!otherAct) continue;
        if (doTimesOverlap(act.startTime, act.endTime, otherAct.startTime, otherAct.endTime)) {
          hasConflict = true;
          conflictBySlug.set(act.slug, {
            activityTitle: act.title,
            enrolledTitle: otherAct.title,
            enrolledTime: `${otherAct.startTime} - ${otherAct.endTime}`,
          });
          break;
        }
      }
      if (!hasConflict) {
        eligibleActivities.push(act);
      }
    }

    if (!Array.isArray(prioritySlugs) || prioritySlugs.length === 0) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Debes seleccionar tus prioridades de actividades." },
        { status: 400 },
      );
    }

    // Verificar si algún slug enviado tiene conflicto de horario con un workshop inscrito
    for (const slug of prioritySlugs) {
      if (conflictBySlug.has(slug)) {
        const c = conflictBySlug.get(slug)!;
        return NextResponse.json(
          {
            error: "SCHEDULE_CONFLICT",
            message: `La actividad "${c.activityTitle}" se empalma con tu workshop/hackatón "${c.enrolledTitle}" (${c.enrolledTime}).`,
          },
          { status: 409 },
        );
      }
    }

    // 5. Cantidad obligatoria de prioridades (Top Fijo)
    const requiredCount = Math.min(config.maxPriorities || 3, eligibleActivities.length);
    const uniqueSlugs = Array.from(new Set(prioritySlugs.map((s: unknown) => String(s).trim().toLowerCase())));

    if (uniqueSlugs.length !== requiredCount) {
      return NextResponse.json(
        {
          error: "BAD_REQUEST",
          message: `Debes ordenar exactamente ${requiredCount} actividades distintas como tus prioridades.`,
        },
        { status: 400 },
      );
    }

    // Validar que todos los slugs existan en las actividades elegibles
    const selectedActivities: IActivity[] = [];
    for (const slug of uniqueSlugs) {
      const found = eligibleActivities.find((a) => a.slug === slug);
      if (!found) {
        return NextResponse.json(
          { error: "BAD_REQUEST", message: `La actividad "${slug}" no es elegible o no existe.` },
          { status: 400 },
        );
      }
      selectedActivities.push(found);
    }

    // 6. Validación de preguntas globales y por actividad
    const globAnswers = (globalCustomAnswers || {}) as Record<string, unknown>;
    for (const field of config.globalCustomFields || []) {
      if (field.required) {
        const val = globAnswers[field.key];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          return NextResponse.json(
            { error: "BAD_REQUEST", message: `La pregunta global "${field.label}" es obligatoria.` },
            { status: 400 },
          );
        }
      }
    }

    const actAnswers = (activityCustomAnswers || {}) as Record<string, Record<string, unknown>>;
    for (const act of selectedActivities) {
      const customFields = act.formConfig?.customFields || [];
      const answersForThis = actAnswers[act.slug] || {};
      for (const field of customFields) {
        if (field.required) {
          const val = answersForThis[field.key];
          if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
            return NextResponse.json(
              {
                error: "BAD_REQUEST",
                message: `La pregunta "${field.label}" de la actividad "${act.title}" es obligatoria.`,
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // 7. Construir arreglo de prioridades (1, 2, 3...)
    const priorities = selectedActivities.map((act, index) => ({
      priority: index + 1,
      activityId: act._id,
      activitySlug: act.slug,
      activityTitle: act.title,
      startTime: act.startTime,
      endTime: act.endTime,
    }));

    // 8. Crear documento en activityapplications (status: pending, SIN descuentar cupo)
    const application = await ActivityApplication.create({
      registrationId: hybrid.registration._id,
      qrCode: hybrid.qrCode,
      createdGeneralRegistration: hybrid.createdGeneralRegistration || false,
      firstName: hybrid.registration.firstName,
      lastName: hybrid.registration.lastName,
      email,
      priorities,
      status: "pending",
      assignedActivityId: null,
      assignedActivitySlug: null,
      assignedPriorityRank: null,
      assignedAt: null,
      assignedBy: null,
      adminNotes: "",
      logistics: {
        bringsLaptop: !!logistics?.bringsLaptop,
        acceptedPrerequisites: !!logistics?.acceptedPrerequisites,
      },
      globalCustomAnswers: globAnswers,
      activityCustomAnswers: actAnswers,
    });

    return NextResponse.json(
      {
        ok: true,
        application: {
          id: String(application._id),
          qrCode: hybrid.qrCode,
          firstName: hybrid.registration.firstName,
          lastName: hybrid.registration.lastName,
          email,
          status: "pending",
          createdGeneralRegistration: hybrid.createdGeneralRegistration || false,
          priorities: application.priorities.map((p) => ({
            priority: p.priority,
            slug: p.activitySlug,
            title: p.activityTitle,
            startTime: p.startTime,
            endTime: p.endTime,
          })),
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
