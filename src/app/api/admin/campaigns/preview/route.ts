import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { SpeakerProfile } from "@/models/speaker-profile";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { BROAD_CAMPAIGN_TYPES, gatherRecipientsForType } from "@/lib/campaign-audience";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { type } = await request.json() as { type: string };
    if (!type) return NextResponse.json({ error: "type requerido" }, { status: 400 });

    await connectDB();

    // Reminders + keynotes → broad audience; reminder_5d = confirmed only;
    // reminder_5d_unconfirmed = registrants who haven't confirmed (handled by the helper).
    if (BROAD_CAMPAIGN_TYPES.has(type) || type === "reminder_5d_unconfirmed" || type === "resilience_message" || type === "post_survey") {
      const recipients = await gatherRecipientsForType(type);
      return NextResponse.json({
        pendingCount: recipients.length,
        sampleNames: recipients.slice(0, 5).map((r) => r.name || "Sin nombre"),
      });
    }

    if (type === "confirm_reminder") {
      const query = {
        "confirmation.confirmed": { $ne: true },
        sentCampaigns: { $nin: ["confirm_reminder"] },
      };
      const pendingCount = await Registration.countDocuments(query);
      const pending = await Registration.find(query).limit(5).lean();
      const sampleNames = pending.map((r) => `${r.firstName} ${r.lastName}`.trim() || "Sin nombre");
      return NextResponse.json({ pendingCount, sampleNames });
    }

    // Último llamado: TODOS los no confirmados (sin dedup → re-enviable)
    if (type === "confirm_final") {
      const query = { "confirmation.confirmed": { $ne: true } };
      const pendingCount = await Registration.countDocuments(query);
      const pending = await Registration.find(query).limit(5).lean();
      const sampleNames = pending.map((r) => `${r.firstName} ${r.lastName}`.trim() || "Sin nombre");
      return NextResponse.json({ pendingCount, sampleNames });
    }

    // Recogida anticipada: solo confirmados que aún no lo han recibido
    if (type === "badge_pickup") {
      const query = { "confirmation.confirmed": true, sentCampaigns: { $nin: ["badge_pickup"] } };
      const pendingCount = await Registration.countDocuments(query);
      const pending = await Registration.find(query).limit(5).lean();
      const sampleNames = pending.map((r) => `${r.firstName} ${r.lastName}`.trim() || "Sin nombre");
      return NextResponse.json({ pendingCount, sampleNames });
    }

    if (type === "speaker_slides" || type === "speaker_rejection" || type === "speaker_upload") {
      const status = type === "speaker_rejection" ? "rejected" : "accepted";
      const pending = await SpeakerProfile.find({
        status,
        sentSpeakerCampaigns: { $nin: [type] },
      }).limit(5).lean();

      const pendingCount = await SpeakerProfile.countDocuments({
        status,
        sentSpeakerCampaigns: { $nin: [type] },
      });

      const sampleNames = pending.map((s) => s.name || "Sin nombre");

      return NextResponse.json({ pendingCount, sampleNames });
    }

    if (type === "volunteer_meeting" || type === "volunteer_meeting_today" || type === "volunteer_recording" || type === "volunteer_setup") {
      const pending = await VolunteerSubmission.find({
        approved: true,
        sentVolunteerCampaigns: { $nin: [type] },
      }).limit(5).lean();

      const pendingCount = await VolunteerSubmission.countDocuments({
        approved: true,
        sentVolunteerCampaigns: { $nin: [type] },
      });

      const sampleNames = pending.map(
        (s) => `${s.firstName} ${s.lastName}`.trim() || "Sin nombre",
      );

      return NextResponse.json({ pendingCount, sampleNames });
    }

    const pending = await Registration.find({ sentCampaigns: { $nin: [type] } })
      .limit(5)
      .lean();

    const pendingCount = await Registration.countDocuments({ sentCampaigns: { $nin: [type] } });

    const sampleNames = pending.map((r) => `${r.firstName} ${r.lastName}`.trim() || "Sin nombre");

    return NextResponse.json({ pendingCount, sampleNames });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
