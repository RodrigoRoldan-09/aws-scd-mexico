import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SpeakerProfile } from "@/models/speaker-profile";

// Admin: list ALL profiles (public and private)
export async function GET() {
  try {
    await requireAuth(["admin", "organizer"]);
    await connectDB();
    const profiles = await SpeakerProfile.find({})
      .select("name slug role tagline company companyLogo bio photo social talkTitle talkAbstract sessionType audienceLevel language track roomId submissionId isPublic status speakerType scheduledAt createdAt talkTitleCard roleCard cardContentX cardContentY cardNameOffset cardTitleSize cardNameSize cardApproved cardImageUrl")
      .sort({ name: 1 }).lean();
    return Response.json({ profiles });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
