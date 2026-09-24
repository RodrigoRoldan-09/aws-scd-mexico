import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { generateVolunteerCertificate } from "@/lib/pdf/certificate";

// Certificado en PDF (inline, para previsualizar en el iframe del admin).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["admin"]);
    const { id } = await params;
    await connectDB();

    const vol = await VolunteerSubmission.findById(id).select("firstName lastName certName").lean();
    if (!vol) return Response.json({ error: "No encontrado" }, { status: 404 });

    const name = (vol.certName || `${vol.firstName} ${vol.lastName}` || "Volunteer").trim();

    const pdf = await generateVolunteerCertificate(name);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
