import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { SpeakerProfile } from "@/models/speaker-profile";
import { Passport } from "@/models/passport";
import { User } from "@/models/user";

export const dynamic = "force-dynamic";

/**
 * Resumen y búsqueda de la consola.
 *
 * El panel tiene una pantalla por lista y ninguna que las mire juntas, así que
 * para saber dónde está una persona había que buscarla en tres sitios. Acá se
 * busca una vez y se responde en cuál de las listas aparece.
 */

type Row = {
  kind: "attendee" | "volunteer" | "speaker";
  id: string;
  name: string;
  email: string;
  detail: string;
  /**
   * Con qué se dibuja su carita.
   *
   * Los asistentes van con su `qrCode`, que es el `shortId` de su pasaporte:
   * así la cara del panel es la misma que la persona ve en su cartilla. Los
   * demás, con el correo.
   */
  seed: string;
  /** Foto real, si la subió (speakers). */
  photo?: string;
};

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

    // ── Resumen ──
    const [
      attendees, inPerson, online, checkedIn, confirmed,
      volunteers, volunteersApproved,
      speakers, speakersAccepted,
      passports, users,
    ] = await Promise.all([
      Registration.countDocuments({}),
      Registration.countDocuments({ attendance: "in-person" }),
      Registration.countDocuments({ attendance: "online" }),
      Registration.countDocuments({ checkedIn: true }),
      Registration.countDocuments({ "confirmation.confirmed": true }),
      VolunteerSubmission.countDocuments({}),
      VolunteerSubmission.countDocuments({ approved: true }),
      SpeakerProfile.countDocuments({}),
      SpeakerProfile.countDocuments({ status: "accepted" }),
      Passport.countDocuments({}),
      User.countDocuments({}),
    ]);

    const summary = {
      attendees, inPerson, online, checkedIn, confirmed,
      volunteers, volunteersApproved,
      speakers, speakersAccepted,
      passports, users,
    };

    if (!q) return Response.json({ summary, results: [] });

    // ── Búsqueda ──
    // Se escapa lo que llega: sin esto, un punto o un paréntesis en el texto
    // cambiarían la expresión y devolverían cualquier cosa.
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = { $regex: safe, $options: "i" };

    const [regs, vols, spks] = await Promise.all([
      Registration.find({
        $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { documentNumber: rx }, { qrCode: rx }],
      }).select("firstName lastName email attendance checkedIn qrCode").limit(15).lean(),
      VolunteerSubmission.find({
        $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { documentNumber: rx }],
      }).select("firstName lastName email approved").limit(15).lean(),
      SpeakerProfile.find({
        $or: [{ name: rx }, { firstName: rx }, { lastName: rx }, { email: rx }],
      }).select("name email status photo").limit(15).lean(),
    ]);

    const results: Row[] = [
      ...regs.map((r) => ({
        kind: "attendee" as const,
        id: String(r._id),
        name: `${r.firstName} ${r.lastName}`.trim(),
        email: r.email,
        detail: `${r.attendance === "online" ? "Online" : "Presencial"}${r.checkedIn ? " · con check-in" : ""}`,
        seed: r.qrCode,
      })),
      ...vols.map((v) => ({
        kind: "volunteer" as const,
        id: String(v._id),
        name: `${v.firstName} ${v.lastName}`.trim(),
        email: v.email,
        detail: v.approved ? "Aprobado" : "Pendiente",
        seed: v.email,
      })),
      ...spks.map((s) => ({
        kind: "speaker" as const,
        id: String(s._id),
        name: s.name,
        email: s.email,
        detail: s.status,
        seed: s.email,
        photo: s.photo || undefined,
      })),
    ];

    return Response.json({ summary, results });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    return Response.json({ error: msg }, { status: 403 });
  }
}
