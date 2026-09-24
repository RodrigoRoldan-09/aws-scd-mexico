import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { VolunteerSubmission } from "@/models/volunteer-submission";

// Lista de voluntarios aprobados para certificados (nombre efectivo + estado de envío).
export async function GET() {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const vols = await VolunteerSubmission.find({ approved: true })
      .select("firstName lastName email certName certSentAt")
      .lean();

    const list = vols.map((v) => {
      const rawName = `${v.firstName} ${v.lastName}`.trim();
      return {
        id: String(v._id),
        // `certName` es el override manual: si está, manda sobre el del registro.
        name: (v.certName || rawName).trim(),
        rawName,
        email: v.email,
        certSentAt: v.certSentAt ?? null,
      };
    }).sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

    return Response.json({ volunteers: list });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
