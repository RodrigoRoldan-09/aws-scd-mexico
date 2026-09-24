import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SurveyRecipient } from "@/models/survey-recipient";

// Seguimiento de la encuesta: quién recibió el correo y quién dio clic (abrió la encuesta).
export async function GET() {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const docs = await SurveyRecipient.find({})
      .select("name roleLabel clickedAt clickCount lastSentAt")
      .sort({ clickedAt: -1, name: 1 })
      .lean<{ name: string; roleLabel: string; clickedAt: Date | null; clickCount: number; lastSentAt: Date | null }[]>();

    const sent = docs.length;
    const clicked = docs.filter((d) => d.clickedAt).length;

    return Response.json({
      sent,
      clicked,
      list: docs.map((d) => ({
        name: d.name || "(sin nombre)",
        roleLabel: d.roleLabel || "Asistente",
        clicked: !!d.clickedAt,
        clickedAt: d.clickedAt,
      })),
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
