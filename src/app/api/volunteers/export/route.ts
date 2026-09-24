import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import {
  docTypeLabelOf,
  entityLabelOf,
  roleLabelOf,
} from "@/data/attendee-form";
import {
  availabilityLabelOf,
  dietaryLabelOf,
  experienceLabelOf,
  interestAreasLabelOf,
  sbgLabelOf,
  shirtSizeLabelOf,
} from "@/data/volunteer-form";

/**
 * Exportación de voluntarios a CSV. Las columnas son fijas porque el
 * formulario también lo es.
 *
 * Va con etiquetas y no con códigos: esta hoja la abre una persona, y de acá
 * salen el pedido de camisetas y el de alimentación.
 */

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const COLUMNS = [
  "Nombre", "Apellido", "Correo electrónico", "Teléfono",
  "Tipo de documento", "Número de documento",
  "Rol", "Tipo de entidad", "Entidad", "Student Builder Group",
  "Disponibilidad", "Áreas de interés", "Experiencia previa", "Motivación",
  "Talla", "Alimentación",
  "Contacto de emergencia", "Teléfono de emergencia",
  "Aprobado", "Aprobado en", "Certificado enviado", "Enviado en", "ID",
];

export async function GET() {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();

    const submissions = await VolunteerSubmission.find({}).sort({ submittedAt: 1 }).lean();

    const rows = submissions.map((v) =>
      [
        v.firstName,
        v.lastName,
        v.email,
        v.phone,
        docTypeLabelOf(v.documentType),
        v.documentNumber,
        roleLabelOf(v.role, v.roleOther),
        entityLabelOf(v.entityType),
        v.entityName ?? "",
        sbgLabelOf(v.sbg),
        availabilityLabelOf(v.availability),
        interestAreasLabelOf(v.interestAreas ?? []),
        experienceLabelOf(v.previousExperience),
        v.motivation,
        shirtSizeLabelOf(v.shirtSize),
        dietaryLabelOf(v.dietary, v.dietaryOther),
        v.emergencyName,
        v.emergencyPhone,
        v.approved ? "Sí" : "No",
        v.approvedAt ? v.approvedAt.toISOString() : "",
        v.certSentAt ? v.certSentAt.toISOString() : "",
        v.submittedAt ? v.submittedAt.toISOString() : "",
        String(v._id),
      ]
        .map((cell) => escapeCsv(cell ?? ""))
        .join(","),
    );

    const csv = [COLUMNS.map(escapeCsv).join(","), ...rows].join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="voluntarios-aws-scd.csv"`,
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
