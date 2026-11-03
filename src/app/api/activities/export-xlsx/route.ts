import ExcelJS from "exceljs";
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

const TZ = "America/Mexico_City";

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", { timeZone: TZ, hour12: false });
}

function yn(v: unknown): string {
  return v ? "Sí" : "No";
}

function typeLabel(t: string | undefined): string {
  if (t === "workshop") return "Workshop";
  if (t === "hackathon") return "Hackatón";
  if (t === "activity") return "Actividad especial";
  return t || "";
}

function statusLabel(s: string): string {
  if (s === "registered") return "Confirmado";
  if (s === "assigned") return "Asignado";
  if (s === "cancelled") return "Cancelado";
  if (s === "pending") return "Pendiente";
  return s;
}

function teamMembers(members: ITeamMember[] | undefined): string {
  if (!Array.isArray(members) || members.length === 0) return "";
  return members
    .map((m) => {
      const name = `${m.firstName || ""} ${m.lastName || ""}`.trim();
      return `${name} <${m.email}>${m.roleInTeam ? ` - ${m.roleInTeam}` : ""}`;
    })
    .join("\n");
}

function answersToMap(
  answers: unknown,
  fields: ICustomField[] | undefined,
): Map<string, string> {
  const out = new Map<string, string>();
  if (!answers || typeof answers !== "object") return out;
  const fieldMap = new Map((fields || []).map((f) => [f.key, f]));
  for (const [key, val] of Object.entries(answers as Record<string, unknown>)) {
    if (val === null || val === undefined || val === "") continue;
    const field = fieldMap.get(key);
    let display: string;
    if (typeof val === "boolean") display = val ? "Sí" : "No";
    else if (field?.options && typeof val === "string")
      display = field.options.find((o) => o.value === val)?.label || val;
    else if (Array.isArray(val)) display = val.join(", ");
    else display = String(val);
    out.set(field?.label || key, display);
  }
  return out;
}

function mapToText(m: Map<string, string>): string {
  return Array.from(m.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

interface Col {
  header: string;
  width: number;
}

function buildSheet(
  wb: ExcelJS.Workbook,
  name: string,
  tabColor: string,
  cols: Col[],
  rows: (string | number)[][],
) {
  const ws = wb.addWorksheet(name, {
    properties: { tabColor: { argb: tabColor } },
    views: [{ state: "frozen", ySplit: 1, xSplit: 3 }],
  });
  ws.columns = cols.map((c) => ({ header: c.header, width: c.width }));
  const header = ws.getRow(1);
  header.height = 32;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF232F3E" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: "FFFF9900" } } };
  });
  rows.forEach((r, i) => {
    const row = ws.addRow(r);
    row.alignment = { vertical: "top", wrapText: true };
    if (i % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F6F8" } };
      });
    }
  });
  if (rows.length > 0) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  }
  return ws;
}

export async function GET() {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();

    const activities = await Activity.find({}).lean();
    const actById = new Map(activities.map((a) => [String(a._id), a]));
    const actBySlug = new Map(activities.map((a) => [a.slug, a]));
    const unified = await getUnifiedActivityFormConfig();
    const globalFields = unified.globalCustomFields || [];

    const [regs, apps] = await Promise.all([
      ActivityRegistration.find({}).lean(),
      ActivityApplication.find({}).lean(),
    ]);

    const genIds = Array.from(
      new Set(
        [...regs, ...apps].map((r) => r.registrationId?.toString()).filter(Boolean) as string[],
      ),
    );
    const genRegs: IRegistration[] = genIds.length
      ? await Registration.find({ _id: { $in: genIds } }).lean()
      : [];
    const genMap = new Map(genRegs.map((g) => [String(g._id), g]));

    const profile = (g: IRegistration | undefined) => [
      g ? attendanceLabelOf(g.attendance) : "",
      g?.documentType ? docTypeLabelOf(g.documentType) : "",
      g?.documentNumber || "",
      g ? roleLabelOf(g.role, g.roleOther) : "",
      g?.entityType ? entityLabelOf(g.entityType) : "",
      g?.entityName || "",
      g ? yn(g.fromCommunity) : "",
      g?.communityName || "",
    ];
    const profileCols: Col[] = [
      { header: "Modalidad evento general", width: 16 },
      { header: "Tipo de documento", width: 14 },
      { header: "Número de documento", width: 18 },
      { header: "Rol / Perfil", width: 18 },
      { header: "Tipo de entidad", width: 16 },
      { header: "Institución / Empresa", width: 28 },
      { header: "Pertenece a comunidad", width: 12 },
      { header: "Comunidad", width: 22 },
    ];

    // ── Hoja 1: Workshops / Hackatones ──
    const wsRows = regs
      .map((r) => {
        const act = actById.get(String(r.activityId)) || actBySlug.get(r.activitySlug);
        const g = r.registrationId ? genMap.get(String(r.registrationId)) : undefined;
        const custom = mapToText(answersToMap(r.customAnswers, act?.formConfig?.customFields));
        return {
          sortKey: [act?.title || r.activitySlug || "", r.lastName || g?.lastName || ""],
          cells: [
            act?.title || r.activitySlug || "",
            typeLabel(act?.type || r.activityType),
            statusLabel(r.status),
            r.firstName || g?.firstName || "",
            r.lastName || g?.lastName || "",
            r.email || g?.email || "",
            act?.startTime && act?.endTime ? `${act.startTime} - ${act.endTime}` : "",
            act?.roomName || "",
            act?.speakerName || "",
            act?.level ? `Nivel ${act.level}` : "",
            yn(r.logistics?.bringsLaptop),
            yn(r.logistics?.acceptedPrerequisites),
            r.team?.isTeam ? "En equipo" : "Individual",
            r.team?.teamName || "",
            r.team?.roleInTeam || (r.team?.isTeam ? "Líder" : ""),
            teamMembers(r.team?.members),
            r.spotsConsumed || 1,
            custom,
            ...profile(g),
            yn(r.attended),
            fmtDate(r.attendedAt),
            fmtDate(r.createdAt),
            r.qrCode || g?.qrCode || "",
          ] as (string | number)[],
        };
      })
      .sort(
        (a, b) =>
          a.sortKey[0].localeCompare(b.sortKey[0], "es", { sensitivity: "base" }) ||
          a.sortKey[1].localeCompare(b.sortKey[1], "es", { sensitivity: "base" }),
      )
      .map((x) => x.cells);

    const wsCols: Col[] = [
      { header: "Workshop / Actividad", width: 34 },
      { header: "Tipo", width: 12 },
      { header: "Estado", width: 12 },
      { header: "Nombre", width: 18 },
      { header: "Apellido", width: 20 },
      { header: "Correo electrónico", width: 32 },
      { header: "Horario", width: 14 },
      { header: "Salón", width: 18 },
      { header: "Instructor", width: 22 },
      { header: "Nivel", width: 10 },
      { header: "Lleva laptop", width: 10 },
      { header: "Aceptó prerrequisitos", width: 12 },
      { header: "Participación", width: 13 },
      { header: "Equipo", width: 20 },
      { header: "Rol en equipo", width: 14 },
      { header: "Integrantes del equipo", width: 40 },
      { header: "Lugares ocupados", width: 10 },
      { header: "Respuestas personalizadas", width: 40 },
      ...profileCols,
      { header: "Asistió", width: 9 },
      { header: "Fecha de asistencia", width: 20 },
      { header: "Fecha de inscripción", width: 20 },
      { header: "Código QR", width: 16 },
    ];

    // ── Hoja 2: Postulaciones a actividades especiales ──
    const maxPriorities = Math.max(1, ...apps.map((a) => a.priorities?.length || 0));
    const appRows = apps
      .map((a) => {
        const g = a.registrationId ? genMap.get(String(a.registrationId)) : undefined;
        const assigned = a.assignedActivityId
          ? actById.get(String(a.assignedActivityId)) ||
            (a.assignedActivitySlug ? actBySlug.get(a.assignedActivitySlug) : undefined)
          : undefined;
        const sorted = [...(a.priorities || [])].sort((x, y) => x.priority - y.priority);
        const prefCells: string[] = [];
        for (let i = 0; i < maxPriorities; i++) {
          const p = sorted[i];
          prefCells.push(p ? `${p.activityTitle} (${p.startTime}-${p.endTime})` : "");
        }

        const globalMap = answersToMap(a.globalCustomAnswers, globalFields);
        const perActivity: string[] = [];
        const acaRaw = (a.activityCustomAnswers || {}) as Record<string, unknown>;
        for (const [key, val] of Object.entries(acaRaw)) {
          const act = actById.get(key) || actBySlug.get(key);
          const text = mapToText(answersToMap(val, act?.formConfig?.customFields));
          if (text) perActivity.push(`[${act?.title || key}]\n${text}`);
        }

        const rank =
          typeof a.assignedPriorityRank === "number" && a.assignedPriorityRank > 0
            ? `${a.assignedPriorityRank}ª opción`
            : a.assignedActivityId
              ? "Asignación manual"
              : "";

        return {
          pending: a.status === "pending" ? 0 : a.status === "assigned" ? 1 : 2,
          last: a.lastName || g?.lastName || "",
          cells: [
            statusLabel(a.status),
            a.firstName || g?.firstName || "",
            a.lastName || g?.lastName || "",
            a.email || g?.email || "",
            ...prefCells,
            assigned?.title || a.assignedActivitySlug || "",
            rank,
            assigned?.startTime && assigned?.endTime
              ? `${assigned.startTime} - ${assigned.endTime}`
              : "",
            assigned?.roomName || "",
            yn(a.logistics?.bringsLaptop),
            yn(a.logistics?.acceptedPrerequisites),
            mapToText(globalMap),
            perActivity.join("\n\n"),
            a.adminNotes || "",
            ...profile(g),
            yn(a.attended),
            fmtDate(a.attendedAt),
            fmtDate(a.createdAt),
            fmtDate(a.assignedAt),
            a.qrCode || g?.qrCode || "",
          ] as (string | number)[],
        };
      })
      .sort((x, y) => x.pending - y.pending || x.last.localeCompare(y.last, "es", { sensitivity: "base" }))
      .map((x) => x.cells);

    const appCols: Col[] = [
      { header: "Estado", width: 12 },
      { header: "Nombre", width: 18 },
      { header: "Apellido", width: 20 },
      { header: "Correo electrónico", width: 32 },
      ...Array.from({ length: maxPriorities }, (_, i) => ({
        header: `Preferencia ${i + 1}`,
        width: 34,
      })),
      { header: "Actividad asignada", width: 32 },
      { header: "Preferencia cumplida", width: 16 },
      { header: "Horario asignado", width: 14 },
      { header: "Salón asignado", width: 18 },
      { header: "Lleva laptop", width: 10 },
      { header: "Aceptó prerrequisitos", width: 12 },
      { header: "Respuestas generales", width: 40 },
      { header: "Respuestas por actividad", width: 44 },
      { header: "Notas del admin", width: 28 },
      ...profileCols,
      { header: "Asistió", width: 9 },
      { header: "Fecha de asistencia", width: 20 },
      { header: "Fecha de postulación", width: 20 },
      { header: "Fecha de asignación", width: 20 },
      { header: "Código QR", width: 16 },
    ];

    const wb = new ExcelJS.Workbook();
    wb.creator = "AWS Student Community Day México";
    wb.created = new Date();
    buildSheet(wb, "Workshops", "FFFF9900", wsCols, wsRows);
    buildSheet(wb, "Actividades especiales", "FF232F3E", appCols, appRows);

    const buffer = await wb.xlsx.writeBuffer();
    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="inscritos-y-postulaciones-aws-scd.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error al exportar" }, { status: 500 });
  }
}
