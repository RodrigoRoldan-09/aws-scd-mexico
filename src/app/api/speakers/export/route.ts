import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SpeakerProfile } from "@/models/speaker-profile";

/**
 * Exportación de postulaciones de speaker a CSV. Las columnas son fijas porque
 * el formulario también lo es.
 */

// Separamos las columnas con punto y coma en vez de coma: las descripciones de
// los speakers suelen traer comas en el texto, y con coma como delimitador la
// planilla no distingue el texto de la separación de columnas. Por eso el
// escapado entrecomilla las celdas que contengan ";" (el delimitador); las
// comas dentro de una celda ya no la parten y no necesitan comillas.
const DELIMITER = ";";

function escapeCsv(value: string): string {
  if (value.includes(DELIMITER) || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Recibida",
  reviewing: "En revisión",
  accepted: "Aceptada",
  rejected: "Rechazada",
  waitlisted: "En lista de espera",
  scheduled: "Agendada",
};

const COLUMNS = [
  "Nombre", "Apellido", "Correo electrónico", "Teléfono", "Ciudad y país",
  "Cargo", "Empresa", "Primera vez como speaker",
  "Título de la charla", "Resumen", "Tipo de sesión", "Nivel", "Idioma",
  "Requerimientos", "Co-speakers",
  "LinkedIn", "GitHub", "Builder Center", "Sitio web",
  "Estado", "Aprobado", "Aprobado en", "Aprobado por", "Enviado en", "ID",
];

export async function GET() {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();

    // Un documento por speaker: los datos y el estado del trámite juntos.
    const speakers = await SpeakerProfile.find({}).sort({ submittedAt: 1 }).lean();

    const rows = speakers.map((p) => {
      const sub = p;
      const coSpeakers = (p?.coSpeakers ?? [])
        .map((c) => `${c.firstName} ${c.lastName}`.trim())
        .filter(Boolean)
        .join(" · ");

      return [
        p?.firstName ?? "",
        p?.lastName ?? "",
        p?.email ?? "",
        p?.phone ?? "",
        p?.countryCity ?? "",
        p?.role ?? "",
        p?.company ?? "",
        p?.firstTimeSpeaker ? "Sí" : "No",
        p?.talkTitle ?? "",
        p?.talkAbstract ?? "",
        p?.sessionType ?? "",
        p?.audienceLevel ?? "",
        p?.language ?? "",
        p?.requirements ?? "",
        coSpeakers,
        p?.social?.linkedin ?? "",
        p?.social?.github ?? "",
        p?.social?.builderCenter ?? "",
        p?.social?.website ?? "",
        STATUS_LABELS[sub.status] ?? sub.status,
        sub.status === "accepted" ? "Sí" : "No",
        sub.approvedAt ? sub.approvedAt.toISOString() : "",
        sub.approvedBy ?? "",
        sub.submittedAt ? sub.submittedAt.toISOString() : "",
        String(sub._id),
      ].map(escapeCsv).join(DELIMITER);
    });

    const csv = [COLUMNS.map(escapeCsv).join(DELIMITER), ...rows].join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="speakers-aws-scd.csv"`,
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
