import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";
import { Activity, type IActivity } from "@/models/activity";
import { ActivityRegistration } from "@/models/activity-registration";
import { ActivityApplication } from "@/models/activity-application";
import { Registration } from "@/models/registration";
import { createLog } from "@/lib/log";


export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer", "volunteer"]);
    const { shortId, sessionId, sessionTitle, room, activityId, activitySlug } = await request.json() as {
      shortId: string;
      sessionId: string;
      sessionTitle?: string;
      room?: string;
      activityId?: string;
      activitySlug?: string;
    };

    if (!shortId || !sessionId) {
      return NextResponse.json({ error: "shortId y sessionId requeridos" }, { status: 400 });
    }

    await connectDB();
    const passport = await Passport.findOne({ shortId });
    if (!passport) return NextResponse.json({ found: false }, { status: 404 });

    // 1. Resolver si esta sesión corresponde a una actividad que requiere registro previo
    let activity: IActivity | null = null;

    if (activityId && mongoose.Types.ObjectId.isValid(activityId)) {
      activity = await Activity.findById(activityId);
    }
    if (!activity && activitySlug) {
      activity = await Activity.findOne({ slug: activitySlug.toLowerCase().trim() });
    }
    if (!activity && sessionId && !sessionId.startsWith("room-")) {
      if (mongoose.Types.ObjectId.isValid(sessionId)) {
        activity = await Activity.findById(sessionId);
        if (!activity) {
          activity = await Activity.findOne({ agendaEventId: sessionId });
        }
      }
    }
    // Ya no se resuelve por título: las actividades con registro se ligan a su
    // sesión por agendaEventId. Por título, sesiones libres con nombre parecido
    // (foto de LinkedIn) terminaban validándose contra una lista vacía.

    // 2. Si es una actividad con cupo/registro cerrado (workshop, hackatón o dinámica)
    if (activity) {
      // Obtener el correo del asistente para validar inscripciones individuales o como miembro de equipo
      let attendeeEmail = "";
      if (passport.linkedRegistrationId && mongoose.Types.ObjectId.isValid(passport.linkedRegistrationId)) {
        const reg = await Registration.findById(passport.linkedRegistrationId).select("email").lean();
        if (reg?.email) attendeeEmail = String(reg.email).toLowerCase().trim();
      }
      if (!attendeeEmail) {
        const reg = await Registration.findOne({ qrCode: shortId }).select("email").lean();
        if (reg?.email) attendeeEmail = String(reg.email).toLowerCase().trim();
      }

      const regConditions: Record<string, unknown>[] = [{ qrCode: shortId }];
      if (attendeeEmail) {
        regConditions.push({ email: attendeeEmail });
        regConditions.push({ "team.members.email": attendeeEmail });
      }

      // Buscar en inscripciones directas a workshops / hackatones
      const actReg = await ActivityRegistration.findOne({
        activityId: activity._id,
        status: "registered",
        $or: regConditions,
      });

      // Buscar en postulaciones asignadas por comité (actividades de selección)
      const appConditions: Record<string, unknown>[] = [{ qrCode: shortId }];
      if (attendeeEmail) {
        appConditions.push({ email: attendeeEmail });
      }

      const actApp = !actReg
        ? await ActivityApplication.findOne({
            assignedActivityId: activity._id,
            status: "assigned",
            $or: appConditions,
          })
        : null;

      // RECHAZO: Si no cuenta con registro activo confirmado
      if (!actReg && !actApp) {
        const actTypeLabel =
          activity.type === "hackathon"
            ? "este hackatón"
            : activity.type === "workshop"
            ? "este workshop"
            : "esta actividad";

        return NextResponse.json(
          {
            found: true,
            notRegistered: true,
            activityTitle: activity.title,
            activityType: activity.type,
            firstName: passport.firstName,
            lastName: passport.lastName,
            role: passport.role,
            message: `No cuenta con registro previo confirmado para ${actTypeLabel} ("${activity.title}").`,
          },
          { status: 403 },
        );
      }

      // Verificar si ya fue escaneado previamente
      const alreadyInPassport = passport.sessionAttendance?.find(
        (e: { sessionId: string }) =>
          e.sessionId === sessionId ||
          e.sessionId === String(activity._id) ||
          e.sessionId === activity.slug,
      );

      const alreadyAttended = Boolean(actReg?.attended || actApp?.attended);

      if (alreadyInPassport || alreadyAttended) {
        const when = alreadyInPassport?.scannedAt || actReg?.attendedAt || actApp?.attendedAt;
        return NextResponse.json({
          found: true,
          alreadyScanned: true,
          scannedAt: when,
          firstName: passport.firstName,
          lastName: passport.lastName,
          role: passport.role,
          activityTitle: activity.title,
        });
      }

      // Registrar asistencia en la actividad
      if (actReg) {
        actReg.attended = true;
        actReg.attendedAt = new Date();
        actReg.attendedBy = user.name || user.email;
        await actReg.save();
      } else if (actApp) {
        actApp.attended = true;
        actApp.attendedAt = new Date();
        actApp.attendedBy = user.name || user.email;
        await actApp.save();
      }

      // Registrar asistencia en el pasaporte digital
      passport.sessionAttendance = passport.sessionAttendance ?? [];
      passport.sessionAttendance.push({
        sessionId: String(activity._id),
        sessionTitle: activity.title,
        room: activity.roomName || room || "",
        scannedAt: new Date(),
        scannedBy: user.name || user.email,
      });
      await passport.save();

      await createLog({
        userId: String(user._id),
        userName: user.name,
        userRole: user.role,
        action: "SESSION_ATTENDANCE",
        target: `${passport.firstName} ${passport.lastName}`.trim(),
        targetId: shortId,
        details: `${activity.title} (${activity.type}) · ${activity.roomName || room || "Sin sala"}`,
      });

      return NextResponse.json({
        found: true,
        alreadyScanned: false,
        isActivity: true,
        activityTitle: activity.title,
        firstName: passport.firstName,
        lastName: passport.lastName,
        role: passport.role,
      });
    }

    // 3. Sesión regular de agenda o acceso general a sala (sin control estricto de cupo)
    const already = passport.sessionAttendance?.find(
      (e: { sessionId: string }) => e.sessionId === sessionId,
    );

    if (already) {
      return NextResponse.json({
        found: true,
        alreadyScanned: true,
        scannedAt: already.scannedAt,
        firstName: passport.firstName,
        lastName: passport.lastName,
        role: passport.role,
      });
    }

    passport.sessionAttendance = passport.sessionAttendance ?? [];
    passport.sessionAttendance.push({
      sessionId,
      sessionTitle: sessionTitle ?? "",
      room: room ?? "",
      scannedAt: new Date(),
      scannedBy: user.name || user.email,
    });
    await passport.save();

    await createLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: "SESSION_ATTENDANCE",
      target: `${passport.firstName} ${passport.lastName}`.trim(),
      targetId: shortId,
      details: [sessionTitle, room].filter(Boolean).join(" · ") || sessionId,
    });

    return NextResponse.json({
      found: true,
      alreadyScanned: false,
      firstName: passport.firstName,
      lastName: passport.lastName,
      role: passport.role,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
