import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { Passport } from "@/models/passport";
import { SponsorPin } from "@/models/sponsor-pin";
import { AgendaEvent } from "@/models/agenda-event";

// Métricas operativas del día del evento (check-ins, comidas, asistencia por
// sesión, badges por sponsor, distribución de pasaporte) + leaderboard (solo admin).
export async function GET() {
  try {
    const actor = await requireAuth(["admin", "organizer"]);
    const isAdmin = actor.role === "admin";
    await connectDB();

    const [
      totalRegistrations,
      totalCheckedIn,
      lunches,
      snacks,
      sessionAgg,
      sponsorAgg,
      distAgg,
      totalBadgesAgg,
      sponsors,
      sessions,
      leaderboard,
    ] = await Promise.all([
      Registration.countDocuments({}),
      Registration.countDocuments({ checkedIn: true }),
      Passport.countDocuments({ "meals.lunch.claimedAt": { $exists: true, $ne: null } }),
      Passport.countDocuments({ "meals.snack.claimedAt": { $exists: true, $ne: null } }),
      // Asistencia por sesión (cuántas escarapelas se escanearon en cada una)
      Passport.aggregate([
        { $unwind: "$sessionAttendance" },
        { $group: { _id: { $toString: "$sessionAttendance.sessionId" }, count: { $sum: 1 } } },
      ]),
      // Recolecciones por sponsor (badges del pasaporte)
      Passport.aggregate([
        { $unwind: "$stamps" },
        { $group: { _id: { $toString: "$stamps.sponsorId" }, name: { $first: "$stamps.sponsorName" }, count: { $sum: 1 } } },
      ]),
      // Distribución: cuántas personas tienen N badges
      Passport.aggregate([
        { $project: { n: { $size: { $ifNull: ["$stamps", []] } } } },
        { $group: { _id: "$n", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Total de badges entregados
      Passport.aggregate([
        { $project: { n: { $size: { $ifNull: ["$stamps", []] } } } },
        { $group: { _id: null, total: { $sum: "$n" } } },
      ]),
      SponsorPin.find({ isActive: true }).select("_id sponsorName").lean<{ _id: unknown; sponsorName: string }[]>(),
      // Solo sesiones con sala física (excluye virtuales)
      AgendaEvent.find({ sessionType: { $ne: "online" } }).select("title room startTime sessionType speakerId").sort({ startTime: 1 }).lean<{ _id: unknown; title?: string; room?: string; startTime?: string }[]>(),
      isAdmin
        ? Passport.aggregate([
            { $match: { "stamps.0": { $exists: true } } },
            {
              $project: {
                firstName: 1, lastName: 1,
                count: { $size: "$stamps" },
                lastStampAt: { $max: "$stamps.stampedAt" },
                firstStampAt: { $min: "$stamps.stampedAt" },
              },
            },
            { $sort: { count: -1, lastStampAt: 1 } },
            { $limit: 20 },
          ])
        : Promise.resolve([]),
    ]);

    // Asistencia por sesión: une el conteo con la lista de sesiones (incluye las de 0)
    const sessionCount = new Map<string, number>();
    for (const s of sessionAgg) sessionCount.set(String(s._id), s.count);
    const sessionAttendance = sessions.map((s) => ({
      title: s.title || "Sesión",
      room: s.room || "",
      startTime: s.startTime || "",
      count: sessionCount.get(String(s._id)) ?? 0,
    }));

    // Badges por sponsor: incluye sponsors activos con 0 recolecciones
    const sponsorCount = new Map<string, number>();
    for (const s of sponsorAgg) sponsorCount.set(String(s._id), s.count);
    const badgesBySponsor = sponsors
      .map((sp) => ({ name: sp.sponsorName, count: sponsorCount.get(String(sp._id)) ?? 0 }))
      .sort((a, b) => b.count - a.count);

    const distribution = distAgg.map((d) => ({ stamps: d._id as number, people: d.count as number }));
    const totalBadges = totalBadgesAgg[0]?.total ?? 0;

    return Response.json({
      isAdmin,
      totalRegistrations,
      totalCheckedIn,
      checkInRate: totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0,
      lunches,
      snacks,
      totalBadges,
      sessionAttendance,
      badgesBySponsor,
      distribution,
      leaderboard: (leaderboard as Array<Record<string, unknown>>).map((p) => ({
        name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Sin nombre",
        count: p.count as number,
        firstStampAt: p.firstStampAt,
        lastStampAt: p.lastStampAt,
      })),
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
