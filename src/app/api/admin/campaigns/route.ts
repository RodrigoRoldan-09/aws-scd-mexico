import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Campaign, type CampaignType } from "@/models/campaign";
import { SpeakerProfile } from "@/models/speaker-profile";
import { Registration } from "@/models/registration";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { BROAD_CAMPAIGN_TYPES, gatherRecipientsForType } from "@/lib/campaign-audience";

// Registration-only campaigns (count = registrations that haven't received it yet).
const REGISTRATION_CAMPAIGN_TYPES: CampaignType[] = [
  "day_of",
  "confirm_attendance",
];

export async function GET() {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();

    const pendingCounts: Record<string, number> = {};
    await Promise.all([
      // Broad audience + the 5-day split (reminder_5d = confirmed + guests). The shared
      // helper applies the right per-type filtering so counts match what send dispatches.
      ...[...BROAD_CAMPAIGN_TYPES].map(async (type) => {
        pendingCounts[type] = (await gatherRecipientsForType(type)).length;
      }),
      (async () => {
        pendingCounts["reminder_5d_unconfirmed"] = (await gatherRecipientsForType("reminder_5d_unconfirmed")).length;
      })(),
      ...REGISTRATION_CAMPAIGN_TYPES.map(async (type) => {
        pendingCounts[type] = await Registration.countDocuments({
          sentCampaigns: { $nin: [type] },
        });
      }),
      (async () => {
        pendingCounts["confirm_reminder"] = await Registration.countDocuments({
          "confirmation.confirmed": { $ne: true },
          sentCampaigns: { $nin: ["confirm_reminder"] },
        });
      })(),
      (async () => {
        // Último llamado: cuenta en vivo de no confirmados (re-enviable, sin dedup)
        pendingCounts["confirm_final"] = await Registration.countDocuments({
          "confirmation.confirmed": { $ne: true },
        });
      })(),
      (async () => {
        pendingCounts["speaker_slides"] = await SpeakerProfile.countDocuments({
          status: "accepted",
          sentSpeakerCampaigns: { $nin: ["speaker_slides"] },
        });
      })(),
      (async () => {
        pendingCounts["speaker_upload"] = await SpeakerProfile.countDocuments({
          status: "accepted",
          sentSpeakerCampaigns: { $nin: ["speaker_upload"] },
        });
      })(),
      (async () => {
        pendingCounts["volunteer_meeting"] = await VolunteerSubmission.countDocuments({
          approved: true,
          sentVolunteerCampaigns: { $nin: ["volunteer_meeting"] },
        });
      })(),
      (async () => {
        pendingCounts["volunteer_meeting_today"] = await VolunteerSubmission.countDocuments({
          approved: true,
          sentVolunteerCampaigns: { $nin: ["volunteer_meeting_today"] },
        });
      })(),
      (async () => {
        pendingCounts["volunteer_setup"] = await VolunteerSubmission.countDocuments({
          approved: true,
          sentVolunteerCampaigns: { $nin: ["volunteer_setup"] },
        });
      })(),
      (async () => {
        pendingCounts["volunteer_recording"] = await VolunteerSubmission.countDocuments({
          approved: true,
          sentVolunteerCampaigns: { $nin: ["volunteer_recording"] },
        });
      })(),
      (async () => {
        pendingCounts["speaker_rejection"] = await SpeakerProfile.countDocuments({
          status: "rejected",
          sentSpeakerCampaigns: { $nin: ["speaker_rejection"] },
        });
      })(),
    ]);

    return NextResponse.json({ campaigns, pendingCounts });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
