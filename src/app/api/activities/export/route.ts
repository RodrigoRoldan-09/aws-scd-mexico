import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Activity, type ICustomField } from "@/models/activity";
import { ActivityRegistration, type ITeamMember } from "@/models/activity-registration";
import { ActivityApplication } from "@/models/activity-application";
import { Registration, type IRegistration } from "@/models/registration";
import {
  attendanceLabelOf,
  docTypeLabelOf,
  entityLabelOf,
  roleLabelOf,
} from "@/data/attendee-form";
import { getUnifiedActivityFormConfig } from "@/lib/activity-config";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.includes(";")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function formatActivityType(type: string | undefined): string {
  if (type === "workshop") return "Workshop";
  if (type === "hackathon") return "Hackatón";
  if (type === "activity") return "Actividad";
  return type || "";
}

function formatStatus(status: string): string {
  if (status === "registered") return "Confirmado";
  if (status === "assigned") return "Asignado";
  if (status === "cancelled") return "Cancelado";
  if (status === "pending") return "Pendiente";
  return status;
}

function formatTeamMembers(members: ITeamMember[] | undefined): string {
  if (!members || !Array.isArray(members) || members.length === 0) return "";
  return members
    .map((m) => {
      const name = `${m.firstName || ""} ${m.lastName || ""}`.trim();
      const role = m.roleInTeam ? ` - ${m.roleInTeam}` : "";
      return `${name} (${m.email}${role})`;
    })
    .join(" ; ");
}

function formatCustomAnswers(
  answers: Record<string, unknown> | undefined,
  fields: ICustomField[] | undefined,
): string {
  if (!answers || typeof answers !== "object") return "";
  const fieldMap = new Map((fields || []).map((f) => [f.key, f]));
  const parts: string[] = [];

  for (const [key, val] of Object.entries(answers)) {
    if (val === null || val === undefined || val === "") continue;
    const field = fieldMap.get(key);
    const label = field?.label || key;
    let displayVal: string;
    if (typeof val === "boolean") {
      displayVal = val ? "Sí" : "No";
    } else if (field?.options && typeof val === "string") {
      const opt = field.options.find((o) => o.value === val);
      displayVal = opt?.label || val;
    } else if (Array.isArray(val)) {
      displayVal = val.join(", ");
    } else {
      displayVal = String(val);
    }
    parts.push(`${label}: ${displayVal}`);
  }

  return parts.join(" | ");
}

const HEADERS = [
  "Tipo de Actividad",
  "Actividad",
  "Horario",
  "Salón / Ubicación",
  "Instructor / Speaker",
  "Nivel",
  "Estado de Inscripción",
  "Nombre",
  "Apellido",
  "Correo Electrónico",
  "Código QR / Gafete",
  "Modalidad Evento General",
  "Tipo de Documento",
  "Número de Documento",
  "Rol / Perfil",
  "Tipo de Entidad",
  "Entidad / Institución",
  "Pertenece a Comunidad",
  "Nombre de Comunidad",
  "Lleva Laptop",
  "Aceptó Prerrequisitos",
  "Modalidad Participación",
  "Nombre del Equipo",
  "Rol en el Equipo",
  "Integrantes del Equipo",
  "Lugares Ocupados",
  "Prioridad Asignada",
  "Respuestas Personalizadas",
  "Asistió a la Actividad",
  "Fecha Asistencia Actividad",
  "Fecha de Inscripción",
  "ID Registro",
];

interface ExportRow {
  tipoActividad: string;
  actividad: string;
  horario: string;
  salon: string;
  speaker: string;
  nivel: string;
  estado: string;
  nombre: string;
  apellido: string;
  correo: string;
  qrCode: string;
  modalidadGeneral: string;
  tipoDocumento: string;
  numDocumento: string;
  rol: string;
  tipoEntidad: string;
  entidad: string;
  perteneceComunidad: string;
  comunidad: string;
  llevaLaptop: string;
  aceptoPrerrequisitos: string;
  modalidadParticipacion: string;
  nombreEquipo: string;
  rolEquipo: string;
  integrantesEquipo: string;
  lugaresOcupados: string;
  prioridadAsignada: string;
  respuestasPersonalizadas: string;
  asistio: string;
  fechaAsistencia: string;
  fechaInscripcion: string;
  idRegistro: string;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activityIdParam = searchParams.get("activityId")?.trim();
    const statusParam = searchParams.get("status")?.trim();

    // 1. Cargar actividades
    const allActivities = await Activity.find({}).lean();
    const activityMap = new Map<string, (typeof allActivities)[0]>();
    for (const act of allActivities) {
      activityMap.set(String(act._id), act);
      activityMap.set(act.slug, act);
    }

    let specificActivity: (typeof allActivities)[0] | null = null;
    if (activityIdParam) {
      specificActivity =
        allActivities.find((a) => String(a._id) === activityIdParam || a.slug === activityIdParam) || null;
      if (!specificActivity) {
        return Response.json({ error: "Actividad no encontrada" }, { status: 404 });
      }
    }

    // 2. Configuración unificada para etiquetas de customFields globales
    const unifiedConfig = await getUnifiedActivityFormConfig();
    const globalFields = unifiedConfig.globalCustomFields || [];

    // 3. Consultar ActivityRegistration y ActivityApplication según filtros
    type ActivityRegDoc = Awaited<ReturnType<typeof ActivityRegistration.find>>[0];
    type ActivityAppDoc = Awaited<ReturnType<typeof ActivityApplication.find>>[0];

    let registrations: ActivityRegDoc[] = [];
    let applications: ActivityAppDoc[] = [];

    if (specificActivity) {
      if (specificActivity.type === "activity") {
        const appFilter: Record<string, unknown> = {
          assignedActivityId: specificActivity._id,
        };
        if (statusParam && statusParam !== "all") {
          appFilter.status = statusParam;
        } else if (!statusParam) {
          appFilter.status = "assigned";
        }
        applications = await ActivityApplication.find(appFilter).sort({ createdAt: -1 }).lean();
      } else {
        const regFilter: Record<string, unknown> = {
          activityId: specificActivity._id,
        };
        if (statusParam && statusParam !== "all") {
          regFilter.status = statusParam;
        }
        registrations = await ActivityRegistration.find(regFilter).sort({ createdAt: -1 }).lean();
      }
    } else {
      // Exportación global de todas las actividades y workshops
      const regFilter: Record<string, unknown> = {};
      if (statusParam && statusParam !== "all") {
        regFilter.status = statusParam;
      }
      registrations = await ActivityRegistration.find(regFilter).sort({ createdAt: -1 }).lean();

      const appFilter: Record<string, unknown> = {
        assignedActivityId: { $ne: null },
      };
      if (statusParam && statusParam !== "all") {
        appFilter.status = statusParam;
      } else if (!statusParam) {
        appFilter.status = "assigned";
      }
      applications = await ActivityApplication.find(appFilter).sort({ createdAt: -1 }).lean();
    }

    // 4. Cargar perfiles de registro general asociados
    const generalRegIds = Array.from(
      new Set(
        [
          ...registrations.map((r) => r.registrationId?.toString()),
          ...applications.map((a) => a.registrationId?.toString()),
        ].filter(Boolean),
      ),
    );

    const generalRegs: IRegistration[] =
      generalRegIds.length > 0
        ? await Registration.find({ _id: { $in: generalRegIds } }).lean()
        : [];
    const generalRegMap = new Map<string, IRegistration>();
    for (const gr of generalRegs) {
      generalRegMap.set(String(gr._id), gr);
    }

    // 5. Construir filas de exportación
    const exportRows: ExportRow[] = [];

    // Fila desde ActivityRegistration (Workshops y Hackatones)
    for (const r of registrations) {
      const act = activityMap.get(String(r.activityId)) || activityMap.get(r.activitySlug);
      const genReg = r.registrationId ? generalRegMap.get(String(r.registrationId)) : undefined;

      const actType = formatActivityType(act?.type || r.activityType);
      const actTitle = act?.title || r.activitySlug || "Workshop / Hackatón";
      const schedule =
        act?.startTime && act?.endTime ? `${act.startTime} - ${act.endTime}` : "";
      const room = act?.roomName || "";
      const speaker = act?.speakerName || "";
      const level = act?.level ? `Nivel ${act.level}` : "";
      const customStr = formatCustomAnswers(
        r.customAnswers as Record<string, unknown>,
        act?.formConfig?.customFields,
      );

      exportRows.push({
        tipoActividad: actType,
        actividad: actTitle,
        horario: schedule,
        salon: room,
        speaker,
        nivel,
        estado: formatStatus(r.status),
        nombre: r.firstName || genReg?.firstName || "",
        apellido: r.lastName || genReg?.lastName || "",
        correo: r.email || genReg?.email || "",
        qrCode: r.qrCode || genReg?.qrCode || "",
        modalidadGeneral: genReg ? attendanceLabelOf(genReg.attendance) : "",
        tipoDocumento: genReg?.documentType ? docTypeLabelOf(genReg.documentType) : "",
        numDocumento: genReg?.documentNumber || "",
        rol: genReg ? roleLabelOf(genReg.role, genReg.roleOther) : "",
        tipoEntidad: genReg?.entityType ? entityLabelOf(genReg.entityType) : "",
        entidad: genReg?.entityName || "",
        perteneceComunidad: genReg ? (genReg.fromCommunity ? "Sí" : "No") : "",
        comunidad: genReg?.communityName || "",
        llevaLaptop: r.logistics?.bringsLaptop ? "Sí" : "No",
        aceptoPrerrequisitos: r.logistics?.acceptedPrerequisites ? "Sí" : "No",
        modalidadParticipacion: r.team?.isTeam ? "En equipo" : "Individual",
        nombreEquipo: r.team?.teamName || "",
        rolEquipo: r.team?.roleInTeam || (r.team?.isTeam ? "Líder" : ""),
        integrantesEquipo: formatTeamMembers(r.team?.members),
        lugaresOcupados: String(r.spotsConsumed || 1),
        prioridadAsignada: "-",
        respuestasPersonalizadas: customStr,
        asistio: r.attended ? "Sí" : "No",
        fechaAsistencia: formatDate(r.attendedAt),
        fechaInscripcion: formatDate(r.createdAt),
        idRegistro: String(r._id),
      });
    }

    // Fila desde ActivityApplication (Actividades Dinámicas Asignadas)
    for (const a of applications) {
      const act = a.assignedActivityId
        ? activityMap.get(String(a.assignedActivityId)) ||
          (a.assignedActivitySlug ? activityMap.get(a.assignedActivitySlug) : undefined)
        : undefined;
      const genReg = a.registrationId ? generalRegMap.get(String(a.registrationId)) : undefined;

      const actType = formatActivityType(act?.type || "activity");
      const actTitle = act?.title || a.assignedActivitySlug || "Actividad";
      const schedule =
        act?.startTime && act?.endTime ? `${act.startTime} - ${act.endTime}` : "";
      const room = act?.roomName || "";
      const speaker = act?.speakerName || "";
      const level = act?.level ? `Nivel ${act.level}` : "";

      const globalCustomStr = formatCustomAnswers(
        a.globalCustomAnswers as Record<string, unknown>,
        globalFields,
      );

      const actAnswers = a.assignedActivityId
        ? a.activityCustomAnswers?.[String(a.assignedActivityId)] ||
          (a.assignedActivitySlug ? a.activityCustomAnswers?.[a.assignedActivitySlug] : undefined)
        : undefined;

      const actCustomStr = formatCustomAnswers(
        actAnswers as Record<string, unknown>,
        act?.formConfig?.customFields,
      );

      const combinedCustom = [globalCustomStr, actCustomStr].filter(Boolean).join(" | ");

      const assignedPriority =
        typeof a.assignedPriorityRank === "number" && a.assignedPriorityRank > 0
          ? `${a.assignedPriorityRank}ª opción`
          : a.assignedActivityId
            ? "Asignado"
            : "-";

      exportRows.push({
        tipoActividad: actType,
        actividad: actTitle,
        horario: schedule,
        salon: room,
        speaker,
        nivel,
        estado: formatStatus(a.status),
        nombre: a.firstName || genReg?.firstName || "",
        apellido: a.lastName || genReg?.lastName || "",
        correo: a.email || genReg?.email || "",
        qrCode: a.qrCode || genReg?.qrCode || "",
        modalidadGeneral: genReg ? attendanceLabelOf(genReg.attendance) : "",
        tipoDocumento: genReg?.documentType ? docTypeLabelOf(genReg.documentType) : "",
        numDocumento: genReg?.documentNumber || "",
        rol: genReg ? roleLabelOf(genReg.role, genReg.roleOther) : "",
        tipoEntidad: genReg?.entityType ? entityLabelOf(genReg.entityType) : "",
        entidad: genReg?.entityName || "",
        perteneceComunidad: genReg ? (genReg.fromCommunity ? "Sí" : "No") : "",
        comunidad: genReg?.communityName || "",
        llevaLaptop: a.logistics?.bringsLaptop ? "Sí" : "No",
        aceptoPrerrequisitos: a.logistics?.acceptedPrerequisites ? "Sí" : "No",
        modalidadParticipacion: "Individual",
        nombreEquipo: "",
        rolEquipo: "",
        integrantesEquipo: "",
        lugaresOcupados: "1",
        prioridadAsignada: assignedPriority,
        respuestasPersonalizadas: combinedCustom,
        asistio: a.attended ? "Sí" : "No",
        fechaAsistencia: formatDate(a.attendedAt),
        fechaInscripcion: formatDate(a.assignedAt || a.createdAt),
        idRegistro: String(a._id),
      });
    }

    // 6. Orden coherente:
    // Primero por Nombre de la Actividad / Horario
    // Luego estado (Confirmado / Asignado antes de Cancelado)
    // Luego Apellido y Nombre
    exportRows.sort((x, y) => {
      const actDiff = x.actividad.localeCompare(y.actividad, "es", { sensitivity: "base" });
      if (actDiff !== 0) return actDiff;

      const statusWeight = (s: string) => (s === "Cancelado" ? 2 : 1);
      const statusDiff = statusWeight(x.estado) - statusWeight(y.estado);
      if (statusDiff !== 0) return statusDiff;

      const lastDiff = x.apellido.localeCompare(y.apellido, "es", { sensitivity: "base" });
      if (lastDiff !== 0) return lastDiff;

      return x.nombre.localeCompare(y.nombre, "es", { sensitivity: "base" });
    });

    // 7. Generar CSV
    const headerLine = HEADERS.map(escapeCsv).join(",");
    const dataLines = exportRows.map((row) =>
      [
        row.tipoActividad,
        row.actividad,
        row.horario,
        row.salon,
        row.speaker,
        row.nivel,
        row.estado,
        row.nombre,
        row.apellido,
        row.correo,
        row.qrCode,
        row.modalidadGeneral,
        row.tipoDocumento,
        row.numDocumento,
        row.rol,
        row.tipoEntidad,
        row.entidad,
        row.perteneceComunidad,
        row.comunidad,
        row.llevaLaptop,
        row.aceptoPrerrequisitos,
        row.modalidadParticipacion,
        row.nombreEquipo,
        row.rolEquipo,
        row.integrantesEquipo,
        row.lugaresOcupados,
        row.prioridadAsignada,
        row.respuestasPersonalizadas,
        row.asistio,
        row.fechaAsistencia,
        row.fechaInscripcion,
        row.idRegistro,
      ]
        .map(escapeCsv)
        .join(","),
    );

    const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");

    const filename = specificActivity
      ? `inscritos-${specificActivity.slug || "actividad"}.csv`
      : "inscritos-actividades-workshops-aws-scd.csv";

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error al exportar inscritos" }, { status: 500 });
  }
}
