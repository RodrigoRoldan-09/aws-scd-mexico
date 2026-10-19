import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Activity, type IActivity } from "@/models/activity";
import { ActivityRegistration } from "@/models/activity-registration";
import { ActivityApplication } from "@/models/activity-application";
import { verifyCaptcha } from "@/lib/captcha";
import { normalizeEmail } from "@/lib/normalize";
import { ensureGeneralRegistration } from "@/lib/activity-hybrid-registration";
import { doTimesOverlap } from "@/lib/activity-schedule";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Identificador requerido" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { captchaToken, email: rawEmail, generalProfile, logistics, team, customAnswers } = body;

    // Verificar captcha
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

    const activity = await Activity.findOne({ slug: id.toLowerCase().trim() });
    if (!activity || !activity.isPublished || !activity.isOpen) {
      return NextResponse.json(
        { error: "El workshop o hackatón no existe o no está abierto para registro." },
        { status: 404 },
      );
    }

    // 1. Tipo permitido: Solo workshop o hackathon
    if (activity.type === "activity") {
      return NextResponse.json(
        {
          error: "USE_UNIFIED_ACTIVITY_FORM",
          message: "Las actividades se registran a través del Formulario Unificado por orden de prioridad.",
        },
        { status: 400 },
      );
    }

    // Preparar lista de correos de participantes
    const isTeam = !!team?.isTeam;
    const teamMembers = (Array.isArray(team?.members) ? team.members : []).map((m: any) => ({
      firstName: String(m.firstName || "").trim(),
      lastName: String(m.lastName || "").trim(),
      email: String(m.email || "").trim().toLowerCase(),
      roleInTeam: String(m.roleInTeam || "").trim(),
    }));

    const memberEmails: string[] = [];
    if (isTeam) {
      for (const m of teamMembers) {
        if (!m.email || !m.firstName) {
          return NextResponse.json({ error: "Datos incompletos de integrantes de equipo." }, { status: 400 });
        }
        if (m.email === email) {
          return NextResponse.json(
            { error: "El correo del líder no puede repetirse en los miembros del equipo." },
            { status: 400 },
          );
        }
        if (memberEmails.includes(m.email)) {
          return NextResponse.json(
            { error: `El correo ${m.email} está duplicado en los integrantes del equipo.` },
            { status: 400 },
          );
        }
        memberEmails.push(m.email);
      }
    }

    // Validar modalidad de participación y tamaño de equipo
    const totalMembers = 1 + memberEmails.length;
    const partMode = activity.formConfig?.participationMode || "individual";
    const minTeam = activity.formConfig?.minTeamSize || 1;
    const maxTeam = activity.formConfig?.maxTeamSize || 3;

    if (isTeam) {
      if (partMode === "individual") {
        return NextResponse.json({ error: "Esta dinámica solo permite registro individual." }, { status: 400 });
      }
      if (totalMembers < minTeam || totalMembers > maxTeam) {
        return NextResponse.json(
          { error: `El equipo debe tener entre ${minTeam} y ${maxTeam} integrantes (incluyendo al líder).` },
          { status: 400 },
        );
      }
    } else {
      if (partMode === "team") {
        return NextResponse.json(
          { error: `Esta dinámica requiere registrarse en equipo (mínimo ${minTeam} integrantes).` },
          { status: 400 },
        );
      }
    }

    // Flujo Híbrido: asegurar que el líder exista en registros generales
    const hybrid = await ensureGeneralRegistration(email, generalProfile);
    if (hybrid.error || !hybrid.registration || !hybrid.qrCode) {
      return NextResponse.json({ error: hybrid.error || "Error en registro general" }, { status: hybrid.status || 400 });
    }

    // 2. Duplicado: Que ni el líder ni ningún miembro estén ya registrados en esta actividad
    const leaderAlready = await ActivityRegistration.findOne({
      activityId: activity._id,
      email,
      status: "registered",
    });
    if (leaderAlready) {
      return NextResponse.json(
        { error: "ALREADY_REGISTERED", message: "Ya estás registrado en este workshop o hackatón." },
        { status: 409 },
      );
    }

    if (memberEmails.length > 0) {
      const memberAlready = await ActivityRegistration.findOne({
        activityId: activity._id,
        $or: [{ email: { $in: memberEmails } }, { "team.members.email": { $in: memberEmails } }],
        status: "registered",
      });
      if (memberAlready) {
        return NextResponse.json(
          {
            error: "MEMBER_ALREADY_REGISTERED",
            message: "Uno o más integrantes de tu equipo ya se encuentran inscritos en este workshop o hackatón.",
          },
          { status: 409 },
        );
      }
    }

    // 3. Traslape de horario ([startTime, endTime]):
    // Validar para el líder y cada integrante
    const emailsToCheck = [email, ...memberEmails];

    for (const chkEmail of emailsToCheck) {
      const isLeader = chkEmail === email;
      const whoLabel = isLeader ? "Ya estás inscrito" : `El integrante ${chkEmail} ya está inscrito`;

      // Consultar workshops y hackatones activos
      const otherEnrolled = await ActivityRegistration.find({
        $or: [{ email: chkEmail }, { "team.members.email": chkEmail }],
        status: "registered",
      })
        .populate<{ activityId: IActivity }>("activityId")
        .lean();

      for (const enr of otherEnrolled) {
        const otherAct = enr.activityId as IActivity | null;
        if (!otherAct || String(otherAct._id) === String(activity._id)) continue;
        if (doTimesOverlap(activity.startTime, activity.endTime, otherAct.startTime, otherAct.endTime)) {
          return NextResponse.json(
            {
              error: isLeader ? "SCHEDULE_CONFLICT" : "MEMBER_SCHEDULE_CONFLICT",
              message: `El horario de ${activity.title} (${activity.startTime} - ${activity.endTime}) se empalma con "${otherAct.title}" (${otherAct.startTime} - ${otherAct.endTime}) donde ${whoLabel}.`,
            },
            { status: 409 },
          );
        }
      }

      // Consultar actividad asignada manualmente
      const assignedApp = await ActivityApplication.findOne({
        email: chkEmail,
        status: "assigned",
      })
        .populate<{ assignedActivityId: IActivity }>("assignedActivityId")
        .lean();

      if (assignedApp && assignedApp.assignedActivityId) {
        const assignedAct = assignedApp.assignedActivityId as IActivity;
        if (doTimesOverlap(activity.startTime, activity.endTime, assignedAct.startTime, assignedAct.endTime)) {
          return NextResponse.json(
            {
              error: isLeader ? "SCHEDULE_CONFLICT" : "MEMBER_SCHEDULE_CONFLICT",
              message: `El horario de ${activity.title} (${activity.startTime} - ${activity.endTime}) se empalma con la actividad asignada "${assignedAct.title}" (${assignedAct.startTime} - ${assignedAct.endTime}) de ${isLeader ? "tu perfil" : chkEmail}.`,
            },
            { status: 409 },
          );
        }
      }
    }

    // 4. Cupo atómico
    const capacityMode = activity.formConfig?.capacityMode || "per_person";
    const spotsNeeded = !isTeam ? 1 : capacityMode === "per_team" ? 1 : totalMembers;

    const updatedActivity = await Activity.findOneAndUpdate(
      {
        _id: activity._id,
        isOpen: true,
        registeredCount: { $lte: activity.maxCapacity - spotsNeeded },
      },
      {
        $inc: { registeredCount: spotsNeeded },
      },
      { new: true },
    );

    if (!updatedActivity) {
      return NextResponse.json(
        { error: "SOLD_OUT", message: "No hay cupo suficiente para completar la inscripción." },
        { status: 409 },
      );
    }

    // 5. Crear ActivityRegistration
    const activityRegistration = await ActivityRegistration.create({
      activityId: activity._id,
      activitySlug: activity.slug,
      activityType: activity.type,
      registrationId: hybrid.registration._id,
      qrCode: hybrid.qrCode,
      createdGeneralRegistration: hybrid.createdGeneralRegistration || false,
      firstName: hybrid.registration.firstName,
      lastName: hybrid.registration.lastName,
      email,
      status: "registered",
      spotsConsumed: spotsNeeded,
      logistics: {
        bringsLaptop: !!logistics?.bringsLaptop,
        acceptedPrerequisites: !!logistics?.acceptedPrerequisites,
      },
      team: {
        isTeam,
        teamName: isTeam ? String(team?.teamName || "").trim() : "",
        roleInTeam: isTeam ? String(team?.roleInTeam || "").trim() : "",
        members: isTeam ? teamMembers : [],
      },
      customAnswers: customAnswers || {},
    });

    return NextResponse.json(
      {
        ok: true,
        registration: {
          id: String(activityRegistration._id),
          activitySlug: activity.slug,
          activityTitle: activity.title,
          qrCode: hybrid.qrCode,
          email,
          status: "registered",
          spotsConsumed: spotsNeeded,
          createdGeneralRegistration: hybrid.createdGeneralRegistration || false,
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
