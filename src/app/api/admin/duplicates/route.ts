import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { VolunteerSubmission } from "@/models/volunteer-submission";
// Correos que están a la vez en registros y en solicitudes de voluntario.
export async function GET() {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const [regs, vols] = await Promise.all([
      Registration.find({}).select("firstName lastName email qrCode createdAt").lean(),
      VolunteerSubmission.find({}).select("firstName lastName email submittedAt approved").lean(),
    ]);

    // correo → voluntario (gana el primero)
    const volByEmail = new Map<string, { id: string; name: string; approved: boolean }>();
    for (const v of vols) {
      const email = (v.email ?? "").toLowerCase().trim();
      if (email && !volByEmail.has(email)) {
        volByEmail.set(email, {
          id: String(v._id),
          name: `${v.firstName} ${v.lastName}`.trim() || "—",
          approved: !!v.approved,
        });
      }
    }

    const duplicates: {
      email: string;
      registration: { id: string; name: string };
      volunteer: { id: string; name: string; approved: boolean };
    }[] = [];
    const seen = new Set<string>();

    for (const reg of regs) {
      const email = (reg.email ?? "").toLowerCase().trim();
      if (!email || seen.has(email)) continue;
      const vol = volByEmail.get(email);
      if (vol) {
        seen.add(email);
        duplicates.push({
          email,
          registration: { id: String(reg._id), name: `${reg.firstName} ${reg.lastName}`.trim() || "—" },
          volunteer: vol,
        });
      }
    }

    duplicates.sort((a, b) => a.email.localeCompare(b.email));

    return Response.json({ duplicates });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
