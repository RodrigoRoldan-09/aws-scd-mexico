import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { SpeakerProfile } from "@/models/speaker-profile";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { User } from "@/models/user";

const ONLINE_MODES = ["online", "virtual"];
const CONFIRMED_PROFILE_STATUSES = ["accepted", "scheduled"];

export async function GET() {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();

    const [
      totalRegistrations,
      totalSpeakers,
      totalVolunteers,
      volunteersApproved,
      registrationsConfirmed,
      totalCheckedIn,
      emailsSent,
      emailsFailed,
      emailsPending,
      registrationsByDay,
      speakersByDay,
      volunteersByDay,
      checkInsByDay,
      cloudClubBreakdown,
      speakerStatusAgg,
      speakerModalityAgg,
      teamAgg,
    ] = await Promise.all([
      Registration.countDocuments({}),
      SpeakerProfile.countDocuments({}),
      VolunteerSubmission.countDocuments({}),
      VolunteerSubmission.countDocuments({ approved: true }),
      Registration.countDocuments({ "confirmation.confirmed": true }),
      Registration.countDocuments({ checkedIn: true }),
      Registration.countDocuments({ emailStatus: "sent" }),
      Registration.countDocuments({ emailStatus: "failed" }),
      Registration.countDocuments({ emailStatus: "pending" }),
      Registration.aggregate([
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      SpeakerProfile.aggregate([
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      VolunteerSubmission.aggregate([
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Registration.aggregate([
        { $match: { checkedIn: true, checkedInAt: { $ne: null } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkedInAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      VolunteerSubmission.aggregate([
        // `none` es "no pertenezco a ninguno": cuenta como sin grupo.
        { $match: { sbg: { $nin: [null, "", "none"] } } },
        { $group: { _id: "$sbg", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Embudo de estados de las postulaciones
      SpeakerProfile.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Speakers confirmados por modalidad, contando personas (principal + co-speakers)
      SpeakerProfile.aggregate([
        { $match: { status: { $in: CONFIRMED_PROFILE_STATUSES } } },
        {
          $group: {
            _id: { $cond: [{ $in: ["$sessionType", ONLINE_MODES] }, "online", "presencial"] },
            profiles: { $sum: 1 },
            people: { $sum: { $add: [1, { $size: { $ifNull: ["$coSpeakers", []] } }] } },
          },
        },
      ]),
      // Team members in the users collection by role
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
    ]);

    // ── Speaker status funnel ──
    const statusMap: Record<string, number> = {};
    for (const s of speakerStatusAgg) statusMap[s._id ?? "unknown"] = s.count;
    const speakerFunnel = {
      submitted: statusMap.submitted ?? 0,
      reviewing: statusMap.reviewing ?? 0,
      accepted: statusMap.accepted ?? 0,
      waitlisted: statusMap.waitlisted ?? 0,
      rejected: statusMap.rejected ?? 0,
    };

    // ── Speaker modality (accepted only) ──
    const modPresencial = speakerModalityAgg.find((m) => m._id === "presencial");
    const modOnline = speakerModalityAgg.find((m) => m._id === "online");
    const speakersPresencialProfiles = modPresencial?.profiles ?? 0;
    const speakersPresencialPeople = modPresencial?.people ?? 0;
    const speakersOnlineProfiles = modOnline?.profiles ?? 0;
    const speakersOnlinePeople = modOnline?.people ?? 0;

    // ── Team breakdown ──
    const teamMap: Record<string, number> = {};
    for (const t of teamAgg) teamMap[t._id ?? "unknown"] = t.count;
    const team = {
      admin: teamMap.admin ?? 0,
      organizer: teamMap.organizer ?? 0,
      volunteer: teamMap.volunteer ?? 0,
      total: (teamMap.admin ?? 0) + (teamMap.organizer ?? 0) + (teamMap.volunteer ?? 0),
    };

    // ── Total expected headcount — registrations + presencial speakers + volunteers + team.
    // Registrations are included but don't guarantee attendance (flagged separately in the UI).
    const confirmedTotal =
      totalRegistrations +
      speakersPresencialPeople +
      volunteersApproved +
      team.total;

    return Response.json({
      totalRegistrations,
      registrationsConfirmed,
      totalSpeakers,
      totalVolunteers,
      totalCheckedIn,
      checkInRate: totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0,
      emailsSent,
      emailsFailed,
      emailsPending,
      registrationsByDay: registrationsByDay.map((d) => ({ date: d._id, count: d.count })),
      speakersByDay: speakersByDay.map((d) => ({ date: d._id, count: d.count })),
      volunteersByDay: volunteersByDay.map((d) => ({ date: d._id, count: d.count })),
      checkInsByDay: checkInsByDay.map((d) => ({ date: d._id, count: d.count })),
      cloudClubBreakdown: cloudClubBreakdown.map((d) => ({ club: d._id, count: d.count })),

      // ── Confirmed headcount — excludes registrations ──
      confirmed: {
        total: confirmedTotal,
        speakersPresencial: speakersPresencialPeople,
        volunteersApproved,
        team: team.total,
        // Registered attendees: expected audience, NOT guaranteed (kept separate)
        registrations: totalRegistrations,
      },

      // ── Detailed breakdowns ──
      speakerFunnel,
      speakerModality: {
        presencialProfiles: speakersPresencialProfiles,
        presencialPeople: speakersPresencialPeople,
        onlineProfiles: speakersOnlineProfiles,
        onlinePeople: speakersOnlinePeople,
      },
      volunteerFunnel: {
        approved: volunteersApproved,
        pending: Math.max(0, totalVolunteers - volunteersApproved),
        total: totalVolunteers,
      },
      team,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
