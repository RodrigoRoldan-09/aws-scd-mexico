import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SpeakerProfile } from "@/models/speaker-profile";
import { revalidatePublic, SPEAKERS_TAG, AGENDA_TAG } from "@/lib/data/revalidate";
import { createLog } from "@/lib/log";

// Public: single profile by slug
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();
    const { slug } = await params;
    const profile = await SpeakerProfile.findOne({ slug, isPublic: true }).lean();
    if (!profile) return Response.json({ error: "No encontrado" }, { status: 404 });
    return Response.json({ profile });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// Admin: partial update (isPublic, status, roomId, track…)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const { slug } = await params;
    const body = await request.json();

    const allowed = ["isPublic", "status", "roomId", "track", "speakerType", "scheduledAt", "sessionId", "talkTitleCard", "roleCard", "cardContentX", "cardContentY", "cardNameOffset", "cardTitleSize", "cardNameSize"] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if ("talkTitleCard" in body || "roleCard" in body || "cardContentX" in body || "cardContentY" in body || "cardNameOffset" in body || "cardTitleSize" in body || "cardNameSize" in body) {
      update.cardApproved = false;
      update.cardImageUrl = "";
    }

    if (Object.keys(update).length === 0) {
      return Response.json({ error: "Sin campos para actualizar" }, { status: 400 });
    }

    const profile = await SpeakerProfile.findOneAndUpdate({ slug }, update, { returnDocument: "after" });
    if (!profile) return Response.json({ error: "No encontrado" }, { status: 404 });

    revalidatePublic(SPEAKERS_TAG, AGENDA_TAG);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "SPEAKER_PROFILE_PATCHED",
      target: profile.name,
      targetId: profile._id.toString(),
      details: JSON.stringify(update),
    });

    return Response.json({ profile });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// Admin: update profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const { slug } = await params;
    const body = await request.json();
    const { name, role, tagline, company, companyLogo, bio, photo, social, talkTitle, talkAbstract, track, sessionId, submissionId, isPublic } = body;

    const profile = await SpeakerProfile.findOneAndUpdate(
      { slug },
      { name, role, tagline, company, companyLogo, bio, photo, social, talkTitle, talkAbstract, track, sessionId: sessionId || null, submissionId: submissionId || null, isPublic },
      { returnDocument: "after" },
    );

    if (!profile) return Response.json({ error: "No encontrado" }, { status: 404 });

    revalidatePublic(SPEAKERS_TAG, AGENDA_TAG);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "SPEAKER_PROFILE_UPDATED",
      target: profile.name,
      targetId: profile._id.toString(),
      details: slug,
    });

    return Response.json({ profile });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// Admin: delete profile
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const { slug } = await params;
    const profile = await SpeakerProfile.findOneAndDelete({ slug });

    if (!profile) return Response.json({ error: "No encontrado" }, { status: 404 });

    revalidatePublic(SPEAKERS_TAG, AGENDA_TAG);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "SPEAKER_PROFILE_DELETED",
      target: profile.name,
      targetId: profile._id.toString(),
    });

    return Response.json({ success: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
